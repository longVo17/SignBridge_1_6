import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme/theme';
import { Lesson, Sign } from '../types/data.types';
import { learningService } from '../services/learning.service';
import { getSignById } from '../services/dictionary.service';
import { useProgress } from '../hooks/useProgress';
import FlashCard from '../components/lesson/FlashCard';
import QuizCard, { QuizQuestion } from '../components/lesson/QuizCard';
import LessonComplete from '../components/lesson/LessonComplete';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'learn' | 'quiz' | 'complete';

// ─── Intro Reading Slides ─────────────────────────────────────────────────────
const INTRO_SLIDES = [
  {
    title: 'What is ASL?',
    emoji: '🤟',
    color: '#2DC7FF',
    sections: [
      {
        heading: 'American Sign Language',
        text: 'ASL (American Sign Language) is a complete, natural language that uses hand shapes, movements, facial expressions, and body posture instead of spoken words. It is the primary language of Deaf and hard-of-hearing communities in the United States and parts of Canada.',
      },
      {
        heading: 'A Visual Language',
        text: 'Unlike spoken languages which use sound, ASL is entirely visual. Signers use space in front of their bodies as a "canvas" to communicate. It has its own grammar, vocabulary, and syntax — completely different from English.',
      },
      {
        heading: 'Why Learn ASL?',
        text: 'Learning ASL connects you with 500,000+ native signers. It opens career opportunities in education, healthcare, and interpretation — and most importantly, it builds bridges between hearing and Deaf communities.',
      },
    ],
  },
  {
    title: 'How ASL Sentences Work',
    emoji: '💬',
    color: '#7C3AED',
    sections: [
      {
        heading: 'Topic-Comment Structure',
        text: 'ASL typically uses a Topic-Comment sentence structure. You introduce the topic first, then make a statement about it. For example: "STORE I GO" means "I am going to the store." The topic (STORE) comes first.',
      },
      {
        heading: 'Time Comes First',
        text: 'Time markers are signed at the beginning of a sentence. Instead of "I went to school yesterday", ASL signs: "YESTERDAY SCHOOL I GO-THERE". Time context sets the scene for everything that follows.',
      },
      {
        heading: 'Facial Expressions Matter',
        text: 'Facial expressions are grammar in ASL — not just emotion. Raised eyebrows signal a yes/no question. Furrowed brows indicate a WH-question (who, what, where). Without the correct expression, the meaning changes completely.',
      },
    ],
  },
  {
    title: 'The ASL Alphabet & Its Uses',
    emoji: '🔤',
    color: '#059669',
    sections: [
      {
        heading: 'Finger-Spelling',
        text: 'The ASL manual alphabet (A–Z) lets you spell out words letter by letter. This is called finger-spelling. It is used for proper names, technical terms, or any word that has no established sign — like a person\'s name or a place.',
      },
      {
        heading: '26 Handshapes',
        text: 'Each of the 26 letters of the English alphabet has a unique handshape in ASL. Most are one-handed (held with your dominant hand). Two letters — J and Z — also include a movement component to trace the letter shape in the air.',
      },
      {
        heading: 'The Foundation of Learning',
        text: 'Mastering the ASL alphabet is essential for every ASL learner. It lets you communicate any word immediately, even if you don\'t know its sign. You will learn all 26 handshapes in the Alphabet lessons of this app.',
      },
    ],
  },
];

// ─── Quiz helpers ─────────────────────────────────────────────────────────────
function buildQuizOptions(correct: Sign, allSigns: Sign[]): Sign[] {
  // Get wrong options from the same signs pool (different id)
  const pool = allSigns.filter(s => s.id !== correct.id);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [correct, ...shuffled].sort(() => Math.random() - 0.5);
}

function buildQuizQuestions(lessons: Lesson[], signsMap: Record<string, Sign>): QuizQuestion[] {
  const allSigns = Object.values(signsMap);
  return lessons
    .map(lesson => {
      const sign = signsMap[lesson.signId];
      if (!sign) return null;
      return {
        sign,
        options: buildQuizOptions(sign, allSigns.length >= 4 ? allSigns : lessons.map(l => signsMap[l.signId]).filter(Boolean) as Sign[]),
      };
    })
    .filter(Boolean) as QuizQuestion[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LessonScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { pathId, pathTitle } = route.params || {};

  const isIntro = pathId === 'intro';
  const { completeLesson, completePath, recordQuizScore, progress } = useProgress();

  // Data state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [signsMap, setSignsMap] = useState<Record<string, Sign>>({});
  const [loading, setLoading] = useState(true);

  // Phase state machine
  const [phase, setPhase] = useState<Phase>('learn');
  const [learnIndex, setLearnIndex] = useState(0);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  // Exit warn dialog
  const handleExit = useCallback(() => {
    Alert.alert(
      "Exit Lesson?",
      "Your progress will not be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
  }, [navigation]);

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pathId) { setLoading(false); return; }

    (async () => {
      try {
        const fetchedLessons = await learningService.getLessonsForPath(pathId);
        // Study all lessons in the path (e.g. 13 letters for split ASL Alphabet, 3-7 for others)
        setLessons(fetchedLessons);

        const map: Record<string, Sign> = {};
        await Promise.all(
          fetchedLessons.map(async (lesson: Lesson) => {
            const sign = await getSignById(lesson.signId);
            if (sign) map[lesson.signId] = sign;
          })
        );
        setSignsMap(map);
      } catch (err) {
        console.error('LessonScreen load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pathId]);

  // ── Phase: Learn handlers ─────────────────────────────────────────────────
  const handleLearnNext = useCallback(async () => {
    if (isIntro) {
      // Intro path: advance slides, no quiz
      if (learnIndex < INTRO_SLIDES.length - 1) {
        setLearnIndex(prev => prev + 1);
      } else {
        // Mark all intro lessons complete
        let earnedXP = 0;
        for (const lesson of lessons) {
          const alreadyDone = progress?.completedLessons?.includes(lesson.id);
          if (!alreadyDone) {
            await completeLesson(lesson.id, pathId, 30);
            earnedXP += 30;
          }
        }
        await completePath(pathId);
        setXpEarned(earnedXP);
        setPhase('complete');
      }
      return;
    }
    if (learnIndex < lessons.length - 1) {
      setLearnIndex(prev => prev + 1);
    } else {
      // Build quiz questions and transition
      const questions = buildQuizQuestions(lessons, signsMap);
      setQuizQuestions(questions);
      setQuizIndex(0);
      setCorrectCount(0);
      setPhase('quiz');
    }
  }, [learnIndex, lessons, signsMap, isIntro, progress, completeLesson, completePath, pathId]);

  // handleOpenVideo removed — FlashCard handles video inline

  // ── Phase: Quiz handlers ──────────────────────────────────────────────────
  const handleQuizAnswer = useCallback(async (isCorrect: boolean) => {
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    if (quizIndex < quizQuestions.length - 1) {
      setCorrectCount(newCorrect);
      setQuizIndex(prev => prev + 1);
    } else {
      // Quiz finished — save score and mark lessons complete
      const finalCorrect = newCorrect;
      const scorePercent = Math.round((finalCorrect / quizQuestions.length) * 100);

      setCorrectCount(finalCorrect);

      let earnedXP = 0;
      for (const lesson of lessons) {
        const alreadyDone = progress?.completedLessons?.includes(lesson.id);
        if (!alreadyDone) {
          await completeLesson(lesson.id, pathId, lesson.xpReward);
          earnedXP += lesson.xpReward;
        }
      }

      // Save quiz scores per-lesson (use pathId as key)
      await recordQuizScore(pathId, scorePercent);

      // Mark path complete if all lessons done
      const allDone = lessons.every(l => progress?.completedLessons?.includes(l.id) || true);
      if (allDone) await completePath(pathId);

      setXpEarned(earnedXP);
      setPhase('complete');
    }
  }, [correctCount, quizIndex, quizQuestions.length, lessons, pathId, progress, completeLesson, recordQuizScore, completePath]);

  // ── Phase: Complete handlers ───────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRetakeQuiz = useCallback(() => {
    const questions = buildQuizQuestions(lessons, signsMap);
    setQuizQuestions(questions);
    setQuizIndex(0);
    setCorrectCount(0);
    setPhase('quiz');
  }, [lessons, signsMap]);

  // ── Progress bar ───────────────────────────────────────────────────────────
  const getProgressPercent = () => {
    const total = isIntro ? INTRO_SLIDES.length : lessons.length;
    if (phase === 'learn') return ((learnIndex + 1) / total) * (isIntro ? 100 : 50);
    if (phase === 'quiz')  return 50 + ((quizIndex + 1) / (quizQuestions.length || 1)) * 50;
    return 100;
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </LinearGradient>
    );
  }

  if (lessons.length === 0) {
    return (
      <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No lessons found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const currentSign = signsMap[lessons[learnIndex]?.signId];

  return (
    <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>

          {/* Progress bar: 0–50% = learn, 50–100% = quiz */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={phase === 'complete' ? ['#22C55E', '#16A34A'] : ['#2DC7FF', '#00A3E0']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${getProgressPercent()}%` }]}
              />
            </View>
                      {/* Phase label */}
            <Text style={styles.phaseLabel}>
              {isIntro
                ? `${learnIndex + 1} of ${INTRO_SLIDES.length}`
                : phase === 'learn'
                ? `Learn ${learnIndex + 1}/${lessons.length}`
                : phase === 'quiz'
                ? `Quiz ${quizIndex + 1}/${quizQuestions.length}`
                : 'Complete!'}
            </Text>
          </View>
        </View>

        {/* ── Main Content ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
                    {/* ── Intro Reading Mode ── */}
          {isIntro && phase === 'learn' && (() => {
            const slide = INTRO_SLIDES[learnIndex];
            return (
              <View style={styles.introCard}>
                <View style={[styles.introEmojiWrap, { backgroundColor: slide.color + '18' }]}>
                  <Text style={styles.introEmoji}>{slide.emoji}</Text>
                </View>
                <Text style={[styles.introCardTitle, { color: slide.color }]}>{slide.title}</Text>
                {slide.sections.map((sec, idx) => (
                  <View key={idx} style={styles.introSection}>
                    <View style={[styles.introSectionBar, { backgroundColor: slide.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.introSectionHeading}>{sec.heading}</Text>
                      <Text style={styles.introSectionText}>{sec.text}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.introNextBtn, { backgroundColor: slide.color }]}
                  onPress={handleLearnNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.introNextBtnText}>
                    {learnIndex < INTRO_SLIDES.length - 1 ? 'Next →' : 'Finish Introduction ✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          {/* ── Regular Lesson (FlashCard) ── */}
          {!isIntro && phase === 'learn' && currentSign && (
            <FlashCard
              sign={currentSign}
              lessonIndex={learnIndex}
              totalLessons={lessons.length}
              onNext={handleLearnNext}
            />
          )}

          {phase === 'quiz' && quizQuestions.length > 0 && (
            <QuizCard
              question={quizQuestions[quizIndex]}
              questionIndex={quizIndex}
              totalQuestions={quizQuestions.length}
              onAnswer={handleQuizAnswer}
            />
          )}

          {phase === 'complete' && (
            <LessonComplete
              pathTitle={pathTitle || 'Lesson'}
              totalLessons={lessons.length}
              xpEarned={xpEarned}
              correctAnswers={correctCount}
              totalQuestions={quizQuestions.length}
              streakDays={progress?.streakDays || 0}
              onContinue={handleContinue}
              onRetakeQuiz={handleRetakeQuiz}
            />
          )}
        </ScrollView>
      </SafeAreaView>

    </LinearGradient>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTL: {
    position: 'absolute', top: -80, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(45,199,255,0.1)',
  },
  blobBR: {
    position: 'absolute', bottom: -60, right: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(45,199,255,0.07)',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  backLink: { marginTop: SPACING.md },
  backLinkText: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  closeBtn: { padding: 4 },
  progressContainer: { flex: 1 },
  progressBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  phaseLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // ── Intro Slide Styles ────────────────────────────────────────────────────
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(45,199,255,0.12)',
    ...SHADOWS.soft,
  },
  introEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  introEmoji: {
    fontSize: 36,
  },
  introCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: -0.3,
  },
  introSection: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  introSectionBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginTop: 2,
  },
  introSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  introSectionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  introNextBtn: {
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.glass,
  },
  introNextBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
