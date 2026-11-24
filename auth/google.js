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
  getRedirectResult,
  setPersistence,
  signInWithRedirect,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getProfile } from "/auth/username.js?v=3";

export const CHOOSE_USERNAME_URL = "/auth/choose-username/";

// The photo on the person's Google account, or "" if none.
export function googlePhotoOf(user) {
  const google = user.providerData.find((p) => p.providerId === "google.com");
  return (google && google.photoURL) || "";
}

// Tells the navbar (which can't read Firestore) whether this person chose to
// use their Google photo, so it knows whether to show it.
export function rememberGooglePhotoChoice(uid, useGooglePhoto) {
  try { localStorage.setItem("czGooglePhoto:" + uid, useGooglePhoto ? "1" : "0"); } catch (e) { /* ignore */ }
}

// Makes the profile show the username (or nothing) instead of Google's real
// name, and the Google photo only if the person chose to use it
// (useGooglePhoto, saved in their usernames doc). Safe to call on every
// sign-in; Google can put its name and photo back when someone signs in.
export async function scrubGoogleProfile(user, username, useGooglePhoto = false) {
  const google = user.providerData.find((p) => p.providerId === "google.com");
  const googlePhoto = googlePhotoOf(user);
  const updates = {};
  if (username) {
    if (user.displayName !== username) updates.displayName = username;
  } else if (user.displayName) {
    updates.displayName = null;
  }
  if (useGooglePhoto && googlePhoto) {
    if (user.photoURL !== googlePhoto) updates.photoURL = googlePhoto;
  } else if (googlePhoto && user.photoURL === googlePhoto) {
    updates.photoURL = null;
  }
  if (Object.keys(updates).length) await updateProfile(user, updates);
  if (google) rememberGooglePhotoChoice(user.uid, useGooglePhoto && !!googlePhoto);
}

// Google sign-in uses the whole window: the page goes to Google and Google
// sends the person back to the same page, which then calls
// finishGoogleSignIn(). This works because authDomain is www.carzzyapps.com
// (see /__/auth/); through firebaseapp.com, Safari would block it.
const PENDING_KEY = "czGoogleSignIn";   // sessionStorage: "stay" or "session"

async function applyPersistence(auth, staySignedIn) {
  await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);
}

// Leaves the page for Google. Only returns if something goes wrong.
export async function startGoogleSignIn(auth, staySignedIn) {
  await applyPersistence(auth, staySignedIn);
  sessionStorage.setItem(PENDING_KEY, staySignedIn ? "stay" : "session");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithRedirect(auth, provider);
}

// True while coming back from Google, so the page can show it's busy.
export function isFinishingGoogleSignIn() {
  return sessionStorage.getItem(PENDING_KEY) !== null;
}

// Call on page load. Returns null if this isn't a return from Google;
// otherwise { needsUsername } so the page can send new users to choose one.
// Throws on errors (e.g. account-exists-with-different-credential).
export async function finishGoogleSignIn(app, auth) {
  const pending = sessionStorage.getItem(PENDING_KEY);
  if (pending === null) return null;
  sessionStorage.removeItem(PENDING_KEY);
  const staySignedIn = pending === "stay";
  await applyPersistence(auth, staySignedIn);

  const result = await getRedirectResult(auth);
  // If something else on the page picked up the result first, the person is
  // still signed in: use the current user instead.
  const user = result ? result.user : auth.currentUser;
  if (!user || !user.providerData.some((p) => p.providerId === "google.com")) return null;

  const { username, useGooglePhoto } = await getProfile(app, user.uid);
  await scrubGoogleProfile(user, username, useGooglePhoto);

  if (staySignedIn) localStorage.setItem("signIn", "true");
  else localStorage.removeItem("signIn");

  return { needsUsername: !username };
}

// Friendly text for Google sign-in errors. Returns "" when the person
// cancelled, since that isn't really an error.
export function googleErrorMessage(err) {
  switch (err && err.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/web-storage-unsupported":
      return "Google sign-in needs cookies and site storage. Turn them on for this site and try again.";
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
