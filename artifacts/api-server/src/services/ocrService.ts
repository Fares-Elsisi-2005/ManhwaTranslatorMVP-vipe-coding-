/**
 * OCR Service — extracts text and bounding boxes from images.
 *
 * CURRENT: Mock implementation that returns realistic fake data.
 * REAL: Replace the `runOCR` function body with Google Vision API calls.
 *
 * To plug in real Google Vision:
 * 1. Install: pnpm add @google-cloud/vision
 * 2. Set env: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 * 3. Replace mock below with:
 *    const client = new vision.ImageAnnotatorClient();
 *    const [result] = await client.textDetection(imageUrl);
 *    const annotations = result.textAnnotations || [];
 *    // annotations[0] is full text, rest are individual words
 */

import { logger } from "../lib/logger.js";

export interface OCRWord {
  text: string;
  x: number;         // left offset in pixels
  y: number;         // top offset in pixels
  width: number;
  height: number;
}

/**
 * Extract words and their positions from an image URL.
 * Returns an array of OCR words with bounding boxes.
 */
export async function runOCR(imageUrl: string, imageIndex: number): Promise<OCRWord[]> {
  logger.info({ imageUrl, imageIndex }, "Running OCR on image");

  // ──────────────────────────────────────────────────────────────────────────
  // MOCK OCR — returns realistic Webtoon-style text positions
  // Replace this entire block with real Google Vision API calls
  // ──────────────────────────────────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 100)); // simulate async

  const mockWords: OCRWord[][] = [
    // Image 0 words
    [
      { text: "Wait", x: 120, y: 45, width: 60, height: 22 },
      { text: "please", x: 120, y: 75, width: 80, height: 22 },
      { text: "stop", x: 200, y: 180, width: 55, height: 22 },
      { text: "running", x: 200, y: 210, width: 90, height: 22 },
      { text: "I", x: 155, y: 310, width: 15, height: 22 },
      { text: "need", x: 155, y: 340, width: 60, height: 22 },
      { text: "help", x: 155, y: 370, width: 55, height: 22 },
    ],
    // Image 1 words
    [
      { text: "Where", x: 80, y: 60, width: 75, height: 22 },
      { text: "did", x: 80, y: 90, width: 45, height: 22 },
      { text: "you", x: 80, y: 120, width: 45, height: 22 },
      { text: "go", x: 80, y: 150, width: 35, height: 22 },
      { text: "Come", x: 250, y: 240, width: 70, height: 22 },
      { text: "back", x: 250, y: 270, width: 60, height: 22 },
    ],
    // Image 2 words
    [
      { text: "strong", x: 100, y: 90, width: 80, height: 22 },
      { text: "power", x: 100, y: 120, width: 70, height: 22 },
      { text: "world", x: 100, y: 150, width: 65, height: 22 },
      { text: "dream", x: 180, y: 280, width: 75, height: 22 },
      { text: "fight", x: 180, y: 310, width: 60, height: 22 },
    ],
    // Image 3 words
    [
      { text: "believe", x: 140, y: 55, width: 85, height: 22 },
      { text: "in", x: 140, y: 85, width: 30, height: 22 },
      { text: "yourself", x: 140, y: 115, width: 90, height: 22 },
      { text: "never", x: 90, y: 250, width: 65, height: 22 },
      { text: "give", x: 90, y: 280, width: 55, height: 22 },
      { text: "up", x: 90, y: 310, width: 35, height: 22 },
    ],
  ];

  // Cycle through mock data based on image index
  const words = mockWords[imageIndex % mockWords.length] ?? mockWords[0];
  return words as OCRWord[];
  // ──────────────────────────────────────────────────────────────────────────
}

/**
 * Filter out noise from OCR results.
 * Removes single characters, numbers, and short tokens that aren't useful to translate.
 */
export function filterWords(words: OCRWord[]): OCRWord[] {
  return words.filter((w) => {
    const cleaned = w.text.trim();
    // Keep only alphabetic words with 2+ characters
    return /^[a-zA-Z]{2,}$/.test(cleaned);
  });
}
