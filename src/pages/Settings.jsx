import { useState } from "react";
import { Card, Divider, Button, Avatar, Modal } from "../components/UI.jsx";
import { THEMES, applyTheme } from "../data/themes.js";
import {
  updateUserProfile, signOutUser,
  createFamilyGroup, addMemberToGroup, removeMemberFromGroup,
} from "../utils/firebase.js";
import { addPendingInvitation } from "../utils/goals.js";
import { requestNotificationPermission, disableNotifications } from "../utils/goals.js";

export default function Settings({ profile, familyGroup, memberProfiles, onThemeChange, onSignOut, onRetakeTour }) {
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [groupName, setGroupName] = useState(familyGroup?.name || "");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const handleThemeChange = async (themeId) => {
    applyTheme(themeId);
    onThemeChange(themeId);
    await updateUserProfile(profile.uid, { theme: themeId });
  };

  const handleAddMember = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      await addMemberToGroup(familyGroup.id, addEmail.trim().toLowerCase());
      setAddEmail("");
    } catch (e) {
      // If user not found, save as pending invitation
      if (e.message.includes("No user found")) {
        await addPendingInvitation(familyGroup.id, addEmail.trim().toLowerCase());
        setAddEmail("");
        setAddError("No account found yet — invitation saved. They'll be added automatically when they sign in.");
      } else {
        setAddError(e.message);
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    setCreatingGroup(true);
    try {
      await createFamilyGroup(profile.uid, groupName || "My Family");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleRemoveMember = async (uid) => {
    if (!window.confirm("Remove this member from the group?")) return;
    try {
      await removeMemberFromGroup(familyGroup.id, uid);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const activeTheme = profile?.theme || "parchment";

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Profile */}
      <Divider label="My Profile" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={profile.displayName} photoURL={profile.photoURL} size={48} />
          <div>
            <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 700 }}>
              {profile.displayName}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{profile.email}</div>
          </div>
        </div>
      </Card>

      {/* Theme picker */}
      <Divider label="My Theme" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {Object.values(THEMES).map((theme) => {
          const isActive = activeTheme === theme.id;
          const bg = theme.vars["--bg"];
          const surface = theme.vars["--surface"];
          const accent = theme.vars["--accent"];
          const text = theme.vars["--text"];
          const muted = theme.vars["--text-muted"];
          const border = theme.vars["--border"];

          return (
            <div
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              style={{
                borderRadius: 12, cursor: "pointer", overflow: "hidden",
                border: `2px solid ${isActive ? accent : border}`,
                background: bg,
              }}
            >
              {/* Theme preview card */}
              <div style={{ padding: "12px 12px 10px" }}>
                <div style={{
                  fontSize: 16, fontWeight: 700, color: accent,
                  letterSpacing: "-0.3px", marginBottom: 2,
                }}>
                  {theme.name}
                </div>
                <div style={{ fontSize: 10, color: muted, marginBottom: 8 }}>
                  {theme.id === "parchment" || theme.id === "sunrise" ? "Light" : "Dark"}
                </div>
                {/* Mini card preview */}
                <div style={{
                  background: surface, borderRadius: 6, padding: "6px 8px",
                  border: `1px solid ${border}`, marginBottom: 6,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: text, marginBottom: 1 }}>My Progress</div>
                  <div style={{ fontSize: 9, color: muted }}>7-day streak</div>
                </div>
                {/* Mini button */}
                <div style={{
                  background: accent, borderRadius: 4, padding: "3px 8px",
                  fontSize: 9, fontWeight: 700, color: bg, display: "inline-block",
                }}>
                  Continue Reading
                </div>
              </div>
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  background: accent, padding: "3px 0",
                  fontSize: 9, fontWeight: 700, color: bg,
                  textAlign: "center", letterSpacing: 1,
                }}>
                  ACTIVE
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notifications */}
      <Divider label="Notifications" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>Family Notifications</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>
              {profile?.notificationsEnabled
                ? "On — book completions & streak milestones"
                : "Get notified when family completes a book or hits a streak milestone"}
            </div>
          </div>
          <div
            onClick={async () => {
              if (profile?.notificationsEnabled) {
                await disableNotifications(profile.uid);
              } else {
                const token = await requestNotificationPermission(profile.uid);
                if (!token) alert("Notifications blocked. Check your browser settings to allow them for this site.");
              }
            }}
            style={{
              width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginLeft: 12,
              background: profile?.notificationsEnabled ? "var(--green)" : "var(--border)",
              position: "relative", cursor: "pointer", transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: 2, left: profile?.notificationsEnabled ? 22 : 2,
              width: 20, height: 20, borderRadius: 10, background: "#fff",
              transition: "left 0.2s",
            }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, fontStyle: "italic", lineHeight: 1.5 }}>
          Tip: For daily reading reminders, set a recurring alarm on your phone at whatever time works best for you.
        </div>
      </Card>

      {/* Family group */}
      <Divider label="Family Group" />

      {!familyGroup ? (
        <Card>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            Create a family group to share progress with loved ones.
          </div>
          <input
            type="text" value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Family group name (e.g. The Smiths)"
            style={{
              width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13,
              outline: "none", marginBottom: 10, boxSizing: "border-box",
            }}
          />
          <Button onClick={handleCreateGroup} disabled={creatingGroup} style={{ width: "100%" }}>
            {creatingGroup ? "Creating…" : "Create Family Group"}
          </Button>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 700, marginBottom: 12 }}>
              {familyGroup.name}
            </div>
            {(familyGroup.members || []).map((uid) => {
              const memberProfile = memberProfiles?.[uid];
              if (!memberProfile) return null;
              const isMe = uid === profile.uid;
              const isOwner = uid === familyGroup.createdBy;
              return (
                <div key={uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <Avatar name={memberProfile.displayName} photoURL={memberProfile.photoURL} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: isMe ? "var(--accent-light)" : "var(--text)", fontWeight: 500 }}>
                      {memberProfile.displayName}{isMe ? " (You)" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{memberProfile.email}</div>
                  </div>
                  {isOwner ? (
                    <span style={{ fontSize: 10, color: "var(--accent)", background: "rgba(0,0,0,0.15)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Admin</span>
                  ) : profile.uid === familyGroup.createdBy ? (
                    <button onClick={() => handleRemoveMember(uid)} style={{
                      background: "transparent", border: "none", color: "var(--text-muted)",
                      fontSize: 16, cursor: "pointer", padding: "0 4px",
                    }}>✕</button>
                  ) : null}
                </div>
              );
            })}
          </Card>

          <Card>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
              Add a family member by their email address. They need to sign in at least once first.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email" value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                placeholder="their@email.com"
                style={{
                  flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13,
                  outline: "none",
                }}
              />
              <Button onClick={handleAddMember} disabled={addLoading} small>
                {addLoading ? "…" : "Add"}
              </Button>
            </div>
            {addError && <div style={{ fontSize: 12, color: addError.includes("invitation saved") ? "var(--accent)" : "var(--danger)", marginTop: 8 }}>{addError}</div>}
          </Card>
        </>
      )}

      {/* Take the tour */}
      <Divider label="Help" />
      <Button onClick={onRetakeTour} variant="ghost" style={{ width: "100%", marginBottom: 8 }}>
        Take the Tour Again
      </Button>

      {/* Sign out */}
      <Divider />
      <Button onClick={onSignOut} variant="ghost" style={{ width: "100%" }}>Sign Out</Button>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--border)" }}>
        Daily Bible Reading Log · Made with ♥
      </div>
    </div>
  );
}
