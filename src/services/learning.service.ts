import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, increment, arrayUnion } from 'firebase/firestore';
import { LearningPath, Lesson, UserProgress } from '../types/data.types';

export const learningService = {
  getLearningPaths: async (): Promise<LearningPath[]> => {
    try {
      const pathsRef = collection(db, 'learningPaths');
      const q = query(pathsRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as LearningPath);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      throw error;
    }
  },

  getLessonsForPath: async (pathId: string): Promise<Lesson[]> => {
    try {
      const lessonsRef = collection(db, 'learningPaths', pathId, 'lessons');
      const q = query(lessonsRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Lesson);
    } catch (error) {
      console.error(`Error fetching lessons for path ${pathId}:`, error);
      throw error;
    }
  },

  getUserProgress: async (uid: string): Promise<UserProgress | null> => {
    try {
      const progressRef = doc(db, 'userProgress', uid);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        return progressDoc.data() as UserProgress;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching progress for user ${uid}:`, error);
      throw error;
    }
  },

  initUserProgress: async (uid: string): Promise<UserProgress> => {
    try {
      const progressRef = doc(db, 'userProgress', uid);
      const newProgress: UserProgress = {
        uid,
        completedLessons: [],
        completedPaths: [],
        totalXP: 0,
        streakDays: 0,
        lastPracticeDate: new Date().toISOString(),
      };
      await setDoc(progressRef, newProgress);
      return newProgress;
    } catch (error) {
      console.error(`Error init progress for user ${uid}:`, error);
      throw error;
    }
  },

  markLessonComplete: async (uid: string, lessonId: string, xpReward: number): Promise<void> => {
    try {
      const progressRef = doc(db, 'userProgress', uid);
      const now = new Date().toISOString();

      await updateDoc(progressRef, {
        completedLessons: arrayUnion(lessonId),
        totalXP: increment(xpReward),
        lastPracticeDate: now,
      });
    } catch (error) {
      console.error(`Error marking lesson ${lessonId} complete:`, error);
      throw error;
    }
  },

  markPathComplete: async (uid: string, pathId: string): Promise<void> => {
    try {
      const progressRef = doc(db, 'userProgress', uid);
      await updateDoc(progressRef, {
        completedPaths: arrayUnion(pathId),
      });
    } catch (error) {
      console.error(`Error marking path ${pathId} complete:`, error);
      throw error;
    }
  },

  updateStreak: async (uid: string, newStreak: number, lastDate: string): Promise<void> => {
    try {
      const progressRef = doc(db, 'userProgress', uid);
      await updateDoc(progressRef, {
        streakDays: newStreak,
        lastPracticeDate: lastDate
      });
    } catch (error) {
      console.error(`Error updating streak for user ${uid}:`, error);
      throw error;
    }
  }
};
