/**
 * Processing Service — orchestrates the full pipeline for a batch of images.
 */

import { uploadImage } from "./cloudinaryService.js";
import { runOCR, filterWords } from "./ocrService.js";
import { translateWords } from "./translationService.js";
import { getSession, updateSession, type ImageResult } from "./sessionStore.js";
import { logger } from "../lib/logger.js";

export interface ChunkItem {
  imageIndex: number;   // global order in episode (0-based)
  base64: string;       // base64-encoded image data
}

/**
 * Process a single chunk of images.
 * Updates the session store as each image is processed.
 */
export async function processChunk(
  sessionId: string,
  items: ChunkItem[]
): Promise<void> {
  const session = getSession(sessionId);
  if (!session) {
    logger.warn({ sessionId }, "processChunk: session not found");
    return;
  }

  const { sourceLang, targetLang } = session;

  try {
    if (session.status === "pending") {
      updateSession(sessionId, { status: "processing" });
    }

    // ── STEP 1: Upload all images in chunk to Cloudinary ────────────────────
    const uploads: Array<{ index: number; url: string }> = [];
    for (const item of items) {
      logger.info({ sessionId, index: item.imageIndex }, "Uploading image to Cloudinary");
      const url = await uploadImage(item.base64, sessionId, item.imageIndex);
      uploads.push({ index: item.imageIndex, url });
    }

    // ── STEP 2: Call OCR provider with batch of URLs ────────────────────────
    const imageUrls = uploads.map(u => u.url);
    const ocrResultsBatch = await runOCR(imageUrls);

    // ── STEP 3: Process OCR results for each image ──────────────────────────
    for (let i = 0; i < uploads.length; i++) {
      const { index: imageIndex, url: imageUrl } = uploads[i];
      const rawWords = ocrResultsBatch[i] || [];

      logger.info({ sessionId, imageIndex, wordCount: rawWords.length }, "Processing OCR results");

      // Filter noise
      const filtered = filterWords(rawWords);

      // Translate unique words
      const uniqueTexts = [...new Set(filtered.map((w) => w.text))];
      const translations = await translateWords(uniqueTexts, sourceLang, targetLang);

      // Build structured WordResult array
      const words = filtered.map((ocr) => {
        const t = translations.get(ocr.text) ?? {
          original: ocr.text,
          translation: `[${ocr.text}]`,
          pronunciation: ocr.text,
        };
        return {
          word: ocr.text,
          translation: t.translation,
          pronunciation: t.pronunciation,
          boundingBox: {
            x: ocr.x,
            y: ocr.y,
            width: ocr.width,
            height: ocr.height,
          },
        };
      });

      // Append result to session
      const imageResult: ImageResult = {
        imageIndex,
        imageUrl,
        words,
      };

      const current = getSession(sessionId);
      if (current) {
        updateSession(sessionId, {
          results: [...current.results, imageResult],
          processedImages: current.processedImages + 1,
        });
      }
    }
  } catch (err) {
    logger.error({ sessionId, err }, "Error processing chunk");
    updateSession(sessionId, {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Finalize a session after all chunks are uploaded.
 */
export function finalizeSession(sessionId: string): void {
  const session = getSession(sessionId);
  if (!session) return;

  if (session.processedImages >= session.totalImages) {
    updateSession(sessionId, { status: "complete" });
    logger.info({ sessionId }, "Session finalized — all images processed");
  } else {
    logger.info(
      { sessionId, processed: session.processedImages, total: session.totalImages },
      "Session not yet complete — more chunks expected"
    );
  }
}
