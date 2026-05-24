import { useState, useEffect } from "react";
import { Card, Divider, ProgressBar, Avatar, Spinner } from "../components/UI.jsx";
import { getMembersProgress, getMembersProfiles } from "../utils/firebase.js";
import { getLongestStreak, updateLongestStreak } from "../utils/goals.js";
import {
  overallPct, getCurrentStreak, calculateLongestStreak,
  getRecentActivity, formatDate, getSevenDayPace,
} from "../utils/progress.js";
import { BIBLE_DATA, BOOK_MAP } from "../data/bibleData.js";

function MemberCard({ profile, progress, isCurrentUser, rank }) {
  const pct = overallPct(progress);
  const streak = getCurrentStreak(progress);
  const longest = calculateLongestStreak(progress);
  const pace = getSevenDayPace(progress);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{medals[rank] || ""}</span>
        <Avatar name={profile.displayName} photoURL={profile.photoURL} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: isCurrentUser ? "var(--accent-light)" : "var(--text)", fontWeight: 700 }}>
            {profile.displayName}{isCurrentUser ? " (You)" : ""}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{pct}% of Bible complete</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "var(--surface)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: streak > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-1px" }}>
            {streak}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Streak {streak > 0 ? "🔥" : ""}
          </div>
          {longest > 0 && (
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
              Best: <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{longest}</span>d
            </div>
          )}
        </div>
        <div style={{ flex: 1, background: "var(--surface)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: pace > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-1px" }}>
            {pace}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Ch/Day · 7d
          </div>
        </div>
      </div>

      <ProgressBar pct={pct} color={isCurrentUser ? "var(--accent)" : "var(--text-muted)"} height={5} />
    </Card>
  );
}

export default function Family({ currentUid, familyGroup, currentProgress }) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [memberProgress, setMemberProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("members");

  useEffect(() => {
    if (!familyGroup?.members?.length) { setLoading(false); return; }
    const load = async () => {
      try {
        const [profiles, progress] = await Promise.all([
          getMembersProfiles(familyGroup.members),
          getMembersProgress(familyGroup.members),
        ]);
        setMemberProfiles(profiles);
        setMemberProgress({ ...progress, [currentUid]: currentProgress });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [familyGroup, currentUid, currentProgress]);

  if (!familyGroup) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>No family group yet</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Go to Settings to create a family group and add members.</div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const sortedMembers = (familyGroup.members || [])
    .filter((uid) => memberProfiles[uid])
    .map((uid) => ({
      uid,
      profile: memberProfiles[uid],
      progress: memberProgress[uid] || {},
      streak: getCurrentStreak(memberProgress[uid] || {}),
      longest: calculateLongestStreak(memberProgress[uid] || {}),
      pace: getSevenDayPace(memberProgress[uid] || {}),
      pct: overallPct(memberProgress[uid] || {}),
    }))
    .sort((a, b) => b.streak - a.streak || b.pct - a.pct);

  // Build sections dynamically from BIBLE_DATA
  const allSections = [
    ...Object.entries(BIBLE_DATA.hebrew.sections),
    ...Object.entries(BIBLE_DATA.greek.sections),
  ].map(([key, section]) => ({
    key,
    label: section.label,
    pct: (progress) => {
      const total = section.books.reduce((s, b) => s + b.chapters, 0);
      const read = section.books.reduce((s, b) => s + Object.keys(progress[b.id] || {}).length, 0);
      return total > 0 ? Math.round((read / total) * 100) : 0;
    },
  }));

  // Recent family activity
  const recentActivity = sortedMembers.flatMap(({ uid, profile, progress }) =>
    getRecentActivity(progress, 5).map((item) => ({ ...item, uid, displayName: profile.displayName, photoURL: profile.photoURL }))
  ).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr)).slice(0, 10);

  const nameCell = (uid, profile) => (
    <td key={uid} style={{ color: uid === currentUid ? "var(--accent-light)" : "var(--text)", textAlign: "center", padding: "4px 4px", fontWeight: 700, fontSize: 11 }}>
      {profile.displayName.split(" ")[0]}
    </td>
  );

  const valCell = (uid, val, color) => (
    <td key={uid} style={{ textAlign: "center", padding: "5px 4px" }}>
      <span style={{ fontSize: 11, padding: "2px 5px", borderRadius: 5, fontWeight: uid === currentUid ? 700 : 400, color: color || (uid === currentUid ? "var(--accent)" : "var(--text)") }}>
        {val}
      </span>
    </td>
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, fontStyle: "italic" }}>
        {familyGroup.name} · {sortedMembers.length} members
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["members", "Members"], ["sections", "Sections"], ["activity", "Activity"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "7px 0", borderRadius: 10, fontSize: 12, fontWeight: tab === id ? 700 : 400,
            background: tab === id ? "var(--accent)" : "var(--surface)",
            color: tab === id ? "var(--bg)" : "var(--text-muted)",
            border: `1px solid ${tab === id ? "var(--accent)" : "var(--border)"}`,
            cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* Members tab */}
      {tab === "members" && sortedMembers.map(({ uid, profile, progress }, i) => (
        <MemberCard key={uid} profile={profile} progress={progress} isCurrentUser={uid === currentUid} rank={i} />
      ))}

      {/* Sections tab */}
      {tab === "sections" && (
        <Card style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <td style={{ color: "var(--text-muted)", padding: "4px 0", width: 80, fontSize: 10 }} />
                {sortedMembers.map(({ uid, profile }) => nameCell(uid, profile))}
              </tr>
            </thead>
            <tbody>
              {/* Key metrics at top */}
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ color: "var(--text-muted)", padding: "5px 0", fontSize: 10, fontWeight: 700 }}>Streak 🔥</td>
                {sortedMembers.map(({ uid, streak }) => valCell(uid, `${streak}d`, streak > 0 ? "var(--accent)" : "var(--text-muted)"))}
              </tr>
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ color: "var(--text-muted)", padding: "5px 0", fontSize: 10, fontWeight: 700 }}>Best Streak</td>
                {sortedMembers.map(({ uid, longest }) => valCell(uid, `${longest}d`, longest > 0 ? "var(--accent-light)" : "var(--text-muted)"))}
              </tr>
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ color: "var(--text-muted)", padding: "5px 0", fontSize: 10, fontWeight: 700 }}>Pace/Day</td>
                {sortedMembers.map(({ uid, pace }) => valCell(uid, pace))}
              </tr>
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ color: "var(--text-muted)", padding: "5px 0", fontSize: 10, fontWeight: 700 }}>Bible %</td>
                {sortedMembers.map(({ uid, pct }) => valCell(uid, `${pct}%`, pct === 100 ? "var(--green)" : undefined))}
              </tr>

              {/* Separator */}
              <tr>
                <td colSpan={sortedMembers.length + 1} style={{ padding: "6px 0" }}>
                  <div style={{ height: 1, background: "var(--accent)", opacity: 0.3 }} />
                </td>
              </tr>

              {/* All sections dynamically */}
              {allSections.map((section) => (
                <tr key={section.key} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ color: "var(--text-muted)", padding: "5px 0", fontSize: 10, lineHeight: 1.3 }}>{section.label}</td>
                  {sortedMembers.map(({ uid, progress }) => {
                    const val = section.pct(progress);
                    return valCell(uid, `${val}%`, val === 100 ? "var(--green)" : undefined);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <>
          <Divider label="Recent Family Activity" />
          {recentActivity.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24, fontStyle: "italic" }}>No reading activity yet</div>
          )}
          {recentActivity.map((item, i) => {
            const book = BOOK_MAP[item.bookId];
            return (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                <Avatar name={item.displayName} photoURL={item.photoURL} size={32} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, color: "var(--accent-light)", fontWeight: 600 }}>{item.displayName} </span>
                  <span style={{ fontSize: 13, color: "var(--text)" }}>read {book?.name} {item.chapter}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(item.dateStr)}</div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
