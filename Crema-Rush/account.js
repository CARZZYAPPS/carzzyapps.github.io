import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

var GUEST_USERNAME_KEY = "carzzy-crema-guest-username";

function usernameEmail(username) {
  return username.toLowerCase() + "@players.carzzyapps.com";
}

function guestUser(username) {
  var normalized = username.toLowerCase();
  return {
    uid: "guest-" + normalized,
    displayName: username,
    username: username,
    isAnonymous: false,
    isGuest: true
  };
}

function readGuestUsername() {
  try {
    var username = localStorage.getItem(GUEST_USERNAME_KEY);
    return username && /^[A-Za-z0-9_]{3,20}$/.test(username) ? username : null;
  } catch (error) {
    console.error("Unable to read the saved guest username.", error);
    return null;
  }
}

function saveGuestUsername(username) {
  try {
    localStorage.setItem(GUEST_USERNAME_KEY, username);
  } catch (error) {
    console.error("Unable to remember the guest username on this device.", error);
  }
}

function errorMessage(error) {
  if (error.code === "username/taken") return "That username is already taken. Choose another.";
  if (error.code === "username/not-linked") return "That username is not linked to this account.";
  if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
    return "Username or password is incorrect.";
  }
  if (error.code === "auth/email-already-in-use" || error.code === "auth/credential-already-in-use") {
    return "That username already has an account. Sign in instead.";
  }
  if (error.code === "auth/weak-password") return "Choose a password with at least 6 characters.";
  if (error.code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
  if (error.code === "permission-denied") return "Could not save that username. Try another or sign in.";
  return "Could not access your account. Please try again.";
}

function reserveUsername(db, username, uid) {
  var usernameRef = doc(db, "usernames", username.toLowerCase());
  return runTransaction(db, async function (transaction) {
    var snapshot = await transaction.get(usernameRef);
    if (snapshot.exists() && snapshot.data().uid !== uid) {
      var taken = new Error("Username is already taken.");
      taken.code = "username/taken";
      throw taken;
    }
    transaction.set(usernameRef, { uid: uid });
  });
}

function requestUser(auth, db, container, pendingUser, returnTo) {
  return new Promise(function (resolve, reject) {
    var account = {
      auth: auth,
      db: db,
      user: pendingUser,
      mode: pendingUser ? "create" : "signin",
      busy: false
    };

    function render(message, username) {
      var creating = account.mode === "create";
      var escapedUsername = String(username || "").replace(/[&<>"]/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
      });
      container.innerHTML =
        '<div class="rc"><h1>' + (creating ? "Choose a username" : "Welcome back") + "</h1>" +
        '<p class="rc-sub">Your username keeps your café progress saved to your account on any device.</p>' +
        '<form id="account-form" novalidate>' +
        '<label class="account-label" for="account-username">Username</label>' +
        '<input class="account-input" id="account-username" name="username" type="text" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" value="' + escapedUsername + '" autocomplete="username" autocapitalize="none" spellcheck="false" required>' +
        '<label class="account-label" for="account-password">Password</label>' +
        '<input class="account-input" id="account-password" name="password" type="password" minlength="6" autocomplete="' + (creating ? "new-password" : "current-password") + '" required>' +
        '<p class="account-error" id="account-error" role="alert">' + (message || "") + "</p>" +
        '<button class="btn" type="submit"' + (account.busy ? " disabled" : "") + ">" +
        (account.busy ? "Please wait…" : creating ? "Create username" : "Sign in") + "</button></form>" +
        (account.user
          ? '<p class="account-note">Creating a username upgrades your current save account.</p>'
          : '<button class="btn ghost" type="button" data-account-mode="' + (creating ? "signin" : "create") + '">' +
            (creating ? "Already have a username? Sign in" : "New here? Create a username") + "</button>" +
            '<p class="account-note">Usernames use 3–20 letters, numbers, or underscores. Password recovery is not available yet, so keep your password safe.</p>' +
            '<p class="account-note">Have an existing Carzzy email account? <a href="/auth/sign-in/?returnTo=' +
            encodeURIComponent(returnTo) + '">Sign in here</a>, then return to the game.</p>') +
        '<button class="btn ghost" type="button" data-account-guest' + (account.busy ? " disabled" : "") + '>Continue as guest</button>' +
        '<p class="account-note">Guest progress is saved only on this device and is not synced to Firestore.</p>' +
        "</div>";
      var usernameInput = container.querySelector("#account-username");
      if (usernameInput) usernameInput.focus();
    }

    async function submit(event) {
      if (!event.target || event.target.id !== "account-form") return;
      event.preventDefault();
      var username = event.target.elements.username.value.trim();
      var password = event.target.elements.password.value;
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        render("Use 3–20 letters, numbers, or underscores for your username.", username);
        return;
      }
      if (password.length < 6) {
        render("Choose a password with at least 6 characters.", username);
        return;
      }
      if (account.busy) return;

      account.busy = true;
      render("", username);
      var email = usernameEmail(username);
      var action = account.mode;
      var pending = account.user && account.user.isAnonymous ? account.user : null;
      try {
        var user;
        if (action === "signin") {
          var credential = await signInWithEmailAndPassword(auth, email, password);
          user = credential.user;
          var usernameSnapshot = await getDoc(doc(db, "usernames", username.toLowerCase()));
          if (!usernameSnapshot.exists() || usernameSnapshot.data().uid !== user.uid) {
            var mismatch = new Error("Username is not linked to this account.");
            mismatch.code = "username/not-linked";
            throw mismatch;
          }
        } else if (pending) {
          var linked = await linkWithCredential(pending, EmailAuthProvider.credential(email, password));
          user = linked.user;
        } else if (account.user) {
          user = account.user;
        } else {
          var created = await createUserWithEmailAndPassword(auth, email, password);
          user = created.user;
        }

        if (action === "create") {
          account.user = user;
          await reserveUsername(db, username, user.uid);
          try {
            await updateProfile(user, { displayName: username });
          } catch (error) {
            console.warn("Could not set the account display name.", error);
          }
        }
        account.cleanup();
        container.hidden = true;
        container.innerHTML = "";
        resolve(user);
      } catch (error) {
        account.busy = false;
        console.error("Username account sign-in failed.", error);
        render(errorMessage(error), username);
      }
    }

    function changeMode(event) {
      var button = event.target.closest("[data-account-mode]");
      if (!button) return;
      account.mode = button.dataset.accountMode;
      render("");
    }

    async function continueAsGuest(event) {
      var button = event.target.closest("[data-account-guest]");
      if (!button) return;
      var usernameInput = container.querySelector("#account-username");
      var username = usernameInput ? usernameInput.value.trim() : "";
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        render("Enter 3–20 letters, numbers, or underscores to continue as a guest.", username);
        return;
      }
      if (account.busy) return;
      account.busy = true;
      render("", username);
      try {
        if (account.user && account.user.isAnonymous) await signOut(auth);
        saveGuestUsername(username);
        var guest = guestUser(username);
        account.cleanup();
        container.hidden = true;
        container.innerHTML = "";
        resolve(guest);
      } catch (error) {
        account.busy = false;
        console.error("Unable to continue as a guest.", error);
        render("Could not continue as a guest. Please try again.", username);
      }
    }

    container.hidden = false;
    render("");
    container.addEventListener("submit", submit);
    container.addEventListener("click", changeMode);
    container.addEventListener("click", continueAsGuest);
    account.cleanup = function () {
      container.removeEventListener("submit", submit);
      container.removeEventListener("click", changeMode);
      container.removeEventListener("click", continueAsGuest);
    };
  });
}

export async function connectCremaAccount(config, container, returnTo) {
  if (!config || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Firebase web configuration is missing or incomplete.");
  }
  var app = initializeApp(config);
  var auth = getAuth(app);
  var db = getFirestore(app);
  var user = await new Promise(function (resolve, reject) {
    var unsubscribe = onAuthStateChanged(auth, function (currentUser) {
      unsubscribe();
      resolve(currentUser);
    }, function (error) {
      unsubscribe();
      reject(error);
    });
  });
  if (!user || user.isAnonymous) {
    var savedGuestUsername = user ? null : readGuestUsername();
    if (savedGuestUsername) {
      user = guestUser(savedGuestUsername);
    } else {
      user = await requestUser(auth, db, container, user, returnTo);
    }
  }
  return {
    app: app,
    auth: auth,
    db: db,
    user: user,
    isGuest: !!user.isGuest,
    signOut: function () { return signOut(auth); },
    switchAccount: async function () {
      try {
        localStorage.removeItem(GUEST_USERNAME_KEY);
      } catch (error) {
        console.error("Unable to clear the saved guest username.", error);
      }
      await signOut(auth);
      user = await requestUser(auth, db, container, null, returnTo);
      this.user = user;
      this.isGuest = !!user.isGuest;
      return user;
    }
  };
}
