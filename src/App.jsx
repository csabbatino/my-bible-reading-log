import { useState, useEffect, useCallback } from "react";
import {
  onAuthChange, getOrCreateUserProfile,
  listenToAllProgress, listenToUserProfile,
  listenToFamilyGroup, getMembersProfiles,
} from "./utils/firebase.js";
import { getFamilyFeedItems } from "./utils/goals.js";
import { applyTheme } from "./data/themes.js";
import { BOOK_MAP } from "./data/bibleData.js";

import SignIn from "./pages/SignIn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Books from "./pages/Books.jsx";
import Chapters from "./pages/Chapters.jsx";
import Family from "./pages/Family.jsx";
import Settings from "./pages/Settings.jsx";
import { Spinner, Toast } from "./components/UI.jsx";

const NAV = [
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "books", icon: "📖", label: "Books" },
  { id: "family", icon: "👨‍👩‍👧", label: "Family" },
  { id: "settings", icon: "⚙️", label: "Settings" },
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

  // Auth listener
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setAuthUser(user);
      if (user) {
        const prof = await getOrCreateUserProfile(user);
        setProfile(prof);
        applyTheme(prof.theme || "parchment");
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

  // Family group listener + feed
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

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

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
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--nav-bg)", borderBottom: "1px solid var(--border)",
        padding: "10px 16px 8px",
      }}>
        <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>
          My Bible Reading Log
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showBack && (
            <button onClick={goBack} style={{
              background: "transparent", border: "none", color: "var(--accent)",
              fontSize: 20, cursor: "pointer", padding: "0 4px 0 0", lineHeight: 1,
            }}>‹</button>
          )}
          <h1 style={{ margin: 0, fontSize: 18, color: "var(--text)", fontFamily: "Georgia, serif", fontWeight: "bold" }}>
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
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "var(--nav-bg)", borderTop: "1px solid var(--border)",
        padding: "8px 0 12px", display: "flex", justifyContent: "space-around", zIndex: 100,
      }}>
        {NAV.map(({ id, icon, label }) => {
          const isActive = currentPage === id || (id === "books" && currentPage === "chapters");
          return (
            <button key={id} onClick={() => handleNavClick(id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 16px",
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{
                fontSize: 10, fontFamily: "Georgia, serif",
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                fontWeight: isActive ? "bold" : "normal",
              }}>{label}</span>
              {isActive && <div style={{ width: 4, height: 4, borderRadius: 2, background: "var(--accent)" }} />}
            </button>
          );
        })}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); }
        :root {
          --bg: #1a1208; --surface: #2a1f0e; --card: #332615;
          --accent: #c9a84c; --accent-light: #e8c97a;
          --text: #f0e6d0; --text-muted: #9a8a6a;
          --green: #5a9e6f; --green-light: #7bc490;
          --border: #4a3820; --hebrew: #8b6fd6; --greek: #4a9fd6;
          --danger: #c0392b; --nav-bg: #2a1f0e;
        }
        input, textarea, button { font-family: Georgia, serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  );
}
