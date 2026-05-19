import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { Lesson, Sign } from '../types/data.types';
import { learningService } from '../services/learning.service';
import { dictionaryService } from '../services/dictionary.service';
import { useProgress } from '../hooks/useProgress';
import VideoModal from '../components/ui/VideoModal';

export const LessonScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { pathId, pathTitle } = route.params || {};

  const { completeLesson, completePath, progress } = useProgress();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [signs, setSigns] = useState<Record<string, Sign>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // VideoModal state
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentSignTitle, setCurrentSignTitle] = useState('');

  useEffect(() => {
    if (!pathId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const fetchedLessons = await learningService.getLessonsForPath(pathId);
        setLessons(fetchedLessons);

        // Fetch signs for all lessons
        const signData: Record<string, Sign> = {};
        for (const lesson of fetchedLessons) {
           const sign = await dictionaryService.getSignById(lesson.signId);
           if (sign) {
               signData[lesson.signId] = sign;
           }
        }
        setSigns(signData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pathId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (lessons.length === 0) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontFamily: 'Inter', fontSize: 16 }}>No lessons found for this path.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                <Text style={{ color: COLORS.primary, fontFamily: 'Poppins-Medium' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
      )
  }

  const currentLesson = lessons[currentIndex];
  const currentSign = signs[currentLesson?.signId];
  const isCompleted = progress?.completedLessons.includes(currentLesson?.id);

  const handleNext = async () => {
    // Mark complete if not already
    if (!isCompleted) {
       await completeLesson(currentLesson.id, pathId, currentLesson.xpReward);
    }
    
    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished path
      await completePath(pathId);
      navigation.goBack();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const openVideo = () => {
     if (currentSign && currentSign.videoURL) {
         setCurrentVideoUrl(currentSign.videoURL);
         setCurrentSignTitle(currentSign.title);
         setModalVisible(true);
     }
  };

  const pct = ((currentIndex + 1) / lessons.length) * 100;

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="close" size={28} color={COLORS.text} />
           </TouchableOpacity>
           <View style={styles.progressContainer}>
               <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={['#2DC7FF', '#00A3E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${pct}%` }]}
                  />
               </View>
           </View>
        </View>

        {/* Flashcard */}
        <View style={styles.flashcardContainer}>
           <Animatable.View animation="fadeIn" duration={400} key={currentIndex} style={styles.flashcard}>
              <Text style={styles.lessonOrder}>{pathTitle} - Lesson {currentIndex + 1} of {lessons.length}</Text>
              
              {currentSign ? (
                  <>
                     <Text style={styles.emoji}>{currentSign.emoji}</Text>
                     <Text style={styles.signTitle}>{currentSign.title}</Text>
                     
                     {currentSign.videoURL ? (
                        <TouchableOpacity style={styles.playBtn} onPress={openVideo}>
                            <Ionicons name="play-circle" size={64} color={COLORS.primary} />
                            <Text style={styles.playText}>Watch Sign</Text>
                        </TouchableOpacity>
                     ) : (
                         <View style={styles.noVideo}>
                             <Text style={styles.noVideoText}>Video unavailable (seed in progress)</Text>
                         </View>
                     )}
                     
                     <Text style={styles.desc}>{currentSign.description}</Text>
                  </>
              ) : (
                  <Text style={styles.signTitle}>Loading sign data...</Text>
              )}
           </Animatable.View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
           <TouchableOpacity 
              style={[styles.navBtn, currentIndex === 0 && { opacity: 0 }]} 
              onPress={handlePrev}
              disabled={currentIndex === 0}
           >
              <Text style={styles.navBtnText}>Previous</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                 {isCompleted ? 'Next' : 'Got it!'} 
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
           </TouchableOpacity>
        </View>

      </SafeAreaView>

      <VideoModal
        visible={modalVisible}
        videoUrl={currentVideoUrl}
        title={currentSignTitle}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm
  },
  backBtn: {
      padding: SPACING.xs
  },
  progressContainer: {
      flex: 1,
      marginLeft: SPACING.md,
      marginRight: SPACING.lg
  },
  progressBarBg: {
      height: 12,
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 6,
      overflow: 'hidden'
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 6
  },
  flashcardContainer: {
      flex: 1,
      padding: SPACING.xl,
      justifyContent: 'center'
  },
  flashcard: {
      backgroundColor: 'rgba(255,255,255,0.8)',
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      alignItems: 'center',
      ...SHADOWS.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)'
  },
  lessonOrder: {
      fontFamily: 'Inter',
      color: COLORS.textSecondary,
      marginBottom: SPACING.sm,
      textAlign: 'center'
  },
  emoji: {
      fontSize: 80,
      marginBottom: SPACING.md
  },
  signTitle: {
      fontFamily: 'Poppins-Bold',
      fontSize: 28,
      color: COLORS.text,
      marginBottom: SPACING.lg,
      textAlign: 'center'
  },
  playBtn: {
      alignItems: 'center',
      marginBottom: SPACING.xl
  },
  playText: {
      fontFamily: 'Poppins-Medium',
      color: COLORS.primary,
      marginTop: SPACING.xs
  },
  noVideo: {
      padding: SPACING.md,
      backgroundColor: COLORS.surfaceDim,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.xl
  },
  noVideoText: {
      color: COLORS.textSecondary,
      fontFamily: 'Inter'
  },
  desc: {
      fontFamily: 'Inter',
      fontSize: 16,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 24
  },
  controls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxl
  },
  navBtn: {
      padding: SPACING.md
  },
  navBtnText: {
      fontFamily: 'Poppins-Medium',
      color: COLORS.textSecondary,
      fontSize: 16
  },
  nextBtn: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderRadius: 30,
      ...SHADOWS.sm
  },
  nextBtnText: {
      color: '#FFF',
      fontFamily: 'Poppins-Bold',
      fontSize: 16
  }
});
