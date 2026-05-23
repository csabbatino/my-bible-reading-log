import { useState, useEffect } from "react";
import { Card, Divider, ProgressBar, Avatar, Badge, Button, Spinner } from "../components/UI.jsx";
import { getMembersProgress, getMembersProfiles } from "../utils/firebase.js";
import {
  overallPct, hebrewPct, greekPct, countReadChapters,
  getRecentActivity, formatDate,
} from "../utils/progress.js";
import { BIBLE_DATA, BOOK_MAP, TOTAL_CHAPTERS } from "../data/bibleData.js";

function MemberProgressRow({ profile, progress, isCurrentUser, rank, onViewDetail }) {
  const pct = overallPct(progress);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16, width: 22 }}>{medals[rank] || "  "}</span>
        <Avatar name={profile.displayName} photoURL={profile.photoURL} size={30} />
        <span style={{ flex: 1, fontSize: 13, color: isCurrentUser ? "var(--accent-light)" : "var(--text)", fontFamily: "Georgia, serif" }}>
          {profile.displayName}{isCurrentUser ? " (You)" : ""}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct}%</span>
      </div>
      <div style={{ paddingLeft: 46 }}>
        <ProgressBar pct={pct} color={isCurrentUser ? "var(--accent)" : "var(--text-muted)"} />
      </div>
    </div>
  );
}

export default function Family({ currentUid, familyGroup, currentProgress }) {
  const [memberProfiles, setMemberProfiles] = useState({});
  const [memberProgress, setMemberProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overall");

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
        <div style={{ fontSize: 15, color: "var(--text)", fontFamily: "Georgia, serif", marginBottom: 8 }}>
          No family group yet
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Go to Settings to create a family group and add members.
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  // Sort members by overall pct descending
  const sortedMembers = (familyGroup.members || [])
    .filter((uid) => memberProfiles[uid])
    .map((uid) => ({ uid, profile: memberProfiles[uid], progress: memberProgress[uid] || {} }))
    .sort((a, b) => overallPct(b.progress) - overallPct(a.progress));

  // Sections for comparison table
  const sections = [
    { label: "Hebrew OT", pct: (p) => hebrewPct(p) },
    { label: "Greek NT", pct: (p) => greekPct(p) },
    {
      label: "Psalms",
      pct: (p) => {
        const psaProgress = p["psa"] || {};
        const read = Object.keys(psaProgress).length;
        return Math.round((read / 150) * 100);
      },
    },
    {
      label: "Gospels",
      pct: (p) => {
        const gospelBooks = BIBLE_DATA.greek.sections.gospels.books;
        const total = gospelBooks.reduce((s, b) => s + b.chapters, 0);
        const read = gospelBooks.reduce((s, b) => s + Object.keys(p[b.id] || {}).length, 0);
        return Math.round((read / total) * 100);
      },
    },
    {
      label: "Law",
      pct: (p) => {
        const lawBooks = BIBLE_DATA.hebrew.sections.law.books;
        const total = lawBooks.reduce((s, b) => s + b.chapters, 0);
        const read = lawBooks.reduce((s, b) => s + Object.keys(p[b.id] || {}).length, 0);
        return Math.round((read / total) * 100);
      },
    },
  ];

  // Recent family activity (merged and sorted)
  const recentActivity = sortedMembers.flatMap(({ uid, profile, progress }) =>
    getRecentActivity(progress, 5).map((item) => ({ ...item, uid, displayName: profile.displayName, photoURL: profile.photoURL }))
  ).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr)).slice(0, 10);

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
        {familyGroup.name} · {sortedMembers.length} members
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["overall", "Overall"], ["sections", "Sections"], ["activity", "Activity"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "7px 0", borderRadius: 10, fontSize: 12,
            background: tab === id ? "var(--accent)" : "var(--surface)",
            color: tab === id ? "var(--bg)" : "var(--text-muted)",
            border: `1px solid ${tab === id ? "var(--accent)" : "var(--border)"}`,
            cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: tab === id ? "bold" : "normal",
          }}>{label}</button>
        ))}
      </div>

      {/* Overall leaderboard */}
      {tab === "overall" && (
        <Card>
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
            Full Bible Progress
          </div>
          {sortedMembers.map(({ uid, profile, progress }, i) => (
            <MemberProgressRow
              key={uid}
              profile={profile}
              progress={progress}
              isCurrentUser={uid === currentUid}
              rank={i}
            />
          ))}
        </Card>
      )}

      {/* Section comparison */}
      {tab === "sections" && (
        <Card style={{ overflowX: "auto" }}>
          <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
            Section Comparison
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <td style={{ color: "var(--text-muted)", padding: "4px 0", width: 70 }}></td>
                {sortedMembers.map(({ uid, profile }) => (
                  <td key={uid} style={{ color: uid === currentUid ? "var(--accent-light)" : "var(--text)", textAlign: "center", padding: "4px 4px", fontFamily: "Georgia, serif" }}>
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
                        }}>
                          {val}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Activity feed */}
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
                  <div>
                    <span style={{ fontSize: 13, color: "var(--accent-light)", fontFamily: "Georgia, serif" }}>{item.displayName} </span>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>read {book?.name} {item.chapter}</span>
                  </div>
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
