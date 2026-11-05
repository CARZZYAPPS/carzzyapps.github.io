// Grants Lazer Arcade staff roles listed in arcade/roles.json (by Carzzy Apps username).
const fs = require("fs");
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();

(async () => {
  const list = (JSON.parse(fs.readFileSync(process.argv[2], "utf8")).roles || []).filter((r) => r.username && ["creator", "admin"].includes(r.role));
  const want = new Map();
  for (const r of list) {
    const snap = await db.collection("usernames").doc(r.username.toLowerCase()).get();
    if (!snap.exists || !snap.data().uid) { console.log(`::warning::No Carzzy Apps account with username "${r.username}"`); continue; }
    want.set(snap.data().uid, { role: r.role, username: r.username });
  }
  const cur = await db.collection("arcadeRoles").get();
  for (const d of cur.docs) if (!want.has(d.id)) { await d.ref.delete(); console.log("removed", d.id); }
  for (const [uid, v] of want) { await db.collection("arcadeRoles").doc(uid).set(v); console.log("set", v.username, v.role); }
})().catch((e) => { console.error(e); process.exit(1); });
