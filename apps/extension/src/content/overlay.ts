/**
 * Overlay renderer — places clickable word boxes on top of Webtoon images.
 *
 * Each image gets a wrapper div with position:relative.
 * Word overlays are absolutely positioned children matching the OCR bounding boxes.
 * Clicking a word shows a translation popup.
 */

import type { ImageResult, WordResult } from "../types.js";

const OVERLAY_CONTAINER_CLASS = "wt-overlay-container";
const OVERLAY_WORD_CLASS = "wt-word-overlay";
const POPUP_ID = "wt-translation-popup";

// Track which images have overlays to avoid duplicates
const overlaidImages = new WeakSet<HTMLImageElement>();

/**
 * Render overlays for all images in the episode result.
 * Matches each ImageResult to the corresponding <img> on the page.
 */
export function renderAllOverlays(imageResults: ImageResult[]): void {
  // Get all episode images in DOM order
  const pageImages = getPageImages();

  // Process in batches using requestAnimationFrame to avoid long tasks
  const batchSize = 5;
  let index = 0;

  function processBatch() {
    const end = Math.min(index + batchSize, imageResults.length);
    for (let i = index; i < end; i++) {
      const result = imageResults[i];
      const img = pageImages[result.imageIndex];
      if (img) renderImageOverlay(img, result);
    }
    index = end;
    if (index < imageResults.length) {
      requestAnimationFrame(processBatch);
    }
  }

  requestAnimationFrame(processBatch);
}

/** Get all episode images from the page */
function getPageImages(): HTMLImageElement[] {
  const selectors = [
    ".viewer_img img",
    "#_imageList img",
    "#content img",
    "img",
  ];

  for (const sel of selectors) {
    const found = Array.from(document.querySelectorAll<HTMLImageElement>(sel)).filter(
      (img) => img.naturalHeight > 200
    );
    if (found.length >= 2) return found;
  }
  return [];
}

/**
 * Wrap a single image in a container and add word overlay boxes.
 */
function renderImageOverlay(img: HTMLImageElement, result: ImageResult): void {
  if (overlaidImages.has(img)) return; // already done
  overlaidImages.add(img);

  const width = img.offsetWidth;
  const height = img.offsetHeight;
  const naturalWidth = img.naturalWidth || width;
  const naturalHeight = img.naturalHeight || height;

  // Create wrapper that maintains the image's layout
  const wrapper = document.createElement("div");
  wrapper.className = OVERLAY_CONTAINER_CLASS;
  wrapper.style.cssText = `
    position: relative;
    display: block;
    width: ${width}px;
    line-height: 0;
  `;

  // Scale factor: OCR coordinates are based on naturalWidth/Height
  const scaleX = width / naturalWidth;
  const scaleY = height / naturalHeight;

  // Use DocumentFragment to batch DOM updates for this image
  const fragment = document.createDocumentFragment();

  // Render each word overlay
  for (const word of result.words) {
    createWordOverlay(fragment, word, scaleX, scaleY);
  }

  // Insert wrapper before the image
  img.parentElement?.insertBefore(wrapper, img);
  wrapper.appendChild(img);
  wrapper.appendChild(fragment);
}

/** Create a single clickable word overlay box */
function createWordOverlay(
  container: Node,
  word: WordResult,
  scaleX: number,
  scaleY: number
): void {
  const box = document.createElement("div");
  box.className = OVERLAY_WORD_CLASS;

  const x = word.boundingBox.x * scaleX;
  const y = word.boundingBox.y * scaleY;
  const w = word.boundingBox.width * scaleX;
  const h = word.boundingBox.height * scaleY;

  box.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${w}px;
    height: ${h}px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.5);
    border-radius: 3px;
    cursor: pointer;
    z-index: 9998;
    transition: background 0.15s;
  `;

  box.addEventListener("mouseenter", () => {
    box.style.background = "rgba(99, 102, 241, 0.35)";
  });
  box.addEventListener("mouseleave", () => {
    box.style.background = "rgba(99, 102, 241, 0.15)";
  });

  // Click: show translation popup
  box.addEventListener("click", (e) => {
    e.stopPropagation();
    showTranslationPopup(word, box);
  });

  container.appendChild(box);
}

/**
 * Show the translation popup near the clicked word.
 */
export function showTranslationPopup(word: WordResult, anchor: HTMLElement): void {
  // Remove any existing popup
  document.getElementById(POPUP_ID)?.remove();

  const popup = document.createElement("div");
  popup.id = POPUP_ID;

  const rect = anchor.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  // Position popup to the right of the word, or left if near edge
  let left = rect.right + scrollX + 8;
  const top = rect.top + scrollY - 10;

  // Keep popup on screen
  if (left + 220 > window.innerWidth) {
    left = rect.left + scrollX - 228;
  }

  popup.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    width: 220px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #f1f5f9;
    animation: wt-popup-in 0.15s ease-out;
  `;

  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Translation</span>
      <button id="wt-popup-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;line-height:1;padding:0;">×</button>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-size:18px;font-weight:700;color:#6366f1;margin-bottom:2px;">${word.word}</div>
      <div style="font-size:12px;color:#94a3b8;font-style:italic;">${word.pronunciation}</div>
    </div>
    <div style="background:#0f172a;border-radius:8px;padding:10px;margin-bottom:12px;">
      <div style="font-size:22px;text-align:right;direction:rtl;font-weight:600;color:#f8fafc;letter-spacing:0.02em;">${word.translation}</div>
    </div>
    <button id="wt-popup-audio" style="
      display:flex;align-items:center;gap:6px;
      background:#6366f1;color:#fff;border:none;
      border-radius:8px;padding:8px 14px;
      cursor:pointer;font-size:13px;font-weight:500;width:100%;justify-content:center;
    ">
      🔊 Play pronunciation
    </button>
  `;

  document.body.appendChild(popup);

  // Close button
  document.getElementById("wt-popup-close")?.addEventListener("click", () => {
    popup.remove();
  });

  // Audio button — browser TTS
  document.getElementById("wt-popup-audio")?.addEventListener("click", () => {
    playPronunciation(word.word, word.pronunciation);
  });

  // Close on click outside
  setTimeout(() => {
    document.addEventListener("click", () => popup.remove(), { once: true });
  }, 10);
}

/**
 * Play pronunciation using browser Web Speech API (TTS).
 * Speaks the English word and the Arabic translation.
 */
export function playPronunciation(englishWord: string, _pronunciation: string): void {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  // Speak English word first
  const engUtterance = new SpeechSynthesisUtterance(englishWord);
  engUtterance.lang = "en-US";
  engUtterance.rate = 0.85;

  window.speechSynthesis.speak(engUtterance);
}

const PROCESSING_OVERLAY_ID = "wt-processing-overlay";

/**
 * Show a processing overlay on the page to track progress.
 * Matches the design from Slide 5.
 */
export function showProcessingOverlay(processed: number, total: number, onCancel?: () => void): void {
  let overlay = document.getElementById(PROCESSING_OVERLAY_ID);

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = PROCESSING_OVERLAY_ID;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(99, 102, 241, 0.1);
      backdrop-filter: blur(4px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="
      background: #6366f1;
      width: 320px;
      padding: 32px;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      text-align: center;
      color: white;
    ">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; opacity: 0.9;">webtoon translator</div>
      <h2 style="font-size: 20px; margin: 0 0 24px 0; font-weight: 600;">Processing images ...</h2>
      
      <div style="font-size: 32px; font-weight: 700; margin-bottom: 32px;">
        ${processed}/${total}
      </div>

      <button id="wt-cancel-btn" style="
        background: #f472b6;
        color: white;
        border: none;
        border-radius: 12px;
        padding: 12px 32px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.1s;
      ">cancel</button>
    </div>
  `;

  document.getElementById("wt-cancel-btn")?.addEventListener("click", () => {
    onCancel?.();
    removeProcessingOverlay();
  });
}

/** Remove the processing overlay */
export function removeProcessingOverlay(): void {
  document.getElementById(PROCESSING_OVERLAY_ID)?.remove();
}

/** Remove all overlays from the page */
export function removeAllOverlays(): void {
  document.querySelectorAll(`.${OVERLAY_CONTAINER_CLASS}`).forEach((container) => {
    const img = container.querySelector("img");
    if (img) container.parentElement?.insertBefore(img, container);
    container.remove();
  });
  document.getElementById(POPUP_ID)?.remove();
  removeProcessingOverlay();
}
