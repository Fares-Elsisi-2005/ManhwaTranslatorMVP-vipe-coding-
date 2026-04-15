/**
 * Complete screen — shown after translation is done.
 * Shows a summary and lets user reset for another episode.
 */

import React from "react";
import type { EpisodeResult } from "../../types.js";

interface Props {
  result: EpisodeResult;
  onReset: () => void;
}

export function CompleteScreen({ result, onReset }: Props) {
  const totalWords = result.images.reduce((sum, img) => sum + img.words.length, 0);

  return (
    <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Success icon */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, margin: "0 auto 12px",
          boxShadow: "0 4px 20px rgba(16,185,129,0.4)",
        }}>✓</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Translation complete!</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Click any highlighted word on the page to see its translation.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        background: "#1e293b",
        borderRadius: 12,
        padding: "16px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}>
        <StatCard label="Images processed" value={result.totalImages} />
        <StatCard label="Words found" value={totalWords} />
        <StatCard label="From" value={result.sourceLang.toUpperCase()} />
        <StatCard label="To" value={result.targetLang.toUpperCase()} />
      </div>

      {/* Cached indicator */}
      <div style={{
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        color: "#10b981",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        💾 Results cached — revisiting this episode loads instantly
      </div>

      <button
        onClick={onReset}
        style={{
          padding: "12px",
          background: "#1e293b",
          color: "#94a3b8",
          border: "1px solid #334155",
          borderRadius: 10,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ← Back to main menu
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
    </div>
  );
}
