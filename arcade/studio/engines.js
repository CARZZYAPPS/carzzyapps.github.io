// Engine registry for Lazer Studio. Each engine kit = a runtime that plays a project + an editor over its data.
// To plug in a new engine: add an entry with id, name, tag, status, and play(host, project, opts) -> {destroy()}.
import { createGame } from "./engine.js";

export const ENGINES = {
  studio2d: {
    id: "studio2d", name: "Studio 2D", status: "ready", icon: "🕹️",
    tag: "Platformers, shooters, mazes, runners and catch games. Paint levels, draw pixel art, wire up rules.",
    play(host, project, opts) { return createGame(host, project, opts); }
  },
  rush: {
    id: "rush", name: "Rush Tycoon", status: "ready", icon: "☕",
    tag: "The engine behind Crema Rush. Invent your own shop: products, machines, recipes, customers and districts.",
    // The Rush engine runs in its own frame and reports the final score back with postMessage.
    play(host, project, opts) {
      const f = document.createElement("iframe");
      f.src = "/arcade/engines/rush/play.html"; f.title = project.title || "Rush game"; f.allow = "autoplay";
      f.style.cssText = "border:0;width:100%;height:100%;display:block;background:#000";
      const onMsg = (e) => {
        if (e.source !== f.contentWindow || !e.data) return;
        if (e.data.type === "rush-ready") f.contentWindow.postMessage({ type: "rush-pack", project: Object.assign({}, project, { kitId: (opts && opts.gameId) || "studiotest" }) }, "*");
        if (e.data.type === "rush-score" && opts && opts.onEnd) opts.onEnd({ score: +e.data.score || 0, won: true, time: 0, ongoing: true });
      };
      window.addEventListener("message", onMsg); host.appendChild(f);
      return { destroy() { window.removeEventListener("message", onMsg); f.remove(); }, pause() {} };
    }
  },
  crane: {
    id: "crane", name: "Crane", status: "soon", icon: "🏗️",
    tag: "Harbor Rush's physics crane. Build your own ports, ships and cargo puzzles. Coming soon."
  }
};
export const ENGINE_ORDER = ["studio2d", "rush", "crane"];
export function engineOf(project) { return ENGINES[(project && project.engine) || "studio2d"] || ENGINES.studio2d; }
