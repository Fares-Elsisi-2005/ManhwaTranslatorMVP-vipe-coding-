/**
 * Background Service Worker (Manifest V3).
 * Handles extension lifecycle events and icon badge updates.
 */

// Listen for extension install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log("WebtoonTranslate extension installed");
});

// Forward messages between popup and content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Messages are handled directly by content script and popup
  // Background just acknowledges
  sendResponse({ ok: true });
  return true;
});
