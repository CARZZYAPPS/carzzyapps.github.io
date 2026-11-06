// Finds Carzzy Apps accounts whose sign-in email matches a SHA-256 hash (emails never appear in the repo or logs).
// Prints only the username and a uid prefix for each match.
const crypto = require("crypto");
const admin = require("firebase-admin");
const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
const HASHES = (process.env.HASHES || "").split(",").map((s) => s.trim()).filter(Boolean);
const h = (e) => crypto.createHash("sha256").update(String(e).trim().toLowerCase()).digest("hex");

(async () => {
  const found = new Map();
  let token;
  do {
    const page = await admin.auth().listUsers(1000, token);
    for (const u of page.users) {
      const emails = [u.email, ...(u.providerData || []).map((p) => p.email)].filter(Boolean);
      for (const e of emails) { const k = h(e); if (HASHES.includes(k)) found.set(k, u.uid); }
    }
    token = page.pageToken;
  } while (token);
  for (const k of HASHES) {
    const uid = found.get(k);
    if (!uid) { console.log(`hash ${k.slice(0, 8)}: no account`); continue; }
    let name = null;
    const d = await db.collection("usernames").doc(uid).get();
    if (d.exists && d.data().username) name = d.data().username;
    if (!name) { const q = await db.collection("usernames").where("uid", "==", uid).limit(1).get(); if (!q.empty) name = q.docs[0].data().username || q.docs[0].id; }
    console.log(`hash ${k.slice(0, 8)}: uid ${uid.slice(0, 6)}… username ${name || "(none set)"}`);
  }
})().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
