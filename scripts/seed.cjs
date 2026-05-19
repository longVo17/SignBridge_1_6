// ─────────────────────────────────────────────────────────────────────────────
// SIGNBRIDGE — Firestore Seed Script (Cloudinary Video strategy)
// Run: node scripts/seed.cjs
//
// Video source: Cloudinary CDN URLs → lưu vào field videoURL trong Firestore
// Sau khi upload video lên Cloudinary, cập nhật videoURL cho từng sign.
// ─────────────────────────────────────────────────────────────────────────────

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, writeBatch } = require('firebase/firestore');

// ── Firebase project (signbridge-c0b9c) ──────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyBh5WzJk-nk_FX3fBe5jMeMCGLkLBaAG6M',
  authDomain: 'signbridge-c0b9c.firebaseapp.com',
  projectId: 'signbridge-c0b9c',
  storageBucket: 'signbridge-c0b9c.firebasestorage.app',
  messagingSenderId: '438957272127',
  appId: '1:438957272127:web:d88641dc3ea73a837bdc8a',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── 30 ký hiệu ASL ────────────────────────────────────────────────────────────
// videoURL = Cloudinary CDN link sau khi upload
// '' = chưa có video, app sẽ hiển thị emoji placeholder
const SIGNS = [
  // Greetings
  { id: 'hello',      title: 'Hello',      category: 'Greetings', difficulty: 'Easy',   emoji: '👋', videoURL: '', description: 'Open hand, wave side to side from forehead.' },
  { id: 'goodbye',    title: 'Goodbye',    category: 'Greetings', difficulty: 'Easy',   emoji: '🤚', videoURL: '', description: 'Wave hand back and forth.' },
  { id: 'please',     title: 'Please',     category: 'Greetings', difficulty: 'Easy',   emoji: '🙏', videoURL: '', description: 'Flat hand on chest, circular motion.' },
  { id: 'thankyou',   title: 'Thank You',  category: 'Greetings', difficulty: 'Easy',   emoji: '🤲', videoURL: '', description: 'Fingers touch chin, move forward.' },
  { id: 'sorry',      title: 'Sorry',      category: 'Greetings', difficulty: 'Easy',   emoji: '😔', videoURL: '', description: 'Fist on chest, circular motion.' },
  { id: 'yes',        title: 'Yes',        category: 'Greetings', difficulty: 'Easy',   emoji: '✅', videoURL: '', description: 'Fist nods up and down like a head nodding.' },
  { id: 'no',         title: 'No',         category: 'Greetings', difficulty: 'Easy',   emoji: '❌', videoURL: '', description: 'Index and middle finger snap closed against thumb.' },

  // Basics
  { id: 'help',       title: 'Help',       category: 'Basics',    difficulty: 'Easy',   emoji: '🆘', videoURL: '', description: 'Thumb up hand lifts flat hand.' },
  { id: 'want',       title: 'Want',       category: 'Basics',    difficulty: 'Easy',   emoji: '🙋', videoURL: '', description: 'Claw hands pull toward body.' },
  { id: 'need',       title: 'Need',       category: 'Basics',    difficulty: 'Medium', emoji: '📌', videoURL: '', description: 'Bent index finger bends down repeatedly.' },
  { id: 'understand', title: 'Understand', category: 'Basics',    difficulty: 'Medium', emoji: '💡', videoURL: '', description: 'Index flicks up from forehead.' },
  { id: 'like',       title: 'Like',       category: 'Basics',    difficulty: 'Easy',   emoji: '👍', videoURL: '', description: 'Middle finger and thumb pinch from chest outward.' },

  // Daily
  { id: 'eat',        title: 'Eat',        category: 'Daily',     difficulty: 'Easy',   emoji: '🍽️', videoURL: '', description: 'Flat fingers tap mouth repeatedly.' },
  { id: 'drink',      title: 'Drink',      category: 'Daily',     difficulty: 'Easy',   emoji: '🥤', videoURL: '', description: 'C-shaped hand tilts toward mouth.' },
  { id: 'sleep',      title: 'Sleep',      category: 'Daily',     difficulty: 'Easy',   emoji: '😴', videoURL: '', description: 'Hand drops from forehead and fingers close.' },
  { id: 'work',       title: 'Work',       category: 'Daily',     difficulty: 'Medium', emoji: '💼', videoURL: '', description: 'Fists tap together at wrists.' },
  { id: 'school',     title: 'School',     category: 'Daily',     difficulty: 'Easy',   emoji: '🏫', videoURL: '', description: 'Flat hands clap twice.' },
  { id: 'home',       title: 'Home',       category: 'Daily',     difficulty: 'Easy',   emoji: '🏠', videoURL: '', description: 'Fingers together tap cheek then side of cheek.' },

  // Family
  { id: 'mother',     title: 'Mother',     category: 'Family',    difficulty: 'Easy',   emoji: '👩', videoURL: '', description: 'Open hand, thumb touches chin.' },
  { id: 'father',     title: 'Father',     category: 'Family',    difficulty: 'Easy',   emoji: '👨', videoURL: '', description: 'Open hand, thumb touches forehead.' },
  { id: 'baby',       title: 'Baby',       category: 'Family',    difficulty: 'Easy',   emoji: '👶', videoURL: '', description: 'Arms cradle and rock like holding a baby.' },
  { id: 'friend',     title: 'Friend',     category: 'Family',    difficulty: 'Easy',   emoji: '🤝', videoURL: '', description: 'Index fingers hook together and swap positions.' },

  // Numbers
  { id: 'one',        title: 'One',        category: 'Numbers',   difficulty: 'Easy',   emoji: '1️⃣', videoURL: '', description: 'Index finger points up.' },
  { id: 'two',        title: 'Two',        category: 'Numbers',   difficulty: 'Easy',   emoji: '2️⃣', videoURL: '', description: 'Index and middle fingers up (V shape).' },
  { id: 'three',      title: 'Three',      category: 'Numbers',   difficulty: 'Easy',   emoji: '3️⃣', videoURL: '', description: 'Index, middle, and thumb up.' },
  { id: 'five',       title: 'Five',       category: 'Numbers',   difficulty: 'Easy',   emoji: '5️⃣', videoURL: '', description: 'Open hand, all five fingers spread.' },
  { id: 'ten',        title: 'Ten',        category: 'Numbers',   difficulty: 'Easy',   emoji: '🔟', videoURL: '', description: 'Thumb up, shake wrist side to side.' },

  // Colors
  { id: 'blue',       title: 'Blue',       category: 'Colors',    difficulty: 'Easy',   emoji: '🔵', videoURL: '', description: 'B-handshape twists at wrist.' },
  { id: 'red',        title: 'Red',        category: 'Colors',    difficulty: 'Easy',   emoji: '🔴', videoURL: '', description: 'Index finger brushes down lips.' },
  { id: 'green',      title: 'Green',      category: 'Colors',    difficulty: 'Easy',   emoji: '🟢', videoURL: '', description: 'G-handshape twists at wrist.' },
];


// ── Learning Paths ────────────────────────────────────────────────────────────
const LEARNING_PATHS = [
  { id: 'basics',  title: 'Khởi đầu ASL',        description: 'Học chào hỏi và giao tiếp cơ bản', icon: '👋', order: 1, totalXP: 300, lessonCount: 7 },
  { id: 'daily',   title: 'Cuộc sống hàng ngày',  description: 'Các từ vựng dùng mỗi ngày',        icon: '🌅', order: 2, totalXP: 400, lessonCount: 6 },
  { id: 'family',  title: 'Gia đình & Bạn bè',    description: 'Từ vựng về người thân',            icon: '👨‍👩‍👧', order: 3, totalXP: 250, lessonCount: 4 },
  { id: 'numbers', title: 'Số đếm',               description: 'Học đếm số bằng tay',              icon: '🔢', order: 4, totalXP: 200, lessonCount: 5 },
  { id: 'colors',  title: 'Màu sắc',              description: 'Phân biệt màu qua ký hiệu',        icon: '🎨', order: 5, totalXP: 150, lessonCount: 3 },
];

// ── Lesson mapping ────────────────────────────────────────────────────────────
const PATH_LESSONS = {
  basics:  ['hello', 'goodbye', 'please', 'thankyou', 'sorry', 'yes', 'no'],
  daily:   ['eat', 'drink', 'sleep', 'work', 'school', 'home'],
  family:  ['mother', 'father', 'baby', 'friend'],
  numbers: ['one', 'two', 'three', 'five', 'ten'],
  colors:  ['blue', 'red', 'green'],
};

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seedAll() {
  const now = Date.now();
  console.log('🌱 Starting Firestore seed (signbridge-3e7b9)...\n');
  console.log('📌 Strategy: Local Assets — videoKey only (no YouTube URLs)\n');

  // Signs
  const batch1 = writeBatch(db);
  for (const sign of SIGNS) {
    const ref = doc(db, 'dictionary', sign.id);
    batch1.set(ref, {
      id:          sign.id,
      title:       sign.title,
      category:    sign.category,
      difficulty:  sign.difficulty,
      emoji:       sign.emoji,
      videoKey:    sign.videoKey,   // ← used by videoMap.ts in app
      description: sign.description,
      keywords:    [sign.title.toLowerCase(), sign.category.toLowerCase()],
      createdAt:   now,
    });
  }
  await batch1.commit();
  console.log(`✅ ${SIGNS.length} signs seeded → dictionary/`);

  // Learning Paths
  const batch2 = writeBatch(db);
  for (const path of LEARNING_PATHS) {
    const ref = doc(db, 'learningPaths', path.id);
    batch2.set(ref, { ...path, createdAt: now });
  }
  await batch2.commit();
  console.log(`✅ ${LEARNING_PATHS.length} paths seeded → learningPaths/`);

  // Lessons
  const batch3 = writeBatch(db);
  for (const [pathId, signIds] of Object.entries(PATH_LESSONS)) {
    signIds.forEach((signId, i) => {
      const lessonId = `${pathId}_${i + 1}`;
      const sign = SIGNS.find(s => s.id === signId);
      const ref = doc(db, 'learningPaths', pathId, 'lessons', lessonId);
      batch3.set(ref, {
        id:       lessonId,
        pathId,
        title:    sign ? sign.title : signId,
        signId,
        order:    i + 1,
        xpReward: 30,
        type:     'video',
        createdAt: now,
      });
    });
  }
  await batch3.commit();
  console.log('✅ Lessons seeded for all paths');

  console.log('\n🎉 Done! Firestore is ready. Run: npx expo start --android');
  process.exit(0);
}

seedAll().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
