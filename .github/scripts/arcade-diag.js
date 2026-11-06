// Read-only diagnostics for Lazer Arcade data. Run via workflow_dispatch (input: diag).
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
(async () => {
  const ts = (v) => (v && v.toDate ? v.toDate().toISOString() : v);
  const players = await db.collection("arcadePlayers").get();
  console.log("arcadePlayers:", players.size);
  players.forEach((d) => { const x = d.data(); console.log(" -", d.id.slice(0, 6), JSON.stringify(x.username), "lp", x.lp, "games", Object.entries(x.games || {}).map(([k, g]) => k + ":" + g.lp + "/" + (g.plays || 0) + "p").join(" "), "upd", ts(x.updatedAt)); });
  const stats = await db.collection("arcadeStats").get();
  console.log("arcadeStats:", stats.docs.map((d) => d.id + "=" + d.data().plays).join(", "));
  const saves = await db.collectionGroup("games").get();
  const by = {}; saves.forEach((d) => { if (!d.ref.path.startsWith("arcadeSaves/")) return; const x = d.data(); const k = d.id + " v" + x.major + "." + (x.minor || 0); by[k] = (by[k] || 0) + 1; });
  console.log("arcadeSaves:", JSON.stringify(by));
  const un = await db.collection("usernames").get();
  console.log("usernames docs:", un.size);
  un.forEach((d) => { const x = d.data(); if (/lazer/i.test(x.username || d.id)) console.log(" -", d.id, JSON.stringify(x)); });
  const roles = await db.collection("arcadeRoles").get();
  console.log("arcadeRoles:", roles.docs.map((d) => d.id.slice(0, 6) + "=" + JSON.stringify(d.data())).join(", "));
  const sv = await db.collection("arcadeSaves").listDocuments();
  console.log("save owners:", sv.length);
  console.log("(done)");
})().catch((e) => { console.error(e); process.exit(1); });
