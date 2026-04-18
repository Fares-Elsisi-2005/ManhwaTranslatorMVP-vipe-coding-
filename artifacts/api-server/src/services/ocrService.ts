/**
 * OCR Service — extracts text and bounding boxes from images.
 * 
 * Uses standalone OCR provider at OCR_PROVIDER_URL.
 */

import { logger } from "../lib/logger.js";

export interface OCRWord {
  text: string;
  x: number;       // left offset in pixels
  y: number;       // top offset in pixels
  width: number;       // width in pixels
  height: number;      // height in pixels
}

/**
 * Run OCR on a batch of image URLs.
 * Max 3 images per request (provider limit).
 * Returns an array of word lists, one for each image.
 */
export async function runOCR(imageUrls: string[]): Promise<OCRWord[][]> {
  const url = process.env["OCR_PROVIDER_URL"] || "http://localhost:3000/ocr";
  
  logger.info({ count: imageUrls.length, url }, "Calling OCR provider");

  if (imageUrls.length > 3) {
    throw new Error("OCR provider limit exceeded: max 3 images allowed per request");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: imageUrls }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    logger.error({ status: response.status, errorBody }, "OCR provider request failed");
    throw new Error(`OCR provider failed with status ${response.status}`);
  }

  const data = await response.json() as { results: Array<{ words: OCRWord[] }> };
  
  logger.info({ resultCount: data.results?.length }, "OCR provider response received");

  return data.results.map(r => r.words);
}

/**
 * Filter out noise from OCR results.
 * Keeps only alphabetic English words with 2+ characters.
 */
export function filterWords(words: OCRWord[]): OCRWord[] {
  return words.filter((w) => {
    // Basic cleanup for English characters
    const cleaned = w.text.trim().replace(/[^a-zA-Z]/g, "");
    return cleaned.length >= 2;
  }).map((w) => ({
    ...w,
    // Strip punctuation from the word text itself
    text: w.text.replace(/[^a-zA-Z'-]/g, "").trim(),
  })).filter((w) => w.text.length >= 2);
}
