/**
 * API client for talking to the WebtoonTranslate backend.
 * Configurable base URL — set to your deployed backend or localhost.
 */

import type { EpisodeResult, SessionStatus } from "../types.js";

// The backend URL — update this to your deployed URL for production
const API_BASE = "http://localhost:5000/api";

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
 * Uses a canvas to capture the image data.
 */
export async function imageToBase64(imgSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(img, 0, 0);
      // Get base64 without data URI prefix
      const full = canvas.toDataURL("image/jpeg", 0.85);
      resolve(full); // keep data URI prefix for Cloudinary
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imgSrc}`));
    img.src = imgSrc;
  });
}
