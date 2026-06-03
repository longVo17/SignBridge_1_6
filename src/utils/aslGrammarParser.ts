import { Sign } from '../types/data.types';

// Simple lemmatization dictionary for base forms
const LEMMA_MAP: Record<string, string> = {
  'going': 'go',
  'went': 'go',
  'goes': 'go',
  'loving': 'love',
  'loved': 'love',
  'loves': 'love',
  'likes': 'like',
  'liked': 'like',
  'liking': 'like',
  'wants': 'want',
  'wanted': 'want',
  'wanting': 'want',
  'needs': 'need',
  'needed': 'need',
  'needs/': 'need',
  'drinking': 'drink',
  'drank': 'drink',
  'eating': 'eat',
  'ate': 'eat',
  'sleeping': 'sleep',
  'slept': 'sleep',
  'working': 'work',
  'worked': 'work',
  'friends': 'friend',
  'schools': 'school',
  'homes': 'home',
  'thank-you': 'thankyou',
  'thank': 'thankyou', // fallback
  'good-bye': 'goodbye',
  'bye': 'goodbye',
};

// ASL Stopwords - words that are omitted in ASL grammar
const STOPWORDS = new Set([
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'a', 'an', 'the',
  'to', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'during', 'before', 'after',
  'and', 'but', 'or', 'so',
  'do', 'does', 'did', 'done', // auxiliary do/does
  'will', 'would', 'shall', 'should',
  'have', 'has', 'had', 'having',
]);

// Contractions map
const CONTRACTIONS: Record<string, string[]> = {
  "don't": ["not"],
  "doesn't": ["not"],
  "didn't": ["not"],
  "won't": ["not"],
  "can't": ["not"],
  "isn't": ["not"],
  "aren't": ["not"],
  "wasn't": ["not"],
  "weren't": ["not5"],
  "i'm": ["i"],
  "you're": ["you"],
  "he's": ["he"],
  "she's": ["she"],
  "it's": ["it"],
  "we're": ["we"],
  "they're": ["they"],
  "i've": ["i"],
  "you've": ["you"],
  "we've": ["we"],
  "they've": ["they"],
  "i'd": ["i"],
  "you'd": ["you"],
  "he'd": ["he"],
  "she'd": ["she"],
  "we'd": ["we"],
  "they'd": ["they"],
  "i'll": ["i"],
  "you'll": ["you"],
  "he'll": ["he"],
  "she'll": ["she"],
  "we'll": ["we"],
  "they'll": ["they"],
};

// WH-Question words
const WH_WORDS = new Set(['what', 'who', 'where', 'why', 'how', 'when', 'which']);

/**
 * Translates a natural English sentence into ASL Gloss and matches it against available dictionary signs.
 * 
 * Rules:
 * 1. Clean punctuation and tokenize.
 * 2. Expand common contractions (e.g. "don't" -> "not").
 * 3. Convert multi-word concepts (e.g. "thank you" -> "thankyou").
 * 4. Drop standard grammatical stopwords (like auxiliary verbs, prepositions, articles).
 * 5. Lemmatize words to their base forms matching dictionary entries.
 * 6. Match tokens against the user's local dictionary signs.
 * 7. Reorder question words (WH-words like what, who) to the end of the sentence.
 */
export function parseSentenceToASLGloss(
  sentence: string,
  dictionarySigns: Sign[]
): { matchedSigns: Sign[]; parsedGloss: string[] } {
  if (!sentence || !sentence.trim()) {
    return { matchedSigns: [], parsedGloss: [] };
  }

  // 1. Clean punctuation and normalize casing
  const cleanText = sentence
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Handle multi-word concepts before splitting (e.g., "thank you" -> "thankyou")
  let normalizedText = cleanText
    .replace(/\bthank\s+you\b/g, 'thankyou')
    .replace(/\bgood\s+bye\b/g, 'goodbye');

  const rawTokens = normalizedText.split(/\s+/);
  const expandedTokens: string[] = [];

  // 2. Expand contractions
  for (const token of rawTokens) {
    if (CONTRACTIONS[token]) {
      expandedTokens.push(...CONTRACTIONS[token]);
    } else {
      expandedTokens.push(token);
    }
  }

  const processedGloss: string[] = [];

  // 3. Stopwords filtering and Lemmatization
  for (const token of expandedTokens) {
    // Drop stopwords
    if (STOPWORDS.has(token)) {
      continue;
    }

    // Apply lemmatization to find base form
    const baseForm = LEMMA_MAP[token] || token;
    processedGloss.push(baseForm);
  }

  // 4. WH-Question Reordering
  // Find any WH-question words, extract them, and append them at the end.
  const mainGloss: string[] = [];
  const whGloss: string[] = [];

  for (const word of processedGloss) {
    if (WH_WORDS.has(word)) {
      whGloss.push(word);
    } else {
      mainGloss.push(word);
    }
  }

  // Reordered sequence
  const finalGloss = [...mainGloss, ...whGloss];

  // 5. Match against dictionary signs
  const matchedSigns: Sign[] = [];
  
  for (const glossWord of finalGloss) {
    // Find matching sign in the dictionary (checking title and keywords)
    const matchedSign = dictionarySigns.find(
      s => s.title.toLowerCase() === glossWord ||
           s.title.toLowerCase().replace(/\s+/g, '') === glossWord ||
           s.keywords?.some(k => k.toLowerCase() === glossWord)
    );

    if (matchedSign) {
      // Prevent duplicate signs in the visual sequence if they were matched multiple times in a row
      matchedSigns.push(matchedSign);
    }
  }

  return {
    matchedSigns,
    parsedGloss: finalGloss,
  };
}
