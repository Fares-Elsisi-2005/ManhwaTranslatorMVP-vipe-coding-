/**
 * Content Script — injected into Webtoon pages.
 * Handles:
 * - Image detection
 * - Chunk upload pipeline
 * - Progress tracking
 * - Overlay rendering
 * - Cache check/save
 * - PDF download
 */

import type { ExtensionMessage, ContentScriptState, DetectedImage, EpisodeResult } from "../types.js";
import { detectEpisodeImages, triggerLazyLoad } from "./detector.js";
import { renderAllOverlays, removeAllOverlays, showProcessingOverlay, removeProcessingOverlay } from "./overlay.js";
import { saveResult, loadResult } from "../storage/indexedDB.js";
import { prepareSession, uploadChunk, completeUpload, getStatus, getResult, imageToBase64 } from "../api/client.js";
import { downloadEpisodeAsPDF } from "./pdfDownloader.js";

// Current state of the content script
let state: ContentScriptState = { phase: "idle" };
let cancelRequested = false;
let detectedImages: DetectedImage[] = [];

/** Update state and notify popup if it's open */
function setState(newState: ContentScriptState) {
  state = newState;

  // Show/Update page overlay during processing
  if (state.phase === "processing") {
    showProcessingOverlay(state.processed, state.total, () => {
      cancelRequested = true;
      setState({ phase: "idle" });
      removeAllOverlays();
    });
  } else if (state.phase !== "detecting") {
    // Hide overlay when not processing (but keep it hidden during detecting too)
    removeProcessingOverlay();
  }

  try {
    chrome.runtime.sendMessage({ type: "STATE_UPDATE", state } satisfies ExtensionMessage).catch(() => {});
  } catch {
    // Popup might not be open — ignore
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true; // Keep channel open for async responses
});

async function handleMessage(message: ExtensionMessage, sendResponse: (r: unknown) => void) {
  switch (message.type) {
    case "GET_STATE": {
      sendResponse({ state });
      break;
    }

    case "START_DETECTION": {
      sendResponse({ ok: true });
      await runDetection();
      break;
    }

    case "START_TRANSLATION": {
      const { selectedIndices, sourceLang, targetLang } = message;
      sendResponse({ ok: true });
      await runTranslation(selectedIndices, sourceLang, targetLang);
      break;
    }

    case "CANCEL_TRANSLATION": {
      cancelRequested = true;
      setState({ phase: "idle" });
      removeAllOverlays();
      sendResponse({ ok: true });
      break;
    }

    case "DOWNLOAD_PDF": {
      sendResponse({ ok: true });
      await runPDFDownload();
      break;
    }

    default:
      sendResponse({ ok: false });
  }
}

/** Step 1: Detect all Webtoon images on the page */
async function runDetection() {
  console.log("[WebtoonTranslate] runDetection started");
  setState({ phase: "detecting" });

  try {
    // Trigger lazy-load to ensure all images are present in DOM
    await triggerLazyLoad();

    detectedImages = detectEpisodeImages();
    console.log(`[WebtoonTranslate] Detection complete. Found ${detectedImages.length} images.`);
    setState({ phase: "detected", images: detectedImages });
  } catch (err) {
    console.error("[WebtoonTranslate] Detection failed:", err);
    const error = err instanceof Error ? err.message : "Detection failed";
    setState({ phase: "error", error });
  }
}

/** Step 2: Run the full translation pipeline for selected images */
async function runTranslation(
  selectedIndices: number[],
  sourceLang: string,
  targetLang: string
) {
  cancelRequested = false;
  console.log("[WebtoonTranslate] Starting translation for indices:", selectedIndices);

  const episodeUrl = window.location.href;
  const selected = detectedImages.filter((img) => selectedIndices.includes(img.index));

  if (selected.length === 0) {
    console.error("[WebtoonTranslate] No images selected or detected.");
    setState({ phase: "error", error: "No images selected" });
    return;
  }

  // ── Check cache first ──────────────────────────────────────────────────────
  const cached = await loadResult(episodeUrl, sourceLang, targetLang);
  if (cached) {
    console.log("[WebtoonTranslate] Loading from cache");
    renderAllOverlays(cached.images);
    setState({ phase: "complete", result: cached });
    return;
  }

  // ── Fresh processing ───────────────────────────────────────────────────────
  console.log("[WebtoonTranslate] Fresh processing started for", selected.length, "images");
  setState({ phase: "processing", processed: 0, total: selected.length });

  try {
    console.log("[WebtoonTranslate] Preparing session...");
    const { sessionId } = await prepareSession(episodeUrl, selected.length, sourceLang, targetLang);
    console.log("[WebtoonTranslate] Session prepared:", sessionId);

    // Upload in chunks of 3
    const CHUNK_SIZE = 3;
    let processedCount = 0;

    for (let i = 0; i < selected.length; i += CHUNK_SIZE) {
      if (cancelRequested) {
        console.log("[WebtoonTranslate] Cancel requested");
        setState({ phase: "idle" });
        return;
      }

      const chunkImages = selected.slice(i, i + CHUNK_SIZE);
      console.log(`[WebtoonTranslate] Processing chunk ${Math.floor(i/CHUNK_SIZE) + 1}...`);
      const base64Items = [];

      for (const img of chunkImages) {
        try {
          console.log(`[WebtoonTranslate] Converting image ${img.index} to base64...`);
          const b64 = await imageToBase64(img.src);
          base64Items.push({ imageIndex: img.index, base64: b64 });
        } catch (e) {
          console.warn(`[WebtoonTranslate] Failed to convert image ${img.index}:`, e);
        }
        processedCount++;
        setState({ phase: "processing", processed: processedCount, total: selected.length });
      }

      const validItems = base64Items.filter((item) => item.base64 !== "");
      if (validItems.length > 0) {
        console.log(`[WebtoonTranslate] Uploading chunk with ${validItems.length} images...`);
        await uploadChunk(sessionId, validItems);
      }
    }

    console.log("[WebtoonTranslate] All chunks uploaded. Finalizing...");
    await completeUpload(sessionId);

    console.log("[WebtoonTranslate] Polling for results...");
    const result = await pollUntilComplete(sessionId);
    if (!result) {
      console.error("[WebtoonTranslate] Polling failed or returned null");
      setState({ phase: "error", error: "Processing failed or was cancelled" });
      return;
    }

    console.log("[WebtoonTranslate] Processing complete! Rendering overlays.");
    await saveResult(result);
    renderAllOverlays(result.images);
    setState({ phase: "complete", result });

  } catch (err) {
    console.error("[WebtoonTranslate] Pipeline error:", err);
    const error = err instanceof Error ? err.message : "Unknown error";
    setState({ phase: "error", error });
  }
}

/** PDF download — runs in the page context using jsPDF */
async function runPDFDownload() {
  try {
    // If no images detected yet, trigger detection first
    if (detectedImages.length === 0) {
      await triggerLazyLoad();
      detectedImages = detectEpisodeImages();
    }

    await downloadEpisodeAsPDF((progress) => {
      // Relay progress to popup
      try {
        chrome.runtime.sendMessage({
          type: "PDF_PROGRESS",
          loaded: progress.loaded,
          total: progress.total,
          phase: progress.phase,
        } satisfies ExtensionMessage).catch(() => {});
      } catch { /* popup closed */ }
    });

    try {
      chrome.runtime.sendMessage({ type: "PDF_DONE" } satisfies ExtensionMessage).catch(() => {});
    } catch { /* popup closed */ }

  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    try {
      chrome.runtime.sendMessage({ type: "PDF_ERROR", error } satisfies ExtensionMessage).catch(() => {});
    } catch { /* popup closed */ }
  }
}

/** Poll the backend until processing is complete */
async function pollUntilComplete(sessionId: string): Promise<EpisodeResult | null> {
  const MAX_POLLS = 300; // 5 minutes max
  const POLL_INTERVAL = 1000;

  for (let i = 0; i < MAX_POLLS; i++) {
    if (cancelRequested) return null;

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const status = await getStatus(sessionId);

    if (status.status === "complete") {
      return await getResult(sessionId);
    }

    if (status.status === "error") {
      throw new Error(status.error ?? "Processing error");
    }

    setState({
      phase: "processing",
      processed: status.processedImages,
      total: status.totalImages,
    });
  }

  throw new Error("Timed out waiting for processing");
}
