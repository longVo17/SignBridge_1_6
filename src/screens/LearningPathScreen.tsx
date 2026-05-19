import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { LearningPath } from '../types/data.types';
import { learningService } from '../services/learning.service';
import { useProgress } from '../hooks/useProgress';

export const LearningPathScreen = () => {
  const navigation = useNavigation<any>();
  const { progress, loading: progressLoading } = useProgress();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const fetchedPaths = await learningService.getLearningPaths();
        setPaths(fetchedPaths);
      } catch (err) {
        console.error("Failed to load learning paths", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []);

  if (loading || progressLoading) {
     return (
       <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
       </LinearGradient>
     )
  }

  const completedPathsCount = progress?.completedPaths?.length || 0;
  const totalPaths = paths.length;
  const overallPct = totalPaths > 0 ? Math.round((completedPathsCount / totalPaths) * 100) : 0;

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" delay={50} style={styles.header}>
          <View>
            <Text style={styles.title}>Learning Path</Text>
            <Text style={styles.subtitle}>{completedPathsCount} of {totalPaths} units completed</Text>
          </View>
          {/* XP Badge */}
          <BlurView intensity={80} tint="light" style={styles.xpBadge}>
            <Text style={styles.xpEmoji}>⭐</Text>
            <Text style={styles.xpText}>{progress?.totalXP || 0} XP</Text>
          </BlurView>
        </Animatable.View>

        {/* Overall Progress */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.overallProgressWrapper}>
          <BlurView intensity={85} tint="light" style={styles.overallProgressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Overall Completion</Text>
              <Text style={styles.progressPct}>{overallPct}%</Text>
            </View>
            <View style={styles.overallBarBg}>
              <LinearGradient
                colors={['#2DC7FF', '#00A3E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.overallBarFill, { width: `${overallPct}%` }]}
              />
            </View>
          </BlurView>
        </Animatable.View>

        {/* Level List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {paths.map((path, index) => {
            const isCompleted = progress?.completedPaths?.includes(path.id);
            // In a real app, unlock logic would be more complex. Here we just unlock the first uncompleted one.
            let isLocked = false;
            if (index > 0) {
               const prevPath = paths[index - 1];
               isLocked = !progress?.completedPaths?.includes(prevPath.id);
            }

            return (
            <Animatable.View
              key={path.id}
              animation="fadeInUp"
              delay={200 + index * 100}
              style={styles.levelWrapper}
            >
              {/* Connector line */}
              {index < paths.length - 1 && (
                <View style={[styles.connector, { backgroundColor: isLocked ? COLORS.surfaceDim : COLORS.primary, opacity: isLocked ? 0.3 : 0.25 }]} />
              )}

              <TouchableOpacity
                disabled={isLocked}
                activeOpacity={0.85}
                style={styles.levelCardTouch}
                onPress={() => navigation.navigate('Lesson', { pathId: path.id, pathTitle: path.title })}
              >
                <BlurView
                  intensity={isLocked ? 60 : 85}
                  tint="light"
                  style={[styles.levelCard, isLocked && styles.levelCardLocked]}
                >
                  {/* Left Icon */}
                  <View style={[styles.levelIconCircle, isLocked && styles.levelIconLocked]}>
                    {isLocked ? (
                      <Ionicons name="lock-closed" size={24} color={COLORS.textSecondary} />
                    ) : (
                      <Text style={styles.levelEmoji}>{path.icon}</Text>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.levelContent}>
                    <View style={styles.levelTop}>
                      <Text style={[styles.levelTitle, isLocked && styles.textLocked]}>
                        {path.title}
                      </Text>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                        </View>
                      )}
                      {isLocked && (
                        <View style={styles.lockedBadge}>
                          <Text style={styles.lockedBadgeText}>Locked</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.levelDesc}>{path.description}</Text>

                    {!isLocked && (
                      <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                          <LinearGradient
                            colors={['#2DC7FF', '#00A3E0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: isCompleted ? '100%' : '0%' }]}
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* XP */}
                  {!isLocked && (
                    <View style={styles.xpMini}>
                      <Text style={styles.xpMiniText}>+{path.totalXP}</Text>
                      <Text style={styles.xpMiniLabel}>XP</Text>
                    </View>
                  )}
                </BlurView>
              </TouchableOpacity>
            </Animatable.View>
          )})}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTL: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  blobBR: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  xpEmoji: { fontSize: 16, marginRight: 4 },
  xpText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
  },
  overallProgressWrapper: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  overallProgressCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.textSecondary,
  },
  progressPct: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
  },
  overallBarBg: {
    height: 8,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  levelWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    bottom: -SPACING.md,
    width: 3,
    height: SPACING.md,
    left: '50%',
    marginLeft: -1.5,
    zIndex: 0,
  },
  levelCardTouch: {
    width: '95%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.soft,
    zIndex: 1,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  levelCardLocked: {
    opacity: 0.65,
    borderColor: 'rgba(200,200,200,0.5)',
  },
  levelIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(45,199,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  levelIconLocked: {
    backgroundColor: 'rgba(100,100,100,0.08)',
  },
  levelEmoji: {
    fontSize: 26,
  },
  levelContent: {
    flex: 1,
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  levelTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
  textLocked: {
    color: COLORS.textSecondary,
  },
  completedBadge: {
    marginLeft: SPACING.xs,
  },
  lockedBadge: {
    backgroundColor: 'rgba(150,150,150,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
    marginLeft: SPACING.xs,
  },
  lockedBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  levelDesc: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  progressPctSmall: {
    ...TYPOGRAPHY.labelLarge,
    fontSize: 12,
    color: COLORS.primary,
    width: 32,
    textAlign: 'right',
  },
  xpMini: {
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  xpMiniText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 15,
  },
  xpMiniLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
});
