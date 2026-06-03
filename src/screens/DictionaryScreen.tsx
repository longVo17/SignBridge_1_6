import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { Sign } from '../types/data.types';
import { useSignsList, useSignSearch, useCategories } from '../hooks/useDictionary';
import VideoModal from '../components/ui/VideoModal';
import { parseSentenceToASLGloss } from '../utils/aslGrammarParser';
import SentencePlayerModal from '../components/ui/SentencePlayerModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'All': 'sparkles-outline',
  'Greetings': 'hand-left-outline',
  'Basics': 'chatbubble-outline',
  'Daily': 'sunny-outline',
  'Family': 'people-outline',
  'Numbers': 'grid-outline',
  'Colors': 'color-palette-outline',
};

const GET_LETTER_GRADIENT = (char: string): [string, string] => {
  const code = ((char[0] || 'A').charCodeAt(0)) % 5;
  switch (code) {
    case 0: return ['#E0F2FE', '#BAE6FD']; // Light Blue
    case 1: return ['#E0F7FA', '#B2EBF2']; // Cyan
    case 2: return ['#EEF2FF', '#E0E7FF']; // Indigo
    case 3: return ['#ECFDF5', '#D1FAE5']; // Emerald
    default: return ['#FDF2F8', '#FCE7F3']; // Pink / Rose
  }
};

const GET_LETTER_COLOR = (char: string) => {
  const code = ((char[0] || 'A').charCodeAt(0)) % 5;
  switch (code) {
    case 0: return '#0284C7';
    case 1: return '#00838F';
    case 2: return '#4F46E5';
    case 3: return '#059669';
    default: return '#DB2777';
  }
};

export const DictionaryScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sentenceModalVisible, setSentenceModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Dynamic grid setup for premium responsiveness on tablets/phones
  const numColumns = useMemo(() => {
    return SCREEN_WIDTH > 768 ? 4 : SCREEN_WIDTH > 480 ? 3 : 2;
  }, []);

  const cardWidth = useMemo(() => {
    const gaps = SPACING.sm * 2 + 12 * (numColumns - 1);
    return (SCREEN_WIDTH - gaps) / numColumns;
  }, [numColumns]);

  // 1. Fetch all signs once (using useSignsList(undefined))
  const { signs, loading, error, reload } = useSignsList(undefined);

  // Compute matched ASL Gloss signs for multi-word queries
  const matchedPhraseData = useMemo(() => {
    return parseSentenceToASLGloss(query, signs);
  }, [query, signs]);

  // 2. Extract unique categories client-side from loaded signs
  const categories = useMemo(() => {
    const list = signs.map((s) => s.category);
    return [...new Set(list)].sort();
  }, [signs]);

  // 3. Filter signs by selectedCategory and query client-side
  const displayedSigns = useMemo(() => {
    let filtered = [...signs];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (query.trim()) {
      const lower = query.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(lower) ||
          s.category.toLowerCase().includes(lower) ||
          s.keywords?.some((k) => k.toLowerCase().includes(lower)) ||
          s.description?.toLowerCase().includes(lower)
      );
    }

    // Sort alphabetically by title
    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [signs, selectedCategory, query]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openModal = (sign: Sign) => {
    setSelectedSign(sign);
    setModalVisible(true);
  };

  // ── Render header + search + category filter ───────────────────
  const renderHeader = () => (
    <>
      {/* Page Header */}
      <LinearGradient
        colors={['rgba(45,199,255,0.12)', 'transparent']}
        style={styles.pageHeader}
      >
        <Text style={styles.pageTitle}>ASL Dictionary</Text>
        <Text style={styles.pageSubtitle}>
          ASL signs for everyday communication
        </Text>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: 'rgba(255,255,255,0.92)' },
            isSearchFocused && styles.searchBarFocused
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={isSearchFocused ? '#2DC7FF' : COLORS.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dictionary..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sentence Visualizer Prompt Card */}
        {matchedPhraseData.matchedSigns.length >= 2 && (
          <Animatable.View animation="bounceIn" duration={600} style={styles.phraseCardWrapper}>
            <TouchableOpacity
              style={styles.phraseCard}
              onPress={() => setSentenceModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.phraseCardLeft}>
                <View style={styles.phraseIconCircle}>
                  <Ionicons name="film-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.phraseCardTitle}>Play ASL Sentence Sequence</Text>
                  <Text style={styles.phraseCardSubtitle}>
                    Gloss: {matchedPhraseData.parsedGloss.map(w => w.toUpperCase()).join(' → ')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animatable.View>
        )}
      </LinearGradient>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={['All', ...categories]}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          const active = (item === 'All' && !selectedCategory) || item === selectedCategory;
          return (
            <TouchableOpacity
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item === 'All' ? undefined : item)}
            >
              <Ionicons
                name={CATEGORY_ICONS[item] ?? 'bookmark-outline'}
                size={14}
                color={active ? '#FFF' : '#2DC7FF'}
              />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );

  // ── Sign Card ──────────────────────────────────────────────────
  const renderSignCard = ({ item, index }: { item: Sign; index: number }) => (
    <Animatable.View animation="fadeInUp" delay={index * 40} useNativeDriver>
      <TouchableOpacity style={[styles.card, { width: cardWidth }]} onPress={() => openModal(item)} activeOpacity={0.75}>
        {/* Thumbnail or Icon placeholder */}
        <View style={[styles.thumbWrap, { height: cardWidth * 0.6 }]}>
          <LinearGradient
            colors={GET_LETTER_GRADIENT(item.title || 'A')}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          >
            <View style={styles.placeholderInner}>
              <Text style={[styles.placeholderLetter, { color: GET_LETTER_COLOR(item.title || 'A') }]}>
                {item.title.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </LinearGradient>
          {/* Play overlay */}
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={30} color="rgba(255,255,255,0.9)" />
          </View>
          {/* Difficulty badge */}
          <View style={[styles.badge, { backgroundColor: getDiffColor(item.difficulty) }]}>
            <Text style={styles.badgeText}>{item.difficulty}</Text>
          </View>
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  // ── Empty / Error States ───────────────────────────────────────
  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading dictionary...</Text>
        </>
      ) : error ? (
        <>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : query.trim() ? (
        <>
          <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        </>
      ) : (
        <>
          <Ionicons name="folder-open-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No signs in database. Please seed Firestore!</Text>
        </>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#FFFFFF', '#FAFDFD', '#F4FBFC']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          key={numColumns}
          data={displayedSigns}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.row}
          renderItem={renderSignCard}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      </SafeAreaView>

      <VideoModal
        sign={selectedSign}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <SentencePlayerModal
        visible={sentenceModalVisible}
        onClose={() => setSentenceModalVisible(false)}
        originalPhrase={query}
        matchedSigns={matchedPhraseData.matchedSigns}
      />
    </LinearGradient>
  );
};

// ── Helpers ────────────────────────────────────────────────────────
function getDiffColor(d: string) {
  switch (d) {
    case 'Easy': return '#22C55E';
    case 'Medium': return '#F59E0B';
    case 'Hard': return '#EF4444';
    default: return COLORS.textSecondary;
  }
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 110 },

  // Header
  pageHeader: {
    padding: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  pageTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 100, // Make it a gorgeous pill shape
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(45,199,255,0.15)',
    ...SHADOWS.soft,
  },
  searchBarFocused: {
    borderColor: '#2DC7FF',
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    padding: 0,
  },

  // Category chips
  categoryList: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 8,
    alignSelf: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textSecondary,
  },
  categoryLabelActive: { color: '#FFF' },

  // Grid
  row: {
    paddingHorizontal: SPACING.sm,
    gap: 12,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...SHADOWS.soft,
  },
  thumbWrap: {
    width: '100%',
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLetter: {
    fontFamily: 'Poppins-Bold',
    fontSize: 34,
    fontWeight: 'bold',
    opacity: 0.85,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbEmoji: { fontSize: 40 },
  playOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#FFF',
    fontSize: 9,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  cardEmoji: { fontSize: 20 },
  cardTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 13,
  },
  cardCategory: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // Empty/Error
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFF',
  },
  phraseCardWrapper: {
    marginTop: 12,
    width: '100%',
  },
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 199, 255, 0.25)',
    ...SHADOWS.soft,
  },
  phraseCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phraseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 199, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  phraseCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  phraseCardSubtitle: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
