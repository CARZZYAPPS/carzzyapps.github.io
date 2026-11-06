// Lazer Studio: no-code game editor.
import LZ, { mountShell } from "/arcade/shell.js";
import * as E from "./engine.js";
import { STARTERS, ART } from "./starters.js";
import { ENGINES, ENGINE_ORDER, engineOf } from "./engines.js";
import * as C from "/arcade/community/cloud.js";

const paint = mountShell();
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = LZ.esc;
const app = $("#app");
const qs = new URLSearchParams(location.search);
let P = null, PID = null, tab = "level", dirty = false, saveT = null, cloudT = null, hist = [], fut = [];
const KIND_ORDER = ["player", "enemy", "item", "wall", "hazard", "goal", "decor", "projectile"];

function toast(t) { const d = document.createElement("div"); d.className = "toast2"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }
function thumbOf(sid, fi, cls) { const c = document.createElement("canvas"); c.width = c.height = 16; c.className = cls || "thumb16"; const s = E.spriteCanvas(P, sid, fi || 0); if (s) c.getContext("2d").drawImage(s, 0, 0); return c; }
function thumbHTML(sid, cls) { return `<canvas class="${cls || "thumb16"}" data-spr="${esc(sid)}" width="16" height="16"></canvas>`; }
function hydrateThumbs(root) { $$("canvas[data-spr]", root).forEach((c) => { const s = E.spriteCanvas(P, c.dataset.spr, +c.dataset.f || 0); const x = c.getContext("2d"); x.clearRect(0, 0, 16, 16); if (s) x.drawImage(s, 0, 0); }); }
const objOpts = (sel, extra) => (extra || "") + Object.keys(P.objects).map((id) => `<option value="${esc(id)}" ${id === sel ? "selected" : ""}>${esc(P.objects[id].name)}</option>`).join("");
const ensureArr = () => { if (!Array.isArray(P.rules)) P.rules = []; };

/* ================= HOME ================= */
async function home() {
  document.body.classList.remove("ed"); let engine = "studio2d";
  app.innerHTML = `<main class="wrap st-home">
    <header class="st-hero"><span class="kick">Lazer Studio</span><h1>Make a game.<br><em>No code.</em></h1>
    <p>Pick an engine, start from a template or a blank page, paint your levels, draw your own pixel art and snap rules together like "When the hero touches a coin → add 10 points". Then publish it to the Community with its own leaderboard.</p></header>
    <h2 class="sub2" style="font:800 22px var(--display)">1. Pick an engine</h2>
    <div class="eng" id="eng">${ENGINE_ORDER.map((id) => { const e = ENGINES[id]; return `<button data-e="${id}" ${e.status !== "ready" ? "disabled" : ""} class="${id === engine ? "on" : ""}"><span class="ic">${e.icon}</span><b>${esc(e.name)}</b><small>${esc(e.tag)}</small>${e.status !== "ready" ? '<span class="tag soon">Coming soon</span>' : ""}</button>`; }).join("")}</div>
    <h2 class="sub2" style="font:800 22px var(--display)">2. Start from</h2><div class="starts" id="starts"></div>
    <h2 class="sub2" style="font:800 22px var(--display)">Your projects</h2><p class="hint" id="pnote"></p><div class="projs" id="projs"><div class="skel" style="height:52px"></div></div>
  </main>`;
  const starts = () => {
    const box = $("#starts");
    if (engine === "rush") { import("/arcade/engines/rush/kit.js").then((K) => { box.innerHTML = Object.keys(K.STARTERS).map((k) => `<button class="start" data-rs="${k}"><img alt="" src="${K.thumb(K.STARTERS[k].make())}"><div><b>${esc(K.STARTERS[k].name)}</b><small>${esc(K.STARTERS[k].blurb)}</small></div></button>`).join("");
      $$("[data-rs]", box).forEach((b) => (b.onclick = () => newProject(K.STARTERS[b.dataset.rs].make()))); }).catch(() => { box.innerHTML = '<p class="hint">The Rush kit is still loading. Try again in a moment.</p>'; }); return; }
    box.innerHTML = Object.keys(STARTERS).map((k) => `<button class="start" data-s="${k}"><img alt="" data-k="${k}"><div><b>${esc(STARTERS[k].name)}</b><small>${esc(STARTERS[k].blurb)}</small></div></button>`).join("");
    $$("img[data-k]", box).forEach((im) => { const p = STARTERS[im.dataset.k].make(); im.src = E.renderLevel(p, 0, 320, 180, { focusPlayer: true }).toDataURL(); });
    $$("[data-s]", box).forEach((b) => (b.onclick = () => newProject(STARTERS[b.dataset.s].make())));
  };
  $$("#eng [data-e]").forEach((b) => (b.onclick = () => { engine = b.dataset.e; $$("#eng [data-e]").forEach((x) => x.classList.toggle("on", x === b)); starts(); }));
  starts();
  const list = async () => {
    const ps = await C.listProjects(); $("#pnote").textContent = LZ.signedIn() ? "Saved to your account and this browser." : "Saved in this browser. Sign in to keep them in your account and to publish.";
    $("#projs").innerHTML = ps.length ? ps.map((p) => `<div class="proj"><span>${ENGINES[p.engine] ? ENGINES[p.engine].icon : "🕹️"}</span><b>${esc(p.title || "Untitled")}</b><small>${new Date(p.at || 0).toLocaleDateString()}${p.cloud ? " · ☁" : ""}</small><a class="ib sm" href="?p=${encodeURIComponent(p.id)}">Open</a><button class="ib sm dang" data-del="${esc(p.id)}">Delete</button></div>`).join("") : '<div class="empty">No projects yet. Pick a starter above.</div>';
    $$("[data-del]").forEach((b) => (b.onclick = async () => { if (!confirm("Delete this project? Published copies stay up.")) return; await C.deleteProject(b.dataset.del); list(); }));
  };
  list(); LZ.onChange(() => list());
}
async function newProject(p, remixOf) { const id = C.newId(); if (remixOf) { p.remixOf = remixOf; p.title = (p.title || "Game") + " (remix)"; delete p.pubId; } await C.saveProject(id, p); location.href = "?p=" + encodeURIComponent(id); }

/* ================= EDITOR ================= */
async function editor(id) {
  P = await C.loadProject(id); PID = id;
  if (!P) { app.innerHTML = `<main class="wrap st-home"><h1>Project not found</h1><p class="hint">It may have been saved in another browser. Sign in to load your cloud projects.</p><a class="btn" href="/arcade/studio/">Back to Studio</a></main>`; return; }
  ensureArr();
  if (P.engine === "rush") { const K = await import("/arcade/engines/rush/kit.js"); window.addEventListener("beforeunload", () => { if (dirty) flush(); }); return K.editor(app, P, { save: () => mark(), test: () => testPlay(), publish: () => doPublish(), back: () => (location.href = "/arcade/studio/"), setTitle: (t) => { P.title = t; mark(); } }); }
  document.body.classList.add("ed");
  app.innerHTML = `<div class="ed-wrap">
    <div class="ed-top"><a class="ib sm" href="/arcade/studio/" title="Back">◀</a><input class="ttl" id="ttl" maxlength="60" value="${esc(P.title)}" aria-label="Game title"><span class="stat" id="stat">Saved</span>
      <button class="ib sm" id="undo" title="Undo">↶</button><button class="ib sm" id="redo" title="Redo">↷</button><button class="ib go" id="test">▶ Test</button><button class="ib pri" id="pub">Publish</button></div>
    <div class="tabs2" id="tabs">${[["level", "Level"], ["objects", "Objects"], ["rules", "Rules"], ["art", "Art"], ["sound", "Sound"], ["settings", "Settings"]].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="ed-body" id="body"></div></div>`;
  $("#ttl").oninput = (e) => { P.title = e.target.value || "Untitled"; mark(); };
  $$("#tabs [data-t]").forEach((b) => (b.onclick = () => { tab = b.dataset.t; $$("#tabs [data-t]").forEach((x) => x.classList.toggle("on", x === b)); render(); }));
  $("#test").onclick = testPlay; $("#pub").onclick = doPublish;
  $("#undo").onclick = undo; $("#redo").onclick = redo;
  window.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); e.shiftKey ? redo() : undo(); } });
  window.addEventListener("beforeunload", () => { if (dirty) flush(); });
  render();
}
function snapshot() { hist.push(JSON.stringify(P)); if (hist.length > 60) hist.shift(); fut = []; }
function undo() { if (!hist.length) return; fut.push(JSON.stringify(P)); P = JSON.parse(hist.pop()); mark(true); render(); }
function redo() { if (!fut.length) return; hist.push(JSON.stringify(P)); P = JSON.parse(fut.pop()); mark(true); render(); }
function mark(noHist) { dirty = true; const s = $("#stat"); if (s) s.textContent = "Saving…"; clearTimeout(saveT); saveT = setTimeout(flush, 900); }
async function flush() { clearTimeout(saveT); dirty = false; const r = await C.saveProject(PID, P); const s = $("#stat"); if (s) s.textContent = r.cloud ? "Saved ☁" : r.local ? "Saved" : "Couldn't save"; }
function edit(fn, opt) { if (!opt || !opt.noHist) snapshot(); fn(); mark(); if (!opt || !opt.noRender) render(); }
let rq = false;
function render() { if (rq) return; rq = true; setTimeout(() => { rq = false; renderNow(); }, 0); }
function renderNow() { const b = $("#body"); if (!b) return; if (LVV && tab !== "level") { LVV.off(); LVV = null; } ({ level: rLevel, objects: rObjects, rules: rRules, art: rArt, sound: rSound, settings: rSettings }[tab])(b); }

/* ---------- LEVEL ---------- */
let LVV = null, curLv = 0, brush = null, tool = "paint", zoomL = 2;
function rLevel(b) {
  if (curLv >= P.levels.length) curLv = 0; const L = P.levels[curLv];
  if (!brush || !P.objects[brush]) brush = Object.keys(P.objects)[0];
  b.innerHTML = `<div class="pane lv">
    <div class="lv-bar"><select id="lvSel">${P.levels.map((l, i) => `<option value="${i}" ${i === curLv ? "selected" : ""}>${i + 1}. ${esc(l.name || "Level")}</option>`).join("")}</select>
      <button class="ib sm" id="lvAdd">+ Level</button><button class="ib sm" id="lvMenu">⋯</button>
      <div class="seg2" id="tools"><button data-tool="paint" class="${tool === "paint" ? "on" : ""}">✏️ Paint</button><button data-tool="erase" class="${tool === "erase" ? "on" : ""}">🧽 Erase</button><button data-tool="pan" class="${tool === "pan" ? "on" : ""}">✋ Move</button></div>
      <button class="ib sm" id="zo">−</button><button class="ib sm" id="zi">+</button>
      <span class="hint" style="margin:0">${L.w}×${L.h} tiles</span></div>
    <div class="lv-view" id="lvv"></div>
    <div class="pal" id="pal">${Object.keys(P.objects).sort((a, c) => KIND_ORDER.indexOf(P.objects[a].kind) - KIND_ORDER.indexOf(P.objects[c].kind)).map((id) => `<button data-o="${esc(id)}" class="${id === brush ? "on" : ""}">${thumbHTML(P.objects[id].sprite)}<span>${esc(P.objects[id].name)}</span></button>`).join("")}<button id="newObj"><b style="font-size:22px;line-height:32px">+</b><span>New object</span></button></div></div>`;
  hydrateThumbs(b);
  $("#lvSel").onchange = (e) => { curLv = +e.target.value; render(); };
  $("#lvAdd").onclick = () => edit(() => { const l = E.blankLevel(L.w, L.h, "Level " + (P.levels.length + 1)); const g = Object.keys(P.objects).find((k) => P.objects[k].kind === "wall"); if (g) l.rows[l.h - 1] = P.objects[g].ch.repeat(l.w); P.levels.push(l); curLv = P.levels.length - 1; });
  $("#lvMenu").onclick = () => levelMenu(L);
  $$("#tools [data-tool]").forEach((x) => (x.onclick = () => { tool = x.dataset.tool; $$("#tools [data-tool]").forEach((y) => y.classList.toggle("on", y === x)); }));
  $$("#pal [data-o]").forEach((x) => (x.onclick = () => { brush = x.dataset.o; if (tool === "pan" || tool === "erase") tool = "paint"; $$("#pal [data-o]").forEach((y) => y.classList.toggle("on", y === x)); $$("#tools [data-tool]").forEach((y) => y.classList.toggle("on", y.dataset.tool === tool)); }));
  $("#newObj").onclick = () => { tab = "objects"; newObject(); };
  $("#zo").onclick = () => { zoomL = Math.max(0.75, zoomL / 1.25); LVV && LVV.draw(); };
  $("#zi").onclick = () => { zoomL = Math.min(6, zoomL * 1.25); LVV && LVV.draw(); };
  if (LVV) LVV.off(); LVV = levelView($("#lvv"));
}
function levelMenu(L) {
  dialog(`<h3>Level settings</h3><div class="fld"><label>Name</label><input id="ln" value="${esc(L.name || "")}" maxlength="30"></div>
    <div class="row2"><div class="fld"><label>Width (tiles)</label><input id="lw" type="number" min="8" max="200" value="${L.w}"></div><div class="fld"><label>Height (tiles)</label><input id="lh" type="number" min="6" max="60" value="${L.h}"></div></div>
    <div class="row2" style="margin-top:6px"><button class="ib" data-act="up">Move earlier</button><button class="ib" data-act="dup">Duplicate</button><button class="ib dang" data-act="del">Delete level</button></div>
    <div class="row2" style="margin-top:14px;justify-content:flex-end"><button class="ib pri" data-act="ok">Done</button></div>`, (d, close) => {
    $$("[data-act]", d).forEach((b) => (b.onclick = () => {
      const a = b.dataset.act;
      if (a === "ok") { const nw = Math.max(8, Math.min(200, +$("#lw", d).value || L.w)), nh = Math.max(6, Math.min(60, +$("#lh", d).value || L.h)); edit(() => { L.name = $("#ln", d).value.slice(0, 30); resizeLevel(L, nw, nh); }); close(); }
      if (a === "dup") { edit(() => { P.levels.splice(curLv + 1, 0, JSON.parse(JSON.stringify(L))); P.levels[curLv + 1].name += " copy"; curLv++; }); close(); }
      if (a === "up" && curLv > 0) { edit(() => { const t = P.levels[curLv - 1]; P.levels[curLv - 1] = L; P.levels[curLv] = t; curLv--; }); close(); }
      if (a === "del") { if (P.levels.length < 2) { toast("A game needs at least one level."); return; } if (!confirm("Delete this level?")) return; edit(() => { P.levels.splice(curLv, 1); curLv = Math.max(0, curLv - 1); }); close(); }
    }));
  });
}
function resizeLevel(L, w, h) { const rows = [], off = h - L.h; for (let r = 0; r < h; r++) { const src = L.rows[r - off] || ""; let row = ""; for (let q = 0; q < w; q++) row += (q < L.w && src[q]) || "."; rows.push(row); } L.rows = rows; L.w = w; L.h = h; }
function levelView(host) {
  const cv = document.createElement("canvas"), x = cv.getContext("2d"); host.appendChild(cv);
  let W = 0, H = 0, dpr = 1, ox = 0, oy = 0, painting = false, pan = null, pts = new Map(), pinch = null, lastCell = null, stroke = false;
  const L = () => P.levels[curLv];
  function size() { dpr = Math.min(2, devicePixelRatio || 1); const r = host.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; }
  function fit() { const l = L(), z = Math.min((W - 20) / (l.w * 16), (H - 20) / (l.h * 16)); zoomL = Math.max(0.75, Math.min(4, z < 1.4 && H > 300 ? Math.max(z, (H - 20) / (l.h * 16)) : z)); ox = 10; oy = Math.max(10, (H - l.h * 16 * zoomL) / 2); }
  function draw() {
    const l = L(), z = zoomL; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.imageSmoothingEnabled = false; x.fillStyle = "#0a0820"; x.fillRect(0, 0, W, H);
    x.save(); x.translate(ox, oy); x.beginPath(); x.rect(0, 0, l.w * 16 * z, l.h * 16 * z); x.clip();
    const bg = document.createElement("canvas"); bg.width = Math.min(4000, l.w * 16 * z); bg.height = Math.min(3000, l.h * 16 * z); E.drawBG(bg.getContext("2d"), P, bg.width, bg.height, 0, 0, 0); x.drawImage(bg, 0, 0, l.w * 16 * z, l.h * 16 * z);
    const byc = E.objByChar(P);
    for (let r = 0; r < l.h; r++) for (let q = 0; q < l.w; q++) { const id = byc[l.rows[r][q]]; if (!id) continue; const s = E.spriteCanvas(P, P.objects[id].sprite, 0); if (s) x.drawImage(s, q * 16 * z, r * 16 * z, 16 * z, 16 * z); }
    x.strokeStyle = "rgba(255,255,255,.08)"; x.lineWidth = 1; x.beginPath(); for (let q = 0; q <= l.w; q++) { x.moveTo(q * 16 * z + 0.5, 0); x.lineTo(q * 16 * z + 0.5, l.h * 16 * z); } for (let r = 0; r <= l.h; r++) { x.moveTo(0, r * 16 * z + 0.5); x.lineTo(l.w * 16 * z, r * 16 * z + 0.5); } x.stroke();
    x.restore(); x.strokeStyle = "rgba(124,77,255,.8)"; x.lineWidth = 2; x.strokeRect(ox, oy, l.w * 16 * z, l.h * 16 * z);
  }
  function cellAt(e) { const r = cv.getBoundingClientRect(), l = L(), q = Math.floor((e.clientX - r.left - ox) / (16 * zoomL)), rr = Math.floor((e.clientY - r.top - oy) / (16 * zoomL)); return q >= 0 && q < l.w && rr >= 0 && rr < l.h ? [q, rr] : null; }
  function put(c) {
    if (!c) return; const l = L(), ch = tool === "erase" ? "." : P.objects[brush].ch, key = c.join(",");
    if (lastCell === key) return; lastCell = key; if (l.rows[c[1]][c[0]] === ch) return;
    if (!stroke) { snapshot(); stroke = true; }
    if (tool !== "erase" && P.objects[brush].kind === "player") { const old = P.objects[brush].ch; l.rows = l.rows.map((row) => row.split(old).join(".")); }
    const row = l.rows[c[1]].split(""); row[c[0]] = ch; l.rows[c[1]] = row.join(""); draw(); mark();
  }
  const pd = (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { painting = false; const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoomL, ox, oy, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; return; }
    if (tool === "pan" || e.button === 1 || e.button === 2) { pan = { x: e.clientX, y: e.clientY, ox, oy }; return; }
    painting = true; stroke = false; lastCell = null; put(cellAt(e)); };
  const pm = (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomL = Math.max(0.75, Math.min(6, pinch.z * d / pinch.d)); ox = pinch.ox + ((a.x + b.x) / 2 - pinch.cx); oy = pinch.oy + ((a.y + b.y) / 2 - pinch.cy); draw(); return; }
    if (pan) { ox = pan.ox + e.clientX - pan.x; oy = pan.oy + e.clientY - pan.y; draw(); return; } if (painting) put(cellAt(e)); };
  const pu = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; painting = false; pan = null; lastCell = null; };
  cv.addEventListener("pointerdown", pd); cv.addEventListener("pointermove", pm); cv.addEventListener("pointerup", pu); cv.addEventListener("pointercancel", pu); cv.addEventListener("contextmenu", (e) => e.preventDefault());
  cv.addEventListener("wheel", (e) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) { const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, nz = Math.max(0.75, Math.min(6, zoomL * (e.deltaY < 0 ? 1.1 : 0.9))); ox = mx - (mx - ox) * nz / zoomL; oy = my - (my - oy) * nz / zoomL; zoomL = nz; } else { ox -= e.deltaX || (e.shiftKey ? e.deltaY : 0); oy -= e.shiftKey ? 0 : e.deltaY; } draw(); }, { passive: false });
  const ro = new ResizeObserver(() => { size(); draw(); }); ro.observe(host); size(); fit(); draw();
  return { draw, off() { ro.disconnect(); } };
}

/* ---------- OBJECTS ---------- */
let curObj = null;
function newObject() {
  edit(() => { const ch = E.nextChar(P); if (!ch) { toast("That's the maximum number of objects."); return; } const id = "o" + Date.now().toString(36); const sid = "s" + Date.now().toString(36);
    P.sprites[sid] = { name: "New sprite", frames: [ART.gem[0]], fps: 6 }; P.objects[id] = { name: "New object", ch, sprite: sid, kind: "item", behaviors: [] }; curObj = id; brush = id; });
}
function rObjects(b) {
  const ids = Object.keys(P.objects); if (!curObj || !P.objects[curObj]) curObj = ids[0];
  const o = P.objects[curObj];
  b.innerHTML = `<div class="pane"><div class="grid2"><div><div class="list">${ids.map((id) => `<button class="li ${id === curObj ? "on" : ""}" data-o="${esc(id)}">${thumbHTML(P.objects[id].sprite)}<span>${esc(P.objects[id].name)}<small>${E.KINDS[P.objects[id].kind] || P.objects[id].kind}</small></span></button>`).join("")}</div><button class="ib" id="add" style="margin-top:10px;width:100%">+ New object</button></div>
    <div class="card2">${o ? `<div class="row2"><div class="fld"><label>Name</label><input id="on" value="${esc(o.name)}" maxlength="24"></div><div class="fld"><label>Type</label><select id="ok">${Object.keys(E.KINDS).map((k) => `<option value="${k}" ${k === o.kind ? "selected" : ""}>${E.KINDS[k]}</option>`).join("")}</select></div></div>
      <div class="fld"><label>Look</label><div class="row2" style="align-items:center">${thumbHTML(o.sprite, "prev")}<select id="os">${Object.keys(P.sprites).map((s) => `<option value="${esc(s)}" ${s === o.sprite ? "selected" : ""}>${esc(P.sprites[s].name)}</option>`).join("")}</select><button class="ib sm" id="oart">Draw it</button></div></div>
      ${o.kind === "wall" ? `<label class="sl"><input type="checkbox" id="osolid" ${o.solid !== false ? "checked" : ""} style="flex:none"> Solid (things can't pass through)</label>` : ""}
      ${o.kind === "projectile" ? `<div class="fld"><label>Sound when fired</label><select id="osnd">${Object.keys(E.SOUNDS).map((s) => `<option ${s === (o.sound || "shoot") ? "selected" : ""}>${s}</option>`).join("")}</select></div>` : ""}
      <h3 style="margin-top:14px">Behaviors</h3><p class="hint">Behaviors make an object move or act on its own. ${o.kind === "wall" && !(o.behaviors || []).length ? "Walls with no behaviors are fixed tiles." : ""}</p>
      <div id="behs">${(o.behaviors || []).map((bh, i) => behHTML(bh, i)).join("") || '<div class="empty" style="padding:8px">No behaviors yet.</div>'}</div>
      <div class="row2"><select id="addB"><option value="">+ Add a behavior…</option>${Object.keys(E.BEHAVIORS).map((k) => `<option value="${k}">${E.BEHAVIORS[k].name}</option>`).join("")}</select></div>
      <div class="row2" style="margin-top:18px;justify-content:space-between"><button class="ib sm" id="odup">Duplicate</button><button class="ib sm dang" id="odel">Delete object</button></div>` : '<div class="empty">No objects.</div>'}</div></div></div>`;
  hydrateThumbs(b);
  $$("[data-o]", b).forEach((x) => (x.onclick = () => { curObj = x.dataset.o; render(); }));
  $("#add", b).onclick = newObject;
  if (!o) return;
  $("#on", b).oninput = (e) => { o.name = e.target.value || "Object"; mark(); };
  $("#on", b).onchange = () => setTimeout(() => { if (tab === "objects") render(); }, 0);
  $("#ok", b).onchange = (e) => edit(() => { o.kind = e.target.value; if (o.kind === "wall" && o.solid == null) o.solid = true; });
  $("#os", b).onchange = (e) => edit(() => { o.sprite = e.target.value; });
  $("#oart", b).onclick = () => { curSpr = o.sprite; tab = "art"; $$("#tabs [data-t]").forEach((y) => y.classList.toggle("on", y.dataset.t === "art")); render(); };
  const sol = $("#osolid", b); if (sol) sol.onchange = (e) => edit(() => { o.solid = e.target.checked; });
  const sn = $("#osnd", b); if (sn) sn.onchange = (e) => { o.sound = e.target.value; E.playSound(o.sound); mark(); };
  $("#addB", b).onchange = (e) => { const t = e.target.value; if (!t) return; edit(() => { const nb = { t }; if (E.BEHAVIORS[t].o) Object.assign(nb, E.BEHAVIORS[t].o); o.behaviors = (o.behaviors || []).concat([nb]); }); };
  $$("[data-bdel]", b).forEach((x) => (x.onclick = () => edit(() => o.behaviors.splice(+x.dataset.bdel, 1))));
  $$("[data-bp]", b).forEach((x) => (x.oninput = () => { const [i, k] = x.dataset.bp.split(":"); o.behaviors[+i][k] = +x.value; const out = x.parentNode.querySelector("output"); if (out) out.textContent = x.value; mark(); }));
  $$("[data-bo]", b).forEach((x) => (x.onchange = () => { const [i, k] = x.dataset.bo.split(":"); edit(() => { o.behaviors[+i][k] = x.value; }); }));
  $("#odel", b).onclick = () => { if (!confirm(`Delete "${o.name}"? It's removed from every level and rule.`)) return; edit(() => { const ch = o.ch; P.levels.forEach((l) => (l.rows = l.rows.map((r) => r.split(ch).join(".")))); P.rules = P.rules.filter((r) => r.when.a !== curObj && r.when.b !== curObj).map((r) => Object.assign(r, { do: r.do.filter((a) => a.o !== curObj) })); delete P.objects[curObj]; curObj = null; }); };
  $("#odup", b).onclick = () => edit(() => { const ch = E.nextChar(P); if (!ch) return; const id = "o" + Date.now().toString(36); P.objects[id] = JSON.parse(JSON.stringify(o)); P.objects[id].ch = ch; P.objects[id].name = o.name + " 2"; curObj = id; });
}
function behHTML(bh, i) {
  const d = E.BEHAVIORS[bh.t]; if (!d) return "";
  let h = `<div class="beh"><div class="h"><b>${d.name}</b><button class="x" data-bdel="${i}" title="Remove">×</button></div><small>${d.desc}</small>`;
  for (const k in d.p) { const [def, mn, mx] = d.p[k], v = bh[k] != null ? bh[k] : def, step = mx <= 10 ? 0.05 : 1; h += `<label class="sl">${k}<input type="range" min="${mn}" max="${mx}" step="${step}" value="${v}" data-bp="${i}:${k}"><output>${v}</output></label>`; }
  if (d.o && "bullet" in d.o) h += `<div class="sl">Fires <select data-bo="${i}:bullet"><option value="">(pick a projectile)</option>${Object.keys(P.objects).filter((id) => P.objects[id].kind === "projectile").map((id) => `<option value="${esc(id)}" ${id === bh.bullet ? "selected" : ""}>${esc(P.objects[id].name)}</option>`).join("")}</select></div>`;
  if (d.o && "aim" in d.o) h += `<div class="sl">Aim <select data-bo="${i}:aim"><option value="player" ${bh.aim === "player" ? "selected" : ""}>at the player</option><option value="facing" ${bh.aim !== "player" ? "selected" : ""}>straight ahead</option></select></div>`;
  return h + "</div>";
}

/* ---------- RULES ---------- */
function rRules(b) {
  ensureArr();
  b.innerHTML = `<div class="pane"><p class="hint">Rules are how your game works: <b>When</b> something happens → <b>Do</b> these things. They run top to bottom.</p><div id="rules">${P.rules.map((r, i) => ruleHTML(r, i)).join("")}</div><button class="ib pri" id="addR">+ New rule</button></div>`;
  $("#addR", b).onclick = () => edit(() => { const pl = Object.keys(P.objects).find((k) => P.objects[k].kind === "player"), it = Object.keys(P.objects).find((k) => P.objects[k].kind === "item") || pl; P.rules.push({ when: { t: "touch", a: pl, b: it }, do: [{ t: "score", n: 10 }] }); });
  const R = (el) => P.rules[+el.closest("[data-r]").dataset.r];
  $$("[data-w]", b).forEach((el) => (el.onchange = () => edit(() => { const r = R(el), k = el.dataset.w; if (k === "t") { r.when = { t: el.value }; const ev = E.EVENTS[el.value]; if (ev.o) { r.when.a = firstOf("player"); if (ev.o.length > 1) r.when.b = firstOf("item"); } if (ev.p) Object.assign(r.when, ev.p); if (ev.k) r.when.k = "a"; if (ev.v) r.when.v = "x"; if (el.value === "tap") r.when.a = "screen"; } else r.when[k] = el.type === "number" ? +el.value : el.value; })));
  $$("[data-ad]", b).forEach((el) => (el.onclick = () => edit(() => R(el).do.splice(+el.dataset.ad, 1))));
  $$("[data-aa]", b).forEach((el) => (el.onchange = () => { if (!el.value) return; edit(() => { const a = { t: el.value }, d = E.ACTIONS[el.value]; if (d.p) Object.assign(a, d.p); if (d.who) a.who = "b"; if (d.o) { a.o = Object.keys(P.objects)[0]; a.at = "random"; } if (d.s) a.s = "coin"; if (d.t) a.txt = "Nice!"; if (d.v) a.v = "x"; R(el).do.push(a); }); }));
  $$("[data-ap]", b).forEach((el) => (el.onchange = () => { const [i, k] = el.dataset.ap.split(":"); edit(() => { R(el).do[+i][k] = el.type === "number" ? +el.value : el.value; if (k === "s") E.playSound(el.value); }); }));
  $$("[data-rdel]", b).forEach((el) => (el.onclick = () => edit(() => P.rules.splice(+el.dataset.rdel, 1))));
  $$("[data-rup]", b).forEach((el) => (el.onclick = () => edit(() => { const i = +el.dataset.rup; if (i > 0) { const t = P.rules[i - 1]; P.rules[i - 1] = P.rules[i]; P.rules[i] = t; } })));
  $$("[data-play]", b).forEach((el) => (el.onclick = () => E.playSound(el.dataset.play)));
}
const firstOf = (k) => Object.keys(P.objects).find((id) => P.objects[id].kind === k) || Object.keys(P.objects)[0];
function ruleHTML(r, i) {
  const w = r.when, ev = E.EVENTS[w.t] || E.EVENTS.start, nm = (id) => (P.objects[id] ? P.objects[id].name : "?");
  let wh = "";
  if (w.t === "touch") wh = `<select data-w="a">${objOpts(w.a)}</select><select data-w="t">${evOpts(w.t)}</select><select data-w="b">${objOpts(w.b)}</select>`;
  else if (w.t === "tap") wh = `<select data-w="a">${objOpts(w.a, `<option value="screen" ${w.a === "screen" ? "selected" : ""}>The screen</option>`)}</select><select data-w="t">${evOpts(w.t)}</select>`;
  else if (w.t === "count") wh = `<select data-w="t">${evOpts(w.t)}</select><select data-w="a">${objOpts(w.a)}</select>`;
  else { wh = `<select data-w="t">${evOpts(w.t)}</select>`; if (w.t === "every") wh += `<input type="number" min="0.2" step="0.1" data-w="sec" value="${w.sec || 3}"> sec`; if (w.t === "score") wh += `<input type="number" data-w="n" value="${w.n || 0}">`; if (w.t === "key") wh += `<select data-w="k">${["a", "b", "up", "down", "left", "right"].map((k) => `<option ${k === w.k ? "selected" : ""}>${k}</option>`).join("")}</select>`; if (w.t === "vars") wh += `<input class="txt" style="width:90px" data-w="v" value="${esc(w.v || "x")}" maxlength="16"> ≥ <input type="number" data-w="n" value="${w.n || 0}">`; }
  const whoOpts = (sel) => { let o = ""; if (w.t === "touch") o += `<option value="a" ${sel === "a" ? "selected" : ""}>the ${esc(nm(w.a))}</option><option value="b" ${sel === "b" ? "selected" : ""}>the ${esc(nm(w.b))}</option>`; else if (w.t === "tap" && w.a !== "screen") o += `<option value="a" ${sel === "a" || sel === "b" ? "selected" : ""}>the tapped ${esc(nm(w.a))}</option>`; o += `<option value="player" ${sel === "player" ? "selected" : ""}>the player</option>`; return o; };
  const acts = r.do.map((a, j) => { const d = E.ACTIONS[a.t] || {}; let h = `<div class="a"><b style="font-size:14px">${d.name || a.t}</b>`;
    if (d.who) h += `<select data-ap="${j}:who">${whoOpts(a.who)}</select>`;
    if (d.o) h += `<select data-ap="${j}:o">${objOpts(a.o)}</select> at <select data-ap="${j}:at">${["random", "player", "a", "b"].map((k) => `<option value="${k}" ${k === a.at ? "selected" : ""}>${k === "random" ? "a random spot" : k === "player" ? "the player" : k === "a" ? "the first one" : "the second one"}</option>`).join("")}</select>`;
    if (d.s) h += `<select data-ap="${j}:s">${Object.keys(E.SOUNDS).map((s) => `<option ${s === a.s ? "selected" : ""}>${s}</option>`).join("")}</select><button class="x" data-play="${esc(a.s)}" title="Preview">▶</button>`;
    if (d.t) h += `<input class="txt" data-ap="${j}:txt" value="${esc(a.txt || "")}" maxlength="40">`;
    if (d.v) h += `<input class="txt" style="width:90px" data-ap="${j}:v" value="${esc(a.v || "x")}" maxlength="16"> by`;
    if (d.p) for (const k in d.p) h += `<input type="number" step="${k === "sec" || a.t === "speed" ? 0.1 : 1}" data-ap="${j}:${k}" value="${a[k] != null ? a[k] : d.p[k]}">${k === "sec" ? " sec" : ""}`;
    return h + `<button class="x" data-ad="${j}" title="Remove">×</button></div>`; }).join("");
  return `<div class="rule" data-r="${i}"><div class="w"><span class="lab when">WHEN</span>${wh}<span class="sp" style="flex:1"></span>${i ? `<button class="x" data-rup="${i}" title="Move up">↑</button>` : ""}<button class="x" data-rdel="${i}" title="Delete rule">🗑</button></div>
    <div class="acts"><span class="lab do" style="align-self:flex-start">DO</span>${acts}<select data-aa="1" style="align-self:flex-start"><option value="">+ add an action…</option>${Object.keys(E.ACTIONS).map((k) => `<option value="${k}">${E.ACTIONS[k].name}</option>`).join("")}</select></div></div>`;
}
const evOpts = (sel) => Object.keys(E.EVENTS).map((k) => `<option value="${k}" ${k === sel ? "selected" : ""}>${E.EVENTS[k].name}</option>`).join("");

/* ---------- ART ---------- */
let curSpr = null, curFr = 0, color = "8", ptool = "pen", animT = null;
function rArt(b) {
  const ids = Object.keys(P.sprites); if (!curSpr || !P.sprites[curSpr]) curSpr = ids[0]; const s = P.sprites[curSpr]; if (curFr >= s.frames.length) curFr = 0;
  const pal = P.palette || (P.palette = E.PALETTE.slice());
  b.innerHTML = `<div class="pane"><div class="grid2"><div><div class="list">${ids.map((id) => `<button class="li ${id === curSpr ? "on" : ""}" data-s="${esc(id)}">${thumbHTML(id)}<span>${esc(P.sprites[id].name)}<small>${P.sprites[id].frames.length} frame${P.sprites[id].frames.length > 1 ? "s" : ""}</small></span></button>`).join("")}</div>
      <div class="row2" style="margin-top:10px"><button class="ib sm" id="sNew">+ Blank</button><button class="ib sm" id="sDup">Duplicate</button><button class="ib sm" id="sLib">From library</button></div></div>
    <div class="card2"><div class="row2" style="align-items:flex-end"><div class="fld"><label>Sprite name</label><input id="sn" value="${esc(s.name)}" maxlength="24"></div><button class="ib sm dang" id="sDel" style="margin-bottom:12px">Delete</button></div>
      <div class="px-wrap"><canvas class="px-cv" id="pcv" width="384" height="384"></canvas>
      <div style="min-width:220px;flex:1"><div class="seg2" id="ptools" style="width:max-content;margin-bottom:10px">${[["pen", "✏️"], ["erase", "🧽"], ["fill", "🪣"], ["pick", "💧"]].map(([k, l]) => `<button data-pt="${k}" class="${k === ptool ? "on" : ""}" title="${k}">${l}</button>`).join("")}</div>
        <div class="swatches" id="sw">${pal.map((c, i) => `<button data-c="${i.toString(16)}" style="background:${c}" class="${i.toString(16) === color ? "on" : ""}" title="Double-click to change"></button>`).join("")}</div>
        <p class="hint" style="margin-top:8px">Double-click (or long-press) a color to change it. Colors are shared by the whole game.</p>
        <div class="row2"><button class="ib sm" id="flip">↔ Mirror</button><button class="ib sm" id="clr">Clear</button></div>
        <div class="fl" style="margin-top:14px">Frames</div><div class="frames" id="frs">${s.frames.map((f, i) => `<button data-f="${i}" class="${i === curFr ? "on" : ""}"><canvas data-spr="${esc(curSpr)}" data-f="${i}" width="16" height="16"></canvas></button>`).join("")}<button id="fAdd" title="Add frame" style="font-size:22px;color:#fff">+</button></div>
        <div class="row2" style="margin-top:8px"><button class="ib sm" id="fDel" ${s.frames.length < 2 ? "disabled" : ""}>Delete frame</button><label class="sl" style="margin:0">Speed<input type="range" min="1" max="16" value="${s.fps || 6}" id="fps"><output>${s.fps || 6}</output></label></div>
        <div class="fl" style="margin-top:12px">Preview</div><canvas class="prev" id="prev" width="16" height="16"></canvas></div></div></div></div></div>`;
  hydrateThumbs(b);
  const pcv = $("#pcv", b), px = pcv.getContext("2d");
  function drawPx() { px.clearRect(0, 0, 384, 384); const f = s.frames[curFr]; for (let i = 0; i < 256; i++) { const ch = f[i]; if (ch !== ".") { px.fillStyle = pal[parseInt(ch, 16)]; px.fillRect((i % 16) * 24, ((i / 16) | 0) * 24, 24, 24); } } px.strokeStyle = "rgba(255,255,255,.08)"; for (let k = 0; k <= 16; k++) { px.beginPath(); px.moveTo(k * 24 + 0.5, 0); px.lineTo(k * 24 + 0.5, 384); px.moveTo(0, k * 24 + 0.5); px.lineTo(384, k * 24 + 0.5); px.stroke(); } }
  drawPx();
  let down = false, stroke = false;
  const setPx = (e) => { const r = pcv.getBoundingClientRect(), q = Math.floor((e.clientX - r.left) / r.width * 16), rr = Math.floor((e.clientY - r.top) / r.height * 16); if (q < 0 || q > 15 || rr < 0 || rr > 15) return; const i = rr * 16 + q, f = s.frames[curFr].split("");
    if (ptool === "pick") { if (f[i] !== ".") { color = f[i]; $$("#sw [data-c]", b).forEach((x) => x.classList.toggle("on", x.dataset.c === color)); ptool = "pen"; $$("#ptools [data-pt]", b).forEach((x) => x.classList.toggle("on", x.dataset.pt === "pen")); } return; }
    if (!stroke) { snapshot(); stroke = true; }
    if (ptool === "fill") { const from = f[i], to = color; if (from === to) return; const st = [i]; while (st.length) { const k = st.pop(); if (f[k] !== from) continue; f[k] = to; const kx = k % 16; if (kx > 0) st.push(k - 1); if (kx < 15) st.push(k + 1); if (k >= 16) st.push(k - 16); if (k < 240) st.push(k + 16); } }
    else f[i] = ptool === "erase" ? "." : color;
    s.frames[curFr] = f.join(""); drawPx(); mark(); refreshThumbs(); };
  const refreshThumbs = () => { hydrateThumbs(b); };
  pcv.addEventListener("pointerdown", (e) => { pcv.setPointerCapture(e.pointerId); down = true; stroke = false; setPx(e); });
  pcv.addEventListener("pointermove", (e) => { if (down && ptool !== "fill") setPx(e); });
  pcv.addEventListener("pointerup", () => { down = false; });
  $$("#ptools [data-pt]", b).forEach((x) => (x.onclick = () => { ptool = x.dataset.pt; $$("#ptools [data-pt]", b).forEach((y) => y.classList.toggle("on", y === x)); }));
  $$("#sw [data-c]", b).forEach((x) => { x.onclick = () => { color = x.dataset.c; if (ptool === "erase" || ptool === "pick") ptool = "pen"; $$("#sw [data-c]", b).forEach((y) => y.classList.toggle("on", y === x)); $$("#ptools [data-pt]", b).forEach((y) => y.classList.toggle("on", y.dataset.pt === ptool)); };
    const pick = () => { const inp = document.createElement("input"); inp.type = "color"; inp.value = pal[parseInt(x.dataset.c, 16)]; inp.oninput = () => { pal[parseInt(x.dataset.c, 16)] = inp.value; x.style.background = inp.value; drawPx(); mark(); }; inp.onchange = () => render(); inp.click(); };
    x.ondblclick = pick; let lt = null; x.addEventListener("pointerdown", () => { lt = setTimeout(pick, 550); }); x.addEventListener("pointerup", () => clearTimeout(lt)); x.addEventListener("pointerleave", () => clearTimeout(lt)); });
  $("#sn", b).oninput = (e) => { s.name = e.target.value || "Sprite"; mark(); };
  $("#flip", b).onclick = () => edit(() => { const f = s.frames[curFr]; let o = ""; for (let r = 0; r < 16; r++) o += f.slice(r * 16, r * 16 + 16).split("").reverse().join(""); s.frames[curFr] = o; });
  $("#clr", b).onclick = () => edit(() => { s.frames[curFr] = ".".repeat(256); });
  $$("#frs [data-f]", b).forEach((x) => (x.onclick = () => { curFr = +x.dataset.f; render(); }));
  $("#fAdd", b).onclick = () => edit(() => { s.frames.splice(curFr + 1, 0, s.frames[curFr]); curFr++; });
  $("#fDel", b).onclick = () => edit(() => { s.frames.splice(curFr, 1); curFr = Math.max(0, curFr - 1); });
  $("#fps", b).oninput = (e) => { s.fps = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; mark(); };
  $$("[data-s]", b).forEach((x) => (x.onclick = () => { curSpr = x.dataset.s; curFr = 0; render(); }));
  $("#sNew", b).onclick = () => edit(() => { const id = "s" + Date.now().toString(36); P.sprites[id] = { name: "Sprite", frames: [".".repeat(256)], fps: 6 }; curSpr = id; curFr = 0; });
  $("#sDup", b).onclick = () => edit(() => { const id = "s" + Date.now().toString(36); P.sprites[id] = JSON.parse(JSON.stringify(s)); P.sprites[id].name += " 2"; curSpr = id; });
  $("#sDel", b).onclick = () => { const used = Object.values(P.objects).some((o) => o.sprite === curSpr); if (used) { toast("An object still uses this sprite. Change its look first."); return; } if (Object.keys(P.sprites).length < 2) return; edit(() => { delete P.sprites[curSpr]; curSpr = null; }); };
  $("#sLib", b).onclick = () => { dialog(`<h3>Sprite library</h3><p class="hint">Start from one of these and make it your own.</p><div class="lib">${Object.keys(ART).map((k) => `<button data-lib="${k}" title="${k}"><canvas width="16" height="16" data-art="${k}"></canvas></button>`).join("")}</div><div class="row2" style="margin-top:14px;justify-content:flex-end"><button class="ib" data-x>Close</button></div>`, (d, close) => {
    $$("canvas[data-art]", d).forEach((c) => { const f = ART[c.dataset.art][0], x = c.getContext("2d"); for (let i = 0; i < 256; i++) if (f[i] !== ".") { x.fillStyle = pal[parseInt(f[i], 16)]; x.fillRect(i % 16, (i / 16) | 0, 1, 1); } });
    $$("[data-lib]", d).forEach((x) => (x.onclick = () => { const k = x.dataset.lib; edit(() => { const id = "s" + Date.now().toString(36); P.sprites[id] = { name: k[0].toUpperCase() + k.slice(1), frames: ART[k].slice(), fps: 6 }; curSpr = id; curFr = 0; }); close(); }));
    $("[data-x]", d).onclick = close; }); };
  clearInterval(animT); const pv = $("#prev", b); let fi = 0; animT = setInterval(() => { if (!document.body.contains(pv)) { clearInterval(animT); return; } const c = E.spriteCanvas(P, curSpr, fi++); const x = pv.getContext("2d"); x.clearRect(0, 0, 16, 16); if (c) x.drawImage(c, 0, 0); }, 1000 / (s.fps || 6));
}

/* ---------- SOUND ---------- */
function rSound(b) {
  b.innerHTML = `<div class="pane"><div class="card2" style="max-width:760px"><h3>Music</h3><p class="hint">Plays while your game runs.</p><div class="snd">${Object.keys(E.MUSIC).map((k) => `<button class="li ${k === (P.settings.music || "none") ? "on" : ""}" data-m="${k}">${k === "none" ? "🔇" : "🎵"} ${E.MUSIC[k].name}</button>`).join("")}</div>
    <div class="row2" style="margin-top:10px"><button class="ib sm" id="mStop">■ Stop preview</button></div>
    <h3 style="margin-top:22px">Sound effects</h3><p class="hint">Use these in rules with "Play sound". Tap to hear one.</p><div class="snd">${Object.keys(E.SOUNDS).map((k) => `<button class="li" data-sfx="${k}">🔊 ${k}</button>`).join("")}</div></div></div>`;
  $$("[data-m]", b).forEach((x) => (x.onclick = () => { P.settings.music = x.dataset.m; mark(); E.playMusic(x.dataset.m); $$("[data-m]", b).forEach((y) => y.classList.toggle("on", y === x)); }));
  $("#mStop", b).onclick = () => E.stopMusic();
  $$("[data-sfx]", b).forEach((x) => (x.onclick = () => E.playSound(x.dataset.sfx)));
}

/* ---------- SETTINGS ---------- */
function rSettings(b) {
  const S = P.settings;
  b.innerHTML = `<div class="pane"><div class="card2" style="max-width:760px">
    <div class="fld"><label>Title</label><input id="st" value="${esc(P.title)}" maxlength="60"></div>
    <div class="fld"><label>Description (shown on the community page)</label><textarea id="sd" maxlength="300">${esc(P.desc || "")}</textarea></div>
    <div class="row2"><div class="fld"><label>Controls</label><select id="sc">${[["platformer", "Side view: run and jump"], ["topdown", "Top-down: move in 4 directions"], ["runner", "Runner: jump only"], ["tap", "Tap / click only"]].map(([k, n]) => `<option value="${k}" ${k === S.controls ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="fld"><label>Background</label><select id="sb">${Object.keys(E.BG).map((k) => `<option value="${k}" ${k === S.bg ? "selected" : ""}>${E.BG[k]}</option>`).join("")}</select></div>
      ${S.bg === "plain" ? `<div class="fld"><label>Color</label><input type="color" id="sbc" value="${esc(S.bgColor || "#5ec8ff")}"></div>` : ""}</div>
    <label class="sl"><input type="checkbox" id="sg" ${S.gravity ? "checked" : ""} style="flex:none"> Gravity (things fall down)</label>
    ${S.gravity ? `<label class="sl">Gravity strength<input type="range" min="0.4" max="2" step="0.05" id="sgs" value="${S.gravityStr || 1}"><output>${S.gravityStr || 1}</output></label>` : ""}
    <div class="row2" style="margin-top:12px"><div class="fld"><label>Lives</label><input type="number" id="sl" min="1" max="20" value="${S.lives || 3}"></div><div class="fld"><label>Time limit per level (sec, 0 = none)</label><input type="number" id="stm" min="0" max="900" value="${S.timer || 0}"></div></div>
    <p class="hint">Engine: ${esc(engineOf(P).name)} · ${P.levels.length} level${P.levels.length > 1 ? "s" : ""} · ${Object.keys(P.objects).length} objects · ${P.rules.length} rules${P.pubId ? ` · <a href="/arcade/community/play/?id=${encodeURIComponent(P.pubId)}">Published ↗</a>` : ""}${P.remixOf ? ` · remix of <a href="/arcade/community/play/?id=${encodeURIComponent(P.remixOf)}">this game</a>` : ""}</p></div></div>`;
  $("#st", b).oninput = (e) => { P.title = e.target.value || "Untitled"; $("#ttl").value = P.title; mark(); };
  $("#sd", b).oninput = (e) => { P.desc = e.target.value; mark(); };
  $("#sc", b).onchange = (e) => edit(() => { S.controls = e.target.value; if (S.controls === "topdown") S.gravity = false; if (S.controls === "platformer" || S.controls === "runner") S.gravity = true; });
  $("#sb", b).onchange = (e) => edit(() => { S.bg = e.target.value; });
  const sbc = $("#sbc", b); if (sbc) sbc.oninput = (e) => { S.bgColor = e.target.value; mark(); };
  $("#sg", b).onchange = (e) => edit(() => { S.gravity = e.target.checked; });
  const sgs = $("#sgs", b); if (sgs) sgs.oninput = (e) => { S.gravityStr = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; mark(); };
  $("#sl", b).onchange = (e) => edit(() => { S.lives = Math.max(1, Math.min(20, +e.target.value || 3)); }, { noRender: true });
  $("#stm", b).onchange = (e) => edit(() => { S.timer = Math.max(0, Math.min(900, +e.target.value || 0)); }, { noRender: true });
}

/* ---------- dialogs, test, publish ---------- */
function dialog(html, wire) { const d = document.createElement("div"); d.className = "dlg"; d.innerHTML = `<div class="card2">${html}</div>`; document.body.appendChild(d); const close = () => d.remove(); d.addEventListener("click", (e) => { if (e.target === d) close(); }); wire && wire(d, close); return close; }
let GAME = null;
function testPlay() {
  E.audio(); flush();
  const m = document.createElement("div"); m.className = "modal2"; m.innerHTML = `<div class="mh"><b>▶ ${esc(P.title)}</b>${P.engine !== "rush" && P.levels.length > 1 ? `<select id="tl" class="ib sm">${P.levels.map((l, i) => `<option value="${i}" ${i === (curLv || 0) ? "selected" : ""}>Start at ${i + 1}. ${esc(l.name || "Level")}</option>`).join("")}</select>` : ""}<button class="ib sm" id="tr">↻ Restart</button><button class="ib sm" id="tc">✕ Close</button></div><div class="game" id="tg"></div>`;
  document.body.appendChild(m);
  const host = $("#tg", m), eng = engineOf(P);
  const start = (lv) => { if (GAME) GAME.destroy(); $$(".over", host).forEach((o) => o.remove()); GAME = eng.play(host, JSON.parse(JSON.stringify(P)), { level: lv || 0, onEnd: (r) => { if (r.ongoing) return; const o = document.createElement("div"); o.className = "over"; o.innerHTML = `<div class="card2"><h3>${r.won ? "You win!" : "Game over"}</h3><p class="hint">Score ${LZ.fmt(r.score)}. Test runs don't go on the leaderboard.</p><div class="row2" style="justify-content:center"><button class="ib go" data-again>Play again</button><button class="ib" data-close>Back to editing</button></div></div>`; host.appendChild(o); $("[data-again]", o).onclick = () => start(lv); $("[data-close]", o).onclick = close; } }); window.__GAME = GAME; };
  const close = () => { if (GAME) GAME.destroy(); GAME = null; E.stopMusic(); m.remove(); };
  $("#tr", m).onclick = () => start($("#tl", m) ? +$("#tl", m).value : 0); $("#tc", m).onclick = close; const tl = $("#tl", m); if (tl) tl.onchange = () => start(+tl.value);
  const esc2 = (e) => { if (e.key === "Escape") { close(); window.removeEventListener("keydown", esc2); } }; window.addEventListener("keydown", esc2);
  start(tl ? +tl.value : 0);
}
async function doPublish() {
  await flush();
  const errs = P.engine === "rush" ? (await import("/arcade/engines/rush/kit.js")).validate(P) : E.validate(P);
  if (errs.length) { dialog(`<h3>Almost there</h3><p class="hint">Fix these before publishing:</p><ul>${errs.map((e) => `<li>${esc(e)}</li>`).join("")}</ul><div class="row2" style="justify-content:flex-end"><button class="ib" data-x>OK</button></div>`, (d, c) => ($("[data-x]", d).onclick = c)); return; }
  if (!LZ.signedIn()) { dialog(`<h3>Sign in to publish</h3><p class="hint">Your game goes up under your Carzzy Apps username, with its own leaderboard. You earn creator LP when people play it.</p><div class="row2" style="justify-content:flex-end"><button class="ib" data-x>Not now</button><button class="ib pri" data-s>Sign in</button></div>`, (d, c) => { $("[data-x]", d).onclick = c; $("[data-s]", d).onclick = () => { c(); LZ.openAccount("signin"); }; }); return; }
  const close = dialog(`<h3>${P.pubId ? "Update your published game" : "Publish to the Community"}</h3><p class="hint">${P.pubId ? "Players get the new version right away. Scores and likes stay." : "Anyone can play it, like it and remix it. You can update it any time."}</p>
    <div class="fld"><label>Title</label><input id="pt" value="${esc(P.title)}" maxlength="60"></div><div class="fld"><label>Description</label><textarea id="pdsc" maxlength="300">${esc(P.desc || "")}</textarea></div>
    <p class="hint">By publishing you confirm you made this (or remixed it here) and it's okay for all ages.</p><div class="err" style="color:#ff8a9a;font-weight:700;min-height:20px"></div>
    <div class="row2" style="justify-content:flex-end"><button class="ib" data-x>Cancel</button><button class="ib pri" data-go>${P.pubId ? "Update" : "Publish"}</button></div>`, (d, c) => {
    $("[data-x]", d).onclick = c;
    $("[data-go]", d).onclick = async (ev) => {
      const btn = ev.target; btn.disabled = true; btn.textContent = "Publishing…"; P.title = $("#pt", d).value.trim() || "Untitled"; P.desc = $("#pdsc", d).value.trim();
      try {
        const thumb = P.engine === "rush" ? (await import("/arcade/engines/rush/kit.js")).thumb(P) : E.renderLevel(P, 0, 320, 180, { focusPlayer: true }).toDataURL("image/jpeg", 0.8);
        const id = await C.publish(P, thumb, P.pubId); P.pubId = id; await flush(); c();
        dialog(`<h3>🎉 It's live!</h3><p class="hint">Share the link. Every play and like earns you creator LP.</p><div class="fld"><input readonly value="${location.origin}/arcade/community/play/?id=${encodeURIComponent(id)}" onclick="this.select()"></div><div class="row2" style="justify-content:flex-end"><button class="ib" data-x>Keep editing</button><a class="ib pri" href="/arcade/community/play/?id=${encodeURIComponent(id)}">Play it</a></div>`, (d2, c2) => ($("[data-x]", d2).onclick = c2));
        if ($("#ttl")) $("#ttl").value = P.title;
      } catch (e) { console.warn(e); $(".err", d).textContent = e.code === "size" ? "This game is too big to publish. Try fewer or smaller levels." : "Couldn't publish right now (" + (e.code || "error") + "). Try again in a moment."; btn.disabled = false; btn.textContent = "Publish"; }
    };
  });
}

/* ================= boot ================= */
await LZ.ready;
if (qs.get("remix")) {
  const g = await C.getGame(qs.get("remix"));
  if (g && g.data) { const p = JSON.parse(g.data); delete p.pubId; await newProject(p, g.id); } else home();
} else if (qs.get("p")) editor(qs.get("p")); else home();
window.__STUDIO = { get P() { return P; }, flush, edit, render, setTab(t) { tab = t; render(); } };
