import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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

const firebaseConfig = {
  apiKey: "AIzaSyAfAwBXoalxdTzwohpjB-v65G-BPJjifFE",
  authDomain: "daily-bible-reading-log.firebaseapp.com",
  projectId: "daily-bible-reading-log",
  storageBucket: "daily-bible-reading-log.firebasestorage.app",
  messagingSenderId: "500677527816",
  appId: "1:500677527816:web:66b7c121c51f0f8c38c4bd",
  measurementId: "G-8JMD13G96Y",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAccountWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
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
  return updateDoc(doc(db, "users", uid), updates);
}

export function listenToUserProfile(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snap) => callback(snap.exists() ? snap.data() : null));
}

// ─── READING PROGRESS ─────────────────────────────────────────────────────────

export function listenToAllProgress(uid, callback) {
  return onSnapshot(collection(db, "users", uid, "progress"), (snap) => {
    const result = {};
    snap.forEach((d) => { result[d.id] = d.data().chapters || {}; });
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
  await updateDoc(doc(db, "users", uid, "progress", bookId), {
    [`chapters.${chapterNum}`]: deleteField(),
  });
}

// ─── NOTES ────────────────────────────────────────────────────────────────────

export function listenToBookNotes(uid, bookId, callback) {
  const q = query(collection(db, "users", uid, "notes"), where("bookId", "==", bookId));
  return onSnapshot(q, (snap) => {
    const notes = {};
    snap.forEach((d) => { notes[d.data().chapter] = d.data(); });
    callback(notes);
  });
}

export async function saveNote(uid, bookId, chapter, text, isPublic) {
  const noteId = `${bookId}_${chapter}`;
  await setDoc(doc(db, "users", uid, "notes", noteId), {
    bookId, chapter, text, isPublic, updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── FAMILY GROUPS ────────────────────────────────────────────────────────────

export async function createFamilyGroup(uid, groupName) {
  const groupId = `group_${uid}_${Date.now()}`;
  await setDoc(doc(db, "familyGroups", groupId), {
    id: groupId, name: groupName || "My Family",
    createdBy: uid, members: [uid], createdAt: serverTimestamp(),
  });
  await updateUserProfile(uid, { familyGroupId: groupId });
  return groupId;
}

export function listenToFamilyGroup(groupId, callback) {
  return onSnapshot(doc(db, "familyGroups", groupId), (snap) => callback(snap.exists() ? snap.data() : null));
}

export async function addMemberToGroup(groupId, memberEmail) {
  const q = query(collection(db, "users"), where("email", "==", memberEmail));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No user found with that email. They need to sign in first.");
  const memberDoc = snap.docs[0];
  const memberUid = memberDoc.id;
  await updateDoc(doc(db, "familyGroups", groupId), { members: arrayUnion(memberUid) });
  await updateUserProfile(memberUid, { familyGroupId: groupId });
  return memberDoc.data();
}

export async function removeMemberFromGroup(groupId, memberUid) {
  await updateDoc(doc(db, "familyGroups", groupId), { members: arrayRemove(memberUid) });
  await updateUserProfile(memberUid, { familyGroupId: null });
}

export async function getMembersProgress(memberUids) {
  const results = {};
  for (const uid of memberUids) {
    const snap = await getDocs(collection(db, "users", uid, "progress"));
    const progress = {};
    snap.forEach((d) => { progress[d.id] = d.data().chapters || {}; });
    results[uid] = progress;
  }
  return results;
}

export async function getMembersProfiles(memberUids) {
  const profiles = {};
  for (const uid of memberUids) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) profiles[uid] = snap.data();
  }
  return profiles;
}

export async function getFamilyGroup(groupId) {
  const snap = await getDoc(doc(db, "familyGroups", groupId));
  return snap.exists() ? snap.data() : null;
}
