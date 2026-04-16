/**
 * Home screen — main panel after login.
 * Based on wireframe Slide 3.
 * Shows language selection and Start Detection button.
 */

import React, { useState } from "react";

interface Props {
  onStartDetection: (sourceLang: string, targetLang: string) => void;
  isDetecting: boolean;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
];

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: 13,
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 36,
};

export function HomeScreen({ onStartDetection, isDetecting }: Props) {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("ar");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 480 }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        background: "#1e293b",
        borderBottom: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* User avatar placeholder */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#fff", fontWeight: 700,
          }}>U</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Welcome!</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Free plan</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Notification icon */}
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18 }}>🔔</button>
          {/* Settings icon */}
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18 }}>⚙️</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
        }}>📖</div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", textAlign: "center" }}>
          webtoonTranslate
        </h2>

        {/* Language selectors */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Original Language
            </label>
            <div style={{ position: "relative" }}>
              <select
                style={selectStyle}
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap icon */}
          <div style={{ textAlign: "center", color: "#6366f1", fontSize: 20 }}>⇅</div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Translate To
            </label>
            <div style={{ position: "relative" }}>
              <select
                style={selectStyle}
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Start Detection Button */}
        <button
          onClick={() => onStartDetection(sourceLang, targetLang)}
          disabled={isDetecting}
          style={{
            width: "100%",
            padding: "14px",
            background: isDetecting ? "#334155" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: isDetecting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: isDetecting ? "none" : "0 4px 16px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
          }}
        >
          {isDetecting ? (
            <>
              <span style={{ animation: "wt-spin 0.8s linear infinite", display: "inline-block" }}>⟳</span>
              Detecting images...
            </>
          ) : (
            <>🔍 Start Detection</>
          )}
        </button>

        {/* PDF Download Button */}
        <DownloadPDFButton />
      </div>

      <style>{`@keyframes wt-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}

function DownloadPDFButton() {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [progress, setProgress] = useState({ loaded: 0, total: 0, phase: "" });

  // Listen for PDF events from the content script
  React.useEffect(() => {
    const listener = (msg: { type: string; loaded?: number; total?: number; phase?: string; error?: string }) => {
      if (msg.type === "PDF_PROGRESS") {
        setState("working");
        setProgress({ loaded: msg.loaded ?? 0, total: msg.total ?? 0, phase: msg.phase ?? "" });
      } else if (msg.type === "PDF_DONE") {
        setState("done");
        setTimeout(() => setState("idle"), 3000);
      } else if (msg.type === "PDF_ERROR") {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  function handleClick() {
    setState("working");
    setProgress({ loaded: 0, total: 0, phase: "loading" });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) { setState("error"); return; }
      chrome.tabs.sendMessage(tab.id, { type: "DOWNLOAD_PDF" }, () => {
        if (chrome.runtime.lastError) {
          setState("error");
          setTimeout(() => setState("idle"), 3000);
        }
      });
    });
  }

  const label = () => {
    if (state === "working") {
      if (progress.phase === "loading" && progress.total > 0)
        return `Loading ${progress.loaded}/${progress.total}...`;
      if (progress.phase === "rendering") return "Building PDF...";
      if (progress.phase === "saving") return "Saving...";
      return "Preparing...";
    }
    if (state === "done") return "✓ PDF Downloaded!";
    if (state === "error") return "Failed — try again";
    return "⬇ Download Episode as PDF";
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === "working"}
      style={{
        width: "100%",
        padding: "12px",
        background:
          state === "done" ? "linear-gradient(135deg, #10b981, #059669)"
          : state === "error" ? "rgba(239,68,68,0.2)"
          : "#1e293b",
        color: state === "error" ? "#ef4444" : "#94a3b8",
        border: `1px solid ${state === "error" ? "rgba(239,68,68,0.4)" : "#334155"}`,
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        cursor: state === "working" ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.2s",
        opacity: state === "working" ? 0.7 : 1,
      }}
    >
      {state === "working" && (
        <span style={{ display: "inline-block", animation: "wt-spin 0.8s linear infinite" }}>⟳</span>
      )}
      {label()}
    </button>
  );
}

function BottomNav() {
  const [active, setActive] = useState("home");

  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "help", icon: "❓", label: "Help" },
    { id: "account", icon: "👤", label: "Account" },
  ];

  return (
    <div style={{
      borderTop: "1px solid #334155",
      padding: "10px 0 6px",
      display: "flex",
      justifyContent: "space-around",
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            color: active === tab.id ? "#6366f1" : "#64748b",
            fontSize: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
