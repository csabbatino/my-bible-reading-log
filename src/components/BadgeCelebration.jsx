import { useState, useEffect } from "react";
import Confetti from "./Confetti.jsx";

export default function BadgeCelebration({ badges, onDone }) {
  const [current, setCurrent] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  if (!badges || badges.length === 0) return null;

  const badge = badges[current];
  const isLast = current === badges.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDone();
    } else {
      setCurrent((c) => c + 1);
      setShowConfetti(true);
    }
  };

  const isBookBadge = badge.type === "book";
  const isBibleComplete = badge.id === "bible_complete";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />

      <div style={{
        background: "var(--surface)", borderRadius: 24, padding: "32px 24px",
        border: "2px solid var(--accent)", maxWidth: 320, width: "100%",
        textAlign: "center", position: "relative", zIndex: 401,
        boxShadow: "0 0 60px rgba(201,168,76,0.3)",
        animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {badges.length > 1 && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, letterSpacing: 1 }}>
            {current + 1} of {badges.length}
          </div>
        )}

        <div style={{ fontSize: isBibleComplete ? 64 : 52, marginBottom: 12, lineHeight: 1 }}>
          {badge.emoji}
        </div>

        <div style={{
          fontSize: isBibleComplete ? 20 : 17,
          color: "var(--accent-light)", fontFamily: "Georgia, serif",
          fontWeight: "bold", marginBottom: 8,
        }}>
          {isBibleComplete ? "🎉 Congratulations! 🎉" : isBookBadge ? "Book Complete!" : "Achievement Unlocked!"}
        </div>

        <div style={{
          fontSize: 22, color: "var(--text)", fontFamily: "Georgia, serif",
          fontWeight: "bold", marginBottom: 10,
        }}>
          {badge.label}
        </div>

        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, fontStyle: "italic" }}>
          {badge.description}
        </div>

        <button
          onClick={handleNext}
          style={{
            background: "var(--accent)", color: "var(--bg)", border: "none",
            borderRadius: 12, padding: "12px 32px", fontSize: 15,
            fontFamily: "Georgia, serif", fontWeight: "bold", cursor: "pointer",
            width: "100%",
          }}
        >
          {isLast ? (isBibleComplete ? "Praise God! 🙏" : "Thank You!") : "Next →"}
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
