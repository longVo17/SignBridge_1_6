import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { useProgress } from '../hooks/useProgress';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: '1', icon: 'videocam' as const, label: 'AI Practice', color: '#2DC7FF', bg: 'rgba(45,199,255,0.12)', screen: 'Practice' },
  { id: '2', icon: 'book' as const, label: 'Dictionary', color: '#00B4F5', bg: 'rgba(0,180,245,0.12)', screen: 'Dictionary' },
  { id: '3', icon: 'map' as const, label: 'Learning Path', color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', screen: 'Learn' },
  { id: '4', icon: 'language' as const, label: 'Translation', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', screen: 'Translation' },
];

const DAILY_SIGNS = [
  { id: '1', emoji: '👋', word: 'Hello', category: 'Greetings' },
  { id: '2', emoji: '🙏', word: 'Thank You', category: 'Polite' },
  { id: '3', emoji: '✌️', word: 'Peace', category: 'Basics' },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { progress } = useProgress();

  const streak = progress?.streakDays || 0;
  const xp = progress?.totalXP || 0;
  // A simple level calculation: every 100 XP is a level.
  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const progressPercent = (xp % 100);

  return (
    <LinearGradient
      colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']}
      style={styles.container}
    >
      {/* Decorative blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobRight} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" delay={50} style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>{user?.email ? user.email.split('@')[0] : 'Explorer'} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <LinearGradient
                colors={['#2DC7FF', '#00A3E0']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={22} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          {/* Progress Card */}
          <Animatable.View animation="fadeInUp" delay={150}>
            <BlurView intensity={85} tint="light" style={styles.progressCard}>
              <View style={styles.progressCardInner}>
                <View style={styles.progressTop}>
                  <View>
                    <Text style={styles.progressTitle}>Level {level}</Text>
                    <Text style={styles.progressSubtitle}>{xp} Total XP — {xpToNextLevel} to next lvl</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakText}>{streak} days</Text>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={['#2DC7FF', '#00A3E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Learn')}
                >
                  <LinearGradient
                    colors={['#2DC7FF', '#00A3E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButton}
                  >
                    <Text style={styles.continueButtonText}>Continue Learning</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animatable.View>

          {/* Quick Actions */}
          <Animatable.View animation="fadeInUp" delay={250}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action, index) => (
                <Animatable.View
                  key={action.id}
                  animation="zoomIn"
                  delay={300 + index * 80}
                  style={styles.actionCardWrapper}
                >
                  <TouchableOpacity
                    style={styles.actionCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(action.screen)}
                  >
                    <BlurView intensity={70} tint="light" style={styles.actionBlur}>
                      <View style={[styles.actionIconCircle, { backgroundColor: action.bg }]}>
                        <Ionicons name={action.icon} size={26} color={action.color} />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </BlurView>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Daily Signs */}
          <Animatable.View animation="fadeInUp" delay={500}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Signs</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DAILY_SIGNS.map((sign, index) => (
                <Animatable.View key={sign.id} animation="fadeInRight" delay={550 + index * 100}>
                  <TouchableOpacity style={styles.signCard} activeOpacity={0.85}>
                    <BlurView intensity={80} tint="light" style={styles.signBlur}>
                      <Text style={styles.signEmoji}>{sign.emoji}</Text>
                      <Text style={styles.signWord}>{sign.word}</Text>
                      <View style={styles.signCategoryBadge}>
                        <Text style={styles.signCategoryText}>{sign.category}</Text>
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -100,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  blobRight: {
    position: 'absolute',
    top: 200,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  greeting: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  userName: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
  },
  profileAvatar: {
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Progress Card
  progressCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.glass,
  },
  progressCardInner: {
    padding: SPACING.lg,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  progressTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
  },
  progressSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,150,0,0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#F97316',
    fontSize: 13,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderRadius: BORDER_RADIUS.pill,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.pill,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.glass,
  },
  continueButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 15,
  },
  // Section
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  seeAll: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 13,
  },
  // Quick Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs / 2,
    marginBottom: SPACING.sm,
  },
  actionCardWrapper: {
    width: '50%',
    padding: SPACING.xs / 2,
    marginBottom: SPACING.sm,
  },
  actionCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  actionBlur: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    textAlign: 'center',
  },
  // Daily Signs
  signCard: {
    width: 130,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  signBlur: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  signEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  signWord: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    marginBottom: 6,
  },
  signCategoryBadge: {
    backgroundColor: 'rgba(45,199,255,0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  signCategoryText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 11,
  },
});
