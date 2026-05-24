import { useState } from "react";
import { signInWithGoogle, signInWithApple } from "../utils/firebase.js";

// Clean monochrome SVG icons
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
    <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.8-2.7.8-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
    <path d="M4.51 10.56A4.8 4.8 0 0 1 4.26 9c0-.54.09-1.07.25-1.56V5.37H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.63l2.63-2.07z" fill="#FBBC05"/>
    <path d="M8.98 3.58c1.18 0 2.24.4 3.07 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.37l2.63 2.07c.63-1.89 2.38-3.29 4.47-3.29z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
    <path d="M13.18 9.5c-.02-2.17 1.77-3.22 1.85-3.27-1.01-1.47-2.57-1.67-3.13-1.69-1.33-.13-2.6.78-3.27.78-.67 0-1.7-.76-2.8-.74C4.27 4.6 2.78 5.6 1.97 7.1c-1.63 2.83-.42 7.03 1.17 9.33.78 1.12 1.7 2.38 2.92 2.33 1.17-.05 1.62-.75 3.04-.75 1.42 0 1.82.75 3.07.73 1.26-.02 2.06-1.14 2.83-2.27.9-1.3 1.27-2.57 1.29-2.63-.03-.01-2.48-.95-2.51-3.34zm-2.34-6.12c.65-.78 1.08-1.87.96-2.95-.93.04-2.05.62-2.72 1.38-.6.68-1.12 1.77-.98 2.81 1.03.08 2.09-.52 2.74-1.24z"/>
  </svg>
);

// Monochrome scripture icon — open book
const BookIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 10C24 10 18 7 8 8v28c10-1 16 2 16 2s6-3 16-2V8C30 7 24 10 24 10z"/>
    <line x1="24" y1="10" x2="24" y2="38"/>
    <line x1="14" y1="14" x2="20" y2="13"/>
    <line x1="14" y1="19" x2="20" y2="18"/>
    <line x1="14" y1="24" x2="20" y2="23"/>
    <line x1="28" y1="13" x2="34" y2="14"/>
    <line x1="28" y1="18" x2="34" y2="19"/>
    <line x1="28" y1="23" x2="34" y2="24"/>
  </svg>
);

export default function SignIn() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const handleSignIn = async (provider) => {
    setLoading(provider);
    setError("");
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithApple();
    } catch (e) {
      setError("Sign in failed. Please try again.");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "32px 24px",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ color: "var(--accent)", marginBottom: 20, opacity: 0.9 }}>
          <BookIcon />
        </div>
        <h1 style={{
          fontSize: 28, color: "var(--text)", margin: "0 0 8px",
          fontWeight: 700, letterSpacing: "-0.5px",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          My Bible Reading Log
        </h1>
        <p style={{
          fontSize: 15, color: "var(--text-muted)", margin: 0,
          fontWeight: 400, lineHeight: 1.5,
        }}>
          Track your journey through Scripture
        </p>
      </div>

      {/* Feature list */}
      <div style={{ width: "100%", maxWidth: 320, marginBottom: 40 }}>
        {[
          ["Track all 66 books, chapter by chapter"],
          ["See your progress through the whole Bible"],
          ["Share progress with your family"],
          ["Jot down thoughts as you read"],
        ].map(([text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 6, height: 6, borderRadius: 3,
              background: "var(--accent)", flexShrink: 0,
            }} />
            <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Sign in buttons */}
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => handleSignIn("google")}
          disabled={loading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "13px 20px", borderRadius: 10,
            background: "#fff", color: "#1a1a1a",
            border: "none", cursor: loading ? "wait" : "pointer",
            fontSize: 14, fontWeight: 600,
            fontFamily: "'Inter', system-ui, sans-serif",
            opacity: loading && loading !== "google" ? 0.5 : 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "opacity 0.15s",
          }}
        >
          <GoogleIcon />
          {loading === "google" ? "Signing in…" : "Continue with Google"}
        </button>

        <button
          onClick={() => handleSignIn("apple")}
          disabled={loading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "13px 20px", borderRadius: 10,
            background: "#000", color: "#fff",
            border: "none", cursor: loading ? "wait" : "pointer",
            fontSize: 14, fontWeight: 600,
            fontFamily: "'Inter', system-ui, sans-serif",
            opacity: loading && loading !== "apple" ? 0.5 : 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "opacity 0.15s",
          }}
        >
          <AppleIcon />
          {loading === "apple" ? "Signing in…" : "Continue with Apple"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, fontSize: 13, color: "var(--danger)", textAlign: "center" }}>
          {error}
        </div>
      )}

      {/* Footer note — high contrast */}
      <div style={{
        marginTop: 40, fontSize: 12, color: "var(--text-muted)",
        textAlign: "center", maxWidth: 280, lineHeight: 1.6, opacity: 1,
      }}>
        Your reading data is private by default. Notes can optionally be shared with your family group.
      </div>
    </div>
  );
}
