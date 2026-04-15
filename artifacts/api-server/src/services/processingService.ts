/**
 * Processing Service — orchestrates the full pipeline for a batch of images.
 *
 * Pipeline per image:
 * 1. Upload image to Cloudinary → get URL
 * 2. Run OCR on URL → get words + positions
 * 3. Filter noise from OCR results
 * 4. Translate filtered words
 * 5. Build ImageResult with all data
 */

import { uploadImage } from "./cloudinaryService.js";
import { runOCR, filterWords } from "./ocrService.js";
import { translateWords } from "./translationService.js";
import { getSession, updateSession, type ImageResult } from "./sessionStore.js";
import { logger } from "../lib/logger.js";

export interface ChunkItem {
  imageIndex: number;   // global order in episode (0-based)
  base64: string;       // base64-encoded image data (with or without data URI prefix)
}

/**
 * Process a single chunk of images.
 * Updates the session store as each image is processed.
 * This runs async — the client polls /status for progress.
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
    // Update status to processing when we start the first chunk
    if (session.status === "pending") {
      updateSession(sessionId, { status: "processing" });
    }

    // Process each image in the chunk sequentially
    for (const item of items) {
      const { imageIndex, base64 } = item;

      logger.info({ sessionId, imageIndex }, "Processing image");

      // Step 1: Upload image to get a URL for OCR
      const imageUrl = await uploadImage(base64, sessionId, imageIndex);

      // Step 2: Run OCR to get raw text + bounding boxes
      const rawWords = await runOCR(imageUrl, imageIndex);

      // Step 3: Filter out noise (single chars, numbers, etc.)
      const filtered = filterWords(rawWords);

      // Step 4: Translate all unique words
      const uniqueTexts = [...new Set(filtered.map((w) => w.text))];
      const translations = await translateWords(uniqueTexts, sourceLang, targetLang);

      // Step 5: Build structured WordResult array
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

      // Build result for this image
      const imageResult: ImageResult = {
        imageIndex,
        imageUrl,
        words,
      };

      // Append result and increment counter in session
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
 * Marks it complete once all images have been processed.
 */
export function finalizeSession(sessionId: string): void {
  const session = getSession(sessionId);
  if (!session) return;

  // If all images are processed, mark complete
  if (session.processedImages >= session.totalImages) {
    updateSession(sessionId, { status: "complete" });
    logger.info({ sessionId }, "Session finalized — all images processed");
  } else {
    // Still processing — will be checked again when more chunks arrive
    logger.info(
      { sessionId, processed: session.processedImages, total: session.totalImages },
      "Session not yet complete — more chunks expected"
    );
  }
}
