import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  EmailAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  setPersistence,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getFirestore,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

var SIGN_IN_KEY = "signIn";
var usernamePattern = /^[A-Za-z0-9_]{3,20}$/;

function setSignedInFlag(isSignedIn) {
  try {
    if (isSignedIn) {
      localStorage.setItem(SIGN_IN_KEY, "true");
    } else {
      localStorage.removeItem(SIGN_IN_KEY);
    }
  } catch (error) {
    console.error("Unable to update the saved sign-in state.", error);
  }
}

function errorMessage(error) {
  if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
    return "Email or password is incorrect.";
  }
  if (error.code === "auth/email-already-in-use" || error.code === "auth/credential-already-in-use") {
    return "That email already has an account. Sign in instead.";
  }
  if (error.code === "username/taken") return "That username is already taken. Choose another.";
  if (error.code === "auth/weak-password") return "Choose a password with at least 6 characters.";
  if (error.code === "auth/password-does-not-meet-requirements") {
    return "Use a password with an uppercase letter, a number, and a special character.";
  }
  if (error.code === "auth/operation-not-allowed") {
    return "Account sign-in is unavailable right now. Please try again later.";
  }
  if (error.code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
  if (error.code === "permission-denied" || error.code === "firestore/permission-denied") {
    return "Could not save your username. Check the game's Firestore rules and try again.";
  }
  return "Could not access your account. Please try again.";
}

function usernameRef(db, username) {
  return doc(db, "usernames", username.toLowerCase());
}

async function saveUsername(db, user, username, previousUsername) {
  var normalizedUsername = username.toLowerCase();
  var newRef = usernameRef(db, normalizedUsername);
  var oldRef = previousUsername && previousUsername.toLowerCase() !== normalizedUsername
    ? usernameRef(db, previousUsername)
    : null;

  await runTransaction(db, async function (transaction) {
    var newSnapshot = await transaction.get(newRef);
    if (newSnapshot.exists() && newSnapshot.data().uid !== user.uid) {
      var takenError = new Error("That username is already taken.");
      takenError.code = "username/taken";
      throw takenError;
    }

    var oldSnapshot = oldRef ? await transaction.get(oldRef) : null;
    transaction.set(newRef, { uid: user.uid, guest: user.isAnonymous });
    if (oldSnapshot && oldSnapshot.exists() && oldSnapshot.data().uid === user.uid) {
      transaction.delete(oldRef);
    }
  });
}

function randomGuestUsername() {
  var bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return "Guest_" + Array.from(bytes, function (byte) {
    return byte.toString(16).padStart(2, "0");
  }).join("");
}

async function ensureGuestUsername(db, user) {
  for (var attempt = 0; attempt < 5; attempt += 1) {
    var username = attempt === 0 && user.displayName && usernamePattern.test(user.displayName)
      ? user.displayName
      : randomGuestUsername();
    try {
      await saveUsername(db, user, username, user.displayName);
      if (user.displayName !== username) {
        await updateProfile(user, { displayName: username });
      }
      return username;
    } catch (error) {
      if (error.code !== "username/taken") throw error;
    }
  }
  throw new Error("Could not generate an available guest username.");
}

function requestUser(auth, db, container, pendingGuest, initialMode) {
  return new Promise(function (resolve, reject) {
    var account = {
      auth: auth,
      db: db,
      pendingGuest: pendingGuest || null,
      user: null,
      mode: initialMode === "signin" || initialMode === "create" ? initialMode : "choose",
      staySignedIn: false,
      busy: false
    };

    function render(message, username, email) {
      if (account.mode === "choose") {
        container.innerHTML =
          '<div class="rc"><h1>Choose how to play</h1>' +
          '<p class="rc-sub">Your progress is saved to your account.</p>' +
          '<button class="btn" type="button" data-account-guest' +
          (account.busy ? " disabled" : "") + '>' +
          (account.busy ? "Creating guest..." : "Continue as guest") + '</button>' +
          '<button class="btn ghost" type="button" data-account-mode="create"' +
          (account.busy ? " disabled" : "") + '>Sign up</button>' +
          '<button class="btn ghost" type="button" data-account-mode="signin"' +
          (account.busy ? " disabled" : "") + '>Sign in</button>' +
          '<p class="account-error" role="alert">' + (message || "") + "</p></div>";
        return;
      }

      var creating = account.mode === "create";
      if (username === undefined) {
        var existingUsernameInput = container.querySelector("#account-username");
        username = existingUsernameInput ? existingUsernameInput.value : "";
      }
      if (email === undefined) {
        var existingEmailInput = container.querySelector("#account-email");
        email = existingEmailInput ? existingEmailInput.value : "";
      }
      var escapedUsername = String(username || "").replace(/[&<>"]/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
      });
      var escapedEmail = String(email || "").replace(/[&<>"]/g, function (character) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
      });
      container.innerHTML =
        '<div class="rc"><h1>' + (creating ? "Sign up" : "Sign in") + "</h1>" +
        '<p class="rc-sub">' + (creating
          ? "Create an account with an email, username, and password."
          : "Sign in with your email address and password.") + "</p>" +
        '<form id="account-form" novalidate>' +
        '<label class="account-label" for="account-username">' + (creating ? "Username" : "Email address") + '</label>' +
        '<input class="account-input" id="account-username" name="identifier" type="' + (creating ? "text" : "email") + '" minlength="' + (creating ? "3" : "1") + '" maxlength="' + (creating ? "20" : "254") + '" value="' + (creating ? escapedUsername : escapedEmail) + '" autocomplete="' + (creating ? "username" : "email") + '" autocapitalize="none" spellcheck="false" required>' +
        (creating
          ? '<label class="account-label" for="account-email">Email address</label>' +
            '<input class="account-input" id="account-email" name="email" type="email" maxlength="254" value="' + escapedEmail + '" autocomplete="email" required>'
          : "") +
        '<label class="account-label" for="account-password">Password</label>' +
        '<input class="account-input" id="account-password" name="password" type="password" minlength="6" autocomplete="' + (creating ? "new-password" : "current-password") + '" required>' +
        '<p class="account-error" id="account-error" role="alert">' + (message || "") + "</p>" +
        '<button class="btn" type="submit"' + (account.busy ? " disabled" : "") + ">" +
        (account.busy ? "Please wait…" : creating ? "Create account" : "Sign in") + "</button></form>" +
        '<label class="account-remember"><input id="stay-signed-in" type="checkbox"' + (account.staySignedIn ? " checked" : "") + '> Stay signed in on this device</label>' +
        '<button class="btn ghost" type="button" data-account-mode="choose"' +
        (account.busy ? " disabled" : "") + '>Back</button>' +
        (creating
          ? '<p class="account-note">Usernames use 3–20 letters, numbers, or underscores.</p>'
          : "") +
        "</div>";
      var usernameInput = container.querySelector("#account-username");
      if (usernameInput) usernameInput.focus();
    }

    async function submit(event) {
      if (!event.target || event.target.id !== "account-form") return;
      event.preventDefault();
      var identifier = event.target.elements.identifier.value.trim();
      var username = identifier;
      var email = (account.mode === "create" ? event.target.elements.email.value : identifier)
        .trim()
        .toLowerCase();
      var password = event.target.elements.password.value;
      var staySignedIn = !!container.querySelector("#stay-signed-in").checked;
      var creating = account.mode === "create";
      if (creating && !usernamePattern.test(username)) {
        render("Use 3–20 letters, numbers, or underscores for your username.", username);
        return;
      }
      if (!creating && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        render("Enter a valid email address.", "", email);
        return;
      }
      if (creating && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        render("Enter a valid email address.", username, email);
        return;
      }
      if (password.length < 6) {
        render("Choose a password with at least 6 characters.", identifier, email);
        return;
      }
      if (account.busy) return;

      account.busy = true;
      account.staySignedIn = staySignedIn;
      render("", identifier, email);
      var action = account.mode;
      try {
        await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);
        var user;
        if (action === "signin") {
          var credential = await signInWithEmailAndPassword(auth, email, password);
          user = credential.user;
        } else {
          var previousUsername = account.pendingGuest && account.pendingGuest.displayName;
          var created = account.pendingGuest
            ? await linkWithCredential(account.pendingGuest, EmailAuthProvider.credential(email, password))
            : auth.currentUser && auth.currentUser.email === email
              ? { user: auth.currentUser }
              : await createUserWithEmailAndPassword(auth, email, password);
          account.pendingGuest = null;
          user = created.user;
          await saveUsername(db, user, username, previousUsername);
          await updateProfile(user, { displayName: username });
        }
        setSignedInFlag(staySignedIn);
        account.cleanup();
        container.hidden = true;
        container.innerHTML = "";
        resolve(user);
      } catch (error) {
        account.busy = false;
        console.error("Username account sign-in failed.", error);
        render(errorMessage(error), identifier, email);
      }
    }

    function changeMode(event) {
      var button = event.target.closest("[data-account-mode]");
      if (!button || account.busy) return;
      account.mode = button.dataset.accountMode;
      account.busy = false;
      render("");
    }

    function rememberPersistenceChoice(event) {
      if (event.target && event.target.id === "stay-signed-in") {
        account.staySignedIn = event.target.checked;
      }
    }

    async function continueAsGuest(event) {
      var button = event.target.closest("[data-account-guest]");
      if (!button) return;
      if (account.busy) return;
      account.busy = true;
      render("");
      try {
        await setPersistence(auth, browserLocalPersistence);
        var credential = auth.currentUser && auth.currentUser.isAnonymous
          ? { user: auth.currentUser }
          : await signInAnonymously(auth);
        await ensureGuestUsername(db, credential.user);
        setSignedInFlag(false);
        account.cleanup();
        container.hidden = true;
        container.innerHTML = "";
        resolve(credential.user);
      } catch (error) {
        account.busy = false;
        console.error("Unable to continue as a guest.", error);
        render(errorMessage(error));
      }
    }

    container.hidden = false;
    render("");
    container.addEventListener("submit", submit);
    container.addEventListener("click", changeMode);
    container.addEventListener("click", continueAsGuest);
    container.addEventListener("change", rememberPersistenceChoice);
    account.cleanup = function () {
      container.removeEventListener("submit", submit);
      container.removeEventListener("click", changeMode);
      container.removeEventListener("click", continueAsGuest);
      container.removeEventListener("change", rememberPersistenceChoice);
    };
  });
}

export async function connectCremaAccount(config, container, returnTo, initialMode) {
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
  var staySignedIn = false;
  try {
    staySignedIn = localStorage.getItem(SIGN_IN_KEY) === "true";
  } catch (error) {
    console.error("Unable to read the saved sign-in preference.", error);
  }
  if (user && !user.isAnonymous) {
    await setPersistence(auth, staySignedIn ? browserLocalPersistence : browserSessionPersistence);
    if (!staySignedIn) setSignedInFlag(false);
  }
  if (!user) {
    setSignedInFlag(false);
    user = await requestUser(auth, db, container, null, initialMode);
  } else if (user.isAnonymous) {
    await ensureGuestUsername(db, user);
  } else if (user.displayName && usernamePattern.test(user.displayName)) {
    await saveUsername(db, user, user.displayName, user.displayName);
  } else {
    user = await requestUser(auth, db, container, null, "create");
  }
  var isGuest = !!user.isAnonymous;
  var username = user.displayName || "";
  return {
    app: app,
    auth: auth,
    db: db,
    user: user,
    username: username,
    isGuest: isGuest,
    canChangeUsername: !isGuest && !!username && !!user.email,
    changeUsername: function (target) {
      var account = this;
      var currentUser = user;
      var currentUsername = account.username;
      if (!account.canChangeUsername || !currentUsername) {
        return Promise.reject(new Error("This account cannot change its username."));
      }
      return new Promise(function (resolve) {
        function cleanup() {
          target.removeEventListener("submit", submitRename);
          target.removeEventListener("click", handleRenameClick);
        }

        function render(message, nextUsername) {
          var escapedUsername = String(nextUsername === undefined ? currentUsername : nextUsername)
            .replace(/[&<>"]/g, function (character) {
              return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
            });
          target.innerHTML =
            '<div class="rc"><h1>Change username</h1>' +
            '<p class="rc-sub">Your progress remains attached to this account.</p>' +
            '<form data-rename-form novalidate>' +
            '<label class="account-label" for="rename-username">New username</label>' +
            '<input class="account-input" id="rename-username" name="username" type="text" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" value="' + escapedUsername + '" autocomplete="username" autocapitalize="none" spellcheck="false" required>' +
            '<label class="account-label" for="rename-password">Current password</label>' +
            '<input class="account-input" id="rename-password" name="password" type="password" autocomplete="current-password" required>' +
            '<p class="account-error" role="alert">' + (message || "") + '</p>' +
            '<button class="btn" type="submit">Save username</button>' +
            '</form><button class="btn ghost" type="button" data-rename-cancel>Cancel</button></div>';
          target.hidden = false;
          target.querySelector("#rename-username").focus();
        }

        async function submitRename(event) {
          if (!event.target || !event.target.matches("[data-rename-form]")) return;
          event.preventDefault();
          var nextUsername = event.target.elements.username.value.trim();
          var password = event.target.elements.password.value;
          if (!/^[A-Za-z0-9_]{3,20}$/.test(nextUsername)) {
            render("Use 3–20 letters, numbers, or underscores.", nextUsername);
            return;
          }
          if (!password) {
            render("Enter your current password to confirm this change.", nextUsername);
            return;
          }
          var normalizedUsername = nextUsername.toLowerCase();
          var oldUsername = currentUsername.toLowerCase();
          if (normalizedUsername === oldUsername) {
            cleanup();
            resolve(true);
            return;
          }
          try {
            await reauthenticateWithCredential(
              currentUser,
              EmailAuthProvider.credential(currentUser.email, password)
            );
            await saveUsername(db, currentUser, nextUsername, currentUsername);
            try {
              await updateProfile(currentUser, { displayName: nextUsername });
            } catch (error) {
              console.warn("Username changed, but the display name could not be updated.", error);
            }
            user = currentUser;
            account.user = currentUser;
            account.username = nextUsername;
            account.canChangeUsername = true;
            cleanup();
            resolve(true);
          } catch (error) {
            console.error("Unable to change the account username.", error);
            var message = error.code === "username/taken"
              ? "That username is already taken. Choose another."
              : error.code === "auth/wrong-password" || error.code === "auth/invalid-credential"
                ? "The current password is incorrect."
                : error.code === "auth/requires-recent-login"
                  ? "Sign in again before changing your username."
                    : "Could not change the username. Check your connection and try again.";
            render(message, nextUsername);
          }
        }

        function handleRenameClick(event) {
          if (!event.target.closest("[data-rename-cancel]")) return;
          cleanup();
          resolve(false);
        }

        render("");
        target.addEventListener("submit", submitRename);
        target.addEventListener("click", handleRenameClick);
      });
    },
    signOut: function () {
      setSignedInFlag(false);
      return signOut(auth);
    },
    switchAccount: async function () {
      setSignedInFlag(false);
      var pendingGuest = user.isAnonymous ? user : null;
      if (!pendingGuest) await signOut(auth);
      user = await requestUser(auth, db, container, pendingGuest);
      this.user = user;
      this.isGuest = !!user.isAnonymous;
      this.username = user.displayName || "";
      this.canChangeUsername = !this.isGuest && !!this.username && !!user.email;
      return user;
    }
  };
}
