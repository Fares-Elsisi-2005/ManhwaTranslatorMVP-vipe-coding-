/**
 * Error screen — shows when something goes wrong during processing.
 */

import React from "react";

interface Props {
  error: string;
  onReset: () => void;
}

export function ErrorScreen({ error, onReset }: Props) {
  return (
    <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(239,68,68,0.15)",
        border: "2px solid rgba(239,68,68,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 30,
      }}>⚠️</div>

      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{error}</p>
      </div>

      <div style={{
        background: "#1e293b",
        borderRadius: 8,
        padding: "12px 14px",
        fontSize: 12,
        color: "#64748b",
        width: "100%",
      }}>
        <strong style={{ color: "#94a3b8" }}>Common fixes:</strong>
        <ul style={{ marginTop: 6, paddingLeft: 16, lineHeight: 1.8 }}>
          <li>Make sure the backend server is running</li>
          <li>Check that you're on a Webtoon episode page</li>
          <li>Try refreshing the page and retrying</li>
        </ul>
      </div>

      <button
        onClick={onReset}
        style={{
          width: "100%",
          padding: "12px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
