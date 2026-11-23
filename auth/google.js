// "Continue with Google" for the sign-in and sign-up pages.
//
// Google fills the Firebase profile with the person's real name and photo.
// Usernames on this site must not be real names, and other pages read
// displayName (the navbar, Rhythm Runner, and Crema Rush, which would save it
// as the username), so this replaces the Google name with the person's
// username straight away, or removes it until they pick one on
// /auth/choose-username.

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { findUsername } from "/auth/username.js";

export const CHOOSE_USERNAME_URL = "/auth/choose-username/";

// Makes the profile show the username (or nothing) instead of Google's
// real name and photo. Safe to call on every sign-in.
export async function scrubGoogleProfile(user, username) {
  const google = user.providerData.find((p) => p.providerId === "google.com");
  const updates = {};
  if (username) {
    if (user.displayName !== username) updates.displayName = username;
  } else if (user.displayName) {
    updates.displayName = null;
  }
  if (google && google.photoURL && user.photoURL === google.photoURL) {
    updates.photoURL = null;
  }
  if (Object.keys(updates).length) await updateProfile(user, updates);
}

// Signs in with a Google popup. Returns { needsUsername } so the page can
// send new users to choose one.
export async function signInWithGoogle(app, auth, staySignedIn) {
  await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);

  const username = await findUsername(app, cred.user.uid);
  await scrubGoogleProfile(cred.user, username);

  if (staySignedIn) localStorage.setItem("signIn", "true");
  else localStorage.removeItem("signIn");

  return { needsUsername: !username };
}

// Friendly text for errors from the Google popup. Returns "" when the person
// just closed the popup, since that isn't really an error.
export function googleErrorMessage(err) {
  switch (err && err.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Sign in with your email and password instead.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/unauthorized-domain":
      return "Google sign-in isn't set up for this website yet.";
    case "auth/operation-not-allowed":
      return "Google sign-in isn't turned on yet.";
    default:
      return "Google sign-in failed. Please try again.";
  }
}
