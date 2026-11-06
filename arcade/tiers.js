// Lazer Arcade tiers & badges: shared helpers for every page that shows players.
import LZ from "/arcade/lz.js";

let tiersP = null, achP = null;
export function loadTiers() { if (!tiersP) tiersP = fetch("/arcade/tiers.json", { cache: "no-cache" }).then((r) => r.json()).then((j) => j.tiers || []).catch(() => []); return tiersP; }
export function loadAch() { if (!achP) achP = fetch("/arcade/achievements.json", { cache: "no-cache" }).then((r) => r.json()).then((j) => Object.fromEntries((j.achievements || []).map((a) => [a.id, a]))).catch(() => ({})); return achP; }
export function tierOf(tiers, lp) { let t = null; for (const x of tiers) if ((lp || 0) >= x.lp) t = x; return t; }
export function nextTier(tiers, lp) { return tiers.find((x) => (lp || 0) < x.lp) || null; }
export function rankIndex(tiers, id) { return tiers.findIndex((t) => t.id === id); }
export function hasTier(tiers, lp, id) { const t = tierOf(tiers, lp); return !!t && rankIndex(tiers, t.id) >= rankIndex(tiers, id); }

const ICON = { play: "▶", crown: "♛", bolt: "⚡", fire: "🔥", run: "🏃", cal: "📅", star: "★", swap: "⇄", map: "🗺", grid: "▦" };
const esc = (s) => LZ.esc(String(s == null ? "" : s));

// Name + badges for a leaderboard row: role badge first, then tier, then up to 3 pinned achievements.
export function nameHtml(row, tiers, ach, roleBadge) {
  const t = tierOf(tiers, row.lp);
  const style = t ? ` style="color:${t.color}"` : "";
  const tb = t ? `<span class="tb tb-${t.id}" style="--tc:${t.color}" title="${esc(t.name)} · ${LZ.fmt(t.lp)}+ LP">${esc(t.name.toUpperCase())}</span>` : "";
  const pins = (Array.isArray(row.pins) ? row.pins : []).slice(0, 3).map((id) => ach[id]).filter(Boolean)
    .map((a) => `<span class="pb" title="${esc(a.name)}: ${esc(a.desc)}">${ICON[a.icon] || "★"}</span>`).join("");
  const name = `<span class="un${t && t.id === "legend" ? " fp" : ""}"${style}>${esc(row.username)}</span>`;
  return name + (roleBadge || "") + tb + (pins ? `<span class="pins">${pins}</span>` : "");
}
export function rowClass(row, tiers) { const t = tierOf(tiers, row.lp); return t ? " tier-" + t.id : ""; }

export const TIER_CSS = `
.tb{display:inline-block;margin-left:8px;border-radius:999px;padding:2px 8px;font:800 10px var(--display,sans-serif);letter-spacing:.08em;vertical-align:2px;color:#0b0726;background:var(--tc)}
.tb-legend{background:linear-gradient(90deg,#ff5fd8,#a78bfa,#22e4ff);color:#fff}
.tb-diamond{background:linear-gradient(90deg,#a5b4ff,#e0e7ff)}
.pins{display:inline-flex;gap:3px;margin-left:6px;vertical-align:1px}
.pb{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:7px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);font-size:11px;line-height:1}
.un.fp{background:linear-gradient(90deg,#ff5fd8,#a78bfa,#22e4ff);-webkit-background-clip:text;background-clip:text;color:transparent!important;filter:drop-shadow(0 0 8px rgba(255,95,216,.45));font-weight:900}
.lr.tier-legend{box-shadow:inset 3px 0 0 #ff5fd8}
.tiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px}
.tiers .tc{border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:12px;background:rgba(7,5,26,.45)}
.tiers .tc b{display:block;font:800 13px var(--display,sans-serif);letter-spacing:.06em}
.tiers .tc small{display:block;color:var(--tx2,#b9b3d9);font-size:12px;margin-top:4px;line-height:1.35}
.tiers .tc .lp{font-weight:800;font-size:12px;margin-top:6px;color:var(--tx2,#b9b3d9)}
.tiers .tc.got{border-color:var(--tc);box-shadow:0 0 0 1px var(--tc) inset}
.tiers .tc.got .lp{color:var(--tc)}
.tprog{margin-top:12px;font-size:14px}.tprog .bar{height:8px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:6px}.tprog .bar i{display:block;height:100%;background:linear-gradient(90deg,#a78bfa,#22e4ff)}
`;
export function injectCss() { if (document.getElementById("tier-css")) return; const s = document.createElement("style"); s.id = "tier-css"; s.textContent = TIER_CSS; document.head.appendChild(s); }

// The ladder as cards, highlighting the tiers this player has reached.
export function ladderHtml(tiers, lp) {
  const cur = tierOf(tiers, lp), nx = nextTier(tiers, lp);
  const cards = tiers.map((t) => `<div class="tc${(lp || 0) >= t.lp ? " got" : ""}" style="--tc:${t.color}"><b style="color:${t.color}">${esc(t.name.toUpperCase())}</b><small>${esc(t.perk)}</small><div class="lp">${LZ.fmt(t.lp)} LP${(lp || 0) >= t.lp ? " · unlocked" : ""}</div></div>`).join("");
  let prog = "";
  if (lp != null) {
    if (nx) { const from = cur ? cur.lp : 0, pct = Math.max(0, Math.min(100, ((lp - from) / (nx.lp - from)) * 100)); prog = `<div class="tprog">${cur ? `You're <b style="color:${cur.color}">${esc(cur.name)}</b>. ` : ""}<b>${LZ.fmt(nx.lp - lp)} LP</b> to ${esc(nx.name)}.<div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div></div>`; }
    else prog = `<div class="tprog">You're <b style="color:${cur.color}">${esc(cur.name)}</b>. Every perk is yours.</div>`;
  }
  return `<div class="tiers">${cards}</div>${prog}`;
}
