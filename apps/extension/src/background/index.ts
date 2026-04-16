/**
 * Background script — handles side panel and global events.
 */

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
  console.log("[WebtoonTranslate] Background service worker installed");
});
