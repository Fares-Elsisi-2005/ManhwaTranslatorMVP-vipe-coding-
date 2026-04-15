/**
 * Landing screen — shown when user hasn't set up the extension yet.
 * Based on wireframes Slide 1 & 2.
 * MVP: No real auth — just a "Get Started" flow.
 */

import React, { useState } from "react";

interface Props {
  onGetStarted: () => void;
}

export function LandingScreen({ onGetStarted }: Props) {
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterScreen onBack={() => setShowRegister(false)} onDone={onGetStarted} />;
  }

  return (
    <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      {/* Logo */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, boxShadow: "0 4px 16px rgba(99,102,241,0.4)"
      }}>
        📖
      </div>

      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
          webtoonTranslate
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
          Translate and learn words directly from webtoons while you read
        </p>
      </div>

      {/* Google button (placeholder in MVP) */}
      <button
        onClick={onGetStarted}
        style={{
          width: "100%",
          padding: "12px",
          background: "#fff",
          color: "#1e293b",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span>🌐</span> Continue with Google
      </button>

      <div style={{ color: "#64748b", fontSize: 13 }}>or</div>

      <button
        onClick={() => setShowRegister(true)}
        style={{ background: "none", border: "none", color: "#6366f1", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
      >
        Create account
      </button>
    </div>
  );
}

function RegisterScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
        }}>📖</div>
        <span style={{ fontWeight: 700, color: "#f1f5f9" }}>webtoonTranslate</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>
          Full Name
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </label>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>
          Email
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            type="email"
          />
        </label>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>
          Password
          <input
            style={{ ...inputStyle, marginTop: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
          />
        </label>
        <button
          onClick={onDone}
          style={{
            padding: "12px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Create Account
        </button>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
