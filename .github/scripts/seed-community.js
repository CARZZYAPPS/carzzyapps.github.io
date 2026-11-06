// Seeds staff community games from arcade/community/seed/*.json into Firestore (communityGames).
// Creates the doc if missing; on later runs refreshes content but keeps plays, likes and status.
const admin = require("firebase-admin");
const fs = require("fs"), path = require("path");
const root = process.argv[2] || ".";
const dir = path.join(root, "arcade/community/seed");
const sa = JSON.parse(process.env.SA);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore(), FV = admin.firestore.FieldValue;
(async () => {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const s = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    let u = await db.collection("usernames").doc(s.owner.toLowerCase()).get();
    if (!u.exists) { const q = await db.collection("usernames").where("usernameLower", "==", s.owner.toLowerCase()).limit(1).get(); if (!q.empty) u = q.docs[0]; }
    if (!u.exists) { console.log("No account for", s.owner, "- skipping", s.id); continue; }
    const ref = db.collection("communityGames").doc(s.id), cur = await ref.get();
    const body = { ownerUid: u.data().uid, ownerName: s.owner, title: s.title, desc: s.desc || "", engine: s.engine, thumb: s.thumb || "", data: typeof s.data === "string" ? s.data : JSON.stringify(s.data), featured: s.featured || 0, updatedAt: FV.serverTimestamp() };
    if (cur.exists) await ref.set(body, { merge: true });
    else await ref.set(Object.assign(body, { status: "live", plays: 0, likes: 0, remixOf: "", createdAt: FV.serverTimestamp() }));
    console.log(cur.exists ? "Updated" : "Created", s.id);
  }
})().catch((e) => { console.error(e); process.exit(1); });
