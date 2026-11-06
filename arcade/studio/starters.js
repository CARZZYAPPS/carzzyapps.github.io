// Starter projects for Lazer Studio. Each one is a normal, fully editable project.
import { PALETTE, blankLevel } from "./engine.js";

/* tiny pixel-art helpers: build 16x16 frames as 256-char strings (palette hex digits, "." = clear) */
function px() { const g = new Array(256).fill("."); const o = {
  set(x, y, c) { if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y * 16 + x] = c; return o; },
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) o.set(i, j, c); return o; },
  circ(cx, cy, r, c) { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if ((i - cx) * (i - cx) + (j - cy) * (j - cy) <= r * r) o.set(i, j, c); return o; },
  ell(cx, cy, rx, ry, c) { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1) o.set(i, j, c); return o; },
  out() { return g.join(""); } }; return o; }
const A = {
  hero: [px().rect(5, 1, 6, 5, "f").rect(4, 1, 8, 2, "4").set(6, 3, "0").set(9, 3, "0").rect(4, 6, 8, 5, "c").rect(3, 7, 1, 3, "f").rect(12, 7, 1, 3, "f").rect(5, 11, 2, 4, "1").rect(9, 11, 2, 4, "1").rect(4, 15, 3, 1, "0").rect(9, 15, 3, 1, "0").out(),
         px().rect(5, 1, 6, 5, "f").rect(4, 1, 8, 2, "4").set(6, 3, "0").set(9, 3, "0").rect(4, 6, 8, 5, "c").rect(3, 6, 1, 3, "f").rect(12, 8, 1, 3, "f").rect(4, 11, 2, 4, "1").rect(10, 11, 2, 3, "1").rect(3, 15, 3, 1, "0").rect(10, 14, 3, 1, "0").out()],
  slime: [px().ell(8, 11, 7, 5, "b").ell(8, 12, 6, 3, "3").ell(8, 10, 6, 4, "b").rect(5, 9, 2, 2, "7").rect(10, 9, 2, 2, "7").set(6, 10, "0").set(10, 10, "0").out(),
          px().ell(8, 12, 7, 4, "b").ell(8, 13, 6, 2, "3").ell(8, 11, 7, 3, "b").rect(5, 10, 2, 2, "7").rect(10, 10, 2, 2, "7").set(6, 11, "0").set(10, 11, "0").out()],
  coin: [px().circ(7.5, 7.5, 5.6, "9").circ(7.5, 7.5, 4.4, "a").rect(7, 5, 2, 6, "9").set(5, 5, "7").out(),
         px().ell(7.5, 7.5, 2.6, 5.6, "9").ell(7.5, 7.5, 1.6, 4.4, "a").out()],
  ground: [px().rect(0, 0, 16, 16, "4").rect(0, 0, 16, 4, "b").rect(0, 4, 16, 1, "3").set(3, 8, "5").set(10, 11, "5").set(6, 13, "5").set(13, 7, "5").out()],
  brick: [px().rect(0, 0, 16, 16, "9").rect(0, 3, 16, 1, "4").rect(0, 7, 16, 1, "4").rect(0, 11, 16, 1, "4").rect(0, 15, 16, 1, "4").rect(7, 0, 1, 3, "4").rect(3, 4, 1, 3, "4").rect(11, 4, 1, 3, "4").rect(7, 8, 1, 3, "4").rect(3, 12, 1, 3, "4").rect(11, 12, 1, 3, "4").out()],
  flag: [px().rect(3, 1, 1, 15, "6").rect(4, 1, 8, 2, "8").rect(4, 3, 6, 2, "8").rect(4, 5, 4, 1, "8").rect(2, 15, 4, 1, "5").out(),
         px().rect(3, 1, 1, 15, "6").rect(4, 2, 7, 2, "8").rect(4, 4, 8, 2, "8").rect(4, 6, 3, 1, "8").rect(2, 15, 4, 1, "5").out()],
  spike: [px().rect(0, 13, 16, 3, "5").set(2, 6, "6").rect(1, 7, 3, 2, "6").rect(0, 9, 5, 4, "6").set(7, 6, "6").rect(6, 7, 3, 2, "6").rect(5, 9, 5, 4, "6").set(12, 6, "6").rect(11, 7, 3, 2, "6").rect(10, 9, 6, 4, "6").out()],
  ship: [px().rect(7, 1, 2, 3, "7").rect(6, 4, 4, 6, "c").rect(3, 8, 10, 3, "c").rect(2, 10, 2, 3, "8").rect(12, 10, 2, 3, "8").rect(7, 5, 2, 2, "a").rect(6, 11, 4, 2, "6").rect(7, 13, 2, 2, "9").out(),
         px().rect(7, 1, 2, 3, "7").rect(6, 4, 4, 6, "c").rect(3, 8, 10, 3, "c").rect(2, 10, 2, 3, "8").rect(12, 10, 2, 3, "8").rect(7, 5, 2, 2, "a").rect(6, 11, 4, 2, "6").rect(6, 13, 4, 3, "a").out()],
  alien: [px().rect(4, 3, 8, 6, "d").rect(2, 5, 12, 4, "d").rect(5, 5, 2, 2, "0").rect(9, 5, 2, 2, "0").rect(3, 9, 2, 3, "d").rect(11, 9, 2, 3, "d").rect(6, 9, 4, 2, "2").set(4, 2, "d").set(11, 2, "d").out(),
          px().rect(4, 3, 8, 6, "d").rect(2, 5, 12, 4, "d").rect(5, 5, 2, 2, "0").rect(9, 5, 2, 2, "0").rect(1, 9, 2, 3, "d").rect(13, 9, 2, 3, "d").rect(6, 9, 4, 2, "2").set(3, 2, "d").set(12, 2, "d").out()],
  laser: [px().circ(7.5, 7.5, 2.6, "a").circ(7.5, 7.5, 1.4, "7").out()],
  zap: [px().circ(7.5, 7.5, 2.6, "8").circ(7.5, 7.5, 1.2, "e").out()],
  rock: [px().rect(0, 0, 16, 16, "5").rect(1, 1, 14, 14, "6").rect(3, 3, 4, 3, "5").rect(9, 8, 4, 4, "5").rect(4, 10, 3, 2, "5").out()],
  roof: [px().rect(0, 0, 16, 16, "1").rect(0, 0, 16, 3, "5").rect(0, 3, 16, 1, "0").rect(3, 7, 3, 4, "a").rect(10, 7, 3, 4, "a").out()],
  crate: [px().rect(1, 2, 14, 14, "4").rect(1, 2, 14, 2, "9").rect(1, 14, 14, 2, "9").rect(1, 2, 2, 14, "9").rect(13, 2, 2, 14, "9").rect(6, 4, 4, 10, "9").out()],
  wall: [px().rect(0, 0, 16, 16, "1").rect(1, 1, 14, 14, "c").rect(2, 2, 12, 12, "1").out()],
  dot: [px().circ(7.5, 7.5, 2, "f").out(), px().circ(7.5, 7.5, 2.6, "a").out()],
  ghost: [px().ell(8, 7, 6, 6, "7").rect(2, 7, 12, 7, "7").set(2, 14, "7").set(5, 14, "7").set(8, 14, "7").set(11, 14, "7").rect(5, 5, 2, 3, "1").rect(9, 5, 2, 3, "1").out(),
          px().ell(8, 7, 6, 6, "7").rect(2, 7, 12, 6, "7").set(3, 13, "7").set(6, 13, "7").set(9, 13, "7").set(12, 13, "7").rect(5, 5, 2, 3, "1").rect(9, 5, 2, 3, "1").out()],
  gem: [px().rect(5, 3, 6, 2, "c").rect(3, 5, 10, 2, "c").rect(4, 7, 8, 2, "c").rect(5, 9, 6, 2, "c").rect(6, 11, 4, 2, "c").rect(7, 13, 2, 1, "c").rect(5, 5, 2, 2, "7").out(),
        px().rect(5, 3, 6, 2, "d").rect(3, 5, 10, 2, "d").rect(4, 7, 8, 2, "d").rect(5, 9, 6, 2, "d").rect(6, 11, 4, 2, "d").rect(7, 13, 2, 1, "d").rect(9, 5, 2, 2, "7").out()],
  apple: [px().circ(7.5, 9, 5.5, "8").rect(7, 1, 2, 4, "4").rect(9, 2, 3, 2, "b").set(5, 6, "e").set(5, 7, "e").out()],
  bomb: [px().circ(7.5, 9.5, 5.5, "0").circ(7.5, 9.5, 4.5, "5").set(5, 7, "6").rect(7, 2, 2, 3, "6").set(9, 1, "9").set(10, 0, "a").out(),
         px().circ(7.5, 9.5, 5.5, "0").circ(7.5, 9.5, 4.5, "5").set(5, 7, "6").rect(7, 2, 2, 3, "6").set(9, 1, "a").set(9, 0, "8").out()],
  grass: [px().rect(0, 0, 16, 16, "3").rect(0, 0, 16, 3, "b").set(4, 6, "b").set(11, 9, "b").set(7, 12, "b").out()]
};
const spr = (name, key, fps) => ({ name, frames: A[key].slice(), fps: fps || 6 });

function level(w, h, name, paint) { const L = blankLevel(w, h, name), g = L.rows.map((r) => r.split("")); const put = (q, r, c) => { if (q >= 0 && q < w && r >= 0 && r < h) g[r][q] = c; };
  paint({ put, row: (r, q0, q1, c) => { for (let q = q0; q <= q1; q++) put(q, r, c); }, col: (q, r0, r1, c) => { for (let r = r0; r <= r1; r++) put(q, r, c); }, box: (q0, r0, q1, r1, c) => { for (let q = q0; q <= q1; q++) { put(q, r0, c); put(q, r1, c); } for (let r = r0; r <= r1; r++) { put(q0, r, c); put(q1, r, c); } }, w, h });
  L.rows = g.map((r) => r.join("")); return L; }
const B = (t, o) => Object.assign({ t }, o || {});
const base = (title, desc, settings) => ({ v: 1, engine: "studio2d", title, desc, palette: PALETTE.slice(), settings: Object.assign({ gravity: true, gravityStr: 1, lives: 3, timer: 0, bg: "sky", bgColor: "#5ec8ff", music: "bouncy", controls: "platformer" }, settings), sprites: {}, objects: {}, levels: [], rules: [] });

export const STARTERS = {
  platformer: { name: "Platformer", blurb: "Run, jump, grab coins, dodge slimes and reach the flag.", make() {
    const p = base("Pixel Quest", "Jump through two levels of coins, slimes and spikes.", { music: "bouncy", controls: "platformer" });
    Object.assign(p.sprites, { hero: spr("Hero", "hero", 8), slime: spr("Slime", "slime", 4), coin: spr("Coin", "coin", 5), ground: spr("Ground", "ground"), brick: spr("Brick", "brick"), flag: spr("Flag", "flag", 3), spike: spr("Spikes", "spike") });
    Object.assign(p.objects, {
      hero: { name: "Hero", ch: "P", sprite: "hero", kind: "player", behaviors: [B("platformer")] },
      ground: { name: "Ground", ch: "#", sprite: "ground", kind: "wall", solid: true, behaviors: [] },
      brick: { name: "Brick", ch: "B", sprite: "brick", kind: "wall", solid: true, behaviors: [] },
      coin: { name: "Coin", ch: "o", sprite: "coin", kind: "item", behaviors: [B("spin")] },
      slime: { name: "Slime", ch: "s", sprite: "slime", kind: "enemy", behaviors: [B("patrol", { speed: 35 })] },
      spike: { name: "Spikes", ch: "^", sprite: "spike", kind: "hazard", behaviors: [] },
      flag: { name: "Flag", ch: "F", sprite: "flag", kind: "goal", behaviors: [B("spin")] } });
    p.levels.push(level(56, 13, "Green Hills", (d) => { d.row(12, 0, 55, "#"); d.row(11, 0, 55, "#"); [14, 15, 30, 31, 32].forEach((q) => { d.put(q, 11, "."); d.put(q, 12, "."); }); d.put(2, 10, "P");
      d.row(8, 7, 10, "B"); d.row(5, 18, 21, "B"); d.row(8, 24, 27, "B"); d.row(7, 36, 39, "B"); d.row(5, 42, 44, "B");
      [8, 9, 10, 19, 20, 25, 26, 37, 38, 43].forEach((q, i) => d.put(q, [7, 7, 7, 4, 4, 7, 7, 6, 6, 4][i], "o")); [17, 22, 34, 40, 47].forEach((q) => d.put(q, 10, "s")); d.put(28, 10, "^"); d.put(45, 10, "^"); d.put(53, 10, "F"); }));
    p.levels.push(level(60, 13, "Brick Peaks", (d) => { d.row(12, 0, 59, "#"); d.row(11, 0, 59, "#"); [10, 11, 22, 23, 24, 38, 39].forEach((q) => { d.put(q, 11, "."); d.put(q, 12, "."); }); d.put(2, 10, "P");
      for (let i = 0; i < 4; i++) d.row(10 - i, 14 + i, 17, "B"); d.row(7, 26, 29, "B"); d.row(4, 31, 34, "B"); d.row(8, 41, 45, "B"); d.row(6, 48, 50, "B");
      [15, 16, 17, 27, 28, 32, 33, 42, 44, 49].forEach((q, i) => d.put(q, [6, 6, 6, 6, 6, 3, 3, 7, 7, 5][i], "o")); [7, 19, 30, 35, 44, 52].forEach((q) => d.put(q, 10, "s")); [20, 36, 47].forEach((q) => d.put(q, 10, "^")); d.put(57, 10, "F"); }));
    p.rules = [
      { when: { t: "start" }, do: [{ t: "text", txt: "Grab the coins!", sec: 1.5 }] },
      { when: { t: "touch", a: "hero", b: "coin" }, do: [{ t: "score", n: 10 }, { t: "destroy", who: "b" }, { t: "sound", s: "coin" }] },
      { when: { t: "touch", a: "hero", b: "slime" }, do: [{ t: "life", n: -1 }] },
      { when: { t: "touch", a: "hero", b: "spike" }, do: [{ t: "life", n: -1 }] },
      { when: { t: "touch", a: "hero", b: "flag" }, do: [{ t: "score", n: 100 }, { t: "next" }] } ];
    return p; } },
  shooter: { name: "Top-down shooter", blurb: "Fly a ship, blast every alien, survive their shots.", make() {
    const p = base("Star Blaster", "Clear each sector of aliens. Arrows to fly, B / X to fire.", { gravity: false, bg: "space", music: "space", controls: "topdown", lives: 5 });
    Object.assign(p.sprites, { ship: spr("Ship", "ship", 10), alien: spr("Alien", "alien", 3), laser: spr("Laser", "laser"), zap: spr("Zap", "zap"), rock: spr("Rock", "rock") });
    Object.assign(p.objects, {
      ship: { name: "Ship", ch: "P", sprite: "ship", kind: "player", behaviors: [B("topdown", { speed: 95 }), B("blaster", { bullet: "laser", speed: 220, cooldown: 0.25 })] },
      alien: { name: "Alien", ch: "a", sprite: "alien", kind: "enemy", behaviors: [B("wander", { speed: 35 }), B("shooter", { bullet: "zap", every: 2.4, speed: 90, aim: "player" })] },
      laser: { name: "Laser", ch: "l", sprite: "laser", kind: "projectile", behaviors: [B("projectile", { life: 1.6 })] },
      zap: { name: "Zap", ch: "z", sprite: "zap", kind: "projectile", sound: "laser", behaviors: [B("projectile", { life: 4 })] },
      rock: { name: "Rock", ch: "#", sprite: "rock", kind: "wall", solid: true, behaviors: [] } });
    p.levels.push(level(22, 14, "Sector 1", (d) => { d.box(0, 0, 21, 13, "#"); d.row(5, 7, 9, "#"); d.row(9, 13, 15, "#"); d.put(3, 11, "P"); [[16, 3], [18, 9], [8, 2], [12, 6], [5, 7]].forEach(([q, r]) => d.put(q, r, "a")); }));
    p.levels.push(level(26, 16, "Sector 2", (d) => { d.box(0, 0, 25, 15, "#"); d.col(8, 3, 8, "#"); d.col(17, 7, 12, "#"); d.row(11, 3, 6, "#"); d.put(3, 13, "P"); [[12, 3], [20, 3], [22, 12], [12, 12], [5, 4], [20, 8], [14, 8]].forEach(([q, r]) => d.put(q, r, "a")); }));
    p.rules = [
      { when: { t: "start" }, do: [{ t: "text", txt: "Destroy every alien!", sec: 1.6 }] },
      { when: { t: "touch", a: "laser", b: "alien" }, do: [{ t: "score", n: 50 }, { t: "destroy", who: "b" }, { t: "destroy", who: "a" }, { t: "sound", s: "boom" }, { t: "shake", n: 3 }] },
      { when: { t: "touch", a: "zap", b: "ship" }, do: [{ t: "destroy", who: "a" }, { t: "life", n: -1 }] },
      { when: { t: "touch", a: "alien", b: "ship" }, do: [{ t: "life", n: -1 }] },
      { when: { t: "count", a: "alien" }, do: [{ t: "score", n: 200 }, { t: "next" }] } ];
    return p; } },
  runner: { name: "Endless runner", blurb: "Auto-run across rooftops. Jump the gaps and crates.", make() {
    const p = base("Rooftop Run", "Tap or press Space to jump. Make it to the finish flag.", { bg: "sunset", music: "chase", controls: "runner", lives: 3 });
    Object.assign(p.sprites, { hero: spr("Runner", "hero", 12), roof: spr("Roof", "roof"), crate: spr("Crate", "crate"), coin: spr("Coin", "coin", 5), flag: spr("Flag", "flag", 3) });
    Object.assign(p.objects, {
      runner: { name: "Runner", ch: "P", sprite: "hero", kind: "player", behaviors: [B("runner", { speed: 100, jump: 250 })] },
      roof: { name: "Roof", ch: "#", sprite: "roof", kind: "wall", solid: true, behaviors: [] },
      crate: { name: "Crate", ch: "x", sprite: "crate", kind: "hazard", behaviors: [] },
      coin: { name: "Coin", ch: "o", sprite: "coin", kind: "item", behaviors: [B("spin"), B("float")] },
      flag: { name: "Finish", ch: "F", sprite: "flag", kind: "goal", behaviors: [B("spin")] } });
    p.levels.push(level(140, 11, "Downtown", (d) => { let q = 0; d.put(2, 7, "P"); const gaps = [18, 34, 47, 60, 74, 88, 101, 116]; for (let c = 0; c < 140; c++) { if (!gaps.some((g) => c >= g && c < g + 3)) { d.put(c, 9, "#"); d.put(c, 10, "#"); } }
      [12, 27, 41, 55, 67, 81, 95, 109, 124].forEach((c) => d.put(c, 8, "x")); for (let c = 8; c < 136; c += 5) if (!gaps.some((g) => c >= g - 1 && c < g + 4)) d.put(c, 6, "o"); d.put(136, 8, "F"); }));
    p.rules = [
      { when: { t: "start" }, do: [{ t: "text", txt: "Tap to jump!", sec: 1.6 }] },
      { when: { t: "every", sec: 1 }, do: [{ t: "score", n: 5 }] },
      { when: { t: "touch", a: "runner", b: "coin" }, do: [{ t: "score", n: 25 }, { t: "destroy", who: "b" }, { t: "sound", s: "coin" }] },
      { when: { t: "touch", a: "runner", b: "crate" }, do: [{ t: "life", n: -1 }, { t: "destroy", who: "b" }, { t: "shake", n: 5 }] },
      { when: { t: "touch", a: "runner", b: "flag" }, do: [{ t: "score", n: 300 }, { t: "win" }] } ];
    return p; } },
  maze: { name: "Maze", blurb: "Eat every dot while ghosts hunt you down.", make() {
    const p = base("Ghost Maze", "Eat every dot before the clock runs out. Don't get caught.", { gravity: false, bg: "night", music: "quest", controls: "topdown", lives: 3, timer: 90 });
    Object.assign(p.sprites, { hero: spr("Hero", "hero", 8), wall: spr("Wall", "wall"), dot: spr("Dot", "dot", 3), ghost: spr("Ghost", "ghost", 4), gem: spr("Gem", "gem", 3) });
    Object.assign(p.objects, {
      hero: { name: "Hero", ch: "P", sprite: "hero", kind: "player", behaviors: [B("topdown", { speed: 85 })] },
      wall: { name: "Wall", ch: "#", sprite: "wall", kind: "wall", solid: true, behaviors: [] },
      dot: { name: "Dot", ch: "o", sprite: "dot", kind: "item", behaviors: [B("spin")] },
      ghost: { name: "Ghost", ch: "g", sprite: "ghost", kind: "enemy", behaviors: [B("chase", { speed: 38, range: 6 }), B("float")] },
      gem: { name: "Gem", ch: "*", sprite: "gem", kind: "item", behaviors: [B("spin"), B("float")] } });
    const M = ["###################", "#P.......#........#", "#.##.###.#.###.##.#", "#*................#", "#.##.#.#####.#.##.#", "#....#...#...#....#", "####.###.#.###.####", "#.......g.g.......#", "#.##.#.#####.#.##.#", "#...*#...#...#*...#", "##.#.###.#.###.#.##", "#........g........#", "###################"];
    const L = blankLevel(19, 13, "The Crypt"); L.rows = M.map((r) => r.replace(/\./g, "o")); p.levels.push(L);
    p.rules = [
      { when: { t: "start" }, do: [{ t: "text", txt: "Eat every dot!", sec: 1.5 }] },
      { when: { t: "touch", a: "hero", b: "dot" }, do: [{ t: "score", n: 5 }, { t: "destroy", who: "b" }, { t: "sound", s: "blip" }] },
      { when: { t: "touch", a: "hero", b: "gem" }, do: [{ t: "score", n: 100 }, { t: "destroy", who: "b" }, { t: "sound", s: "powerup" }, { t: "text", txt: "+100!", sec: 1 }] },
      { when: { t: "touch", a: "hero", b: "ghost" }, do: [{ t: "life", n: -1 }] },
      { when: { t: "count", a: "dot" }, do: [{ t: "score", n: 500 }, { t: "win" }] } ];
    return p; } },
  collector: { name: "Catch game", blurb: "Apples rain from the sky. Catch them, dodge the bombs.", make() {
    const p = base("Apple Panic", "Catch falling apples, dodge the bombs. 300 points wins.", { bg: "forest", music: "chill", controls: "platformer", lives: 3 });
    Object.assign(p.sprites, { hero: spr("Picker", "hero", 8), grass: spr("Grass", "grass"), apple: spr("Apple", "apple"), bomb: spr("Bomb", "bomb", 6) });
    Object.assign(p.objects, {
      hero: { name: "Picker", ch: "P", sprite: "hero", kind: "player", behaviors: [B("platformer", { speed: 120, jump: 230 })] },
      grass: { name: "Grass", ch: "#", sprite: "grass", kind: "wall", solid: true, behaviors: [] },
      apple: { name: "Apple", ch: "a", sprite: "apple", kind: "item", behaviors: [B("fall")] },
      bomb: { name: "Bomb", ch: "b", sprite: "bomb", kind: "hazard", behaviors: [B("fall"), B("spin")] } });
    p.levels.push(level(20, 12, "Orchard", (d) => { d.row(11, 0, 19, "#"); d.col(0, 0, 11, "#"); d.col(19, 0, 11, "#"); d.put(9, 10, "P"); d.put(5, 1, "a"); }));
    p.rules = [
      { when: { t: "start" }, do: [{ t: "text", txt: "Catch the apples!", sec: 1.6 }] },
      { when: { t: "every", sec: 1.1 }, do: [{ t: "spawn", o: "apple", at: "random" }] },
      { when: { t: "every", sec: 3 }, do: [{ t: "spawn", o: "bomb", at: "random" }] },
      { when: { t: "touch", a: "hero", b: "apple" }, do: [{ t: "score", n: 10 }, { t: "destroy", who: "b" }, { t: "sound", s: "coin" }] },
      { when: { t: "touch", a: "apple", b: "grass" }, do: [{ t: "destroy", who: "a" }, { t: "sound", s: "splash" }] },
      { when: { t: "touch", a: "hero", b: "bomb" }, do: [{ t: "life", n: -1 }, { t: "destroy", who: "b" }, { t: "sound", s: "boom" }, { t: "shake", n: 6 }] },
      { when: { t: "touch", a: "bomb", b: "grass" }, do: [{ t: "destroy", who: "a" }] },
      { when: { t: "score", n: 300 }, do: [{ t: "win" }] } ];
    return p; } },
  blank: { name: "Blank", blurb: "An empty level, a hero and the ground. Build anything.", make() {
    const p = base("My Game", "", { music: "none" });
    Object.assign(p.sprites, { hero: spr("Hero", "hero", 8), ground: spr("Ground", "ground"), flag: spr("Flag", "flag", 3) });
    Object.assign(p.objects, { hero: { name: "Hero", ch: "P", sprite: "hero", kind: "player", behaviors: [B("platformer")] }, ground: { name: "Ground", ch: "#", sprite: "ground", kind: "wall", solid: true, behaviors: [] }, flag: { name: "Flag", ch: "F", sprite: "flag", kind: "goal", behaviors: [] } });
    p.levels.push(level(30, 12, "Level 1", (d) => { d.row(11, 0, 29, "#"); d.put(2, 10, "P"); d.put(27, 10, "F"); }));
    p.rules = [{ when: { t: "touch", a: "hero", b: "flag" }, do: [{ t: "win" }] }];
    return p; } }
};
export const ART = A;
