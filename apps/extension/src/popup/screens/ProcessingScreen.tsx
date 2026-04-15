/**
 * Processing screen — shown while backend processes images.
 * Based on wireframe Slide 5.
 * Transparent purple overlay with progress counter and cancel button.
 */

import React from "react";

interface Props {
  processed: number;
  total: number;
  onCancel: () => void;
}

export function ProcessingScreen({ processed, total, onCancel }: Props) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div style={{
      minHeight: 480,
      background: "rgba(109,40,217,0.15)",
      backdropFilter: "blur(4px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Processing card */}
      <div style={{
        background: "#7c3aed",
        borderRadius: 16,
        padding: "24px 28px",
        width: "100%",
        maxWidth: 280,
        textAlign: "center",
        boxShadow: "0 8px 32px rgba(109,40,217,0.5)",
      }}>
        {/* Logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>📖</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>webtoon translator</span>
        </div>

        {/* Spinner */}
        <div style={{
          width: 48, height: 48, margin: "0 auto 16px",
          border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "wt-spin 0.8s linear infinite",
        }} />

        <p style={{ color: "#e9d5ff", fontSize: 14, marginBottom: 8 }}>
          Processing images ...
        </p>

        {/* Progress counter */}
        <div style={{
          fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 20,
        }}>
          {processed} / {total}
        </div>

        {/* Progress bar */}
        <div style={{
          width: "100%", height: 6,
          background: "rgba(255,255,255,0.2)",
          borderRadius: 3,
          marginBottom: 20,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${percent}%`,
            background: "#a855f7",
            borderRadius: 3,
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          style={{
            padding: "12px 32px",
            background: "#ec4899",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(236,72,153,0.4)",
          }}
        >
          cancel
        </button>
      </div>

      <style>{`
        @keyframes wt-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
