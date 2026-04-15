/**
 * Translation Service — translates words from one language to another.
 *
 * CURRENT: Mock implementation using a static English → Arabic dictionary.
 * REAL: Replace `translateWords` body with Google Cloud Translation API calls.
 *
 * To plug in real Google Translate:
 * 1. Install: pnpm add @google-cloud/translate
 * 2. Set env: GOOGLE_CLOUD_API_KEY=your-key or GOOGLE_APPLICATION_CREDENTIALS
 * 3. Replace mock below with:
 *    const { Translate } = require('@google-cloud/translate').v2;
 *    const translate = new Translate({ key: process.env.GOOGLE_CLOUD_API_KEY });
 *    const [translations] = await translate.translate(texts, { from, to });
 */

import { logger } from "../lib/logger.js";

export interface TranslatedWord {
  original: string;
  translation: string;
  pronunciation: string; // phonetic English spelling of Arabic
}

// ──────────────────────────────────────────────────────────────────────────────
// MOCK DICTIONARY — English → Arabic
// Extend this or replace with real API
// ──────────────────────────────────────────────────────────────────────────────
const EN_AR_DICTIONARY: Record<string, { ar: string; phonetic: string }> = {
  wait: { ar: "انتظر", phonetic: "intazir" },
  please: { ar: "من فضلك", phonetic: "min fadlak" },
  stop: { ar: "توقف", phonetic: "tawaqaf" },
  running: { ar: "يجري", phonetic: "yajri" },
  help: { ar: "مساعدة", phonetic: "musa'ada" },
  need: { ar: "أحتاج", phonetic: "ahtaj" },
  where: { ar: "أين", phonetic: "ayna" },
  did: { ar: "فعل", phonetic: "fa'ala" },
  you: { ar: "أنت", phonetic: "anta" },
  go: { ar: "اذهب", phonetic: "idhab" },
  come: { ar: "تعال", phonetic: "ta'al" },
  back: { ar: "عودة", phonetic: "'awda" },
  strong: { ar: "قوي", phonetic: "qawi" },
  power: { ar: "قوة", phonetic: "quwwa" },
  world: { ar: "عالم", phonetic: "'alam" },
  dream: { ar: "حلم", phonetic: "hulm" },
  fight: { ar: "قاتل", phonetic: "qatil" },
  believe: { ar: "صدق", phonetic: "saddaq" },
  in: { ar: "في", phonetic: "fi" },
  yourself: { ar: "نفسك", phonetic: "nafsak" },
  never: { ar: "أبدا", phonetic: "abadan" },
  give: { ar: "أعطي", phonetic: "a'ti" },
  up: { ar: "فوق", phonetic: "fawq" },
};

/**
 * Translate an array of words from sourceLang to targetLang.
 * Returns a map of original word → translation result.
 */
export async function translateWords(
  words: string[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, TranslatedWord>> {
  logger.info({ count: words.length, sourceLang, targetLang }, "Translating words");

  const result = new Map<string, TranslatedWord>();

  // ──────────────────────────────────────────────────────────────────────────
  // MOCK TRANSLATION — lookup from static dictionary
  // Replace this entire block with Google Translate API calls
  // ──────────────────────────────────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 50)); // simulate async

  for (const word of words) {
    const key = word.toLowerCase();
    const entry = EN_AR_DICTIONARY[key];

    if (entry) {
      result.set(word, {
        original: word,
        translation: entry.ar,
        pronunciation: entry.phonetic,
      });
    } else {
      // Fallback: mark as untranslated but still include it
      result.set(word, {
        original: word,
        translation: `[${word}]`,
        pronunciation: word,
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  return result;
}
