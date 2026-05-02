/**
 * Complete screen — shown after translation is done.
 * Shows a summary, PDF download button, and lets user reset.
 */

import React, { useState, useEffect } from "react";
import type { EpisodeResult } from "../../types.js";

interface Props {
  result: EpisodeResult;
  onReset: () => void;
}

type PdfState = "idle" | "loading" | "rendering" | "saving" | "done" | "error";

export function CompleteScreen({ result, onReset }: Props) {
  const totalWords = result.images.reduce((sum, img) => sum + img.words.length, 0);
  const [pdfState, setPdfState] = useState<PdfState>("idle");
  const [pdfProgress, setPdfProgress] = useState({ loaded: 0, total: 0 });
  const [pdfError, setPdfError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Listen for PDF progress/done/error from content script
  useEffect(() => {
    const listener = (msg: { type: string; loaded?: number; total?: number; phase?: string; error?: string }) => {
      if (msg.type === "PDF_PROGRESS") {
        setPdfState((msg.phase as PdfState) || "loading");
        setPdfProgress({ loaded: msg.loaded ?? 0, total: msg.total ?? 0 });
      } else if (msg.type === "PDF_DONE") {
        setPdfState("done");
        setTimeout(() => setPdfState("idle"), 3000);
      } else if (msg.type === "PDF_ERROR") {
        setPdfState("error");
        setPdfError(msg.error ?? "Unknown error");
        setTimeout(() => setPdfState("idle"), 4000);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  function handleDownloadPDF() {
    setPdfState("loading");
    setPdfError("");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "DOWNLOAD_PDF" }, () => {
        if (chrome.runtime.lastError) {
          setPdfState("error");
          setPdfError("Could not reach page — make sure you're on a Webtoon episode");
        }
      });
    });
  }

  function handleClearCache() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "CLEAR_EPISODE_CACHE" });
    });
  }

  const pdfLabel = () => {
    switch (pdfState) {
      case "loading": return `Loading images... ${pdfProgress.loaded}/${pdfProgress.total}`;
      case "rendering": return "Building PDF...";
      case "saving": return "Saving PDF...";
      case "done": return "✓ PDF downloaded!";
      case "error": return `Error: ${pdfError}`;
      default: return "⬇ Download as PDF";
    }
  };

  return (
    <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Success icon */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 10px",
          boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
        }}>✓</div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>Translation complete!</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          Click any highlighted word on the page to see its translation.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        background: "#1e293b",
        borderRadius: 12,
        padding: "14px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}>
        <StatCard label="Images processed" value={result.totalImages} />
        <StatCard label="Words found" value={totalWords} />
        <StatCard label="From" value={result.sourceLang.toUpperCase()} />
        <StatCard label="To" value={result.targetLang.toUpperCase()} />
      </div>

      {/* Cache indicator & Reset */}
      <div style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        <div style={{
          fontSize: 12,
          color: "#10b981",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          💾 Results cached for instant loading
        </div>

        {showClearConfirm ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleClearCache}
              style={{
                flex: 1, padding: "8px", background: "#ef4444", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}
            >
              Confirm Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              style={{
                flex: 1, padding: "8px", background: "#334155", color: "#94a3b8",
                border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              width: "100%",
              padding: "8px",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            🗑 Clear Cache & Start Fresh
          </button>
        )}
      </div>

      {/* PDF Download button */}
      <button
        onClick={handleDownloadPDF}
        disabled={pdfState !== "idle" && pdfState !== "done" && pdfState !== "error"}
        style={{
          padding: "12px",
          background: pdfState === "done"
            ? "linear-gradient(135deg, #10b981, #059669)"
            : pdfState === "error"
            ? "rgba(239,68,68,0.2)"
            : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#fff",
          border: pdfState === "error" ? "1px solid rgba(239,68,68,0.5)" : "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          cursor: (pdfState === "idle" || pdfState === "done" || pdfState === "error") ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s",
          opacity: (pdfState !== "idle" && pdfState !== "done" && pdfState !== "error") ? 0.7 : 1,
        }}
      >
        {(pdfState === "loading" || pdfState === "rendering" || pdfState === "saving") && (
          <span style={{ display: "inline-block", animation: "wt-spin 0.8s linear infinite" }}>⟳</span>
        )}
        {pdfLabel()}
      </button>

      <button
        onClick={onReset}
        style={{
          padding: "10px",
          background: "#1e293b",
          color: "#94a3b8",
          border: "1px solid #334155",
          borderRadius: 10,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        ← Back to main menu
      </button>

      <style>{`
        @keyframes wt-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#6366f1" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{label}</div>
    </div>
  );
}
