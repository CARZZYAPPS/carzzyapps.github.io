// Lazer Studio — Crane kit. Editor over the Harbor Rush "Crane" engine.
// A project's data lives in P.pack: { titleKick, titleMain, desc, noEndless, ports:[ {id,name,tag,need,th,rules,lv:[params]} ] }.
// Each level's params: c ship-cols · h max-stack · f fill · y yard-cols · l truck-lanes · n trucks · p patience(s) · k colors · par(s)
//                      optional: w wind · r reefer-share · pw powered-slots · z hazmat-share · tut tutorial.
// The engine lays out the port from these numbers (it's a physics crane, not a tile grid), so tuning them IS the level design.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nid = (p) => p + Date.now().toString(36).slice(-4) + Math.floor(Math.random() * 100);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const RULES = { wind: "Wind — gusts shove the load sideways", reefer: "Reefers — refrigerated boxes thaw off-ship", hazmat: "Hazmat — clang a hazmat box, lose a heart", night: "Night shift — dark harbor" };
const THEME_FIELDS = [["sky", "Sky top"], ["sky2", "Sky bottom"], ["sea", "Sea top"], ["sea2", "Sea deep"], ["quay", "Quay"], ["quay2", "Quay shade"], ["crane", "Crane"], ["hull", "Ship hull"], ["city", "Skyline"]];

const THEMES = {
  day: { sky: ["#7fc8ff", "#dff3ff"], sea: ["#2a8fd0", "#0f4f85"], quay: "#cfc7b8", quay2: "#a99f8d", crane: "#ffb21a", hull: "#d8402f", city: "#9cc6e6" },
  gale: { sky: ["#93aec6", "#e6eef5"], sea: ["#3d7da6", "#173f61"], quay: "#bdbbb3", quay2: "#93918a", crane: "#ee5a2f", hull: "#2d5f8f", city: "#a9bccd" },
  frost: { sky: ["#bfe0f5", "#f5fbff"], sea: ["#4a8fb3", "#1f5a7a"], quay: "#e3eaef", quay2: "#b9c6cf", crane: "#22a39e", hull: "#39404c", city: "#cfe1ee", snow: 1 },
  night: { night: 1, sky: ["#0b1530", "#26365f"], sea: ["#16395a", "#081a2d"], quay: "#757a83", quay2: "#50555d", crane: "#ffd23f", hull: "#1d2a36", city: "#1a2747" }
};
// flatten theme {sky:[a,b],...} <-> editor fields {sky,sky2,...}
function thToFields(th) { const f = {}; THEME_FIELDS.forEach(([k]) => { if (k === "sky2") f.sky2 = (th.sky || [])[1]; else if (k === "sea2") f.sea2 = (th.sea || [])[1]; else if (k === "sky") f.sky = (th.sky || [])[0]; else if (k === "sea") f.sea = (th.sea || [])[0]; else f[k] = th[k]; }); return f; }
function fieldsToTh(f, base) { const th = Object.assign({}, base); th.sky = [f.sky || "#7fc8ff", f.sky2 || "#dff3ff"]; th.sea = [f.sea || "#2a8fd0", f.sea2 || "#0f4f85"]; ["quay", "quay2", "crane", "hull", "city"].forEach((k) => (th[k] = f[k] || th[k])); return th; }

function lvl(over) { return Object.assign({ c: 4, h: 4, f: 0.62, y: 3, l: 2, n: 8, p: 55, k: 4, par: 140 }, over || {}); }
function port(over) { return Object.assign({ id: nid("port"), name: "New Port", tag: "A fresh challenge.", need: 0, th: Object.assign({}, THEMES.day), rules: [], lv: [lvl({ n: 4, p: 70, par: 90, tut: 1 }), lvl({ n: 7, par: 130 })] }, over || {}); }

export const STARTERS = {
  classic: { name: "Harbor Rush (classic)", blurb: "The four hand-built ports from Harbor Rush — a ready campaign to remix.", img: thumbSVG(THEMES.day, "HARBOR"),
    make: () => ({ engine: "crane", title: "My Harbor Rush", desc: "Run the crane, dig out what each truck wants, land every box dead center.", pack: {
      titleKick: "LAZER STUDIO", titleMain: "HARBOR RUSH", noEndless: true, ports: [
        port({ name: "Old Harbor", tag: "Learn the crane. Dig out what each truck wants.", need: 0, rules: [], th: Object.assign({}, THEMES.day),
          lv: [lvl({ c: 3, h: 3, f: 0.6, y: 2, l: 1, n: 3, p: 75, k: 3, par: 70, tut: 1 }), lvl({ c: 4, h: 3, y: 2, l: 1, n: 5, p: 60, k: 3, par: 95 }), lvl({ c: 4, y: 3, l: 1, n: 6, p: 55, k: 4, par: 115 }), lvl({ c: 5, n: 8, p: 55, par: 140 }), lvl({ c: 6, n: 10, p: 50, k: 5, par: 170 }), lvl({ c: 6, h: 5, y: 4, n: 12, p: 48, k: 5, par: 200 })] }),
        port({ name: "Gale Point", tag: "Gusts shove the load sideways. Watch the windsock.", need: 12, rules: ["wind"], th: Object.assign({}, THEMES.gale),
          lv: [lvl({ n: 6, p: 60, par: 120, w: 1 }), lvl({ c: 5, n: 8, par: 145, w: 1.2 }), lvl({ c: 5, f: 0.65, n: 9, p: 52, k: 5, par: 160, w: 1.4 }), lvl({ c: 6, n: 10, p: 50, k: 5, par: 175, w: 1.6 }), lvl({ c: 6, h: 5, y: 4, n: 11, p: 48, k: 5, par: 190, w: 1.8 }), lvl({ c: 7, h: 5, y: 4, n: 13, p: 46, k: 6, par: 215, w: 2 })] }),
        port({ name: "Frost Bay", tag: "Reefers thaw once they leave the ship. Plug them in or ship them fast.", need: 26, rules: ["reefer"], th: Object.assign({}, THEMES.frost),
          lv: [lvl({ n: 6, p: 60, k: 3, par: 120, r: 0.3, pw: 1 }), lvl({ c: 5, n: 8, par: 145, r: 0.3, pw: 1 }), lvl({ c: 5, f: 0.65, n: 9, p: 52, par: 160, r: 0.35, pw: 1 }), lvl({ c: 6, y: 4, n: 10, p: 50, k: 5, par: 180, r: 0.35, pw: 1, w: 0.8 }), lvl({ c: 6, h: 5, y: 4, n: 11, p: 48, k: 5, par: 195, r: 0.4, pw: 2 }), lvl({ c: 7, h: 5, y: 4, l: 3, n: 14, p: 46, k: 5, par: 225, r: 0.4, pw: 2, w: 1 })] }),
        port({ name: "Chem Terminal", tag: "Night shift with hazmat. Clang a hazmat box and you lose a heart.", need: 42, rules: ["hazmat", "night"], th: Object.assign({}, THEMES.night),
          lv: [lvl({ n: 6, p: 60, par: 125, z: 0.2 }), lvl({ c: 5, n: 8, par: 150, z: 0.22 }), lvl({ c: 5, f: 0.65, n: 9, p: 52, k: 5, par: 165, z: 0.25, r: 0.15, pw: 1 }), lvl({ c: 6, y: 4, n: 10, p: 50, k: 5, par: 185, z: 0.25, w: 1 }), lvl({ c: 6, h: 5, y: 4, n: 12, p: 48, k: 5, par: 205, z: 0.28, r: 0.15, pw: 1, w: 1.2 }), lvl({ c: 7, h: 5, y: 4, l: 3, n: 15, p: 45, k: 6, par: 240, z: 0.3, r: 0.2, pw: 2, w: 1.4 })] })
      ] } }) },
  single: { name: "One big port", blurb: "A single port with a steep six-level difficulty ramp. Great starting point to make it your own.", img: thumbSVG(THEMES.gale, "PORT"),
    make: () => ({ engine: "crane", title: "Dockside", desc: "One port, six levels, rising pressure.", pack: { titleKick: "LAZER STUDIO", titleMain: "DOCKSIDE", noEndless: true, ports: [
      port({ name: "Main Terminal", tag: "Keep the trucks moving.", need: 0, rules: [], th: Object.assign({}, THEMES.day),
        lv: [lvl({ c: 3, h: 3, y: 2, l: 1, n: 4, p: 70, k: 3, par: 85, tut: 1 }), lvl({ n: 6, par: 120 }), lvl({ c: 5, n: 8, par: 150 }), lvl({ c: 5, h: 5, n: 10, p: 50, k: 5, par: 175 }), lvl({ c: 6, h: 5, y: 4, n: 12, p: 48, k: 5, par: 200 }), lvl({ c: 7, h: 5, y: 4, l: 3, n: 15, p: 45, k: 6, par: 240 })] })] } }) },
  night: { name: "Night hazmat", blurb: "A tense single night port with hazmat and wind. Hard mode from the start.", img: thumbSVG(THEMES.night, "NIGHT"),
    make: () => ({ engine: "crane", title: "Midnight Quay", desc: "Hazmat under floodlights, with gusts.", pack: { titleKick: "LAZER STUDIO", titleMain: "MIDNIGHT QUAY", noEndless: true, ports: [
      port({ name: "Midnight Quay", tag: "Hazmat, wind, no daylight.", need: 0, rules: ["hazmat", "night", "wind"], th: Object.assign({}, THEMES.night),
        lv: [lvl({ c: 4, n: 5, p: 65, par: 110, z: 0.2, w: 1, tut: 1 }), lvl({ c: 5, n: 8, par: 150, z: 0.24, w: 1.2 }), lvl({ c: 5, h: 5, n: 10, p: 50, k: 5, par: 175, z: 0.28, w: 1.4 }), lvl({ c: 6, h: 5, y: 4, n: 12, p: 48, k: 5, par: 200, z: 0.3, w: 1.6 }), lvl({ c: 7, h: 5, y: 4, l: 3, n: 15, p: 45, k: 6, par: 240, z: 0.34, w: 2 })] })] } }) }
};

export function validate(P) {
  const errs = [], pk = P.pack || {};
  if (!pk.ports || !pk.ports.length) errs.push("Add at least one port.");
  (pk.ports || []).forEach((pt, i) => {
    const nm = pt.name || "Port " + (i + 1);
    if (!pt.lv || !pt.lv.length) errs.push(nm + ": needs at least one level.");
    (pt.lv || []).forEach((l, j) => {
      if (!(l.n >= 1)) errs.push(nm + " L" + (j + 1) + ": trucks must be at least 1.");
      if (!(l.c >= 2)) errs.push(nm + " L" + (j + 1) + ": ship columns must be at least 2.");
      if (!(l.par >= 20)) errs.push(nm + " L" + (j + 1) + ": time limit (par) must be at least 20s.");
    });
    if (i > 0 && pt.need <= (pk.ports[i - 1].need || 0) && pt.need !== 0) { /* soft */ }
  });
  return errs;
}

function thumbSVG(th, label) {
  const sky = (th.sky || ["#7fc8ff", "#dff3ff"]), sea = (th.sea || ["#2a8fd0", "#0f4f85"]);
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'>
    <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${sky[0]}'/><stop offset='1' stop-color='${sky[1]}'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${sea[0]}'/><stop offset='1' stop-color='${sea[1]}'/></linearGradient></defs>
    <rect width='320' height='130' fill='url(#s)'/><rect y='130' width='320' height='70' fill='url(#w)'/>
    <rect x='40' y='60' width='10' height='80' fill='${th.crane || "#ffb21a"}'/><rect x='40' y='60' width='150' height='9' fill='${th.crane || "#ffb21a"}'/><rect x='150' y='69' width='9' height='22' fill='#333'/>
    <rect x='200' y='112' width='90' height='26' rx='4' fill='${th.hull || "#d8402f"}'/>
    <rect x='210' y='96' width='20' height='18' fill='#e5483b'/><rect x='232' y='96' width='20' height='18' fill='#2f8ff0'/><rect x='254' y='96' width='20' height='18' fill='#2fbf6a'/>
    <rect y='140' width='320' height='60' fill='${th.quay || "#cfc7b8"}' opacity='.0'/>
    <text x='160' y='180' font-family='Arial Black,Arial' font-size='26' font-weight='900' fill='#fff' text-anchor='middle' opacity='.95'>${esc(label || "PORT")}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(s);
}
export function thumb(P) { const pk = P.pack || {}, pt = (pk.ports || [])[0] || {}; return thumbSVG(pt.th || THEMES.day, (pk.titleMain || P.title || "PORT").replace(/<[^>]+>/g, "").split(" ")[0].toUpperCase()); }

export function editor(app, P, hooks) {
  let tab = "game", selPort = 0;
  const pk = P.pack = P.pack || {}; pk.ports = pk.ports || [port()]; if (pk.noEndless == null) pk.noEndless = true;
  const save = () => hooks.save();
  document.body.classList.add("ed");
  app.innerHTML = `<div class="ed-wrap">
    <div class="ed-top"><a class="ib sm" href="/arcade/studio/" title="Back">◀</a>
      <input class="ttl" id="ttl" maxlength="60" value="${esc(P.title)}" aria-label="Game title">
      <span id="stat" class="hint"></span><span class="sp" style="flex:1"></span>
      <button class="ib go" id="test">▶ Test</button><button class="ib pri" id="pub">Publish ▸</button></div>
    <div class="tabs2" id="tabs">${[["game", "Game"], ["ports", "Ports"], ["levels", "Levels"], ["help", "How it plays"]].map(([t, n]) => `<button data-t="${t}" class="${t === tab ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="ed-body" id="body"><div id="pane" class="pane"></div></div></div>`;
  $("#ttl").oninput = (e) => { hooks.setTitle(e.target.value || "Untitled"); };
  $("#test").onclick = hooks.test; $("#pub").onclick = hooks.publish;
  $$("#tabs [data-t]").forEach((b) => (b.onclick = () => { tab = b.dataset.t; $$("#tabs [data-t]").forEach((x) => x.classList.toggle("on", x === b)); render(); }));

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  const num = (path, v, mn, mx, st, label, hint) => `<div class="fld"><label>${label}${hint ? ` <span class="hint">${hint}</span>` : ""}</label><input type="number" data-k="${path}" value="${v == null ? "" : v}" min="${mn}" max="${mx}" step="${st}"></div>`;
  const rng = (path, v, mn, mx, st, label) => `<div class="fld"><label>${label} <b data-out="${path}">${v}</b></label><input type="range" data-k="${path}" data-num="1" value="${v}" min="${mn}" max="${mx}" step="${st}"></div>`;
  const txt = (path, v, label, max) => `<div class="fld"><label>${label}</label><input data-k="${path}" value="${esc(v || "")}" maxlength="${max || 50}"></div>`;
  const col = (path, v, label) => `<div class="fld cf"><label>${label}</label><input type="color" data-k="${path}" value="${esc(v || "#ffffff")}"></div>`;
  function setPath(path, val) { const ps = path.split("."); let o = pk; for (let i = 0; i < ps.length - 1; i++) { const key = ps[i].match(/^\d+$/) ? +ps[i] : ps[i]; o = o[key]; } const last = ps[ps.length - 1]; o[last.match(/^\d+$/) ? +last : last] = val; }
  function getPath(path) { const ps = path.split("."); let o = pk; for (const p of ps) { if (o == null) return undefined; o = o[p.match(/^\d+$/) ? +p : p]; } return o; }
  function wire(root) {
    $$("[data-k]", root).forEach((el) => {
      const ev = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";
      el.addEventListener(ev, () => {
        let v = el.type === "checkbox" ? el.checked : el.type === "number" || el.type === "range" || el.dataset.num ? parseFloat(el.value) : el.value;
        if ((el.type === "number" || el.type === "range") && isNaN(v)) v = +el.min || 0;
        setPath(el.dataset.k, v);
        const out = root.querySelector(`[data-out="${el.dataset.k}"]`); if (out) out.textContent = v;
        save();
      });
    });
  }
  function render() {
    const p = $("#pane"); if (!p) return;
    if (tab === "game") p.innerHTML = gameTab();
    else if (tab === "ports") p.innerHTML = portsTab();
    else if (tab === "levels") p.innerHTML = levelsTab();
    else p.innerHTML = helpTab();
    wire(p);
    if (tab === "ports") wirePorts(p);
    if (tab === "levels") wireLevels(p);
    if (tab === "game") wireGame(p);
  }
  function gameTab() {
    return `<div class="card2" style="max-width:720px"><h3>Your game</h3>
      <p class="hint">This runs on the real Crane engine — the physics crane behind Harbor Rush. You design the ports; the engine builds each dock from your numbers.</p>
      ${txt("titleMain", (pk.titleMain || "").replace(/<[^>]+>/g, ""), "Title (shown big on the menu)", 24)}
      ${txt("titleKick", pk.titleKick, "Small line above the title", 24)}
      <div class="fld"><label>Short description</label><textarea id="desc" maxlength="300" rows="2">${esc(P.desc || "")}</textarea></div>
      <label class="chk" style="margin-top:6px"><input type="checkbox" data-k="noEndless" ${pk.noEndless ? "checked" : ""}> Finite campaign (no endless "Rush Hour" after the last port)</label>
    </div>`;
  }
  function wireGame(root) { const d = $("#desc", root); if (d) d.oninput = () => { P.desc = d.value; save(); }; }
  function portsTab() {
    const list = pk.ports.map((pt, i) => `<div class="prow ${i === selPort ? "on" : ""}" data-port="${i}">
      <span class="sw" style="background:${esc((pt.th.sky || [])[0] || "#7fc8ff")}"></span>
      <b>${esc(pt.name || "Port " + (i + 1))}</b><small>${(pt.lv || []).length} lv · ${pt.rules && pt.rules.length ? pt.rules.join(", ") : "calm"}</small>
      <span class="sp" style="flex:1"></span>
      <button class="ib xs" data-up="${i}" ${i === 0 ? "disabled" : ""}>↑</button><button class="ib xs" data-dn="${i}" ${i === pk.ports.length - 1 ? "disabled" : ""}>↓</button><button class="ib xs" data-delp="${i}" ${pk.ports.length < 2 ? "disabled" : ""}>🗑</button></div>`).join("");
    const pt = pk.ports[selPort] || pk.ports[0]; const f = thToFields(pt.th);
    const rulesHtml = Object.keys(RULES).map((r) => `<label class="chk"><input type="checkbox" data-rule="${r}" ${(pt.rules || []).includes(r) ? "checked" : ""}> ${esc(RULES[r])}</label>`).join("");
    return `<div class="grid2" style="grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:14px">
      <div><div class="card2"><h3>Ports</h3><div class="plist">${list}</div><button class="ib pri" id="addPort" style="margin-top:8px">+ Add port</button></div>
        <p class="hint" style="margin-top:8px">Ports unlock in order as the player earns ★. Drag difficulty up across ports.</p></div>
      <div><div class="card2"><h3>Edit: ${esc(pt.name || "Port")}</h3>
        ${txt("ports." + selPort + ".name", pt.name, "Port name", 28)}
        ${txt("ports." + selPort + ".tag", pt.tag, "One-line briefing", 90)}
        ${num("ports." + selPort + ".need", pt.need, 0, 999, 1, "★ needed to unlock", "0 = open from the start")}
        <h3 style="margin-top:12px">Rules</h3><div class="chks">${rulesHtml}</div>
        <h3 style="margin-top:12px">Theme <button class="ib xs" id="applyPreset">use preset…</button></h3>
        <div class="presets" id="presets" hidden>${Object.keys(THEMES).map((t) => `<button class="ib xs" data-preset="${t}">${t}</button>`).join("")}</div>
        <div class="row2 cols">${THEME_FIELDS.map(([k, lab]) => col("ports." + selPort + ".__f." + k, f[k], lab)).join("")}</div>
      </div></div></div>`;
  }
  function wirePorts(root) {
    $$("[data-port]", root).forEach((el) => (el.onclick = (e) => { if (e.target.closest("button")) return; selPort = +el.dataset.port; render(); }));
    const addP = $("#addPort", root); if (addP) addP.onclick = () => { pk.ports.push(port({ name: "Port " + (pk.ports.length + 1), need: (pk.ports[pk.ports.length - 1]?.need || 0) + 14 })); selPort = pk.ports.length - 1; save(); render(); };
    $$("[data-delp]", root).forEach((el) => (el.onclick = () => { if (pk.ports.length < 2) return; if (!confirm("Delete this port and its levels?")) return; pk.ports.splice(+el.dataset.delp, 1); selPort = Math.max(0, selPort - 1); save(); render(); }));
    $$("[data-up]", root).forEach((el) => (el.onclick = () => { const i = +el.dataset.up; [pk.ports[i - 1], pk.ports[i]] = [pk.ports[i], pk.ports[i - 1]]; selPort = i - 1; save(); render(); }));
    $$("[data-dn]", root).forEach((el) => (el.onclick = () => { const i = +el.dataset.dn; [pk.ports[i + 1], pk.ports[i]] = [pk.ports[i], pk.ports[i + 1]]; selPort = i + 1; save(); render(); }));
    // rules
    $$("[data-rule]", root).forEach((el) => (el.onchange = () => { const pt = pk.ports[selPort]; pt.rules = pt.rules || []; const r = el.dataset.rule; if (el.checked) { if (!pt.rules.includes(r)) pt.rules.push(r); } else pt.rules = pt.rules.filter((x) => x !== r); if (r === "night") { /* night drives theme dark only via preset */ } save(); render(); }));
    // theme fields: data-k uses ".__f." sentinel → rebuild th on change
    $$('[data-k*=".__f."]', root).forEach((el) => (el.oninput = () => { const pt = pk.ports[selPort]; const f = thToFields(pt.th); const key = el.dataset.k.split(".__f.")[1]; f[key] = el.value; pt.th = fieldsToTh(f, pt.th); save(); }));
    const ap = $("#applyPreset", root); if (ap) ap.onclick = () => { const pr = $("#presets", root); pr.hidden = !pr.hidden; };
    $$("[data-preset]", root).forEach((el) => (el.onclick = () => { const pt = pk.ports[selPort]; pt.th = Object.assign({}, THEMES[el.dataset.preset]); save(); render(); }));
  }
  function levelsTab() {
    const pt = pk.ports[selPort] || pk.ports[0];
    const pick = `<div class="fld"><label>Port</label><select id="lvPort">${pk.ports.map((p, i) => `<option value="${i}" ${i === selPort ? "selected" : ""}>${esc(p.name || "Port " + (i + 1))}</option>`).join("")}</select></div>`;
    const rules = pt.rules || [];
    const rows = (pt.lv || []).map((l, j) => `<div class="card2 lvcard"><div class="lvhd"><b>Level ${j + 1}</b><span class="sp" style="flex:1"></span>
        <button class="ib xs" data-dupl="${j}">⧉</button><button class="ib xs" data-dell="${j}" ${pt.lv.length < 2 ? "disabled" : ""}>🗑</button></div>
      <div class="row2">${rng("ports." + selPort + ".lv." + j + ".n", l.n, 1, 30, 1, "Trucks to load")}${rng("ports." + selPort + ".lv." + j + ".par", l.par, 20, 400, 5, "Time limit (s)")}</div>
      <div class="row2">${rng("ports." + selPort + ".lv." + j + ".c", l.c, 2, 8, 1, "Ship columns")}${rng("ports." + selPort + ".lv." + j + ".h", l.h, 2, 6, 1, "Max stack height")}</div>
      <div class="row2">${rng("ports." + selPort + ".lv." + j + ".y", l.y, 1, 5, 1, "Yard columns")}${rng("ports." + selPort + ".lv." + j + ".l", l.l, 1, 3, 1, "Truck lanes")}</div>
      <div class="row2">${rng("ports." + selPort + ".lv." + j + ".k", l.k, 2, 6, 1, "Cargo colors")}${rng("ports." + selPort + ".lv." + j + ".p", l.p, 20, 90, 1, "Driver patience (s)")}</div>
      ${rules.includes("wind") ? `<div class="row2">${rng("ports." + selPort + ".lv." + j + ".w", l.w || 1, 0.5, 4, 0.1, "Wind strength")}</div>` : ""}
      ${rules.includes("reefer") ? `<div class="row2">${rng("ports." + selPort + ".lv." + j + ".r", l.r || 0.3, 0, 0.6, 0.05, "Reefer share")}${num("ports." + selPort + ".lv." + j + ".pw", l.pw || 1, 0, 4, 1, "Powered slots")}</div>` : ""}
      ${rules.includes("hazmat") ? `<div class="row2">${rng("ports." + selPort + ".lv." + j + ".z", l.z || 0.2, 0, 0.5, 0.02, "Hazmat share")}</div>` : ""}
      <label class="chk"><input type="checkbox" data-k="ports.${selPort}.lv.${j}.tut" ${l.tut ? "checked" : ""}> Show the tutorial hints on this level</label>
    </div>`).join("");
    return `<div style="max-width:720px"><div class="card2" style="margin-bottom:10px">${pick}<p class="hint">The engine builds the dock from these numbers — no two levels look alike. Bigger ships and more trucks with less time = harder. Tap Test up top to play your changes.</p></div>
      ${rows}<button class="ib pri" id="addLv">+ Add level</button></div>`;
  }
  function wireLevels(root) {
    const sel = $("#lvPort", root); if (sel) sel.onchange = () => { selPort = +sel.value; render(); };
    const pt = pk.ports[selPort];
    const addL = $("#addLv", root); if (addL) addL.onclick = () => { const last = pt.lv[pt.lv.length - 1] || lvl(); pt.lv.push(Object.assign({}, last, { n: Math.min(30, (last.n || 8) + 2), par: (last.par || 140) + 20, tut: 0 })); save(); render(); };
    $$("[data-dell]", root).forEach((el) => (el.onclick = () => { if (pt.lv.length < 2) return; pt.lv.splice(+el.dataset.dell, 1); save(); render(); }));
    $$("[data-dupl]", root).forEach((el) => (el.onclick = () => { const j = +el.dataset.dupl; pt.lv.splice(j + 1, 0, Object.assign({}, pt.lv[j])); save(); render(); }));
  }
  function helpTab() {
    return `<div class="card2" style="max-width:680px"><h3>How the Crane engine plays</h3>
      <p>You operate a harbor crane. Swing it over the ship, grab the container the waiting truck wants, and set it down on the truck — dead center for a perfect bonus. Dig through stacks to reach buried boxes before drivers run out of patience.</p>
      <ul class="hint" style="line-height:1.7">
        <li><b>Ship columns / stack height</b> — a bigger ship means more digging.</li>
        <li><b>Trucks</b> — how many orders you must fill to clear the level.</li>
        <li><b>Patience</b> — how long a driver waits before leaving angry.</li>
        <li><b>Rules</b> — turn on Wind, Reefers, Hazmat or Night to change the challenge. Extra sliders appear per level when a rule is on.</li>
        <li><b>★ to unlock</b> — gates later ports behind stars earned on earlier ones.</li>
      </ul>
      <p class="hint">Coming next to the kit: hand-placed starting stacks, and custom crane &amp; container art.</p></div>`;
  }
  render();
}
