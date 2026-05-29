import { useState } from "react";

// ─── Progress Ring ────────────────────────────────────────────────────────────
export function ProgressRing({ pct, size = 80, stroke = 7, color, label, sub, onClick }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: onClick ? "pointer" : "default" }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="var(--text)" fontSize={size * 0.19} fontFamily="Nunito, system-ui, sans-serif"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {pct}%
        </text>
      </svg>
      {label && <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", fontFamily: "'Nunito', system-ui, sans-serif" }}>{label}</div>}
      {sub && <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>{sub}</div>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div style={{ height, background: "var(--border)", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color || "var(--accent)", borderRadius: height / 2, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 10px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      {label && <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, id }) {
  return (
    <div
      id={id}
      onClick={onClick}
      style={{
        background: "var(--card)", borderRadius: 14, padding: "14px",
        border: "1px solid var(--border)", marginBottom: 10,
        cursor: onClick ? "pointer" : "default",
        transition: "opacity 0.15s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = "primary", small, disabled, style = {} }) {
  const base = {
    borderRadius: small ? 8 : 12, padding: small ? "6px 12px" : "12px 20px",
    fontSize: small ? 12 : 14, fontFamily: "'Nunito', system-ui, sans-serif",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, transition: "opacity 0.15s",
    fontWeight: "bold", ...style,
  };
  const variants = {
    primary: { background: "var(--accent)", color: "var(--bg)" },
    secondary: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" },
    danger: { background: "var(--danger)", color: "#fff" },
    ghost: { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 20,
      background: `${color || "var(--accent)"}22`,
      color: color || "var(--accent)",
      border: `1px solid ${color || "var(--accent)"}44`,
    }}>
      {children}
    </span>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, size = 22 }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: checked ? "var(--green)" : "transparent",
        border: `2px solid ${checked ? "var(--green)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
        fontSize: size * 0.55, color: "#fff",
      }}
    >
      {checked ? "✓" : ""}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, photoURL, size = 36 }) {
  if (photoURL) {
    return <img src={photoURL} alt={name} style={{ width: size, height: size, borderRadius: size / 2, border: "2px solid var(--accent)", objectFit: "cover" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: "var(--card)", border: "2px solid var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, color: "var(--accent-light)", fontFamily: "'Nunito', system-ui, sans-serif",
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success" }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: type === "success" ? "var(--green)" : "var(--danger)",
      color: "#fff", padding: "10px 20px", borderRadius: 20,
      fontSize: 13, fontFamily: "'Nunito', system-ui, sans-serif", zIndex: 1000,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeIn 0.2s ease",
    }}>
      {message}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "var(--surface)", borderRadius: "20px 20px 0 0",
        padding: "20px 16px 32px", width: "100%", maxWidth: 480,
        border: "1px solid var(--border)", borderBottom: "none",
        maxHeight: "80vh", overflowY: "auto",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, color: "var(--text)", fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: "bold" }}>{title}</div>
          <div onClick={onClose} style={{ fontSize: 20, color: "var(--text-muted)", cursor: "pointer", padding: "0 4px" }}>✕</div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        border: "3px solid var(--border)", borderTopColor: "var(--accent)",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}
