/**
 * Cloudinary Service — upload images to temporary cloud storage.
 * Uses real Cloudinary SDK.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from "cloudinary";
import { logger } from "../lib/logger.js";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure: true,
});

/**
 * Upload a base64-encoded image to Cloudinary and return its public URL and publicId.
 * Images are stored in the 'webtoon-translator' folder for easy cleanup.
 */
export async function uploadImage(
  base64Data: string,
  sessionId: string,
  imageIndex: number
): Promise<{ url: string; publicId: string }> {
  logger.info({ sessionId, imageIndex }, "Uploading image to Cloudinary");

  // Cloudinary accepts data URIs directly
  const dataUri = base64Data.startsWith("data:")
    ? base64Data
    : `data:image/jpeg;base64,${base64Data}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "webtoon-translator",
    public_id: `${sessionId}_${imageIndex}`,
    resource_type: "image",
    overwrite: true,
    // Auto-expire after 1 hour — we only need it for OCR
    invalidate: true,
  });

  logger.info({ url: result.secure_url, imageIndex }, "Image uploaded to Cloudinary");
  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Delete an uploaded image from Cloudinary (cleanup after session completes).
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info({ publicId }, "Cloudinary image deleted");
  } catch (err) {
    logger.warn({ publicId, err }, "Failed to delete Cloudinary image");
  }
}
