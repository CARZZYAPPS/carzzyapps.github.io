// Engine registry for Lazer Studio. Each engine kit = a runtime that plays a project + an editor over its data.
// To plug in a new engine: add an entry with id, name, tag, status, and play(host, project, opts) -> {destroy()}.
// Anything that runs creator code (scripts, uploaded HTML) runs in <iframe sandbox="allow-scripts"> with no same-origin,
// so it can't touch the arcade page, the player's account or storage. Scores come back by postMessage and are capped.
import { createGame } from "./engine.js";

export const SCORE_CAP = 100000000;
export function hasCode(p) { return !!(p && ((p.engine === "custom") || (p.script && String(p.script).trim()))); }
function clampScore(v) { v = Math.round(+v || 0); return Math.max(0, Math.min(SCORE_CAP, v)); }
// Rate-limits score reports from engines that report every round (min gap between reports).
function reporter(opts, minGap) { let last = 0; return (score, extra) => { const now = Date.now(); if (now - last < minGap) return; last = now; if (opts && opts.onEnd) opts.onEnd(Object.assign({ score: clampScore(score), won: true, time: 0, ongoing: true }, extra || {})); }; }
function frame(host, title, src, srcdoc) {
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-scripts allow-pointer-lock"); f.allow = "autoplay"; f.title = title || "Game";
  if (srcdoc != null) f.srcdoc = srcdoc; else f.src = src;
  f.style.cssText = "border:0;width:100%;height:100%;display:block;background:#000"; host.appendChild(f); return f;
}
let engineSrc = null;
async function getEngineSrc() { if (!engineSrc) engineSrc = fetch("/arcade/studio/engine.js").then((r) => r.text()); return engineSrc; }

export const ENGINES = {
  studio2d: {
    id: "studio2d", name: "Studio 2D", status: "ready", icon: "🕹️",
    tag: "Platformers, shooters, mazes, runners and catch games. Paint levels, draw pixel art, wire up rules, add scripts.",
    play(host, project, opts) {
      opts = opts || {};
      if (!(opts.allowScript && hasCode(project))) { const p = Object.assign({}, project); return createGame(host, p, Object.assign({}, opts, { script: "" })); }
      const f = frame(host, project.title, "/arcade/engines/studio2d/play.html");
      const onMsg = async (e) => {
        if (e.source !== f.contentWindow || !e.data) return;
        if (e.data.type === "s2d-ready") f.contentWindow.postMessage({ type: "s2d-boot", engine: await getEngineSrc(), project, script: project.script, level: opts.level || 0, touch: matchMedia("(pointer:coarse)").matches }, "*");
        if (e.data.type === "s2d-end" && !done) { done = true; opts.onEnd && opts.onEnd({ score: clampScore(e.data.score), won: !!e.data.won, time: 0 }); }
      };
      let done = false; window.addEventListener("message", onMsg);
      return { destroy() { window.removeEventListener("message", onMsg); f.remove(); }, pause() {}, sandboxed: true };
    }
  },
  rush: {
    id: "rush", name: "Rush Tycoon", status: "ready", icon: "☕",
    tag: "The engine behind Crema Rush and Harbor Rush. Invent your own shop: products, machines, recipes, customers, districts, scripts.",
    play(host, project, opts) {
      opts = opts || {};
      const f = frame(host, project.title, "/arcade/engines/rush/play.html"), key = "rushkit." + (opts.gameId || "test"), rep = reporter(opts, 20000);
      let saved = null; if (opts.gameId) { try { saved = localStorage.getItem(key); } catch (e) {} }
      const onMsg = (e) => {
        if (e.source !== f.contentWindow || !e.data) return;
        if (e.data.type === "rush-ready") f.contentWindow.postMessage({ type: "rush-pack", project, save: saved, persist: !!opts.gameId, allowScript: !!opts.allowScript }, "*");
        if (e.data.type === "rush-score") rep(e.data.score);
        if (e.data.type === "rush-save" && opts.gameId && typeof e.data.data === "string" && e.data.data.length < 2000000) { try { localStorage.setItem(key, e.data.data); } catch (err) {} }
      };
      window.addEventListener("message", onMsg);
      return { destroy() { window.removeEventListener("message", onMsg); f.remove(); }, pause() {}, sandboxed: true };
    }
  },
  custom: {
    id: "custom", name: "Your own code", status: "ready", icon: "🧩",
    tag: "Upload or paste a complete HTML game. Report scores with LZScore(points). Needs staff approval before it goes public.",
    play(host, project, opts) {
      opts = opts || {};
      const helper = '<script>window.LZScore=function(n){parent.postMessage({type:"lz-score",score:+n||0},"*")};window.LZEnd=function(n,won){parent.postMessage({type:"lz-end",score:+n||0,won:!!won},"*")};<\/script>';
      let html = String(project.html || ""); html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + helper) : helper + html;
      const f = frame(host, project.title, null, html), rep = reporter(opts, 5000);
      const onMsg = (e) => { if (e.source !== f.contentWindow || !e.data) return; if (e.data.type === "lz-score") rep(e.data.score); if (e.data.type === "lz-end" && opts.onEnd) opts.onEnd({ score: clampScore(e.data.score), won: !!e.data.won, time: 0 }); };
      window.addEventListener("message", onMsg);
      return { destroy() { window.removeEventListener("message", onMsg); f.remove(); }, pause() {}, sandboxed: true };
    }
  },
  html: {
    id: "html", name: "Hosted game", status: "staff", icon: "🎮",
    tag: "A complete game hosted on Lazer Arcade by staff.",
    // Only staff-hosted files under /arcade/community/games/ can be loaded. The game posts {type:"rush-score"} at the end of each round.
    play(host, project, opts) {
      const url = String(project.url || "");
      if (!/^\/arcade\/community\/games\/[a-z0-9-]+\/(index\.html)?$/.test(url)) { host.insertAdjacentHTML("beforeend", '<p style="color:#fff;padding:20px">This game can\'t be loaded.</p>'); return { destroy() {}, pause() {} }; }
      const f = document.createElement("iframe");
      f.src = url; f.title = project.title || "Game"; f.allow = "autoplay; fullscreen";
      f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock");
      f.style.cssText = "border:0;width:100%;height:100%;display:block;background:#000";
      const rep = reporter(opts, 20000);
      const onMsg = (e) => { if (e.source !== f.contentWindow || !e.data) return; if (e.data.type === "rush-score") rep(e.data.score); };
      window.addEventListener("message", onMsg); host.appendChild(f);
      return { destroy() { window.removeEventListener("message", onMsg); f.remove(); }, pause() {} };
    }
  },
  crane: {
    id: "crane", name: "Crane", status: "soon", icon: "🏗️",
    tag: "Harbor Rush's physics crane. Build your own ports, ships and cargo puzzles. Coming soon."
  }
};
export const ENGINE_ORDER = ["studio2d", "rush", "custom", "crane"];
export function engineOf(project) { return ENGINES[(project && project.engine) || "studio2d"] || ENGINES.studio2d; }
