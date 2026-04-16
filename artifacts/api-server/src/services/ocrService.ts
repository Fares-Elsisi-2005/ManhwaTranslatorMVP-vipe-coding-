/**
 * OCR Service — extracts text and bounding boxes from images.
 * 
 * Contains both REAL (Google Vision) and MOCK implementations.
 * Active implementation: MOCK (until billing is fixed).
 */

import vision from "@google-cloud/vision";
import { logger } from "../lib/logger.js";

export interface OCRWord {
  text: string;
  x: number;       // left offset in pixels
  y: number;       // top offset in pixels
  width: number;
  height: number;
}

/* ──────────────────────────────────────────────────────────────────────────────
   REAL IMPLEMENTATION (GOOGLE VISION) - COMMENTED OUT
   ──────────────────────────────────────────────────────────────────────────────

function getVisionClient(): vision.ImageAnnotatorClient {
  const jsonStr = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"];
  if (!jsonStr) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }

  let credentials: object;
  try {
    credentials = JSON.parse(jsonStr);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  return new vision.ImageAnnotatorClient({ credentials });
}

export async function runOCR_REAL(imageUrl: string, imageIndex: number): Promise<OCRWord[]> {
  logger.info({ imageUrl, imageIndex }, "Running Google Vision OCR");

  const client = getVisionClient();
  const [result] = await client.textDetection(imageUrl);
  const annotations = result.textAnnotations;

  if (!annotations || annotations.length === 0) {
    logger.info({ imageIndex }, "No text found in image");
    return [];
  }

  const words: OCRWord[] = [];
  for (let i = 1; i < annotations.length; i++) {
    const ann = annotations[i];
    const text = ann.description ?? "";
    const vertices = ann.boundingPoly?.vertices ?? [];
    if (!text || vertices.length < 4) continue;

    const xs = vertices.map((v) => v.x ?? 0);
    const ys = vertices.map((v) => v.y ?? 0);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(...xs) - x;
    const height = Math.max(...ys) - y;
    words.push({ text, x, y, width, height });
  }
  return words;
}
*/

/* ──────────────────────────────────────────────────────────────────────────────
   MOCK IMPLEMENTATION (ACTIVE)
   ────────────────────────────────────────────────────────────────────────────── */

export async function runOCR(imageUrl: string, imageIndex: number): Promise<OCRWord[]> {
  logger.info({ imageUrl, imageIndex }, "Running MOCK OCR");

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  // Return a few fake words for every image
  const mockWords: OCRWord[] = [
    { text: "Hello", x: 100, y: 150, width: 80, height: 30 },
    { text: "World", x: 190, y: 150, width: 85, height: 30 },
    { text: "Webtoon", x: 50, y: 400, width: 120, height: 40 },
    { text: "Translate", x: 180, y: 400, width: 140, height: 40 },
    { text: "Story", x: 400, y: 50, width: 100, height: 35 },
  ];

  if (imageIndex % 2 === 0) {
    mockWords.push({ text: "Panel", x: 300, y: 600, width: 90, height: 30 });
  }

  logger.info({ imageIndex, wordCount: mockWords.length }, "Mock OCR complete");
  return mockWords;
}

/**
 * Filter out noise from OCR results.
 * Keeps only alphabetic English words with 2+ characters.
 */
export function filterWords(words: OCRWord[]): OCRWord[] {
  return words.filter((w) => {
    const cleaned = w.text.trim().replace(/[^a-zA-Z]/g, "");
    return cleaned.length >= 2;
  }).map((w) => ({
    ...w,
    text: w.text.replace(/[^a-zA-Z'-]/g, "").trim(),
  })).filter((w) => w.text.length >= 2);
}
