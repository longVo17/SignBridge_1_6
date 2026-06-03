# Sentence Sign Visualizer - Technology & Implementation Log

This document records the technology stack, algorithmic design, and architectural implementation of the **Sentence Sign Visualizer (Text-to-Sign Sequence Player)** feature in SignBridge.

---

## 🛠️ Technology Stack

1. **React Native & Expo SDK 54**: Core mobile application runtime framework.
2. **TypeScript**: Provides full static typing, type check verification (`npx tsc --noEmit`), and code auto-completion.
3. **expo-av (v16.0.8)**: High-performance audio-video engine used to load, play, pause, and control playback speed of local `.mp4` sign assets and remote Cloudinary streams.
4. **React Native Animatable**: Used to trigger smooth, entry animations (`bounceIn`) for the search result prompt cards.
5. **Expo Vector Icons (Ionicons)**: Used for clear, modern visual icons (`film-outline`, `play`, `pause`, etc.).

---

## 🧠 Algorithmic Design: Rule-Based ASL Grammar Parser

ASL grammar is different from English or Vietnamese natural language syntax. It focuses on meaning-carrying words, drops grammatical fillers, and restructures question phrases (typically placing the question word at the end). 

We implemented a lightweight, high-performance client-side **NLP Parser** in [aslGrammarParser.ts](file:///d:/2SignBridgeApp/src/utils/aslGrammarParser.ts):

### 1. Normalization & Tokenization
* Sanitizes punctuation (commas, question marks, periods) and forces lowercase.
* Replaces multi-word concepts with single compound terms that match our database keys (e.g., `"thank you"` becomes `"thankyou"`, `"good bye"` becomes `"goodbye"`).

### 2. Contraction Expansion
* Expands common abbreviations so they can be processed and matched (e.g., `"don't"` -> `["not"]`, `"i'm"` -> `["i"]`).

### 3. Stopwords Filtering
* Drops grammatical helper words that do not exist as signs in ASL.
* Omitted words:
  * **Auxiliary verbs:** `am`, `is`, `are`, `was`, `were`, `be`, `been`
  * **Articles:** `a`, `an`, `the`
  * **Prepositions:** `to`, `of`, `at`, `by`, `for`
  * **Conjunctions:** `and`, `but`, `or`, `so`
  * **Helper questions:** `do`, `does`, `did`

### 4. Lemmatization
* Maps inflected verbs and plurals to their base form entries in our dictionary:
  * `going`/`went`/`goes` -> `go`
  * `loving`/`loved`/`loves` -> `love`
  * `working`/`worked` -> `work`
  * `friends` -> `friend`

### 5. WH-Question Reordering
* Identifies question tokens (`what`, `who`, `where`, `why`, `how`, `when`, `which`), extracts them from the token stream, and appends them at the **end** of the gloss sequence to conform to ASL's question structure (e.g., *"What do you want?"* becomes `YOU WANT WHAT`).

### 6. Sign Dictionary Matching
* Searches the vocabulary database `signs` for titles or keywords matching the processed tokens.
* Returns an array of matched `Sign` objects containing the valid `videoURL` or local asset identifiers.

---

## 📺 Component Architecture

### 1. Trigger Card ([DictionaryScreen.tsx](file:///d:/2SignBridgeApp/src/screens/DictionaryScreen.tsx))
* Real-time listener: Computes matched signs on query text updates.
* If `matchedSigns.length >= 2`, displays an action card directly under the search bar detailing the parsed ASL gloss progression (e.g., `Gloss: HELLO → THANKYOU`).

### 2. Sequential Video Player ([SentencePlayerModal.tsx](file:///d:/2SignBridgeApp/src/components/ui/SentencePlayerModal.tsx))
* **Scrolling Timeline**: Embeds a `<ScrollView horizontal>` containing pill steps of the sentence words. Highlight indicates the active word. Tapping any pill jumps directly to that part of the sentence.
* **Autoplay Controller**: Listens to the `onPlaybackStatusUpdate` callback from `<Video>`. When `status.didJustFinish === true` and autoplay is active, the controller increments the active word index, triggering a seamless transition to the next sign video.
* **Playback Speed**: Updates the rate of the player between `0.5x`, `0.75x`, `1.0x`, and `1.5x` dynamically using `setRateAsync` while maintaining pitch correction.
* **Glassmorphic Theme**: Adheres to the Light Soft-UI specifications, using translucent white cards (`rgba(255,255,255,0.75)`), white-semi-transparent borders, and soft primary glow shadows.
