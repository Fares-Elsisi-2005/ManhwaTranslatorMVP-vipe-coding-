/**
 * Shared TypeScript types for the extension.
 * Mirrors the backend API response structure.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WordResult {
  word: string;
  translation: string;
  pronunciation: string;
  boundingBox: BoundingBox;
}

export interface ImageResult {
  imageIndex: number;
  imageUrl: string;
  words: WordResult[];
}

export interface EpisodeResult {
  sessionId: string;
  episodeUrl: string;
  sourceLang: string;
  targetLang: string;
  totalImages: number;
  images: ImageResult[];
}

export interface SessionStatus {
  sessionId: string;
  status: "pending" | "processing" | "complete" | "error";
  processedImages: number;
  totalImages: number;
  progress: number;
  error?: string;
}

// Message types for content script ↔ popup communication
export type ExtensionMessage =
  | { type: "START_DETECTION" }
  | { type: "DETECTION_RESULT"; images: DetectedImage[] }
  | { type: "START_TRANSLATION"; selectedIndices: number[]; sourceLang: string; targetLang: string }
  | { type: "TRANSLATION_PROGRESS"; processed: number; total: number }
  | { type: "TRANSLATION_COMPLETE"; result: EpisodeResult }
  | { type: "TRANSLATION_ERROR"; error: string }
  | { type: "CANCEL_TRANSLATION" }
  | { type: "DOWNLOAD_PDF" }
  | { type: "PDF_PROGRESS"; loaded: number; total: number; phase: string }
  | { type: "PDF_DONE" }
  | { type: "PDF_ERROR"; error: string }
  | { type: "GET_STATE" }
  | { type: "STATE_UPDATE"; state: ContentScriptState }
  | { type: "CLEAR_EPISODE_CACHE" };

export interface DetectedImage {
  index: number;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  selected: boolean;
}

export type ContentScriptState =
  | { phase: "idle" }
  | { phase: "detecting" }
  | { phase: "detected"; images: DetectedImage[] }
  | { phase: "processing"; processed: number; total: number }
  | { phase: "complete"; result: EpisodeResult }
  | { phase: "error"; error: string };
