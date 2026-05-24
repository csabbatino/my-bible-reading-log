import { useMemo, useState } from "react";
import { ProgressRing, ProgressBar, Card, Divider, Button, Badge, Avatar } from "../components/UI.jsx";
import {
  overallPct, hebrewPct, greekPct, countReadChapters,
  getCurrentStreak, getRecentActivity, formatDate,
} from "../utils/progress.js";
import { countChaptersThisWeek } from "../utils/goals.js";
import { TOTAL_CHAPTERS, HEBREW_CHAPTERS, GREEK_CHAPTERS, BOOK_MAP } from "../data/bibleData.js";

function PaceCalculator({ progress, totalRead }) {
  const remaining = TOTAL_CHAPTERS - totalRead;

  // Calculate actual pace from reading history
  const actualPace = useMemo(() => {
    const allDates = [];
    for (const bookProgress of Object.values(progress)) {
      for (const dateStr of Object.values(bookProgress)) {
        if (dateStr) allDates.push(new Date(dateStr));
      }
    }
    if (allDates.length < 2) return null;
    allDates.sort((a, b) => a - b);
    const earliest = allDates[0];
    const latest = allDates[allDates.length - 1];
    const daysDiff = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));
    const pace = allDates.length / daysDiff;
    return Math.round(pace * 10) / 10;
  }, [progress]);

  const [chapPerDay, setChapPerDay] = useState(actualPace || 1);

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
          type="number" min="1" max="100"
          value={chapPerDay}
          onChange={(e) => setChapPerDay(parseFloat(e.target.value) || 1)}
          style={{
            width: 52, background: "var(--bg)", border: "1px solid var(--accent)",
            borderRadius: 6, padding: "3px 6px", color: "var(--accent)",
            fontSize: 14, fontWeight: 600, outline: "none", textAlign: "center",
          }}
        />
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>chapter{chapPerDay !== 1 ? "s" : ""} per day, I will complete the Bible on</span>
      </div>
      {finishDate && (
        <div style={{ fontSize: 15, color: "var(--accent-light)", fontWeight: 600, marginTop: 6 }}>
          {finishDate}
        </div>
      )}
      {actualPace && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Your current pace: ~{actualPace} chapter{actualPace !== 1 ? "s" : ""}/day
        </div>
      )}
    </div>
  );
}

function WeeklyGoalCard({ progress, weeklyGoal, onSetGoal }) {
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
  const todayDow = today.getDay();
  const todayIndex = todayDow === 0 ? 6 : todayDow - 1;

  if (!weeklyGoal && !editing) {
    return (
      <Card style={{ textAlign: "center", padding: "16px" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
          Set a weekly reading goal to track your pace
        </div>
        <Button onClick={() => setEditing(true)} small>Set Weekly Goal</Button>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 10, fontWeight: 500 }}>
          How many chapters per week?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number" min="1" max="100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
            style={{
              flex: 1, background: "var(--bg)", border: "1px solid var(--accent)",
              borderRadius: 8, padding: "8px 12px", color: "var(--text)",
              fontSize: 16, outline: "none",
            }}
          />
          <Button onClick={handleSave} small>Save</Button>
          <Button onClick={() => setEditing(false)} variant="ghost" small>✕</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
          This Week
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: pct >= 100 ? "var(--green)" : "var(--text)", fontWeight: 500 }}>
            {thisWeek} / {weeklyGoal} chapters
          </span>
          {pct >= 100 && <span style={{ fontSize: 14 }}>🎉</span>}
          <span onClick={() => setEditing(true)} style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer", marginLeft: 4 }}>✏️</span>
        </div>
      </div>
      <ProgressBar pct={pct} color={pct >= 100 ? "var(--green)" : "var(--accent)"} height={6} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {days.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 9, color: i === todayIndex ? "var(--accent)" : "var(--text-muted)", fontWeight: i === todayIndex ? 600 : 400 }}>{d}</div>
            <div style={{
              width: 7, height: 7, borderRadius: 4,
              background: i < todayIndex ? "var(--green)" : i === todayIndex ? "var(--accent)" : "var(--border)",
            }} />
          </div>
        ))}
      </div>
      {pct >= 100 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--green)", textAlign: "center", fontWeight: 500 }}>
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
  const recent = useMemo(() => getRecentActivity(progress, 3), [progress]);

  const hebrewRead = Math.round((hebrew / 100) * HEBREW_CHAPTERS);
  const greekRead = Math.round((greek / 100) * GREEK_CHAPTERS);

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
          <div style={{ fontSize: 22, color: "var(--text)", fontWeight: 700, letterSpacing: "-0.3px" }}>
            {profile?.displayName?.split(" ")[0] || "Reader"}
          </div>
        </div>
        {streak > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>🔥 {streak}-day streak</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {totalRead.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()} chapters
            </div>
          </div>
        )}
      </div>

      {/* Weekly goal */}
      <WeeklyGoalCard progress={progress} weeklyGoal={profile?.weeklyGoal} onSetGoal={handleSetGoal} />

      {/* Main progress ring */}
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
        <ProgressRing
          pct={overall} size={110} stroke={10} color="var(--accent)"
          label="Full Bible" sub={`${(TOTAL_CHAPTERS - totalRead).toLocaleString()} chapters remaining`}
        />
        <PaceCalculator progress={progress} totalRead={totalRead} />
      </Card>

      {/* Hebrew & Greek rings */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, paddingBottom: 14, marginBottom: 0, cursor: "pointer" }}
          onClick={() => onNavigate("books", { testament: "hebrew" })}>
          <ProgressRing pct={hebrew} size={76} stroke={7} color="var(--hebrew)" label="Hebrew" sub={`${hebrewRead}/${HEBREW_CHAPTERS}`} />
        </Card>
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, paddingBottom: 14, marginBottom: 0, cursor: "pointer" }}
          onClick={() => onNavigate("books", { testament: "greek" })}>
          <ProgressRing pct={greek} size={76} stroke={7} color="var(--greek)" label="Greek" sub={`${greekRead}/${GREEK_CHAPTERS}`} />
        </Card>
      </div>

      <Button onClick={() => onNavigate("books")} style={{ width: "100%", marginBottom: 14, fontSize: 14, padding: "13px", fontWeight: 600 }}>
        Continue Reading
      </Button>

      {/* Family feed */}
      {familyFeedItems?.length > 0 && (
        <>
          <Divider label="Family Activity" />
          {familyFeedItems.slice(0, 4).map((item, i) => {
            const book = BOOK_MAP[item.bookId];
            const mp = memberProfiles?.[item.uid];
            const isMe = item.uid === profile?.uid;
            return (
              <div key={i} onClick={() => onNavigate("chapters", { bookId: item.bookId })}
                style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "center", cursor: "pointer" }}>
                <Avatar name={mp?.displayName || "?"} photoURL={mp?.photoURL} size={30} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: isMe ? "var(--accent-light)" : "var(--text)", fontWeight: 500 }}>
                    {isMe ? "You" : mp?.displayName?.split(" ")[0] || "Family"}{" "}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>read {book?.name} {item.chapter}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{formatDate(item.dateStr)}</div>
                </div>
              </div>
            );
          })}
        </>
      )}

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

      {/* Fresh start — no cross icon */}
      {totalRead === 0 && (
        <Card style={{ textAlign: "center", padding: "28px 16px" }}>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>Begin your journey</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 }}>
            Track every chapter as you read through the Bible from cover to cover.
          </div>
          <Button onClick={() => onNavigate("books")}>Start Reading</Button>
        </Card>
      )}
    </div>
  );
}
