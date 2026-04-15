/**
 * Main popup App — manages which screen to show based on content script state.
 *
 * Screens:
 * - LandingScreen: first-time user (no auth in MVP, shows welcome)
 * - HomeScreen: main panel with language selectors + start detection
 * - DetectionScreen: shows detected images with checkboxes
 * - ProcessingScreen: shows progress
 * - CompleteScreen: translation done
 * - ErrorScreen: something went wrong
 */

import React, { useState, useEffect } from "react";
import type { ContentScriptState, DetectedImage } from "../types.js";
import { LandingScreen } from "./screens/LandingScreen.js";
import { HomeScreen } from "./screens/HomeScreen.js";
import { DetectionScreen } from "./screens/DetectionScreen.js";
import { ProcessingScreen } from "./screens/ProcessingScreen.js";
import { CompleteScreen } from "./screens/CompleteScreen.js";
import { ErrorScreen } from "./screens/ErrorScreen.js";

export function App() {
  const [state, setState] = useState<ContentScriptState>({ phase: "idle" });
  const [hasUser, setHasUser] = useState(false);

  // Persist language selection across screens
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("ar");

  // Listen for state updates pushed from the content script
  useEffect(() => {
    const listener = (msg: { type: string; state?: ContentScriptState }) => {
      if (msg.type === "STATE_UPDATE" && msg.state) {
        setState(msg.state);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Pull initial state when popup opens
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response?.state) setState(response.state as ContentScriptState);
      });
    });
  }, []);

  /** Send a message to the active tab's content script */
  function sendToContent(message: object) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) { /* tab not loaded */ }
      });
    });
  }

  function handleGetStarted() {
    setHasUser(true);
  }

  function handleStartDetection(src: string, tgt: string) {
    setSourceLang(src);
    setTargetLang(tgt);
    sendToContent({ type: "START_DETECTION" });
    setState({ phase: "detecting" });
  }

  function handleStartTranslation(selected: DetectedImage[]) {
    const selectedIndices = selected.map((img) => img.index);
    sendToContent({ type: "START_TRANSLATION", selectedIndices, sourceLang, targetLang });
  }

  function handleCancel() {
    sendToContent({ type: "CANCEL_TRANSLATION" });
    setState({ phase: "idle" });
  }

  function handleReset() {
    setState({ phase: "idle" });
  }

  // ── Route to correct screen ────────────────────────────────────────────────
  if (!hasUser) {
    return <LandingScreen onGetStarted={handleGetStarted} />;
  }

  if (state.phase === "idle" || state.phase === "detecting") {
    return (
      <HomeScreen
        onStartDetection={handleStartDetection}
        isDetecting={state.phase === "detecting"}
      />
    );
  }

  if (state.phase === "detected") {
    return (
      <DetectionScreen
        images={state.images}
        onStartTranslation={handleStartTranslation}
        onBack={handleReset}
      />
    );
  }

  if (state.phase === "processing") {
    return (
      <ProcessingScreen
        processed={state.processed}
        total={state.total}
        onCancel={handleCancel}
      />
    );
  }

  if (state.phase === "complete") {
    return <CompleteScreen result={state.result} onReset={handleReset} />;
  }

  if (state.phase === "error") {
    return <ErrorScreen error={state.error} onReset={handleReset} />;
  }

  return null;
}
