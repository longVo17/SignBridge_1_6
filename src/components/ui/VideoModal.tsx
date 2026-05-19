import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

import { Sign } from '../../types/data.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { getVideoAsset } from '../../utils/videoMap';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIDEO_H = SCREEN_W * (9 / 16);

interface VideoModalProps {
  sign: Sign | null;
  visible: boolean;
  onClose: () => void;
}

export default function VideoModal({ sign, visible, onClose }: VideoModalProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const videoSource = sign ? getVideoAsset(sign.id) : null;
  const isLoaded = status?.isLoaded ?? false;
  const isPlaying = isLoaded && (status as any)?.isPlaying;
  const isBuffering = isLoaded && (status as any)?.isBuffering;
  const hasVideo = videoSource !== null;

  // ── Animate in ────────────────────────────────────────────────
  const handleShow = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = useCallback(() => {
    videoRef.current?.pauseAsync();
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true,
    }).start(onClose);
  }, [onClose, scaleAnim]);

  const togglePlay = async () => {
    if (!videoRef.current || !isLoaded) return;
    isPlaying
      ? await videoRef.current.pauseAsync()
      : await videoRef.current.playAsync();
  };

  const replay = async () => {
    if (!videoRef.current) return;
    await videoRef.current.replayAsync();
  };

  if (!sign) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={handleShow}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

              {/* ── Header ────────────────────────────────── */}
              <View style={styles.header}>
                <View style={styles.emojiWrap}>
                  <Text style={styles.emoji}>{sign.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{sign.title}</Text>
                  <View style={styles.pills}>
                    <Pill label={sign.category} color={COLORS.primary} />
                    <Pill label={sign.difficulty} color={getDiffColor(sign.difficulty)} />
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ── Video ─────────────────────────────────── */}
              <View style={styles.videoWrap}>
                {hasVideo ? (
                  <>
                    <Video
                      ref={videoRef}
                      source={videoSource}
                      style={styles.video}
                      resizeMode={ResizeMode.COVER}
                      isLooping
                      onPlaybackStatusUpdate={s => setStatus(s)}
                      shouldPlay={false}
                      useNativeControls={false}
                    />
                    {/* Buffering overlay */}
                    {isBuffering && (
                      <View style={styles.bufferOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                      </View>
                    )}
                    {/* Tap-to-play overlay when paused */}
                    {!isPlaying && !isBuffering && (
                      <TouchableOpacity style={styles.tapToPlay} onPress={togglePlay}>
                        <View style={styles.playCircle}>
                          <Text style={styles.bigPlayIcon}>▶</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  /* No video file yet — show emoji placeholder */
                  <View style={styles.noVideoBox}>
                    <Text style={styles.noVideoEmoji}>{sign.emoji}</Text>
                    <Text style={styles.noVideoTitle}>{sign.title}</Text>
                    <Text style={styles.noVideoHint}>
                      Thêm file:{'\n'}
                      <Text style={styles.noVideoPath}>assets/videos/{sign.id}.mp4</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* ── Controls ─────────────────────────────── */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={[styles.playBtn, isPlaying && styles.pauseBtn]}
                  onPress={togglePlay}
                  disabled={!hasVideo || !isLoaded}
                >
                  <Text style={styles.playBtnText}>
                    {isPlaying ? '⏸  Dừng' : '▶  Phát'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={replay}
                  disabled={!hasVideo}
                >
                  <Text style={styles.iconBtnText}>↺</Text>
                </TouchableOpacity>
              </View>

              {/* ── Description ───────────────────────────── */}
              <ScrollView
                style={styles.descWrap}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.descLabel}>📖 Cách thực hiện</Text>
                <Text style={styles.desc}>{sign.description}</Text>
              </ScrollView>

            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Sub-components ─────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '20', borderColor: color + '50' }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function getDiffColor(d: string) {
  switch (d) {
    case 'Easy':   return '#22C55E';
    case 'Medium': return '#F59E0B';
    case 'Hard':   return '#EF4444';
    default:       return COLORS.textSecondary;
  }
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    width: SCREEN_W - 32,
    maxHeight: SCREEN_H * 0.88,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  emojiWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 24 },
  title: { ...TYPOGRAPHY.headlineMedium, color: COLORS.text, fontSize: 20, lineHeight: 26 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1,
  },
  pillText: { ...TYPOGRAPHY.labelSmall, fontWeight: '600', fontSize: 10 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceDim,
    justifyContent: 'center', alignItems: 'center',
  },
  closeIcon: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },

  // Video
  videoWrap: {
    width: '100%',
    height: VIDEO_H,
    backgroundColor: '#111',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tapToPlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  bigPlayIcon: { fontSize: 28, color: COLORS.primary, marginLeft: 4 },

  // No video placeholder
  noVideoBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.sm,
  },
  noVideoEmoji: { fontSize: 56 },
  noVideoTitle: { ...TYPOGRAPHY.headlineMedium, color: '#fff', fontSize: 22 },
  noVideoHint: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 4,
  },
  noVideoPath: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  playBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pauseBtn: { backgroundColor: COLORS.textSecondary },
  playBtnText: { ...TYPOGRAPHY.labelLarge, color: '#FFF' },
  iconBtn: {
    width: 46, height: 46,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: { fontSize: 24, color: COLORS.text },

  // Description
  descWrap: {
    padding: SPACING.sm,
    maxHeight: 95,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  descLabel: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginBottom: 4 },
  desc: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, lineHeight: 20 },
});
