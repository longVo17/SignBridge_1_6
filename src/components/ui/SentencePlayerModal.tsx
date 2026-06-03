import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Sign } from '../../types/data.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { getVideoAsset } from '../../utils/videoMap';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.5;
const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.5];
const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.5: '0.5×',
  0.75: '0.75×',
  1.0: '1×',
  1.5: '1.5×',
};

interface SentencePlayerModalProps {
  visible: boolean;
  onClose: () => void;
  originalPhrase: string;
  matchedSigns: Sign[];
}

export default function SentencePlayerModal({
  visible,
  onClose,
  originalPhrase,
  matchedSigns,
}: SentencePlayerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);

  const videoRef = useRef<Video>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const wordScrollRef = useRef<ScrollView>(null);

  // Modal open animation
  const handleShow = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true,
    }).start(onClose);
  }, [onClose, scaleAnim]);

  // Center/Scroll to the active word in the timeline
  useEffect(() => {
    if (wordScrollRef.current && matchedSigns.length > 0) {
      // Approximate position based on item width + padding
      const itemWidth = 100; 
      const scrollPos = Math.max(0, currentIndex * itemWidth - SCREEN_W / 2 + itemWidth / 2);
      wordScrollRef.current.scrollTo({ x: scrollPos, animated: true });
    }
  }, [currentIndex, matchedSigns.length]);

  if (matchedSigns.length === 0) return null;

  const currentSign = matchedSigns[currentIndex];
  const localAsset = getVideoAsset(currentSign.id);
  const cloudUrl = currentSign.videoURL || undefined;
  const videoSource = cloudUrl ? { uri: cloudUrl } : localAsset ?? null;
  const hasVideo = videoSource !== null;

  const isLoaded = videoStatus?.isLoaded ?? false;
  const isBuffering = isLoaded && (videoStatus as any)?.isBuffering && !isPlaying;

  // Handle Play/Pause
  const togglePlay = async () => {
    if (!videoRef.current || !isLoaded) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  // Replay active word
  const replayCurrentWord = async () => {
    if (!videoRef.current) return;
    await videoRef.current.replayAsync();
    setIsPlaying(true);
  };

  // Jump to specific word index
  const selectWordIndex = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
  };

  // Handle previous/next buttons
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < matchedSigns.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    } else {
      // Loop back to start or stop
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  // Handle speed changes
  const changeSpeed = async (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    if (videoRef.current && isLoaded) {
      await videoRef.current.setRateAsync(newSpeed, true);
    }
  };

  // Handle video status change (tracks finish event for auto-advance)
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setVideoStatus(status);
    if (status.isLoaded) {
      if (status.didJustFinish) {
        if (autoplay) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

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
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconWrap}>
                  <Ionicons name="film-outline" size={22} color="#2DC7FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Sentence Visualizer</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>"{originalPhrase}"</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Progress capsules timeline */}
              <View style={styles.timelineWrap}>
                <ScrollView
                  ref={wordScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timelineScroll}
                >
                  {matchedSigns.map((sign, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <View key={sign.id} style={styles.capsuleWrapper}>
                        <TouchableOpacity
                          style={[styles.wordCapsule, isActive && styles.wordCapsuleActive]}
                          onPress={() => selectWordIndex(idx)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.wordText, isActive && styles.wordTextActive]}>
                            {sign.title}
                          </Text>
                        </TouchableOpacity>
                        {idx < matchedSigns.length - 1 && (
                          <Ionicons name="arrow-forward" size={14} color="#9CA3AF" style={{ marginHorizontal: 4 }} />
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Video Player */}
              <View style={styles.playerWrap}>
                {hasVideo ? (
                  <View style={styles.videoContainer}>
                    <Video
                      ref={videoRef}
                      source={videoSource}
                      style={styles.video}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={isPlaying}
                      isLooping={false}
                      rate={speed}
                      shouldCorrectPitch={true}
                      useNativeControls={false}
                      onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    />

                    {isBuffering && (
                      <View style={styles.loadingLayer}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                      </View>
                    )}

                    {/* Sign Title Indicator Overlay */}
                    <View style={styles.signIndicator}>
                      <Text style={styles.indicatorText}>{currentIndex + 1}. {currentSign.title}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noVideo}>
                    <Ionicons name="videocam-off-outline" size={44} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.noVideoText}>No sign video for "{currentSign.title}"</Text>
                  </View>
                )}
              </View>

              {/* Control panel */}
              <View style={styles.controlPanel}>
                
                {/* Secondary toggles (Autoplay, replay) */}
                <View style={styles.subTogglesRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, autoplay && styles.toggleBtnActive]}
                    onPress={() => setAutoplay(!autoplay)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="swap-horizontal" size={16} color={autoplay ? '#FFFFFF' : COLORS.primary} />
                    <Text style={[styles.toggleBtnText, autoplay && styles.toggleBtnTextActive]}>
                      Autoplay {autoplay ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={replayCurrentWord}
                    disabled={!hasVideo}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh" size={16} color={COLORS.primary} />
                    <Text style={styles.toggleBtnText}>Replay Word</Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Nav Controls */}
                <View style={styles.primaryControls}>
                  <TouchableOpacity
                    style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                    onPress={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    <Ionicons name="play-back" size={20} color={currentIndex === 0 ? '#9CA3AF' : '#1F2937'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playPauseBtn}
                    onPress={togglePlay}
                    disabled={!hasVideo || !isLoaded}
                  >
                    <LinearGradient
                      colors={isPlaying ? ['#FF6B6B', '#E85D5D'] : ['#2DC7FF', '#00A3E0']}
                      style={styles.playPauseGradient}
                    >
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={handleNext}
                  >
                    <Ionicons name="play-forward" size={20} color="#1F2937" />
                  </TouchableOpacity>
                </View>

                {/* Speed Controls */}
                <View style={styles.speedRow}>
                  <Text style={styles.speedLabel}>Speed:</Text>
                  <View style={styles.speedPills}>
                    {SPEED_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.speedPill, speed === opt && styles.speedPillActive]}
                        onPress={() => changeSpeed(opt)}
                      >
                        <Text style={[styles.speedPillText, speed === opt && styles.speedPillTextActive]}>
                          {SPEED_LABELS[opt]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              </View>

            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    width: SCREEN_W - 32,
    maxHeight: SCREEN_H * 0.9,
    overflow: 'hidden',
    ...SHADOWS.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(45,199,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  timelineWrap: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFDFD',
  },
  timelineScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  capsuleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  wordCapsuleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  wordTextActive: {
    color: '#FFFFFF',
  },
  playerWrap: {
    height: SCREEN_W * 0.55,
    backgroundColor: '#0D1117',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  signIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noVideoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
    textAlign: 'center',
  },
  controlPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  subTogglesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(45,199,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45,199,255,0.15)',
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  primaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  playPauseBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  playPauseGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  speedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  speedPills: {
    flexDirection: 'row',
    gap: 6,
  },
  speedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  speedPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  speedPillTextActive: {
    color: '#FFFFFF',
  },
});
