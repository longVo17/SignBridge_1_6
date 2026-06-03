import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProgressStore } from '../store/progressStore';
import { learningService } from '../services/learning.service';
import { notificationService } from '../services/notification.service';

const getLocalDateString = (dateInput?: string | Date | number): string => {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayLocalDateString = (dateInput?: string | Date | number): string => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
};

export const useProgress = () => {
  const { user } = useAuthStore();
  const {
    progress, status,
    setProgress, setStatus,
    addCompletedLesson, addCompletedPath,
    updateStreak, saveQuizScore,
  } = useProgressStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setStatus('idle');
      return;
    }

    const loadProgress = async () => {
      setLoading(true);
      setStatus('loading');
      try {
        // 6 second timeout for fetching progress
        let p = await Promise.race([
          learningService.getUserProgress(user.uid),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
        ]);
        if (!p) {
          // 6 second timeout for initializing progress
          p = await Promise.race([
            learningService.initUserProgress(user.uid),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 6000))
          ]);
        }

        // Robust streak check logic using local timezone calendar days
        const today = getLocalDateString();
        const lastPractice = getLocalDateString(p.lastPracticeDate);
        const yesterday = getYesterdayLocalDateString();

        if (lastPractice !== today) {
          if (lastPractice !== yesterday && p.streakDays > 0) {
            await learningService.updateStreak(user.uid, 0, p.lastPracticeDate);
            p.streakDays = 0;
          }
        }

        setProgress(p);
        setStatus('success');

        // Dynamically schedule/update daily streak reminder based on user's progress
        notificationService.scheduleStreakReminder(p.lastPracticeDate).catch(err => {
          console.warn("Failed to schedule streak reminder on progress load:", err);
        });
      } catch (err) {
        console.error('Failed to load user progress:', err);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'idle') {
      loadProgress();
    }
  }, [user, status]);

  const completeLesson = async (lessonId: string, pathId: string, xpReward: number) => {
    if (!user) return;
    try {
      await learningService.markLessonComplete(user.uid, lessonId, xpReward);
      addCompletedLesson(lessonId, xpReward);

      // Robust local-timezone streak check and update logic
      const today = getLocalDateString();
      const p = useProgressStore.getState().progress;
      if (p) {
        const lastPractice = getLocalDateString(p.lastPracticeDate);
        const yesterday = getYesterdayLocalDateString();
        const nowIso = new Date().toISOString();

        if (p.streakDays === 0) {
          // New/first streak
          const newStreak = 1;
          await learningService.updateStreak(user.uid, newStreak, nowIso);
          updateStreak(newStreak, nowIso);
        } else {
          if (lastPractice === today) {
            // Already practiced today, keep current streak but update lastPracticeDate
            await learningService.updateStreak(user.uid, p.streakDays, nowIso);
            updateStreak(p.streakDays, nowIso);
          } else if (lastPractice === yesterday) {
            // Continued streak
            const newStreak = p.streakDays + 1;
            await learningService.updateStreak(user.uid, newStreak, nowIso);
            updateStreak(newStreak, nowIso);
          } else {
            // Streak broken, start new streak at 1
            const newStreak = 1;
            await learningService.updateStreak(user.uid, newStreak, nowIso);
            updateStreak(newStreak, nowIso);
          }
        }

        // Reschedule streak reminder with updated activity timestamp
        notificationService.scheduleStreakReminder(nowIso).catch(err => {
          console.warn("Failed to schedule streak reminder after lesson complete:", err);
        });
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  const completePath = async (pathId: string) => {
    if (!user) return;
    try {
      await learningService.markPathComplete(user.uid, pathId);
      addCompletedPath(pathId);
    } catch (err) {
      console.error('Failed to complete path:', err);
    }
  };

  const recordQuizScore = async (lessonId: string, score: number) => {
    if (!user) return;
    try {
      await learningService.saveQuizScore(user.uid, lessonId, score);
      saveQuizScore(lessonId, score);
    } catch (err) {
      console.error('Failed to save quiz score:', err);
    }
  };

  return { progress, status, loading, completeLesson, completePath, recordQuizScore };
};
