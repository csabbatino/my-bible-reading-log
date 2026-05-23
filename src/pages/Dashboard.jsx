import { useMemo, useState, useEffect } from "react";
import { ProgressRing, ProgressBar, Card, Divider, Button, Badge, Avatar } from "../components/UI.jsx";
import {
  overallPct, hebrewPct, greekPct, countReadChapters,
  estimateFinishDate, getCurrentStreak, getRecentActivity, formatDate,
} from "../utils/progress.js";
import { countChaptersThisWeek } from "../utils/goals.js";
import { TOTAL_CHAPTERS, HEBREW_CHAPTERS, GREEK_CHAPTERS, BOOK_MAP } from "../data/bibleData.js";
import { BADGES } from "../data/badges.js";

function WeeklyGoalCard({ progress, weeklyGoal, onSetGoal }) {
  const thisWeek = useMemo(() => countChaptersThisWeek(progress), [progress]);
  const pct = weeklyGoal ? Math.min(100, Math.round((thisWeek / weeklyGoal) * 100)) : 0;
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(weeklyGoal || "");

  const handleSave = () => {
    const val = parseInt(input);
    if (val > 0) { onSetGoal(val); setEditing(false); }
  };

  // Get day labels Mon–Sun with today highlighted
  const today = new Date();
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayDow = today.getDay(); // 0=Sun
  const todayIndex = todayDow === 0 ? 6 : todayDow - 1; // Mon=0

  if (!weeklyGoal && !editing) {
    return (
      <Card style={{ textAlign: "center", padding: "16px" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, fontStyle: "italic" }}>
          Set a weekly reading goal to track your pace
        </div>
        <Button onClick={() => setEditing(true)} small>Set Weekly Goal</Button>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 10, fontFamily: "Georgia, serif" }}>
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
              fontSize: 16, fontFamily: "Georgia, serif", outline: "none",
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
        <div style={{ fontSize: 12, color: "var(--accent)", letterSpacing: 1, textTransform: "uppercase" }}>
          This Week
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: pct >= 100 ? "var(--green)" : "var(--text)" }}>
            {thisWeek} / {weeklyGoal} chapters
          </span>
          {pct >= 100 && <span style={{ fontSize: 16 }}>🎉</span>}
          <span
            onClick={() => setEditing(true)}
            style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer", marginLeft: 4 }}
          >✏️</span>
        </div>
      </div>
      <ProgressBar pct={pct} color={pct >= 100 ? "var(--green)" : "var(--accent)"} height={8} />

      {/* Day dots */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {days.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 9, color: i === todayIndex ? "var(--accent)" : "var(--text-muted)" }}>{d}</div>
            <div style={{
              width: 8, height: 8, borderRadius: 4,
              background: i < todayIndex ? "var(--green)" : i === todayIndex ? "var(--accent)" : "var(--border)",
            }} />
          </div>
        ))}
      </div>

      {pct >= 100 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--green)", textAlign: "center", fontStyle: "italic" }}>
          ✓ Weekly goal complete! Keep going!
        </div>
      )}
    </Card>
  );
}

function FamilyFeedCard({ familyFeedItems, memberProfiles, currentUid, onNavigate }) {
  if (!familyFeedItems || familyFeedItems.length === 0) return null;

  return (
    <>
      <Divider label="Family Activity" />
      {familyFeedItems.slice(0, 4).map((item, i) => {
        const book = BOOK_MAP[item.bookId];
        const profile = memberProfiles?.[item.uid];
        const isMe = item.uid === currentUid;
        return (
          <div
            key={i}
            onClick={() => !isMe && onNavigate("chapters", { bookId: item.bookId })}
            style={{
              display: "flex", gap: 10, padding: "8px 0",
              borderBottom: "1px solid var(--border)", alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Avatar name={profile?.displayName || "?"} photoURL={profile?.photoURL} size={30} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: isMe ? "var(--accent-light)" : "var(--text)", fontFamily: "Georgia, serif" }}>
                {isMe ? "You" : profile?.displayName?.split(" ")[0] || "Family"}{" "}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                read {book?.name} {item.chapter}
              </span>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatDate(item.dateStr)}</div>
            </div>
            <span style={{ fontSize: 14 }}>📖</span>
          </div>
        );
      })}
    </>
  );
}

export default function Dashboard({ progress, profile, familyFeedItems, memberProfiles, onNavigate }) {
  const overall = useMemo(() => overallPct(progress), [progress]);
  const hebrew = useMemo(() => hebrewPct(progress), [progress]);
  const greek = useMemo(() => greekPct(progress), [progress]);
  const totalRead = useMemo(() => countReadChapters(progress), [progress]);
  const streak = useMemo(() => getCurrentStreak(progress), [progress]);
  const pace = useMemo(() => estimateFinishDate(progress), [progress]);
  const recent = useMemo(() => getRecentActivity(progress, 3), [progress]);

  const hebrewRead = Math.round((hebrew / 100) * HEBREW_CHAPTERS);
  const greekRead = Math.round((greek / 100) * GREEK_CHAPTERS);

  const handleSetGoal = async (val) => {
    const { saveWeeklyGoal } = await import("../utils/goals.js");
    await saveWeeklyGoal(profile.uid, val);
  };

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Welcome back,</div>
          <div style={{ fontSize: 20, color: "var(--accent-light)", fontFamily: "Georgia, serif", fontWeight: "bold" }}>
            {profile?.displayName || "Reader"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {streak > 0 && (
            <div style={{ fontSize: 13, color: "var(--accent)" }}>🔥 {streak}-day streak</div>
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {totalRead.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()} chapters
          </div>
        </div>
      </div>

      {/* Weekly goal */}
      <WeeklyGoalCard
        progress={progress}
        weeklyGoal={profile?.weeklyGoal}
        onSetGoal={handleSetGoal}
      />

      {/* Main progress ring */}
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, paddingBottom: 20 }}>
        <ProgressRing
          pct={overall} size={110} stroke={10} color="var(--accent)"
          label="Full Bible" sub={`${TOTAL_CHAPTERS - totalRead} chapters remaining`}
        />
        {pace && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            ~<span style={{ color: "var(--accent-light)" }}>{pace.chaptersPerDay} ch/day</span>
            {" · "}Est. finish{" "}
            <span style={{ color: "var(--accent-light)" }}>
              {pace.finishDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
        )}
        {!pace && totalRead === 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", textAlign: "center", fontStyle: "italic" }}>
            Start reading to track your pace
          </div>
        )}
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

      {/* Continue reading button */}
      <Button onClick={() => onNavigate("books")} style={{ width: "100%", marginBottom: 14, fontSize: 15, padding: "14px" }}>
        📖 Continue Reading
      </Button>

      {/* Family activity feed */}
      <FamilyFeedCard
        familyFeedItems={familyFeedItems}
        memberProfiles={memberProfiles}
        currentUid={profile?.uid}
        onNavigate={onNavigate}
      />

      {/* Recent personal activity */}
      {recent.length > 0 && (
        <>
          <Divider label="My Recent Reading" />
          {recent.map((item, i) => {
            const book = BOOK_MAP[item.bookId];
            return (
              <div key={i}
                onClick={() => onNavigate("chapters", { bookId: item.bookId })}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 2px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
              >
                <div>
                  <div style={{ fontSize: 14, color: "var(--text)", fontFamily: "Georgia, serif" }}>
                    {book?.name} {item.chapter}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(item.dateStr)}</div>
                </div>
                <Badge color="var(--green)">✓ Read</Badge>
              </div>
            );
          })}
        </>
      )}

      {/* Fresh start prompt */}
      {totalRead === 0 && (
        <Card style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✝</div>
          <div style={{ fontSize: 15, color: "var(--text)", fontFamily: "Georgia, serif", marginBottom: 8 }}>Begin your journey</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            Track every chapter as you read through the Bible from cover to cover.
          </div>
          <Button onClick={() => onNavigate("books")}>Start with Genesis</Button>
        </Card>
      )}
    </div>
  );
}
