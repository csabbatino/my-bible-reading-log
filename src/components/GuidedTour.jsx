import { useState, useEffect, useCallback } from "react";
import { markTourCompleted } from "../utils/goals.js";

const TOUR_STEPS = [
  { id: "streak",        screen: "dashboard", targetId: "tour-streak",        title: "Streak & Pace",         tip: "Build a daily reading habit and track your pace over the last 7 days.", clampHeight: false },
  { id: "goal",          screen: "dashboard", targetId: "tour-goal",           title: "Weekly Goal",           tip: "Set a weekly chapter goal and the app tracks your progress Monday through Sunday.", clampHeight: false },
  { id: "continue",      screen: "dashboard", targetId: "tour-continue",       title: "Currently Reading",     tip: "Picks up where you left off — shows your active book and how far you've come.", clampHeight: false },
  { id: "books",         screen: "books",     targetId: "tour-books-list",     title: "Books",                 tip: "Browse all books organised by section — tap any book to see its chapters.", clampHeight: true },
  { id: "aboutbook",     screen: "chapters",  targetId: "tour-book-info",      title: "About This Book",       tip: "Each book shows its writer, location, and time period covered.", clampHeight: false },
  { id: "intro",         screen: "chapters",  targetId: "tour-intro-link",     title: "Introduction Link",     tip: "Tap to watch the book's introduction video on JW.org.", clampHeight: false },
  { id: "readlink",      screen: "chapters",  targetId: "tour-read-link",      title: "Read on JW.org",        tip: "Opens that chapter directly on JW.org in a new tab.", clampHeight: false },
  { id: "notes",         screen: "chapters",  targetId: "tour-notes",          title: "Chapter Notes",         tip: "Tap the 📝 icon on any read chapter to jot down personal reflections — private by default, shareable with family.", clampHeight: false },
  { id: "family",        screen: "family",    targetId: "tour-family",         title: "Family Tab",            tip: "See your family's streaks, pace, and progress side by side.", clampHeight: true },
  { id: "themes",        screen: "settings",  targetId: "tour-themes",         title: "Themes",                tip: "Each family member can choose their own colour theme.", clampHeight: false },
  { id: "notifications", screen: "settings",  targetId: "tour-notifications",  title: "Notifications",         tip: "Enable push notifications for book completions and streak milestones.", clampHeight: false },
];

const DEMO_BOOK_ID = "gen";
const PAD = 7;
const TOUR_CARD_APPROX_HEIGHT = 210; // px — approximate height of the tour card
const TOUR_CARD_BOTTOM_OFFSET = 90; // px from viewport bottom

export default function GuidedTour({ uid, currentPage, onNavigate, onComplete, scrollContainerId, headerId }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [sl, setSl] = useState(null);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / TOUR_STEPS.length) * 100);

  // Get the scrollable content div (not window)
  const getScrollEl = useCallback(() =>
    scrollContainerId ? document.getElementById(scrollContainerId) : null,
  [scrollContainerId]);

  // Get header height so we never place the spotlight under the sticky bar
  const getHeaderHeight = useCallback(() => {
    const el = headerId ? document.getElementById(headerId) : null;
    return el ? el.getBoundingClientRect().height : 0;
  }, [headerId]);

  // Navigate to correct screen
  useEffect(() => {
    if (step.screen === "chapters" && currentPage !== "chapters") {
      onNavigate("chapters", { bookId: DEMO_BOOK_ID });
    } else if (step.screen !== "chapters" && currentPage !== step.screen) {
      onNavigate(step.screen);
    }
  }, [stepIndex]);

  const measure = useCallback(() => {
    const el = document.getElementById(step.targetId);
    if (!el) return false;

    const headerH = getHeaderHeight();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Viewport-relative rect
    const r = el.getBoundingClientRect();

    // If element top is hidden behind header, scroll it into view first
    const scrollEl = getScrollEl();
    if (r.top < headerH + 8 && scrollEl) {
      scrollEl.scrollTop += r.top - headerH - 16;
      return false; // re-measure after scroll
    }

    let top    = r.top    - PAD;
    let left   = r.left   - PAD;
    let width  = r.width  + PAD * 2;
    let height = r.height + PAD * 2;

    // Never overlap the sticky header
    if (top < headerH) {
      const diff = headerH - top;
      top += diff;
      height = Math.max(0, height - diff);
    }

    // Clamp to viewport width
    left  = Math.max(0, left);
    width = Math.min(width, vw - left);

    // For full-page containers (clampHeight), cap height so it doesn't run
    // off-screen or behind the tour card
    const tourCardTop = vh - TOUR_CARD_BOTTOM_OFFSET - TOUR_CARD_APPROX_HEIGHT;
    if (step.clampHeight || top + height > tourCardTop - 16) {
      height = Math.min(height, tourCardTop - top - 16);
    }

    height = Math.max(0, height);

    setSl({ top, left, width, height });
    return true;
  }, [step, getHeaderHeight, getScrollEl]);

  useEffect(() => {
    setSl(null);
    let cancelled = false;
    let attempts = 0;

    const tryFind = () => {
      if (cancelled) return;
      const el = document.getElementById(step.targetId);
      if (el) {
        // Scroll the element into view via the scroll container
        const scrollEl = getScrollEl();
        const headerH = getHeaderHeight();
        if (scrollEl) {
          const r = el.getBoundingClientRect();
          const containerRect = scrollEl.getBoundingClientRect();
          // Scroll so the element top sits ~24px below the header
          const targetScrollTop = scrollEl.scrollTop + r.top - containerRect.top - headerH - 24;
          scrollEl.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Measure after scroll settles
        setTimeout(() => {
          if (cancelled) return;
          const ok = measure();
          if (!ok) {
            // One corrective re-measure
            setTimeout(() => { if (!cancelled) measure(); }, 380);
          }
        }, 420);
      } else if (attempts < 14) {
        attempts++;
        setTimeout(tryFind, 150);
      }
    };

    tryFind();
    return () => { cancelled = true; };
  }, [stepIndex, currentPage, measure, getScrollEl, getHeaderHeight]);

  const handleNext = async () => {
    if (isLast) { await markTourCompleted(uid); onComplete(); }
    else setStepIndex((i) => i + 1);
  };
  const handleSkip = async () => { await markTourCompleted(uid); onComplete(); };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Four dark panels surrounding the spotlight hole
  const panels = sl ? [
    { top: 0,                left: 0,                  width: vw,                         height: sl.top                         },
    { top: sl.top + sl.height, left: 0,                width: vw,                         height: vh - sl.top - sl.height        },
    { top: sl.top,           left: 0,                  width: sl.left,                    height: sl.height                      },
    { top: sl.top,           left: sl.left + sl.width, width: vw - sl.left - sl.width,    height: sl.height                      },
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

      {/* White border ring around spotlight */}
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

      {/* Tour card — fixed above the bottom nav */}
      <div style={{
        position: "fixed",
        bottom: TOUR_CARD_BOTTOM_OFFSET,
        left: 16, right: 16,
        zIndex: 402,
        pointerEvents: "auto",
      }}>
        <div style={{
          background: "var(--surface)", borderRadius: 20, padding: "20px",
          border: "1px solid var(--border)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
            {stepIndex + 1} of {TOUR_STEPS.length}
          </div>
          <div style={{ fontSize: 17, color: "var(--accent-light)", fontWeight: 800, marginBottom: 5, letterSpacing: "-0.3px" }}>
            {step.title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 18 }}>
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
