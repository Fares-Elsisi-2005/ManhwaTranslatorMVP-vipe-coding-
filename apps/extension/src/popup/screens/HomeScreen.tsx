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
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              Detecting images...
            </>
          ) : (
            <>🔍 Start Detection</>
          )}
        </button>
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
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
