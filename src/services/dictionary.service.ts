import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Sign } from '../types/data.types';

// ─── Get all signs, optionally filter by category ────────────────
export async function getSignsByCategory(category?: string): Promise<Sign[]> {
  try {
    const col = collection(db, 'dictionary');
    const q = category
      ? query(col, where('category', '==', category), orderBy('title'))
      : query(col, orderBy('title'));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Sign));
  } catch (err) {
    console.error('[dictionary.service] getSignsByCategory:', err);
    return [];
  }
}

// ─── Full-text search (client-side filter since Firestore has no LIKE) ──
export async function searchSigns(queryStr: string): Promise<Sign[]> {
  if (!queryStr.trim()) return [];
  const all = await getSignsByCategory();
  const lower = queryStr.toLowerCase();
  return all.filter(
    s =>
      s.title.toLowerCase().includes(lower) ||
      s.category.toLowerCase().includes(lower) ||
      s.keywords?.some(k => k.includes(lower))
  );
}

// ─── Get single sign by ID ────────────────────────────────────────
export async function getSignById(id: string): Promise<Sign | null> {
  try {
    const snap = await getDoc(doc(db, 'dictionary', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Sign;
  } catch (err) {
    console.error('[dictionary.service] getSignById:', err);
    return null;
  }
}

// ─── Get 3 random daily signs (seeded by date) ───────────────────
export async function getDailySigns(): Promise<Sign[]> {
  try {
    const col = collection(db, 'dictionary');
    const q = query(col, limit(30));
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sign));

    // Deterministic daily shuffle using today's date as seed
    const today = new Date().toDateString();
    let seed = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const shuffled = [...all].sort(() => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed / 2147483647) - 0.5;
    });
    return shuffled.slice(0, 3);
  } catch (err) {
    console.error('[dictionary.service] getDailySigns:', err);
    return [];
  }
}

// ─── Get all unique categories ────────────────────────────────────
export async function getCategories(): Promise<string[]> {
  const signs = await getSignsByCategory();
  return [...new Set(signs.map(s => s.category))].sort();
}
