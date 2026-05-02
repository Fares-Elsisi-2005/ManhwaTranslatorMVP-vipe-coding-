/**
 * API client for talking to the WebtoonTranslate backend.
 * Configurable base URL — set to your deployed backend or localhost.
 */

import type { EpisodeResult, SessionStatus } from "../types.js";

// The backend URL — update this to your deployed URL for production
declare const __API_BASE_URL__: string;
const API_BASE = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : "http://localhost:5000/api";

/** Prepare a new session for an episode */
export async function prepareSession(
  episodeUrl: string,
  totalImages: number,
  sourceLang = "en",
  targetLang = "ar"
): Promise<{ sessionId: string }> {
  const res = await fetch(`${API_BASE}/episodes/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ episodeUrl, totalImages, sourceLang, targetLang }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to prepare session");
  }

  return res.json();
}

/** Upload a chunk of images (max 3 at a time) */
export async function uploadChunk(
  sessionId: string,
  images: Array<{ imageIndex: number; base64: string }>
): Promise<void> {
  const res = await fetch(`${API_BASE}/episodes/${sessionId}/chunks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to upload chunk");
  }
}

/** Signal that all chunks have been sent */
export async function completeUpload(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/episodes/${sessionId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to complete upload");
  }
}

/** Poll the processing status */
export async function getStatus(sessionId: string): Promise<SessionStatus> {
  const res = await fetch(`${API_BASE}/episodes/${sessionId}/status`);
  if (!res.ok) throw new Error("Failed to get status");
  return res.json();
}

/** Fetch the final result when status === 'complete' */
export async function getResult(sessionId: string): Promise<EpisodeResult> {
  const res = await fetch(`${API_BASE}/episodes/${sessionId}/result`);
  if (!res.ok) throw new Error("Failed to get result");
  return res.json();
}

/**
 * Convert an image element to base64 string.
 * Uses OffscreenCanvas and createImageBitmap for non-blocking decoding.
 */
export async function imageToBase64(imgSrc: string): Promise<string> {
  const response = await fetch(imgSrc);
  const blob = await response.blob();
  const imgBitmap = await createImageBitmap(blob);
  
  try {
    const MAX_WIDTH = 1200;
    const scale = imgBitmap.width > MAX_WIDTH ? MAX_WIDTH / imgBitmap.width : 1;
    const drawW = imgBitmap.width * scale;
    const drawH = imgBitmap.height * scale;

    const canvas = new OffscreenCanvas(drawW, drawH);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No canvas context");
    }
    ctx.drawImage(imgBitmap, 0, 0, drawW, drawH);
    
    const resultBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.7
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } finally {
    imgBitmap.close();
  }
}
