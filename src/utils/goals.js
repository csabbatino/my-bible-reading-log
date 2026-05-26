import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase.js";

// ─── WEEKLY GOAL ──────────────────────────────────────────────────────────────

export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getSundayOfWeek(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

export function countChaptersThisWeek(progress) {
  const today = new Date();
  const monday = getMondayOfWeek(today);
  const sunday = getSundayOfWeek(today);
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dy}`;
  };
  const mondayStr = fmt(monday);
  const sundayStr = fmt(sunday);
  let count = 0;
  for (const bookProgress of Object.values(progress)) {
    for (const dateStr of Object.values(bookProgress)) {
      if (dateStr >= mondayStr && dateStr <= sundayStr) count++;
    }
  }
  return count;
}

export async function saveWeeklyGoal(uid, chaptersPerWeek) {
  return updateDoc(doc(db, "users", uid), { weeklyGoal: chaptersPerWeek });
}

// ─── BADGES ───────────────────────────────────────────────────────────────────

export async function getEarnedBadges(uid) {
  const ref = doc(db, "users", uid, "meta", "badges");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().earned || [] : [];
}

export async function saveEarnedBadges(uid, badgeIds) {
  const ref = doc(db, "users", uid, "meta", "badges");
  return setDoc(ref, { earned: badgeIds }, { merge: true });
}

// ─── LONGEST STREAK ───────────────────────────────────────────────────────────

export async function updateLongestStreak(uid, currentStreak) {
  const ref = doc(db, "users", uid, "meta", "stats");
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().longestStreak || 0 : 0;
  if (currentStreak > existing) {
    await setDoc(ref, { longestStreak: currentStreak }, { merge: true });
    return currentStreak;
  }
  return existing;
}

export async function getLongestStreak(uid) {
  const ref = doc(db, "users", uid, "meta", "stats");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().longestStreak || 0 : 0;
}

// ─── STREAK ENDED MESSAGE ─────────────────────────────────────────────────────
// Shows once per broken streak, then never again until a new streak is broken

export async function shouldShowStreakEndedMessage(uid, longestStreak) {
  if (longestStreak === 0) return false;
  const ref = doc(db, "users", uid, "meta", "stats");
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  // If streakEndedShown matches current longestStreak, we've already shown it
  return data.streakEndedShown !== longestStreak;
}

export async function markStreakEndedMessageShown(uid, longestStreak) {
  const ref = doc(db, "users", uid, "meta", "stats");
  await setDoc(ref, { streakEndedShown: longestStreak }, { merge: true });
}

export async function clearStreakEndedFlag(uid) {
  // Called when a new streak begins — clears the flag so it can fire again if broken
  const ref = doc(db, "users", uid, "meta", "stats");
  await setDoc(ref, { streakEndedShown: null }, { merge: true });
}

// ─── GUIDED TOUR ──────────────────────────────────────────────────────────────

export async function hasTourBeenCompleted(uid) {
  const ref = doc(db, "users", uid, "meta", "tour");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().completed === true : false;
}

export async function markTourCompleted(uid) {
  const ref = doc(db, "users", uid, "meta", "tour");
  return setDoc(ref, { completed: true }, { merge: true });
}

export async function resetTour(uid) {
  const ref = doc(db, "users", uid, "meta", "tour");
  return setDoc(ref, { completed: false }, { merge: true });
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────

const VAPID_KEY = "BG0riagRXi5vLySVSXzbKYwUg4G_OdNE_5e5bKtfLYy8wdKxv7klG2KWxDbXv516MQCym4_Qw2SRns1JiutBuK8";

export async function requestNotificationPermission(uid) {
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const { getMessaging, getToken } = await import("firebase/messaging");
    const { getApp } = await import("firebase/app");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await updateDoc(doc(db, "users", uid), { fcmToken: token, notificationsEnabled: true });
      return token;
    }
    return null;
  } catch (e) {
    console.warn("Push notification setup failed:", e);
    return null;
  }
}

export async function disableNotifications(uid) {
  await updateDoc(doc(db, "users", uid), { fcmToken: null, notificationsEnabled: false });
}

// Client-side notification sending — calls FCM HTTP API directly
// Sends to all family members who have notifications enabled
export async function sendFamilyNotification(familyGroupId, currentUid, title, body) {
  try {
    // Get family group members
    const groupSnap = await getDoc(doc(db, "familyGroups", familyGroupId));
    if (!groupSnap.exists()) return;
    const members = groupSnap.data().members || [];

    // Get FCM tokens for all members except current user
    const otherMembers = members.filter((uid) => uid !== currentUid);
    for (const uid of otherMembers) {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) continue;
      const { fcmToken, notificationsEnabled } = userSnap.data();
      if (!fcmToken || !notificationsEnabled) continue;

      // Send via FCM HTTP v1 API
      await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `key=${fcmToken}`,
        },
        body: JSON.stringify({
          to: fcmToken,
          notification: { title, body },
          webpush: {
            notification: { title, body, icon: "/icon-192.png" },
          },
        }),
      });
    }
  } catch (e) {
    console.warn("Failed to send family notification:", e);
  }
}

// ─── FAMILY ACTIVITY FEED ─────────────────────────────────────────────────────

export async function getFamilyFeedItems(memberUids, limit = 8) {
  const items = [];
  for (const uid of memberUids) {
    const snap = await getDocs(collection(db, "users", uid, "progress"));
    snap.forEach((d) => {
      const bookId = d.id;
      const chapters = d.data().chapters || {};
      for (const [chapter, dateStr] of Object.entries(chapters)) {
        if (dateStr) items.push({ uid, bookId, chapter: parseInt(chapter), dateStr });
      }
    });
  }
  items.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
  return items.slice(0, limit);
}

// ─── PENDING INVITATIONS ──────────────────────────────────────────────────────
// Allows admins to invite members by email before they sign in

export async function addPendingInvitation(groupId, email) {
  const ref = doc(db, "pendingInvitations", email.toLowerCase());
  await setDoc(ref, { groupId, email: email.toLowerCase() }, { merge: true });
}

export async function checkAndAcceptPendingInvitation(uid, email) {
  try {
    const ref = doc(db, "pendingInvitations", email.toLowerCase());
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const { groupId } = snap.data();
    // Add user to family group
    const { arrayUnion } = await import("firebase/firestore");
    await updateDoc(doc(db, "familyGroups", groupId), { members: arrayUnion(uid) });
    await updateDoc(doc(db, "users", uid), { familyGroupId: groupId });
    // Clean up invitation
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref);
    return groupId;
  } catch (e) {
    console.warn("Failed to accept pending invitation:", e);
    return null;
  }
}
