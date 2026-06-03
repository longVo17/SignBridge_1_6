import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { adminService } from '../services/admin.service';
import { learningService } from '../services/learning.service';
import { getSignsByCategory } from '../services/dictionary.service';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { Sign, LearningPath, QuizQuestion } from '../types/data.types';

// Animated Custom Question Card component
interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  onDelete: () => void;
}

const QuizQuestionCard = ({ question, index, onDelete }: QuizQuestionCardProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleDelete = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -400,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onDelete();
    });
  };

  return (
    <Animated.View
      style={[
        styles.questionCard,
        {
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={styles.questionCardHeader}>
        <Text style={styles.questionIndex}>Question #{index + 1}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.questionText}>{question.questionText}</Text>
      <View style={styles.optionsList}>
        {question.options.map((opt: string, i: number) => (
          <View key={i} style={[styles.optionRow, i === question.correctIndex && styles.correctOptionRow]}>
            <Text style={[styles.optionPrefix, i === question.correctIndex && styles.correctOptionPrefix]}>
              {String.fromCharCode(65 + i)}
            </Text>
            <Text style={[styles.optionText, i === question.correctIndex && styles.correctOptionText]}>
              {opt}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

export default function AdminPanelScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'units' | 'quizzes'>('units');
  const [loading, setLoading] = useState(false);

  // Loaded DB data
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [signs, setSigns] = useState<Sign[]>([]);
  
  // Modals visibility
  const [showPathModal, setShowPathModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showQuizQuestionModal, setShowQuizQuestionModal] = useState(false);

  // Search logic in sign dropdowns
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSelectorType, setCurrentSelectorType] = useState<'lesson' | 'quiz'>('lesson');

  // Tab A - Form 1: Add Unit states
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [unitIcon, setUnitIcon] = useState('book-outline');
  const [unitOrder, setUnitOrder] = useState('');
  const [unitXP, setUnitXP] = useState('');

  // Tab A - Form 2: Add Lesson states
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonXP, setLessonXP] = useState('20');
  const [lessonType, setLessonType] = useState<'video' | 'practice' | 'quiz'>('video');
  const [lessonOrder, setLessonOrder] = useState('');

  // Tab B: Add Quiz states
  const [quizPath, setQuizPath] = useState<LearningPath | null>(null);
  const [passingScore, setPassingScore] = useState('70');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizPathSigns, setQuizPathSigns] = useState<Sign[]>([]);

  // Sub-form Add Quiz Question states
  const [selectedQuizSign, setSelectedQuizSign] = useState<Sign | null>(null);
  const [questionText, setQuestionText] = useState('What sign is this?');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0); // 0 = A, 1 = B, 2 = C, 3 = D

  // Fetch initial data
  const loadInitialData = async () => {
    try {
      const pathsData = await learningService.getLearningPaths();
      const signsData = await getSignsByCategory();
      setPaths(pathsData);
      setSigns(signsData);
    } catch (err) {
      console.error('Failed to fetch admin screen data:', err);
      Alert.alert('Error', 'Failed to fetch paths or signs dictionary.');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch signs specific to path lessons for Quiz Builder
  useEffect(() => {
    if (!quizPath) {
      setQuizPathSigns([]);
      return;
    }
    const fetchPathSigns = async () => {
      try {
        const lessonsList = await learningService.getLessonsForPath(quizPath.id);
        const signIds = lessonsList.map(l => l.signId);
        const pathSpecificSigns = signs.filter(s => signIds.includes(s.id));
        setQuizPathSigns(pathSpecificSigns.length > 0 ? pathSpecificSigns : signs);
      } catch (err) {
        console.warn("Failed to load path lessons, falling back to full dictionary:", err);
        setQuizPathSigns(signs);
      }
    };
    fetchPathSigns();
  }, [quizPath, signs]);

  // Search filter for modal dropdown
  const filteredSigns = useMemo(() => {
    const listToSearch = currentSelectorType === 'quiz' ? quizPathSigns : signs;
    if (!searchQuery.trim()) return listToSearch;
    const lower = searchQuery.toLowerCase();
    return listToSearch.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.category.toLowerCase().includes(lower)
    );
  }, [signs, quizPathSigns, searchQuery, currentSelectorType]);

  // Section A - Form 1 Submit
  const handleAddUnit = async () => {
    if (!unitTitle.trim() || !unitDescription.trim() || !unitIcon.trim() || !unitOrder.trim() || !unitXP.trim()) {
      Alert.alert('Error', 'Please fill out all fields for the Learning Unit.');
      return;
    }
    setLoading(true);
    try {
      const newPathId = await adminService.addLearningUnit({
        title: unitTitle.trim(),
        description: unitDescription.trim(),
        icon: unitIcon.trim(),
        order: Number(unitOrder),
        totalXP: Number(unitXP),
      });
      Alert.alert('Success', `Created Learning Unit with ID: ${newPathId}`);
      // Clear fields
      setUnitTitle('');
      setUnitDescription('');
      setUnitIcon('book-outline');
      setUnitOrder('');
      setUnitXP('');
      // Reload paths dropdown
      loadInitialData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create learning path.');
    } finally {
      setLoading(false);
    }
  };

  // Section A - Form 2 Submit
  const handleAddLesson = async () => {
    if (!selectedPath) {
      Alert.alert('Error', 'Please select a Learning Path.');
      return;
    }
    if (!selectedSign) {
      Alert.alert('Error', 'Please select a Sign from the Dictionary.');
      return;
    }
    if (!lessonTitle.trim() || !lessonXP.trim() || !lessonOrder.trim()) {
      Alert.alert('Error', 'Please complete all fields for the Lesson.');
      return;
    }

    setLoading(true);
    try {
      await adminService.addLessonToUnit({
        pathId: selectedPath.id,
        title: lessonTitle.trim(),
        signId: selectedSign.id,
        order: Number(lessonOrder),
        xpReward: Number(lessonXP),
        type: lessonType,
      });
      Alert.alert('Success', `Added lesson "${lessonTitle}" to path "${selectedPath.title}".`);
      // Reset lesson form
      setSelectedSign(null);
      setLessonTitle('');
      setLessonXP('20');
      setLessonOrder('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add lesson.');
    } finally {
      setLoading(false);
    }
  };

  // Section B - Sub-form Add Question
  const handleAddQuizQuestion = () => {
    if (!selectedQuizSign) {
      Alert.alert('Error', 'Please choose a Sign for this question.');
      return;
    }
    if (!questionText.trim()) {
      Alert.alert('Error', 'Please enter the Question text.');
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      Alert.alert('Error', 'Please fill in all 4 options.');
      return;
    }

    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substring(2, 9),
      signId: selectedQuizSign.id,
      questionText: questionText.trim(),
      options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
      correctIndex: correctAnswerIndex,
    };

    setQuizQuestions(prev => [...prev, newQuestion]);

    // Reset fields
    setSelectedQuizSign(null);
    setQuestionText('What sign is this?');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswerIndex(0);
    setShowQuizQuestionModal(false);
  };

  // Section B - Submit Quiz
  const handleSaveQuiz = async () => {
    if (!quizPath) {
      Alert.alert('Error', 'Please select a Learning Path.');
      return;
    }
    if (!passingScore.trim()) {
      Alert.alert('Error', 'Please set a passing score percentage.');
      return;
    }
    if (quizQuestions.length === 0) {
      Alert.alert('Error', 'Please add at least 1 question to the quiz.');
      return;
    }

    setLoading(true);
    try {
      await adminService.addQuizToUnit(quizPath.id, Number(passingScore), quizQuestions);
      Alert.alert('Success', `Quiz saved for path "${quizPath.title}".`);
      // Reset quiz builder
      setQuizPath(null);
      setPassingScore('70');
      setQuizQuestions([]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#E8F8FF', '#FAFEFF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Control Center</Text>
          </View>

          {/* Premium Animated Segmented Control Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'units' && styles.tabButtonActive]}
              onPress={() => setActiveTab('units')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'units' && styles.tabTextActive]}>Units & Lessons</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'quizzes' && styles.tabButtonActive]}
              onPress={() => setActiveTab('quizzes')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive]}>Quiz Builder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'units' ? (
              <View style={styles.tabContent}>
                
                {/* Form 1: Add Learning Unit */}
                <Animatable.View animation="fadeInUp" duration={400} style={styles.glassCard}>
                  <Text style={styles.sectionTitle}>Add Learning Unit</Text>
                  
                  <Text style={styles.inputLabel}>Unit Title</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. ASL Alphabet Part 2"
                    placeholderTextColor={COLORS.textSecondary}
                    value={unitTitle}
                    onChangeText={setUnitTitle}
                  />

                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    placeholder="Provide a description..."
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    numberOfLines={3}
                    value={unitDescription}
                    onChangeText={setUnitDescription}
                  />

                  <Text style={styles.inputLabel}>Icon (Ionicons name)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. book-outline"
                    placeholderTextColor={COLORS.textSecondary}
                    value={unitIcon}
                    onChangeText={setUnitIcon}
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Position / Order</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 2"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                        value={unitOrder}
                        onChangeText={setUnitOrder}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>XP Reward</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 150"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                        value={unitXP}
                        onChangeText={setUnitXP}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddUnit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2DC7FF', '#00A3E0']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.buttonText}>Create Learning Unit</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animatable.View>

                {/* Form 2: Add Lesson to Unit */}
                <Animatable.View animation="fadeInUp" duration={500} style={styles.glassCard}>
                  <Text style={styles.sectionTitle}>Add Lesson to Unit</Text>

                  {/* Learning Path Selector */}
                  <Text style={styles.inputLabel}>Select Learning Path</Text>
                  <TouchableOpacity
                    style={styles.selectorInput}
                    onPress={() => {
                      setCurrentSelectorType('lesson');
                      setShowPathModal(true);
                    }}
                  >
                    <Text style={selectedPath ? styles.selectorText : styles.placeholderText}>
                      {selectedPath ? selectedPath.title : 'Choose path...'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* Dictionary Sign Selector */}
                  <Text style={styles.inputLabel}>Select Sign from Dictionary</Text>
                  <TouchableOpacity
                    style={styles.selectorInput}
                    onPress={() => {
                      setSearchQuery('');
                      setCurrentSelectorType('lesson');
                      setShowSignModal(true);
                    }}
                  >
                    <Text style={selectedSign ? styles.selectorText : styles.placeholderText}>
                      {selectedSign ? `${selectedSign.title} (${selectedSign.category})` : 'Search sign dictionary...'}
                    </Text>
                    <Ionicons name="search-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  <Text style={styles.inputLabel}>Lesson Title</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Lesson Title (auto-filled from sign)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={lessonTitle}
                    onChangeText={setLessonTitle}
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>XP Reward</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="20"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                        value={lessonXP}
                        onChangeText={setLessonXP}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>Order / Position</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 1"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                        value={lessonOrder}
                        onChangeText={setLessonOrder}
                      />
                    </View>
                  </View>

                  {/* Lesson Type selector capsules */}
                  <Text style={styles.inputLabel}>Lesson Type</Text>
                  <View style={styles.typeButtonContainer}>
                    {(['video', 'practice', 'quiz'] as const).map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeButton, lessonType === t && styles.typeButtonActive]}
                        onPress={() => setLessonType(t)}
                      >
                        <Text style={[styles.typeButtonText, lessonType === t && styles.typeButtonTextActive]}>
                          {t.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddLesson}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2DC7FF', '#00A3E0']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.buttonText}>Add Lesson</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animatable.View>

              </View>
            ) : (
              // Quiz Builder Tab
              <View style={styles.tabContent}>
                
                <Animatable.View animation="fadeInUp" duration={450} style={styles.glassCard}>
                  <Text style={styles.sectionTitle}>Create Quiz for Path</Text>

                  {/* Select Path for Quiz */}
                  <Text style={styles.inputLabel}>Select Learning Path</Text>
                  <TouchableOpacity
                    style={styles.selectorInput}
                    onPress={() => {
                      setCurrentSelectorType('quiz');
                      setShowPathModal(true);
                    }}
                  >
                    <Text style={quizPath ? styles.selectorText : styles.placeholderText}>
                      {quizPath ? quizPath.title : 'Choose path...'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  <Text style={styles.inputLabel}>Passing Score (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="70"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={passingScore}
                    onChangeText={setPassingScore}
                  />

                  {/* Add Questions Section */}
                  <View style={styles.questionsHeader}>
                    <Text style={styles.subSectionTitle}>Questions ({quizQuestions.length})</Text>
                    <TouchableOpacity
                      disabled={!quizPath}
                      style={[styles.addQuestionBtn, !quizPath && { opacity: 0.5 }]}
                      onPress={() => {
                        if (!quizPath) {
                          Alert.alert('Required', 'Please select a learning path first.');
                          return;
                        }
                        setSelectedQuizSign(null);
                        setOptionA('');
                        setOptionB('');
                        setOptionC('');
                        setOptionD('');
                        setCorrectAnswerIndex(0);
                        setShowQuizQuestionModal(true);
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.addQuestionBtnText}>Add Question</Text>
                    </TouchableOpacity>
                  </View>

                  {/* List of quiz questions with custom delete animation */}
                  {quizQuestions.length > 0 ? (
                    <View style={styles.questionsContainer}>
                      {quizQuestions.map((q, idx) => (
                        <QuizQuestionCard
                          key={q.id}
                          question={q}
                          index={idx}
                          onDelete={() => {
                            setQuizQuestions(prev => prev.filter(item => item.id !== q.id));
                          }}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyQuestions}>
                      <Ionicons name="list" size={32} color="rgba(45,199,255,0.4)" style={{ marginBottom: 8 }} />
                      <Text style={styles.emptyText}>No questions added yet. Press 'Add Question' above.</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: SPACING.md }]}
                    onPress={handleSaveQuiz}
                    disabled={loading || quizQuestions.length === 0}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2DC7FF', '#00A3E0']}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.buttonText}>Save Quiz Configuration</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animatable.View>

              </View>
            )}
          </ScrollView>

          {/* Modal dropdown for Path Selection */}
          <Modal visible={showPathModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Select Learning Path</Text>
                  <TouchableOpacity onPress={() => setShowPathModal(false)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={paths}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    const isSelected = currentSelectorType === 'quiz' ? quizPath?.id === item.id : selectedPath?.id === item.id;
                    return (
                      <TouchableOpacity
                        style={styles.modalSelectItem}
                        onPress={() => {
                          if (currentSelectorType === 'quiz') {
                            setQuizPath(item);
                            setQuizQuestions([]); // Reset quiz questions for new path
                          } else {
                            setSelectedPath(item);
                          }
                          setShowPathModal(false);
                        }}
                      >
                        <Text style={styles.modalSelectItemText}>{item.title}</Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </View>
            </View>
          </Modal>

          {/* Modal dropdown for Dictionary Sign Selection */}
          <Modal visible={showSignModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>
                    {currentSelectorType === 'quiz' ? 'Path Vocabulary' : 'Dictionary signs'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowSignModal(false)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchBarWrapper}>
                  <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search signs by name or category..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <FlatList
                  data={filteredSigns}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    const isSelected = currentSelectorType === 'quiz' ? selectedQuizSign?.id === item.id : selectedSign?.id === item.id;
                    return (
                      <TouchableOpacity
                        style={styles.modalSelectItem}
                        onPress={() => {
                          if (currentSelectorType === 'quiz') {
                            setSelectedQuizSign(item);
                          } else {
                            setSelectedSign(item);
                            setLessonTitle(item.title);
                          }
                          setShowSignModal(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalSelectItemText}>{item.title}</Text>
                          <Text style={styles.modalSelectItemSubtext}>{item.category} • {item.difficulty}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  ListEmptyComponent={() => (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
                        No signs found. Make sure the learning path has lessons already created, or search for a different word.
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Modal sub-form for adding Quiz Question */}
          <Modal visible={showQuizQuestionModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Add Quiz Question</Text>
                  <TouchableOpacity onPress={() => setShowQuizQuestionModal(false)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  
                  {/* Select corresponding Sign for Question */}
                  <Text style={styles.inputLabel}>Select Sign</Text>
                  <TouchableOpacity
                    style={styles.selectorInput}
                    onPress={() => {
                      setSearchQuery('');
                      setCurrentSelectorType('quiz');
                      setShowSignModal(true);
                    }}
                  >
                    <Text style={selectedQuizSign ? styles.selectorText : styles.placeholderText}>
                      {selectedQuizSign ? `${selectedQuizSign.title} (${selectedQuizSign.category})` : 'Choose dictionary sign...'}
                    </Text>
                    <Ionicons name="search-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  <Text style={styles.inputLabel}>Question Text</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. What sign is shown in this video?"
                    placeholderTextColor={COLORS.textSecondary}
                    value={questionText}
                    onChangeText={setQuestionText}
                  />

                  <Text style={styles.inputLabel}>Option A</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Option A"
                    placeholderTextColor={COLORS.textSecondary}
                    value={optionA}
                    onChangeText={setOptionA}
                  />

                  <Text style={styles.inputLabel}>Option B</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Option B"
                    placeholderTextColor={COLORS.textSecondary}
                    value={optionB}
                    onChangeText={setOptionB}
                  />

                  <Text style={styles.inputLabel}>Option C</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Option C"
                    placeholderTextColor={COLORS.textSecondary}
                    value={optionC}
                    onChangeText={setOptionC}
                  />

                  <Text style={styles.inputLabel}>Option D</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Option D"
                    placeholderTextColor={COLORS.textSecondary}
                    value={optionD}
                    onChangeText={setOptionD}
                  />

                  {/* Correct Option index picker */}
                  <Text style={styles.inputLabel}>Correct Option</Text>
                  <View style={styles.typeButtonContainer}>
                    {(['A', 'B', 'C', 'D'] as const).map((letter, index) => (
                      <TouchableOpacity
                        key={letter}
                        style={[styles.typeButton, correctAnswerIndex === index && styles.typeButtonActive]}
                        onPress={() => setCorrectAnswerIndex(index)}
                      >
                        <Text style={[styles.typeButtonText, correctAnswerIndex === index && styles.typeButtonTextActive]}>
                          OPTION {letter}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: SPACING.lg }]}
                    onPress={handleAddQuizQuestion}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2DC7FF', '#00A3E0']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>Add Question to List</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                </ScrollView>
              </View>
            </View>
          </Modal>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    marginRight: 15,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 20,
    marginBottom: SPACING.md,
    alignSelf: 'stretch',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 26,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary, // #2DC7FF
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    // Add offset for floating navigation deck
    paddingBottom: 120,
  },
  tabContent: {
    width: '100%',
    alignSelf: 'stretch',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2DC7FF',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(45, 199, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(45, 199, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: SPACING.sm,
  },
  selectorText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  typeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    padding: 4,
    borderColor: 'rgba(45, 199, 255, 0.2)',
    borderWidth: 1,
    marginBottom: SPACING.md,
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Quiz building sub elements
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 199, 255, 0.15)',
    paddingTop: SPACING.md,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(45, 199, 255, 0.1)',
  },
  addQuestionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  questionsContainer: {
    marginVertical: SPACING.xs,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(45, 199, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#2DC7FF',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  optionsList: {
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
  },
  correctOptionRow: {
    backgroundColor: '#E0F7FF',
    borderColor: 'rgba(45,199,255,0.2)',
    borderWidth: 1,
  },
  optionPrefix: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 8,
  },
  correctOptionPrefix: {
    color: COLORS.primary,
  },
  optionText: {
    fontSize: 13,
    color: '#4B5563',
  },
  correctOptionText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  emptyQuestions: {
    alignItems: 'center',
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Modal Select layout
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  modalSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSelectItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSelectItemSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
