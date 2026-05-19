import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const SIGNS_QUEUE = ['Hello', 'Thank You', 'Please', 'Yes', 'No'];

export const PracticeScreen = () => {
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [confidence, setConfidence] = useState(85);

  const handleNext = () => {
    setCurrentSignIndex(prev => (prev + 1) % SIGNS_QUEUE.length);
  };

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <View style={styles.blobTop} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" delay={50} style={styles.header}>
          <Text style={styles.screenTitle}>AI Practice</Text>
          <BlurView intensity={80} tint="light" style={styles.scoreBadge}>
            <Ionicons name="trophy" size={14} color="#F59E0B" />
            <Text style={styles.scoreText}>240 pts</Text>
          </BlurView>
        </Animatable.View>

        {/* Top Half — Reference Video */}
        <Animatable.View animation="fadeInDown" delay={100} style={styles.topSection}>
          <BlurView intensity={85} tint="light" style={styles.videoCard}>
            <LinearGradient
              colors={['rgba(45,199,255,0.08)', 'rgba(45,199,255,0.18)']}
              style={styles.videoArea}
            >
              {/* Target Sign Overlay */}
              <View style={styles.targetOverlay}>
                <Text style={styles.targetLabel}>TARGET SIGN</Text>
                <Text style={styles.targetWord}>"{SIGNS_QUEUE[currentSignIndex]}"</Text>
              </View>

              {/* Play Icon */}
              <TouchableOpacity activeOpacity={0.85} style={styles.playButtonWrapper}>
                <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.playButton}>
                  <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.videoHint}>Tap to watch reference</Text>
            </LinearGradient>
          </BlurView>
        </Animatable.View>

        {/* Bottom Half — AI Camera Feed */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.bottomSection}>
          <BlurView intensity={85} tint="light" style={styles.cameraCard}>
            {/* Camera Simulated Feed */}
            <View style={styles.cameraSimulated}>
              <LinearGradient
                colors={['#1A2A3A', '#0F1A28']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.cameraHint}>📷  Live AI Camera Feed</Text>

              {/* Bounding box mock */}
              <View style={styles.boundingBox}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>

              {/* Confidence Chip */}
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                style={styles.confidenceChip}
              >
                <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.confidenceGradient}>
                  <Text style={styles.confLabel}>CONFIDENCE</Text>
                  <Text style={styles.confValue}>{confidence}%</Text>
                </LinearGradient>
              </Animatable.View>
            </View>
          </BlurView>
        </Animatable.View>

        {/* Controls */}
        <Animatable.View animation="slideInUp" delay={400} style={styles.controlsBar}>
          <BlurView intensity={90} tint="light" style={styles.controlsBlur}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
              <Ionicons name="play-skip-forward" size={22} color={COLORS.textSecondary} />
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsRecording(!isRecording)}
            >
              <LinearGradient
                colors={isRecording ? ['#EF4444', '#DC2626'] : ['#2DC7FF', '#00A3E0']}
                style={styles.mainButton}
              >
                <Ionicons name={isRecording ? 'stop' : 'camera'} size={24} color="#FFFFFF" />
                <Text style={styles.mainButtonText}>{isRecording ? 'Stop' : 'Start Practice'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn}>
              <Ionicons name="refresh" size={22} color={COLORS.textSecondary} />
              <Text style={styles.skipText}>Reset</Text>
            </TouchableOpacity>
          </BlurView>
        </Animatable.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(45,199,255,0.12)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  screenTitle: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.text,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    gap: 5,
  },
  scoreText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#F59E0B',
  },
  // Top Reference Video
  topSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  videoCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  targetWord: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontSize: 20,
  },
  playButtonWrapper: {
    borderRadius: 35,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoHint: {
    position: 'absolute',
    bottom: SPACING.md,
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Bottom Camera
  bottomSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  cameraCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  cameraSimulated: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
  },
  cameraHint: {
    ...TYPOGRAPHY.bodyMedium,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  // Bounding box with corner markers
  boundingBox: {
    position: 'absolute',
    width: 140,
    height: 160,
    justifyContent: 'space-between',
  },
  corner: {
    width: 20,
    height: 20,
    borderColor: '#2DC7FF',
    position: 'absolute',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  confidenceChip: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  confidenceGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  confLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8,
  },
  confValue: {
    ...TYPOGRAPHY.headlineMedium,
    color: '#FFFFFF',
    fontSize: 20,
  },
  // Controls bar
  controlsBar: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  controlsBlur: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    ...SHADOWS.soft,
  },
  skipBtn: {
    alignItems: 'center',
    width: 52,
  },
  skipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    gap: SPACING.xs,
    ...SHADOWS.glass,
  },
  mainButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
