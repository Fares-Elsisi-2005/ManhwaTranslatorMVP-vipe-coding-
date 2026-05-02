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
 * Batches words in chunks to reduce number of requests and avoid rate limits.
 */
export async function translateWords(
  words: string[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, TranslatedWord>> {
  
  logger.info({ count: words.length, sourceLang, targetLang }, "Translating words via Google GTX (Batched)");

  const result = new Map<string, TranslatedWord>();
  if (words.length === 0) return result;

  // Split words into chunks of 25 to avoid URL length limits and too much merging
  const CHUNK_SIZE = 25;
  const wordChunks: string[][] = [];
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    wordChunks.push(words.slice(i, i + CHUNK_SIZE));
  }

  try {
    for (let i = 0; i < wordChunks.length; i++) {
      const chunk = wordChunks[i];
      
      try {
        // Stagger chunk requests slightly
        if (i > 0) await new Promise(r => setTimeout(r, 200));

        // Join words with newlines for batch translation
        const query = chunk.join("\n");
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        
        // Google GTX response format for multiple lines:
        // The first element is an array of segments. 
        // We need to join the translations of all segments.
        const fullTranslation = data[0].map((segment: any[]) => segment[0]).join("");
        const translatedLines = fullTranslation.split("\n").map((s: string) => s.trim());

        // Map back to original words
        chunk.forEach((original, index) => {
          const translation = translatedLines[index] || original;
          result.set(original, {
            original,
            translation,
            pronunciation: original
          });
        });

      } catch (e) {
        logger.warn({ chunkCount: chunk.length, error: e instanceof Error ? e.message : e }, "Batch translation failed, falling back to dummy");
        chunk.forEach(w => {
          if (!result.has(w)) {
            result.set(w, { original: w, translation: `[${w}]`, pronunciation: w });
          }
        });
      }
    }

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
