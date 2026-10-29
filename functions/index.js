const { randomBytes } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { defineString } = require("firebase-functions/params");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

initializeApp();

const db = getFirestore();
const auth = getAuth();
const webApiKey = defineString("FIREBASE_WEB_API_KEY");
const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;

function normalizeUsername(value) {
  if (typeof value !== "string" || !usernamePattern.test(value)) {
    throw new HttpsError("invalid-argument", "Enter a valid username.");
  }
  return value.toLowerCase();
}

function usernameRefs(username) {
  return {
    publicRef: db.collection("usernames").doc(username),
    privateRef: db.collection("usernameAuthLookup").doc(username)
  };
}

exports.createGuestUsername = onCall(async (request) => {
  if (
    !request.auth ||
    request.auth.token.firebase?.sign_in_provider !== "anonymous" ||
    request.auth.token.email
  ) {
    throw new HttpsError("unauthenticated", "Start a guest session before generating a guest username.");
  }

  const uid = request.auth.uid;
  const guestRef = db.collection("guestAccounts").doc(uid);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = `Guest_${randomBytes(5).toString("hex")}`;
    const publicRef = db.collection("usernames").doc(username.toLowerCase());
    try {
      const savedUsername = await db.runTransaction(async (transaction) => {
        const guestSnapshot = await transaction.get(guestRef);
        if (guestSnapshot.exists) return guestSnapshot.data().username;

        const usernameSnapshot = await transaction.get(publicRef);
        if (usernameSnapshot.exists) {
          throw new HttpsError("already-exists", "Generated guest username was already taken.");
        }
        transaction.set(publicRef, { uid, guest: true });
        transaction.set(guestRef, { username });
        return username;
      });
      return { username: savedUsername };
    } catch (error) {
      if (error instanceof HttpsError && error.code === "already-exists") continue;
      console.error("Could not save the guest username.", error);
      throw new HttpsError("internal", "Could not create a guest username.");
    }
  }

  throw new HttpsError("resource-exhausted", "Could not generate an available guest username.");
});

exports.claimUsername = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before choosing a username.");
  }
  const username = normalizeUsername(request.data.username);
  const user = await auth.getUser(request.auth.uid);
  if (!user.email) {
    throw new HttpsError("failed-precondition", "An email is required for this account.");
  }
  if (
    request.auth.token.email &&
    request.auth.token.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    throw new HttpsError("permission-denied", "The account email could not be verified.");
  }
  const { publicRef, privateRef } = usernameRefs(username);
  const guestRef = db.collection("guestAccounts").doc(user.uid);

  try {
    await db.runTransaction(async (transaction) => {
      const publicSnapshot = await transaction.get(publicRef);
      const privateSnapshot = await transaction.get(privateRef);
      const guestSnapshot = await transaction.get(guestRef);
      const guestUsername = guestSnapshot.exists ? guestSnapshot.data().username : null;
      const oldGuestRef = typeof guestUsername === "string" &&
        guestUsername.toLowerCase() !== username
        ? db.collection("usernames").doc(guestUsername.toLowerCase())
        : null;
      const oldGuestSnapshot = oldGuestRef ? await transaction.get(oldGuestRef) : null;
      if (
        (publicSnapshot.exists && publicSnapshot.data().uid !== user.uid) ||
        (privateSnapshot.exists && privateSnapshot.data().uid !== user.uid)
      ) {
        throw new HttpsError("already-exists", "That username is already taken.");
      }
      transaction.set(publicRef, { uid: user.uid });
      transaction.set(privateRef, { uid: user.uid, email: user.email });
      if (oldGuestSnapshot && oldGuestSnapshot.exists &&
          oldGuestSnapshot.data().uid === user.uid) {
        transaction.delete(oldGuestRef);
      }
      if (guestSnapshot.exists) transaction.delete(guestRef);
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Could not claim the username.", error);
    throw new HttpsError("internal", "Could not save this username.");
  }
  return { username };
});

exports.signInWithUsername = onCall({ maxInstances: 20 }, async (request) => {
  const username = normalizeUsername(request.data.username);
  const password = request.data.password;
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    throw new HttpsError("unauthenticated", "Username or password is incorrect.");
  }
  const { privateRef } = usernameRefs(username);
  const usernameSnapshot = await privateRef.get();
  let account = usernameSnapshot.exists ? usernameSnapshot.data() : null;
  if (!account) {
    const publicSnapshot = await db.collection("usernames").doc(username).get();
    if (publicSnapshot.exists) {
      try {
        const legacyUser = await auth.getUser(publicSnapshot.data().uid);
        if (legacyUser.email) account = { uid: legacyUser.uid, email: legacyUser.email };
      } catch (error) {
        console.error("Could not resolve a legacy username account.", error);
      }
    }
  }
  if (!account) {
    throw new HttpsError("unauthenticated", "Username or password is incorrect.");
  }

  let response;
  try {
    response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
        encodeURIComponent(webApiKey.value()),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password,
          returnSecureToken: true
        })
      }
    );
  } catch (error) {
    console.error("Firebase username sign-in request failed.", error);
    throw new HttpsError("unavailable", "Sign-in is temporarily unavailable.");
  }
  if (!response.ok) {
    throw new HttpsError("unauthenticated", "Username or password is incorrect.");
  }
  const credential = await response.json();
  if (credential.localId !== account.uid) {
    throw new HttpsError("unauthenticated", "Username or password is incorrect.");
  }
  return { customToken: await auth.createCustomToken(account.uid) };
});

exports.changeUsername = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before changing your username.");
  }
  const oldUsername = normalizeUsername(request.data.currentUsername);
  const newUsername = normalizeUsername(request.data.username);
  if (oldUsername === newUsername) return { username: newUsername };

  const { publicRef: oldPublicRef, privateRef: oldPrivateRef } = usernameRefs(oldUsername);
  const { publicRef: newPublicRef, privateRef: newPrivateRef } = usernameRefs(newUsername);
  const user = await auth.getUser(request.auth.uid);
  if (!user.email) {
    throw new HttpsError("failed-precondition", "This account does not have an email.");
  }
  if (
    request.auth.token.email &&
    request.auth.token.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    throw new HttpsError("permission-denied", "The account email could not be verified.");
  }

  try {
    await db.runTransaction(async (transaction) => {
      const [oldPublic, oldPrivate, newPublic, newPrivate] = await Promise.all([
        transaction.get(oldPublicRef),
        transaction.get(oldPrivateRef),
        transaction.get(newPublicRef),
        transaction.get(newPrivateRef)
      ]);
      if (
        !oldPublic.exists ||
        oldPublic.data().uid !== user.uid ||
        (oldPrivate.exists && oldPrivate.data().uid !== user.uid)
      ) {
        throw new HttpsError("failed-precondition", "The current username is not linked to this account.");
      }
      if (
        (newPublic.exists && newPublic.data().uid !== user.uid) ||
        (newPrivate.exists && newPrivate.data().uid !== user.uid)
      ) {
        throw new HttpsError("already-exists", "That username is already taken.");
      }
      transaction.set(newPublicRef, { uid: user.uid });
      transaction.set(newPrivateRef, { uid: user.uid, email: user.email });
      transaction.delete(oldPublicRef);
      if (oldPrivate.exists) transaction.delete(oldPrivateRef);
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Could not change the username mapping.", error);
    throw new HttpsError("internal", "Could not change the username.");
  }
  return { username: newUsername };
});
