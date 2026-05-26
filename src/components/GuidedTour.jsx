import { useState, useEffect } from "react";
import { markTourCompleted } from "../utils/goals.js";

const TOUR_STEPS = [
  {
    id: "streak",
    screen: "dashboard",
    title: "Streak & Pace",
    tip: "Build a daily reading habit and track your pace over the last 7 days.",
    position: "bottom",
  },
  {
    id: "goal",
    screen: "dashboard",
    title: "Weekly Goal",
    tip: "Set a weekly chapter goal and the app tracks your progress Monday through Sunday.",
    position: "bottom",
  },
  {
    id: "continue",
    screen: "dashboard",
    title: "Continue Reading",
    tip: "Picks up where you left off across all 66 books.",
    position: "bottom",
  },
  {
    id: "books",
    screen: "books",
    title: "Books",
    tip: "Browse all books organized by section — tap any book to see its chapters.",
    position: "bottom",
  },
  {
    id: "aboutbook",
    screen: "chapters",
    title: "About This Book",
    tip: "Each book shows its writer, location, and time period covered.",
    position: "bottom",
  },
  {
    id: "intro",
    screen: "chapters",
    title: "Introduction Link",
    tip: "Tap to watch the book's introduction video on JW.org.",
    position: "bottom",
  },
  {
    id: "readlink",
    screen: "chapters",
    title: "Read on JW.org",
    tip: "Opens that chapter directly on JW.org in a new tab.",
    position: "bottom",
  },
  {
    id: "notes",
    screen: "chapters",
    title: "Chapter Notes",
    tip: "Jot down personal reflections — private by default, shareable with family.",
    position: "bottom",
  },
  {
    id: "family",
    screen: "family",
    title: "Family Tab",
    tip: "See your family's streaks, pace, and progress side by side.",
    position: "bottom",
  },
  {
    id: "themes",
    screen: "settings",
    title: "Themes",
    tip: "Each family member can choose their own color theme.",
    position: "bottom",
  },
  {
    id: "notifications",
    screen: "settings",
    title: "Notifications",
    tip: "Enable push notifications for book completions and streak milestones.",
    position: "bottom",
  },
];

// Which screen each step needs
const STEP_SCREENS = {
  streak: "dashboard", goal: "dashboard", continue: "dashboard",
  books: "books",
  aboutbook: "chapters", intro: "chapters", readlink: "chapters", notes: "chapters",
  family: "family",
  themes: "settings", notifications: "settings",
};

// First book to use for chapter demo steps
const DEMO_BOOK_ID = "gen";

export default function GuidedTour({ uid, currentPage, onNavigate, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const progress = Math.round(((stepIndex + 1) / TOUR_STEPS.length) * 100);

  // Navigate to the right screen for each step
  useEffect(() => {
    const targetScreen = STEP_SCREENS[step.id];
    if (targetScreen === "chapters" && currentPage !== "chapters") {
      onNavigate("chapters", { bookId: DEMO_BOOK_ID });
    } else if (targetScreen !== "chapters" && currentPage !== targetScreen) {
      onNavigate(targetScreen);
    }
  }, [stepIndex]);

  const handleNext = async () => {
    if (isLast) {
      await handleComplete();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleComplete = async () => {
    await markTourCompleted(uid);
    onComplete();
  };

  const handleSkip = async () => {
    await markTourCompleted(uid);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 90px",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 20, padding: "20px",
        width: "calc(100% - 32px)", maxWidth: 440,
        border: "1px solid var(--border)",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.4)",
        animation: "slideUp 0.3s ease",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>

        {/* Step counter */}
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
          {stepIndex + 1} of {TOUR_STEPS.length}
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, color: "var(--accent-light)", fontWeight: 800, marginBottom: 6, letterSpacing: "-0.3px" }}>
          {step.title}
        </div>

        {/* Tip */}
        <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 20 }}>
          {step.tip}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSkip}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: "transparent", color: "var(--text-muted)",
              border: "1px solid var(--border)", cursor: "pointer",
            }}
          >
            Skip Tour
          </button>
          <button
            onClick={handleNext}
            style={{
              flex: 2, padding: "10px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: "var(--accent)", color: "var(--bg)",
              border: "none", cursor: "pointer",
            }}
          >
            {isLast ? "Done!" : "Next →"}
          </button>
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
