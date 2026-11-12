// Fills bestRound (most LP earned in a single round, Game of the Day bonus included) for existing players.
// Old rounds only kept the score, so: a game's best score counts at 2x when every day the player played that game it was
// Game of the Day (Crema Nov 4-8, Harbor Nov 9-14); otherwise at 1x. Days with exactly one round give an exact figure too.
// Never lowers an existing value. Safe to re-run.
const fs = require("fs");
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
const cat = JSON.parse(fs.readFileSync("arcade/games.json", "utf8"));
const ratio = {}; (cat.games || []).forEach((g) => { if (g.ratio) ratio[g.id] = g.ratio; });
const GOTD = { crema: ["2026-11-04", "2026-11-08"], harbor: ["2026-11-09", "2026-11-14"] };
const inGotd = (g, d) => GOTD[g] && d >= GOTD[g][0] && d <= GOTD[g][1];
(async () => {
  const ps = await db.collection("arcadePlayers").get(); let n = 0;
  for (const doc of ps.docs) {
    const r = doc.data(), games = r.games || {}, days = (r.prog && r.prog.days) || {};
    let br = Math.round(r.bestRound || 0), brg = r.bestRoundGame || "", why = "kept";
    for (const g of Object.keys(ratio)) {
      const best = (games[g] || {}).best || 0; if (!best) continue;
      const played = Object.keys(days).filter((d) => (days[d].g || []).includes(g));
      const allGotd = played.length > 0 && played.every((d) => inGotd(g, d));
      const v = Math.min(20000, Math.round(best * ratio[g] * (allGotd ? 2 : 1)));
      if (v > br) { br = v; brg = g; why = `best ${g} score ${best} x ${ratio[g]}${allGotd ? " x 2 (Game of the Day)" : ""}`; }
    }
    for (const d of Object.keys(days)) { const x = days[d]; if (x.n === 1 && (x.g || []).length === 1 && x.lp > br) { br = Math.min(20000, Math.round(x.lp)); brg = x.g[0]; why = `only round on ${d}`; } }
    const crema = Object.keys(days).filter((d) => (days[d].g || []).includes("crema")).sort();
    console.log(`${r.username}: ${br} LP in ${brg} (${why}); crema days ${crema[0] || "-"}..${crema[crema.length - 1] || "-"}`);
    if (br > (r.bestRound || 0)) { await doc.ref.update({ bestRound: br, bestRoundGame: brg }); n++; }
  }
  console.log(`Updated ${n} of ${ps.size} players.`);
})().catch((e) => { console.error(e); process.exit(1); });
