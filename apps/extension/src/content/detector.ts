/**
 * Image detector — finds all Webtoon episode images on the page.
 *
 * Webtoon loads images in a specific structure:
 * - Images are in .viewer_img or [class*="viewer"] containers
 * - Uses lazy loading (IntersectionObserver or data-src attributes)
 * - Images are vertical strips stacked in order
 */

import type { DetectedImage } from "../types.js";

// Selectors for Webtoon episode images
const WEBTOON_SELECTORS = [
  ".viewer_img img",
  "#_imageList img",
  ".viewer_img",
  "img[data-url]",
  "#content img",
  // Fallback: large images (episode panels are tall)
  "img",
];

/**
 * Find all episode images on the current page.
 * Returns them sorted by their vertical position (top to bottom).
 */
export function detectEpisodeImages(): DetectedImage[] {
  let images: HTMLImageElement[] = [];

  // Try each selector until we find images
  for (const selector of WEBTOON_SELECTORS) {
    const found = Array.from(document.querySelectorAll<HTMLImageElement>(selector));

    // Filter for episode images: large height, valid src, visible
    const episodeImages = found.filter((img) => {
      // Must have a source
      const src = img.src || img.dataset["url"] || "";
      if (!src || src.startsWith("data:")) return false;

      // Must be a real image (not icon/UI element) — episode panels are tall
      const rect = img.getBoundingClientRect();
      const naturalH = img.naturalHeight;

      // Allow images that are large naturally, even if not yet scrolled into view
      return naturalH > 200 || rect.height > 100;
    });

    if (episodeImages.length >= 2) {
      images = episodeImages;
      break;
    }
  }

  // Sort by vertical DOM position
  images.sort((a, b) => {
    const aTop = a.getBoundingClientRect().top + window.scrollY;
    const bTop = b.getBoundingClientRect().top + window.scrollY;
    return aTop - bTop;
  });

  // Map to DetectedImage format
  return images.map((img, index) => ({
    index,
    src: img.src || img.dataset["url"] || img.getAttribute("data-src") || "",
    naturalWidth: img.naturalWidth || 800,
    naturalHeight: img.naturalHeight || 600,
    selected: true, // all selected by default
  }));
}

/**
 * Wait for lazy-loaded images to load.
 * Scrolls through the page to trigger IntersectionObserver.
 */
export async function triggerLazyLoad(): Promise<void> {
  // Scroll to bottom to trigger lazy loading
  const pageHeight = document.documentElement.scrollHeight;
  const step = window.innerHeight;

  for (let pos = 0; pos <= pageHeight; pos += step) {
    window.scrollTo(0, pos);
    await new Promise((r) => setTimeout(r, 100));
  }

  // Scroll back to top
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 200));
}
