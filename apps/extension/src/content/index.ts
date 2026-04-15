/**
 * Content Script — injected into Webtoon pages.
 * Handles:
 * - Image detection
 * - Chunk upload pipeline
 * - Progress tracking
 * - Overlay rendering
 * - Cache check/save
 */

import type { ExtensionMessage, ContentScriptState, DetectedImage, EpisodeResult } from "../types.js";
import { detectEpisodeImages, triggerLazyLoad } from "./detector.js";
import { renderAllOverlays, removeAllOverlays } from "./overlay.js";
import { saveResult, loadResult } from "../storage/indexedDB.js";
import { prepareSession, uploadChunk, completeUpload, getStatus, getResult, imageToBase64 } from "../api/client.js";

// Current state of the content script
let state: ContentScriptState = { phase: "idle" };
let cancelRequested = false;
let detectedImages: DetectedImage[] = [];

/** Update state and notify popup if it's open */
function setState(newState: ContentScriptState) {
  state = newState;
  try {
    chrome.runtime.sendMessage({ type: "STATE_UPDATE", state } satisfies ExtensionMessage).catch(() => {});
  } catch {
    // Popup might not be open — ignore
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true; // Keep the message channel open for async responses
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

    default:
      sendResponse({ ok: false });
  }
}

/** Step 1: Detect all Webtoon images on the page */
async function runDetection() {
  setState({ phase: "detecting" });

  // Trigger lazy-load to ensure all images are present
  await triggerLazyLoad();

  detectedImages = detectEpisodeImages();

  setState({ phase: "detected", images: detectedImages });
}

/** Step 2: Run the full translation pipeline for selected images */
async function runTranslation(
  selectedIndices: number[],
  sourceLang: string,
  targetLang: string
) {
  cancelRequested = false;

  const episodeUrl = window.location.href;
  const selected = detectedImages.filter((img) => selectedIndices.includes(img.index));

  if (selected.length === 0) {
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
  setState({ phase: "processing", processed: 0, total: selected.length });

  try {
    // Create session
    const { sessionId } = await prepareSession(episodeUrl, selected.length, sourceLang, targetLang);

    // Upload images in chunks of 3
    const CHUNK_SIZE = 3;
    let processedCount = 0;

    for (let i = 0; i < selected.length; i += CHUNK_SIZE) {
      if (cancelRequested) {
        setState({ phase: "idle" });
        return;
      }

      const chunkImages = selected.slice(i, i + CHUNK_SIZE);

      // Convert each image to base64
      const base64Items = await Promise.all(
        chunkImages.map(async (img) => ({
          imageIndex: img.index,
          base64: await imageToBase64(img.src).catch(() => ""),
        }))
      );

      // Skip items where conversion failed
      const validItems = base64Items.filter((item) => item.base64 !== "");

      await uploadChunk(sessionId, validItems);

      processedCount += chunkImages.length;
      setState({ phase: "processing", processed: processedCount, total: selected.length });
    }

    // Signal upload complete
    await completeUpload(sessionId);

    // Poll for completion
    const result = await pollUntilComplete(sessionId);

    if (!result) {
      setState({ phase: "error", error: "Processing failed or was cancelled" });
      return;
    }

    // Save to cache
    await saveResult(result);

    // Render overlays
    renderAllOverlays(result.images);

    setState({ phase: "complete", result });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    setState({ phase: "error", error });
  }
}

/** Poll the backend until processing is complete */
async function pollUntilComplete(sessionId: string): Promise<EpisodeResult | null> {
  const MAX_POLLS = 120; // 2 minutes max
  const POLL_INTERVAL = 1000; // 1s

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

    // Update progress
    setState({
      phase: "processing",
      processed: status.processedImages,
      total: status.totalImages,
    });
  }

  throw new Error("Timed out waiting for processing");
}
