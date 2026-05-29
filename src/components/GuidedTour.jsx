import { useState, useEffect, useRef } from "react";
import { markTourCompleted } from "../utils/goals.js";

const TOUR_STEPS = [
  { id: "streak",        screen: "dashboard", targetId: "tour-streak",        title: "Streak & Pace",         tip: "Build a daily reading habit and track your pace over the last 7 days." },
  { id: "goal",          screen: "dashboard", targetId: "tour-goal",           title: "Weekly Goal",           tip: "Set a weekly chapter goal and the app tracks your progress Monday through Sunday." },
  { id: "continue",      screen: "dashboard", targetId: "tour-continue",       title: "Currently Reading",     tip: "Picks up where you left off — shows your active book and how far you've come." },
  { id: "books",         screen: "books",     targetId: "tour-books-list",     title: "Books",                 tip: "Browse all books organised by section — tap any book to see its chapters." },
  { id: "aboutbook",     screen: "chapters",  targetId: "tour-book-info",      title: "About This Book",       tip: "Each book shows its writer, location, and time period covered." },
  { id: "intro",         screen: "chapters",  targetId: "tour-intro-link",     title: "Introduction Link",     tip: "Tap to watch the book's introduction video on JW.org." },
  { id: "readlink",      screen: "chapters",  targetId: "tour-read-link",      title: "Read on JW.org",        tip: "Opens that chapter directly on JW.org in a new tab." },
  { id: "notes",         screen: "chapters",  targetId: "tour-notes",          title: "Chapter Notes",         tip: "Jot down personal reflections — private by default, shareable with family." },
  { id: "family",        screen: "family",    targetId: "tour-family",         title: "Family Tab",            tip: "See your family's streaks, pace, and progress side by side." },
  { id: "themes",        screen: "settings",  targetId: "tour-themes",         title: "Themes",                tip: "Each family member can choose their own colour theme." },
  { id: "notifications", screen: "settings",  targetId: "tour-notifications",  title: "Notifications",         tip: "Enable push notifications for book completions and streak milestones." },
];

const DEMO_BOOK_ID = "gen";

export default function GuidedTour({ uid, currentPage, onNavigate, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null); // { top, left, width, height }

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const progress = Math.round(((stepIndex + 1) / TOUR_STEPS.length) * 100);

  // Navigate to the right screen when step changes
  useEffect(() => {
    if (step.screen === "chapters" && currentPage !== "chapters") {
      onNavigate("chapters", { bookId: DEMO_BOOK_ID });
    } else if (step.screen !== "chapters" && currentPage !== step.screen) {
      onNavigate(step.screen);
    }
  }, [stepIndex]);

  // Find the target element and compute spotlight rect
  useEffect(() => {
    const tryFind = (attempts = 0) => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const r = el.getBoundingClientRect();
        const scrollY = window.scrollY || 0;
        // Scroll element into view with some breathing room
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Wait for scroll to settle then re-measure
        setTimeout(() => {
          const r2 = el.getBoundingClientRect();
          setSpotlight({
            top: r2.top + window.scrollY - 6,
            left: r2.left - 6,
            width: r2.width + 12,
            height: r2.height + 12,
          });
        }, 350);
      } else if (attempts < 10) {
        setTimeout(() => tryFind(attempts + 1), 150);
      } else {
        setSpotlight(null);
      }
    };
    setSpotlight(null);
    tryFind();
  }, [stepIndex, currentPage]);

  const handleNext = async () => {
    if (isLast) { await markTourCompleted(uid); onComplete(); }
    else setStepIndex((i) => i + 1);
  };

  const handleSkip = async () => { await markTourCompleted(uid); onComplete(); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, pointerEvents: "none" }}>
      {/* Dark overlay — full screen */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", pointerEvents: "auto" }} onClick={() => {}} />

      {/* Spotlight cutout using box-shadow trick */}
      {spotlight && (
        <div style={{
          position: "absolute",
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: 10,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
          border: "2px solid rgba(255,255,255,0.6)",
          zIndex: 301,
          pointerEvents: "none",
          transition: "all 0.3s ease",
        }} />
      )}

      {/* Tour card — fixed to bottom of viewport */}
      <div style={{
        position: "fixed", bottom: 90, left: 16, right: 16,
        zIndex: 302, pointerEvents: "auto",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{
          background: "var(--surface)", borderRadius: 20, padding: "20px",
          border: "1px solid var(--border)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.4)",
        }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>

          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            {stepIndex + 1} of {TOUR_STEPS.length}
          </div>
          <div style={{ fontSize: 18, color: "var(--accent-light)", fontWeight: 800, marginBottom: 6, letterSpacing: "-0.3px" }}>
            {step.title}
          </div>
          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 20 }}>
            {step.tip}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSkip} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}>
              Skip Tour
            </button>
            <button onClick={handleNext} style={{ flex: 2, padding: "10px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: "var(--accent)", color: "var(--bg)", border: "none", cursor: "pointer" }}>
              {isLast ? "Done!" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
