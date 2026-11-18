// EXPORT side (carzzyapps, OLD admin key). Dumps all Auth users with their UIDs,
// emails, and password hashes (base64) so the new project can keep the same IDs
// and — if the SCRYPT signer key is supplied at import — the same passwords.
//
// Usage: node arcade-auth-dump.js <outFile>
//   env SA = carzzy-apps service-account JSON

const admin = require("firebase-admin");
const fs = require("fs");

const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });

(async () => {
  const outFile = process.argv[2] || "auth-dump.json";
  const users = [];
  let pageToken;
  do {
    const res = await admin.auth().listUsers(1000, pageToken);
    for (const u of res.users) {
      users.push({
        uid: u.uid,
        email: u.email || null,
        emailVerified: !!u.emailVerified,
        displayName: u.displayName || null,
        photoURL: u.photoURL || null,
        disabled: !!u.disabled,
        // base64 — present for email/password users; undefined for provider-only
        passwordHash: u.passwordHash || null,
        passwordSalt: u.passwordSalt || null,
        providers: (u.providerData || []).map((p) => p.providerId),
      });
    }
    pageToken = res.pageToken;
  } while (pageToken);
  fs.writeFileSync(outFile, JSON.stringify({ count: users.length, users }));
  const withPw = users.filter((u) => u.passwordHash).length;
  console.log(`Dumped ${users.length} auth users (${withPw} with password hashes) -> ${outFile}`);
})().catch((e) => { console.error("AUTH DUMP FAILED:", e); process.exit(1); });
