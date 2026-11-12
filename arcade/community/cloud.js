// Firestore helpers for community games and Lazer Studio projects.
import LZ from "/arcade/lz.js";
import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, increment, serverTimestamp, deleteDoc, writeBatch, onSnapshot, addDoc, where, runTransaction, deleteField } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const db = LZ.db;
export const MAX_DATA = 480000;
const uid = () => (LZ.user ? LZ.user.uid : null);
export function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

/* ---------- published games ---------- */
export async function listGames(order, n) {
  const f = order === "new" ? "createdAt" : order === "liked" ? "likes" : "plays";
  const s = await getDocs(query(collection(db, "communityGames"), orderBy(f, "desc"), limit(n || 60)));
  return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((g) => (g.status || "live") === "live" && !BUILTIN[g.id]).map((g) => { delete g.data; return g; });
}
// Staff games that are bundled with the site, so they work even when Firestore can't be reached.
export const BUILTIN = {
  harborclassic: { id: "harborclassic", ownerName: "LazerYudel", title: "Harbor Rush Classic", engine: "html", status: "live", plays: 0, likes: 0, thumb: "/arcade/community/games/harbor-rush-classic/thumb.jpg",
    desc: "The original Harbor Rush, the first game built on the Rush engine. Unload ships, juggle trucks and grow one pier into a shipping empire.",
    data: JSON.stringify({ engine: "html", title: "Harbor Rush Classic", url: "/arcade/community/games/harbor-rush-classic/" }) }
};
export async function getGame(id) {
  try { const s = await getDoc(doc(db, "communityGames", id)); if (s.exists()) return Object.assign({ id }, BUILTIN[id] ? { data: BUILTIN[id].data, thumb: BUILTIN[id].thumb } : {}, s.data()); } catch (e) { if (!BUILTIN[id]) throw e; }
  return BUILTIN[id] ? Object.assign({}, BUILTIN[id]) : null;
}
export async function isStaff() { if (!LZ.signedIn()) return false; const r = await LZ.roles(); return !!r[(LZ.username || "").toLowerCase()]; }
export function projectHasCode(p) { return !!(p && (p.engine === "custom" || (p.script && String(p.script).trim()))); }
// Games with creator code go to the staff review queue ("pending") unless a staff member publishes them.
export async function publish(project, thumb, existingId) {
  if (!LZ.signedIn()) throw Object.assign(new Error("signin"), { code: "signin" });
  const data = JSON.stringify(project); if (data.length > MAX_DATA) throw Object.assign(new Error("too big"), { code: "size" });
  const engine = project.engine || "studio2d", code = projectHasCode(project), staff = await isStaff();
  if (existingId) {
    const ref = doc(db, "communityGames", existingId), cur = await getDoc(ref);
    if (cur.exists() && cur.data().ownerUid === uid()) {
      const was = cur.data().status || "live", status = code && !staff ? "pending" : was === "hidden" ? "hidden" : (was === "pending" || was === "rejected") ? (staff || !code ? "live" : "pending") : "live";
      await setDoc(ref, Object.assign({}, cur.data(), { ownerName: LZ.username, title: project.title.slice(0, 60), desc: (project.desc || "").slice(0, 300), data, thumb, engine, hasCode: code, status, updatedAt: serverTimestamp() }));
      return { id: existingId, status };
    }
  }
  const id = newId(), status = code && !staff ? "pending" : "live";
  await setDoc(doc(db, "communityGames", id), { ownerUid: uid(), ownerName: LZ.username, title: project.title.slice(0, 60), desc: (project.desc || "").slice(0, 300), data, thumb, engine, hasCode: code, status, plays: 0, likes: 0, remixOf: project.remixOf || "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { id, status };
}
export async function countPlay(id) { try { await setDoc(doc(db, "communityGames", id), { plays: increment(1) }, { merge: true }); } catch (e) { console.warn("play count", e.code || e); } }
export async function liked(id) { if (!uid()) return false; try { return (await getDoc(doc(db, "communityLikes", id, "users", uid()))).exists(); } catch (e) { return false; } }
export async function setLike(id, on) {
  const b = writeBatch(db), lr = doc(db, "communityLikes", id, "users", uid()), gr = doc(db, "communityGames", id);
  if (on) b.set(lr, { at: serverTimestamp() }); else b.delete(lr);
  b.set(gr, { likes: increment(on ? 1 : -1) }, { merge: true });
  await b.commit();
}
export async function report(id, reason, text) { await addDoc(collection(db, "communityReports"), { gameId: id, reason, text: (text || "").slice(0, 1000), uid: uid() || "", createdAt: serverTimestamp() }); }
export async function setStatus(id, status) { await setDoc(doc(db, "communityGames", id), { status }, { merge: true }); }
export async function removeGame(id) { await deleteDoc(doc(db, "communityGames", id)); }
export async function myGames() { if (!uid()) return []; const s = await getDocs(query(collection(db, "communityGames"), orderBy("updatedAt", "desc"), limit(200))); return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((g) => g.ownerUid === uid()); }

/* ---------- per-game boards ---------- */
export function watchScores(id, cb) { return onSnapshot(query(collection(db, "communityScores", id, "rows"), orderBy("best", "desc"), limit(25)), (s) => cb(s.docs.map((d) => Object.assign({ uid: d.id }, d.data()))), () => cb(null)); }
export async function submitScore(id, score) {
  if (!LZ.signedIn()) return { saved: false };
  const ref = doc(db, "communityScores", id, "rows", uid()), cur = await getDoc(ref), best = cur.exists() ? cur.data().best || 0 : 0;
  const s = Math.max(0, Math.min(1e9, Math.round(score)));
  if (s <= best) return { saved: true, best, improved: false };
  await setDoc(ref, { username: LZ.username, best: s, updatedAt: serverTimestamp() });
  return { saved: true, best: s, improved: true };
}

/* ---------- creators ---------- */
export async function topCreators(n) { try { const s = await getDocs(query(collection(db, "communityCreators"), orderBy("lp", "desc"), limit(n || 10))); return s.docs.map((d) => Object.assign({ uid: d.id }, d.data())); } catch (e) { return []; } }

/* ---------- studio projects (private) ---------- */
const LKEY = "studio.projects.v1";
function localAll() { try { return JSON.parse(localStorage.getItem(LKEY) || "{}"); } catch (e) { return {}; } }
function localPut(m) { try { localStorage.setItem(LKEY, JSON.stringify(m)); return true; } catch (e) { return false; } }
export async function listProjects() {
  const m = localAll(), out = {};
  for (const id in m) out[id] = { id, title: m[id].p.title, at: m[id].at, engine: m[id].p.engine || "studio2d", local: true };
  if (uid()) { try { const s = await getDocs(query(collection(db, "studioProjects", uid(), "items"), orderBy("at", "desc"), limit(100)));
    s.docs.forEach((d) => { const v = d.data(); if (!out[d.id] || (out[d.id].at || 0) < (v.at || 0)) out[d.id] = { id: d.id, title: v.title, at: v.at, engine: v.engine || "studio2d", cloud: true }; else out[d.id].cloud = true; }); } catch (e) { console.warn("projects", e.code || e); } }
  return Object.values(out).sort((a, b) => (b.at || 0) - (a.at || 0));
}
export async function loadProject(id) {
  const m = localAll(); let best = m[id] ? { p: m[id].p, at: m[id].at } : null;
  if (uid()) { try { const s = await getDoc(doc(db, "studioProjects", uid(), "items", id)); if (s.exists()) { const v = s.data(); if (!best || (v.at || 0) > (best.at || 0)) best = { p: JSON.parse(v.data), at: v.at }; } } catch (e) {} }
  return best ? best.p : null;
}
export async function saveProject(id, p) {
  const at = Date.now(), m = localAll(); m[id] = { p, at }; const okLocal = localPut(m);
  let cloud = false;
  if (uid()) { const data = JSON.stringify(p); if (data.length < 900000) { try { await setDoc(doc(db, "studioProjects", uid(), "items", id), { title: (p.title || "Untitled").slice(0, 60), engine: p.engine || "studio2d", data, at }); cloud = true; } catch (e) { console.warn("cloud save", e.code || e); } } }
  return { local: okLocal, cloud };
}
export async function deleteProject(id) { const m = localAll(); delete m[id]; localPut(m); if (uid()) { try { await deleteDoc(doc(db, "studioProjects", uid(), "items", id)); } catch (e) {} } }

/* ---------- LP from community games ---------- */
// Staff set a default ratio (arcadeConfig/community.lpRatio) and per-game overrides (communityGames.lpRatio).
// Player LP = score × ratio, capped per game per day (dailyCap) and at 20,000 per write.
export const CONFIG_DEFAULT = { lpRatio: 0, dailyCap: 300, perPlay: 5, perLike: 20, topCreators: 3, topCreatorMultiplier: 2 };
let cfgP = null;
export function getConfig(fresh) { if (!cfgP || fresh) cfgP = getDoc(doc(db, "arcadeConfig", "community")).then((s) => Object.assign({}, CONFIG_DEFAULT, s.exists() ? s.data() : {})).catch(() => Object.assign({}, CONFIG_DEFAULT)); return cfgP; }
export async function saveConfig(c) { const o = {}; ["lpRatio", "dailyCap", "perPlay", "perLike", "topCreators", "topCreatorMultiplier"].forEach((k) => { if (c[k] != null && c[k] !== "") o[k] = +c[k]; }); o.updatedAt = serverTimestamp(); o.by = LZ.username || ""; await setDoc(doc(db, "arcadeConfig", "community"), o); cfgP = null; }
export function ratioFor(g, cfg) { return g && typeof g.lpRatio === "number" ? g.lpRatio : (cfg ? +cfg.lpRatio || 0 : 0); }
function today() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
export async function awardLP(g, score) {
  if (!LZ.signedIn() || !g || g.status !== "live") return 0;
  const cfg = await getConfig(), ratio = ratioFor(g, cfg), cap = Math.max(0, +cfg.dailyCap || 0);
  const want = Math.floor(Math.max(0, +score || 0) * ratio); if (want <= 0 || cap <= 0) return 0;
  const ref = doc(db, "arcadePlayers", uid()), key = "c_" + g.id, d = today();
  return runTransaction(db, async (tx) => {
    const s = await tx.get(ref), cur = s.exists() ? s.data() : { lp: 0, games: {} };
    const games = Object.assign({}, cur.games || {}), row = Object.assign({ lp: 0, best: 0, plays: 0, last: 0, day: "", dayLp: 0 }, games[key] || {});
    if (row.day !== d) { row.day = d; row.dayLp = 0; }
    const earn = Math.max(0, Math.min(want, cap - row.dayLp, 20000)); if (!earn) return 0;
    row.lp += earn; row.dayLp += earn; row.plays += 1; row.last = Math.round(score); row.best = Math.max(row.best, Math.round(score)); games[key] = row;
    const out = { username: LZ.username, lp: (cur.lp || 0) + earn, games, updatedAt: serverTimestamp() }; if (cur.prog) out.prog = cur.prog; if (Array.isArray(cur.pins)) out.pins = cur.pins; if (typeof cur.hideCredits === "boolean") out.hideCredits = cur.hideCredits;
    if (typeof cur.photoURL === "string") out.photoURL = cur.photoURL;
    tx.set(ref, out); return earn;
  });
}

/* ---------- staff ---------- */
export async function listByStatus(st) { const s = await getDocs(query(collection(db, "communityGames"), where("status", "==", st), limit(100))); return s.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => ((b.updatedAt && b.updatedAt.seconds) || 0) - ((a.updatedAt && a.updatedAt.seconds) || 0)); }
export async function listAll(n) { const s = await getDocs(query(collection(db, "communityGames"), orderBy("plays", "desc"), limit(n || 200))); return s.docs.map((d) => Object.assign({ id: d.id }, d.data())); }
export async function setGameLp(id, ratio) { await setDoc(doc(db, "communityGames", id), { lpRatio: ratio == null || ratio === "" ? deleteField() : Math.max(0, Math.min(1, +ratio || 0)) }, { merge: true }); }
export async function listReports(n) { const s = await getDocs(query(collection(db, "communityReports"), orderBy("createdAt", "desc"), limit(n || 60))); return s.docs.map((d) => Object.assign({ id: d.id }, d.data())); }
export async function dismissReport(id) { await deleteDoc(doc(db, "communityReports", id)); }
export { LZ };
