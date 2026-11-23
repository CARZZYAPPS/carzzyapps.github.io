// Mirrors .github/site-admins.json (Firebase Auth UIDs) into the siteAdmins
// Firestore collection. UIDs removed from the file are deleted.
const fs = require("fs");
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();

(async () => {
  const uids = new Set((JSON.parse(fs.readFileSync(process.argv[2], "utf8")).admins || [])
    .map((u) => String(u).trim()).filter(Boolean));
  const col = db.collection("siteAdmins");
  const cur = await col.get();
  for (const d of cur.docs) if (!uids.has(d.id)) { await d.ref.delete(); console.log("removed", d.id); }
  for (const uid of uids) {
    try { await admin.auth().getUser(uid); } catch (e) { console.log(`::warning::No Firebase Auth user with UID ${uid} (still added).`); }
    await col.doc(uid).set({ enabled: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log("set", uid);
  }
  // One-time cleanup of the old Rhythm Runner-only collection.
  const old = await db.collection("rhythmRunnerAdmins").get();
  for (const d of old.docs) { await d.ref.delete(); console.log("removed old rhythmRunnerAdmins", d.id); }
})().catch((e) => { console.error(e); process.exit(1); });
