/**
 * IndexedDB cache for episode results.
 * Cache key = episodeUrl + sourceLang + targetLang
 * On revisit, load from cache instead of reprocessing.
 */

import type { EpisodeResult } from "../types.js";

const DB_NAME = "webtoon-translator";
const DB_VERSION = 1;
const STORE_NAME = "episodes";

interface CachedEntry {
  cacheKey: string;         // episodeUrl|sourceLang|targetLang
  result: EpisodeResult;
  cachedAt: number;         // timestamp ms
}

/** Open (or create) the IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "cacheKey" });
        store.createIndex("cachedAt", "cachedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Build the cache key from episode URL + language pair */
export function buildCacheKey(episodeUrl: string, sourceLang: string, targetLang: string): string {
  // Normalize URL (strip query/hash to avoid duplicates)
  const normalized = episodeUrl.split("?")[0].split("#")[0];
  return `${normalized}|${sourceLang}|${targetLang}`;
}

/** Save an episode result to IndexedDB */
export async function saveResult(result: EpisodeResult): Promise<void> {
  const db = await openDB();
  const cacheKey = buildCacheKey(result.episodeUrl, result.sourceLang, result.targetLang);

  const entry: CachedEntry = {
    cacheKey,
    result,
    cachedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Load a cached episode result from IndexedDB, or null if not found */
export async function loadResult(
  episodeUrl: string,
  sourceLang: string,
  targetLang: string
): Promise<EpisodeResult | null> {
  const db = await openDB();
  const cacheKey = buildCacheKey(episodeUrl, sourceLang, targetLang);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(cacheKey);

    req.onsuccess = () => {
      const entry = req.result as CachedEntry | undefined;
      resolve(entry?.result ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Delete a specific episode result from IndexedDB */
export async function deleteResult(
  episodeUrl: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  const db = await openDB();
  const cacheKey = buildCacheKey(episodeUrl, sourceLang, targetLang);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(cacheKey);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Clear all cached results */
export async function clearAllCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
