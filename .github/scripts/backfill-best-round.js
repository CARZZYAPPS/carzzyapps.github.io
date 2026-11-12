// One-time: fills bestRound (most LP earned in a single round) for existing players from their best score in each
// catalog game, converted with that game's LP ratio. New rounds keep it current from here on. Safe to re-run.
const fs = require("fs");
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
const cat = JSON.parse(fs.readFileSync("arcade/games.json", "utf8"));
const ratio = {}; (cat.games || []).forEach((g) => { if (g.ratio) ratio[g.id] = g.ratio; });
(async () => {
  const ps = await db.collection("arcadePlayers").get(); let n = 0;
  for (const d of ps.docs) {
    const r = d.data(), games = r.games || {}; let br = Math.round(r.bestRound || 0), brg = r.bestRoundGame || "";
    for (const g of Object.keys(ratio)) { const v = Math.min(20000, Math.round(((games[g] || {}).best || 0) * ratio[g])); if (v > br) { br = v; brg = g; } }
    if (br > (r.bestRound || 0)) { await d.ref.update({ bestRound: br, bestRoundGame: brg }); n++; console.log(`${r.username}: ${br} LP in ${brg}`); }
  }
  console.log(`Updated ${n} of ${ps.size} players.`);
})().catch((e) => { console.error(e); process.exit(1); });
