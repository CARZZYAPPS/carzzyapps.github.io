// Lazer Studio 2D engine. Runs a no-code project (levels, objects, behaviors, rules) on a canvas.
// Shared by the Studio editor (test play) and the community player.
export const T = 16;
export const PALETTE = ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8", "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"];
export const KINDS = { player: "Player", enemy: "Enemy", item: "Item", wall: "Wall / ground", goal: "Goal", hazard: "Hazard", decor: "Decoration", projectile: "Projectile" };
export const BEHAVIORS = {
  platformer: { name: "Platformer controls", desc: "Run with ◀ ▶, jump with A / Space.", p: { speed: [90, 30, 200], jump: [240, 120, 420] } },
  topdown: { name: "Top-down controls", desc: "Move in 4 directions.", p: { speed: [80, 30, 200] } },
  runner: { name: "Auto-runner", desc: "Always runs right. A / Space or tap to jump.", p: { speed: [95, 40, 220], jump: [240, 120, 420] } },
  blaster: { name: "Blaster", desc: "Fires a projectile with B / X.", p: { speed: [190, 60, 400], cooldown: [0.35, 0.1, 2] }, o: { bullet: "" } },
  patrol: { name: "Patrol", desc: "Walks back and forth, turns at walls and ledges.", p: { speed: [40, 10, 160] } },
  chase: { name: "Chase player", desc: "Moves toward the player when close.", p: { speed: [45, 10, 160], range: [7, 2, 20] } },
  wander: { name: "Wander", desc: "Wanders around at random.", p: { speed: [30, 10, 120] } },
  shooter: { name: "Shooter", desc: "Fires projectiles on a timer.", p: { every: [2, 0.4, 8], speed: [120, 40, 300] }, o: { bullet: "", aim: "player" } },
  projectile: { name: "Projectile", desc: "Flies straight, breaks on walls.", p: { life: [3, 0.5, 8] } },
  fall: { name: "Falls (gravity)", desc: "Pulled down by gravity even if it doesn't walk.", p: {} },
  float: { name: "Bob", desc: "Gently bobs up and down.", p: {} },
  spin: { name: "Animate", desc: "Plays its animation frames all the time.", p: {} }
};
export const EVENTS = {
  start: { name: "Level starts" },
  every: { name: "Every N seconds", p: { sec: 3 } },
  touch: { name: "touches", o: ["a", "b"] },
  tap: { name: "is tapped / clicked", o: ["a"] },
  key: { name: "Button pressed", k: true },
  score: { name: "Score reaches", p: { n: 100 } },
  timer: { name: "Timer runs out" },
  count: { name: "None left of", o: ["a"] },
  lives: { name: "Lives reach 0" },
  vars: { name: "Variable reaches", p: { n: 10 }, v: true }
};
export const ACTIONS = {
  score: { name: "Add score", p: { n: 10 } },
  life: { name: "Add lives (negative to lose)", p: { n: -1 } },
  destroy: { name: "Destroy", who: true },
  spawn: { name: "Spawn", o: true, at: true },
  bounce: { name: "Bounce up", who: true },
  speed: { name: "Set speed ×", who: true, p: { n: 1.5 } },
  sound: { name: "Play sound", s: true },
  text: { name: "Show text", t: true, p: { sec: 2 } },
  shake: { name: "Shake screen", p: { n: 4 } },
  setvar: { name: "Change variable", v: true, p: { n: 1 } },
  next: { name: "Go to next level" },
  win: { name: "Win the game" },
  lose: { name: "Lose the game" }
};
export const BG = { sky: "Blue sky", sunset: "Sunset", night: "Night", cave: "Cave", space: "Space", forest: "Forest", plain: "Solid color" };

/* ---------------- audio ---------------- */
let AC = null, master = null;
export function audio() { if (AC) return AC; try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) { AC = null; } return AC; }
function tone(f, d, type, vol, delay, f2) { const a = AC; if (!a) return; const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type || "square"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02); }
let NB = null;
function noise(d, vol, freq, delay) { const a = AC; if (!a) return; if (!NB) { NB = a.createBuffer(1, a.sampleRate, a.sampleRate); const c = NB.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1; } const t = a.currentTime + (delay || 0), s = a.createBufferSource(); s.buffer = NB; const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq || 2000; const g = a.createGain(); g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + 0.02); }
export const SOUNDS = {
  jump: () => tone(300, 0.16, "square", 0.06, 0, 620),
  coin: () => { tone(988, 0.06, "square", 0.05); tone(1319, 0.14, "square", 0.05, 0.06); },
  hit: () => { noise(0.18, 0.3, 1200); tone(160, 0.2, "sawtooth", 0.06, 0, 60); },
  shoot: () => tone(880, 0.12, "square", 0.04, 0, 220),
  laser: () => tone(1400, 0.2, "sawtooth", 0.04, 0, 180),
  boom: () => { noise(0.5, 0.45, 600); tone(90, 0.4, "triangle", 0.12, 0, 40); },
  powerup: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.1, "square", 0.05, i * 0.06)),
  blip: () => tone(660, 0.05, "square", 0.05),
  win: () => [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, 0.18, "triangle", 0.08, i * 0.1)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, "square", 0.05, i * 0.14)),
  door: () => { tone(220, 0.1, "square", 0.05); tone(330, 0.16, "square", 0.05, 0.08); },
  splash: () => noise(0.35, 0.3, 900)
};
export function playSound(n) { audio(); if (AC && AC.state === "suspended") AC.resume(); (SOUNDS[n] || SOUNDS.blip)(); }
const N = (s) => { const m = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }; return 440 * Math.pow(2, (m[s[0]] + (s[1] === "#" ? 1 : 0) + (parseInt(s.slice(-1)) - 4) * 12 - 9) / 12); };
export const MUSIC = {
  none: { name: "No music" },
  bouncy: { name: "Bouncy", bpm: 150, lead: "C5 E5 G5 E5 F5 A5 G5 - E5 G5 C6 G5 A5 F5 G5 -", bass: "C3 - G2 - F2 - G2 -", w: "square" },
  chill: { name: "Chill", bpm: 96, lead: "E5 - G5 - A5 - G5 E5 D5 - E5 - C5 - - -", bass: "A2 - - - F2 - - - C3 - - - G2 - - -", w: "triangle" },
  quest: { name: "Quest", bpm: 128, lead: "A4 C5 E5 A5 G5 E5 C5 E5 F4 A4 C5 F5 E5 C5 B4 G4", bass: "A2 - A2 - F2 - F2 - C3 - C3 - G2 - G2 -", w: "square" },
  space: { name: "Space", bpm: 110, lead: "E5 - B4 - G5 - F#5 - E5 - D5 - B4 - - -", bass: "E2 - - - E2 - - - C3 - - - D3 - - -", w: "sawtooth" },
  chase: { name: "Chase", bpm: 172, lead: "E5 E5 G5 E5 A5 G5 E5 D5 E5 E5 G5 B5 A5 G5 E5 -", bass: "E2 E2 E3 E2 E2 E2 E3 E2 C2 C2 C3 C2 D2 D2 D3 D2", w: "square" }
};
let musicT = null;
export function stopMusic() { if (musicT) { clearInterval(musicT); musicT = null; } }
export function playMusic(id) {
  stopMusic(); const m = MUSIC[id]; if (!m || !m.lead) return; audio(); if (!AC) return;
  const lead = m.lead.split(" "), bass = m.bass.split(" "), step = 60 / m.bpm / 2; let i = 0, next = AC.currentTime + 0.1;
  musicT = setInterval(() => {
    while (next < AC.currentTime + 0.25) {
      const l = lead[i % lead.length], b = bass[i % bass.length], d = next - AC.currentTime;
      if (l && l !== "-") tone(N(l), step * 0.9, m.w, 0.025, d);
      if (b && b !== "-") tone(N(b), step * 1.6, "triangle", 0.05, d);
      i++; next += step;
    }
  }, 60);
}

/* ---------------- sprites ---------------- */
const SC = new Map();
export function spriteCanvas(proj, sid, fi) {
  const s = proj.sprites[sid]; if (!s || !s.frames.length) return null;
  const f = s.frames[(fi || 0) % s.frames.length], key = sid + "|" + (fi || 0) % s.frames.length + "|" + f + "|" + (proj.palette || PALETTE).join("");
  let c = SC.get(key); if (c) return c;
  c = document.createElement("canvas"); c.width = c.height = T; const x = c.getContext("2d"), pal = proj.palette || PALETTE;
  for (let i = 0; i < 256; i++) { const ch = f[i]; if (ch && ch !== ".") { x.fillStyle = pal[parseInt(ch, 16)]; x.fillRect(i % 16, (i / 16) | 0, 1, 1); } }
  if (SC.size > 2000) SC.clear(); SC.set(key, c); return c;
}
export function objByChar(proj) { const m = {}; for (const id in proj.objects) m[proj.objects[id].ch] = id; return m; }
function isStatic(o) { return o.kind === "wall" && !(o.behaviors || []).length; }
export function drawBG(x, proj, w, h, camX, camY, t) {
  const st = proj.settings.bg || "sky", col = proj.settings.bgColor || "#5ec8ff";
  const grads = { sky: ["#5ec8ff", "#c8f0ff"], sunset: ["#ff7e5f", "#feb47b"], night: ["#0b1033", "#2a2f6b"], cave: ["#1a1410", "#3a2e24"], space: ["#05010f", "#1b0f3a"], forest: ["#7cd67c", "#d9f7c9"], plain: [col, col] };
  const g = x.createLinearGradient(0, 0, 0, h), c = grads[st] || grads.sky; g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
  if (st === "night" || st === "space") { for (let i = 0; i < 60; i++) { const sx = ((i * 97 - camX * 0.1) % w + w) % w, sy = (i * 53) % (h * 0.8); x.fillStyle = "rgba(255,255,255," + (0.4 + 0.4 * Math.sin(t * 2 + i)) + ")"; x.fillRect(sx, sy, 2, 2); } }
  if (st === "sky" || st === "forest" || st === "sunset") { x.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 6; i++) { const cx = ((i * 211 - camX * 0.25 + t * 6) % (w + 200) + w + 200) % (w + 200) - 100, cy = 30 + (i * 37) % (h * 0.4); x.beginPath(); x.arc(cx, cy, 18, 0, 7); x.arc(cx + 20, cy + 4, 14, 0, 7); x.arc(cx - 18, cy + 6, 12, 0, 7); x.fill(); } }
  if (st === "forest" || st === "sky") { x.fillStyle = st === "forest" ? "rgba(40,120,60,.45)" : "rgba(80,160,120,.35)"; x.beginPath(); x.moveTo(0, h); for (let px = 0; px <= w; px += 20) x.lineTo(px, h * 0.72 + Math.sin((px + camX * 0.4) * 0.012) * 26); x.lineTo(w, h); x.fill(); }
  if (st === "cave") { x.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 10; i++) { const cx = ((i * 157 - camX * 0.3) % (w + 100) + w + 100) % (w + 100) - 50; x.beginPath(); x.moveTo(cx - 20, 0); x.lineTo(cx, 40 + (i * 13) % 50); x.lineTo(cx + 20, 0); x.fill(); } }
}
// Draws one level (no entities moving) into a canvas: used for thumbnails and the editor.
export function renderLevel(proj, li, cw, ch, opt) {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  const L = proj.levels[li || 0], byc = objByChar(proj), vh = Math.min(L.h, 12), z = ch / (vh * T), vw = cw / z;
  let camX = 0, camY = Math.max(0, L.h * T - vh * T);
  if (opt && opt.focusPlayer) { for (let r = 0; r < L.h; r++) for (let q = 0; q < L.w; q++) { const id = byc[L.rows[r][q]]; if (id && proj.objects[id].kind === "player") { camX = Math.max(0, Math.min(L.w * T - vw, q * T - vw / 3)); camY = Math.max(0, Math.min(L.h * T - vh * T, r * T - vh * T / 2)); } } }
  drawBG(x, proj, cw, ch, camX, camY, 0);
  x.save(); x.scale(z, z); x.translate(-Math.round(camX), -Math.round(camY));
  for (let r = 0; r < L.h; r++) for (let q = 0; q < L.w; q++) { const id = byc[L.rows[r][q]]; if (!id) continue; const sc = spriteCanvas(proj, proj.objects[id].sprite, 0); if (sc) x.drawImage(sc, q * T, r * T); }
  x.restore(); return c;
}

/* ---------------- game ---------------- */
export function createGame(host, proj, opts) {
  opts = opts || {};
  const S = proj.settings, byc = objByChar(proj), O = proj.objects;
  const cv = document.createElement("canvas"); cv.className = "lzg-canvas"; cv.style.cssText = "display:block;width:100%;height:100%;touch-action:none;image-rendering:pixelated";
  host.style.position = host.style.position || "relative"; host.appendChild(cv);
  const x = cv.getContext("2d");
  const HK = {}; const hook = (ev, ...a) => { (HK[ev] || []).forEach((f) => { try { f(...a); } catch (e) { scriptErr(e); } }); };
  let errShown = false; function scriptErr(e) { console.warn("script", e); if (!errShown) { errShown = true; flashText("Script error: " + String(e && e.message || e).slice(0, 60), 4); } }
  const G = { li: opts.level || 0, score: 0, lives: S.lives || 3, vars: {}, ended: false, won: false, t: 0, lt: 0, timer: 0, ents: [], grid: null, pairs: new Set(), pops: [], shake: 0, msg: null, every: {}, fired: {}, startCount: {}, paused: false, id: 0 };
  const inp = { left: 0, right: 0, up: 0, down: 0, a: 0, b: 0, pa: 0, pb: 0, taps: [] }, prev = {};
  let raf = 0, last = 0, W = 0, H = 0, z = 2, camX = 0, camY = 0, vw = 0, vh = 0, dpr = 1;
  const gravity = S.gravity ? 820 * (S.gravityStr || 1) : 0;
  const top = !S.gravity;
  const hasB = (o) => (o.behaviors || []).some((b) => b.t === o);
  const beh = (e, t) => (e.d.behaviors || []).find((b) => b.t === t);
  const P = (b, k) => { if (b && b[k] != null) return +b[k]; const d = BEHAVIORS[b.t]; return d && d.p[k] ? d.p[k][0] : 0; };

  function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); const r = host.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); const L = proj.levels[G.li]; vh = Math.min(L.h, 13) * T; z = H / vh; vw = W / z; if (vw > L.w * T && L.w * T > 0) { z = Math.max(z, W / (L.w * T)); vw = W / z; vh = H / z; } }
  function loadLevel(i) {
    G.li = i; const L = proj.levels[i]; G.ents = []; G.pairs = new Set(); G.every = {}; G.fired = {}; G.lt = 0; G.timer = S.timer || 0; G.pops = []; G.grid = new Array(L.w * L.h).fill(null); G.startCount = {};
    for (let r = 0; r < L.h; r++) for (let q = 0; q < L.w; q++) { const id = byc[L.rows[r][q]]; if (!id) continue; const o = O[id]; if (!o) continue;
      if (isStatic(o)) G.grid[r * L.w + q] = id; else spawn(id, q * T, r * T); }
    for (const e of G.ents) G.startCount[e.o] = (G.startCount[e.o] || 0) + 1;
    resize(); const p = player(); if (p) { camX = p.x - vw / 2; camY = p.y - vh / 2; } clampCam();
    flashText(L.name || "Level " + (i + 1), 1.4);
    rules("start", {}); hook("start", G.li + 1);
  }
  function spawn(id, px, py, vx, vy) {
    const o = O[id]; if (!o) return null; const small = o.kind === "projectile";
    const w = small ? 8 : 14, h = small ? 8 : 14;
    const e = { id: G.id++, o: id, d: o, x: px + (T - w) / 2, y: py + (T - h), w, h, vx: vx || 0, vy: vy || 0, dir: 1, ground: false, alive: true, t: 0, sm: 1, inv: 0, sx: px, sy: py, cd: 0, wt: Math.random() * 2, ft: 0 };
    if (small) e.y = py + (T - h) / 2;
    if (vx < 0) e.dir = -1;
    G.ents.push(e); return e;
  }
  const player = () => G.ents.find((e) => e.alive && e.d.kind === "player");
  function solidAt(px, py) { const L = proj.levels[G.li]; const q = Math.floor(px / T), r = Math.floor(py / T); if (q < 0 || q >= L.w) return "__edge"; if (r < 0) return null; if (r >= L.h) return null; const id = G.grid[r * L.w + q]; return id && O[id].solid !== false ? id : null; }
  function moveAxis(e, dx, dy, hits) {
    if (dx) { e.x += dx; const xs = dx > 0 ? e.x + e.w - 0.01 : e.x; for (let yy = e.y + 1; yy < e.y + e.h - 1; yy += 6) { const s = solidAt(xs, yy) || solidAt(xs, e.y + e.h - 1.01); if (s) { if (s !== "__edge") hits.add(s); e.x = dx > 0 ? Math.floor(xs / T) * T - e.w : Math.floor(xs / T) * T + T; e.hitX = true; break; } } }
    if (dy) { e.y += dy; const ys = dy > 0 ? e.y + e.h - 0.01 : e.y; for (let xx = e.x + 1; xx < e.x + e.w; xx += 6) { const s = solidAt(Math.min(xx, e.x + e.w - 1), ys); if (s && s !== "__edge") { hits.add(s); if (dy > 0) { e.y = Math.floor(ys / T) * T - e.h; e.ground = true; } else e.y = Math.floor(ys / T) * T + T; e.vy = 0; e.hitY = true; break; } } }
  }
  function update(dt) {
    G.t += dt; G.lt += dt; const L = proj.levels[G.li]; hook("tick", dt);
    if (G.timer > 0) { G.timer -= dt; if (G.timer <= 0) { G.timer = 0; if (!rules("timer", {})) lose(); } }
    for (const k in proj.rules) { const r = proj.rules[k]; if (r.when.t === "every") { const n = Math.max(0.2, +r.when.sec || 3); G.every[k] = (G.every[k] || 0) + dt; if (G.every[k] >= n) { G.every[k] -= n; runRule(r, {}); } } }
    const pl = player();
    for (const e of G.ents) {
      if (!e.alive) continue; e.t += dt; if (e.inv > 0) e.inv -= dt; if (e.cd > 0) e.cd -= dt;
      const o = e.d, bs = o.behaviors || [], hits = new Set(); let phys = false, mx = 0, my = 0; e.hitX = e.hitY = false;
      for (const b of bs) {
        const sp = P(b, "speed") * e.sm;
        if (b.t === "platformer" || b.t === "runner") {
          phys = true; let dir = b.t === "runner" ? 1 : inp.right - inp.left; if (b.t === "runner") e.vx = sp; else { const tgt = dir * sp; e.vx += (tgt - e.vx) * Math.min(1, dt * (e.ground ? 14 : 7)); if (dir) e.dir = dir; }
          const jp = inp.pa || (inp.pup && !top) || (b.t === "runner" && inp.tapAny);
          if (jp && (e.ground || e.coyote > 0)) { e.vy = -P(b, "jump"); e.ground = false; e.coyote = 0; playSound("jump"); }
          if (!inp.a && !inp.up && e.vy < -60 && b.t !== "runner" && !inp.tapHold) e.vy *= Math.pow(0.0005, dt);
        } else if (b.t === "topdown") { let dx = inp.right - inp.left, dy = inp.down - inp.up; const n = Math.hypot(dx, dy) || 1; e.vx = dx / n * sp; e.vy = dy / n * sp; if (dx) e.dir = dx; if (dx || dy) e.face = [dx / n, dy / n]; }
        else if (b.t === "patrol") { phys = true; if (!e.vx) e.vx = sp * e.dir; e.vx = sp * e.dir; if (gravity && e.ground) { const ax = e.dir > 0 ? e.x + e.w + 2 : e.x - 2; if (!solidAt(ax, e.y + e.h + 4)) { e.dir *= -1; e.vx = sp * e.dir; } } if (top) e.vy = 0; }
        else if (b.t === "chase" && pl) { const dx = pl.x - e.x, dy = pl.y - e.y, d = Math.hypot(dx, dy); if (d < P(b, "range") * T && d > 1) { if (top) { e.vx = dx / d * sp; e.vy = dy / d * sp; } else { phys = true; e.vx = Math.sign(dx) * sp; } e.dir = Math.sign(dx) || e.dir; } else if (top) { e.vx = e.vy = 0; } else { phys = true; e.vx *= 0.9; } }
        else if (b.t === "wander") { e.wt -= dt; if (e.wt <= 0) { e.wt = 1 + Math.random() * 1.5; if (top) { const a = Math.floor(Math.random() * 5); e.vx = [1, -1, 0, 0, 0][a] * sp; e.vy = [0, 0, 1, -1, 0][a] * sp; } else { e.dir = Math.random() < 0.5 ? -1 : 1; e.vx = e.dir * sp; } } if (!top) phys = true; }
        else if (b.t === "fall") phys = true;
        else if (b.t === "shooter") { e.ft += dt; if (e.ft >= P(b, "every")) { e.ft = 0; fire(e, b.bullet, P(b, "speed"), b.aim === "player" && pl ? pl : null); } }
        else if (b.t === "blaster" && inp.pb && e.cd <= 0 && (o.kind === "player")) { e.cd = P(b, "cooldown"); fire(e, b.bullet, P(b, "speed"), null); }
        else if (b.t === "projectile") { if (e.t > P(b, "life")) e.alive = false; }
      }
      if (phys && gravity) { e.vy = Math.min(e.vy + gravity * dt, 600); }
      const wasGround = e.ground; e.ground = false;
      const steps = Math.ceil(Math.max(Math.abs(e.vx), Math.abs(e.vy)) * dt / 6) || 1;
      if (o.kind === "projectile") { e.x += e.vx * dt; e.y += e.vy * dt; const s = solidAt(e.x + e.w / 2, e.y + e.h / 2); if (s) { if (s !== "__edge") hits.add(s); e.alive = false; burst(e.x, e.y, "#fff", 4); } }
      else if (e.vx || e.vy || phys) for (let s = 0; s < steps; s++) { moveAxis(e, e.vx * dt / steps, 0, hits); moveAxis(e, 0, e.vy * dt / steps, hits); }
      if (e.hitX && bs.some((b) => b.t === "patrol" || b.t === "wander")) { e.dir *= -1; e.vx = -e.vx; }
      if (wasGround && !e.ground) e.coyote = 0.08; else if (e.coyote > 0) e.coyote -= dt;
      for (const h of hits) touchEvent(e, { o: h, d: O[h], tile: true, x: e.x, y: e.y });
      if (e.y > L.h * T + 40) { if (o.kind === "player") { hurt(e, true); } else e.alive = false; }
      if (e.x < -T * 2 || e.x > L.w * T + T * 2) e.alive = false;
    }
    // overlaps (fires once when two things start touching)
    const live = G.ents.filter((e) => e.alive), now = new Set();
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i], b = live[j]; if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) { const k = a.id + ":" + b.id; now.add(k); if (!G.pairs.has(k)) touchEvent(a, b); } }
    G.pairs = now;
    G.ents = G.ents.filter((e) => e.alive);
    // conditions
    for (const k in proj.rules) { const r = proj.rules[k], w = r.when;
      if (w.t === "score" && !G.fired[k] && G.score >= (+w.n || 0)) { G.fired[k] = 1; runRule(r, {}); }
      if (w.t === "count" && !G.fired[k] && G.startCount[w.a] && !G.ents.some((e) => e.o === w.a)) { G.fired[k] = 1; runRule(r, {}); }
      if (w.t === "vars" && !G.fired[k] && (G.vars[w.v] || 0) >= (+w.n || 0)) { G.fired[k] = 1; runRule(r, {}); }
      if (w.t === "key" && inp["p" + (w.k || "a")]) runRule(r, { a: player() });
    }
    for (const tp of inp.taps) { let hit = null; for (const e of G.ents) if (tp.x >= e.x - 4 && tp.x <= e.x + e.w + 4 && tp.y >= e.y - 4 && tp.y <= e.y + e.h + 4) hit = e; for (const k in proj.rules) { const r = proj.rules[k]; if (r.when.t === "tap" && (r.when.a === "screen" || (hit && hit.o === r.when.a))) runRule(r, { a: hit, b: hit }); } }
    inp.taps = []; inp.pa = inp.pb = inp.pup = inp.tapAny = 0;
    // camera
    const p2 = player(); if (p2) { const tx = p2.x + p2.w / 2 - vw / 2 + (p2.vx || 0) * 0.25, ty = p2.y - vh / 2; camX += (tx - camX) * Math.min(1, dt * 6); camY += (ty - camY) * Math.min(1, dt * 5); } clampCam();
    for (const p of G.pops) p.t += dt; G.pops = G.pops.filter((p) => p.t < (p.life || 1));
    if (G.msg) { G.msg.t -= dt; if (G.msg.t <= 0) G.msg = null; }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
  }
  function clampCam() { const L = proj.levels[G.li]; camX = Math.max(0, Math.min(L.w * T - vw, camX)); camY = Math.max(0, Math.min(L.h * T - vh, camY)); if (L.w * T < vw) camX = (L.w * T - vw) / 2; if (L.h * T < vh) camY = (L.h * T - vh) / 2; }
  function fire(e, bullet, sp, aimAt) {
    if (!bullet || !O[bullet]) return; let dx = e.dir || 1, dy = 0;
    if (aimAt) { const ax = aimAt.x - e.x, ay = aimAt.y - e.y, d = Math.hypot(ax, ay) || 1; dx = ax / d; dy = ay / d; } else if (top && e.face) { dx = e.face[0]; dy = e.face[1]; }
    const b = spawn(bullet, e.x + e.w / 2 - T / 2 + dx * 8, e.y + e.h / 2 - T / 2 + dy * 8, dx * sp, dy * sp); if (b) { b.src = e.id; b.dir = Math.sign(dx) || 1; } playSound(O[bullet].sound || "shoot");
  }
  function touchEvent(a, b) {
    if (HK.touch) hook("touch", wrapE(a), wrapE(b));
    if (a.src != null && a.src === b.id) return; if (b.src != null && b.src === a.id) return;
    for (const k in proj.rules) { const r = proj.rules[k], w = r.when; if (w.t !== "touch") continue;
      if (a.o === w.a && b.o === w.b) runRule(r, { a, b }); else if (b.o === w.a && a.o === w.b) runRule(r, { a: b, b: a }); }
  }
  function rules(t, ctx) { let any = false; for (const k in proj.rules) { const r = proj.rules[k]; if (r.when.t === t && condOk(r.if)) { any = true; doActions(r.do, ctx); } } return any; }
  function condOk(cs) { return (cs || []).every((c) => { let v = 0; const n = +c.n || 0;
    if (c.v === "score") v = G.score; else if (c.v === "lives") v = G.lives; else if (c.v === "level") v = G.li + 1; else if (c.v === "time") v = G.lt; else if (c.v === "timer") v = G.timer; else if (c.v === "count") v = G.ents.filter((e) => e.o === c.o).length; else if (c.v === "chance") return Math.random() * 100 < n; else v = G.vars[c.v] || 0;
    switch (c.op) { case ">": return v > n; case "<": return v < n; case "<=": return v <= n; case "==": return v == n; case "!=": return v != n; default: return v >= n; } }); }
  function runRule(r, ctx) { if (!condOk(r.if)) return false; doActions(r.do, ctx); return true; }
  function who(w, ctx) { if (w === "player") return player(); return ctx[w || "b"] || null; }
  function doActions(list, ctx) {
    for (const a of list || []) {
      if (G.ended) return;
      const tgt = who(a.who, ctx);
      switch (a.t) {
        case "score": G.score = Math.max(0, G.score + (+a.n || 0)); if (tgt || ctx.b) { const s = tgt || ctx.b; pop(s.x, s.y, ((+a.n || 0) >= 0 ? "+" : "") + a.n, (+a.n || 0) >= 0 ? "#ffec27" : "#ff004d"); } break;
        case "life": { const n = +a.n || 0; if (n < 0) { const p = player(); if (p && p.inv > 0) break; if (p) { p.inv = 1.2; p.vy = gravity ? -160 : p.vy; } G.lives += n; G.shake = 5; playSound("hit"); if (G.lives <= 0) { G.lives = 0; if (!rules("lives", {})) lose(); } } else G.lives += n; break; }
        case "destroy": if (tgt && !tgt.tile) { tgt.alive = false; burst(tgt.x, tgt.y, (proj.palette || PALETTE)[8], 6); } else if (tgt && tgt.tile) { breakTile(tgt); } break;
        case "spawn": { const src = a.at === "random" ? randomCell() : a.at === "player" ? player() : (ctx[a.at || "a"] || player()); if (src && O[a.o]) spawn(a.o, Math.round(src.x / T) * T, Math.round(src.y / T) * T); break; }
        case "bounce": if (tgt && !tgt.tile) { const b = beh(tgt, "platformer") || beh(tgt, "runner"); tgt.vy = -(b ? P(b, "jump") : 240) * 0.75; } break;
        case "speed": if (tgt && !tgt.tile) tgt.sm = +a.n || 1; break;
        case "sound": playSound(a.s); break;
        case "text": flashText(String(a.txt || "").replace(/\{score\}/g, G.score), +a.sec || 2); break;
        case "shake": G.shake = Math.max(G.shake, +a.n || 4); break;
        case "setvar": G.vars[a.v || "x"] = (G.vars[a.v || "x"] || 0) + (+a.n || 0); break;
        case "next": if (G.loading) return; if (G.li + 1 < proj.levels.length) { playSound("door"); G.loading = true; const keep = G.li + 1; setTimeout(() => { G.loading = false; if (!G.ended) loadLevel(keep); }, 0); return; } else { win(); return; }
        case "win": win(); return;
        case "lose": lose(); return;
      }
    }
  }
  function breakTile(t) { const L = proj.levels[G.li]; const q = Math.floor((t.x + 7) / T), r = Math.floor((t.y + 7) / T); for (const [dq, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const i = (r + dr) * L.w + q + dq; if (G.grid[i] === t.o) { G.grid[i] = null; burst((q + dq) * T, (r + dr) * T, "#c2c3c7", 6); return; } } }
  function randomCell() { const L = proj.levels[G.li]; for (let n = 0; n < 60; n++) { const q = Math.floor(Math.random() * L.w), r = Math.floor(Math.random() * L.h); if (!G.grid[r * L.w + q] && !solidAt(q * T + 8, r * T + 8)) return { x: q * T, y: r * T }; } return null; }
  function hurt(e, fell) { G.lives--; G.shake = 6; playSound("hit"); if (G.lives <= 0) { G.lives = 0; if (!rules("lives", {})) lose(); return; } if (fell) { e.x = e.sx + 1; e.y = e.sy + 2; e.vx = e.vy = 0; camX = e.x - vw / 2; } e.inv = 1.4; }
  function pop(px, py, txt, col) { G.pops.push({ x: px + 7, y: py, txt, col, t: 0 }); }
  function burst(px, py, col, n) { for (let i = 0; i < n; i++) G.pops.push({ x: px + 7, y: py + 7, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.8) * 120, col, t: 0, life: 0.5, dot: 1 }); }
  function flashText(t, sec) { G.msg = { txt: t, t: sec || 2 }; }
  function win() { if (G.ended) return; G.ended = true; G.won = true; stopMusic(); playSound("win"); finish(); }
  function lose() { if (G.ended) return; G.ended = true; G.won = false; stopMusic(); playSound("lose"); finish(); }
  function finish() { const res = { score: G.score, won: G.won, time: G.t, level: G.li }; hook("end", res); setTimeout(() => opts.onEnd && opts.onEnd(res), 700); }

  function draw() {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.imageSmoothingEnabled = false;
    const sh = G.shake ? (Math.random() - 0.5) * G.shake : 0, sv = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    drawBG(x, proj, W, H, camX, camY, G.t);
    x.save(); x.scale(z, z); x.translate(-Math.round(camX) + sh, -Math.round(camY) + sv);
    const L = proj.levels[G.li], q0 = Math.max(0, Math.floor(camX / T)), q1 = Math.min(L.w, Math.ceil((camX + vw) / T) + 1), r0 = Math.max(0, Math.floor(camY / T)), r1 = Math.min(L.h, Math.ceil((camY + vh) / T) + 1);
    for (let r = r0; r < r1; r++) for (let q = q0; q < q1; q++) { const id = G.grid[r * L.w + q]; if (!id) continue; const sc = spriteCanvas(proj, O[id].sprite, Math.floor(G.t * (proj.sprites[O[id].sprite] && proj.sprites[O[id].sprite].fps || 4))); if (sc) x.drawImage(sc, q * T, r * T); }
    for (const e of G.ents) {
      if (e.inv > 0 && Math.floor(e.inv * 12) % 2) continue;
      const spr = proj.sprites[e.d.sprite], moving = Math.abs(e.vx) > 5 || Math.abs(e.vy) > 5 || (e.d.behaviors || []).some((b) => b.t === "spin" || b.t === "float"), fi = moving && spr ? Math.floor(G.t * (spr.fps || 6)) : 0;
      const sc = spriteCanvas(proj, e.d.sprite, fi); if (!sc) continue; const bob = (e.d.behaviors || []).some((b) => b.t === "float") ? Math.sin(G.t * 3 + e.id) * 2 : 0;
      const dxp = Math.round(e.x - (T - e.w) / 2), dyp = Math.round(e.y - (T - e.h) + bob) - (e.d.kind === "projectile" ? -(T - e.h) / 2 : 0);
      if (e.dir < 0 && !top) { x.save(); x.translate(dxp + T, dyp); x.scale(-1, 1); x.drawImage(sc, 0, 0); x.restore(); } else x.drawImage(sc, dxp, dyp);
    }
    for (const p of G.pops) { if (p.dot) { x.fillStyle = p.col; x.globalAlpha = 1 - p.t / (p.life || 1); x.fillRect(p.x + (p.vx || 0) * p.t, p.y + (p.vy || 0) * p.t + 100 * p.t * p.t, 2, 2); x.globalAlpha = 1; } }
    x.restore();
    // text pops in screen space
    for (const p of G.pops) if (!p.dot) { const sx = (p.x - camX) * z, sy = (p.y - camY) * z - p.t * 40; x.globalAlpha = 1 - p.t; x.font = "900 " + Math.round(Math.max(14, z * 7)) + "px system-ui,sans-serif"; x.textAlign = "center"; x.lineWidth = 4; x.strokeStyle = "rgba(0,0,0,.6)"; x.strokeText(p.txt, sx, sy); x.fillStyle = p.col; x.fillText(p.txt, sx, sy); x.globalAlpha = 1; }
    // HUD
    x.font = "900 18px system-ui,sans-serif"; x.textAlign = "left"; x.textBaseline = "top"; x.lineWidth = 4; x.strokeStyle = "rgba(0,0,0,.55)";
    const sc = "★ " + G.score.toLocaleString(); x.strokeText(sc, 12, 10); x.fillStyle = "#ffec27"; x.fillText(sc, 12, 10);
    x.textAlign = "right"; const hp = "♥".repeat(Math.max(0, Math.min(G.lives, 10))) + (G.lives > 10 ? "+" : ""); x.strokeText(hp, W - 12, 10); x.fillStyle = "#ff4d6d"; x.fillText(hp, W - 12, 10);
    if (S.timer) { x.textAlign = "center"; const tt = Math.ceil(G.timer) + "s"; x.strokeText(tt, W / 2, 10); x.fillStyle = G.timer < 6 ? "#ff4d6d" : "#fff"; x.fillText(tt, W / 2, 10); }
    for (const v in G.vars) { if (v.startsWith("_")) continue; }
    if (G.msg) { x.textAlign = "center"; x.textBaseline = "middle"; x.font = "900 " + Math.round(Math.min(34, W / 14)) + "px system-ui,sans-serif"; x.globalAlpha = Math.min(1, G.msg.t * 2); x.lineWidth = 6; x.strokeText(G.msg.txt, W / 2, H * 0.32); x.fillStyle = "#fff"; x.fillText(G.msg.txt, W / 2, H * 0.32); x.globalAlpha = 1; }
    if (G.ended) { x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(0, 0, W, H); x.textAlign = "center"; x.textBaseline = "middle"; x.font = "900 " + Math.round(Math.min(48, W / 9)) + "px system-ui,sans-serif"; x.fillStyle = G.won ? "#00e436" : "#ff4d6d"; x.fillText(G.won ? "YOU WIN!" : "GAME OVER", W / 2, H / 2 - 10); x.font = "800 18px system-ui,sans-serif"; x.fillStyle = "#fff"; x.fillText("Score " + G.score.toLocaleString(), W / 2, H / 2 + 30); }
    if (G.paused && !G.ended) { x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(0, 0, W, H); }
  }
  function frame(ts) { raf = requestAnimationFrame(frame); const dt = Math.min(0.04, (ts - last) / 1000 || 0); last = ts; if (!G.ended && !G.paused) update(dt); draw(); }

  /* input */
  const KEYS = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", " ": "a", z: "a", Z: "a", x: "b", X: "b", k: "b", K: "b", j: "a", J: "a", Enter: "b" };
  function press(k, on) { if (on && !inp[k]) { if (k === "a") inp.pa = 1; if (k === "b") inp.pb = 1; if (k === "up") inp.pup = 1; if (k === "down") inp.pdown = 1; if (k === "left") inp.pleft = 1; if (k === "right") inp.pright = 1; } inp[k] = on ? 1 : 0; }
  const kd = (e) => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const k = KEYS[e.key]; if (k) { press(k, true); e.preventDefault(); } audio(); };
  const ku = (e) => { const k = KEYS[e.key]; if (k) press(k, false); };
  window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
  const pd = (e) => { audio(); if (AC && AC.state === "suspended") AC.resume(); const r = cv.getBoundingClientRect(); inp.taps.push({ x: (e.clientX - r.left) / z + camX, y: (e.clientY - r.top) / z + camY }); inp.tapAny = 1; inp.tapHold = 1; };
  const pu = () => { inp.tapHold = 0; };
  cv.addEventListener("pointerdown", pd); window.addEventListener("pointerup", pu);
  let pad = null;
  const touch = opts.touch != null ? opts.touch : matchMedia("(pointer:coarse)").matches;
  if (touch && S.controls !== "tap") {
    pad = document.createElement("div"); pad.className = "lzg-pad";
    const mode = S.controls || (top ? "topdown" : "platformer"), hasBl = Object.values(O).some((o) => o.kind === "player" && (o.behaviors || []).some((b) => b.t === "blaster"));
    const btn = (k, label, css) => `<button data-k="${k}" style="${css}">${label}</button>`;
    const base = "position:absolute;width:64px;height:64px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);color:#fff;font:900 22px system-ui;touch-action:none;user-select:none;-webkit-user-select:none;";
    let h = "";
    if (mode === "topdown") h += btn("up", "▲", base + "left:76px;bottom:146px") + btn("left", "◀", base + "left:12px;bottom:82px") + btn("right", "▶", base + "left:140px;bottom:82px") + btn("down", "▼", base + "left:76px;bottom:18px");
    else if (mode === "runner") h += "";
    else h += btn("left", "◀", base + "left:14px;bottom:20px") + btn("right", "▶", base + "left:90px;bottom:20px");
    if (mode !== "topdown") h += btn("a", "A", base + "right:" + (hasBl ? 90 : 16) + "px;bottom:20px;width:72px;height:72px;background:rgba(255,77,109,.55)");
    if (hasBl) h += btn("b", "B", base + "right:16px;bottom:" + (mode === "topdown" ? 40 : 96) + "px;background:rgba(41,173,255,.55)");
    pad.innerHTML = h; pad.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:3";
    pad.querySelectorAll("button").forEach((b) => { b.style.pointerEvents = "auto"; const k = b.dataset.k; b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); audio(); press(k, true); }); ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, () => press(k, false))); });
    host.appendChild(pad);
  }
  function wrapE(e) { if (!e) return null; if (e.tile) return { id: e.o, name: O[e.o] ? O[e.o].name : e.o, tile: true, x: e.x / T, y: e.y / T, destroy() { breakTile(e); } };
    return { id: e.o, name: e.d.name, kind: e.d.kind, get x() { return e.x / T; }, get y() { return e.y / T; }, set x(v) { e.x = v * T; }, set y(v) { e.y = v * T; }, get vx() { return e.vx; }, get vy() { return e.vy; },
      setVel(vx, vy) { e.vx = +vx || 0; e.vy = +vy || 0; }, destroy() { e.alive = false; }, get alive() { return e.alive; } }; }
  if (opts.script && String(opts.script).trim()) {
    const api = {
      on(ev, f) { (HK[ev] = HK[ev] || []).push(f); }, onTick(f) { this.on("tick", f); },
      get score() { return G.score; }, addScore(n) { G.score = Math.max(0, G.score + (+n || 0)); }, setScore(n) { G.score = Math.max(0, +n || 0); },
      get lives() { return G.lives; }, addLives(n) { G.lives += +n || 0; if (G.lives <= 0) { G.lives = 0; if (!rules("lives", {})) lose(); } },
      get level() { return G.li + 1; }, nextLevel() { doActions([{ t: "next" }], {}); }, win() { win(); }, lose() { lose(); },
      text(t, sec) { flashText(String(t), +sec || 2); }, sound(n) { playSound(n); }, shake(n) { G.shake = Math.max(G.shake, +n || 4); },
      spawn(id, x, y, vx, vy) { const o = Object.keys(O).find((k) => k === id || O[k].name === id); if (!o) return null; return wrapE(spawn(o, (+x || 0) * T, (+y || 0) * T, vx, vy)); },
      objects(id) { return G.ents.filter((e) => e.alive && (!id || e.o === id || e.d.name === id)).map(wrapE); }, player() { return wrapE(player()); },
      getVar(k) { return G.vars[k] || 0; }, setVar(k, v) { G.vars[k] = v; }, key(k) { return !!inp[k]; }, random: Math.random,
      get time() { return G.lt; }
    };
    try { (new Function("api", '"use strict";\n' + opts.script))(api); } catch (e) { scriptErr(e); }
  }
  const ro = new ResizeObserver(() => resize()); ro.observe(host);
  loadLevel(G.li); if (S.music && S.music !== "none" && opts.music !== false) playMusic(S.music);
  raf = requestAnimationFrame((t) => { last = t; frame(t); });
  return {
    state: G,
    pause(on) { G.paused = on; },
    destroy() { cancelAnimationFrame(raf); stopMusic(); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("pointerup", pu); ro.disconnect(); cv.remove(); if (pad) pad.remove(); },
    press, // for tests
    end(won) { G.score += 0; won ? win() : lose(); },
    step(dt) { if (!G.ended) update(dt || 1 / 60); }
  };
}

/* ---------------- project helpers ---------------- */
export function validate(proj) {
  const errs = [];
  if (!proj.levels || !proj.levels.length) errs.push("Add at least one level.");
  if (!Object.values(proj.objects).some((o) => o.kind === "player")) errs.push("You need a Player object.");
  const byc = objByChar(proj); let hasP = false;
  (proj.levels || []).forEach((L) => L.rows.forEach((row) => { for (const ch of row) { const id = byc[ch]; if (id && proj.objects[id].kind === "player") hasP = true; } }));
  if (!hasP) errs.push("Place the player in your first level.");
  if (!proj.rules.some((r) => r.do.some((a) => a.t === "win" || a.t === "next"))) errs.push("Add a rule that wins the game (or goes to the next level) so people can finish.");
  return errs;
}
export function blankLevel(w, h, name) { const rows = []; for (let r = 0; r < h; r++) rows.push(".".repeat(w)); return { name: name || "Level", w, h, rows }; }
export function nextChar(proj) { const used = new Set(Object.values(proj.objects).map((o) => o.ch)); const pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+=?!~^<>"; for (const c of pool) if (!used.has(c)) return c; return null; }
