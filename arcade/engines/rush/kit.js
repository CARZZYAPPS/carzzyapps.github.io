// Rush engine kit for Lazer Studio: a no-code editor over the Rush tycoon engine's data.
// A project is { engine:"rush", title, desc, kit:{ name, theme, bases, toppings, stations, recipes, districts, dayLen, cash } }.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

export const MODELS = {
  espresso: { kind: "cooker", label: "Espresso machine (cups, one at a time)" }, oven: { kind: "cooker", label: "Oven (bakes, can burn)" }, fryer: { kind: "cooker", label: "Fryer (one at a time, can burn)" },
  blender: { kind: "cooker", label: "Blender (one at a time, goes watery)" }, waffle: { kind: "cooker", label: "Press / iron (one at a time)" },
  steamer: { kind: "batch", label: "Jug / steamer (makes a topping batch)" }, drip: { kind: "batch", label: "Pot brewer (batch)" }, cold: { kind: "batch", label: "Tower (batch, slow)" },
  cakes: { kind: "batch", label: "Cake stand (sliced batch)" }, juicer: { kind: "batch", label: "Press / juicer (pitcher)" }, bowls: { kind: "batch", label: "Prep station (bowls)" },
  softserve: { kind: "batch", label: "Swirl machine (cones)" }, freezer: { kind: "batch", label: "Freezer (scoops)" }
};
export const VESSELS = { cup: "Small cup", mug: "Mug", clear: "Clear iced cup", tall: "Tall glass", bowl: "Bowl", cone: "Cone", icecup: "Paper cup", plate: "Plate (food)" };
export const FOODS = { croissant: "Croissant / pastry", donut: "Donut / bagel", cake: "Cake slice", waffle: "Waffle / pancake" };
export const LOOKS = { drizzle: "Drizzle", whip: "Whipped top", dust: "Dusting", sprinkles: "Sprinkles", glaze: "Glaze", dollop: "Dollop", berries: "Berries", banana: "Slices", granola: "Crumble", mint: "Leaves", cherry: "Cherry on top", nuts: "Nuts" };
export const BOXES = { pump: "Pump bottle", can: "Spray can", shaker: "Shaker", tub: "Tub", bowl: "Bowl" };
export const EVENTS = { classes: "Class rush (crowds in waves)", gull: "Seagulls steal from the tray", heat: "Heatwave (cold sells)", boarding: "Boarding calls (impatient)", snow: "Snowstorms (calm, then a stampede)", fog: "Fog (calm, then everyone)", inspector: "Health inspector visits" };
export const BACKDROPS = { street: "Street", campus: "Campus", towers: "Office towers", ocean: "Beach", old: "Old town", runway: "Airport", snow: "Ski slopes", park: "Park", night: "Night market", harbor: "Harbor" };
export const TAGS = ["hot", "cold", "food", "fancy", "healthy"];

function mk(name, desc, kit) { return { v: 1, engine: "rush", title: name, desc, kit: Object.assign({ dayLen: 150, cash: 60 }, kit) }; }
export const STARTERS = {
  boba: { name: "Boba Bar", blurb: "Milk teas, fruit teas and toppings. A full shop to remix.", img: "", make() { return mk("Boba Bar", "Shake milk teas, add pearls and jelly, and grow a boba empire.", {
    name: "Boba bar", theme: { wall: "#f6c6d8", wall2: "#e79ab8", accent: "#7ad3c6", counter: "#ffd7a8", top: "#fffaf5", trim: "#a25b7a", flA: "#fff4ea", flB: "#f1d0de", stn: "#7ad3c6" },
    bases: { k_milktea: { name: "Milk tea", vessel: "clear", liq: "#c99a6b" }, k_fruittea: { name: "Fruit tea", vessel: "tall", liq: "#ff8a5c" }, k_matcha: { name: "Matcha", vessel: "clear", liq: "#7fbf5a" } },
    toppings: { k_pearl: { name: "Tapioca pearls", col: "#3a2016", vis: "nuts", box: "bowl", lvl: 1, cost: 0 }, k_jelly: { name: "Lychee jelly", col: "#f5f0d0", vis: "granola", box: "bowl", lvl: 2, cost: 60 }, k_foam: { name: "Cheese foam", col: "#fff6e0", vis: "whip", box: "can", lvl: 3, cost: 120 }, k_mango: { name: "Mango", col: "#ffbe2e", vis: "banana", box: "bowl", lvl: 5, cost: 200 } },
    stations: [{ model: "cold", name: "Tea tower", makes: "k_milktea", time: 5, stale: 40, serv: 4, lvl: 1, cost: 0, desc: "Brews a batch of milk tea." }, { model: "blender", name: "Shaker", makes: "k_fruittea", time: 4.5, burn: 7, slots: 2, lvl: 1, cost: 0, desc: "Shakes fruit teas one at a time." }, { model: "juicer", name: "Matcha whisk", makes: "k_matcha", time: 5.5, stale: 36, serv: 4, lvl: 4, cost: 260, desc: "Whisks a pitcher of matcha." }],
    recipes: [{ base: "k_milktea", comps: [], name: "Milk tea", price: 4, w: 3, tags: "cold" }, { base: "k_milktea", comps: ["k_pearl"], name: "Pearl milk tea", price: 5.25, w: 4, tags: "cold" }, { base: "k_fruittea", comps: [], name: "Fruit tea", price: 4.25, w: 3, tags: "cold healthy" }, { base: "k_fruittea", comps: ["k_jelly"], name: "Lychee fruit tea", price: 5.5, w: 2, tags: "cold healthy" }, { base: "k_milktea", comps: ["k_foam", "k_pearl"], name: "Cloud tea", price: 6.75, w: 2, tags: "cold fancy" }, { base: "k_fruittea", comps: ["k_mango"], name: "Mango tea", price: 6, w: 2, tags: "cold healthy" }, { base: "k_matcha", comps: ["k_foam"], name: "Matcha cloud", price: 7, w: 2, tags: "cold fancy" }],
    districts: [{ name: "Mall Court", demand: 1, pat: 1, tips: 1, price: 1, twist: "Shoppers on a break." }, { name: "High School", lvl: 4, cost: 1500, demand: 1.25, pat: 1.2, tips: 0.6, price: 0.85, am: 0.4, lunch: 1.6, ev: ["classes"], pref: { cold: 1.6 }, win: "campus", twist: "Huge after-school rush." }, { name: "Beach Walk", lvl: 7, cost: 6000, demand: 1.2, pat: 1, tips: 1.2, price: 1.15, ev: ["gull", "heat"], pref: { cold: 2 }, win: "ocean", twist: "Hot days and hungry gulls." }] }); } },
  dessert: { name: "Dessert Diner", blurb: "Waffles, cakes and sundaes with a topping bar.", make() { return mk("Dessert Diner", "Waffles, cakes and sundaes. Keep the iron from burning.", {
    name: "Dessert diner", theme: { wall: "#9fd2ff", wall2: "#6aaeea", accent: "#ff79b4", counter: "#ffd166", top: "#ffffff", trim: "#3d5a99", flA: "#ffffff", flB: "#ffe1ef", stn: "#ff79b4" },
    bases: { k_waffle: { name: "Waffle", vessel: "plate", food: "waffle" }, k_cake: { name: "Cake slice", vessel: "plate", food: "cake" }, k_sundae: { name: "Sundae", vessel: "icecup", scoop: "#ffe3b3" } },
    toppings: { k_syrup: { name: "Maple syrup", col: "#c47a1f", vis: "drizzle", box: "pump", lvl: 1, cost: 0 }, k_straw: { name: "Strawberries", col: "#e0244a", vis: "berries", box: "bowl", lvl: 1, cost: 0 }, k_cream: { name: "Whipped cream", col: "#ffffff", vis: "whip", box: "can", lvl: 3, cost: 100 }, k_choc: { name: "Fudge", col: "#4a2312", vis: "drizzle", box: "pump", lvl: 5, cost: 180 } },
    stations: [{ model: "waffle", name: "Waffle iron", makes: "k_waffle", time: 6, burn: 5.5, slots: 2, lvl: 1, cost: 0 }, { model: "freezer", name: "Sundae freezer", makes: "k_sundae", time: 6, stale: 60, serv: 4, lvl: 1, cost: 0 }, { model: "cakes", name: "Cake stand", makes: "k_cake", time: 9, stale: 70, serv: 5, lvl: 4, cost: 320 }],
    recipes: [{ base: "k_waffle", comps: ["k_syrup"], name: "Maple waffle", price: 4.5, w: 3, tags: "food" }, { base: "k_waffle", comps: ["k_cream", "k_straw"], name: "Berry waffle", price: 6.25, w: 2, tags: "food fancy" }, { base: "k_sundae", comps: [], name: "Vanilla sundae", price: 3.75, w: 3, tags: "cold" }, { base: "k_sundae", comps: ["k_choc", "k_cream"], name: "Hot fudge sundae", price: 6, w: 2, tags: "cold fancy" }, { base: "k_cake", comps: ["k_straw"], name: "Strawberry cake", price: 5.5, w: 2, tags: "food" }],
    districts: [{ name: "Main Street", twist: "Families out for a treat." }, { name: "Night Market", lvl: 5, cost: 4000, demand: 1.4, eve: 2.4, am: 0.3, big: 1, pref: { fancy: 1.5 }, win: "night", twist: "Big groups at dusk." }] }); } },
  coffee: { name: "Coffee Cart", blurb: "The classic: espresso, milk and syrups. Make it yours.", make() { return mk("Coffee Cart", "A tiny coffee cart. Pull shots, steam milk, grow.", {
    name: "Coffee cart", theme: { wall: "#3f8f7a", wall2: "#2c6a5a", accent: "#ffb83d", counter: "#a0663f", top: "#f4e8d6", trim: "#5b3a25", flA: "#f6ead6", flB: "#ddb48c", stn: "#e2553f" },
    bases: { k_esp: { name: "Espresso", vessel: "cup", liq: "#4a2412" }, k_drip: { name: "Drip coffee", vessel: "mug", liq: "#3b1d0c", mug: "#e9584a" } },
    toppings: { k_milk: { name: "Steamed milk", col: "#f7efe2", vis: "dollop", box: "tub" }, k_caramel: { name: "Caramel", col: "#e0952e", vis: "drizzle", box: "pump", lvl: 2, cost: 60 }, k_vanilla: { name: "Vanilla", col: "#f3e0b5", vis: "dust", box: "shaker", lvl: 3, cost: 90 } },
    stations: [{ model: "espresso", name: "Espresso machine", makes: "k_esp", time: 4.4, burn: 7, slots: 2, lvl: 1, cost: 0 }, { model: "steamer", name: "Milk steamer", makes: "k_milk", time: 3.4, stale: 22, serv: 3, lvl: 1, cost: 0 }, { model: "drip", name: "Drip brewer", makes: "k_drip", time: 6, stale: 34, serv: 4, lvl: 2, cost: 90 }],
    recipes: [{ base: "k_esp", comps: [], name: "Espresso", price: 3, w: 3, tags: "hot" }, { base: "k_esp", comps: ["k_milk"], name: "Latte", price: 4.5, w: 4, tags: "hot" }, { base: "k_esp", comps: ["k_caramel", "k_milk"], name: "Caramel latte", price: 5.75, w: 3, tags: "hot fancy" }, { base: "k_esp", comps: ["k_milk", "k_vanilla"], name: "Vanilla latte", price: 5.5, w: 2, tags: "hot" }, { base: "k_drip", comps: [], name: "Drip coffee", price: 2.5, w: 3, tags: "hot" }],
    districts: [{ name: "Main Street", twist: "A steady neighborhood crowd." }, { name: "Office Park", lvl: 4, cost: 2500, demand: 1.05, pat: 0.7, tips: 1.6, price: 1.3, am: 2.2, lunch: 0.8, pref: { hot: 1.5 }, win: "towers", twist: "A huge morning rush." }] }); } }
};

export function validate(P) {
  const k = P.kit || {}, errs = [], bases = k.bases || {}, tops = k.toppings || {}, st = k.stations || [];
  if (!st.length) errs.push("Add at least one machine.");
  if (!st.some((s) => (+s.lvl || 1) <= 1)) errs.push("At least one machine needs to be available at level 1.");
  const makes = {}; st.forEach((s) => (makes[s.makes] = s));
  (k.recipes || []).forEach((r) => {
    if (!bases[r.base]) errs.push(`"${r.name}" uses a product that doesn't exist.`);
    else if (!makes[r.base]) errs.push(`Nothing makes ${bases[r.base].name}. Add a machine for it (used by "${r.name}").`);
    (r.comps || []).forEach((c) => { if (!tops[c]) errs.push(`"${r.name}" uses a topping that doesn't exist.`); });
  });
  if ((k.recipes || []).length < 3) errs.push("Add at least 3 menu items.");
  if (!(k.recipes || []).some((r) => makes[r.base] && (+makes[r.base].lvl || 1) <= 1 && (r.comps || []).every((c) => tops[c] && ((+tops[c].lvl || 1) <= 1 || (makes[c] && (+makes[c].lvl || 1) <= 1))))) errs.push("Players need at least one menu item they can make on day 1 (level-1 machine and toppings).");
  if (!(k.districts || []).length) errs.push("Add at least one district.");
  return [...new Set(errs)];
}
export function thumb(P) {
  const k = P.kit || {}, th = k.theme || {}, c = document.createElement("canvas"); c.width = 320; c.height = 180; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, th.wall || "#3f8f7a"); g.addColorStop(1, th.wall2 || "#2c6a5a"); x.fillStyle = g; x.fillRect(0, 0, 320, 180);
  x.fillStyle = th.flA || "#fff"; x.fillRect(0, 130, 320, 50); x.fillStyle = th.counter || "#a0663f"; x.fillRect(0, 108, 320, 26); x.fillStyle = th.top || "#fff"; x.fillRect(0, 104, 320, 8);
  const bs = Object.values(k.bases || {}); bs.slice(0, 4).forEach((b, i) => { const cx = 60 + i * 66; x.fillStyle = b.vessel === "plate" ? "#ffffff" : b.mug || "#ffffff"; if (b.vessel === "plate") { x.beginPath(); x.ellipse(cx, 100, 26, 7, 0, 0, 7); x.fill(); x.fillStyle = "#d89a4a"; x.beginPath(); x.ellipse(cx, 92, 18, 9, 0, 0, 7); x.fill(); } else { x.fillRect(cx - 14, 68, 28, 36); x.fillStyle = b.liq || b.scoop || "#6b3a1f"; x.fillRect(cx - 12, 72, 24, 10); } });
  x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(0, 0, 320, 44); x.fillStyle = "#fff"; x.font = "900 22px system-ui,sans-serif"; x.textBaseline = "middle"; x.fillText((P.title || "Rush game").slice(0, 24), 14, 23);
  x.fillStyle = th.accent || "#ffb83d"; x.font = "800 12px system-ui,sans-serif"; x.fillText("RUSH ENGINE", 14, 160);
  return c.toDataURL("image/jpeg", 0.85);
}

const API = `api.on("start" | "end" | "served" | "walkout" | "arrive"
       | "done" | "burnt" | "levelup" | "hazardHit" | "hazardClear", (data) => {})
api.onTick((dt) => {})             api.onEvent((name, data) => {})
api.action("name", (data) => {})   // call from a rule: Run script action
api.money / api.addMoney(n)        api.score / api.addScore(n)
api.day  api.level  api.time (0..1 of the day)  api.reputation / api.addRep(n)
api.banner("Big", "small")         api.toast("text")    api.ui("text overlay")
api.spawn("customerTypeId", n)     api.burst(n)        api.hazard("hazardId")
api.demand(mult, sec)  api.prices(mult, sec)  api.patience(mult, sec)
api.machineSpeed("machineId", mult, sec)
api.customers  // [{type, patience, items, rush()}]
api.machines   // [{id, name, state}]
api.getVar(k) / api.setVar(k, v)   api.sound("bell")   api.random()`;
const EXAMPLE = `// Happy hour: at the middle of every day, prices go up 30% for 20 seconds.
api.on("start", () => api.setVar("hh", 0));
api.onTick(() => {
  if (api.time > 0.5 && !api.getVar("hh")) {
    api.setVar("hh", 1);
    api.banner("Happy hour!", "Prices +30% for 20s");
    api.prices(1.3, 20);
  }
});`;

/* ---------------- editor ---------------- */
export function editor(app, P, hooks) {
  let tab = "shop";
  const k = P.kit = P.kit || {}; ["bases", "toppings"].forEach((f) => (k[f] = k[f] || {})); ["stations", "recipes", "districts"].forEach((f) => (k[f] = k[f] || [])); k.theme = k.theme || {};
  document.body.classList.add("ed");
  app.innerHTML = `<div class="ed-wrap"><div class="ed-top"><a class="ib sm" href="/arcade/studio/" title="Back">◀</a><input class="ttl" id="ttl" maxlength="60" value="${esc(P.title)}" aria-label="Game title"><span class="stat" id="stat">Saved</span><button class="ib go" id="test">▶ Test</button><button class="ib pri" id="pub">Publish</button></div>
    <div class="tabs2" id="tabs">${[["shop", "Shop"], ["products", "Products"], ["toppings", "Toppings"], ["machines", "Machines"], ["menu", "Menu"], ["districts", "Districts"], ["script", "Script"]].map(([a, n]) => `<button data-t="${a}" class="${a === tab ? "on" : ""}">${n}</button>`).join("")}</div><div class="ed-body"><div class="pane" id="pane"></div></div></div>`;
  $("#ttl").oninput = (e) => hooks.setTitle(e.target.value || "Untitled");
  $("#test").onclick = hooks.test; $("#pub").onclick = hooks.publish;
  $$("#tabs [data-t]").forEach((b) => (b.onclick = () => { tab = b.dataset.t; $$("#tabs [data-t]").forEach((x) => x.classList.toggle("on", x === b)); render(); }));
  const save = () => hooks.save();
  const opt = (m, sel) => Object.keys(m).map((a) => `<option value="${a}" ${a === sel ? "selected" : ""}>${esc(m[a])}</option>`).join("");
  const nameMap = (o) => { const m = {}; Object.keys(o).forEach((a) => (m[a] = o[a].name)); return m; };
  const nid = (p) => p + Date.now().toString(36).slice(-5);
  const num = (path, v, mn, mx, st, label) => `<div class="fld"><label>${label}</label><input type="number" data-k="${path}" value="${v == null ? "" : v}" min="${mn}" max="${mx}" step="${st}"></div>`;
  const txt = (path, v, label, max) => `<div class="fld"><label>${label}</label><input data-k="${path}" value="${esc(v || "")}" maxlength="${max || 40}"></div>`;
  const col = (path, v, label) => `<div class="fld"><label>${label}</label><input type="color" data-k="${path}" value="${esc(v || "#ffffff")}"></div>`;
  const sel = (path, m, v, label) => `<div class="fld"><label>${label}</label><select data-k="${path}">${opt(m, v)}</select></div>`;
  function setPath(path, val) { const ps = path.split("."); let o = k; for (let i = 0; i < ps.length - 1; i++) o = o[ps[i]]; o[ps[ps.length - 1]] = val; }
  function wire(root) {
    $$("[data-k]", root).forEach((el) => { const ev = el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input"; el.addEventListener(ev, () => { setPath(el.dataset.k, el.type === "number" ? +el.value : el.type === "checkbox" ? el.checked : el.value); save(); if (el.dataset.re) render(); }); });
    $$("[data-del]", root).forEach((el) => (el.onclick = () => { const [f, i] = el.dataset.del.split(":"); if (!confirm("Delete this?")) return; if (Array.isArray(k[f])) k[f].splice(+i, 1); else delete k[f][i]; save(); render(); }));
  }
  function render() {
    const p = $("#pane"); let h = "";
    if (tab === "shop") {
      h = `<div class="card2" style="max-width:820px"><h3>Your shop</h3><p class="hint">This runs on the Rush engine, the same one behind Crema Rush: customers, machines, the tray, staff, rivals and an empire. You decide what it sells and how.</p>
        ${txt("name", k.name, "Shop type (e.g. Boba bar)", 30)}<div class="fld"><label>Description</label><textarea id="desc" maxlength="300">${esc(P.desc || "")}</textarea></div>
        <div class="row2">${num("dayLen", k.dayLen || 150, 60, 300, 10, "Day length (seconds)")}${num("cash", k.cash || 60, 20, 5000, 10, "Starting cash")}</div>
        <h3 style="margin-top:12px">Colors</h3><div class="row2">${[["wall", "Wall"], ["wall2", "Wall shade"], ["accent", "Accent"], ["counter", "Counter"], ["top", "Countertop"], ["trim", "Trim"], ["flA", "Floor A"], ["flB", "Floor B"], ["stn", "Machines"]].map(([a, n]) => col("theme." + a, k.theme[a], n)).join("")}</div></div>`;
    } else if (tab === "products") {
      h = `<p class="hint">Products are the base items customers order. Each one needs a machine that makes it.</p>` + Object.keys(k.bases).map((id) => { const b = k.bases[id]; return `<div class="rule"><div class="row2">${txt(`bases.${id}.name`, b.name, "Name", 24)}${`<div class="fld"><label>Served in</label><select data-k="bases.${id}.vessel" data-re="1">${opt(VESSELS, b.vessel)}</select></div>`}
        ${b.vessel === "plate" ? sel(`bases.${id}.food`, FOODS, b.food, "Food look") : b.vessel === "cone" || b.vessel === "icecup" ? col(`bases.${id}.scoop`, b.scoop, "Scoop color") : col(`bases.${id}.liq`, b.liq, "Drink color")}${b.vessel === "mug" ? col(`bases.${id}.mug`, b.mug, "Mug color") : ""}
        <button class="x" data-del="bases:${id}" title="Delete" style="align-self:center">🗑</button></div></div>`; }).join("") + `<button class="ib pri" id="addB">+ Product</button>`;
    } else if (tab === "toppings") {
      h = `<p class="hint">Toppings sit on the topping rack (bought in the shop) or come from a jug machine. Customers order combos of a product plus toppings.</p>` + Object.keys(k.toppings).map((id) => { const t = k.toppings[id]; return `<div class="rule"><div class="row2">${txt(`toppings.${id}.name`, t.name, "Name", 24)}${col(`toppings.${id}.col`, t.col, "Color")}${sel(`toppings.${id}.vis`, LOOKS, t.vis, "Looks like")}${sel(`toppings.${id}.box`, BOXES, t.box, "Container")}${num(`toppings.${id}.lvl`, t.lvl || 1, 1, 30, 1, "Unlock level")}${num(`toppings.${id}.cost`, t.cost || 0, 0, 100000, 10, "Cost")}<button class="x" data-del="toppings:${id}" title="Delete" style="align-self:center">🗑</button></div></div>`; }).join("") + `<button class="ib pri" id="addT">+ Topping</button>`;
    } else if (tab === "machines") {
      const used = k.stations.map((s) => s.model);
      h = `<p class="hint">Pick a machine type for how it works, then name it and tune it. Cookers make one item per slot and can burn. Batch machines make several at once and go stale. Each type can be used once.</p>` + k.stations.map((s, i) => { const M = MODELS[s.model] || {}, makesOpts = Object.assign({}, nameMap(k.bases), s.model === "steamer" ? nameMap(k.toppings) : {}); const avail = {}; Object.keys(MODELS).forEach((m) => { if (m === s.model || used.indexOf(m) < 0) avail[m] = MODELS[m].label; });
        return `<div class="rule"><div class="row2">${`<div class="fld"><label>Type</label><select data-k="stations.${i}.model" data-re="1">${opt(avail, s.model)}</select></div>`}${txt(`stations.${i}.name`, s.name, "Name", 24)}${sel(`stations.${i}.makes`, makesOpts, s.makes, "Makes")}</div>
          <div class="row2">${num(`stations.${i}.time`, s.time || 5, 1, 20, 0.1, "Seconds to make")}${M.kind === "cooker" ? num(`stations.${i}.burn`, s.burn || 6, 2, 30, 0.5, "Burns after (sec)") + num(`stations.${i}.slots`, s.slots || 2, 1, 4, 1, "Slots") : num(`stations.${i}.stale`, s.stale || 30, 5, 120, 1, "Goes stale after (sec)") + num(`stations.${i}.serv`, s.serv || 4, 1, 10, 1, "Servings per batch")}
          ${num(`stations.${i}.lvl`, s.lvl || 1, 1, 30, 1, "Unlock level")}${num(`stations.${i}.cost`, s.cost || 0, 0, 1000000, 10, "Cost")}<button class="x" data-del="stations:${i}" title="Delete" style="align-self:center">🗑</button></div></div>`; }).join("") + `<button class="ib pri" id="addS" ${used.length >= Object.keys(MODELS).length ? "disabled" : ""}>+ Machine</button>`;
    } else if (tab === "menu") {
      const tops = Object.keys(k.toppings);
      h = `<p class="hint">Menu items = a product plus any toppings. Popularity sets how often people order it. Tags decide which districts love it.</p>` + k.recipes.map((r, i) => `<div class="rule"><div class="row2">${txt(`recipes.${i}.name`, r.name, "Name", 28)}${sel(`recipes.${i}.base`, nameMap(k.bases), r.base, "Product")}${num(`recipes.${i}.price`, r.price || 4, 0.5, 200, 0.25, "Price")}${num(`recipes.${i}.w`, r.w || 2, 1, 5, 1, "Popularity (1-5)")}<button class="x" data-del="recipes:${i}" title="Delete" style="align-self:center">🗑</button></div>
        <div class="row2" style="gap:14px"><span class="fl">Toppings</span>${tops.map((t) => `<label class="sl" style="margin:0"><input type="checkbox" data-rc="${i}:${t}" ${(r.comps || []).includes(t) ? "checked" : ""}> ${esc(k.toppings[t].name)}</label>`).join("") || '<span class="hint" style="margin:0">No toppings yet</span>'}</div>
        <div class="row2" style="gap:14px;margin-top:6px"><span class="fl">Tags</span>${TAGS.map((t) => `<label class="sl" style="margin:0"><input type="checkbox" data-rt="${i}:${t}" ${(r.tags || "").split(" ").includes(t) ? "checked" : ""}> ${t}</label>`).join("")}</div></div>`).join("") + `<button class="ib pri" id="addR">+ Menu item</button>`;
    } else if (tab === "districts") {
      h = `<p class="hint">Districts are where players open shops. The first one is free. Each later one unlocks at a level and costs money.</p>` + k.districts.map((d, i) => `<div class="rule"><div class="row2">${txt(`districts.${i}.name`, d.name, "Name", 24)}${sel(`districts.${i}.win`, BACKDROPS, d.win || "street", "Backdrop")}${i ? num(`districts.${i}.lvl`, d.lvl || i * 2 + 2, 2, 40, 1, "Unlock level") + num(`districts.${i}.cost`, d.cost || 1500 * i, 100, 10000000, 100, "Cost") : ""}<button class="x" data-del="districts:${i}" title="Delete" style="align-self:center">🗑</button></div>
        <div class="row2">${num(`districts.${i}.demand`, d.demand || 1, 0.3, 3, 0.05, "Crowds ×")}${num(`districts.${i}.pat`, d.pat || 1, 0.3, 3, 0.05, "Patience ×")}${num(`districts.${i}.tips`, d.tips || 1, 0, 3, 0.05, "Tips ×")}${num(`districts.${i}.price`, d.price || 1, 0.5, 3, 0.05, "Prices ×")}${num(`districts.${i}.am`, d.am || 1, 0, 3, 0.1, "Morning rush")}${num(`districts.${i}.lunch`, d.lunch || 1, 0, 3, 0.1, "Lunch rush")}${num(`districts.${i}.eve`, d.eve == null ? 0.5 : d.eve, 0, 3, 0.1, "Evening rush")}</div>
        <div class="row2" style="gap:14px"><span class="fl">Events</span>${Object.keys(EVENTS).map((e) => `<label class="sl" style="margin:0"><input type="checkbox" data-de="${i}:${e}" ${(d.ev || []).includes(e) ? "checked" : ""}> ${esc(EVENTS[e])}</label>`).join("")}</div>
        <div class="row2" style="gap:14px;margin-top:6px"><span class="fl">Loves</span>${TAGS.map((t) => `<label class="sl" style="margin:0"><input type="checkbox" data-dp="${i}:${t}" ${(d.pref || {})[t] ? "checked" : ""}> ${t}</label>`).join("")}</div>
        ${txt(`districts.${i}.twist`, d.twist, "Description", 140)}</div>`).join("") + `<button class="ib pri" id="addD">+ District</button>`;
    }
    else if (tab === "script") {
      h = `<div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(240px,380px)"><div class="card2"><h3>Script</h3><p class="hint">Optional JavaScript that runs inside your game. Games with a script are reviewed by staff before they go public, and scripts run in a locked-down sandbox.</p>
        <textarea id="code" spellcheck="false" style="width:100%;min-height:380px;font:500 13px/1.5 ui-monospace,Menlo,Consolas,monospace;background:#0c0921;color:#e9e4ff;border:1px solid var(--line2);border-radius:12px;padding:12px">${esc(P.script || "")}</textarea>
        <div class="row2" style="margin-top:10px"><button class="ib sm" id="ex">Insert example</button><span class="hint" style="margin:0;align-self:center">${(P.script || "").trim() ? "Publishing will send this game for review." : "No script: publishes instantly."}</span></div></div>
        <div class="card2"><h3>API</h3><pre style="white-space:pre-wrap;font:500 12px/1.5 ui-monospace,monospace;color:var(--tx2);margin:0">${esc(API)}</pre></div></div>`;
    }
    p.innerHTML = h; wire(p);
    const code = $("#code", p); if (code) { code.oninput = () => { P.script = code.value; save(); }; $("#ex", p).onclick = () => { code.value += (code.value ? "\n" : "") + EXAMPLE; P.script = code.value; save(); render(); }; }
    const desc = $("#desc", p); if (desc) desc.oninput = (e) => { P.desc = e.target.value; save(); };
    const on = (id, fn) => { const b = $(id, p); if (b) b.onclick = () => { fn(); save(); render(); }; };
    on("#addB", () => (k.bases[nid("b")] = { name: "New product", vessel: "cup", liq: "#8a4b2a" }));
    on("#addT", () => (k.toppings[nid("t")] = { name: "New topping", col: "#ff6fa8", vis: "sprinkles", box: "shaker", lvl: 1, cost: 50 }));
    on("#addS", () => { const free = Object.keys(MODELS).find((m) => !k.stations.some((s) => s.model === m)); const b = Object.keys(k.bases)[0]; if (free) k.stations.push({ model: free, name: "New machine", makes: b, time: 5, lvl: 1, cost: 100 }); });
    on("#addR", () => { const b = Object.keys(k.bases)[0]; k.recipes.push({ base: b, comps: [], name: "New item", price: 4, w: 2, tags: "" }); });
    on("#addD", () => k.districts.push({ name: "New district", lvl: k.districts.length * 2 + 2, cost: 1500 * k.districts.length, demand: 1, pat: 1, tips: 1, price: 1, win: "street", twist: "" }));
    $$("[data-rc]", p).forEach((el) => (el.onchange = () => { const [i, t] = el.dataset.rc.split(":"), r = k.recipes[+i]; r.comps = (r.comps || []).filter((c) => c !== t); if (el.checked) r.comps.push(t); save(); }));
    $$("[data-rt]", p).forEach((el) => (el.onchange = () => { const [i, t] = el.dataset.rt.split(":"), r = k.recipes[+i]; const s = new Set((r.tags || "").split(" ").filter(Boolean)); el.checked ? s.add(t) : s.delete(t); r.tags = [...s].join(" "); save(); }));
    $$("[data-de]", p).forEach((el) => (el.onchange = () => { const [i, e] = el.dataset.de.split(":"), d = k.districts[+i]; d.ev = (d.ev || []).filter((x) => x !== e); if (el.checked) d.ev.push(e); save(); }));
    $$("[data-dp]", p).forEach((el) => (el.onchange = () => { const [i, t] = el.dataset.dp.split(":"), d = k.districts[+i]; d.pref = d.pref || {}; if (el.checked) d.pref[t] = 1.8; else delete d.pref[t]; save(); }));
  }
  render();
  return { render };
}
