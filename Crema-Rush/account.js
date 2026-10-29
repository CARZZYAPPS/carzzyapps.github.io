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
  signInWithCustomToken,
  reauthenticateWithCredential,
  setPersistence,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";

var SIGN_IN_KEY = "signIn";
var PLAYER_EMAIL_DOMAIN = "@players.carzzyapps.com";

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
  if (error.code === "username/taken") return "That username is already taken. Choose another.";
  if (error.code === "username/not-linked") return "That username is not linked to this account.";
  if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
    return "Username or password is incorrect.";
  }
  if (error.code === "auth/email-already-in-use" || error.code === "auth/credential-already-in-use") {
    return "That email already has an account. Sign in instead.";
  }
  if (error.code === "functions/already-exists") return "That username is already taken. Choose another.";
  if (error.code === "functions/unauthenticated" || error.code === "functions/invalid-argument") {
    return "Username or password is incorrect.";
  }
  if (error.code === "functions/unavailable" || error.code === "functions/deadline-exceeded") {
    return "Username sign-in is temporarily unavailable. Please try again.";
  }
  if (error.code === "functions/not-found") {
    return "Firebase account services are not set up yet. Please try again later.";
  }
  if (error.code === "functions/failed-precondition" || error.code === "functions/permission-denied") {
    return error.message || "Could not save that username. Try again.";
  }
  if (error.code === "auth/weak-password") return "Choose a password with at least 6 characters.";
  if (error.code === "auth/password-does-not-meet-requirements") {
    return "Use a password that meets Firebase's requirements, including uppercase, number, and special characters.";
  }
  if (error.code === "auth/operation-not-allowed") {
    return "Enable this sign-in method in Firebase Authentication before trying again.";
  }
  if (error.code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
  if (error.code === "permission-denied") return "Could not save that username. Try another or sign in.";
  return "Could not access your account. Please try again.";
}

function requestUser(auth, db, functions, container, pendingGuest) {
  return new Promise(function (resolve, reject) {
    var account = {
      auth: auth,
      db: db,
      claimUsername: httpsCallable(functions, "claimUsername"),
      signInWithUsername: httpsCallable(functions, "signInWithUsername"),
      createGuestUsername: httpsCallable(functions, "createGuestUsername"),
      pendingGuest: pendingGuest || null,
      user: null,
      mode: "choose",
      staySignedIn: false,
      busy: false
    };

    function render(message, username, email) {
      if (account.mode === "choose") {
        container.innerHTML =
          '<div class="rc"><h1>Choose how to play</h1>' +
          '<p class="rc-sub">Your progress is saved to your Firebase account.</p>' +
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
          : "Sign in with your username or email and password.") + "</p>" +
        '<form id="account-form" novalidate>' +
        '<label class="account-label" for="account-username">' + (creating ? "Username" : "Username or email") + '</label>' +
        '<input class="account-input" id="account-username" name="identifier" type="text" minlength="' + (creating ? "3" : "1") + '" maxlength="' + (creating ? "20" : "254") + '" value="' + escapedUsername + '" autocomplete="username" autocapitalize="none" spellcheck="false" required>' +
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
      var email = account.mode === "create" ? event.target.elements.email.value.trim() : "";
      var password = event.target.elements.password.value;
      var staySignedIn = !!container.querySelector("#stay-signed-in").checked;
      var creating = account.mode === "create";
      if (creating && !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        render("Use 3–20 letters, numbers, or underscores for your username.", username);
        return;
      }
      if (creating && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        render("Enter a valid email address.", username, email);
        return;
      }
      if (!creating && !/^[A-Za-z0-9_]{3,20}$/.test(identifier) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        render("Enter a valid username or email address.", identifier);
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
          if (identifier.indexOf("@") >= 0) {
            var emailCredential = await signInWithEmailAndPassword(auth, identifier, password);
            user = emailCredential.user;
          } else {
            try {
              var tokenResult = await account.signInWithUsername({
                username: identifier,
                password: password
              });
              var usernameCredential = await signInWithCustomToken(auth, tokenResult.data.customToken);
              user = usernameCredential.user;
            } catch (usernameError) {
              if (usernameError.code !== "functions/unauthenticated" &&
                  usernameError.code !== "functions/not-found") {
                throw usernameError;
              }
              var legacyCredential = await signInWithEmailAndPassword(
                auth,
                identifier.toLowerCase() + "@players.carzzyapps.com",
                password
              );
              user = legacyCredential.user;
              var usernameSnapshot = await getDoc(doc(db, "usernames", identifier.toLowerCase()));
              if (!usernameSnapshot.exists() || usernameSnapshot.data().uid !== user.uid) {
                throw usernameError;
              }
            }
          }
        } else {
          var created = account.pendingGuest
            ? await linkWithCredential(account.pendingGuest, EmailAuthProvider.credential(email, password))
            : auth.currentUser && auth.currentUser.email === email
              ? { user: auth.currentUser }
              : await createUserWithEmailAndPassword(auth, email, password);
          account.pendingGuest = null;
          user = created.user;
          await account.claimUsername({ username: username });
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
        var result = await account.createGuestUsername({});
        var username = result.data.username;
        await updateProfile(credential.user, { displayName: username });
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

export async function connectCremaAccount(config, container, returnTo) {
  if (!config || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Firebase web configuration is missing or incomplete.");
  }
  var app = initializeApp(config);
  var auth = getAuth(app);
  var db = getFirestore(app);
  var functions = getFunctions(app, "us-central1");
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
    user = await requestUser(auth, db, functions, container);
  } else if (user.isAnonymous) {
    var guestUsername = user.displayName;
    if (!guestUsername || !/^[A-Za-z0-9_]{3,20}$/.test(guestUsername)) {
      var guestResult = await httpsCallable(functions, "createGuestUsername")({});
      guestUsername = guestResult.data.username;
      await updateProfile(user, { displayName: guestUsername });
    }
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
    canChangeUsername: !isGuest && !!username && !!user.email &&
      !user.email.toLowerCase().endsWith(PLAYER_EMAIL_DOMAIN),
    changeUsernameRequest: httpsCallable(functions, "changeUsername"),
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
            await account.changeUsernameRequest({
              currentUsername: currentUsername,
              username: nextUsername
            });
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
            var message = error.code === "functions/already-exists" || error.code === "username/taken"
              ? "That username is already taken. Choose another."
              : error.code === "functions/failed-precondition" || error.code === "functions/permission-denied"
                ? error.message
              : error.code === "auth/wrong-password" || error.code === "auth/invalid-credential"
                ? "The current password is incorrect."
                : error.code === "auth/requires-recent-login"
                  ? "Sign in again before changing your username."
                  : error.message === "The current username is not linked to this account."
                    ? error.message
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
      user = await requestUser(auth, db, functions, container, pendingGuest);
      this.user = user;
      this.isGuest = !!user.isAnonymous;
      this.username = user.displayName || "";
      this.canChangeUsername = !this.isGuest && !!this.username && !!user.email &&
        !user.email.toLowerCase().endsWith(PLAYER_EMAIL_DOMAIN);
      this.changeUsernameRequest = httpsCallable(functions, "changeUsername");
      return user;
    }
  };
}
