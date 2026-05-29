import { useState, useEffect, useCallback } from "react";
import { markTourCompleted } from "../utils/goals.js";

const TOUR_STEPS = [
  { id: "streak",        screen: "dashboard", targetId: "tour-streak",        title: "Streak & Pace",         tip: "Build a daily reading habit and track your pace over the last 7 days." },
  { id: "goal",          screen: "dashboard", targetId: "tour-goal",           title: "Weekly Goal",           tip: "Set a weekly chapter goal and the app tracks your progress Monday through Sunday." },
  { id: "continue",      screen: "dashboard", targetId: "tour-continue",       title: "Currently Reading",     tip: "Picks up where you left off — shows your active book and how far you've come." },
  { id: "books",         screen: "books",     targetId: "tour-books-list",     title: "Books",                 tip: "Browse all books organised by section — tap any book to see its chapters.", clampHeight: true },
  { id: "aboutbook",     screen: "chapters",  targetId: "tour-book-info",      title: "About This Book",       tip: "Each book shows its writer, location, and time period covered." },
  { id: "intro",         screen: "chapters",  targetId: "tour-intro-link",     title: "Introduction Link",     tip: "Tap to watch the book's introduction video on JW.org." },
  { id: "readlink",      screen: "chapters",  targetId: "tour-read-link",      title: "Read on JW.org",        tip: "Opens that chapter directly on JW.org in a new tab." },
  { id: "notes",         screen: "chapters",  targetId: "tour-notes",          title: "Chapter Notes",         tip: "Tap the 📝 icon on any read chapter to jot down personal reflections — private by default, shareable with family." },
  { id: "family",        screen: "family",    targetId: "tour-family",         title: "Family Tab",            tip: "See your family's streaks, pace, and progress side by side.", clampHeight: true },
  { id: "themes",        screen: "settings",  targetId: "tour-themes",         title: "Themes",                tip: "Each family member can choose their own colour theme." },
  { id: "notifications", screen: "settings",  targetId: "tour-notifications",  title: "Notifications",         tip: "Enable push notifications for book completions and streak milestones." },
];

const DEMO_BOOK_ID = "gen";
const PAD = 7;
// Height of the fixed tour card + its bottom offset + breathing room
const TOUR_CARD_HEIGHT = 220;
const TOUR_CARD_BOTTOM = 90;
const TOUR_CARD_TOP = () => window.innerHeight - TOUR_CARD_BOTTOM - TOUR_CARD_HEIGHT;

export default function GuidedTour({ uid, currentPage, onNavigate, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [sl, setSl] = useState(null); // final clamped spotlight rect (viewport-fixed)

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

  const measureAndSet = useCallback(() => {
    const el = document.getElementById(step.targetId);
    if (!el) return false;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Raw viewport rect
    const r = el.getBoundingClientRect();

    let top    = r.top    - PAD;
    let left   = r.left   - PAD;
    let width  = r.width  + PAD * 2;
    let height = r.height + PAD * 2;

    // Clamp to viewport bounds (handles full-page containers on mobile)
    top    = Math.max(0, top);
    left   = Math.max(0, left);
    width  = Math.min(width,  vw - left);
    height = Math.min(height, vh - top);

    // If step.clampHeight, only show the visible top portion of the element
    // rather than letting it extend behind the tour card
    if (step.clampHeight) {
      const maxBottom = TOUR_CARD_TOP() - 16; // 16px gap above the card
      height = Math.min(height, maxBottom - top);
    }

    // If the spotlight bottom would overlap the tour card, scroll the element
    // upward so there's room. Re-measure once after scrolling.
    const slBottom = top + height;
    const cardTop = TOUR_CARD_TOP();
    if (slBottom > cardTop - 16) {
      // Scroll element so its bottom sits above the card
      const needed = slBottom - (cardTop - 32);
      window.scrollBy({ top: needed, behavior: "smooth" });
      return false; // will re-measure on next attempt
    }

    setSl({ top, left, width, height });
    return true;
  }, [step]);

  useEffect(() => {
    setSl(null);
    let cancelled = false;
    let attempts = 0;

    const tryFind = () => {
      if (cancelled) return;
      const el = document.getElementById(step.targetId);
      if (el) {
        // First scroll into view
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Wait for scroll to settle, then measure (and possibly re-scroll once)
        setTimeout(() => {
          if (cancelled) return;
          const done = measureAndSet();
          if (!done) {
            // One re-measure after the corrective scroll
            setTimeout(() => { if (!cancelled) measureAndSet(); }, 400);
          }
        }, 420);
      } else if (attempts < 14) {
        attempts++;
        setTimeout(tryFind, 150);
      }
    };

    tryFind();
    return () => { cancelled = true; };
  }, [stepIndex, currentPage, measureAndSet]);

  const handleNext = async () => {
    if (isLast) { await markTourCompleted(uid); onComplete(); }
    else setStepIndex((i) => i + 1);
  };
  const handleSkip = async () => { await markTourCompleted(uid); onComplete(); };

  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;

  // Four dark panels that frame the spotlight hole
  const panels = sl ? [
    { top: 0,              left: 0,              width: vw,                    height: sl.top },
    { top: sl.top + sl.height, left: 0,          width: vw,                    height: vh - sl.top - sl.height },
    { top: sl.top,         left: 0,              width: sl.left,               height: sl.height },
    { top: sl.top,         left: sl.left + sl.width, width: vw - sl.left - sl.width, height: sl.height },
  ] : [
    { top: 0, left: 0, width: vw, height: vh },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, pointerEvents: "none" }}>

      {/* Four dark overlay panels */}
      {panels.map((p, i) => (
        <div key={i} style={{
          position: "fixed",
          top: p.top, left: p.left,
          width: Math.max(0, p.width),
          height: Math.max(0, p.height),
          background: "rgba(0,0,0,0.75)",
          pointerEvents: "auto",
        }} onClick={(e) => e.stopPropagation()} />
      ))}

      {/* White border ring around the spotlight */}
      {sl && (
        <div style={{
          position: "fixed",
          top: sl.top, left: sl.left,
          width: sl.width, height: sl.height,
          borderRadius: 12,
          border: "2.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.25), 0 0 28px rgba(255,255,255,0.18)",
          pointerEvents: "none",
          zIndex: 401,
          transition: "all 0.3s ease",
        }} />
      )}

      {/* Tour card */}
      <div style={{
        position: "fixed",
        bottom: TOUR_CARD_BOTTOM,
        left: 16, right: 16,
        zIndex: 402,
        pointerEvents: "auto",
      }}>
        <div style={{
          background: "var(--surface)", borderRadius: 20, padding: "20px",
          border: "1px solid var(--border)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
        }}>
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
