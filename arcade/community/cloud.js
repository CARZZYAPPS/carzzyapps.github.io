// Firestore helpers for community games and Lazer Studio projects.
import LZ from "/arcade/lz.js";
import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, increment, serverTimestamp, deleteDoc, writeBatch, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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
export async function publish(project, thumb, existingId) {
  if (!LZ.signedIn()) throw Object.assign(new Error("signin"), { code: "signin" });
  const data = JSON.stringify(project); if (data.length > MAX_DATA) throw Object.assign(new Error("too big"), { code: "size" });
  const id = existingId || newId(), ref = doc(db, "communityGames", id);
  const engine = project.engine || "studio2d";
  if (existingId) {
    const cur = await getDoc(ref);
    if (cur.exists() && cur.data().ownerUid === uid()) {
      await setDoc(ref, Object.assign({}, cur.data(), { title: project.title.slice(0, 60), desc: (project.desc || "").slice(0, 300), data, thumb, engine, updatedAt: serverTimestamp() }));
      return id;
    }
  }
  const nid = existingId && (await getDoc(ref)).exists() ? newId() : id;
  await setDoc(doc(db, "communityGames", nid), { ownerUid: uid(), ownerName: LZ.username, title: project.title.slice(0, 60), desc: (project.desc || "").slice(0, 300), data, thumb, engine, status: "live", plays: 0, likes: 0, remixOf: project.remixOf || "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return nid;
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
export { LZ };
