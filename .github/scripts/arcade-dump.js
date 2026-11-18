// EXPORT side (runs on carzzyapps with the OLD admin key).
// Dumps every arcade-related Firestore collection + subcollection to a JSON file,
// preserving document IDs and full paths so the import can recreate them 1:1.
// Values are serialized with type tags so Timestamps/GeoPoints/Bytes/Refs round-trip.
//
// Usage: node arcade-dump.js <outFile>
//   env SA = carzzy-apps service-account JSON (FIREBASE_SERVICE_ACCOUNT)

const admin = require("firebase-admin");
const fs = require("fs");

const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();

// Top-level arcade collections to carry. Subcollections are discovered per-doc.
const ROOTS = [
  "arcadePlayers", "usernames", "arcadeVotes", "arcadeStats", "arcadeConfig",
  "arcadeRoles", "arcadeAccess", "arcadeTickets", "adminUsers", "arcadeAdmin",
  "communityGames", "communityCreators", "communityLikes", "communityScores",
  "communityReports", "studioProjects", "dominionPlayers", "dominionChat",
  "dominionChatFlags", "dominionChatRate", "dominionInbox", "rhythmRunnerScores",
  "cremaRushScoreEvents", "cremaRushYesGraphicsSaves", "cremaTycoonSaves",
  "arcadeSaves", "usernameAuthLookup", "guestAccounts",
];

const Timestamp = admin.firestore.Timestamp;
const GeoPoint = admin.firestore.GeoPoint;

function enc(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Timestamp) return { __t: "ts", s: v.seconds, n: v.nanoseconds };
  if (v instanceof GeoPoint) return { __t: "geo", lat: v.latitude, lng: v.longitude };
  if (Buffer.isBuffer(v)) return { __t: "bytes", b64: v.toString("base64") };
  if (v && typeof v === "object" && typeof v.path === "string" && v.firestore) return { __t: "ref", p: v.path };
  if (Array.isArray(v)) return v.map(enc);
  if (typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = enc(v[k]); return o; }
  return v; // string | number | boolean
}

async function dumpCollection(ref, out, counts) {
  const path = ref.path; // e.g. "arcadePlayers" or "arcadeSaves/UID/games"
  const snap = await ref.get();
  if (!out[path]) out[path] = {};
  for (const doc of snap.docs) {
    out[path][doc.id] = enc(doc.data());
    counts.docs++;
    // Recurse into any subcollections under this doc.
    const subs = await doc.ref.listCollections();
    for (const sub of subs) await dumpCollection(sub, out, counts);
  }
  counts.cols++;
}

(async () => {
  const outFile = process.argv[2] || "firestore-dump.json";
  const out = {};
  const counts = { cols: 0, docs: 0 };
  for (const root of ROOTS) {
    try { await dumpCollection(db.collection(root), out, counts); }
    catch (e) { console.log(`  skip ${root}: ${e.message}`); }
  }
  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log(`Dumped ${counts.docs} docs across ${Object.keys(out).length} collection paths -> ${outFile}`);
})().catch((e) => { console.error("DUMP FAILED:", e); process.exit(1); });
