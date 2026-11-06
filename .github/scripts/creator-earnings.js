// Credits Lazer Arcade creators. Runs hourly from the Lazer Arcade backend workflow.
// 1) One-time Legend seed for each name in creators.json seedUsers, spread across the catalog by popularity.
// 2) Every run: creators earn `share` of all other players' new LP, plus perPlay per game play and perVisit per
//    site visit since the last run, times topCreatorMultiplier. Credited as the "lazerarcade" game.
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const root = process.argv[2] || ".";
const cfg = JSON.parse(fs.readFileSync(path.join(root, "arcade/creators.json"), "utf8"));
const roles = JSON.parse(fs.readFileSync(path.join(root, "arcade/roles.json"), "utf8")).roles || [];
const catalog = JSON.parse(fs.readFileSync(path.join(root, "arcade/games.json"), "utf8")).games || [];
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

async function uidOf(name) { const s = await db.collection("usernames").doc(name.toLowerCase()).get(); return s.exists ? s.data().uid : null; }

(async () => {
  const creators = [];
  for (const r of roles) if (r.role === "creator") { const uid = await uidOf(r.username); if (uid) creators.push({ uid, username: r.username }); else console.log("No account for", r.username); }
  if (!creators.length) { console.log("No creator accounts found."); return; }
  const stateRef = db.collection("arcadeAdmin").doc("creatorEarnings");
  const stats = await db.collection("arcadeStats").get();
  let plays = 0, visits = 0; const playsBy = {};
  stats.forEach((d) => { const n = d.data().plays || 0; if (d.id === "site") visits = n; else { plays += n; playsBy[d.id] = n; } });
  const players = await db.collection("arcadePlayers").get();
  const cset = new Set(creators.map((c) => c.uid));
  let others = 0; players.forEach((d) => { if (!cset.has(d.id)) others += d.data().lp || 0; });

  await db.runTransaction(async (tx) => {
    const st = (await tx.get(stateRef)).data() || {};
    const seeded = st.seeded || {};
    const first = st.others == null;
    const dLp = first ? 0 : Math.max(0, others - st.others), dPlays = first ? 0 : Math.max(0, plays - st.plays), dVisits = first ? 0 : Math.max(0, visits - st.visits);
    const earn = Math.round((dLp * cfg.share + dPlays * cfg.perPlay + dVisits * cfg.perVisit) * cfg.topCreatorMultiplier);
    const refs = creators.map((c) => db.collection("arcadePlayers").doc(c.uid));
    const docs = await Promise.all(refs.map((r) => tx.get(r)));
    creators.forEach((c, i) => {
      const cur = docs[i].exists ? docs[i].data() : { username: c.username, lp: 0, games: {} };
      const games = Object.assign({}, cur.games || {});
      let add = earn;
      if (cfg.seedUsers.includes(c.username) && !seeded[c.uid]) {
        const w = catalog.map((g) => (playsBy[g.id] || 0) + 1), tw = w.reduce((a, b) => a + b, 0);
        catalog.forEach((g, k) => {
          const share = Math.round(cfg.legendSeed * w[k] / tw), r = g.ratio || 0.04, row = Object.assign({ lp: 0, best: 0, plays: 0, last: 0 }, games[g.id] || {});
          row.lp += share; row.plays += Math.round(share / 300); row.best = Math.max(row.best, Math.round(share / r / Math.max(1, row.plays) * 1.8)); row.last = row.best;
          games[g.id] = row;
        });
        add += cfg.legendSeed; seeded[c.uid] = true; console.log("Seeded", c.username, "with", cfg.legendSeed, "LP");
      }
      if (earn > 0) { const row = Object.assign({ lp: 0, best: 0, plays: 0, last: 0 }, games.lazerarcade || {}); row.lp += earn; row.plays += dPlays; row.last = earn; row.best = Math.max(row.best, earn); games.lazerarcade = row; }
      tx.set(refs[i], { username: cur.username || c.username, lp: (cur.lp || 0) + add, games, prog: cur.prog || {}, updatedAt: FV.serverTimestamp() });
      console.log(c.username, "+", add, "LP (earned", earn, "from", dLp, "player LP,", dPlays, "plays,", dVisits, "visits)");
    });
    tx.set(stateRef, { others, plays, visits, seeded, at: FV.serverTimestamp() });
  });
})().catch((e) => { console.error(e); process.exit(1); });
