import { useMemo, useState, useEffect } from "react";
import { ProgressRing, ProgressBar, Card, Divider, Button, Badge } from "../components/UI.jsx";
import {
  overallPct, hebrewPct, greekPct, countReadChapters,
  countHebrewRead, countGreekRead,
  getCurrentStreak, calculateLongestStreak, getRecentActivity,
  formatDate, getSevenDayPace,
} from "../utils/progress.js";
import { countChaptersThisWeek, getLongestStreak, updateLongestStreak } from "../utils/goals.js";
import { TOTAL_CHAPTERS, HEBREW_CHAPTERS, GREEK_CHAPTERS, BOOK_MAP } from "../data/bibleData.js";

function StreakCard({ streak, longestStreak, pace, tourId }) {
  return (
    <Card id={tourId} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex" }}>
        {/* Current streak */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: streak > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-2px" }}>
            {streak}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Day Streak {streak > 0 ? "🔥" : ""}
          </div>
          {longestStreak > 0 && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
              Best: <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{longestStreak}</span> days
            </div>
          )}
          {streak === 0 && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic", textAlign: "center", padding: "0 8px" }}>
              Read today to start your streak!
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "var(--border)", margin: "8px 0" }} />

        {/* 7-day pace */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: pace > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-2px" }}>
            {pace}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>
            Ch/Day
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
            last 7 days
          </div>
        </div>
      </div>
    </Card>
  );
}

function PaceCalculator({ progress, totalRead }) {
  const remaining = TOTAL_CHAPTERS - totalRead;
  const actualPace = useMemo(() => getSevenDayPace(progress), [progress]);
  const [chapPerDay, setChapPerDay] = useState(actualPace || 1);

  useEffect(() => {
    if (actualPace > 0) setChapPerDay(actualPace);
  }, [actualPace]);

  const finishDate = useMemo(() => {
    if (!chapPerDay || chapPerDay <= 0) return null;
    const daysLeft = Math.ceil(remaining / chapPerDay);
    const d = new Date();
    d.setDate(d.getDate() + daysLeft);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, [chapPerDay, remaining]);

  return (
    <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>If I read</span>
        <input
          type="number" min="1" max="100" value={chapPerDay}
          onChange={(e) => setChapPerDay(parseFloat(e.target.value) || 1)}
          style={{
            width: 52, background: "var(--bg)", border: "1px solid var(--accent)",
            borderRadius: 6, padding: "3px 6px", color: "var(--accent)",
            fontSize: 14, fontWeight: 700, outline: "none", textAlign: "center",
          }}
        />
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          chapter{chapPerDay !== 1 ? "s" : ""} per day, I will complete the Bible on
        </span>
      </div>
      {finishDate && (
        <div style={{ fontSize: 15, color: "var(--accent-light)", fontWeight: 700, marginTop: 6 }}>
          {finishDate}
        </div>
      )}
    </div>
  );
}

function WeeklyGoalCard({ progress, weeklyGoal, onSetGoal, tourId }) {
  const thisWeek = useMemo(() => countChaptersThisWeek(progress), [progress]);
  const pct = weeklyGoal ? Math.min(100, Math.round((thisWeek / weeklyGoal) * 100)) : 0;
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(weeklyGoal || "");

  const handleSave = () => {
    const val = parseInt(input);
    if (val > 0) { onSetGoal(val); setEditing(false); }
  };

  const today = new Date();
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  if (!weeklyGoal && !editing) {
    return (
      <Card id={tourId} style={{ textAlign: "center", padding: "14px" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Set a weekly reading goal</div>
        <Button onClick={() => setEditing(true)} small>Set Goal</Button>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card id={tourId}>
        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 10, fontWeight: 500 }}>Chapters per week?</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" min="1" max="100" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 16, outline: "none" }}
          />
          <Button onClick={handleSave} small>Save</Button>
          <Button onClick={() => setEditing(false)} variant="ghost" small>✕</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card id={tourId}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>This Week</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: pct >= 100 ? "var(--green)" : "var(--text)", fontWeight: 600 }}>
            {thisWeek} / {weeklyGoal} ch
          </span>
          {pct >= 100 && <span>🎉</span>}
          <span onClick={() => setEditing(true)} style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer", marginLeft: 4 }}>✏️</span>
        </div>
      </div>
      <ProgressBar pct={pct} color={pct >= 100 ? "var(--green)" : "var(--accent)"} height={6} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {days.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 9, color: i === todayIndex ? "var(--accent)" : "var(--text-muted)", fontWeight: i === todayIndex ? 700 : 400 }}>{d}</div>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: i < todayIndex ? "var(--green)" : i === todayIndex ? "var(--accent)" : "var(--border)" }} />
          </div>
        ))}
      </div>
      {pct >= 100 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", textAlign: "center", fontWeight: 600 }}>
          Weekly goal complete — keep going!
        </div>
      )}
    </Card>
  );
}

export default function Dashboard({ progress, profile, familyFeedItems, memberProfiles, onNavigate }) {
  const overall = useMemo(() => overallPct(progress), [progress]);
  const hebrew = useMemo(() => hebrewPct(progress), [progress]);
  const greek = useMemo(() => greekPct(progress), [progress]);
  const totalRead = useMemo(() => countReadChapters(progress), [progress]);
  const streak = useMemo(() => getCurrentStreak(progress), [progress]);
  const pace = useMemo(() => getSevenDayPace(progress), [progress]);
  const recent = useMemo(() => getRecentActivity(progress, 3), [progress]);

  // Derive the most recently touched book for the "currently reading" card
  const currentBook = useMemo(() => {
    const recentItems = getRecentActivity(progress, 1);
    if (!recentItems.length) return null;
    const { bookId } = recentItems[0];
    const book = BOOK_MAP[bookId];
    if (!book) return null;
    const readCount = Object.keys(progress[bookId] || {}).length;
    const pct = Math.round((readCount / book.chapters) * 100);
    return { ...book, readCount, pct };
  }, [progress]);
  const [longestStreak, setLongestStreak] = useState(0);

  // Load and update longest streak from Firebase
  useEffect(() => {
    if (!profile?.uid) return;
    const load = async () => {
      const calculated = calculateLongestStreak(progress);
      const stored = await updateLongestStreak(profile.uid, Math.max(calculated, streak));
      setLongestStreak(stored);
    };
    load();
  }, [profile?.uid, streak, progress]);

  const hebrewRead = useMemo(() => countHebrewRead(progress), [progress]);
  const greekRead = useMemo(() => countGreekRead(progress), [progress]);

  const handleSetGoal = async (val) => {
    const { saveWeeklyGoal } = await import("../utils/goals.js");
    await saveWeeklyGoal(profile.uid, val);
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Welcome back,</div>
          <div style={{ fontSize: 22, color: "var(--text)", fontWeight: 800, letterSpacing: "-0.5px" }}>
            {profile?.displayName?.split(" ")[0] || "Reader"}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>
          {totalRead.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()} chapters
        </div>
      </div>

      {/* STREAK & PACE — most prominent */}
      <StreakCard streak={streak} longestStreak={longestStreak} pace={pace} tourId="tour-streak" />

      {/* Weekly goal */}
      <WeeklyGoalCard progress={progress} weeklyGoal={profile?.weeklyGoal} onSetGoal={handleSetGoal} tourId="tour-goal" />

      {/* Currently reading card */}
      {currentBook ? (
        <Card
          id="tour-continue"
          onClick={() => onNavigate("chapters", { bookId: currentBook.id })}
          style={{ marginBottom: 12, cursor: "pointer" }}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
            Currently Reading
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <div style={{ fontSize: 17, color: "var(--text)", fontWeight: 800 }}>{currentBook.name}</div>
            <Badge color="var(--accent)">{currentBook.pct}%</Badge>
          </div>
          <ProgressBar pct={currentBook.pct} color="var(--accent)" height={6} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
            {currentBook.readCount} of {currentBook.chapters} chapters · tap to continue →
          </div>
        </Card>
      ) : (
        <Card style={{ textAlign: "center", padding: "20px 16px", marginBottom: 12, cursor: "pointer" }} onClick={() => onNavigate("books")}>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700, marginBottom: 4 }}>Ready to begin?</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
            Start with Genesis or jump to any book that calls to you.
          </div>
          <Button onClick={() => onNavigate("books")}>Start Reading</Button>
        </Card>
      )}

      {/* Bible progress rings */}
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, paddingBottom: 14 }}>
        <ProgressRing pct={overall} size={100} stroke={9} color="var(--accent)"
          label="Full Bible" sub={`${(TOTAL_CHAPTERS - totalRead).toLocaleString()} chapters remaining`} />
        <PaceCalculator progress={progress} totalRead={totalRead} />
      </Card>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, paddingBottom: 12, marginBottom: 0, cursor: "pointer" }}
          onClick={() => onNavigate("books", { testament: "hebrew" })}>
          <ProgressRing pct={hebrew} size={70} stroke={6} color="var(--hebrew)" label="Hebrew" sub={`${hebrewRead}/${HEBREW_CHAPTERS}`} />
        </Card>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, paddingBottom: 12, marginBottom: 0, cursor: "pointer" }}
          onClick={() => onNavigate("books", { testament: "greek" })}>
          <ProgressRing pct={greek} size={70} stroke={6} color="var(--greek)" label="Greek" sub={`${greekRead}/${GREEK_CHAPTERS}`} />
        </Card>
      </div>

      {/* Recent personal */}
      {recent.length > 0 && (
        <>
          <Divider label="My Recent Reading" />
          {recent.map((item, i) => {
            const book = BOOK_MAP[item.bookId];
            return (
              <div key={i} onClick={() => onNavigate("chapters", { bookId: item.bookId })}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{book?.name} {item.chapter}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(item.dateStr)}</div>
                </div>
                <Badge color="var(--green)">Read</Badge>
              </div>
            );
          })}
        </>
      )}

    </div>
  );
}
