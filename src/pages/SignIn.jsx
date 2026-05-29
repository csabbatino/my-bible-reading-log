import { useState } from "react";
import {
  signInWithGoogle,
  signInWithEmail,
  createAccountWithEmail,
  sendPasswordReset,
} from "../utils/firebase.js";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4"/>
    <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.8-2.7.8-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z" fill="#34A853"/>
    <path d="M4.51 10.56A4.8 4.8 0 0 1 4.26 9c0-.54.09-1.07.25-1.56V5.37H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.63l2.63-2.07z" fill="#FBBC05"/>
    <path d="M8.98 3.58c1.18 0 2.24.4 3.07 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.37l2.63 2.07c.63-1.89 2.38-3.29 4.47-3.29z" fill="#EA4335"/>
  </svg>
);

const OpenBookIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("main"); // "main" | "signin" | "register" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try { await signInWithGoogle(); }
    catch { setError("Sign in failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try { await signInWithEmail(email, password); }
    catch (e) { setError(e.message?.includes("wrong-password") || e.message?.includes("user-not-found") ? "Email or password not recognised." : "Sign in failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password) { setError("Please enter an email and choose a password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try { await createAccountWithEmail(email, password); }
    catch (e) { setError(e.message?.includes("email-already-in-use") ? "An account with that email already exists." : "Could not create account. Please try again."); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) { setError("Enter your email address above first."); return; }
    setLoading(true); setError("");
    try { await sendPasswordReset(email); setResetSent(true); }
    catch { setError("Could not send reset email. Check the address and try again."); }
    finally { setLoading(false); }
  };

  const s = {
    wrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "16px 24px 32px", fontFamily: "'Nunito', system-ui, sans-serif" },
    heading: { fontSize: 26, color: "var(--text)", margin: "0 0 8px", fontWeight: 800, letterSpacing: "-0.5px" },
    muted: { fontSize: 15, color: "var(--text-muted)", margin: 0, fontWeight: 500, lineHeight: 1.4 },
    purpose: { fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: "14px 0 16px", padding: "12px 14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" },
    bullet: { display: "flex", alignItems: "center", gap: 10, marginBottom: 9 },
    dot: { width: 6, height: 6, borderRadius: 3, background: "var(--accent)", flexShrink: 0 },
    bulletText: { fontSize: 14, color: "var(--text-muted)", lineHeight: 1.4 },
    googleBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 20px", borderRadius: 10, background: "#fff", color: "#1a1a1a", border: "none", cursor: loading ? "wait" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito', system-ui, sans-serif", opacity: loading ? 0.7 : 1, boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "opacity 0.15s" },
    orDivider: { display: "flex", alignItems: "center", gap: 10, margin: "14px 0" },
    orLine: { flex: 1, height: 1, background: "var(--border)" },
    orText: { fontSize: 12, color: "var(--text-muted)" },
    emailBtn: { width: "100%", padding: "13px 20px", borderRadius: 10, background: "transparent", color: "var(--text)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito', system-ui, sans-serif" },
    input: { width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, fontFamily: "'Nunito', system-ui, sans-serif", outline: "none", marginBottom: 10 },
    primaryBtn: { width: "100%", padding: "13px 20px", borderRadius: 10, background: "var(--accent)", color: "var(--bg)", border: "none", cursor: loading ? "wait" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito', system-ui, sans-serif", opacity: loading ? 0.7 : 1, marginBottom: 10 },
    linkRow: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
    link: { fontSize: 13, color: "var(--accent)", cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "'Nunito', system-ui, sans-serif" },
    backLink: { fontSize: 13, color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "'Nunito', system-ui, sans-serif", marginTop: 8, display: "block", textAlign: "center" },
    privacy: { marginTop: 24, fontSize: 12, color: "var(--text-muted)", textAlign: "center", maxWidth: 280, lineHeight: 1.6 },
    error: { marginTop: 12, fontSize: 13, color: "var(--danger)", textAlign: "center" },
  };

  const maxW = { width: "100%", maxWidth: 320 };

  return (
    <div style={s.wrap}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ color: "var(--accent)", marginBottom: 14, opacity: 0.9 }}><OpenBookIcon /></div>
        <h1 style={s.heading}>Daily Bible Reading Log</h1>
        <p style={s.muted}>Make Bible reading a daily habit.</p>
      </div>

      <div style={maxW}>
        {mode === "main" && (
          <>
            {/* Purpose summary */}
            <p style={s.purpose}>
              Reading the entire Bible is one of the most rewarding goals a person can set.
              This app helps you build a consistent daily habit — tracking every chapter across
              all 66 books, celebrating milestones, and letting your family cheer you on.
            </p>

            {/* Feature bullets */}
            <div style={{ marginBottom: 28 }}>
              {[
                "Track all 66 books, chapter by chapter",
                "Build streaks and track your daily pace",
                "Share progress with your family",
                "Read directly on JW.org from the app",
              ].map((text) => (
                <div key={text} style={s.bullet}>
                  <div style={s.dot} />
                  <span style={s.bulletText}>{text}</span>
                </div>
              ))}
            </div>

            {/* Sign in options */}
            <button onClick={handleGoogle} disabled={loading} style={s.googleBtn}>
              <GoogleIcon />
              {loading ? "Signing in…" : "Continue with Google"}
            </button>

            <div style={s.orDivider}>
              <div style={s.orLine} />
              <span style={s.orText}>or</span>
              <div style={s.orLine} />
            </div>

            <button onClick={() => { setMode("signin"); setError(""); }} style={s.emailBtn}>
              Sign in with email
            </button>
          </>
        )}

        {mode === "signin" && (
          <>
            <div style={{ fontSize: 18, color: "var(--text)", fontWeight: 800, marginBottom: 18 }}>Sign in</div>
            <input style={s.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <input style={s.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()} />
            <button onClick={handleEmailSignIn} disabled={loading} style={s.primaryBtn}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <div style={s.linkRow}>
              <button style={s.link} onClick={() => { setMode("register"); setError(""); }}>Create an account</button>
              <button style={s.link} onClick={() => { setMode("reset"); setError(""); }}>Forgot password?</button>
            </div>
            <button style={s.backLink} onClick={() => { setMode("main"); setError(""); }}>← Back</button>
          </>
        )}

        {mode === "register" && (
          <>
            <div style={{ fontSize: 18, color: "var(--text)", fontWeight: 800, marginBottom: 18 }}>Create account</div>
            <input style={s.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <input style={s.input} type="password" placeholder="Password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
            <button onClick={handleRegister} disabled={loading} style={s.primaryBtn}>
              {loading ? "Creating account…" : "Create account"}
            </button>
            <button style={s.backLink} onClick={() => { setMode("signin"); setError(""); }}>← Back to sign in</button>
          </>
        )}

        {mode === "reset" && (
          <>
            <div style={{ fontSize: 18, color: "var(--text)", fontWeight: 800, marginBottom: 8 }}>Reset password</div>
            {resetSent ? (
              <>
                <div style={{ fontSize: 14, color: "var(--green)", lineHeight: 1.6, marginBottom: 16 }}>
                  Check your inbox — we sent a reset link to {email}.
                </div>
                <button style={s.backLink} onClick={() => { setMode("signin"); setResetSent(false); setError(""); }}>← Back to sign in</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</div>
                <input style={s.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                <button onClick={handleReset} disabled={loading} style={s.primaryBtn}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
                <button style={s.backLink} onClick={() => { setMode("signin"); setError(""); }}>← Back to sign in</button>
              </>
            )}
          </>
        )}

        {error && <div style={s.error}>{error}</div>}

        <div style={s.privacy}>
          Sign-in is only used to save your reading progress. We will not send promotional emails and no other personal information is required.
        </div>
      </div>
    </div>
  );
}
