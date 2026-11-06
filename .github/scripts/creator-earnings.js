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
// Player-set fields that full-row writes must carry over.
const keep = (cur, out) => { if (Array.isArray(cur.pins)) out.pins = cur.pins; if (typeof cur.hideCredits === "boolean") out.hideCredits = cur.hideCredits; return out; };

async function uidOf(name) {
  const byId = await db.collection("usernames").doc(name.toLowerCase()).get();
  if (byId.exists && byId.data().uid) return byId.data().uid;
  const q = await db.collection("usernames").where("usernameLower", "==", name.toLowerCase()).limit(1).get();
  return q.empty ? null : q.docs[0].data().uid;
}

(async () => {
  // Staff-set rates (arcadeConfig/community) override creators.json.
  try { const c = (await db.collection("arcadeConfig").doc("community").get()).data() || {};
    cfg.community = Object.assign({ perPlay: 5, perLike: 20, topCreators: 3 }, cfg.community || {});
    ["perPlay", "perLike", "topCreators"].forEach((k) => { if (typeof c[k] === "number") cfg.community[k] = c[k]; });
    if (typeof c.topCreatorMultiplier === "number") cfg.topCreatorMultiplier = c.topCreatorMultiplier;
    console.log("Rates", JSON.stringify(cfg.community), "x" + cfg.topCreatorMultiplier); } catch (e) { console.log("No staff config, using creators.json"); }
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
      tx.set(refs[i], keep(cur, { username: cur.username || c.username, lp: (cur.lp || 0) + add, games, prog: cur.prog || {}, updatedAt: FV.serverTimestamp() }));
      console.log(c.username, "+", add, "LP (earned", earn, "from", dLp, "player LP,", dPlays, "plays,", dVisits, "visits)");
    });
    tx.set(stateRef, { others, plays, visits, seeded, at: FV.serverTimestamp() });
  });
  await communityEarnings(creators);
})().catch((e) => { console.error(e); process.exit(1); });

// Community creators (anyone who published in Lazer Studio) earn LP from their games' plays and likes.
// The top creators earn topCreatorMultiplier. Results also feed the public communityCreators board.
async function communityEarnings(staff) {
  let allLp = 0, allPlays = 0;
  (await db.collection("arcadePlayers").get()).forEach((d) => { allLp += d.data().lp || 0; });
  (await db.collection("arcadeStats").get()).forEach((d) => { if (d.id !== "site") allPlays += d.data().plays || 0; });
  const cc = cfg.community || { perPlay: 5, perLike: 20, topCreators: 3 };
  const games = await db.collection("communityGames").get();
  const by = {};
  games.forEach((d) => { const g = d.data(); if (!g.ownerUid || (g.status || "live") !== "live") return; const o = by[g.ownerUid] = by[g.ownerUid] || { username: g.ownerName, plays: 0, likes: 0, games: 0 }; o.plays += g.plays || 0; o.likes += g.likes || 0; o.games++; o.username = g.ownerName || o.username; });
  const stRef = db.collection("arcadeAdmin").doc("communityEarnings");
  const st = (await stRef.get()).data() || { owners: {} };
  const owners = st.owners || {};
  const ranked = Object.keys(by).sort((a, b) => ((by[b].plays * cc.perPlay + by[b].likes * cc.perLike) - (by[a].plays * cc.perPlay + by[a].likes * cc.perLike)));
  const top = new Set(ranked.slice(0, cc.topCreators || 3).concat(staff.map((c) => c.uid)));
  for (const uid of Object.keys(by)) {
    const o = by[uid], prev = owners[uid] || { plays: 0, likes: 0, lp: 0 };
    const dP = Math.max(0, o.plays - prev.plays), dL = Math.max(0, o.likes - prev.likes);
    const earn = Math.round((dP * cc.perPlay + dL * cc.perLike) * (top.has(uid) ? cfg.topCreatorMultiplier : 1));
    const lp = (prev.lp || 0) + earn;
    if (earn > 0) {
      const ref = db.collection("arcadePlayers").doc(uid);
      await db.runTransaction(async (tx) => {
        const s = await tx.get(ref), cur = s.exists ? s.data() : { username: o.username, lp: 0, games: {}, prog: {} };
        const gm = Object.assign({}, cur.games || {}), row = Object.assign({ lp: 0, best: 0, plays: 0, last: 0 }, gm.community || {});
        row.lp += earn; row.last = earn; row.best = Math.max(row.best, earn); row.plays = o.plays; gm.community = row;
        tx.set(ref, keep(cur, { username: cur.username || o.username, lp: (cur.lp || 0) + earn, games: gm, prog: cur.prog || {}, updatedAt: FV.serverTimestamp() }));
      });
      console.log("Community creator", o.username, "+", earn, "LP");
    }
    owners[uid] = { plays: o.plays, likes: o.likes, lp };
  }
  // creator board: staff creators show their whole-arcade creator LP plus community LP
  const writes = [];
  for (const uid of Object.keys(by)) writes.push(db.collection("communityCreators").doc(uid).set({ username: by[uid].username, lp: owners[uid].lp, games: by[uid].games, plays: by[uid].plays, likes: by[uid].likes, updatedAt: FV.serverTimestamp() }));
  for (const c of staff) {
    const p = (await db.collection("arcadePlayers").doc(c.uid).get()).data() || {};
    const mine = by[c.uid] || { games: 0, plays: 0, likes: 0 };
    // Lazer Arcade is the staff creator's game: every point earned anywhere on the arcade counts, doubled as a top creator.
    const arcadeLp = Math.round(allLp * (cfg.topCreatorMultiplier || 2));
    writes.push(db.collection("communityCreators").doc(c.uid).set({ username: c.username, lp: arcadeLp + ((owners[c.uid] || {}).lp || 0), games: mine.games + 1, plays: mine.plays + allPlays, likes: mine.likes, note: "Lazer Arcade", updatedAt: FV.serverTimestamp() }));
  }
  await Promise.all(writes);
  await stRef.set({ owners, at: FV.serverTimestamp() });
}
