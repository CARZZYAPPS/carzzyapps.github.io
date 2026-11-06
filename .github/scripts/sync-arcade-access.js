// Syncs .github/arcade-access.json into Firestore arcadeAccess/{earlyAccess,beta}. Expired entries are dropped.
const admin = require("firebase-admin");
const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
(async () => {
  const now = Date.now();
  for (const kind of ["earlyAccess", "beta"]) {
    const games = (cfg[kind] || []).filter((g) => !g.until || new Date(g.until).getTime() > now).map((g) => ({ id: g.id, name: g.name, path: g.path, until: g.until || null }));
    await db.collection("arcadeAccess").doc(kind).set({ games, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(kind + ":", games.map((g) => g.name).join(", ") || "(none)");
  }
})().catch((e) => { console.error(e); process.exit(1); });
