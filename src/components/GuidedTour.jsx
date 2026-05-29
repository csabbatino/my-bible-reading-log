import { useState, useEffect } from "react";
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
const PAD = 7; // px padding around the spotlight target

export default function GuidedTour({ uid, currentPage, onNavigate, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null); // viewport-relative rect of the target

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / TOUR_STEPS.length) * 100);

  // Navigate to correct screen when step changes
  useEffect(() => {
    if (step.screen === "chapters" && currentPage !== "chapters") {
      onNavigate("chapters", { bookId: DEMO_BOOK_ID });
    } else if (step.screen !== "chapters" && currentPage !== step.screen) {
      onNavigate(step.screen);
    }
  }, [stepIndex]);

  // Measure target element position (viewport-relative, so fixed positioning works)
  useEffect(() => {
    setRect(null);
    let cancelled = false;
    const tryFind = (attempts = 0) => {
      if (cancelled) return;
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Re-measure after scroll settles
        setTimeout(() => {
          if (cancelled) return;
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, 380);
      } else if (attempts < 12) {
        setTimeout(() => tryFind(attempts + 1), 150);
      }
    };
    tryFind();
    return () => { cancelled = true; };
  }, [stepIndex, currentPage]);

  const handleNext = async () => {
    if (isLast) { await markTourCompleted(uid); onComplete(); }
    else setStepIndex((i) => i + 1);
  };
  const handleSkip = async () => { await markTourCompleted(uid); onComplete(); };

  // Spotlight geometry (viewport-relative, used with position:fixed)
  const sl = rect ? {
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  } : null;

  // Build the four dark rectangles that surround the spotlight hole.
  // All positioned fixed, all pointer-events:none so the target stays tappable.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rects = sl ? [
    // top strip
    { top: 0,                left: 0,       width: vw,       height: sl.top },
    // bottom strip
    { top: sl.top + sl.height, left: 0,     width: vw,       height: vh - sl.top - sl.height },
    // left strip (between top and bottom)
    { top: sl.top,           left: 0,       width: sl.left,  height: sl.height },
    // right strip (between top and bottom)
    { top: sl.top,           left: sl.left + sl.width, width: vw - sl.left - sl.width, height: sl.height },
  ] : [
    { top: 0, left: 0, width: vw, height: vh },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, pointerEvents: "none" }}>

      {/* Four dark panels that frame the spotlight hole */}
      {rects.map((r, i) => (
        <div key={i} style={{
          position: "fixed",
          top: r.top, left: r.left, width: r.width, height: r.height,
          background: "rgba(0,0,0,0.75)",
          pointerEvents: "auto",
        }} onClick={(e) => e.stopPropagation()} />
      ))}

      {/* Highlight border around the target */}
      {sl && (
        <div style={{
          position: "fixed",
          top: sl.top, left: sl.left,
          width: sl.width, height: sl.height,
          borderRadius: 12,
          border: "2.5px solid rgba(255,255,255,0.85)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.2), 0 0 24px rgba(255,255,255,0.15)",
          pointerEvents: "none",
          zIndex: 401,
          transition: "top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease",
        }} />
      )}

      {/* Tour card — fixed to bottom, above everything */}
      <div style={{
        position: "fixed", bottom: 90, left: 16, right: 16,
        zIndex: 402, pointerEvents: "auto",
      }}>
        <div style={{
          background: "var(--surface)", borderRadius: 20, padding: "20px",
          border: "1px solid var(--border)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
        }}>
          {/* Step progress bar */}
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.3s ease" }} />
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
    </div>
  );
}
