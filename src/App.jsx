import { useState, useEffect, useCallback } from "react";
import {
  onAuthChange, getOrCreateUserProfile,
  listenToAllProgress, listenToUserProfile,
  listenToFamilyGroup, getMembersProfiles,
} from "./utils/firebase.js";
import {
  getFamilyFeedItems,
  hasTourBeenCompleted, resetTour,
  shouldShowStreakEndedMessage, markStreakEndedMessageShown, clearStreakEndedFlag,
  checkAndAcceptPendingInvitation,
  updateLongestStreak,
} from "./utils/goals.js";
import { getCurrentStreak, calculateLongestStreak } from "./utils/progress.js";
import { applyTheme } from "./data/themes.js";
import { BOOK_MAP } from "./data/bibleData.js";
import { HomeIcon, BookIcon, FamilyIcon, SettingsIcon, BackIcon } from "./components/Icons.jsx";
import { Spinner, Toast, Modal, Button } from "./components/UI.jsx";
import GuidedTour from "./components/GuidedTour.jsx";

import SignIn from "./pages/SignIn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Books from "./pages/Books.jsx";
import Chapters from "./pages/Chapters.jsx";
import Family from "./pages/Family.jsx";
import Settings from "./pages/Settings.jsx";

const NAV = [
  { id: "dashboard", Icon: HomeIcon, label: "Home" },
  { id: "books", Icon: BookIcon, label: "Books" },
  { id: "family", Icon: FamilyIcon, label: "Family" },
  { id: "settings", Icon: SettingsIcon, label: "Settings" },
];

export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState({});
  const [familyGroup, setFamilyGroup] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [familyFeedItems, setFamilyFeedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [pageParams, setPageParams] = useState({});
  const [toast, setToast] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [showTour, setShowTour] = useState(false);
  const [streakEndedMsg, setStreakEndedMsg] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setAuthUser(user);
      if (user) {
        const prof = await getOrCreateUserProfile(user);
        setProfile(prof);
        applyTheme(prof.theme || "parchment");

        // Check for pending invitation
        if (user.email && !prof.familyGroupId) {
          await checkAndAcceptPendingInvitation(user.uid, user.email);
        }

        // Check if tour needs to be shown
        const tourDone = await hasTourBeenCompleted(user.uid);
        if (!tourDone) setShowTour(true);
      } else {
        setProfile(null);
        applyTheme("parchment");
      }
    });
    return unsub;
  }, []);

  // Profile listener
  useEffect(() => {
    if (!authUser?.uid) return;
    const unsub = listenToUserProfile(authUser.uid, (prof) => {
      if (prof) { setProfile(prof); applyTheme(prof.theme || "parchment"); }
    });
    return unsub;
  }, [authUser?.uid]);

  // Progress listener
  useEffect(() => {
    if (!authUser?.uid) return;
    const unsub = listenToAllProgress(authUser.uid, setProgress);
    return unsub;
  }, [authUser?.uid]);

  // Family group listener
  useEffect(() => {
    if (!profile?.familyGroupId) { setFamilyGroup(null); setFamilyFeedItems([]); return; }
    const unsub = listenToFamilyGroup(profile.familyGroupId, async (group) => {
      setFamilyGroup(group);
      if (group?.members?.length) {
        const [profiles, feed] = await Promise.all([
          getMembersProfiles(group.members),
          getFamilyFeedItems(group.members, 8),
        ]);
        setMemberProfiles(profiles);
        setFamilyFeedItems(feed);
      }
    });
    return unsub;
  }, [profile?.familyGroupId]);

  // Check streak ended message after progress loads
  useEffect(() => {
    if (!authUser?.uid || Object.keys(progress).length === 0) return;
    const check = async () => {
      const streak = getCurrentStreak(progress);
      const longest = calculateLongestStreak(progress);

      // Update longest streak in Firebase
      await updateLongestStreak(authUser.uid, Math.max(streak, longest));

      // If streak is 0 but they had a longest streak, check if we need to show ended message
      if (streak === 0 && longest > 0) {
        const shouldShow = await shouldShowStreakEndedMessage(authUser.uid, longest);
        if (shouldShow) {
          setStreakEndedMsg({ longest });
          await markStreakEndedMessageShown(authUser.uid, longest);
        }
      }

      // If streak > 0, clear the ended flag so it can fire again if broken later
      if (streak > 0) {
        await clearStreakEndedFlag(authUser.uid);
      }
    };
    check();
  }, [authUser?.uid, progress]);

  const navigate = useCallback((page, params = {}) => {
    setPageHistory((h) => [...h, { page: currentPage, params: pageParams }]);
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  }, [currentPage, pageParams]);

  const goBack = useCallback(() => {
    if (pageHistory.length === 0) return;
    const prev = pageHistory[pageHistory.length - 1];
    setPageHistory((h) => h.slice(0, -1));
    setCurrentPage(prev.page);
    setPageParams(prev.params);
    window.scrollTo(0, 0);
  }, [pageHistory]);

  const handleNavClick = (pageId) => {
    setPageHistory([]);
    setCurrentPage(pageId);
    setPageParams({});
    window.scrollTo(0, 0);
  };

  const handleSignOut = async () => {
    const { signOutUser } = await import("./utils/firebase.js");
    await signOutUser();
    setProgress({});
    setFamilyGroup(null);
    setFamilyFeedItems([]);
    setCurrentPage("dashboard");
    setShowTour(false);
    setStreakEndedMsg(null);
  };

  const handleRetakeTour = async () => {
    await resetTour(authUser.uid);
    setShowTour(true);
    handleNavClick("dashboard");
  };

  if (authUser === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <Spinner />
      </div>
    );
  }

  if (!authUser) return <SignIn />;

  const pageTitles = {
    dashboard: "My Progress",
    books: "Books",
    chapters: pageParams.bookId ? BOOK_MAP[pageParams.bookId]?.name || "Chapters" : "Chapters",
    family: "Family",
    settings: "Settings",
  };

  const showBack = pageHistory.length > 0;

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: "var(--bg)", display: "flex", flexDirection: "column",
      fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--nav-bg)", borderBottom: "1px solid var(--border)",
        padding: "10px 16px 10px",
      }}>
        <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3, fontWeight: 600 }}>
          Daily Bible Reading Log
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showBack && (
            <button onClick={goBack} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 4px 0 0", display: "flex", alignItems: "center" }}>
              <BackIcon size={20} />
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: 18, color: "var(--text)", fontWeight: 600, letterSpacing: "-0.3px" }}>
            {pageTitles[currentPage]}
          </h1>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, padding: "16px 16px 0", overflowY: "auto" }}>
        {currentPage === "dashboard" && (
          <Dashboard
            progress={progress} profile={profile}
            familyFeedItems={familyFeedItems} memberProfiles={memberProfiles}
            onNavigate={navigate}
          />
        )}
        {currentPage === "books" && (
          <Books progress={progress} onNavigate={navigate} initialTestament={pageParams.testament} />
        )}
        {currentPage === "chapters" && (
          <Chapters
            uid={authUser.uid} bookId={pageParams.bookId}
            progress={progress} onNavigate={navigate}
            familyGroupId={familyGroup?.id}
            familyMemberUids={familyGroup?.members || []}
          />
        )}
        {currentPage === "family" && (
          <Family currentUid={authUser.uid} familyGroup={familyGroup} currentProgress={progress} />
        )}
        {currentPage === "settings" && (
          <Settings
            profile={profile} familyGroup={familyGroup} memberProfiles={memberProfiles}
            onThemeChange={(themeId) => setProfile((p) => ({ ...p, theme: themeId }))}
            onSignOut={handleSignOut}
            onRetakeTour={handleRetakeTour}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "var(--nav-bg)", borderTop: "1px solid var(--border)",
        padding: "8px 0 16px", display: "flex", justifyContent: "space-around", zIndex: 100,
      }}>
        {NAV.map(({ id, Icon, label }) => {
          const isActive = currentPage === id || (id === "books" && currentPage === "chapters");
          return (
            <button key={id} onClick={() => handleNavClick(id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, background: "transparent", border: "none", cursor: "pointer", padding: "4px 20px",
            }}>
              <Icon size={22} color={isActive ? "var(--accent)" : "var(--text-muted)"} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.2px" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Streak ended message */}
      {streakEndedMsg && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 250,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: 20, padding: "28px 24px",
            maxWidth: 340, width: "100%", textAlign: "center",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔥</div>
            <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>
              Your {streakEndedMsg.longest}-day streak ended. But don't give up. Your personal best is {streakEndedMsg.longest} days and you can start a new one today!
            </div>
            <button
              onClick={() => setStreakEndedMsg(null)}
              style={{
                width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: "var(--accent)", color: "var(--bg)", border: "none", cursor: "pointer",
              }}
            >
              Start Fresh Today
            </button>
          </div>
        </div>
      )}

      {/* Guided tour */}
      {showTour && !streakEndedMsg && (
        <GuidedTour
          uid={authUser.uid}
          currentPage={currentPage}
          onNavigate={navigate}
          onComplete={() => setShowTour(false)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); font-family: 'Nunito', system-ui, sans-serif; }
        :root {
          --bg: #f5ead0; --surface: #ede0c0; --card: #e8d5a8;
          --accent: #b8892a; --accent-light: #d4a840;
          --text: #3d2b0e; --text-muted: #7a5c2e;
          --green: #4a7c3f; --green-light: #6a9e5f;
          --border: #c8a96e; --hebrew: #7055b0; --greek: #2878b0;
          --danger: #c0392b; --nav-bg: #ede0c0;
        }
        input, textarea, button { font-family: 'Nunito', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  );
}
