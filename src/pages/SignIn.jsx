import { useState } from "react";
import { signInWithGoogle, signInWithApple } from "../utils/firebase.js";

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
      background: "var(--bg)", padding: "24px 24px",
    }}>
      {/* Logo / title */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✝</div>
        <h1 style={{
          fontSize: 26, color: "var(--accent-light)",
          fontFamily: "Georgia, serif", margin: "0 0 8px",
          fontWeight: "bold",
        }}>
          My Bible Reading Log
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          Track your journey through Scripture
        </p>
      </div>

      {/* Feature highlights */}
      <div style={{ width: "100%", maxWidth: 320, marginBottom: 36 }}>
        {[
          ["📖", "Track all 66 books, chapter by chapter"],
          ["📊", "See your progress through the whole Bible"],
          ["👨‍👩‍👧", "Share progress with your family"],
          ["📝", "Jot down thoughts as you read"],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{icon}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "Georgia, serif" }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Sign in buttons */}
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => handleSignIn("google")}
          disabled={loading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px 20px", borderRadius: 12,
            background: "#fff", color: "#333",
            border: "none", cursor: loading ? "wait" : "pointer",
            fontSize: 15, fontFamily: "Georgia, serif", fontWeight: "bold",
            opacity: loading && loading !== "google" ? 0.5 : 1,
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.8-2.7.8-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.51 10.56A4.8 4.8 0 0 1 4.26 9c0-.54.09-1.07.25-1.56V5.37H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.63l2.63-2.07z"/>
            <path fill="#EA4335" d="M8.98 3.58c1.18 0 2.24.4 3.07 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.37l2.63 2.07c.63-1.89 2.38-3.29 4.47-3.29-.01 0 0-.57 0 0z"/>
          </svg>
          {loading === "google" ? "Signing in…" : "Continue with Google"}
        </button>

        <button
          onClick={() => handleSignIn("apple")}
          disabled={loading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px 20px", borderRadius: 12,
            background: "#000", color: "#fff",
            border: "none", cursor: loading ? "wait" : "pointer",
            fontSize: 15, fontFamily: "Georgia, serif", fontWeight: "bold",
            opacity: loading && loading !== "apple" ? 0.5 : 1,
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          <svg width="16" height="18" viewBox="0 0 16 18" fill="white">
            <path d="M13.18 9.5c-.02-2.17 1.77-3.22 1.85-3.27-1.01-1.47-2.57-1.67-3.13-1.69-1.33-.13-2.6.78-3.27.78-.67 0-1.7-.76-2.8-.74C4.27 4.6 2.78 5.6 1.97 7.1c-1.63 2.83-.42 7.03 1.17 9.33.78 1.12 1.7 2.38 2.92 2.33 1.17-.05 1.62-.75 3.04-.75 1.42 0 1.82.75 3.07.73 1.26-.02 2.06-1.14 2.83-2.27.9-1.3 1.27-2.57 1.29-2.63-.03-.01-2.48-.95-2.51-3.34zm-2.34-6.12c.65-.78 1.08-1.87.96-2.95-.93.04-2.05.62-2.72 1.38-.6.68-1.12 1.77-.98 2.81 1.03.08 2.09-.52 2.74-1.24z"/>
          </svg>
          {loading === "apple" ? "Signing in…" : "Continue with Apple"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, fontSize: 13, color: "var(--danger)", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 32, fontSize: 11, color: "var(--border)", textAlign: "center", maxWidth: 280 }}>
        Your reading data is private by default. Notes can optionally be shared with your family group.
      </div>
    </div>
  );
}
