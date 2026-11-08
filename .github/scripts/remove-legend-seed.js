// One-time: removes the 1,000,000 LP Legend seed from LazerYudel (500,000 LP and 1,667 fake plays each on crema and harbor).
// Fake bests are replaced with the best score from the player's own game save, if one is found. Runs once (flag in arcadeAdmin).
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore(), FV = admin.firestore.FieldValue;
const UIDP = "uvXBFe", SEED = { crema: 500000, harbor: 500000 }, FAKE_PLAYS = 1667;
function findBest(o, depth = 0) { let b = 0; if (!o || typeof o !== "object" || depth > 4) return 0;
  for (const [k, v] of Object.entries(o)) { if (/^(best|bestScore|hi|high)$/i.test(k) && typeof v === "number") b = Math.max(b, v); else if (typeof v === "object") b = Math.max(b, findBest(v, depth + 1)); }
  return b; }
(async () => {
  const flag = db.collection("arcadeAdmin").doc("legendSeedRemoved");
  const fl = await flag.get();
  if (fl.exists) {
    // follow-up: Harbor 3 saves keep no best, so restore Harbor's real best from its last real score (3,563)
    if (!fl.data().harborFix) { const ps0 = await db.collection("arcadePlayers").get(); const d0 = ps0.docs.find((x) => x.id.startsWith(UIDP) && x.data().username === "LazerYudel");
      await d0.ref.update({ "games.harbor.best": 3563, "games.harbor.last": 3563 }); await flag.update({ harborFix: true }); console.log("harbor best set to 3563"); }
    else console.log("Already removed."); return; }
  const ps = await db.collection("arcadePlayers").get();
  const d = ps.docs.find((x) => x.id.startsWith(UIDP) && x.data().username === "LazerYudel");
  if (!d) throw new Error("LazerYudel row not found");
  const bests = {};
  for (const g of Object.keys(SEED)) {
    const s = await db.collection("arcadeSaves").doc(d.id).collection("games").doc(g).get();
    let data = s.exists ? s.data() : null;
    if (data) for (const k of Object.keys(data)) if (typeof data[k] === "string" && data[k].startsWith("{")) { try { data[k] = JSON.parse(data[k]); } catch (e) {} }
    bests[g] = Math.round(findBest(data)); console.log(g, "save found:", !!s.exists, "best from save:", bests[g]);
  }
  await db.runTransaction(async (tx) => {
    const s = await tx.get(d.ref), cur = s.data(), games = Object.assign({}, cur.games || {});
    let total = 0;
    for (const g of Object.keys(SEED)) {
      const row = Object.assign({ lp: 0, best: 0, plays: 0, last: 0 }, games[g] || {});
      const take = Math.min(SEED[g], row.lp); total += take;
      console.log(g, "before", JSON.stringify(row));
      row.lp -= take; row.plays = Math.max(0, row.plays - FAKE_PLAYS); row.best = bests[g]; row.last = Math.min(row.last, bests[g]);
      games[g] = row; console.log(g, "after ", JSON.stringify(row));
    }
    const lp = Math.max(0, (cur.lp || 0) - total);
    console.log("total LP", cur.lp, "->", lp);
    tx.update(d.ref, { lp, games, updatedAt: FV.serverTimestamp() });
    tx.set(flag, { at: FV.serverTimestamp(), removed: total });
  });
})().catch((e) => { console.error(e); process.exit(1); });
