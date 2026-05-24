import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
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

export function getCurrentWeekKey() {
  return getMondayOfWeek().toISOString().split("T")[0];
}

export function getSundayOfWeek(date = new Date()) {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

export function countChaptersThisWeek(progress) {
  const monday = getMondayOfWeek();
  const sunday = getSundayOfWeek();
  const mondayStr = monday.toISOString().split("T")[0];
  const sundayStr = sunday.toISOString().split("T")[0];
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

export async function getLongestStreak(uid) {
  const ref = doc(db, "users", uid, "meta", "stats");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().longestStreak || 0 : 0;
}

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

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────

const VAPID_KEY = "BG0riagRXi5vLySVSXzbKYwUg4G_OdNE_5e5bKtfLYy8wdKxv7klG2KWxDbXv516MQCym4_Qw2SRns1JiutBuK8";

export async function requestNotificationPermission(uid) {
  try {
    // Register service worker first
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

// ─── FAMILY ACTIVITY FEED ─────────────────────────────────────────────────────

export async function getFamilyFeedItems(memberUids, limit = 8) {
  const items = [];
  for (const uid of memberUids) {
    const progressRef = collection(db, "users", uid, "progress");
    const snap = await getDocs(progressRef);
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
