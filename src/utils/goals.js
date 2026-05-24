// Weekly goal helpers — weeks run Monday to Sunday

import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";

// ─── WEEKLY GOAL ──────────────────────────────────────────────────────────────

export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCurrentWeekKey() {
  const monday = getMondayOfWeek();
  return monday.toISOString().split("T")[0]; // e.g. "2026-05-18"
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
  const ref = doc(db, "users", uid);
  return updateDoc(ref, { weeklyGoal: chaptersPerWeek });
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

// ─── PUSH NOTIFICATIONS (Firebase Cloud Messaging) ───────────────────────────
// FCM is free for this use case — no charges at family app scale.
//
// SETUP INSTRUCTIONS:
// 1. In Firebase Console → Project Settings → Cloud Messaging
//    Generate a "Web Push certificate" (VAPID key) and copy it below.
// 2. In Firebase Console → Project Settings → General, copy your
//    "Web app" config — the messagingSenderId is already in your firebaseConfig.
// 3. Create the file public/firebase-messaging-sw.js (see below).
// 4. That's it — the app handles permission request and token registration.
//
// public/firebase-messaging-sw.js should contain:
// ─────────────────────────────────────────────
// importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
// firebase.initializeApp({ /* paste your firebaseConfig here */ });
// const messaging = firebase.messaging();
// messaging.onBackgroundMessage((payload) => {
//   self.registration.showNotification(payload.notification.title, {
//     body: payload.notification.body,
//     icon: '/icon-192.png'
//   });
// });
// ─────────────────────────────────────────────

// Replace with your VAPID public key from Firebase Console → Project Settings → Cloud Messaging
const VAPID_KEY = "BG0riagRXi5vLySVSXzbKYwUg4G_OdNE_5e5bKtfLYy8wdKxv7klG2KWxDbXv516MQCym4_Qw2SRns1JiutBuK8";

export async function requestNotificationPermission(uid) {
  try {
    const { getMessaging, getToken } = await import("firebase/messaging");
    const { getApp } = await import("firebase/app");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      // Save token to user's profile so server can send notifications
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
// Fetches recent activity across all family members for the dashboard feed

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
