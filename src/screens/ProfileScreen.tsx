import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuthStore } from '../store/authStore';
import { useProgress } from '../hooks/useProgress';
import { signOut } from '../services/auth.service';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const ACHIEVEMENTS_DATA = [
  { id: '1', icon: '🏆', label: 'First Sign', condition: (p: any) => p?.completedLessons?.length > 0 },
  { id: '2', icon: '🔥', label: '5-Day Streak', condition: (p: any) => p?.streakDays >= 5 },
  { id: '3', icon: '⭐', label: 'Quick Learner', condition: (p: any) => p?.totalXP >= 100 },
  { id: '4', icon: '🔒', label: 'Fluent', condition: (p: any) => p?.completedPaths?.length >= 5 },
];

type IconName = keyof typeof Ionicons.glyphMap;
const SETTINGS: { icon: IconName; label: string; color?: string; action?: string }[] = [
  { icon: 'person-outline', label: 'Account Settings' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'language-outline', label: 'Language' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'shield-outline', label: 'Privacy Policy' },
  { icon: 'log-out-outline', label: 'Log Out', color: COLORS.error, action: 'logout' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { progress } = useProgress();

  const handleLogout = async () => {
    try {
      await signOut();
      // AppNavigator listens to auth state changes and will switch to Auth stack automatically
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'No email';
  const initials = displayName.substring(0, 2).toUpperCase();

  const achievements = ACHIEVEMENTS_DATA.map(ach => ({
    ...ach,
    earned: ach.condition(progress)
  }));

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTop} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Profile Header */}
          <Animatable.View animation="fadeInDown" delay={50} style={styles.profileHeader}>
            <LinearGradient
              colors={['#2DC7FF', '#00A3E0']}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            </LinearGradient>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Stats Row */}
          <Animatable.View animation="fadeInUp" delay={150} style={styles.statsWrapper}>
            <BlurView intensity={85} tint="light" style={styles.statsCard}>
              {[
                { label: 'Lessons', value: (progress?.completedLessons?.length || 0).toString(), icon: '📚' },
                { label: 'Day Streak', value: (progress?.streakDays || 0).toString(), icon: '🔥' },
                { label: 'XP', value: (progress?.totalXP || 0).toString(), icon: '🤟' },
              ].map((stat, idx, arr) => (
                <View key={stat.label} style={[styles.statBox, idx < arr.length - 1 && styles.statBorderRight]}>
                  <Text style={styles.statEmoji}>{stat.icon}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </BlurView>
          </Animatable.View>

          {/* Achievements */}
          <Animatable.View animation="fadeInUp" delay={250}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
              {achievements.map((ach, index) => (
                <Animatable.View key={ach.id} animation="zoomIn" delay={300 + index * 80}>
                  <View style={[styles.achievementCard, !ach.earned && styles.achievementLocked]}>
                    <BlurView intensity={80} tint="light" style={styles.achievementBlur}>
                      <Text style={[styles.achievementIcon, !ach.earned && { opacity: 0.3 }]}>
                        {ach.icon}
                      </Text>
                      <Text style={[styles.achievementLabel, !ach.earned && { color: COLORS.textSecondary }]}>
                        {ach.label}
                      </Text>
                    </BlurView>
                  </View>
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>

          {/* Settings */}
          <Animatable.View animation="fadeInUp" delay={350}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <BlurView intensity={85} tint="light" style={styles.settingsCard}>
              {SETTINGS.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={item.action === 'logout' ? handleLogout : undefined}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.settingIconBg, item.color === COLORS.error && styles.settingIconError]}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.color || COLORS.primary}
                      />
                    </View>
                    <Text style={[styles.settingLabel, item.color && { color: item.color }]}>
                      {item.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                  {index < SETTINGS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </BlurView>
          </Animatable.View>

          <Text style={styles.versionText}>SignBridge v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glass,
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.primary,
    fontWeight: '700' as const,
  },
  profileName: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
  },
  profileEmail: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  editProfileBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45,199,255,0.08)',
  },
  editProfileText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
    fontSize: 13,
  },
  // Stats
  statsWrapper: {
    marginBottom: SPACING.xl,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statBorderRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(200,220,235,0.6)',
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.primary,
    fontSize: 22,
  },
  statLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  // Achievements
  achievementCard: {
    width: 90,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  achievementLocked: {
    opacity: 0.7,
  },
  achievementBlur: {
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  achievementIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  achievementLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  // Settings
  settingsCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
    marginBottom: SPACING.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,199,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingIconError: {
    backgroundColor: 'rgba(186,26,26,0.08)',
  },
  settingLabel: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.text,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(200,220,235,0.6)',
    marginHorizontal: SPACING.md,
  },
  versionText: {
    textAlign: 'center',
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.6,
    marginTop: SPACING.sm,
  },
});
