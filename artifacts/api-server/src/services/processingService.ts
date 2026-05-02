/**
 * Processing Service — orchestrates the full pipeline for a batch of images.
 */

import { uploadImage } from "./cloudinaryService.js";
import { runOCR, filterWords } from "./ocrService.js";
import { translateWords } from "./translationService.js";
import { getSession, updateSession, appendResult, type ImageResult } from "./sessionStore.js";
import { logger } from "../lib/logger.js";

export interface ChunkItem {
  imageIndex: number;   // global order in episode (0-based)
  base64: string;       // base64-encoded image data
}

const sessionQueues = new Map<string, Promise<void>>();

/**
 * Process a single chunk of images.
 * Updates the session store as each image is processed.
 */
export async function processChunk(
  sessionId: string,
  items: ChunkItem[]
): Promise<void> {
  const prev = sessionQueues.get(sessionId) ?? Promise.resolve();
  const next = prev
    .then(() => _processChunkInternal(sessionId, items))
    .catch((err) => {
      logger.error({ sessionId, err }, "Error processing chunk in queue");
      updateSession(sessionId, { status: "error", error: err.message });
    });
  
  sessionQueues.set(sessionId, next.catch(() => {}));
  return next;
}

async function _processChunkInternal(
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

    // Filter out invalid base64 items
    const validItems = items.filter(item => item.base64 && item.base64.length > 10);
    if (validItems.length === 0) {
      logger.warn({ sessionId }, "All items in chunk are invalid base64");
      return;
    }

    // ── STEP 1: Upload all images in chunk to Cloudinary ────────────────────
    const uploads: Array<{ index: number; url: string }> = [];
    for (const item of validItems) {
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
      const filtered = filterWords(rawWords, sourceLang);

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

      appendResult(sessionId, imageResult);
    }
  } catch (err) {
    logger.error({ sessionId, err }, "Error processing chunk internal");
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
    sessionQueues.delete(sessionId);
  } else {
    logger.info(
      { sessionId, processed: session.processedImages, total: session.totalImages },
      "Session not yet complete — more chunks expected"
    );
  }
}

