// ─────────────────────────────────────────────────────────────────────────────
// firebase.js
//
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" and name it (e.g. "my-bible-reading-log")
// 3. Once created, click the </> (Web) icon to add a web app
// 4. Copy the firebaseConfig object shown and paste it below,
//    replacing the placeholder values.
// 5. In the Firebase console, go to Authentication > Sign-in method
//    and enable "Google" and "Apple"
// 6. Go to Firestore Database > Create database (start in production mode)
// 7. Go to Firestore > Rules and paste the security rules from FIREBASE_RULES.md
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
} from "firebase/firestore";

// ─── REPLACE THIS WITH YOUR FIREBASE CONFIG ──────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
// ─────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── USER PROFILES ────────────────────────────────────────────────────────────

export async function getOrCreateUserProfile(firebaseUser) {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const profile = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || "Reader",
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL || null,
    theme: "parchment",
    familyGroupId: null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}

export async function updateUserProfile(uid, updates) {
  const ref = doc(db, "users", uid);
  return updateDoc(ref, updates);
}

export function listenToUserProfile(uid, callback) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => callback(snap.exists() ? snap.data() : null));
}

// ─── READING PROGRESS ─────────────────────────────────────────────────────────
// Structure: users/{uid}/progress/{bookId}
// Each doc: { bookId, chapters: { "1": "2026-05-22", "2": "2026-05-23", ... } }

export async function getBookProgress(uid, bookId) {
  const ref = doc(db, "users", uid, "progress", bookId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().chapters || {} : {};
}

export function listenToAllProgress(uid, callback) {
  const ref = collection(db, "users", uid, "progress");
  return onSnapshot(ref, (snap) => {
    const result = {};
    snap.forEach((d) => {
      result[d.id] = d.data().chapters || {};
    });
    callback(result);
  });
}

export async function markChapterRead(uid, bookId, chapterNum, dateStr) {
  const ref = doc(db, "users", uid, "progress", bookId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { [`chapters.${chapterNum}`]: dateStr });
  } else {
    await setDoc(ref, { bookId, chapters: { [chapterNum]: dateStr } });
  }
}

export async function unmarkChapter(uid, bookId, chapterNum) {
  const ref = doc(db, "users", uid, "progress", bookId);
  await updateDoc(ref, { [`chapters.${chapterNum}`]: deleteField() });
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
// Structure: users/{uid}/notes/{bookId_chapter}

export function listenToBookNotes(uid, bookId, callback) {
  const ref = collection(db, "users", uid, "notes");
  const q = query(ref, where("bookId", "==", bookId));
  return onSnapshot(q, (snap) => {
    const notes = {};
    snap.forEach((d) => {
      notes[d.data().chapter] = d.data();
    });
    callback(notes);
  });
}

export async function saveNote(uid, bookId, chapter, text, isPublic) {
  const noteId = `${bookId}_${chapter}`;
  const ref = doc(db, "users", uid, "notes", noteId);
  await setDoc(ref, {
    bookId,
    chapter,
    text,
    isPublic,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteNote(uid, bookId, chapter) {
  const noteId = `${bookId}_${chapter}`;
  const ref = doc(db, "users", uid, "notes", noteId);
  await updateDoc(ref, { text: "", isPublic: false, updatedAt: serverTimestamp() });
}

// ─── FAMILY GROUPS ────────────────────────────────────────────────────────────
// Structure: familyGroups/{groupId} { members: [uid, ...], createdBy, name }

export async function createFamilyGroup(uid, groupName) {
  const groupId = `group_${uid}_${Date.now()}`;
  const ref = doc(db, "familyGroups", groupId);
  await setDoc(ref, {
    id: groupId,
    name: groupName || "My Family",
    createdBy: uid,
    members: [uid],
    createdAt: serverTimestamp(),
  });
  await updateUserProfile(uid, { familyGroupId: groupId });
  return groupId;
}

export async function getFamilyGroup(groupId) {
  const ref = doc(db, "familyGroups", groupId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function listenToFamilyGroup(groupId, callback) {
  const ref = doc(db, "familyGroups", groupId);
  return onSnapshot(ref, (snap) => callback(snap.exists() ? snap.data() : null));
}

export async function addMemberToGroup(groupId, memberEmail) {
  // Find user by email
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", memberEmail));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No user found with that email. They need to sign in first.");
  const memberDoc = snap.docs[0];
  const memberUid = memberDoc.id;

  const groupRef = doc(db, "familyGroups", groupId);
  await updateDoc(groupRef, { members: arrayUnion(memberUid) });
  await updateUserProfile(memberUid, { familyGroupId: groupId });
  return memberDoc.data();
}

export async function removeMemberFromGroup(groupId, memberUid) {
  const groupRef = doc(db, "familyGroups", groupId);
  await updateDoc(groupRef, { members: arrayRemove(memberUid) });
  await updateUserProfile(memberUid, { familyGroupId: null });
}

export async function getMembersProgress(memberUids) {
  const results = {};
  for (const uid of memberUids) {
    const progressRef = collection(db, "users", uid, "progress");
    const snap = await getDocs(progressRef);
    const progress = {};
    snap.forEach((d) => { progress[d.id] = d.data().chapters || {}; });
    results[uid] = progress;
  }
  return results;
}

export async function getMembersProfiles(memberUids) {
  const profiles = {};
  for (const uid of memberUids) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) profiles[uid] = snap.data();
  }
  return profiles;
}

export async function getPublicNotesForGroup(memberUids, bookId, chapter) {
  const notes = [];
  for (const uid of memberUids) {
    const noteId = `${bookId}_${chapter}`;
    const ref = doc(db, "users", uid, "notes", noteId);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().isPublic && snap.data().text) {
      notes.push({ uid, ...snap.data() });
    }
  }
  return notes;
}
