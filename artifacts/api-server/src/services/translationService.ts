/**
 * Translation Service — translates words using Google's free unofficial API (GTX).
 * Highly reliable and requires no API key.
 */

import { logger } from "../lib/logger.js";

export interface TranslatedWord {
  original: string;
  translation: string;
  pronunciation: string;
}

/**
 * Translate an array of unique words.
 * Batches words in multiple individual requests if needed.
 */
export async function translateWords(
  words: string[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, TranslatedWord>> {
  
  logger.info({ count: words.length, sourceLang, targetLang }, "Translating words via Google GTX");

  const result = new Map<string, TranslatedWord>();
  if (words.length === 0) return result;

  try {
    // Process words in parallel with small delay to avoid rate limits
    await Promise.all(words.map(async (word, index) => {
      try {
        // Add a small staggered delay
        await new Promise(r => setTimeout(r, index * 50));

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(word)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        // Google GTX response format: [[["translation", "original", ...]], ...]
        const translation = data[0][0][0] || word;

        result.set(word, {
          original: word,
          translation: translation,
          pronunciation: word
        });
      } catch (e) {
        logger.warn({ word, error: e instanceof Error ? e.message : e }, "Individual word translation failed");
        result.set(word, { original: word, translation: `[${word}]`, pronunciation: word });
      }
    }));

    logger.info({ count: result.size }, "Translation complete");
    return result;

  } catch (err) {
    logger.error({ err }, "Translation pipeline major failure");
    // Global fallback
    for (const word of words) {
      if (!result.has(word)) {
        result.set(word, { original: word, translation: `[${word}]`, pronunciation: word });
      }
    }
    return result;
  }
}
