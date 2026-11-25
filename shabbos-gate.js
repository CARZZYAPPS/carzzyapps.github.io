/* ============================================================================
   Shabbos gate — closes the whole site during Shabbos (Boca Raton zmanim).
   - From candle-lighting (shkiah − 18 min) Friday the site goes fully dark.
   - From the earliest shita that Shabbos is out (tzeis, 3 stars / 8.5°) until
     Rabbeinu Tam (shkiah + 72 min) Motzei Shabbos, it shows the "עב-er" screen.
   - After Rabbeinu Tam the site reopens on its own (re-checks every 15s).
   Pure client-side, no dependencies. Tweak the CONFIG block to adjust.
   ========================================================================== */
(function () {
  "use strict";
  var CONFIG = {
    lat: 26.3587, lng: -80.0831,          // Boca Raton, FL
    tz: "America/New_York",
    candleBeforeShkiaMin: 18,              // light candles 18 min before sunset
    earliestTzeisDeg: -8.5,               // earliest Shabbos-end shita (3 medium stars)
    rabbeinuTamMin: 72                    // Rabbeinu Tam = shkiah + 72 fixed minutes
  };

  /* ---- solar math (SunCalc-derived): time sun reaches a given altitude ---- */
  var PI = Math.PI, rad = PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
  function fromJ(j) { return new Date((j + 0.5 - J1970) * dayMs); }
  function toDays(d) { return (d.valueOf() / dayMs - 0.5 + J1970) - J2000; }
  function dec(l) { return Math.asin(Math.cos(e) * 0 + Math.sin(e) * Math.sin(l)); }
  function meanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }
  function eclLong(M) { var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)); return M + C + rad * 102.9372 + PI; }
  function transitJ(ds, M, L) { return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L); }
  function sunAtAngle(date, lat, lng, angleDeg) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date),
        n = Math.round(d - 0.0009 - lw / (2 * PI)), ds = 0.0009 + lw / (2 * PI) + n,
        M = meanAnomaly(ds), L = eclLong(M), d2 = dec(L),
        h = angleDeg * rad,
        w = Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d2)) / (Math.cos(phi) * Math.cos(d2))),
        a = 0.0009 + (w + lw) / (2 * PI) + n;
    return fromJ(transitJ(a, M, L));
  }

  /* ---- find this week's Friday/Saturday anchors in local (ET) calendar ---- */
  function etParts(date) {
    var p = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
      .formatToParts(date).reduce(function (o, x) { o[x.type] = x.value; return o; }, {});
    var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
    return { y: +p.year, m: +p.month, d: +p.day, wd: wd };
  }
  function fmtTime(date) {
    return new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.tz, hour: "numeric", minute: "2-digit" }).format(date);
  }

  function zmanim(now) {
    var P = etParts(now);
    var sinceFri = (P.wd - 5 + 7) % 7;                 // 0 on Fri, 1 on Sat, …
    var satNoonUTC = Date.UTC(P.y, P.m - 1, P.d, 17, 0, 0);  // ~noon ET of today
    var friAnchor = new Date(satNoonUTC - sinceFri * dayMs);
    var satAnchor = new Date(friAnchor.getTime() + dayMs);
    var shkiaFri = sunAtAngle(friAnchor, CONFIG.lat, CONFIG.lng, -0.833);
    var shkiaSat = sunAtAngle(satAnchor, CONFIG.lat, CONFIG.lng, -0.833);
    var candle = new Date(shkiaFri.getTime() - CONFIG.candleBeforeShkiaMin * 60000);
    var tzeis = sunAtAngle(satAnchor, CONFIG.lat, CONFIG.lng, CONFIG.earliestTzeisDeg);
    var rt = new Date(shkiaSat.getTime() + CONFIG.rabbeinuTamMin * 60000);
    return { candle: candle, tzeis: tzeis, rt: rt };
  }

  // 'shabbos' (fully dark) | 'motzei' (עב-er screen) | 'open'
  function stateNow() {
    var now = new Date(), z = zmanim(now);
    if (now < z.candle || now >= z.rt) return { s: "open", z: z, now: now };
    if (now < z.tzeis) return { s: "shabbos", z: z, now: now };
    return { s: "motzei", z: z, now: now };
  }

  var SITE = /ewieds|arcade/i.test(location.hostname + location.pathname) ? "Lazer Arcade" : "Carzzy Apps";

  /* ---- overlay ---- */
  var EL = null, prevOverflow = "";
  function ensureEl() {
    if (EL && document.documentElement.contains(EL)) return;
    EL = document.createElement("div");
    EL.id = "shabbos-gate";
    EL.setAttribute("role", "dialog");
    EL.style.cssText = [
      "position:fixed", "inset:0", "z-index:2147483647",
      "background:radial-gradient(1200px 800px at 50% 18%,#15265e 0%,#0a1230 55%,#05081a 100%)",
      "color:#eef2ff", "display:flex", "align-items:center", "justify-content:center",
      "text-align:center", "padding:24px",
      "font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif",
      "-webkit-font-smoothing:antialiased", "overflow:auto"
    ].join(";");
    document.documentElement.appendChild(EL);
  }
  function stars() {
    // a few static twinkles
    var h = '<div aria-hidden="true" style="position:absolute;inset:0;overflow:hidden;pointer-events:none">';
    var pts = [[12, 20], [22, 60], [35, 28], [48, 72], [63, 22], [74, 55], [86, 35], [92, 68], [18, 84], [58, 14], [80, 82], [30, 46]];
    for (var i = 0; i < pts.length; i++) {
      var s = 1 + (i % 3);
      h += '<span style="position:absolute;left:' + pts[i][0] + '%;top:' + pts[i][1] + '%;width:' + s + 'px;height:' + s +
        'px;border-radius:50%;background:#cdd8ff;opacity:' + (0.25 + (i % 4) * 0.18) + ';box-shadow:0 0 6px #aebcff"></span>';
    }
    return h + "</div>";
  }
  function render(st) {
    ensureEl();
    var z = st.z, inner;
    if (st.s === "shabbos") {
      inner =
        '<div style="font-size:60px;line-height:1;margin-bottom:10px">🕯️🕯️</div>' +
        '<h1 style="margin:0 0 10px;font-size:clamp(30px,6vw,52px);font-weight:800;letter-spacing:.5px">Good Shabbos</h1>' +
        '<p style="margin:0 0 6px;font-size:clamp(16px,2.6vw,20px);opacity:.92">' + SITE + ' is closed for Shabbos.</p>' +
        '<p style="margin:0;font-size:14px;opacity:.6">Boca Raton · Shabbos ends ' + fmtTime(z.tzeis) +
        ' &nbsp;·&nbsp; Rabbeinu Tam ' + fmtTime(z.rt) + '</p>';
    } else { // motzei — the עב-er screen
      var mins = Math.max(1, Math.round((z.rt - st.now) / 60000));
      inner =
        '<div style="font-size:48px;line-height:1;margin-bottom:14px">✨</div>' +
        '<h1 style="margin:0 0 14px;font-size:clamp(26px,5.2vw,46px);font-weight:800;line-height:1.25">' +
        'It’s not over until it’s ' +
        '<span style="color:#ffd24a;font-weight:900" dir="rtl" lang="he">עב</span>er.</h1>' +
        '<p style="margin:0 0 18px;font-size:clamp(16px,3vw,22px);font-weight:700;color:#cdd8ff">Rabbeinu Tam — 72 Minutes</p>' +
        '<div style="display:inline-block;padding:9px 16px;border:1px solid rgba(255,255,255,.18);border-radius:999px;font-size:14px;opacity:.9">' +
        'about ' + mins + ' more minute' + (mins === 1 ? "" : "s") + ' · ' + SITE + ' reopens at ' + fmtTime(z.rt) + '</div>';
    }
    EL.innerHTML = stars() + '<div style="position:relative;max-width:620px">' + inner + "</div>";
    if (prevOverflow === "") prevOverflow = document.documentElement.style.overflow || "auto";
    document.documentElement.style.overflow = "hidden";
    // silence any media playing underneath
    try {
      document.querySelectorAll("audio,video").forEach(function (m) { try { m.pause(); m.muted = true; } catch (e) {} });
    } catch (e) {}
  }
  function remove() {
    if (EL && EL.parentNode) EL.parentNode.removeChild(EL);
    EL = null;
    document.documentElement.style.overflow = prevOverflow || "auto";
  }

  function tick() {
    var st = stateNow();
    if (st.s === "open") remove();
    else render(st);
  }
  tick();
  setInterval(tick, 15000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
