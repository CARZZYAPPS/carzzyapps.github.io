// Deep editors for the Rush kit: shop types, machines (any number, any look), 3D models, scene, customers,
// rules, hazards and text. Everything here edits plain data in project.kit; the runtime (play.html) reads it.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const nid = (p) => p + Date.now().toString(36).slice(-4) + Math.floor(Math.random() * 36).toString(36);
const opt = (m, v) => Object.keys(m).map((a) => `<option value="${esc(a)}" ${String(a) === String(v) ? "selected" : ""}>${esc(m[a])}</option>`).join("");

export const BUILTIN_LOOKS = { espresso: "Espresso machine", oven: "Oven", fryer: "Fryer", blender: "Blender", waffle: "Press / iron", steamer: "Jug / steamer", drip: "Pot brewer", cold: "Tower", cakes: "Cake stand", juicer: "Juicer", bowls: "Prep station", softserve: "Swirl machine", freezer: "Freezer" };
const BUILTIN_KIND = { espresso: "cooker", oven: "cooker", fryer: "cooker", blender: "cooker", waffle: "cooker" };
export const PART_TYPES = { box: "Box", rbox: "Rounded box", cyl: "Cylinder", cone: "Cone", sphere: "Sphere", torus: "Ring", plane: "Flat panel", text: "Sign (text)", group: "Group (empty)" };
const MATS = { toon: "Matte", metal: "Metal", glass: "Glass", glow: "Glow" };
const STATES = { always: "Always", idle: "Idle", working: "Working", ready: "Ready", full: "Full", angry: "Angry", happy: "Happy", moving: "Moving" };
const ANIMS = { bob: "Bob", slide: "Slide", spin: "Spin", swing: "Swing", scale: "Pulse", blink: "Blink", color: "Change color", show: "Show", hide: "Hide" };
const AXES = { x: "X", y: "Y", z: "Z" };
const PATS = { "": "Plain", tiles: "Tiles", planks: "Planks", concrete: "Concrete", asphalt: "Asphalt", grass: "Grass", sand: "Sand" };
const SOUNDS = { bell: "Bell", ding: "Ding", serve: "Serve", cash: "Cash", bad: "Buzz", burn: "Burn", pop: "Pop", nope: "Nope", bin: "Bin", gull: "Gull", buy: "Buy", lvl: "Level up", load: "Load", pick: "Pick" };
const ROLE_IDS = { barista: "Maker (barista)", server: "Server", manager: "Manager", finisher: "Assistant", host: "Host" };
const NAME_IDS = {
  hq: { training: "Barista academy", offline: "Night managers", loyalty: "Loyalty app", grind: "Equipment R&D", quality: "Quality program", ambassador: "Brand ambassadors", security: "Security team", legal: "Legal team", autolab: "Automation lab" },
  hold: { roastery: "Coffee roastery", dairy: "Dairy farm", mill: "Flour mill", logistics: "Delivery fleet", adagency: "Ad agency", orchard: "Fruit orchard", realty: "Real estate arm", creamery: "Creamery" },
  mkt: { flyers: "Hand out flyers", social: "Social media push", event: "Launch party", billboard: "Billboard" },
  sab: { rumor: "Spread rumors", poach: "Poach their best barista", squeeze: "Squeeze their supplier", crash: "Crash their grand opening" }
};
const SIZE_IDS = ["Kiosk", "Cafe", "Flagship", "Megastore"];
const TEXT_KEYS = { tutStart: "Hint: start a machine ({machine})", tutTake: "Hint: take a finished item", tutComp: "Hint: add a topping ({machine})", tutServe: "Hint: hand it over" };

export const WHEN = {
  start: { n: "Day starts" }, end: { n: "Day ends" }, every: { n: "Every N seconds", f: [["sec", "Seconds", 30]] }, random: { n: "Randomly", f: [["per", "Times per minute", 1]] },
  at: { n: "At a time of day", f: [["f", "Time of day (0-1)", 0.5]] }, arrive: { n: "Customer arrives", type: 1 }, served: { n: "Customer served", type: 1 }, walkout: { n: "Customer walks out", type: 1 },
  done: { n: "Machine finishes", station: 1 }, burnt: { n: "Item burns / goes stale", station: 1 }, levelup: { n: "Player levels up" },
  hazardHit: { n: "Hazard hits", hazard: 1 }, hazardClear: { n: "Hazard cleared", hazard: 1 },
  money: { n: "Money reaches", f: [["n", "Amount", 500]] }, servedCount: { n: "Served count reaches", f: [["n", "Customers", 10]] }, streak: { n: "Streak reaches", f: [["n", "Streak", 5]] }
};
const COND_V = { money: "Money", day: "Day", level: "Level", rep: "Reputation", streak: "Streak", served: "Served today", time: "Time of day (0-1)", waiting: "Customers waiting", district: "District is", type: "Shop type is", chance: "Chance %", var: "Variable" };
const OPS = { ">=": "≥", ">": ">", "<=": "≤", "<": "<", "==": "=", "!=": "≠" };
export const DO = {
  banner: { n: "Show banner", f: [["big", "Big text", "", "t"], ["small", "Small text", "", "t"], ["kind", "Style", "hot", { hot: "Hot", cool: "Cool" }]] },
  toast: { n: "Show message", f: [["text", "Text", "", "t"], ["kind", "Style", "", { "": "Normal", good: "Good", bad: "Bad" }]] },
  spawn: { n: "Spawn customers", f: [["n", "How many", 1], ["type", "Type", "", "ctype"], ["variant", "Special", "", { "": "None", vip: "VIP", insp: "Inspector" }]] },
  burst: { n: "Crowd burst", f: [["n", "Extra customers", 3]] },
  demand: { n: "Change crowds", f: [["mult", "× crowds", 1.5], ["sec", "Seconds", 15]] },
  price: { n: "Change prices", f: [["mult", "× prices", 1.3], ["sec", "Seconds", 15]] },
  patience: { n: "Change patience", f: [["mult", "× patience", 0.7], ["sec", "Seconds", 15]] },
  rush: { n: "Rush customers", f: [["n", "How many", 2]] },
  speed: { n: "Machine speed", f: [["station", "Machine", "", "station"], ["mult", "× speed", 0.75], ["sec", "Seconds", 15]] },
  money: { n: "Give money", f: [["n", "Amount (can be negative)", 20]] }, rep: { n: "Change reputation", f: [["n", "Stars (+/-)", 0.2]] },
  xp: { n: "Give XP", f: [["n", "XP", 20]] }, score: { n: "Give points", f: [["n", "Points", 100]] },
  hazard: { n: "Start hazard", f: [["id", "Hazard", "", "hazard"]] }, sound: { n: "Play sound", f: [["s", "Sound", "bell", SOUNDS]] },
  setvar: { n: "Set variable", f: [["v", "Name", "x", "t"], ["op", "How", "add", { add: "Add", set: "Set to" }], ["n", "Value", 1]] },
  heat: { n: "Heatwave (cold sells)" }, script: { n: "Run script action", f: [["name", "Action name", "", "t"]] }
};

export function migrate(k) {
  (k.stations || []).forEach((s, i) => {
    if (!s.id) s.id = "st" + i + Date.now().toString(36).slice(-3);
    if (s.model && !s.look) { s.look = s.model; delete s.model; }
    if (!s.kind) s.kind = BUILTIN_KIND[s.look] || "batch";
  });
  (k.districts || []).forEach((d, i) => { if (!d.id) d.id = i ? "d" + i : "main"; });
  Object.values(k.bases || {}).forEach((b) => { if (b.model && !b.vessel) b.vessel = "custom"; });
  k.models = k.models || {};
}

export function tabs(ctx) {
  const k = ctx.k, save = ctx.save;
  const types = () => k.types || [];
  const modelNames = (pre) => { const m = {}; Object.keys(k.models || {}).forEach((id) => (m[id] = (pre || "") + (k.models[id].name || id))); return m; };
  const bases = () => { const m = {}; Object.keys(k.bases || {}).forEach((id) => (m[id] = k.bases[id].name)); return m; };
  const tops = () => { const m = {}; Object.keys(k.toppings || {}).forEach((id) => (m[id] = k.toppings[id].name)); return m; };
  const stationNames = () => { const m = {}; (k.stations || []).forEach((s) => (m[s.id] = s.name)); return m; };
  const ctypes = () => { const m = {}; (k.customers || []).forEach((c) => (m[c.id] = c.name || c.id)); return m; };
  // field helpers: data-p is a path inside the object given to bind()
  const F = {
    num: (p, v, label, st, mn, mx) => `<div class="fld"><label>${label}</label><input type="number" data-p="${p}" data-n="1" value="${v == null ? "" : v}" step="${st || 0.1}" ${mn != null ? `min="${mn}"` : ""} ${mx != null ? `max="${mx}"` : ""}></div>`,
    txt: (p, v, label, max) => `<div class="fld"><label>${label}</label><input data-p="${p}" value="${esc(v)}" maxlength="${max || 60}"></div>`,
    col: (p, v, label) => `<div class="fld"><label>${label}</label><input type="color" data-p="${p}" value="${esc(/^#[0-9a-f]{6}$/i.test(v || "") ? v : "#cccccc")}"></div>`,
    sel: (p, m, v, label, re) => `<div class="fld"><label>${label}</label><select data-p="${p}" ${re ? 'data-re="1"' : ""}>${opt(m, v)}</select></div>`,
    chk: (p, v, label, re) => `<label class="sl" style="margin:0"><input type="checkbox" data-p="${p}" data-c="1" ${v ? "checked" : ""} ${re ? 'data-re="1"' : ""}> ${label}</label>`
  };
  function setIn(o, path, val) { const ps = path.split("."); for (let i = 0; i < ps.length - 1; i++) { if (o[ps[i]] == null || typeof o[ps[i]] !== "object") o[ps[i]] = /^\d+$/.test(ps[i + 1]) ? [] : {}; o = o[ps[i]]; } o[ps[ps.length - 1]] = val; }
  function bind(root, obj, after, rerender) {
    $$("[data-p]", root).forEach((el) => {
      const ev = el.tagName === "SELECT" || el.dataset.c ? "change" : "input";
      el.addEventListener(ev, () => { const v = el.dataset.c ? el.checked : el.dataset.n ? (el.value === "" ? null : +el.value) : el.value; setIn(typeof obj === "function" ? obj() : obj, el.dataset.p, v); save(); after && after(el); if (el.dataset.re) (rerender || ctx.render)(); });
    });
  }
  const del = (label) => `<button class="x" data-x="${label}" title="Delete" style="align-self:center">🗑</button>`;
  const checks = (name, all, have) => Object.keys(all).map((a) => `<label class="sl" style="margin:0"><input type="checkbox" data-${name}="${esc(a)}" ${have.includes(a) ? "checked" : ""}> ${esc(all[a])}</label>`).join("") || '<span class="hint" style="margin:0">None yet</span>';
  function listChecks(root, name, arrGet) { $$(`[data-${name}]`, root).forEach((el) => (el.onchange = () => { const a = arrGet(el); const v = el.getAttribute("data-" + name); const i = a.indexOf(v); if (el.checked && i < 0) a.push(v); if (!el.checked && i >= 0) a.splice(i, 1); save(); })); }

  /* ---------------- machines ---------------- */
  const machines = {
    label: "Machines",
    html() {
      const looks = Object.assign({}, BUILTIN_LOOKS, modelNames("★ "));
      return `<p class="hint">Add as many machines as you like. <b>How it works</b> sets the behavior: a cooker makes one item per slot and can burn; a batch machine makes several servings and goes stale. <b>Looks like</b> is a built-in machine or any 3D model you build in the Models tab (★).</p>` +
        (k.stations || []).map((s, i) => { const cook = s.kind === "cooker", mk = Object.assign({}, bases(), cook ? {} : tops());
          return `<div class="rule" data-i="${i}"><div class="row2">${F.txt("name", s.name, "Name", 28)}${F.sel("kind", { cooker: "Cooker (slots, can burn)", batch: "Batch (servings, goes stale)" }, s.kind, "How it works", 1)}${F.sel("look", looks, s.look, "Looks like")}${F.sel("makes", mk, s.makes, "Makes")}${del("st")}</div>
          <div class="row2">${F.num("time", s.time || 5, "Seconds to make", 0.1, 0.5, 30)}${cook ? F.num("burn", s.burn || 6, "Burns after (sec)", 0.5, 1, 60) + F.num("slots", s.slots || 2, "Slots", 1, 1, 4) : F.num("stale", s.stale || 30, "Goes stale after (sec)", 1, 3, 300) + F.num("serv", s.serv || 4, "Servings", 1, 1, 12)}
          ${F.num("lvl", s.lvl || 1, "Unlock level", 1, 1, 40)}${F.num("cost", s.cost || 0, "Cost", 10, 0)}${F.num("w", s.w || "", "Width", 0.1, 0.6, 2.4)}</div>
          <div class="row2">${F.txt("verb", s.verb, "Idle label (e.g. Tap to unload)", 30)}${F.txt("desc", s.desc, "Shop description", 160)}</div></div>`; }).join("") +
        `<button class="ib pri" id="addS">+ Machine</button> <button class="ib" id="dupS">Duplicate last</button>`;
    },
    after(p) {
      $$(".rule[data-i]", p).forEach((r) => { const i = +r.dataset.i; bind(r, () => k.stations[i]); $("[data-x]", r).onclick = () => { if (!confirm("Delete this machine?")) return; k.stations.splice(i, 1); save(); ctx.render(); }; });
      $("#addS", p).onclick = () => { const b = Object.keys(k.bases || {})[0]; k.stations.push({ id: nid("st"), kind: "cooker", look: "espresso", name: "New machine", makes: b, time: 5, burn: 7, slots: 2, lvl: 1, cost: 100 }); save(); ctx.render(); };
      $("#dupS", p).onclick = () => { const s = k.stations[k.stations.length - 1]; if (!s) return; k.stations.push(Object.assign(JSON.parse(JSON.stringify(s)), { id: nid("st"), name: s.name + " 2" })); save(); ctx.render(); };
    }
  };

  /* ---------------- shop types ---------------- */
  const typesTab = {
    label: "Shop types",
    html() {
      if (!types().length) return `<div class="card2" style="max-width:760px"><h3>One shop type</h3><p class="hint">Right now every shop is the same kind and uses all your machines. Add shop types to build an empire of different businesses (Harbor Rush has container terminals, fish markets, bulk docks and cruise piers). Each type picks its own machines, toppings, customers, colors and rivals, and menu items belong to a type.</p><button class="ib pri" id="addTy">+ Add shop types</button></div>`;
      const st = stationNames(), tp = tops(), ct = ctypes();
      return `<p class="hint">The first type is where players start. Later types unlock at a level. Menu items pick their type in the Menu tab.</p>` + types().map((t, i) => `<div class="rule" data-i="${i}"><div class="row2">${F.txt("name", t.name, "Name", 30)}${i ? F.num("lvl", t.lvl || 8, "Unlock level", 1, 2, 40) : ""}${F.num("pm", t.pm || 1, "Prices ×", 0.05, 0.3, 20)}${F.num("cm", t.cm || 1, "Costs ×", 0.05, 0.3, 20)}${F.num("wm", t.wm || 1, "Wages ×", 0.05, 0.3, 20)}${del("ty")}</div>
        <div class="row2" style="gap:12px"><span class="fl">Machines</span>${checks("tst", st, t.stations || [])}</div>
        <div class="row2" style="gap:12px;margin-top:6px"><span class="fl">Start with</span>${checks("tsa", st, t.start || [])}</div>
        <div class="row2" style="gap:12px;margin-top:6px"><span class="fl">Rack toppings</span>${checks("ttp", tp, t.toppings || [])}</div>
        <div class="row2" style="gap:12px;margin-top:6px"><span class="fl">Customers</span>${checks("tct", ct, t.customers || [])}</div>
        ${F.txt("rivalsTxt", (t.rivals || []).join(", "), "Rival names (comma separated)", 300)}
        <details style="margin-top:6px"><summary class="fl">Colors</summary><div class="row2">${[["wall", "Wall"], ["wall2", "Wall shade"], ["accent", "Accent"], ["counter", "Counter"], ["top", "Top"], ["trim", "Trim"], ["flA", "Floor A"], ["flB", "Floor B"], ["stn", "Machines"]].map(([a, n]) => F.col("theme." + a, (t.theme || {})[a], n)).join("")}</div></details></div>`).join("") + `<button class="ib pri" id="addTy">+ Shop type</button>`;
    },
    after(p) {
      const add = () => { k.types = k.types || []; const n = k.types.length; k.types.push({ id: nid("ty"), name: n ? "New shop type" : (k.name || "Shop"), lvl: n ? 6 + n * 4 : 1, pm: 1, cm: 1, wm: 1, stations: (k.stations || []).map((s) => s.id), start: [], toppings: Object.keys(k.toppings || {}), customers: [], rivals: [], theme: Object.assign({}, k.theme || {}) });
        if (!n) (k.recipes || []).forEach((r) => (r.type = k.types[0].id)); save(); ctx.render(); };
      $("#addTy", p).onclick = add;
      $$(".rule[data-i]", p).forEach((r) => { const i = +r.dataset.i, t = k.types[i];
        bind(r, t, (el) => { if (el.dataset.p === "rivalsTxt") { t.rivals = el.value.split(",").map((x) => x.trim()).filter(Boolean); delete t.rivalsTxt; save(); } });
        ["tst:stations", "tsa:start", "ttp:toppings", "tct:customers"].forEach((pr) => { const [n, f] = pr.split(":"); listChecks(r, n, () => (t[f] = t[f] || [])); });
        $("[data-x]", r).onclick = () => { if (!confirm("Delete this shop type?")) return; k.types.splice(i, 1); if (!k.types.length) delete k.types; save(); ctx.render(); }; });
    }
  };

  /* ---------------- 3D models ---------------- */
  let mSel = null, pSel = null, prevState = "idle", frame = null, ready = false;
  const TEMPLATES = {
    blank: { name: "New model", parts: [] },
    machine: { name: "New machine", slotY: 0.11, slotZ: 0.2, lampY: 0.75, parts: [{ id: "b1", t: "rbox", p: [0, 0.35, -0.05], s: [1, 0.7, 0.6], c: "#e2553f", rad: 0.08 }, { id: "b2", t: "box", p: [0, 0.73, -0.05], s: [1.04, 0.06, 0.64], c: "#2a3a4a" }, { id: "b3", t: "text", p: [0, 0.55, 0.26], s: [0.7, 0.16, 1], c: "#ffffff", txt: "MACHINE", bg: "#2a3a4a", fg: "#ffffff" }, { id: "b4", t: "cyl", p: [0.3, 0.85, -0.1], s: [0.12, 0.2, 0.12], c: "#ffd04a", anim: [{ state: "working", type: "spin", axis: "y", speed: 1 }] }] },
    item: { name: "New item", top: 0.16, r: 0.09, parts: [{ id: "i1", t: "cyl", p: [0, 0.07, 0], s: [0.16, 0.14, 0.16], c: "#ffffff", taper: 1.2 }, { id: "i2", t: "cyl", p: [0, 0.12, 0], s: [0.15, 0.02, 0.15], c: "#8a4b2a" }] },
    customer: { name: "New customer", scale: 1, shadow: 0.7, parts: [{ id: "c1", t: "rbox", p: [0, 0.55, 0], s: [0.45, 0.6, 0.32], c: "#2f7fd0", rad: 0.3 }, { id: "c2", t: "sphere", p: [0, 1.02, 0], s: [0.36, 0.36, 0.36], c: "#f2c7a0" }, { id: "c3", t: "cyl", p: [-0.1, 0.13, 0], s: [0.12, 0.26, 0.12], c: "#2a2d33", anim: [{ state: "moving", type: "swing", axis: "x", amt: 1, speed: 2 }] }, { id: "c4", t: "cyl", p: [0.1, 0.13, 0], s: [0.12, 0.26, 0.12], c: "#2a2d33", anim: [{ state: "moving", type: "swing", axis: "x", amt: -1, speed: 2 }] }] },
    prop: { name: "New prop", parts: [{ id: "p1", t: "cyl", p: [0, 0.6, 0], s: [0.14, 1.2, 0.14], c: "#9a6a3a" }, { id: "p2", t: "sphere", p: [0, 1.35, 0], s: [0.8, 0.7, 0.8], c: "#3aa35d" }] },
    car: { name: "New car", scale: 1, shadow: 1.4, walk: "roll", parts: [{ id: "v1", name: "Body", t: "rbox", p: [0, 0.42, 0], s: [1.9, 0.5, 0.95], c: "#e2453f", rad: 0.12 }, { id: "v2", name: "Cabin", t: "rbox", p: [-0.1, 0.82, 0], s: [1.05, 0.42, 0.85], c: "#e2453f", rad: 0.14 }, { id: "v3", name: "Windows", t: "box", p: [-0.1, 0.84, 0], s: [1.07, 0.3, 0.87], c: "#9fd8ff", m: "glass" }, { id: "v4", name: "Wheel", t: "cyl", p: [0.6, 0.2, 0.46], r: [90, 0, 0], s: [0.4, 0.14, 0.4], c: "#222222", anim: [{ state: "moving", type: "spin", axis: "y", speed: 2 }] }, { id: "v5", name: "Wheel", t: "cyl", p: [-0.6, 0.2, 0.46], r: [90, 0, 0], s: [0.4, 0.14, 0.4], c: "#222222", anim: [{ state: "moving", type: "spin", axis: "y", speed: 2 }] }, { id: "v6", name: "Wheel", t: "cyl", p: [0.6, 0.2, -0.46], r: [90, 0, 0], s: [0.4, 0.14, 0.4], c: "#222222", anim: [{ state: "moving", type: "spin", axis: "y", speed: 2 }] }, { id: "v7", name: "Wheel", t: "cyl", p: [-0.6, 0.2, -0.46], r: [90, 0, 0], s: [0.4, 0.14, 0.4], c: "#222222", anim: [{ state: "moving", type: "spin", axis: "y", speed: 2 }] }] },
    table: { name: "New table", parts: [{ id: "t1", name: "Top", t: "cyl", p: [0, 0.74, 0], s: [0.9, 0.05, 0.9], c: "#c98a4b" }, { id: "t2", name: "Leg", t: "cyl", p: [0, 0.37, 0], s: [0.08, 0.72, 0.08], c: "#3a3a44" }, { id: "t3", name: "Foot", t: "cyl", p: [0, 0.02, 0], s: [0.5, 0.04, 0.5], c: "#3a3a44" }] },
    crate: { name: "New crate", parts: [{ id: "k1", t: "box", p: [0, 0.25, 0], s: [0.5, 0.5, 0.5], c: "#b9824a" }, { id: "k2", t: "box", p: [0, 0.25, 0.252], s: [0.52, 0.08, 0.01], c: "#8a5a2a" }, { id: "k3", t: "box", p: [0, 0.25, -0.252], s: [0.52, 0.08, 0.01], c: "#8a5a2a" }] },
    sign: { name: "New sign", parts: [{ id: "s1", name: "Post", t: "cyl", p: [0, 0.6, 0], s: [0.07, 1.2, 0.07], c: "#555b66", m: "metal" }, { id: "s2", name: "Board", t: "rbox", p: [0, 1.35, 0], s: [0.9, 0.4, 0.06], c: "#2a3a4a", rad: 0.05 }, { id: "s3", name: "Text", t: "text", p: [0, 1.35, 0.035], s: [0.8, 0.3, 1], txt: "OPEN", bg: "#2a3a4a", fg: "#ffd04a", c: "#ffffff" }] }
  };
  const TPL_NAMES = { machine: "Machine", item: "Product / item", customer: "Customer", car: "Car / vehicle", table: "Table", crate: "Crate", sign: "Sign", prop: "Tree / scenery", blank: "Blank" };
  // which size reference the preview starts with for a model
  const refFor = (m) => m.slotY != null || m.lampY != null ? "counter" : m.top != null || m.r != null ? "cup" : "person";
  const SWATCHES = ["#ffffff", "#2a2d33", "#e2453f", "#ff8a3d", "#ffd04a", "#3aa35d", "#22b8e4", "#2f6fd0", "#8a4bd0", "#ff6fae", "#9a6a3a", "#c9ccd3"];
  // undo / redo for the model being edited
  let hist = [], hi = -1, histFor = null;
  function record() { const m = M(); if (!m) return; if (histFor !== mSel) { hist = []; hi = -1; histFor = mSel; } const j = JSON.stringify(m); if (hist[hi] === j) return; hist = hist.slice(0, hi + 1); hist.push(j); if (hist.length > 80) hist.shift(); hi = hist.length - 1; undoBtns(); }
  function undoBtns() { const u = $("#mdlUndo"), r = $("#mdlRedo"); if (u) u.disabled = hi <= 0; if (r) r.disabled = hi >= hist.length - 1; }
  function travel(d) { const j = hi + d; if (j < 0 || j >= hist.length) return; hi = j; k.models[mSel] = JSON.parse(hist[hi]); if (pSel && !(M().parts || []).some((q) => q.id === pSel)) pSel = null; save(); subModel(); subParts(); subPart(); post(); undoBtns(); }
  function topY(m) { let y = 0; (m.parts || []).forEach((q) => { if (q.parent) return; const P = q.p || [0, 0, 0], S = q.s || [1, 1, 1]; y = Math.max(y, (+P[1] || 0) + Math.abs(+S[1] || 0) / 2); }); return y; }
  function removePart(m, id) { const fam = [id]; m.parts.forEach((x) => { if (fam.includes(x.parent)) fam.push(x.id); }); m.parts = m.parts.filter((x) => !fam.includes(x.id)); }
  function onKey(key, ctrl, shift) {
    if (!document.getElementById("mdlPrev")) return;
    if (ctrl && key === "z") return travel(shift ? 1 : -1);
    if (ctrl && key === "y") return travel(1);
    const m = M(); if (!m || !pSel) return;
    if (key === "escape") { pSel = null; subParts(); subPart(); post(); return; }
    if (key === "delete" || key === "backspace") { removePart(m, pSel); pSel = null; save(); subParts(); subPart(); post(); return; }
    if (ctrl && key === "d") { const b = $("#ptDup"); if (b) b.click(); }
  }
  document.addEventListener("keydown", (e) => { const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return; const key = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
    if (!document.getElementById("mdlPrev")) return;
    if ((ctrl && ["z", "y", "d"].includes(key)) || key === "delete" || key === "backspace" || key === "escape") { if (key !== "escape") e.preventDefault(); onKey(key, ctrl, e.shiftKey); } });
  const M = () => k.models[mSel];
  function post(fresh) { record(); if (frame && ready && mSel && M()) frame.contentWindow.postMessage({ type: "model", spec: JSON.parse(JSON.stringify(M())), sel: pSel, state: prevState, fresh: !!fresh, ref: fresh ? refFor(M()) : undefined }, "*"); }
  function onMsg(e) { if (!frame || e.source !== frame.contentWindow || !e.data) return; if (e.data.type === "model-ready") { ready = true; post(true); } if (e.data.type === "model-pick") { pSel = e.data.id; subParts(); subPart(); post(); }
    if (e.data.type === "model-edit") { const m = M(), q = m && (m.parts || []).find((x) => x.id === e.data.id); if (!q) return; const ok = (a) => Array.isArray(a) && a.length === 3 && a.every((v) => typeof v === "number" && isFinite(v)); if (!ok(e.data.p) || !ok(e.data.r) || !ok(e.data.s)) return; q.p = e.data.p; q.r = e.data.r; q.s = e.data.s; save(); subPart(); post(); }
    if (e.data.type === "model-key") onKey(String(e.data.key || ""), !!e.data.ctrl, !!e.data.shift); }
  window.addEventListener("message", onMsg);
  function partList(m) {
    const kids = {}; (m.parts || []).forEach((q) => { const par = q.parent && m.parts.some((x) => x.id === q.parent) ? q.parent : ""; (kids[par] = kids[par] || []).push(q); });
    const out = []; const walk = (par, d) => (kids[par] || []).forEach((q) => { out.push([q, d]); if (d < 8) walk(q.id, d + 1); }); walk("", 0); return out;
  }
  function subList() {
    const box = $("#mdlList"); if (!box) return;
    box.innerHTML = `<div class="row2"><div class="fld"><label>Editing</label><select id="mdlPick">${opt(modelNames(), mSel)}</select></div><div class="fld"><label>New model</label><select id="mdlTpl">${opt(TPL_NAMES, "machine")}</select></div><button class="ib sm pri" id="mdlNew" style="align-self:end">+ New</button></div>
      ${mSel && M() ? `<div class="row2" style="margin-top:8px"><button class="ib sm" id="mdlDup">Duplicate</button><button class="ib sm" id="mdlDel">Delete</button></div>` : ""}`;
    $("#mdlPick").onchange = (e) => { mSel = e.target.value; pSel = null; subAll(true); };
    $("#mdlNew").onclick = () => { const t = $("#mdlTpl").value, id = nid("m"); k.models[id] = JSON.parse(JSON.stringify(TEMPLATES[t])); mSel = id; pSel = null; save(); subAll(true); };
    const d = $("#mdlDup"); if (d) d.onclick = () => { const id = nid("m"); k.models[id] = JSON.parse(JSON.stringify(M())); k.models[id].name = (M().name || "Model") + " copy"; mSel = id; save(); subAll(true); };
    const x = $("#mdlDel"); if (x) x.onclick = () => { if (!confirm("Delete this model? Anything using it goes back to its default look.")) return; delete k.models[mSel]; mSel = Object.keys(k.models)[0] || null; pSel = null; save(); subAll(true); };
  }
  function subModel() {
    const box = $("#mdlProps"); if (!box) return; const m = M(); if (!m) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="row2">${F.txt("name", m.name, "Model name", 30)}</div>
      <details><summary class="fl">How it's used</summary><p class="hint">Machines: where items sit (slot height and depth) and the status light. Items: where toppings stack and the item's radius. Customers: size, shadow, and roll (vehicles) or walk.</p>
      <div class="row2">${F.num("slotY", m.slotY, "Slot height", 0.01)}${F.num("slotZ", m.slotZ, "Slot depth", 0.01)}${F.num("lampY", m.lampY, "Light height", 0.01)}${F.num("top", m.top, "Item top", 0.01)}${F.num("r", m.r, "Item radius", 0.01)}${F.num("h", m.h, "Topping height", 0.01)}${F.num("scale", m.scale, "Customer scale", 0.05)}${F.num("shadow", m.shadow, "Shadow size", 0.05)}${F.sel("walk", { "": "Walks", roll: "Rolls (vehicle)" }, m.walk || "", "Moves by")}</div></details>`;
    bind(box, m, (el) => { post(); if (el.dataset.p === "name") subList(); });
  }
  function subParts() {
    const box = $("#mdlParts"); if (!box) return; const m = M(); if (!m) { box.innerHTML = '<p class="hint">Make a model to start.</p>'; return; }
    box.innerHTML = `<div class="row2"><div class="fld"><label>Shape</label><select id="ptType">${opt(PART_TYPES, "box")}</select></div><button class="ib sm pri" id="ptAdd" style="align-self:end">+ Part</button></div>
      <div class="plist" style="margin-top:8px;max-height:260px;overflow:auto">${partList(m).map(([q, d]) => `<button class="ib sm ${q.id === pSel ? "pri" : ""}" data-pp="${esc(q.id)}" style="display:block;width:100%;text-align:left;margin:2px 0;padding-left:${10 + d * 14}px">${esc(q.name || (PART_TYPES[q.t] || q.t) + " " + (m.parts.indexOf(q) + 1))}${q.anim && q.anim.length ? " ✦" : ""}${q.hide ? " (hidden)" : ""}</button>`).join("") || '<p class="hint">No parts yet.</p>'}</div>`;
    $("#ptAdd").onclick = () => { const t = $("#ptType").value, sel = (m.parts || []).find((q) => q.id === pSel), sz = t === "text" ? [0.6, 0.18, 1] : t === "plane" ? [0.5, 0.5, 1] : [0.3, 0.3, 0.3];
      let p = [0, topY(m) + sz[1] / 2 + 0.02, 0];
      if (sel && sel.t !== "group" && !sel.parent) { const P = sel.p || [0, 0, 0], S = sel.s || [1, 1, 1]; p = [+P[0] || 0, (+P[1] || 0) + Math.abs(+S[1] || 0) / 2 + sz[1] / 2 + 0.02, +P[2] || 0]; }
      if (sel && sel.t === "group") p = [0, 0, 0];
      p = p.map((v) => Math.round(v * 1000) / 1000);
      const q = { id: nid("q"), t, p, s: sz, c: "#ffb000" }; if (t === "text") Object.assign(q, { txt: "SIGN", bg: "#2a3a4a", fg: "#ffffff" }); if (sel && sel.t === "group") q.parent = sel.id; (m.parts = m.parts || []).push(q); pSel = q.id; save(); subParts(); subPart(); post(); };
    $$("[data-pp]", box).forEach((b) => (b.onclick = () => { pSel = b.dataset.pp; subParts(); subPart(); post(); }));
  }
  function subPart() {
    const box = $("#mdlPart"); if (!box) return; const m = M(), i = m ? (m.parts || []).findIndex((q) => q.id === pSel) : -1;
    if (i < 0) { box.innerHTML = '<p class="hint">Tap a part in the preview (or pick it in the list). Then drag the arrows to move it, switch to Turn or Size at the top of the preview, or type exact numbers here.</p>'; return; }
    const q = m.parts[i], par = { "": "(none)" }; m.parts.forEach((x) => { if (x.id !== q.id && x.t === "group") par[x.id] = x.name || "Group " + x.id; });
    const v3 = (f, lab, st, d) => `<div class="row2 v3"><span class="fl" style="min-width:64px">${lab}</span>${[0, 1, 2].map((a) => `<div class="fld"><label>${"XYZ"[a]}</label><input type="number" step="${st}" data-p="${f}.${a}" data-n="1" value="${(q[f] || d)[a]}"></div>`).join("")}</div>`;
    box.innerHTML = `<div class="row2">${F.txt("name", q.name, "Part name", 24)}${F.sel("t", PART_TYPES, q.t, "Shape", 1)}${F.sel("parent", par, q.parent || "", "Inside group", 1)}</div>
      ${v3("p", "Position", 0.02, [0, 0, 0])}${v3("r", "Rotation°", 5, [0, 0, 0])}${v3("s", "Size", 0.02, [1, 1, 1])}
      <div class="row2 sw" style="gap:4px;margin:2px 0 4px">${SWATCHES.map((c) => `<button class="swc" data-sw="${c}" title="${c}" style="width:22px;height:22px;border-radius:6px;border:2px solid ${(q.c || "").toLowerCase() === c ? "#fff" : "rgba(255,255,255,.18)"};background:${c};padding:0;cursor:pointer"></button>`).join("")}</div>
      <div class="row2">${F.col("c", q.c, "Color")}${F.sel("m", MATS, q.m || "toon", "Material")}${q.t === "cyl" || q.t === "cone" ? F.num("taper", q.taper, "Taper (top/bottom)", 0.05, 0.05, 4) : ""}${q.t === "rbox" ? F.num("rad", q.rad, "Roundness", 0.01, 0, 0.5) : ""}${q.t === "torus" ? F.num("th", q.th, "Thickness", 0.01, 0.02, 0.9) + F.num("arc", q.arc, "Arc°", 5, 10, 360) : ""}${F.chk("hide", q.hide, "Hidden until shown")}</div>
      ${q.t === "text" ? `<div class="row2">${F.txt("txt", q.txt, "Sign text", 18)}${F.col("bg", q.bg, "Sign color")}${F.col("fg", q.fg, "Text color")}</div>` : ""}
      <div class="row2" style="margin-top:6px"><button class="ib sm" id="ptDup">Duplicate</button><button class="ib sm" id="ptMir">Mirror (left/right)</button><button class="ib sm" id="ptUp">▲</button><button class="ib sm" id="ptDn">▼</button><button class="ib sm" id="ptDel">Delete</button></div>
      <h4 style="margin:12px 0 4px">Animations</h4><p class="hint" style="margin:0 0 6px">Play in a state: machines use idle / working / ready / full / angry, customers idle / moving / happy / angry.</p>
      ${(q.anim || []).map((a, j) => `<div class="row2 an" data-j="${j}">${F.sel(`anim.${j}.state`, STATES, a.state || "always", "When")}${F.sel(`anim.${j}.type`, ANIMS, a.type || "bob", "Do", 1)}${a.type === "color" ? F.col(`anim.${j}.color`, a.color, "Color") : ["show", "hide", "blink"].includes(a.type) ? "" : F.sel(`anim.${j}.axis`, AXES, a.axis || "y", "Axis") + (a.type === "spin" ? "" : F.num(`anim.${j}.amt`, a.amt == null ? 1 : a.amt, "Amount", 0.1))}${F.num(`anim.${j}.speed`, a.speed == null ? 1 : a.speed, "Speed", 0.1)}<button class="x" data-ax="${j}" title="Remove" style="align-self:center">✕</button></div>`).join("")}
      <button class="ib sm" id="anAdd">+ Animation</button>`;
    bind(box, q, () => post(), () => { subParts(); subPart(); post(); });
    const swap = (d) => { const j = i + d; if (j < 0 || j >= m.parts.length) return; [m.parts[i], m.parts[j]] = [m.parts[j], m.parts[i]]; save(); subParts(); };
    $$("[data-sw]", box).forEach((b) => (b.onclick = () => { q.c = b.dataset.sw; save(); subPart(); post(); }));
    $("#ptUp").onclick = () => swap(-1); $("#ptDn").onclick = () => swap(1);
    const clone = (mirror) => { const fam = [q.id], out = []; m.parts.forEach((x) => { if (fam.includes(x.parent)) fam.push(x.id); }); const map = {};
      m.parts.filter((x) => fam.includes(x.id)).forEach((x) => { const c = JSON.parse(JSON.stringify(x)); map[x.id] = c.id = nid("q"); out.push(c); });
      out.forEach((c) => { if (map[c.parent]) c.parent = map[c.parent]; });
      const top = out[0]; if (mirror) { top.p = [-(top.p || [0])[0], (top.p || [0, 0])[1], (top.p || [0, 0, 0])[2]]; const r = top.r || [0, 0, 0]; top.r = [r[0], -r[1], -r[2]]; } else { const p0 = top.p || [0, 0, 0]; top.p = [p0[0] + 0.15, p0[1], p0[2]]; }
      if (top.name) top.name = top.name + (mirror ? " (mirror)" : " copy");
      m.parts.splice(i + 1, 0, ...out); pSel = top.id; save(); subParts(); subPart(); post(); };
    $("#ptDup").onclick = () => clone(false); $("#ptMir").onclick = () => clone(true);
    $("#ptDel").onclick = () => { removePart(m, q.id); pSel = null; save(); subParts(); subPart(); post(); };
    $("#anAdd").onclick = () => { (q.anim = q.anim || []).push({ state: "working", type: "bob", axis: "y", amt: 1, speed: 1 }); save(); subPart(); subParts(); post(); };
    $$("[data-ax]", box).forEach((b) => (b.onclick = () => { q.anim.splice(+b.dataset.ax, 1); if (!q.anim.length) delete q.anim; save(); subPart(); subParts(); post(); }));
  }
  function subAll(fresh) { subList(); subModel(); subParts(); subPart(); post(fresh); }
  const models = {
    label: "Models",
    html() {
      if (!mSel || !k.models[mSel]) { mSel = Object.keys(k.models)[0] || null; pSel = null; }
      return `<div class="grid2 mdlg" style="grid-template-columns:minmax(0,1fr) minmax(320px,1.15fr)"><style>.mdlg>.mprev{order:2;position:sticky;top:8px}@media(max-width:860px){.mdlg>.mprev{order:-1;position:static}}</style><div>
        <div class="card2"><h3>3D models</h3><p class="hint">Build machines, products, customers, vehicles and scenery from shapes. Use them in Machines (Looks like), Products, Customers, Hazards and Scene.</p><div id="mdlList"></div><div id="mdlProps" style="margin-top:8px"></div></div>
        <div class="card2" style="margin-top:12px"><h3>Parts</h3><div id="mdlParts"></div></div>
        <div class="card2" style="margin-top:12px"><h3>Selected part</h3><div id="mdlPart"></div></div></div>
        <div class="mprev"><div class="card2" style="padding:0;overflow:hidden"><div style="position:relative;aspect-ratio:1/1;max-height:62vh;width:100%;background:#151033"><div id="mdlPrev" style="position:absolute;inset:0"></div></div>
          <div class="row2" style="padding:8px;gap:6px;align-items:center"><button class="ib sm" id="mdlUndo" title="Undo (Ctrl+Z)">↶ Undo</button><button class="ib sm" id="mdlRedo" title="Redo (Ctrl+Shift+Z)">↷ Redo</button><span style="flex:1"></span><label class="hint" style="margin:0">Preview</label><select id="mdlState" aria-label="Preview state" style="width:auto">${opt(STATES, prevState)}</select></div></div>
        </div></div>`;
    },
    after(p) {
      ready = false; frame = document.createElement("iframe"); frame.setAttribute("sandbox", "allow-scripts"); frame.src = "/arcade/engines/rush/model.html"; frame.title = "Model preview"; frame.style.cssText = "border:0;width:100%;height:100%;display:block";
      $("#mdlPrev", p).appendChild(frame);
      $("#mdlState", p).onchange = (e) => { prevState = e.target.value; post(); };
      $("#mdlUndo", p).onclick = () => travel(-1); $("#mdlRedo", p).onclick = () => travel(1);
      subAll(true);
    }
  };

  /* ---------------- scene ---------------- */
  const scene = {
    label: "Scene",
    html() {
      const S = k.scene || {};
      if (S.mode !== "custom") return `<div class="card2" style="max-width:760px"><h3>Scene</h3><p class="hint">Your game uses the classic shop interior (walls, counter, tables, a window onto the district). Switch to a custom scene to build your own world: sky, ground, roads, water, fog, camera, and scenery props made from your 3D models.</p><button class="ib pri" id="scOn">Use a custom scene</button></div>`;
      const pm = Object.assign({}, modelNames()), dn = {}; (k.districts || []).forEach((d, i) => (dn[d.id || "d" + i] = d.name));
      return `<div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(280px,1fr)"><div class="card2"><h3>World</h3>
        <div class="row2">${F.col("sky", S.sky, "Sky")}${F.col("ground", S.ground, "Ground")}${F.sel("groundPat", PATS, S.groundPat || "", "Ground pattern")}${F.col("back", S.back, "Back strip")}${F.sel("backPat", PATS, S.backPat || "", "Back pattern")}</div>
        <div class="row2">${F.chk("deck", S.deck, "Raised deck")}${F.chk("lane.on", (S.lane || {}).on, "Road markings")}${F.col("lane.color", (S.lane || {}).color, "Marking color")}</div>
        <div class="row2">${F.chk("water.on", (S.water || {}).on, "Water in front")}${F.col("water.color", (S.water || {}).color, "Water")}${F.num("water.gap", (S.water || {}).gap, "Shore distance", 0.05, 0, 4)}${F.col("edge", S.edge, "Shore edge")}</div>
        <div class="row2">${F.chk("fog.on", (S.fog || {}).on, "Fog")}${F.col("fog.color", (S.fog || {}).color, "Fog color")}${F.num("fog.near", (S.fog || {}).near, "Fog starts", 1, 1, 80)}${F.num("fog.far", (S.fog || {}).far, "Fog ends", 1, 2, 120)}</div>
        <div class="row2">${F.sel("counter", { none: "No counter", classic: "Counter" }, S.counter || "classic", "Counter")}${F.chk("divider", S.divider !== false, "Back wall")}${F.chk("noTables", S.noTables, "No tables")}${F.chk("noExpress", S.noExpress, "No pickup shelf")}</div>
        <div class="row2">${F.sel("tray.style", { plates: "Plates", pads: "Painted pads", crates: "Crates" }, (S.tray || {}).style || "plates", "Hand-off spots look like")}${F.col("tray.color", (S.tray || {}).color || "#ffc63d", "Hand-off color")}</div>
        <h3 style="margin-top:12px">Camera</h3><div class="row2">${F.num("camera.zoom", (S.camera || {}).zoom || 1, "Zoom", 0.02, 0.5, 1.6)}${F.num("camera.tilt", (S.camera || {}).tilt || 0, "Tilt°", 1, -20, 30)}${F.num("camera.pan", (S.camera || {}).pan || 0, "Pan forward", 0.1, -4, 4)}</div>
        <h3 style="margin-top:12px">Sky per district</h3><div class="row2">${Object.keys(dn).map((id) => F.col(`districts.${id}.sky`, ((S.districts || {})[id] || {}).sky || S.sky, dn[id])).join("") || '<span class="hint">Give districts ids to color them separately.</span>'}</div>
        <button class="ib sm" id="scOff" style="margin-top:12px">Back to the classic interior</button></div>
        <div class="card2"><h3>Scenery props</h3><p class="hint">Drag props on the map. The shop is the box in the middle; the top is the back of the scene, the bottom is the front. "Left/right edge" props follow the edges as the shop grows.</p>
        <svg id="scMap" viewBox="-9 -7 18 13" style="width:100%;background:#1b1540;border-radius:12px;touch-action:none"><rect x="-9" y="-7" width="18" height="13" fill="${esc(S.ground || "#d9d2c3")}" opacity=".25"/>${(S.water || {}).on ? `<rect x="-9" y="${1.3 + (+(S.water || {}).gap || 0.6)}" width="18" height="6" fill="${esc((S.water || {}).color || "#2f8fc4")}" opacity=".6"/>` : ""}<rect x="-2.6" y="-1.2" width="5.2" height="2.6" fill="none" stroke="#fff" stroke-dasharray=".15 .15" stroke-width=".05"/>
          ${(S.props || []).map((q, i) => { const x = (+q.x || 0) + (q.side === "right" ? 2.6 : q.side === "left" ? -2.6 : 0); return `<g data-pr="${i}" style="cursor:grab"><circle cx="${x}" cy="${+q.z || 0}" r=".38" fill="#ffd04a" stroke="#000" stroke-width=".05"/><text x="${x}" y="${(+q.z || 0) + 0.12}" font-size=".34" text-anchor="middle" fill="#000">${i + 1}</text></g>`; }).join("")}</svg>
        ${(S.props || []).map((q, i) => `<div class="rule" data-q="${i}"><div class="row2"><span class="fl">${i + 1}</span>${F.sel("model", pm, q.model, "Model")}${F.sel("side", { "": "Center", left: "Left edge", right: "Right edge" }, q.side || "", "Anchored to", 1)}${F.num("x", q.x || 0, "X", 0.1)}${F.num("z", q.z || 0, "Depth", 0.1)}${F.num("y", q.y || 0, "Height", 0.05)}${F.num("s", q.s || 1, "Scale", 0.05, 0.1, 8)}${F.num("ry", q.ry || 0, "Turn°", 15)}${del("pr")}</div></div>`).join("")}
        <button class="ib pri" id="prAdd" ${Object.keys(k.models).length ? "" : "disabled"}>+ Prop</button>${Object.keys(k.models).length ? "" : '<p class="hint">Build a model in the Models tab first.</p>'}</div></div>`;
    },
    after(p) {
      const on = $("#scOn", p); if (on) { on.onclick = () => { k.scene = Object.assign({ mode: "custom", sky: "#9fd6f4", ground: "#d9d2c3", groundPat: "tiles", back: "#8f969c", deck: false, counter: "classic", props: [], camera: { zoom: 1, tilt: 0, pan: 0 } }, k.scene || {}, { mode: "custom" }); save(); ctx.render(); }; return; }
      const S = k.scene; bind($(".card2", p), S);
      $("#scOff", p).onclick = () => { S.mode = ""; save(); ctx.render(); };
      $$(".rule[data-q]", p).forEach((r) => { const i = +r.dataset.q; bind(r, () => S.props[i]); $("[data-x]", r).onclick = () => { S.props.splice(i, 1); save(); ctx.render(); }; });
      $("#prAdd", p).onclick = () => { (S.props = S.props || []).push({ model: Object.keys(k.models)[0], x: 0, z: -3, s: 1 }); save(); ctx.render(); };
      const svg = $("#scMap", p); let drag = null;
      const pt = (e) => { const r = svg.getBoundingClientRect(); return [-9 + (e.clientX - r.left) / r.width * 18, -7 + (e.clientY - r.top) / r.height * 13]; };
      $$("[data-pr]", svg).forEach((g) => g.addEventListener("pointerdown", (e) => { drag = +g.dataset.pr; svg.setPointerCapture(e.pointerId); e.preventDefault(); }));
      svg.addEventListener("pointermove", (e) => { if (drag == null) return; const q = S.props[drag], [x, z] = pt(e), off = q.side === "right" ? 2.6 : q.side === "left" ? -2.6 : 0; q.x = Math.round((x - off) * 10) / 10; q.z = Math.round(z * 10) / 10; const g = $(`[data-pr="${drag}"]`, svg); $("circle", g).setAttribute("cx", x); $("circle", g).setAttribute("cy", z); $("text", g).setAttribute("x", x); $("text", g).setAttribute("y", z + 0.12); });
      svg.addEventListener("pointerup", () => { if (drag != null) { drag = null; save(); ctx.render(); } });
    }
  };

  /* ---------------- customers ---------------- */
  const customers = {
    label: "Customers",
    html() {
      const looks = Object.assign({ "": "Default person" }, modelNames()), dn = {}; (k.districts || []).forEach((d, i) => { if (d.id) dn[d.id] = d.name; });
      const V = k.variants || {};
      return `<p class="hint">Customer types decide who shows up: their look (any 3D model, like a truck), how often they come, speed, patience, tips, order size and what they say. Leave the list empty for the default crowd.</p>` +
        (k.customers || []).map((c, i) => `<div class="rule" data-i="${i}"><div class="row2">${F.txt("name", c.name, "Name", 24)}${F.sel("model", looks, c.model || "", "Looks like")}${F.num("weight", c.weight || 1, "How common", 1, 1, 10)}${F.num("speed", c.speed || 1, "Speed ×", 0.05, 0.3, 3)}${F.num("pat", c.pat || 1, "Patience ×", 0.05, 0.2, 4)}${F.num("tips", c.tips || 1, "Tips ×", 0.05, 0, 5)}${del("cu")}</div>
          <div class="row2">${F.num("size.0", (c.size || [])[0], "Min items", 1, 1, 6)}${F.num("size.1", (c.size || [])[1], "Max items", 1, 1, 6)}${F.num("scale", c.scale, "Size ×", 0.05, 0.4, 3)}${F.txt("say", c.say, "Says on arrival", 40)}</div>
          ${Object.keys(dn).length ? `<div class="row2" style="gap:12px"><span class="fl">Only in</span>${checks("cd", dn, c.districts || [])}</div>` : ""}</div>`).join("") +
        `<button class="ib pri" id="cuAdd">+ Customer type</button>
        <div class="card2" style="margin-top:14px"><h3>Special visitors</h3><div class="row2">${F.sel("vip.model", looks, (V.vip || {}).model || "", "VIP looks like")}${F.txt("vip.banner", (V.vip || {}).banner, "VIP banner", 30)}${F.txt("vip.sub", (V.vip || {}).sub, "VIP subtitle", 60)}</div>
        <div class="row2">${F.sel("insp.model", looks, (V.insp || {}).model || "", "Inspector looks like")}${F.txt("insp.banner", (V.insp || {}).banner, "Inspector banner", 30)}${F.txt("insp.sub", (V.insp || {}).sub, "Inspector subtitle", 60)}</div>
        <div class="row2">${F.sel("courier.model", looks, (V.courier || {}).model || "", "Delivery courier looks like")}</div></div>`;
    },
    after(p) {
      $$(".rule[data-i]", p).forEach((r) => { const i = +r.dataset.i, c = k.customers[i]; bind(r, c); listChecks(r, "cd", () => (c.districts = c.districts || [])); $("[data-x]", r).onclick = () => { k.customers.splice(i, 1); save(); ctx.render(); }; });
      $("#cuAdd", p).onclick = () => { (k.customers = k.customers || []).push({ id: nid("cu"), name: "New customer", model: "", weight: 2 }); save(); ctx.render(); };
      bind($(".card2", p), () => (k.variants = k.variants || {}));
    }
  };

  /* ---------------- rules ---------------- */
  function fld(path, f, v) {
    const [key, label, def, kind] = f; const val = v == null ? def : v;
    if (kind === "t") return F.txt(path + key, val, label, 80);
    if (kind === "ctype") return F.sel(path + key, Object.assign({ "": "Any" }, ctypes()), val, label);
    if (kind === "station") return F.sel(path + key, Object.assign({ "": "All machines" }, stationNames()), val, label);
    if (kind === "hazard") return F.sel(path + key, Object.keys(k.hazards || {}).reduce((m, h) => ((m[h] = k.hazards[h].name || h), m), {}), val, label);
    if (kind && typeof kind === "object") return F.sel(path + key, kind, val, label);
    return F.num(path + key, val, label, 0.05);
  }
  const rules = {
    label: "Rules",
    html() {
      const dn = {}; (k.districts || []).forEach((d, i) => (dn[d.id || d.name] = d.name)); const tn = {}; types().forEach((t) => (tn[t.id] = t.name));
      return `<p class="hint">Rules make events happen: <b>When</b> something happens, <b>if</b> the conditions are true, <b>do</b> the actions. Add a delay to an action to chain things (calm now, a flood in 15 seconds). Built-in district events (seagulls, fog, inspectors) are in the Districts tab.</p>` +
        (k.rules || []).map((r, i) => { const w = r.when || {}, W = WHEN[w.t] || {};
          return `<div class="rule" data-i="${i}"><div class="row2"><span class="fl">When</span>${F.sel("when.t", Object.keys(WHEN).reduce((m, a) => ((m[a] = WHEN[a].n), m), {}), w.t, "Trigger", 1)}${(W.f || []).map((f) => fld("when.", f, w[f[0]])).join("")}${W.type ? F.sel("when.type", Object.assign({ "": "Any customer" }, ctypes()), w.type || "", "Customer type") : ""}${W.station ? F.sel("when.station", Object.assign({ "": "Any machine" }, stationNames()), w.station || "", "Machine") : ""}${W.hazard ? F.sel("when.hazard", Object.assign({ "": "Any hazard" }, Object.keys(k.hazards || {}).reduce((m, h) => ((m[h] = k.hazards[h].name || h), m), {})), w.hazard || "", "Hazard") : ""}${F.txt("note", r.note, "Note", 60)}${del("ru")}</div>
            ${(r.if || []).map((c, j) => `<div class="row2"><span class="fl">${j ? "and" : "If"}</span>${F.sel(`if.${j}.v`, COND_V, String(c.v).startsWith("var.") ? "var" : c.v, "Value", 1)}${String(c.v).startsWith("var.") ? `<div class="fld"><label>Variable</label><input data-vn="${j}" value="${esc(String(c.v).slice(4))}" maxlength="20"></div>` : ""}${c.v === "district" ? F.sel(`if.${j}.op`, { "==": "is", "!=": "is not" }, c.op, "") + F.sel(`if.${j}.n`, dn, c.n, "District") : c.v === "type" ? F.sel(`if.${j}.op`, { "==": "is", "!=": "is not" }, c.op, "") + F.sel(`if.${j}.n`, tn, c.n, "Shop type") : c.v === "chance" ? F.num(`if.${j}.n`, c.n, "Percent", 1, 0, 100) : F.sel(`if.${j}.op`, OPS, c.op || ">=", "") + F.num(`if.${j}.n`, c.n, "Number", 0.1)}<button class="x" data-cx="${j}" title="Remove" style="align-self:center">✕</button></div>`).join("")}
            ${(r.do || []).map((a, j) => `<div class="row2"><span class="fl">${j ? "and" : "Do"}</span>${F.sel(`do.${j}.t`, Object.keys(DO).reduce((m, x) => ((m[x] = DO[x].n), m), {}), a.t, "Action", 1)}${((DO[a.t] || {}).f || []).map((f) => fld(`do.${j}.`, f, a[f[0]])).join("")}${F.num(`do.${j}.delay`, a.delay || 0, "Delay (sec)", 1, 0, 300)}<button class="x" data-dx="${j}" title="Remove" style="align-self:center">✕</button></div>`).join("")}
            <div class="row2"><button class="ib sm" data-addc>+ Condition</button><button class="ib sm" data-addd>+ Action</button></div></div>`; }).join("") +
        `<button class="ib pri" id="ruAdd">+ Rule</button>`;
    },
    after(p) {
      $$(".rule[data-i]", p).forEach((el) => { const i = +el.dataset.i, r = k.rules[i];
        bind(el, r, (x) => { const pth = x.dataset.p; const m = /^if\.(\d+)\.v$/.exec(pth); if (m && x.value === "var") r.if[+m[1]].v = "var.x"; if (/^do\.\d+\.t$/.test(pth)) { const a = r.do[+pth.split(".")[1]]; Object.keys(a).forEach((f) => { if (!["t", "delay"].includes(f)) delete a[f]; }); ((DO[a.t] || {}).f || []).forEach((f) => (a[f[0]] = f[3] === "hazard" ? Object.keys(k.hazards || {})[0] || "" : f[2])); } if (pth === "when.t") { r.when = { t: r.when.t }; ((WHEN[r.when.t] || {}).f || []).forEach((f) => (r.when[f[0]] = f[2])); } save(); });
        $$("[data-vn]", el).forEach((x) => (x.oninput = () => { r.if[+x.dataset.vn].v = "var." + x.value.replace(/[^\w]/g, ""); save(); }));
        $$("[data-cx]", el).forEach((x) => (x.onclick = () => { r.if.splice(+x.dataset.cx, 1); save(); ctx.render(); }));
        $$("[data-dx]", el).forEach((x) => (x.onclick = () => { r.do.splice(+x.dataset.dx, 1); save(); ctx.render(); }));
        $("[data-addc]", el).onclick = () => { (r.if = r.if || []).push({ v: "day", op: ">=", n: 2 }); save(); ctx.render(); };
        $("[data-addd]", el).onclick = () => { (r.do = r.do || []).push({ t: "toast", text: "Something happened!" }); save(); ctx.render(); };
        $("[data-x]", el).onclick = () => { if (!confirm("Delete this rule?")) return; k.rules.splice(i, 1); save(); ctx.render(); }; });
      $("#ruAdd", p).onclick = () => { (k.rules = k.rules || []).push({ when: { t: "every", sec: 40 }, if: [], do: [{ t: "burst", n: 3 }, { t: "banner", big: "Rush hour!", small: "Here they come", kind: "hot" }] }); save(); ctx.render(); };
    }
  };

  /* ---------------- hazards ---------------- */
  const hazards = {
    label: "Hazards",
    html() {
      const H = k.hazards || {}, looks = Object.assign({ "": "Seagull" }, modelNames());
      return `<p class="hint">Hazards fly in and must be tapped before they hit. Start them from a rule (Start hazard), for example every 30 seconds in one district.</p>` +
        Object.keys(H).map((id) => { const h = H[id]; return `<div class="rule" data-h="${esc(id)}"><div class="row2">${F.txt("name", h.name, "Name", 24)}${F.sel("model", looks, h.model || "", "Looks like")}${F.sel("effect", { steal: "Steals an item from the tray", money: "Costs money", rep: "Hurts reputation", patience: "Makes customers impatient" }, h.effect || "steal", "If it hits", 1)}${h.effect && h.effect !== "steal" ? F.num("amount", h.amount, "Amount", 0.05) : ""}${F.num("dur", h.dur || 2.6, "Seconds to arrive", 0.1, 0.8, 10)}${del("hz")}</div>
          <div class="row2">${F.txt("banner", h.banner, "Banner", 30)}${F.txt("sub", h.sub, "Banner subtitle", 60)}${F.txt("hitText", h.hitText, "When it hits", 60)}${F.txt("clearText", h.clearText, "When cleared", 40)}${F.sel("sound", Object.assign({ "": "None" }, SOUNDS), h.sound || "", "Sound")}</div></div>`; }).join("") + `<button class="ib pri" id="hzAdd">+ Hazard</button>`;
    },
    after(p) {
      $$(".rule[data-h]", p).forEach((r) => { const id = r.dataset.h; bind(r, k.hazards[id]); $("[data-x]", r).onclick = () => { delete k.hazards[id]; save(); ctx.render(); }; });
      $("#hzAdd", p).onclick = () => { k.hazards = k.hazards || {}; k.hazards[nid("hz")] = { name: "Seagull", effect: "steal", dur: 2.6, banner: "Seagull!", sub: "Tap it before it grabs something" }; save(); ctx.render(); };
    }
  };

  /* ---------------- text ---------------- */
  const text = {
    label: "Text",
    html() {
      const tm = Object.entries(k.terms || {}), N = k.names || {}, tn = {}; types().forEach((t) => (tn[t.id] = t.name));
      return `<div class="grid2"><div class="card2"><h3>Words</h3><p class="hint">Rename words everywhere in the game: buttons, tips, menus, the tutorial. "customer" → "driver", "tips" → "fees".</p>
        <div class="row2">${F.txt("currency", k.currency, "Currency symbol", 4)}</div>
        ${tm.map(([a, b], i) => `<div class="row2" data-tm="${i}"><div class="fld"><label>Word</label><input data-tf value="${esc(a)}" maxlength="30"></div><div class="fld"><label>Becomes</label><input data-tt value="${esc(b)}" maxlength="30"></div><button class="x" data-tx title="Remove" style="align-self:center">✕</button></div>`).join("")}
        <button class="ib sm" id="tmAdd">+ Word</button>
        <h3 style="margin-top:14px">Tutorial</h3>${Object.keys(TEXT_KEYS).map((a) => F.txt("text." + a, (k.text || {})[a], TEXT_KEYS[a], 60)).join("")}
        <h3 style="margin-top:14px">Topping rack</h3><div class="row2">${F.txt("rack.name", (k.rack || {}).name, "Name", 24)}${F.txt("rack.desc", (k.rack || {}).desc, "Description", 140)}</div>
        <h3 style="margin-top:14px">Cities</h3><div class="fld"><label>City names (comma separated)</label><textarea id="cities" maxlength="600">${esc((k.cities || []).join(", "))}</textarea></div></div>
        <div class="card2"><h3>Staff</h3>${Object.keys(ROLE_IDS).map((r) => `<div class="row2">${F.txt(`staff.${r}.name`, ((k.staff || {})[r] || {}).name, ROLE_IDS[r] + " name", 24)}${F.txt(`staff.${r}.desc`, ((k.staff || {})[r] || {}).desc, "What they do", 140)}</div>`).join("")}
        <h3 style="margin-top:14px">Shop sizes</h3><div class="row2">${SIZE_IDS.map((s, i) => F.txt(`sizes.${i}.name`, ((k.sizes || [])[i] || {}).name, s, 20)).join("")}</div>
        <details style="margin-top:14px"><summary class="fl">Empire: headquarters, holdings, marketing, dirty tricks</summary>
        ${["hq", "hold", "mkt", "sab"].map((g) => `<h4 style="margin:10px 0 4px">${{ hq: "Headquarters upgrades", hold: "Holdings", mkt: "Marketing", sab: "Dirty tricks" }[g]}</h4>` + Object.keys(NAME_IDS[g]).map((id) => `<div class="row2">${F.txt(`names.${g}.${id}.name`, ((N[g] || {})[id] || {}).name, NAME_IDS[g][id], 30)}${F.txt(`names.${g}.${id}.${g === "hq" || g === "hold" ? "eff" : "desc"}`, ((N[g] || {})[id] || {})[g === "hq" || g === "hold" ? "eff" : "desc"], "Effect text", 140)}${g === "hold" && Object.keys(tn).length ? F.sel(`names.hold.${id}.ind`, Object.assign({ "": "Any shop" }, tn), ((N.hold || {})[id] || {}).ind || "", "Needs shop type") : ""}</div>`).join("")).join("")}</details></div></div>`;
    },
    after(p) {
      bind(p, k);
      const ci = $("#cities", p); ci.oninput = () => { k.cities = ci.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 40); save(); };
      const terms = () => { const o = {}; $$("[data-tm]", p).forEach((r) => { const a = $("[data-tf]", r).value.trim(), b = $("[data-tt]", r).value; if (a) o[a] = b; }); k.terms = o; save(); };
      $$("[data-tm] input", p).forEach((x) => (x.oninput = terms));
      $$("[data-tm] [data-tx]", p).forEach((x) => (x.onclick = () => { x.closest("[data-tm]").remove(); terms(); ctx.render(); }));
      $("#tmAdd", p).onclick = () => { k.terms = Object.assign({}, k.terms || {}); let w = "word", n = 1; while (k.terms[w]) w = "word" + ++n; k.terms[w] = ""; save(); ctx.render(); };
    }
  };

  return { types: typesTab, machines, models, scene, customers, rules, hazards, text };
}
