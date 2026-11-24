// Shared username helpers for the /auth pages (sign-up, Google sign-in,
// choose-username). Usernames live in Firestore at usernames/{uid}; see the
// usernames rules in /firestore.rules.
//
// Must use the same Firebase SDK version as the pages that import it, so the
// app/auth objects they pass in come from the same SDK copy.

import {
  getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, limit, runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const USERNAME_MAX = 15;

// Returns an error message, or "" if the username is fine.
export function validateUsername(username) {
  if (!username) return "Please choose a username.";
  if (username.length > USERNAME_MAX) return `Username must be ${USERNAME_MAX} characters or fewer.`;
  if (username.includes("/")) return "Username can't contain a slash (/).";
  return "";
}

// The user's saved username, or null if they haven't chosen one yet.
export async function findUsername(app, uid) {
  return (await getProfile(app, uid)).username;
}

// { username, useGooglePhoto } from the user's record. username is null if
// they haven't chosen one; useGooglePhoto is false unless they turned it on.
export async function getProfile(app, uid) {
  const db = getFirestore(app);
  const snap = await getDoc(doc(db, "usernames", uid));
  if (snap.exists()) {
    const data = snap.data();
    if (typeof data.username === "string" && data.username.trim()) {
      return { username: data.username, useGooglePhoto: data.useGooglePhoto === true };
    }
  }

  // Older accounts stored the username under a doc named after the username.
  const legacy = await getDocs(query(collection(db, "usernames"), where("uid", "==", uid), limit(1)));
  let legacyName = null;
  legacy.forEach((d) => {
    const n = d.data().username;
    if (typeof n === "string" && n.trim()) legacyName = n;
  });
  return { username: legacyName, useGooglePhoto: false };
}

// Saves whether a Google user's Google photo is their profile picture.
export async function setUseGooglePhoto(app, user, username, useGooglePhoto) {
  const db = getFirestore(app);
  await setDoc(doc(db, "usernames", user.uid), {
    uid: user.uid,
    guest: false,
    username: username,
    usernameLower: username.toLowerCase(),
    useGooglePhoto: !!useGooglePhoto
  }, { merge: true });
}

// Saves the username for this user. Throws an error with code
// "already-exists" if someone else has it.
export async function claimUsername(app, user, username) {
  const db = getFirestore(app);
  const lowercaseUsername = username.toLowerCase();

  const taken = await getDocs(query(collection(db, "usernames"), where("usernameLower", "==", lowercaseUsername)));
  let isTaken = false;
  taken.forEach((docSnap) => {
    if (docSnap.data().uid !== user.uid) isTaken = true;
  });
  if (isTaken) {
    const e = new Error("taken"); e.code = "already-exists"; throw e;
  }

  const ref = doc(db, "usernames", user.uid);
  await runTransaction(db, async (tx) => {
    // merge keeps other settings (like useGooglePhoto) when the name changes.
    tx.set(ref, {
      uid: user.uid,
      guest: false,
      username: username,
      usernameLower: lowercaseUsername
    }, { merge: true });
  });
}
