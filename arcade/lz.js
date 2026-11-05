// Lazer Arcade shared SDK: accounts, saves, Lazer Points, leaderboards, play counts and feedback.
// Uses the same Firebase project and auth session as the rest of carzzyapps.com.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, runTransaction, increment, serverTimestamp, collection,
  addDoc, query, orderBy, limit, getDocs, getCountFromServer, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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
// Never let a slow or blocked request stall a game.
const within = (p, ms, fallback) => Promise.race([p, sleep(ms).then(() => { if (fallback instanceof Error) throw fallback; return fallback; })]);

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
    state.username = (u.displayName && USERNAME_RE.test(u.displayName)) ? u.displayName : "";
    if (!state.username) state.username = (await within(lookupUsername(u), 4000, "")) || (u.email ? u.email.split("@")[0].slice(0, 20) : "Player");
  } else {
    state.user = null;
    state.username = "";
  }
  if (!state.ready) { state.ready = true; resolveReady(); }
  state.listeners.forEach((fn) => { try { fn(state.user, state.username); } catch (e) { console.error(e); } });
});
setTimeout(() => { if (!state.ready) { state.ready = true; resolveReady(); } }, 3000);

function onChange(fn) { state.listeners.add(fn); if (state.ready) fn(state.user, state.username); return () => state.listeners.delete(fn); }
// Any real (non-guest) Carzzy Apps session counts as signed in, even before its username has been looked up.
function signedIn() { return !!state.user; }

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
  try { const s = await within(getDoc(doc(db, "arcadeSaves", state.user.uid, "games", id)), 4000, null); return s && s.exists() ? s.data() : null; } catch (e) { console.warn("cloud load", e.code || e); return null; }
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
  if (g.dirty) await within(writeCloud(id), 4000, false);
  return { changed };
}

async function boot(id, opts) {
  games[id] = Object.assign({ localKey: id, major: 1, minor: 0, progressOf: () => 0, dirty: false, timer: null }, opts || {});
  await Promise.race([readyP, sleep(3000)]);
  countPlay(id);
  try { await within(reconcile(id), 6000, null); } catch (e) { console.warn("reconcile", e); }
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

/* ---------------- roles (creator / admin badges) ---------------- */
let rolesP = null;
function roles() {
  if (!rolesP) rolesP = fetch(BASE + "roles.json", { cache: "no-cache" }).then((r) => r.json()).then((j) => {
    const m = {}; (j.roles || []).forEach((r) => { if (r.username) m[r.username.toLowerCase()] = r.role; }); return m;
  }).catch(() => ({}));
  return rolesP;
}

/* ---------------- leaderboards ---------------- */
async function top(field, n) {
  const snap = await getDocs(query(collection(db, "arcadePlayers"), orderBy(field, "desc"), limit(n || 50)));
  return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
}
function watchTop(field, n, cb, onErr) {
  return onSnapshot(query(collection(db, "arcadePlayers"), orderBy(field, "desc"), limit(n || 50)),
    (snap) => cb(snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()))), (e) => { console.warn("leaderboard", e.code || e); if (onErr) onErr(e); });
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

/* ---------------- account actions ----------------
   Lazer Arcade has no separate login: it uses the Carzzy Apps account system. Sign-in and sign-up happen
   on carzzyapps.com's own pages, and the shared Firebase session carries the player straight back. */
function here() { return location.pathname + location.search + location.hash; }
function goSignIn() { flush(); ls.set("lz.returnTo", here()); location.href = "/auth/sign-in/?returnTo=" + encodeURIComponent(here()); }
function goSignUp() { flush(); ls.set("lz.returnTo", here()); location.href = "/auth/sign-up/?returnTo=" + encodeURIComponent(here()); }
let wasSignedIn = null;
onChange(() => {
  // Signed in from another tab or after returning: move guest progress and points to the account.
  if (wasSignedIn === false && signedIn()) syncPending().then((n) => n && toast(`${fmt(n)} Lazer Points moved to your account`)).catch(() => {});
  wasSignedIn = signedIn();
});
async function logout() { flush(); await sleep(300); ls.del("signIn"); await signOut(auth); }
readyP.then(() => { if (signedIn()) { ls.del("lz.returnTo"); syncPending().then((n) => n && toast(`${fmt(n)} Lazer Points moved to your account`)).catch(() => {}); } });

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
  border:1px solid rgba(255,255,255,.12);box-shadow:0 0 0 1px rgba(124,77,255,.35),0 20px 60px rgba(0,0,0,.6),0 0 60px rgba(124,77,255,.25);
  font:500 15px/1.45 "Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;animation:up .22s ease-out;position:relative}
.card:before{content:"";position:absolute;left:22px;right:22px;top:0;height:3px;border-radius:3px;background:linear-gradient(90deg,#8b5cff,#4f7bff,#22d3ee)}
h2{font:800 24px/1.15 "Unbounded","Manrope",system-ui,sans-serif;margin:4px 0 6px;letter-spacing:-.01em}
.sub{color:#b9b0dc;margin:0 0 16px;font-size:14px}
.big{font:800 40px/1 "Unbounded",system-ui,sans-serif;background:linear-gradient(90deg,#a78bfa,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent;margin:6px 0 4px}
label{display:block;font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#a99fd6;margin:12px 0 5px}
input,select,textarea{width:100%;background:#0a0720;color:#fff;border:1px solid #3a2f73;border-radius:12px;padding:11px 12px;font:600 15px "Manrope",system-ui,sans-serif;outline:none}
textarea{min-height:110px;resize:vertical}
input:focus,select:focus,textarea:focus{border-color:#8b5cff;box-shadow:0 0 0 3px rgba(124,77,255,.25)}
.row{display:flex;gap:8px;align-items:center;margin-top:12px;font-size:14px;color:#cfc6f2}
.row input{width:auto}
.btn{display:block;width:100%;margin-top:12px;border:0;border-radius:14px;padding:13px 16px;font:800 15px "Manrope",system-ui,sans-serif;cursor:pointer;color:#fff;
  background:linear-gradient(90deg,#7c4dff,#4f7bff);box-shadow:0 6px 20px rgba(124,77,255,.35)}
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
.note{font-size:12.5px;color:#8f86b8;margin-top:12px;text-align:center}
.cz{display:flex;align-items:center;gap:10px;margin:0 0 16px}
.cz svg{width:38px;height:38px;flex:none}
.cz b{display:block;font:800 15px "Manrope",system-ui,sans-serif;color:#fff;line-height:1.1}
.cz span{font:700 12px "Manrope",system-ui,sans-serif;color:#8f86b8;letter-spacing:.04em}
.perks{list-style:none;padding:0;margin:0 0 6px;display:flex;flex-direction:column;gap:8px}
.perks li{position:relative;padding-left:26px;color:#d6cff5;font-size:14px}
.perks li:before{content:"";position:absolute;left:2px;top:4px;width:14px;height:14px;border-radius:50%;background:#00d1b2;
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-7' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/100% no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-7' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/100% no-repeat}
.btn.cz-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:#0f0f0f;border:1.5px solid #00d1b2;box-shadow:0 6px 22px rgba(0,209,178,.22)}
.btn.cz-btn svg{width:24px;height:24px}
.btn.cz-btn:hover{background:#121a19}
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

const CZ_MARK = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="#0f0f0f"/><rect x=".75" y=".75" width="46.5" height="46.5" rx="12.25" fill="none" stroke="#00d1b2" stroke-opacity=".55" stroke-width="1.5"/><path d="M31.5 16.2a10.5 10.5 0 1 0 0 15.6" fill="none" stroke="#00d1b2" stroke-width="4.4" stroke-linecap="round"/></svg>`;
function openAccount(mode, lead) {
  if (signedIn()) return accountMenu();
  const p = pendingLP();
  return modal(`
    <div class="cz">${CZ_MARK}<div><b>Carzzy Apps</b><span>Account</span></div></div>
    <h2>${mode === "signup" ? "Create your Carzzy Apps account" : "Sign in with Carzzy Apps"}</h2>
    <p class="sub">${esc(lead || "Lazer Arcade uses your Carzzy Apps account. It's the same login across carzzyapps.com, so signing in on either side signs you in on both.")}</p>
    <ul class="perks"><li>Your game progress saves to your account and follows you to any device</li><li>Anything you've played on this device comes with you${p ? ` (${fmt(p)} LP waiting)` : ""}</li><li>Your scores count on the leaderboards</li></ul>
    <button class="btn cz-btn" data-in>${CZ_MARK}<span>Sign in with Carzzy Apps</span></button>
    <button class="btn alt" data-up>Create a Carzzy Apps account</button>
    <p class="note">You'll continue on carzzyapps.com and come straight back here.</p>`,
  (card, done) => {
    card.querySelector("[data-in]").onclick = () => { done(); goSignIn(); };
    card.querySelector("[data-up]").onclick = () => { done(); goSignUp(); };
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
    <h2>Keep your progress</h2>
    <p class="sub">You're playing as a guest, so this run is only saved on this device. Sign in with your Carzzy Apps account to keep your progress safe, pick it up on any device, and count your ${fmt(waiting || lp)} Lazer Points.</p>
    <button class="btn cz-btn" data-in>${CZ_MARK}<span>Sign in with Carzzy Apps</span></button>
    <button class="btn alt" data-up>Create a free account</button>
    <button class="btn txt" data-close2>Keep playing as guest</button>`,
  (card, done) => {
    card.querySelector("[data-up]").onclick = () => { done(); goSignUp(); };
    card.querySelector("[data-in]").onclick = () => { done(); goSignIn(); };
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
  boot, save, flush, endSession, pendingLP, plays, top, watchTop, me, rank, playerCount, goSignIn, goSignUp, roles,
  openAccount, openFeedback, accountMenu, toast, logout, base: BASE, fmt, esc
};
window.LZ = LZ;
window.dispatchEvent(new CustomEvent("lz-ready"));
export default LZ;
