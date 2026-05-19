/**
 * SIGNBRIDGE — YouTube Video Resolver
 *
 * Dùng YouTube Data API v3 để tìm video ASL thật
 * Free quota: 10,000 units/ngày (100 searches/ngày)
 * Kết quả được cache vào Firestore → không lặp lại request
 */

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Cấu hình ─────────────────────────────────────────────────────
// Lấy API key từ: https://console.cloud.google.com → YouTube Data API v3
// Đặt vào .env hoặc thay trực tiếp cho dev
const YT_API_KEY = process.env.EXPO_PUBLIC_YT_API_KEY ?? '';
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

// Cache in-memory trong session
const sessionCache: Record<string, string | null> = {};

// ─── Tìm videoId tốt nhất cho 1 sign ──────────────────────────────
export async function resolveSignVideoId(signId: string, signTitle: string): Promise<string | null> {
  // 1. Kiểm tra session cache
  if (signId in sessionCache) return sessionCache[signId];

  // 2. Kiểm tra Firestore cache
  try {
    const snap = await getDoc(doc(db, 'dictionary', signId));
    if (snap.exists()) {
      const data = snap.data();
      // Nếu đã có videoId thật (được resolve trước), dùng luôn
      if (data.resolvedVideoId) {
        sessionCache[signId] = data.resolvedVideoId;
        return data.resolvedVideoId;
      }
    }
  } catch {
    // ignore, proceed to search
  }

  // 3. Không có API key → không search được
  if (!YT_API_KEY) {
    console.warn('[youtube] YT_API_KEY chưa cấu hình');
    return null;
  }

  // 4. Gọi YouTube Search API
  try {
    const query = `${signTitle} ASL American Sign Language`;
    const params = new URLSearchParams({
      key: YT_API_KEY,
      part: 'snippet',
      q: query,
      type: 'video',
      videoDuration: 'short',     // video ngắn (<4 phút)
      videoDefinition: 'high',    // HD
      relevanceLanguage: 'en',
      maxResults: '1',
    });

    const res = await fetch(`${YT_SEARCH_URL}?${params}`);
    const json = await res.json();

    if (json.items && json.items.length > 0) {
      const videoId: string = json.items[0].id.videoId;

      // Cache lên Firestore (permanent)
      try {
        await updateDoc(doc(db, 'dictionary', signId), {
          resolvedVideoId: videoId,
          resolvedAt: Date.now(),
        });
      } catch {
        // Nếu doc không tồn tại, dùng setDoc
        await setDoc(doc(db, 'dictionary', signId), {
          resolvedVideoId: videoId,
          resolvedAt: Date.now(),
        }, { merge: true });
      }

      sessionCache[signId] = videoId;
      return videoId;
    }
  } catch (err) {
    console.error('[youtube] Search error:', err);
  }

  sessionCache[signId] = null;
  return null;
}

// ─── Resolve tất cả signs trong batch (gọi 1 lần lúc startup) ─────
export async function resolveAllVideoIds(signs: Array<{ id: string; title: string }>) {
  const results: Record<string, string | null> = {};
  for (const sign of signs) {
    // Delay 100ms giữa mỗi call để không spam API
    await new Promise(r => setTimeout(r, 100));
    results[sign.id] = await resolveSignVideoId(sign.id, sign.title);
  }
  return results;
}
