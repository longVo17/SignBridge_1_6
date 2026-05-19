/**
 * SIGNBRIDGE — Firestore Seed Script
 * 
 * Cách chạy:
 *   1. npm install -g ts-node (nếu chưa có)
 *   2. cd SignBridgeApp
 *   3. npx ts-node scripts/seedFirestore.ts
 * 
 * Script này tạo 30 ký hiệu ASL vào Firestore.
 * Video: YouTube embed từ WLASL dataset (không cần upload file)
 * Chạy 1 lần duy nhất!
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

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

// ────────────────────────────────────────────────────────────────
// 30 ASL Signs từ WLASL-100 dataset
// videoId: YouTube video ID (embed URL: youtube.com/watch?v=<videoId>)
// ────────────────────────────────────────────────────────────────
const SIGNS = [
  // ── Greetings ─────────────────────────────────────────────────
  { id: 'hello',     title: 'Hello',     category: 'Greetings', difficulty: 'Easy',   emoji: '👋', videoId: 'lj_LKBQJ1Pk', description: 'Open hand, wave side to side from forehead.' },
  { id: 'goodbye',   title: 'Goodbye',   category: 'Greetings', difficulty: 'Easy',   emoji: '🤚', videoId: 'DkODLAiC7IY', description: 'Wave hand back and forth.' },
  { id: 'please',    title: 'Please',    category: 'Greetings', difficulty: 'Easy',   emoji: '🙏', videoId: 'U3Ld9POAYQ0', description: 'Flat hand on chest, circular motion.' },
  { id: 'thankyou',  title: 'Thank You', category: 'Greetings', difficulty: 'Easy',   emoji: '🤲', videoId: 'R7a8CCpLVi4', description: 'Fingers touch chin, move forward.' },
  { id: 'sorry',     title: 'Sorry',     category: 'Greetings', difficulty: 'Easy',   emoji: '😔', videoId: 'LVkHaqMpkVE', description: 'Fist on chest, circular motion.' },
  { id: 'yes',       title: 'Yes',       category: 'Greetings', difficulty: 'Easy',   emoji: '✅', videoId: 'xpNaHC8XGd8', description: 'Fist nods up and down like a head nodding.' },
  { id: 'no',        title: 'No',        category: 'Greetings', difficulty: 'Easy',   emoji: '❌', videoId: 'H3PO7RL4bZY', description: 'Index and middle finger snap closed against thumb.' },

  // ── Basic Communication ────────────────────────────────────────
  { id: 'help',      title: 'Help',      category: 'Basics',    difficulty: 'Easy',   emoji: '🆘', videoId: 'pLHDaKjknLs', description: 'Thumb up hand lifts flat hand.' },
  { id: 'want',      title: 'Want',      category: 'Basics',    difficulty: 'Easy',   emoji: '🙋', videoId: 'BHTMjHkx0sE', description: 'Claw hands pull toward body.' },
  { id: 'need',      title: 'Need',      category: 'Basics',    difficulty: 'Medium', emoji: '📌', videoId: 'seLqgbZ-Zso', description: 'Bent index finger bends down repeatedly.' },
  { id: 'understand',title: 'Understand',category: 'Basics',    difficulty: 'Medium', emoji: '💡', videoId: 'AlGqFAGWVo0', description: 'Index flicks up from forehead.' },
  { id: 'like',      title: 'Like',      category: 'Basics',    difficulty: 'Easy',   emoji: '👍', videoId: '7vfz7rBQ3fQ', description: 'Middle finger and thumb pinch together from chest, moving outward.' },

  // ── Daily Activities ───────────────────────────────────────────
  { id: 'eat',       title: 'Eat',       category: 'Daily',     difficulty: 'Easy',   emoji: '🍽️', videoId: 'QoqhkWvKMbk', description: 'Flat fingers tap mouth repeatedly.' },
  { id: 'drink',     title: 'Drink',     category: 'Daily',     difficulty: 'Easy',   emoji: '🥤', videoId: 'v-Bpb4UcFiA', description: 'C-shaped hand tilts toward mouth.' },
  { id: 'sleep',     title: 'Sleep',     category: 'Daily',     difficulty: 'Easy',   emoji: '😴', videoId: 'h7IiMjWlVGo', description: 'Hand drops from forehead and fingers close.' },
  { id: 'work',      title: 'Work',      category: 'Daily',     difficulty: 'Medium', emoji: '💼', videoId: '6rN8S_KHPSU', description: 'Fists tap together at wrists.' },
  { id: 'school',    title: 'School',    category: 'Daily',     difficulty: 'Easy',   emoji: '🏫', videoId: 'Q7Fg21dUq30', description: 'Flat hands clap twice.' },
  { id: 'home',      title: 'Home',      category: 'Daily',     difficulty: 'Easy',   emoji: '🏠', videoId: 'GUZhFjkiWvE', description: 'Fingers together tap cheek then side of cheek.' },

  // ── Family ────────────────────────────────────────────────────
  { id: 'mother',    title: 'Mother',    category: 'Family',    difficulty: 'Easy',   emoji: '👩', videoId: 'SuCqIVPiKQs', description: 'Open hand, thumb touches chin.' },
  { id: 'father',    title: 'Father',    category: 'Family',    difficulty: 'Easy',   emoji: '👨', videoId: 'GPzl3ZDi9EI', description: 'Open hand, thumb touches forehead.' },
  { id: 'baby',      title: 'Baby',      category: 'Family',    difficulty: 'Easy',   emoji: '👶', videoId: 'v7LGQ2tWbW8', description: 'Arms cradle and rock like holding a baby.' },
  { id: 'friend',    title: 'Friend',    category: 'Family',    difficulty: 'Easy',   emoji: '🤝', videoId: 'YgZ5JN5JQCQ', description: 'Index fingers hook together and swap positions.' },

  // ── Numbers ───────────────────────────────────────────────────
  { id: 'one',       title: 'One',       category: 'Numbers',   difficulty: 'Easy',   emoji: '1️⃣', videoId: 'MDtCCJ_-M_I', description: 'Index finger points up.' },
  { id: 'two',       title: 'Two',       category: 'Numbers',   difficulty: 'Easy',   emoji: '2️⃣', videoId: 'MDtCCJ_-M_I', description: 'Index and middle fingers up (V shape).' },
  { id: 'three',     title: 'Three',     category: 'Numbers',   difficulty: 'Easy',   emoji: '3️⃣', videoId: 'MDtCCJ_-M_I', description: 'Index, middle, and thumb up.' },
  { id: 'five',      title: 'Five',      category: 'Numbers',   difficulty: 'Easy',   emoji: '5️⃣', videoId: 'MDtCCJ_-M_I', description: 'Open hand, all five fingers spread.' },
  { id: 'ten',       title: 'Ten',       category: 'Numbers',   difficulty: 'Easy',   emoji: '🔟', videoId: 'MDtCCJ_-M_I', description: 'Thumb up, shake wrist side to side.' },

  // ── Colors ────────────────────────────────────────────────────
  { id: 'blue',      title: 'Blue',      category: 'Colors',    difficulty: 'Easy',   emoji: '🔵', videoId: 'BoLqK5d9VqY', description: 'B-handshape twists at wrist.' },
  { id: 'red',       title: 'Red',       category: 'Colors',    difficulty: 'Easy',   emoji: '🔴', videoId: 'BoLqK5d9VqY', description: 'Index finger brushes down lips.' },
  { id: 'green',     title: 'Green',     category: 'Colors',    difficulty: 'Easy',   emoji: '🟢', videoId: 'BoLqK5d9VqY', description: 'G-handshape twists at wrist.' },
];

// Learning Paths
const LEARNING_PATHS = [
  { id: 'basics',    title: 'Khởi đầu ASL',     description: 'Học chào hỏi và giao tiếp cơ bản', icon: '👋', order: 1, totalXP: 300, lessonCount: 7  },
  { id: 'daily',     title: 'Cuộc sống hàng ngày', description: 'Các từ vựng dùng mỗi ngày',    icon: '🌅', order: 2, totalXP: 400, lessonCount: 6  },
  { id: 'family',    title: 'Gia đình & Bạn bè', description: 'Từ vựng về người thân',          icon: '👨‍👩‍👧', order: 3, totalXP: 250, lessonCount: 4  },
  { id: 'numbers',   title: 'Số đếm',            description: 'Học đếm số bằng tay',            icon: '🔢', order: 4, totalXP: 200, lessonCount: 5  },
  { id: 'colors',    title: 'Màu sắc',            description: 'Phân biệt màu qua ký hiệu',      icon: '🎨', order: 5, totalXP: 150, lessonCount: 3  },
];

async function seedSigns() {
  console.log('🌱 Seeding 30 signs to Firestore...');
  const batch = writeBatch(db);
  const now = Date.now();

  for (const sign of SIGNS) {
    const ref = doc(db, 'dictionary', sign.id);
    batch.set(ref, {
      ...sign,
      keywords: [sign.title.toLowerCase(), sign.category.toLowerCase()],
      videoURL: `https://www.youtube.com/watch?v=${sign.videoId}`,
      thumbnailURL: `https://img.youtube.com/vi/${sign.videoId}/hqdefault.jpg`,
      createdAt: now,
    });
  }

  await batch.commit();
  console.log(`✅ ${SIGNS.length} signs seeded!`);
}

async function seedPaths() {
  console.log('🌱 Seeding learning paths...');
  const batch = writeBatch(db);
  const now = Date.now();

  for (const path of LEARNING_PATHS) {
    const ref = doc(db, 'learningPaths', path.id);
    batch.set(ref, { ...path, createdAt: now });
  }

  await batch.commit();
  console.log(`✅ ${LEARNING_PATHS.length} paths seeded!`);
}

async function seedLessons() {
  console.log('🌱 Seeding lessons...');
  const batch = writeBatch(db);

  // Basics path lessons
  const basicsLessons = ['hello', 'goodbye', 'please', 'thankyou', 'sorry', 'yes', 'no'];
  basicsLessons.forEach((signId, i) => {
    const ref = doc(db, 'learningPaths', 'basics', 'lessons', `basics_${i + 1}`);
    const sign = SIGNS.find(s => s.id === signId)!;
    batch.set(ref, { id: `basics_${i + 1}`, pathId: 'basics', title: sign.title, signId, order: i + 1, xpReward: 30, type: 'video' });
  });

  // Daily path lessons
  const dailyLessons = ['eat', 'drink', 'sleep', 'work', 'school', 'home'];
  dailyLessons.forEach((signId, i) => {
    const ref = doc(db, 'learningPaths', 'daily', 'lessons', `daily_${i + 1}`);
    const sign = SIGNS.find(s => s.id === signId)!;
    batch.set(ref, { id: `daily_${i + 1}`, pathId: 'daily', title: sign.title, signId, order: i + 1, xpReward: 40, type: 'video' });
  });

  // Family path lessons
  const familyLessons = ['mother', 'father', 'baby', 'friend'];
  familyLessons.forEach((signId, i) => {
    const ref = doc(db, 'learningPaths', 'family', 'lessons', `family_${i + 1}`);
    const sign = SIGNS.find(s => s.id === signId)!;
    batch.set(ref, { id: `family_${i + 1}`, pathId: 'family', title: sign.title, signId, order: i + 1, xpReward: 30, type: 'video' });
  });

  await batch.commit();
  console.log('✅ Lessons seeded!');
}

async function main() {
  try {
    await seedSigns();
    await seedPaths();
    await seedLessons();
    console.log('\n🎉 All done! Firestore is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();
