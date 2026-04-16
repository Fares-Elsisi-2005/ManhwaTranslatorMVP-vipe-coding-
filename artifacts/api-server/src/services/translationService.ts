/**
 * Translation Service — translates words.
 * 
 * Contains both REAL (Google Translate) and MOCK implementations.
 * Active implementation: MOCK (until billing is fixed).
 */

import { Translate } from "@google-cloud/translate/build/src/v2/index.js";
import { logger } from "../lib/logger.js";

export interface TranslatedWord {
  original: string;
  translation: string;
  pronunciation: string;
}

/* ──────────────────────────────────────────────────────────────────────────────
   REAL IMPLEMENTATION (GOOGLE TRANSLATE) - COMMENTED OUT
   ──────────────────────────────────────────────────────────────────────────────

function getTranslateClient(): Translate {
  const jsonStr = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"];
  if (!jsonStr) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(jsonStr);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  return new Translate({
    credentials,
    projectId: (credentials as { project_id?: string }).project_id,
  });
}

export async function translateWords_REAL(
  words: string[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, TranslatedWord>> {
  logger.info({ count: words.length, sourceLang, targetLang }, "Translating words with Google Translate");

  const result = new Map<string, TranslatedWord>();
  if (words.length === 0) return result;

  const client = getTranslateClient();
  const [translations] = await client.translate(words, {
    from: sourceLang,
    to: targetLang,
  });

  const translationsArray = Array.isArray(translations) ? translations : [translations];

  for (let i = 0; i < words.length; i++) {
    const original = words[i];
    const translation = translationsArray[i] ?? original;
    const pronunciation = original;
    result.set(original, { original, translation, pronunciation });
  }
  return result;
}
*/

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK IMPLEMENTATION (ACTIVE)
   ────────────────────────────────────────────────────────────────────────────── */

export async function translateWords(
  words: string[],
  sourceLang: string,
  targetLang: string
): Promise<Map<string, TranslatedWord>> {
  logger.info({ count: words.length, sourceLang, targetLang }, "Running MOCK Translation");

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  const result = new Map<string, TranslatedWord>();

  for (const original of words) {
    // Return a fake Arabic-looking string or prefix
    const translation = `[AR] ${original}`;
    const pronunciation = original; // simplified for mock

    result.set(original, { original, translation, pronunciation });
  }

  logger.info({ count: result.size }, "Mock Translation complete");
  return result;
}
