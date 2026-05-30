import { useMemo, useState, useEffect } from "react";
import { ProgressRing, ProgressBar, Card, Divider, Button, Badge } from "../components/UI.jsx";
import {
  overallPct, hebrewPct, greekPct, countReadChapters,
  countHebrewRead, countGreekRead,
  getCurrentStreak, calculateLongestStreak, getRecentActivity,
  formatDate, getSevenDayPace,
} from "../utils/progress.js";
import { countChaptersThisWeek, updateLongestStreak, saveWeeklyGoal } from "../utils/goals.js";
import { TOTAL_CHAPTERS, HEBREW_CHAPTERS, GREEK_CHAPTERS, BOOK_MAP } from "../data/bibleData.js";

// ── 1. Streak & Pace card ─────────────────────────────────────────────────────
function StreakCard({ streak, longestStreak, pace, tourId }) {
  return (
    <Card id={tourId} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0" }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: streak > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-1.5px" }}>
            {streak}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Day Streak {streak > 0 ? "🔥" : ""}
          </div>
          {longestStreak > 0 && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
              Best: <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{longestStreak}</span> days
            </div>
          )}
          {streak === 0 && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontStyle: "italic", textAlign: "center", padding: "0 8px" }}>
              Read today to start!
            </div>
          )}
        </div>
        <div style={{ width: 1, background: "var(--border)", margin: "6px 0" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0" }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: pace > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-1.5px" }}>
            {pace}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Ch/Day
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>last 7 days</div>
        </div>
      </div>
    </Card>
  );
}

// ── 2. Weekly goal card ───────────────────────────────────────────────────────
function WeeklyGoalCard({ progress, weeklyGoal, onSetGoal, tourId }) {
  const thisWeek = useMemo(() => countChaptersThisWeek(progress), [progress]);
  const pct = weeklyGoal ? Math.min(100, Math.round((thisWeek / weeklyGoal) * 100)) : 0;
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(weeklyGoal || "");
  const handleSave = () => { const val = parseInt(input); if (val > 0) { onSetGoal(val); setEditing(false); } };
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  if (!weeklyGoal && !editing) return (
    <Card id={tourId} style={{ textAlign: "center", padding: "14px" }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Set a weekly reading goal</div>
      <Button onClick={() => setEditing(true)} small>Set Goal</Button>
    </Card>
  );

  if (editing) return (
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

  return (
    <Card id={tourId}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>This Week</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: pct >= 100 ? "var(--green)" : "var(--text)", fontWeight: 600 }}>{thisWeek} / {weeklyGoal} ch</span>
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
      {pct >= 100 && <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", textAlign: "center", fontWeight: 600 }}>Weekly goal complete — keep going!</div>}
    </Card>
  );
}

// ── 3. Currently Reading card ─────────────────────────────────────────────────
function CurrentlyReadingCard({ currentBook, onNavigate, tourId }) {
  if (!currentBook) return (
    <Card id={tourId} style={{ textAlign: "center", padding: "20px 16px", marginBottom: 10, cursor: "pointer" }} onClick={() => onNavigate("books")}>
      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 700, marginBottom: 4 }}>Ready to begin?</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>Start with Genesis or jump to any book that calls to you.</div>
      <Button onClick={() => onNavigate("books")}>Start Reading</Button>
    </Card>
  );

  return (
    <Card id={tourId} onClick={() => onNavigate("chapters", { bookId: currentBook.id })} style={{ marginBottom: 10, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, whiteSpace: "nowrap" }}>Currently Reading</div>
        <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 800, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentBook.name}</div>
        <Badge color="var(--accent)">{currentBook.pct}%</Badge>
      </div>
      <ProgressBar pct={currentBook.pct} color="var(--accent)" height={6} />
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
        {currentBook.readCount} of {currentBook.chapters} chapters · tap to continue →
      </div>
    </Card>
  );
}

// ── 4. Progress card (Hebrew + Greek rings + pace + overall bar) ──────────────
function ProgressCard({ overall, hebrew, greek, hebrewRead, greekRead, totalRead, progress }) {
  const remaining = TOTAL_CHAPTERS - totalRead;
  const actualPace = useMemo(() => getSevenDayPace(progress), [progress]);
  const [chapPerDay, setChapPerDay] = useState(actualPace || 1);
  useEffect(() => { if (actualPace > 0) setChapPerDay(actualPace); }, [actualPace]);

  const finishDate = useMemo(() => {
    if (!chapPerDay || chapPerDay <= 0) return null;
    const daysLeft = Math.ceil(remaining / chapPerDay);
    const d = new Date();
    d.setDate(d.getDate() + daysLeft);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, [chapPerDay, remaining]);

  return (
    <Card style={{ marginBottom: 10 }}>
      {/* Row: two rings left, pace text right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        {/* Hebrew ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <ProgressRing pct={hebrew} size={64} stroke={6} color="var(--hebrew)" />
          <div style={{ fontSize: 10, color: "var(--hebrew)", fontWeight: 700 }}>Hebrew</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{hebrewRead}/{HEBREW_CHAPTERS}</div>
        </div>
        {/* Greek ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <ProgressRing pct={greek} size={64} stroke={6} color="var(--greek)" />
          <div style={{ fontSize: 10, color: "var(--greek)", fontWeight: 700 }}>Greek</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{greekRead}/{GREEK_CHAPTERS}</div>
        </div>
        {/* Pace calculator */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>If I read</span>
            <input
              type="number" min="1" max="100" value={chapPerDay}
              onChange={(e) => setChapPerDay(parseFloat(e.target.value) || 1)}
              style={{ width: 40, background: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 6, padding: "2px 4px", color: "var(--accent)", fontSize: 13, fontWeight: 700, outline: "none", textAlign: "center" }}
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ch/day</span>
          </div>
          {finishDate && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>I'll finish the Bible on</div>
          )}
          {finishDate && (
            <div style={{ fontSize: 13, color: "var(--accent-light)", fontWeight: 700 }}>{finishDate}</div>
          )}
        </div>
      </div>
      {/* Full Bible overall bar */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {totalRead.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()} chapters
          </div>
          <Badge color="var(--accent)">{overall}%</Badge>
        </div>
        <ProgressBar pct={overall} color="var(--accent)" height={5} />
      </div>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ progress, profile, onNavigate }) {
  const overall   = useMemo(() => overallPct(progress),      [progress]);
  const hebrew    = useMemo(() => hebrewPct(progress),       [progress]);
  const greek     = useMemo(() => greekPct(progress),        [progress]);
  const totalRead = useMemo(() => countReadChapters(progress),[progress]);
  const streak    = useMemo(() => getCurrentStreak(progress), [progress]);
  const pace      = useMemo(() => getSevenDayPace(progress),  [progress]);
  const recent    = useMemo(() => getRecentActivity(progress, 3), [progress]);
  const hebrewRead = useMemo(() => countHebrewRead(progress), [progress]);
  const greekRead  = useMemo(() => countGreekRead(progress),  [progress]);
  const [longestStreak, setLongestStreak] = useState(0);

  const currentBook = useMemo(() => {
    const items = getRecentActivity(progress, 1);
    if (!items.length) return null;
    const book = BOOK_MAP[items[0].bookId];
    if (!book) return null;
    const readCount = Object.keys(progress[items[0].bookId] || {}).length;
    const pct = Math.round((readCount / book.chapters) * 100);
    return { ...book, readCount, pct };
  }, [progress]);

  useEffect(() => {
    if (!profile?.uid) return;
    const load = async () => {
      const calculated = calculateLongestStreak(progress);
      const stored = await updateLongestStreak(profile.uid, Math.max(calculated, streak));
      setLongestStreak(stored);
    };
    load();
  }, [profile?.uid, streak, progress]);

  const handleSetGoal = async (val) => {
    await saveWeeklyGoal(profile.uid, val);
  };

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* 1. Streak & Pace */}
      <StreakCard streak={streak} longestStreak={longestStreak} pace={pace} tourId="tour-streak" />

      {/* 2. Weekly Goal */}
      <WeeklyGoalCard progress={progress} weeklyGoal={profile?.weeklyGoal} onSetGoal={handleSetGoal} tourId="tour-goal" />

      {/* 3. Currently Reading */}
      <CurrentlyReadingCard currentBook={currentBook} onNavigate={onNavigate} tourId="tour-continue" />

      {/* 4. Progress card: Hebrew + Greek rings, pace calc, overall bar */}
      <ProgressCard
        overall={overall} hebrew={hebrew} greek={greek}
        hebrewRead={hebrewRead} greekRead={greekRead}
        totalRead={totalRead} progress={progress}
      />

      {/* 5. Recent reading */}
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
