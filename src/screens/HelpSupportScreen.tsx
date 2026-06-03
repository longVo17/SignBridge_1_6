import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { askGemini, ChatMessage } from '../services/ai.service';

interface FAQItem {
  question: string;
  answer: string;
}

const SUGGESTIONS = [
  { text: "About SignBridge 🌟", prompt: "Tell me about the SignBridge app. What is its purpose?" },
  { text: "Who made this? 🎓", prompt: "Who developed the SignBridge app and what project is it for?" },
  { text: "ASL Grammar 📖", prompt: "Can you explain the grammar rules of American Sign Language (ASL)?" },
  { text: "ASL Sentence Order 🔄", prompt: "How are sentences structured in ASL (e.g. SVO vs Topic-Comment)?" },
];

export default function HelpSupportScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Xin chào! Mình là SignBridge AI. Bạn muốn tìm hiểu gì về Ngôn ngữ ký hiệu Mỹ (ASL), văn hóa người khiếm thính, hoặc thông tin dự án tốt nghiệp này?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // FAQS data
  const FAQS: FAQItem[] = [
    {
      question: "How do I study a new unit?",
      answer: "Navigate to the Learn tab at the bottom. Choose an unlocked learning unit (like 'Basic Vocabulary - Part 1') and tap 'Start Lesson'. You will watch video demonstrations for each word and then take a short quiz to test your understanding."
    },
    {
      question: "How does the streak system work?",
      answer: "Every day you complete a lesson or review flashcards, your study streak increases by 1 day. If you go a full calendar day without completing any study activity, your streak resets. Daily reminders are scheduled at 7:00 PM to help you stay on track!"
    },
    {
      question: "What are flashcards used for?",
      answer: "Flashcards allow you to review words you have learned. Swipe right on a card if you know the sign ('Mastered') or left if you need to practice more ('Still Learning'). Your progress is saved automatically so you can resume anytime from your profile page."
    },
    {
      question: "How is my XP calculated?",
      answer: "You earn XP (Experience Points) by completing lessons and mastering words. Each letter in the ASL Alphabet earns you +20 XP, and conversational vocabulary words earn +30 XP or +40 XP upon successful completion."
    }
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@signbridge.app')
      .catch(() => Alert.alert('Error', 'Could not open mail client. Please email us at support@signbridge.app'));
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => (prev === index ? null : index));
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    // Map history to Gemini's format: { role: 'user' | 'model', parts: [{ text: string }] }
    // Note: excluding current user message since it's passed as prompt
    const chatHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await askGemini(textToSend, chatHistory);
      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('[HelpSupportScreen] Failed to get response from Gemini:', err);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* Segmented Tab Bar */}
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'chat' && styles.tabButtonActive]}
              onPress={() => setActiveTab('chat')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={activeTab === 'chat' ? '#FFF' : COLORS.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>AI Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'faq' && styles.tabButtonActive]}
              onPress={() => setActiveTab('faq')}
              activeOpacity={0.8}
            >
              <Ionicons name="help-circle-outline" size={17} color={activeTab === 'faq' ? '#FFF' : COLORS.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>FAQs & Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional Tab Rendering */}
        {activeTab === 'chat' ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            {/* Chat Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatListContent}
              onContentSizeChange={scrollToBottom}
              renderItem={({ item }) => {
                const isUser = item.sender === 'user';
                return (
                  <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
                    {!isUser && (
                      <View style={styles.chatAvatar}>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                      </View>
                    )}
                    <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                      <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAi]}>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListFooterComponent={() => (
                isTyping ? (
                  <View style={[styles.messageRow, styles.messageRowAi]}>
                    <View style={styles.chatAvatar}>
                      <Ionicons name="sparkles" size={14} color="#FFF" />
                    </View>
                    <View style={[styles.messageBubble, styles.bubbleAi, styles.typingBubble]}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                  </View>
                ) : null
              )}
              ListHeaderComponent={() => (
                <View style={styles.chatHeader}>
                  <Text style={styles.chatHeaderTitle}>Ask SignBridge AI</Text>
                  <Text style={styles.chatHeaderSubtitle}>
                    I'm your AI tutor specialized in American Sign Language. Tap a query below or write your own!
                  </Text>
                  
                  {/* Suggestion capsules */}
                  <View style={styles.suggestionsContainer}>
                    {SUGGESTIONS.map((sug, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionCapsule}
                        onPress={() => handleSend(sug.prompt)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.suggestionText}>{sug.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />

            {/* Input message bar */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask about ASL signs, grammar, culture..."
                  placeholderTextColor="#9CA3AF"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                  onPress={() => handleSend(inputText)}
                  disabled={!inputText.trim() || isTyping}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Subtitle / Intro */}
            <Text style={styles.introText}>
              Welcome to the Support Center. Search below for common questions, or reach out directly to our engineering support team.
            </Text>

            {/* Contact channels */}
            <View style={styles.supportCardContainer}>
              <View style={styles.supportCard}>
                <View style={styles.supportIconBg}>
                  <Ionicons name="chatbubbles-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>Need Technical Help?</Text>
                <Text style={styles.cardBody}>
                  Our engineering team is available 24/7 to resolve bugs, account access issues, or feature inquiries.
                </Text>
                <TouchableOpacity onPress={handleContactSupport} style={styles.emailBtn} activeOpacity={0.8}>
                  <LinearGradient colors={['#2DC7FF', '#00A3E0']} style={styles.emailBtnGrad}>
                    <Ionicons name="mail" size={16} color="#FFF" />
                    <Text style={styles.emailBtnText}>Email Engineering</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* FAQs section */}
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

            <View style={styles.faqList}>
              {FAQS.map((faq, idx) => {
                const active = activeFaq === idx;
                return (
                  <View key={idx} style={[styles.faqCard, { backgroundColor: active ? '#ffffff' : 'rgba(255,255,255,0.9)' }]}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => toggleFaq(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <Ionicons
                        name={active ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>

                    {active && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,199,255,0.08)',
  },
  backBtn: {
    padding: 6,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headlineLarge,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  // Tab Bar Styles
  tabBarContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(230,242,245,0.7)',
    borderRadius: BORDER_RADIUS.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(45, 199, 255, 0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.pill,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  // Chat Styles
  chatListContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 24,
  },
  chatHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,199,255,0.08)',
    marginBottom: SPACING.md,
  },
  chatHeaderTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chatHeaderSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: SPACING.md,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  suggestionCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: 'rgba(45, 199, 255, 0.25)',
    ...SHADOWS.soft,
  },
  suggestionText: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    gap: 8,
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.soft,
  },
  bubbleUser: {
    backgroundColor: 'rgba(45, 199, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.25)',
    borderTopRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(230,242,245,0.9)',
    borderTopLeftRadius: 2,
  },
  typingBubble: {
    width: 48,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
  },
  textUser: {
    color: COLORS.text,
  },
  textAi: {
    color: COLORS.text,
  },
  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,199,255,0.08)',
    backgroundColor: '#FAFDFD',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    ...SHADOWS.soft,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.text,
    maxHeight: 80,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  // Original FAQ styling remains unchanged
  introText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  supportCardContainer: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },
  supportCard: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    backgroundColor: '#ffffff',
  },
  supportIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45,199,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  emailBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  emailBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  emailBtnText: {
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineMedium,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 199, 255, 0.15)',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,199,255,0.06)',
    paddingTop: 10,
  },
  faqAnswer: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
