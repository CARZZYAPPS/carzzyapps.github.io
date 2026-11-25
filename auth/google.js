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
import { getProfile } from "/auth/username.js?v=4";

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

// Removes the name and/or photo from the person's Firebase profile.
// updateProfile(user, { displayName: null }) does NOT do this: the server
// treats null as "leave unchanged" and the SDK then puts the old value back.
// Removing needs the API's deleteAttribute, which the SDK doesn't send.
const API_KEY = "AIzaSyAgu1uiobgixRWcvIja6bI1l6M2KQ36FL4";

export async function clearProfileFields(user, { name = false, photo = false }) {
  const deleteAttribute = [];
  if (name) deleteAttribute.push("DISPLAY_NAME");
  if (photo) deleteAttribute.push("PHOTO_URL");
  if (!deleteAttribute.length) return;
  const idToken = await user.getIdToken();
  const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:update?key=" + API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, deleteAttribute })
  });
  if (!response.ok) {
    const e = new Error("Could not update the profile (" + response.status + ")");
    e.code = response.status >= 500 || response.status === 0 ? "unavailable" : "profile-update-failed";
    throw e;
  }
  await user.reload();   // pick up the change on this page
}

// Tells the navbar the person's username, so on /auth pages it can tell a
// username that happens to match their Google name apart from the Google
// name itself (which is briefly on the profile right after Google sign-in).
export function rememberUsername(uid, username) {
  try { localStorage.setItem("czUsername:" + uid, username || ""); } catch (e) { /* ignore */ }
}

// Asks the navbar to reload the profile and redraw (name and photo). The
// navbar runs its own copy of Firebase, which doesn't see changes made here.
export function profileChanged() {
  window.dispatchEvent(new Event("cz-profile-changed"));
}

// Makes the profile show the username (or nothing) instead of Google's real
// name, and the Google photo only if the person chose to use it
// (useGooglePhoto, saved in their usernames doc). Safe to call on every
// sign-in; Google can put its name and photo back when someone signs in.
export async function scrubGoogleProfile(user, username, useGooglePhoto = false) {
  const google = user.providerData.find((p) => p.providerId === "google.com");
  const googlePhoto = googlePhotoOf(user);
  const updates = {};
  const clear = { name: false, photo: false };
  if (username) {
    if (user.displayName !== username) updates.displayName = username;
  } else if (user.displayName) {
    clear.name = true;
  }
  if (useGooglePhoto && googlePhoto) {
    if (user.photoURL !== googlePhoto) updates.photoURL = googlePhoto;
  } else if (googlePhoto && user.photoURL === googlePhoto) {
    clear.photo = true;
  }
  if (Object.keys(updates).length) await updateProfile(user, updates);
  await clearProfileFields(user, clear);
  rememberUsername(user.uid, username);
  if (google) rememberGooglePhotoChoice(user.uid, useGooglePhoto && !!googlePhoto);
  profileChanged();
}

// Google sign-in opens Google in a popup window; the page stays where it is.
// Returns { needsUsername } so the page can send new users to choose one.
// Throws on errors, including the person closing the popup
// (auth/popup-closed-by-user); googleErrorMessage() turns those into text.
export async function signInWithGoogle(app, auth, staySignedIn) {
  await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);

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
    case "auth/user-cancelled":
      return "Google sign-in was cancelled. Please try again.";
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
