// Deletes every top-level Firestore collection except those in KEEP (recursively, incl. subcollections).
// MODE=dry lists only; MODE=delete actually deletes.
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
const KEEP = new Set(["usernames"]);
const MODE = process.env.MODE || "dry";

(async () => {
  console.log(`project: ${sa.project_id}  mode: ${MODE}`);
  const cols = await db.listCollections();
  for (const c of cols) {
    const n = (await c.count().get()).data().count;
    const keep = KEEP.has(c.id);
    console.log(`${keep ? "KEEP  " : "DELETE"} ${c.id} (${n} top-level docs)`);
    if (!keep && MODE === "delete") {
      await db.recursiveDelete(c);
      console.log(`  deleted ${c.id}`);
    }
  }
  if (MODE === "delete") {
    const left = (await db.listCollections()).map((c) => c.id);
    console.log(`remaining collections: ${left.join(", ") || "(none)"}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
