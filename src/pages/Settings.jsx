import { useState } from "react";
import { Card, Divider, Button, Avatar, Badge, Modal } from "../components/UI.jsx";
import { THEMES, applyTheme } from "../data/themes.js";
import {
  updateUserProfile, signOutUser,
  createFamilyGroup, addMemberToGroup, removeMemberFromGroup,
} from "../utils/firebase.js";
import { requestNotificationPermission, disableNotifications } from "../utils/goals.js";
import { BADGES } from "../data/badges.js";

export default function Settings({ profile, familyGroup, memberProfiles, onThemeChange, onSignOut }) {
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
      setAddError(e.message);
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

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Profile */}
      <Divider label="My Profile" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={profile.displayName} photoURL={profile.photoURL} size={48} />
          <div>
            <div style={{ fontSize: 16, color: "var(--text)", fontFamily: "Georgia, serif", fontWeight: "bold" }}>
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
          const isActive = (profile?.theme || "parchment") === theme.id;
          return (
            <div
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              style={{
                padding: "12px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                background: isActive ? "rgba(201,168,76,0.1)" : "var(--surface)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 20 }}>{theme.emoji}</span>
              <div>
                <div style={{ fontSize: 12, color: isActive ? "var(--accent)" : "var(--text)", fontFamily: "Georgia, serif" }}>
                  {theme.name}
                </div>
                {isActive && <div style={{ fontSize: 10, color: "var(--accent)" }}>✓ Active</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Family group */}
      <Divider label="Family Group" />

      {!familyGroup ? (
        <Card>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            Create a family group to share progress with loved ones.
          </div>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Family group name (e.g. The Smiths)"
            style={{
              width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13,
              fontFamily: "Georgia, serif", outline: "none", marginBottom: 10, boxSizing: "border-box",
            }}
          />
          <Button onClick={handleCreateGroup} disabled={creatingGroup} style={{ width: "100%" }}>
            {creatingGroup ? "Creating…" : "Create Family Group"}
          </Button>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ fontSize: 14, color: "var(--text)", fontFamily: "Georgia, serif", fontWeight: "bold", marginBottom: 12 }}>
              {familyGroup.name}
            </div>

            {/* Members list */}
            {(familyGroup.members || []).map((uid) => {
              const memberProfile = memberProfiles?.[uid];
              if (!memberProfile) return null;
              const isMe = uid === profile.uid;
              const isOwner = uid === familyGroup.createdBy;
              return (
                <div key={uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <Avatar name={memberProfile.displayName} photoURL={memberProfile.photoURL} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: isMe ? "var(--accent-light)" : "var(--text)" }}>
                      {memberProfile.displayName}{isMe ? " (You)" : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{memberProfile.email}</div>
                  </div>
                  {isOwner ? (
                    <Badge>Admin</Badge>
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

          {/* Add member */}
          <Card>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
              Add a family member by their email address. They need to sign in to My Bible Reading Log at least once first.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                placeholder="their@email.com"
                style={{
                  flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13,
                  fontFamily: "Georgia, serif", outline: "none",
                }}
              />
              <Button onClick={handleAddMember} disabled={addLoading} small>
                {addLoading ? "…" : "Add"}
              </Button>
            </div>
            {addError && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{addError}</div>}
          </Card>
        </>
      )}

      {/* Notifications */}
      <Divider label="Notifications" />
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, color: "var(--text)", fontFamily: "Georgia, serif" }}>Daily Reminders</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {profile?.notificationsEnabled ? "Push notifications are on" : "Get nudged to keep your streak"}
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
              width: 44, height: 24, borderRadius: 12,
              background: profile?.notificationsEnabled ? "var(--green)" : "var(--border)",
              position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 2, left: profile?.notificationsEnabled ? 22 : 2,
              width: 20, height: 20, borderRadius: 10, background: "#fff",
              transition: "left 0.2s",
            }} />
          </div>
        </div>
        {!profile?.notificationsEnabled && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>
            Note: You'll be asked to allow notifications in your browser. This works best when the app is saved to your home screen.
          </div>
        )}
      </Card>

      {/* Sign out */}
      <Divider />
      <Button onClick={onSignOut} variant="ghost" style={{ width: "100%" }}>
        Sign Out
      </Button>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--border)" }}>
        My Bible Reading Log · Made with ♥
      </div>
    </div>
  );
}
// Note: Settings.jsx already handles theme and family management.
// Notification toggle is added inline below via the exported component update.
