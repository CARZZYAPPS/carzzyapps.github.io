// Copies unsynced Lazer Arcade feedback tickets from Firestore into GitHub Issues.
const admin = require("firebase-admin");

const sa = JSON.parse(process.env.SA);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || "carzzy-apps" });
const db = admin.firestore();
const repo = process.env.REPO;
const token = process.env.GH_TOKEN;
const KIND = { bug: "Bug", idea: "Idea", request: "Game request", other: "Feedback" };

async function gh(path, method, body) {
  const r = await fetch("https://api.github.com" + path, {
    method,
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok && r.status !== 422) throw new Error(method + " " + path + " -> " + r.status + " " + (await r.text()));
  return r.status === 204 ? null : r.json().catch(() => null);
}

(async () => {
  await gh(`/repos/${repo}/labels`, "POST", { name: "arcade-feedback", color: "ff3dd4", description: "Ticket sent from Lazer Arcade" });
  const snap = await db.collection("arcadeTickets").where("synced", "==", false).limit(50).get();
  let n = 0;
  for (const d of snap.docs) {
    const t = d.data();
    const when = t.createdAt && t.createdAt.toDate ? t.createdAt.toDate().toISOString() : "";
    const first = String(t.text || "").split("\n")[0].slice(0, 70);
    const body = [
      String(t.text || ""),
      "",
      "---",
      `**Type:** ${KIND[t.kind] || t.kind}`,
      `**Game:** ${t.game}`,
      `**From:** ${t.username ? t.username + " (signed in)" : "guest"}${t.contact ? " · contact: " + t.contact : ""}`,
      `**Page:** ${t.page || ""}`,
      `**Sent:** ${when}`,
      `**Ticket id:** ${d.id}`
    ].join("\n");
    const issue = await gh(`/repos/${repo}/issues`, "POST", {
      title: `[${KIND[t.kind] || "Feedback"}] ${t.game}: ${first}`,
      body,
      labels: ["arcade-feedback"]
    });
    await d.ref.update({ synced: true, issue: issue && issue.number ? issue.number : null });
    n++;
  }
  console.log(`Synced ${n} ticket(s).`);
})().catch((e) => { console.error(e); process.exit(1); });
