import { useState, useEffect } from "react";
import { Card, Divider, ProgressBar, Avatar, Badge, Spinner } from "../components/UI.jsx";
import { getMembersProgress, getMembersProfiles } from "../utils/firebase.js";
import {
  overallPct, hebrewPct, greekPct, getCurrentStreak,
  getRecentActivity, formatDate, getSevenDayPace,
} from "../utils/progress.js";
import { BIBLE_DATA, BOOK_MAP } from "../data/bibleData.js";

function MemberCard({ profile, progress, isCurrentUser, rank }) {
  const pct = overallPct(progress);
  const streak = getCurrentStreak(progress);
  const pace = getSevenDayPace(progress);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card style={{ marginBottom: 8 }}>
      {/* Header row */}
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

      {/* Streak & pace - prominent */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{
          flex: 1, background: "var(--surface)", borderRadius: 8, padding: "8px 10px",
          border: "1px solid var(--border)", textAlign: "center",
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: streak > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-1px" }}>
            {streak}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {streak === 1 ? "Day Streak" : "Day Streak"} {streak > 0 ? "🔥" : ""}
          </div>
        </div>
        <div style={{
          flex: 1, background: "var(--surface)", borderRadius: 8, padding: "8px 10px",
          border: "1px solid var(--border)", textAlign: "center",
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: pace > 0 ? "var(--accent)" : "var(--text-muted)", lineHeight: 1, letterSpacing: "-1px" }}>
            {pace}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Ch/Day · 7 days
          </div>
        </div>
      </div>

      {/* Progress bar */}
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [familyGroup, currentUid, currentProgress]);

  if (!familyGroup) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
        <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>No family group yet</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Go to Settings to create a family group and add members.
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  // Sort by streak first, then by overall pct
  const sortedMembers = (familyGroup.members || [])
    .filter((uid) => memberProfiles[uid])
    .map((uid) => ({
      uid,
      profile: memberProfiles[uid],
      progress: memberProgress[uid] || {},
      streak: getCurrentStreak(memberProgress[uid] || {}),
      pace: getSevenDayPace(memberProgress[uid] || {}),
      pct: overallPct(memberProgress[uid] || {}),
    }))
    .sort((a, b) => b.streak - a.streak || b.pct - a.pct);

  // Recent family activity
  const recentActivity = sortedMembers.flatMap(({ uid, profile, progress }) =>
    getRecentActivity(progress, 5).map((item) => ({
      ...item, uid,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
    }))
  ).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr)).slice(0, 10);

  // Section comparison
  const sections = [
    { label: "Hebrew OT", pct: (p) => hebrewPct(p) },
    { label: "Greek NT", pct: (p) => greekPct(p) },
    { label: "Psalms", pct: (p) => Math.round((Object.keys(p["psa"] || {}).length / 150) * 100) },
    {
      label: "Gospels", pct: (p) => {
        const books = BIBLE_DATA.greek.sections.gospels.books;
        const total = books.reduce((s, b) => s + b.chapters, 0);
        const read = books.reduce((s, b) => s + Object.keys(p[b.id] || {}).length, 0);
        return Math.round((read / total) * 100);
      }
    },
  ];

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

      {/* Members tab — streaks & pace prominent */}
      {tab === "members" && sortedMembers.map(({ uid, profile, progress }, i) => (
        <MemberCard
          key={uid} profile={profile} progress={progress}
          isCurrentUser={uid === currentUid} rank={i}
        />
      ))}

      {/* Sections tab */}
      {tab === "sections" && (
        <Card style={{ overflowX: "auto" }}>
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>
            Section Comparison
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <td style={{ color: "var(--text-muted)", padding: "4px 0", width: 70 }} />
                {sortedMembers.map(({ uid, profile }) => (
                  <td key={uid} style={{ color: uid === currentUid ? "var(--accent-light)" : "var(--text)", textAlign: "center", padding: "4px 4px", fontWeight: 700 }}>
                    {profile.displayName.split(" ")[0]}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.label} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ color: "var(--text-muted)", padding: "6px 0", fontSize: 11 }}>{section.label}</td>
                  {sortedMembers.map(({ uid, progress }) => {
                    const val = section.pct(progress);
                    return (
                      <td key={uid} style={{ textAlign: "center", padding: "6px 4px" }}>
                        <span style={{
                          fontSize: 11, padding: "2px 6px", borderRadius: 6,
                          background: val === 100 ? "rgba(90,158,111,0.2)" : "var(--surface)",
                          color: val === 100 ? "var(--green)" : uid === currentUid ? "var(--accent)" : "var(--text)",
                          fontWeight: uid === currentUid ? 700 : 400,
                        }}>{val}%</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Streak row */}
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ color: "var(--text-muted)", padding: "6px 0", fontSize: 11 }}>Streak 🔥</td>
                {sortedMembers.map(({ uid, streak }) => (
                  <td key={uid} style={{ textAlign: "center", padding: "6px 4px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: streak > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                      {streak}d
                    </span>
                  </td>
                ))}
              </tr>
              {/* Pace row */}
              <tr style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ color: "var(--text-muted)", padding: "6px 0", fontSize: 11 }}>Pace/day</td>
                {sortedMembers.map(({ uid, pace }) => (
                  <td key={uid} style={{ textAlign: "center", padding: "6px 4px" }}>
                    <span style={{ fontSize: 11, fontWeight: uid === currentUid ? 700 : 400, color: uid === currentUid ? "var(--accent)" : "var(--text)" }}>
                      {pace}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <>
          <Divider label="Recent Family Activity" />
          {recentActivity.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24, fontStyle: "italic" }}>
              No reading activity yet
            </div>
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
