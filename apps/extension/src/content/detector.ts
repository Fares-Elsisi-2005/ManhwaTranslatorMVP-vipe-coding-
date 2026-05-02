/**
 * Image detector — finds all Webtoon episode images on the page.
 *
 * Based on the proven selector from the Webtoon PDF downloader script:
 *   document.querySelectorAll("img._images")
 *   with dataset.url or img.src, filtered to webtoon-phinf.pstatic.net
 *
 * Falls back to broader selectors for other Webtoon page layouts.
 */

import type { DetectedImage } from "../types.js";

/** Primary selector — exact match from Webtoon's DOM */
const PRIMARY_SELECTOR = "img._images";

/** CDN domain that Webtoon uses for episode images */
const WEBTOON_CDN = "webtoon-phinf.pstatic.net";

/** Fallback selectors for different Webtoon page layouts */
const FALLBACK_SELECTORS = [
  ".viewer_img img",
  "#_imageList img",
  "img[data-url]",
  "#content img",
];

/**
 * Get the real src of a Webtoon image element.
 * Webtoon uses data-url for lazy loading instead of the src attribute.
 */
function getImageSrc(img: HTMLImageElement): string {
  return (
    img.dataset["url"] ||     // lazy-loaded URL (primary)
    img.getAttribute("data-url") ||
    img.src ||
    ""
  );
}

/**
 * Check if a URL is a Webtoon episode image (not a UI asset).
 */
function isEpisodeImage(src: string): boolean {
  if (!src || src.startsWith("data:")) return false;
  // Primary check: Webtoon's CDN
  if (src.includes(WEBTOON_CDN)) return true;
  // Fallback: any large image URL with common image extensions
  return /\.(jpg|jpeg|png|webp)/i.test(src);
}

/**
 * Find all episode images on the current page.
 * Returns them sorted by their vertical DOM position (top to bottom).
 */
export function detectEpisodeImages(): DetectedImage[] {
  console.log("[WebtoonTranslate] Running image detection...");
  let images: HTMLImageElement[] = [];

  // ── Try primary selector first (exact match from Webtoon DOM) ─────────────
  const primary = Array.from(
    document.querySelectorAll<HTMLImageElement>(PRIMARY_SELECTOR)
  ).filter((img) => isEpisodeImage(getImageSrc(img)));

  if (primary.length >= 1) {
    console.log(`[WebtoonTranslate] Found ${primary.length} images using primary selector.`);
    images = primary;
  } else {
    console.log("[WebtoonTranslate] Primary selector failed, trying fallbacks...");
    // ── Fallback selectors ───────────────────────────────────────────────────
    for (const selector of FALLBACK_SELECTORS) {
      const found = Array.from(
        document.querySelectorAll<HTMLImageElement>(selector)
      ).filter((img) => {
        const src = getImageSrc(img);
        if (!isEpisodeImage(src)) return false;
        // Must be a real episode panel (tall image, not a UI icon)
        return img.naturalHeight > 100 || img.offsetHeight > 100;
      });

      if (found.length >= 1) {
        console.log(`[WebtoonTranslate] Found ${found.length} images using fallback: ${selector}`);
        images = found;
        break;
      }
    }
  }

  if (images.length === 0) {
    console.warn("[WebtoonTranslate] No images found with any selector!");
  }

  // Remove duplicates by src
  const seen = new Set<string>();
  images = images.filter((img) => {
    const src = getImageSrc(img);
    if (seen.has(src)) return false;
    seen.add(src);
    return true;
  });

  // Sort by vertical DOM position (top → bottom reading order)
  images.sort((a, b) => {
    const aTop = a.getBoundingClientRect().top + window.scrollY;
    const bTop = b.getBoundingClientRect().top + window.scrollY;
    return aTop - bTop;
  });

  return images.map((img, index) => ({
    index,
    src: getImageSrc(img),
    naturalWidth: img.naturalWidth || 800,
    naturalHeight: img.naturalHeight || 600,
    selected: true,
  }));
}

/**
 * Trigger lazy loading by scrolling through the full page.
 * Optimized to use larger steps and requestAnimationFrame where possible
 * to reduce layout thrashing.
 */
export async function triggerLazyLoad(): Promise<void> {
  const pageHeight = document.documentElement.scrollHeight;
  // Use larger steps (1.5x viewport) to reduce number of scroll events
  const step = Math.floor(window.innerHeight * 1.5);

  for (let pos = 0; pos <= pageHeight; pos += step) {
    window.scrollTo({
      top: pos,
      behavior: 'auto' // 'smooth' would be too slow and expensive here
    });
    // Shorter delay (80ms) is usually enough for Webtoon's IntersectionObserver
    await new Promise((r) => setTimeout(r, 80));
  }

  // Scroll back to top
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 200));
}
