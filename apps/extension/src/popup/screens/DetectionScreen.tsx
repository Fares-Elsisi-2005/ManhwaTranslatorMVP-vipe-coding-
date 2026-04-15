/**
 * Detection screen — shows all detected images with checkboxes.
 * Based on wireframe Slide 4.
 * User can select/deselect images before starting translation.
 */

import React, { useState } from "react";
import type { DetectedImage } from "../../types.js";

interface Props {
  images: DetectedImage[];
  onStartTranslation: (selected: DetectedImage[]) => void;
  onBack: () => void;
}

export function DetectionScreen({ images, onStartTranslation, onBack }: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(images.map((img) => img.index))
  );

  function toggleImage(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(images.map((img) => img.index)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const selectedImages = images.filter((img) => selected.has(img.index));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar — matches wireframe Slide 4 */}
      <div style={{
        background: "#3b82f6",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {/* Logo */}
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>📖</div>

        <span style={{ fontWeight: 700, color: "#fff", fontSize: 13, flex: 1 }}>webtoonTranslate</span>

        <button onClick={() => setSelected(new Set(images.map(i => i.index)))} style={toolBtn}>↩ Undo</button>
        <button onClick={deselectAll} style={toolBtn}>Deselect All</button>
        <button onClick={selectAll} style={toolBtn}>Select All</button>

        <button
          onClick={() => onStartTranslation(selectedImages)}
          disabled={selectedCount === 0}
          style={{
            ...toolBtn,
            background: selectedCount > 0 ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.1)",
            fontWeight: 700,
            padding: "6px 12px",
            opacity: selectedCount === 0 ? 0.5 : 1,
          }}
        >
          Start Translation
        </button>

        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>×</button>
      </div>

      {/* Status bar */}
      <div style={{
        padding: "6px 12px",
        background: "#1e293b",
        borderBottom: "1px solid #334155",
        fontSize: 12,
        color: "#94a3b8",
        display: "flex",
        gap: 20,
      }}>
        <span>Detected images: <strong style={{ color: "#f1f5f9" }}>{images.length}</strong></span>
        <span>Selected: <strong style={{ color: "#6366f1" }}>{selectedCount}</strong></span>
      </div>

      {/* Image list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px", maxHeight: 380 }}>
        {images.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "40px 20px" }}>
            No episode images found on this page.<br />
            Make sure you're on a Webtoon episode page.
          </div>
        ) : (
          images.map((img) => (
            <ImageRow
              key={img.index}
              img={img}
              checked={selected.has(img.index)}
              onToggle={() => toggleImage(img.index)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ImageRow({
  img,
  checked,
  onToggle,
}: {
  img: DetectedImage;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px",
        borderRadius: 8,
        cursor: "pointer",
        marginBottom: 4,
        background: checked ? "rgba(99,102,241,0.1)" : "transparent",
        border: `1px solid ${checked ? "rgba(99,102,241,0.3)" : "transparent"}`,
        transition: "all 0.15s",
      }}
    >
      {/* Thumbnail placeholder */}
      <div style={{
        width: 50, height: 40,
        background: "#1e293b",
        borderRadius: 6,
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: "#64748b",
      }}>
        {img.index + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>Image {img.index + 1}</div>
        <div style={{ fontSize: 10, color: "#64748b" }}>
          {img.naturalWidth > 0 ? `${img.naturalWidth} × ${img.naturalHeight}` : "Loading..."}
        </div>
      </div>

      {/* Checkbox */}
      <div style={{
        width: 20, height: 20,
        borderRadius: 4,
        border: `2px solid ${checked ? "#6366f1" : "#475569"}`,
        background: checked ? "#6366f1" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 12, flexShrink: 0,
        transition: "all 0.15s",
      }}>
        {checked && "✓"}
      </div>
    </div>
  );
}

const toolBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: "#fff",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 11,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
