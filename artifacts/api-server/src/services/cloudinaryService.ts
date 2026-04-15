/**
 * Cloudinary Service — upload base64 images to temporary cloud storage.
 *
 * CURRENT: Mock implementation — returns a fake URL without uploading.
 * REAL: Replace `uploadImage` body with actual Cloudinary SDK calls.
 *
 * To plug in real Cloudinary:
 * 1. Install: pnpm add cloudinary
 * 2. Set envs: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * 3. Replace mock below with:
 *    import { v2 as cloudinary } from 'cloudinary';
 *    cloudinary.config({ cloud_name, api_key, api_secret });
 *    const result = await cloudinary.uploader.upload(base64DataUri, {
 *      folder: 'webtoon-translator',
 *      resource_type: 'image',
 *    });
 *    return result.secure_url;
 * 4. For cleanup, call: cloudinary.uploader.destroy(publicId)
 */

import { logger } from "../lib/logger.js";

/**
 * Upload a base64-encoded image and return its public URL.
 * The URL is used by the OCR service to fetch the image for processing.
 */
export async function uploadImage(base64Data: string, sessionId: string, imageIndex: number): Promise<string> {
  logger.info({ sessionId, imageIndex }, "Uploading image to storage");

  // ──────────────────────────────────────────────────────────────────────────
  // MOCK UPLOAD — returns a placeholder URL
  // Replace this block with real Cloudinary upload
  // ──────────────────────────────────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 80)); // simulate upload latency

  // In the mock, we just return a fake URL.
  // Real implementation returns the Cloudinary secure_url.
  const mockUrl = `https://res.cloudinary.com/mock/image/upload/webtoon/${sessionId}_${imageIndex}.jpg`;
  
  logger.info({ mockUrl, imageIndex }, "Image uploaded (mock)");
  return mockUrl;
  // ──────────────────────────────────────────────────────────────────────────
}

/**
 * Delete an image from Cloudinary after processing (cleanup).
 * Called when a session completes or is cancelled.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  // MOCK: no-op
  // Real: extract publicId from URL, call cloudinary.uploader.destroy(publicId)
  logger.info({ imageUrl }, "Image deleted from storage (mock)");
}
