import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { useProgress } from '../hooks/useProgress';
import { learningService } from '../services/learning.service';
import { getSignsByCategory } from '../services/dictionary.service';
import { LearningPath, Lesson, Sign } from '../types/data.types';
import VideoModal from '../components/ui/VideoModal';

const { width, height } = Dimensions.get('window');

export const PracticeScreen = () => {
  const { progress } = useProgress();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [signsMap, setSignsMap] = useState<Record<string, Sign>>({});
  const [practiceQueue, setPracticeQueue] = useState<Sign[]>([]);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [confidence, setConfidence] = useState(85);
  const [loading, setLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  // 1. Load paths and dictionary map once
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Fetch all paths
        const allPaths = await learningService.getLearningPaths();
        setPaths(allPaths);

        // Fetch all dictionary signs
        const allSigns = await getSignsByCategory();
        const map: Record<string, Sign> = {};
        allSigns.forEach(s => {
          map[s.id] = s;
        });
        setSignsMap(map);

        if (allPaths.length > 0) {
          setSelectedPath(allPaths[0]);
        }
      } catch (err) {
        console.error('[PracticeScreen] Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 2. Fetch and compile lesson signs whenever selected path or signsMap changes
  useEffect(() => {
    if (!selectedPath || Object.keys(signsMap).length === 0) return;

    const fetchLessonsAndBuildQueue = async () => {
      try {
        setLoading(true);
        const fetchedLessons = await learningService.getLessonsForPath(selectedPath.id);
        
        // Compile signs list based on lessons
        const queue: Sign[] = fetchedLessons
          .map(l => signsMap[l.signId])
          .filter(Boolean);
        
        setPracticeQueue(queue);
        setCurrentSignIndex(0);
        setIsRecording(false);
      } catch (err) {
        console.error('[PracticeScreen] Failed to load path lessons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsAndBuildQueue();
  }, [selectedPath, signsMap]);

  // 3. Confidence value micro-animation effect during simulated AI recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setConfidence(72 + Math.floor(Math.random() * 26));
      }, 1000);
    } else {
      setConfidence(85);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Helper to check if a path is unlocked
  const isPathUnlocked = (path: LearningPath, index: number) => {
    if (index === 0) return true;
    const prevPath = paths[index - 1];
    return progress?.completedPaths?.includes(prevPath.id) || false;
  };

  // Helper to translate path titles
  const translateTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('vocab_1') || t.includes('part 1') && t.includes('vocab')) return 'Basic Vocabulary - Part 1';
    if (t.includes('vocab_2') || t.includes('part 2') && t.includes('vocab')) return 'Basic Vocabulary - Part 2';
    if (t.includes('vocab_3') || t.includes('part 3') && t.includes('vocab')) return 'Basic Vocabulary - Part 3';
    if (t.includes('intro') || t.includes('introduction')) return 'Introduction to ASL';
    if (t.includes('alphabet_1') || t.includes('alphabet') && t.includes('1')) return 'ASL Alphabet - Part 1';
    if (t.includes('alphabet_2') || t.includes('alphabet') && t.includes('2')) return 'ASL Alphabet - Part 2';
    if (t.includes('chào hỏi') || t.includes('greeting')) return 'Greetings & Meetings';
    if (t.includes('giao tiếp') || t.includes('essential')) return 'Essential Communication';
    if (t.includes('cuộc sống') || t.includes('daily')) return 'Daily Activities';
    if (t.includes('gia đình') || t.includes('family')) return 'Family & Friends';
    if (t.includes('số đếm') || t.includes('number')) return 'ASL Numbers';
    if (t.includes('màu sắc') || t.includes('colors')) return 'ASL Colors';
    return title;
  };

  const handleNext = () => {
    if (practiceQueue.length > 0) {
      setCurrentSignIndex(prev => (prev + 1) % practiceQueue.length);
    }
  };

  const currentSign = practiceQueue[currentSignIndex] || null;

  // Render loading state
  if (loading && Object.keys(signsMap).length === 0) {
    return (
      <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading practice materials...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.container}>
      <View style={styles.blobTop} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" delay={50} style={styles.header}>
          <Text style={styles.screenTitle}>AI Practice</Text>
          <View style={styles.scoreBadge}>
            <Ionicons name="trophy" size={14} color="#F59E0B" />
            <Text style={styles.scoreText}>{progress?.totalXP || 0} XP</Text>
          </View>
        </Animatable.View>

        {/* Dropdown Selector */}
        <Animatable.View animation="fadeInDown" delay={80} style={styles.selectorContainer}>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setIsSelectorOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.selectorLeft}>
              <View style={styles.selectorIconWrap}>
                <Ionicons name="ribbon-outline" size={16} color="#2DC7FF" />
              </View>
              <Text numberOfLines={1} style={styles.selectorTitle}>
                {selectedPath ? translateTitle(selectedPath.title) : 'Select Unit...'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Animatable.View>

        {loading ? (
          <View style={styles.innerLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.innerLoadingText}>Loading practice unit...</Text>
          </View>
        ) : practiceQueue.length === 0 ? (
          <View style={styles.innerLoading}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.textSecondary} />
            <Text style={styles.innerLoadingText}>No practice words in this unit.</Text>
          </View>
        ) : (
          <>
            {/* Top Half — Reference Video Card */}
            <Animatable.View animation="fadeInDown" delay={100} style={styles.topSection}>
              <View style={styles.videoCard}>
                <LinearGradient
                  colors={['rgba(45,199,255,0.08)', 'rgba(45,199,255,0.18)']}
                  style={styles.videoArea}
                >
                  {/* Target Sign Overlay */}
                  <View style={styles.targetOverlay}>
                    <Text style={styles.targetLabel}>TARGET SIGN</Text>
                    <Text style={styles.targetWord}>
                      "{currentSign ? currentSign.title : ''}"
                    </Text>
                  </View>

                  {/* Play Icon */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.playButtonWrapper}
                    onPress={() => currentSign && setVideoModalVisible(true)}
                  >
                    <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.playButton}>
                      <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.videoHint}>Tap to watch reference</Text>
                </LinearGradient>
              </View>
            </Animatable.View>

            {/* Bottom Half — AI Camera Feed */}
            <Animatable.View animation="fadeInUp" delay={200} style={styles.bottomSection}>
              <View style={styles.cameraCard}>
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
              </View>
            </Animatable.View>

            {/* Controls Bar */}
            <Animatable.View animation="slideInUp" delay={400} style={styles.controlsBar}>
              <View style={styles.controlsBlur}>
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

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => {
                    setIsRecording(false);
                    setCurrentSignIndex(0);
                  }}
                >
                  <Ionicons name="refresh" size={22} color={COLORS.textSecondary} />
                  <Text style={styles.skipText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </>
        )}
      </SafeAreaView>

      {/* Path Selection Dropdown Modal */}
      <Modal
        visible={isSelectorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectorOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSelectorOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Practice Unit</Text>
                  <TouchableOpacity onPress={() => setIsSelectorOpen(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={paths}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => {
                    const unlocked = isPathUnlocked(item, index);
                    const isCompleted = progress?.completedPaths?.includes(item.id);
                    const isSelected = selectedPath?.id === item.id;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.pathItem,
                          isSelected && styles.pathItemSelected,
                          !unlocked && styles.pathItemLocked,
                        ]}
                        disabled={!unlocked}
                        onPress={() => {
                          setSelectedPath(item);
                          setIsSelectorOpen(false);
                        }}
                      >
                        <View style={styles.pathItemLeft}>
                          <View style={[
                            styles.pathIconCircle,
                            isSelected && styles.pathIconCircleSelected,
                            !unlocked && styles.pathIconCircleLocked,
                          ]}>
                            <Text style={styles.pathIconText}>
                              {item.icon && item.icon !== 'star-outline' ? item.icon : '⭐'}
                            </Text>
                          </View>
                          <View style={styles.pathInfo}>
                            <Text style={[
                              styles.pathTitleText,
                              isSelected && styles.pathTitleTextSelected,
                              !unlocked && styles.pathTitleTextLocked,
                            ]}>
                              {translateTitle(item.title)}
                            </Text>
                            <Text style={styles.pathDescText} numberOfLines={1}>
                              {item.description}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pathItemRight}>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                          )}
                          {!isSelected && isCompleted && (
                            <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
                          )}
                          {!unlocked && (
                            <Ionicons name="lock-closed" size={18} color={COLORS.textSecondary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={styles.modalListContent}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Target Sign Reference Video Modal */}
      {currentSign && (
        <VideoModal
          sign={currentSign}
          visible={videoModalVisible}
          onClose={() => setVideoModalVisible(false)}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  innerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  innerLoadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
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
    borderColor: 'rgba(45, 199, 255, 0.15)',
    backgroundColor: '#ffffff',
    gap: 5,
  },
  scoreText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#F59E0B',
  },
  // Selector style
  selectorContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    backgroundColor: '#ffffff',
    ...SHADOWS.soft,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  selectorIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 199, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorTitle: {
    ...TYPOGRAPHY.labelLarge,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
  },
  // Top Reference Video
  topSection: {
    flex: 1.1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  videoCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    backgroundColor: '#ffffff',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(45, 199, 255, 0.1)',
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
    width: 66,
    height: 66,
    borderRadius: 33,
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
    flex: 1.1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  cameraCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    backgroundColor: '#ffffff',
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
    paddingTop: SPACING.xs,
    paddingBottom: 110,
  },
  controlsBlur: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    backgroundColor: '#ffffff',
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
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.pill,
    gap: SPACING.xs,
    ...SHADOWS.glass,
  },
  mainButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 14,
  },
  // Modal selector styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    maxWidth: 450,
    maxHeight: height * 0.75,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    ...SHADOWS.glass,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontSize: 18,
    color: COLORS.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalListContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  pathItemSelected: {
    borderColor: 'rgba(45, 199, 255, 0.3)',
    backgroundColor: 'rgba(45, 199, 255, 0.05)',
  },
  pathItemLocked: {
    opacity: 0.65,
    backgroundColor: COLORS.surfaceDim,
    borderColor: COLORS.border,
  },
  pathItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pathIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(45,199,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathIconCircleSelected: {
    backgroundColor: 'rgba(45,199,255,0.18)',
  },
  pathIconCircleLocked: {
    backgroundColor: 'rgba(120,120,120,0.1)',
  },
  pathIconText: {
    fontSize: 16,
  },
  pathInfo: {
    flex: 1,
  },
  pathTitleText: {
    ...TYPOGRAPHY.labelLarge,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  pathTitleTextSelected: {
    color: COLORS.primary,
  },
  pathTitleTextLocked: {
    color: COLORS.textSecondary,
  },
  pathDescText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  pathItemRight: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: SPACING.xs,
  },
});
