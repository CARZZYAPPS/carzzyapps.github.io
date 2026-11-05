// Lazer Arcade shared SDK: accounts, saves, Lazer Points, leaderboards, play counts and feedback.
// Uses the same Firebase project and auth session as the rest of carzzyapps.com.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithCustomToken,
  createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence,
  browserSessionPersistence, signOut, sendPasswordResetEmail, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, runTransaction, increment, serverTimestamp, collection,
  addDoc, query, orderBy, limit, getDocs, getCountFromServer, where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";

const CONFIG = {
  apiKey: "AIzaSyAgu1uiobgixRWcvIja6bI1l6M2KQ36FL4",
  authDomain: "carzzy-apps.firebaseapp.com",
  projectId: "carzzy-apps",
  storageBucket: "carzzy-apps.firebasestorage.app",
  messagingSenderId: "716862658931",
  appId: "1:716862658931:web:6295033aaa1d8155dc0d06"
};
const BASE = "/arcade/";
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const SESSION_LP_CAP = 20000;

const app = getApps().length ? getApp() : initializeApp(CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const fns = getFunctions(app, "us-central1");

/* ---------------- small helpers ---------------- */
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Math.round(n || 0).toLocaleString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- catalog ---------------- */
let catalogP = null;
function catalog() {
  if (!catalogP) {
    catalogP = Promise.all([
      fetch(BASE + "games.json", { cache: "no-cache" }).then((r) => r.json()),
      fetch(BASE + "upcoming.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => ({ items: [] }))
    ]).then(([g, u]) => ({ games: g.games || [], categories: g.categories || [], ratioNote: g.ratioNote || "", upcoming: u.items || [] }));
  }
  return catalogP;
}
async function gameInfo(id) { const c = await catalog(); return c.games.find((g) => g.id === id) || { id, name: id, ratio: 0.04 }; }
async function toLP(id, raw) { const g = await gameInfo(id); return Math.max(0, Math.round((raw || 0) * (g.ratio || 0))); }

/* ---------------- auth state ---------------- */
const state = { user: null, username: "", ready: false, listeners: new Set() };
let resolveReady;
const readyP = new Promise((r) => (resolveReady = r));

async function lookupUsername(user) {
  if (user.displayName && USERNAME_RE.test(user.displayName)) return user.displayName;
  try {
    const snap = await getDocs(query(collection(db, "usernames"), where("uid", "==", user.uid), limit(1)));
    if (!snap.empty) { const d = snap.docs[0]; return d.data().username || d.id; }
  } catch (e) {}
  return "";
}

onAuthStateChanged(auth, async (u) => {
  if (u && !u.isAnonymous) {
    state.user = u;
    state.username = await lookupUsername(u);
  } else {
    state.user = null;
    state.username = "";
  }
  if (!state.ready) { state.ready = true; resolveReady(); }
  state.listeners.forEach((fn) => { try { fn(state.user, state.username); } catch (e) { console.error(e); } });
});
setTimeout(() => { if (!state.ready) { state.ready = true; resolveReady(); } }, 6000);

function onChange(fn) { state.listeners.add(fn); if (state.ready) fn(state.user, state.username); return () => state.listeners.delete(fn); }
function signedIn() { return !!(state.user && state.username); }

/* ---------------- play counts ---------------- */
const counted = new Set();
async function countPlay(id) {
  if (counted.has(id)) return; counted.add(id);
  try { await setDoc(doc(db, "arcadeStats", id), { plays: increment(1) }, { merge: true }); } catch (e) { console.warn("play count", e.code || e); }
}
async function plays(ids) {
  const out = {};
  await Promise.all(ids.map(async (id) => {
    try { const s = await getDoc(doc(db, "arcadeStats", id)); out[id] = s.exists() ? s.data().plays || 0 : 0; } catch (e) { out[id] = 0; }
  }));
  return out;
}

/* ---------------- saves ----------------
   Each game keeps its own browser save under opts.localKey. lz.owner.<id> records whose save that is
   ("guest" or a uid) so accounts never leak into each other on a shared browser. */
const games = {};
function ownerKey(id) { return "lz.owner." + id; }
function pendingAll() { return ls.get("lz.pending", {}); }
function setPending(p) { ls.set("lz.pending", p); }

async function cloudSave(id) {
  if (!signedIn()) return null;
  try { const s = await getDoc(doc(db, "arcadeSaves", state.user.uid, "games", id)); return s.exists() ? s.data() : null; } catch (e) { console.warn("cloud load", e.code || e); return null; }
}
async function writeCloud(id) {
  const g = games[id]; if (!g || !signedIn()) return false;
  const data = ls.raw(g.localKey); if (!data) return false;
  try {
    await setDoc(doc(db, "arcadeSaves", state.user.uid, "games", id), {
      data, major: g.major, minor: g.minor || 0, progress: Number(g.progressOf(data)) || 0, updatedAt: serverTimestamp()
    });
    g.dirty = false; return true;
  } catch (e) { console.warn("cloud save", e.code || e); return false; }
}

// Decide which save the game should load, syncing a guest save up to the account when it is the better one.
async function reconcile(id) {
  const g = games[id];
  const owner = ls.raw(ownerKey(id));
  const local = ls.raw(g.localKey);
  if (!signedIn()) {
    if (owner && owner !== "guest") { if (local) ls.set("lz.bak." + id, local); ls.del(g.localKey); }
    ls.set(ownerKey(id), "guest");
    return { changed: false };
  }
  const uid = state.user.uid;
  const cloud = await cloudSave(id);
  const cloudOk = cloud && cloud.major === g.major && typeof cloud.data === "string";
  let changed = false;
  if (owner === uid) {
    if (cloudOk && (!local || (cloud.progress || 0) > (Number(g.progressOf(local)) || 0))) { ls.set(g.localKey, cloud.data); changed = local !== cloud.data; }
    else if (local) g.dirty = true;
  } else if (owner && owner !== "guest") {
    if (local) ls.set("lz.bak." + id, local);
    if (cloudOk) ls.set(g.localKey, cloud.data); else ls.del(g.localKey);
    changed = true;
  } else {
    // guest (or never tagged) save on this browser: it syncs to the account if it is further along
    const lp = local ? Number(g.progressOf(local)) || 0 : -1;
    if (cloudOk && (cloud.progress || 0) >= lp) { if (local !== cloud.data) { ls.set(g.localKey, cloud.data); changed = true; } }
    else if (local) g.dirty = true;
  }
  ls.set(ownerKey(id), uid);
  if (g.dirty) await writeCloud(id);
  return { changed };
}

async function boot(id, opts) {
  games[id] = Object.assign({ localKey: id, major: 1, minor: 0, progressOf: () => 0, dirty: false, timer: null }, opts || {});
  await Promise.race([readyP, sleep(6000)]);
  countPlay(id);
  try { await reconcile(id); } catch (e) { console.warn("reconcile", e); }
  if (signedIn()) syncPending().catch(() => {});
  return { user: state.user, username: state.username };
}

function save(id) {
  const g = games[id]; if (!g) return;
  g.dirty = true;
  if (!signedIn() || g.timer) return;
  g.timer = setTimeout(() => { g.timer = null; if (g.dirty) writeCloud(id); }, 12000);
}
function flush() { Object.keys(games).forEach((id) => { if (games[id].dirty && signedIn()) writeCloud(id); }); }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });

/* ---------------- Lazer Points ---------------- */
async function addToAccount(entries) {
  // entries: { gameId: { lp, best, plays, last } }
  const uid = state.user.uid, ref = doc(db, "arcadePlayers", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() ? snap.data() : { lp: 0, games: {} };
    const gm = Object.assign({}, cur.games || {});
    let add = 0;
    Object.keys(entries).forEach((k) => {
      const e = entries[k], o = Object.assign({ lp: 0, best: 0, plays: 0, last: 0 }, gm[k] || {});
      const lp = Math.min(SESSION_LP_CAP, Math.max(0, Math.round(e.lp || 0)));
      add += lp;
      gm[k] = { lp: o.lp + lp, best: Math.max(o.best, Math.round(e.best || 0)), plays: o.plays + (e.plays || 0), last: Math.round(e.last || o.last || 0) };
    });
    tx.set(ref, { username: state.username, lp: Math.min((cur.lp || 0) + add, (cur.lp || 0) + SESSION_LP_CAP), games: gm, updatedAt: serverTimestamp() });
  });
}
async function syncPending() {
  const p = pendingAll(); if (!Object.keys(p).length || !signedIn()) return 0;
  let total = 0; Object.values(p).forEach((e) => (total += e.lp || 0));
  await addToAccount(p);
  setPending({});
  return total;
}

let askedThisPage = false;
async function endSession(id, raw, info) {
  const lp = await toLP(id, raw);
  const entry = { lp, best: raw, plays: 1, last: raw };
  if (signedIn()) {
    try { await addToAccount({ [id]: entry }); toast(`+${fmt(lp)} Lazer Points saved to the leaderboard`); }
    catch (e) { console.warn("leaderboard", e.code || e); stash(id, entry); toast("Couldn't reach the leaderboard. Points are kept and will retry."); }
    flush();
  } else {
    stash(id, entry);
    const pend = pendingAll()[id];
    if (!askedThisPage) { askedThisPage = true; promptSave(lp, pend ? pend.lp : lp); }
    else toast(`+${fmt(lp)} LP waiting. Sign in to save them.`);
  }
  return lp;
}
function stash(id, e) {
  const p = pendingAll(), o = p[id] || { lp: 0, best: 0, plays: 0, last: 0 };
  p[id] = { lp: o.lp + e.lp, best: Math.max(o.best, e.best), plays: o.plays + e.plays, last: e.last };
  setPending(p);
}
function pendingLP() { let t = 0; Object.values(pendingAll()).forEach((e) => (t += e.lp || 0)); return t; }

/* ---------------- leaderboards ---------------- */
async function top(field, n) {
  const snap = await getDocs(query(collection(db, "arcadePlayers"), orderBy(field, "desc"), limit(n || 50)));
  return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
}
async function me() {
  if (!signedIn()) return null;
  try { const s = await getDoc(doc(db, "arcadePlayers", state.user.uid)); return s.exists() ? s.data() : { lp: 0, games: {} }; } catch (e) { return null; }
}
async function rank(field, value) {
  if (!value) return null;
  try { const c = await getCountFromServer(query(collection(db, "arcadePlayers"), where(field, ">", value))); return c.data().count + 1; } catch (e) { return null; }
}
async function playerCount() {
  try { const c = await getCountFromServer(collection(db, "arcadePlayers")); return c.data().count; } catch (e) { return null; }
}

/* ---------------- feedback ---------------- */
async function sendTicket(t) {
  const d = { kind: t.kind, game: t.game, text: t.text, page: location.pathname.slice(0, 120), synced: false, createdAt: serverTimestamp() };
  if (t.contact) d.contact = t.contact.slice(0, 200);
  if (signedIn()) { d.uid = state.user.uid; d.username = state.username; }
  await addDoc(collection(db, "arcadeTickets"), d);
}

/* ---------------- account actions ---------------- */
async function doSignIn(identifier, password, stay) {
  await setPersistence(auth, stay ? browserLocalPersistence : browserSessionPersistence);
  if (identifier.includes("@")) await signInWithEmailAndPassword(auth, identifier, password);
  else {
    const res = await httpsCallable(fns, "signInWithUsername")({ username: identifier, password });
    await signInWithCustomToken(auth, res.data.customToken);
  }
  if (stay) ls.set("signIn", "true"); else ls.del("signIn");
}
async function doSignUp(username, email, password, stay) {
  await setPersistence(auth, stay ? browserLocalPersistence : browserSessionPersistence);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(cred.user, { displayName: username });
    await httpsCallable(fns, "claimUsername")({ username });
  } catch (e) {
    try { await cred.user.delete(); } catch (x) {}
    throw e;
  }
  try { await sendEmailVerification(cred.user); } catch (e) {}
  if (stay) ls.set("signIn", "true"); else ls.del("signIn");
}
function authError(e) {
  const c = (e && e.code) || "";
  if (/invalid-credential|wrong-password|user-not-found|not-found|unauthenticated|permission-denied/.test(c)) return "Wrong username/email or password.";
  if (/email-already-in-use/.test(c)) return "That email already has an account. Sign in instead.";
  if (/already-exists/.test(c)) return "That username is taken. Pick another.";
  if (/weak-password|password-does-not-meet/.test(c)) return "Use a stronger password (at least 6 characters).";
  if (/invalid-email/.test(c)) return "Enter a valid email address.";
  if (/network/.test(c)) return "Network error. Check your connection.";
  if (/too-many-requests/.test(c)) return "Too many tries. Wait a minute and try again.";
  return "Something went wrong. Please try again.";
}
// After signing in from inside a game: sync guest progress and points, reload the game if the account's save wins.
async function afterSignIn() {
  await readyP; for (let i = 0; i < 20 && !signedIn(); i++) await sleep(150);
  let reload = false;
  for (const id of Object.keys(games)) { try { const r = await reconcile(id); if (r.changed) reload = true; } catch (e) {} }
  let moved = 0; try { moved = await syncPending(); } catch (e) {}
  if (moved) toast(`${fmt(moved)} Lazer Points moved to your account`);
  if (reload) { toast("Loading your account's progress…"); setTimeout(() => location.reload(), 900); }
}
async function logout() { flush(); await sleep(300); ls.del("signIn"); await signOut(auth); }

/* ================= UI (shadow DOM so it never clashes with a game's styles) ================= */
const host = document.createElement("div");
host.id = "lz-ui";
host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000";
const root = host.attachShadow({ mode: "open" });
root.innerHTML = `<style>
:host{all:initial}
*{box-sizing:border-box}
.wrap{position:fixed;inset:0;display:grid;place-items:center;background:rgba(6,4,20,.72);backdrop-filter:blur(6px);pointer-events:auto;padding:16px;animation:f .18s ease-out}
@keyframes f{from{opacity:0}}
@keyframes up{from{transform:translateY(14px);opacity:0}}
.card{width:min(420px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#120c2e;color:#f1ecff;border-radius:22px;padding:24px 22px 20px;
  border:1px solid rgba(255,255,255,.12);box-shadow:0 0 0 1px rgba(255,61,212,.35),0 20px 60px rgba(0,0,0,.6),0 0 60px rgba(124,77,255,.25);
  font:500 15px/1.45 "Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;animation:up .22s ease-out;position:relative}
.card:before{content:"";position:absolute;left:22px;right:22px;top:0;height:3px;border-radius:3px;background:linear-gradient(90deg,#ff3dd4,#7c4dff,#22e4ff)}
h2{font:800 24px/1.15 "Unbounded","Manrope",system-ui,sans-serif;margin:4px 0 6px;letter-spacing:-.01em}
.sub{color:#b9b0dc;margin:0 0 16px;font-size:14px}
.big{font:800 40px/1 "Unbounded",system-ui,sans-serif;background:linear-gradient(90deg,#ff3dd4,#22e4ff);-webkit-background-clip:text;background-clip:text;color:transparent;margin:6px 0 4px}
label{display:block;font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#a99fd6;margin:12px 0 5px}
input,select,textarea{width:100%;background:#0a0720;color:#fff;border:1px solid #3a2f73;border-radius:12px;padding:11px 12px;font:600 15px "Manrope",system-ui,sans-serif;outline:none}
textarea{min-height:110px;resize:vertical}
input:focus,select:focus,textarea:focus{border-color:#ff3dd4;box-shadow:0 0 0 3px rgba(255,61,212,.25)}
.row{display:flex;gap:8px;align-items:center;margin-top:12px;font-size:14px;color:#cfc6f2}
.row input{width:auto}
.btn{display:block;width:100%;margin-top:12px;border:0;border-radius:14px;padding:13px 16px;font:800 15px "Manrope",system-ui,sans-serif;cursor:pointer;color:#fff;
  background:linear-gradient(90deg,#ff3dd4,#7c4dff);box-shadow:0 6px 20px rgba(255,61,212,.35)}
.btn:hover{filter:brightness(1.08)} .btn:disabled{opacity:.6;cursor:wait}
.btn.alt{background:#1d1545;box-shadow:none;border:1px solid #3a2f73}
.btn.txt{background:none;box-shadow:none;color:#a99fd6;padding:8px;font-weight:700}
.err{color:#ff7a9c;font-weight:700;font-size:14px;min-height:20px;margin-top:10px}
.ok{color:#5cf2c2}
.x{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;border:0;background:#1d1545;color:#cfc6f2;font-size:18px;cursor:pointer}
.toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#120c2e;color:#fff;border:1px solid #3a2f73;border-radius:999px;padding:10px 18px;
  font:700 14px "Manrope",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 0 1px rgba(34,228,255,.3);animation:up .25s ease-out;max-width:calc(100vw - 32px);text-align:center}
.seg{display:flex;gap:6px;background:#0a0720;border-radius:12px;padding:4px;margin:10px 0 2px}
.seg button{flex:1;border:0;border-radius:9px;padding:9px;background:none;color:#a99fd6;font:800 13px "Manrope",system-ui,sans-serif;cursor:pointer}
.seg button.on{background:#2a1f63;color:#fff}
.note{font-size:12.5px;color:#8f86b8;margin-top:10px}
</style><div id="m"></div><div id="t"></div>`;
const mEl = root.getElementById("m"), tEl = root.getElementById("t");
function mount() { if (!host.isConnected) document.body.appendChild(host); }
if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

let toastTimer = null;
function toast(text) {
  mount(); tEl.innerHTML = `<div class="toast">${esc(text)}</div>`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (tEl.innerHTML = ""), 3600);
}
let modalDone = null;
function closeModal(v) { mEl.innerHTML = ""; const d = modalDone; modalDone = null; if (d) d(v); }
function modal(html, bind) {
  mount();
  return new Promise((res) => {
    if (modalDone) closeModal();
    modalDone = res;
    mEl.innerHTML = `<div class="wrap"><div class="card" role="dialog" aria-modal="true"><button class="x" aria-label="Close" data-close>×</button>${html}</div></div>`;
    const card = mEl.querySelector(".card");
    mEl.querySelector("[data-close]").onclick = () => closeModal(null);
    mEl.querySelector(".wrap").onclick = (e) => { if (e.target.classList.contains("wrap")) closeModal(null); };
    card.addEventListener("keydown", (e) => e.stopPropagation());
    if (bind) bind(card, closeModal);
    const f = card.querySelector("input,textarea,select"); if (f) setTimeout(() => f.focus(), 30);
  });
}

function openAccount(mode, lead) {
  if (signedIn()) return accountMenu();
  mode = mode === "signup" ? "signup" : "signin";
  const stay = ls.raw("signIn") === "true" || !ls.raw("signIn");
  return modal(`
    <h2>${mode === "signup" ? "Create your account" : "Sign in"}</h2>
    <p class="sub">${esc(lead || "One Carzzy Apps account for every Lazer Arcade game. Progress saves to it and your points hit the leaderboard.")}</p>
    <div class="seg"><button data-mode="signin" class="${mode === "signin" ? "on" : ""}">Sign in</button><button data-mode="signup" class="${mode === "signup" ? "on" : ""}">Create account</button></div>
    <form novalidate>
      ${mode === "signup" ? `<label for="u">Username</label><input id="u" autocomplete="username" maxlength="20" autocapitalize="none" spellcheck="false" placeholder="3–20 letters, numbers or _">
      <label for="e">Email</label><input id="e" type="email" autocomplete="email" maxlength="254">`
      : `<label for="e">Email or username</label><input id="e" autocomplete="username" autocapitalize="none" spellcheck="false">`}
      <label for="p">Password</label><input id="p" type="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}">
      <div class="row"><input id="s" type="checkbox" ${stay ? "checked" : ""}><label for="s" style="all:unset;cursor:pointer">Stay signed in on this device</label></div>
      <div class="err" role="alert"></div>
      <button class="btn" type="submit">${mode === "signup" ? "Create account" : "Sign in"}</button>
    </form>
    ${mode === "signin" ? `<button class="btn txt" data-forgot>Forgot password?</button>` : `<p class="note">Same account works across all of carzzyapps.com.</p>`}`,
  (card, done) => {
    card.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { closeModal(); openAccount(b.dataset.mode, lead); }));
    const err = card.querySelector(".err"), btn = card.querySelector("button[type=submit]");
    const fg = card.querySelector("[data-forgot]");
    if (fg) fg.onclick = async () => {
      const em = card.querySelector("#e").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err.className = "err"; err.textContent = "Type your account email above first."; return; }
      try { await sendPasswordResetEmail(auth, em); } catch (e) {}
      err.className = "err ok"; err.textContent = "If that email has an account, a reset link is on its way.";
    };
    card.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault(); err.className = "err"; err.textContent = "";
      const e = card.querySelector("#e").value.trim(), p = card.querySelector("#p").value, s = card.querySelector("#s").checked;
      try {
        btn.disabled = true; btn.textContent = "One sec…";
        if (mode === "signup") {
          const u = card.querySelector("#u").value.trim();
          if (!USERNAME_RE.test(u)) throw { code: "x", msg: "Username: 3–20 letters, numbers or underscores." };
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw { code: "auth/invalid-email" };
          if (p.length < 6) throw { code: "auth/weak-password" };
          await doSignUp(u, e, p, s);
          state.username = u;
        } else {
          if (!e || !p) throw { code: "x", msg: "Enter your email/username and password." };
          await doSignIn(e, p, s);
        }
        done(true);
        toast(mode === "signup" ? "Account created. Welcome to Lazer Arcade!" : "Signed in");
        afterSignIn();
      } catch (x) {
        err.textContent = x.msg || authError(x);
        btn.disabled = false; btn.textContent = mode === "signup" ? "Create account" : "Sign in";
      }
    };
  });
}

function accountMenu() {
  return modal(`
    <h2>${esc(state.username)}</h2>
    <p class="sub">Signed in to Carzzy Apps. Progress and Lazer Points save to this account.</p>
    <button class="btn" data-lb>View leaderboard</button>
    <button class="btn alt" data-out>Sign out</button>`,
  (card, done) => {
    card.querySelector("[data-lb]").onclick = () => { location.href = BASE + "leaderboard/"; };
    card.querySelector("[data-out]").onclick = async () => { done(); await logout(); toast("Signed out"); if (Object.keys(games).length) setTimeout(() => location.reload(), 500); };
  });
}

function promptSave(lp, waiting) {
  return modal(`
    <h2>Nice run!</h2>
    <div class="big">+${fmt(lp)} LP</div>
    <p class="sub">${waiting > lp ? `${fmt(waiting)} Lazer Points are waiting on this device. ` : ""}Sign in or create a free account to save your progress and put your points on the leaderboard. Everything you've played so far comes with you.</p>
    <button class="btn" data-up>Create free account</button>
    <button class="btn alt" data-in>I have an account</button>
    <button class="btn txt" data-close2>Not now (saved on this device)</button>`,
  (card, done) => {
    card.querySelector("[data-up]").onclick = () => { done(); openAccount("signup"); };
    card.querySelector("[data-in]").onclick = () => { done(); openAccount("signin"); };
    card.querySelector("[data-close2]").onclick = () => done();
  });
}

async function openFeedback(gameId) {
  const c = await catalog();
  const opts = [`<option value="arcade">Lazer Arcade in general</option>`].concat(c.games.map((g) => `<option value="${esc(g.id)}" ${g.id === gameId ? "selected" : ""}>${esc(g.name)}</option>`));
  return modal(`
    <h2>Send feedback</h2>
    <p class="sub">Bugs, ideas, game requests. Every ticket gets read.</p>
    <form novalidate>
      <label for="k">Type</label>
      <select id="k"><option value="bug">Bug</option><option value="idea">Idea / improvement</option><option value="request">New game request</option><option value="other">Other</option></select>
      <label for="g">About</label><select id="g">${opts.join("")}</select>
      <label for="tx">Message</label><textarea id="tx" maxlength="4000" placeholder="What happened, or what would make it better?"></textarea>
      ${signedIn() ? "" : `<label for="ct">Contact (optional)</label><input id="ct" maxlength="200" placeholder="Email or username, if you want a reply">`}
      <div class="err" role="alert"></div>
      <button class="btn" type="submit">Send ticket</button>
    </form>`,
  (card, done) => {
    const err = card.querySelector(".err"), btn = card.querySelector("button[type=submit]");
    card.querySelector("form").onsubmit = async (ev) => {
      ev.preventDefault();
      const text = card.querySelector("#tx").value.trim();
      if (text.length < 3) { err.textContent = "Write a little more first."; return; }
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const ct = card.querySelector("#ct");
        await sendTicket({ kind: card.querySelector("#k").value, game: card.querySelector("#g").value, text, contact: ct ? ct.value.trim() : "" });
        done(true); toast("Ticket sent. Thank you!");
      } catch (e) { console.warn(e); err.textContent = "Couldn't send right now. Try again in a moment."; btn.disabled = false; btn.textContent = "Send ticket"; }
    };
  });
}

/* ---------------- public API ---------------- */
const LZ = {
  ready: readyP, auth, db, catalog, gameInfo, toLP, onChange, signedIn,
  get user() { return state.user; }, get username() { return state.username; },
  boot, save, flush, endSession, pendingLP, plays, top, me, rank, playerCount,
  openAccount, openFeedback, accountMenu, toast, logout, base: BASE, fmt, esc
};
window.LZ = LZ;
window.dispatchEvent(new CustomEvent("lz-ready"));
export default LZ;
