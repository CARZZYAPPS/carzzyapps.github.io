/* Lazer Studio model builder core: builds three.js groups from a JSON part list.
   Shared by the Rush engine runtime (inlined at build) and the Studio model editor.
   spec = { parts:[ { id, t:'box'|'rbox'|'cyl'|'cone'|'sphere'|'torus'|'plane'|'text'|'group', name,
                      p:[x,y,z], r:[deg,deg,deg], s:[sx,sy,sz], c:'#hex', m:'toon'|'metal'|'glass'|'glow',
                      parent:'partId', taper, rad, arc, txt, bg, fg,
                      anim:[ { state:'always'|'idle'|'working'|'ready'|'full'|'angry'|'happy'|'moving',
                               type:'bob'|'spin'|'slide'|'scale'|'blink'|'color'|'show'|'hide'|'swing',
                               axis:'x'|'y'|'z', amt, speed, color } ] } ] }                                   */
(function (root) {
  function KitModelCore(T, opt) {
    opt = opt || {};
    var GC = {};
    function geo(k, fn) { return GC[k] || (GC[k] = fn()); }
    function col(c, d) { if (typeof c === "number") return c; if (typeof c === "string" && /^#?[0-9a-f]{6}$/i.test(c)) return parseInt(c.replace("#", ""), 16); return d == null ? 0xcccccc : d; }
    var MC = {};
    var mat = opt.mat || function (c, m) {
      var k = c + "|" + m; if (MC[k]) return MC[k];
      if (m === "metal") return (MC[k] = new T.MeshStandardMaterial({ color: c, metalness: 0.8, roughness: 0.3 }));
      if (m === "glass") return (MC[k] = new T.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.35, depthWrite: false, side: T.DoubleSide }));
      if (m === "glow") return (MC[k] = new T.MeshBasicMaterial({ color: c }));
      return (MC[k] = new T.MeshLambertMaterial({ color: c }));
    };
    function rboxGeo(r) {
      return geo("rb" + r, function () {
        var w = 1, h = 1, s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, 0.45);
        s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
        var g = new T.ExtrudeGeometry(s, { depth: 1 - 2 * r * 0.6, bevelEnabled: true, bevelThickness: r * 0.6, bevelSize: r * 0.6, bevelSegments: 2, curveSegments: 4 });
        g.center(); return g;
      });
    }
    function textTex(txt, bg, fg) {
      var key = "tx|" + txt + "|" + bg + "|" + fg; if (GC[key]) return GC[key];
      if (opt.labelTex) return (GC[key] = opt.labelTex(txt, bg, fg));
      var c = document.createElement("canvas"); c.width = 512; c.height = 128; var x = c.getContext("2d");
      x.fillStyle = bg || "#ffffff"; x.fillRect(0, 0, 512, 128); x.fillStyle = fg || "#222222"; x.textAlign = "center"; x.textBaseline = "middle";
      var fs = 72; x.font = "900 " + fs + "px system-ui,sans-serif"; while (x.measureText(txt).width > 480 && fs > 20) { fs -= 4; x.font = "900 " + fs + "px system-ui,sans-serif"; }
      x.fillText(String(txt || ""), 256, 66); var t = new T.CanvasTexture(c); return (GC[key] = t);
    }
    var D2R = Math.PI / 180;
    function makePart(p) {
      var c = col(p.c), m = p.m || "toon", o;
      switch (p.t) {
        case "box": o = new T.Mesh(geo("box", function () { return new T.BoxGeometry(1, 1, 1); }), mat(c, m)); break;
        case "rbox": o = new T.Mesh(rboxGeo(Math.round((p.rad == null ? 0.15 : +p.rad) * 20) / 20), mat(c, m)); break;
        case "cyl": var tp = p.taper == null ? 1 : +p.taper; o = new T.Mesh(geo("cyl" + tp, function () { return new T.CylinderGeometry(0.5 * tp, 0.5, 1, 20); }), mat(c, m)); break;
        case "cone": o = new T.Mesh(geo("cone", function () { return new T.ConeGeometry(0.5, 1, 18); }), mat(c, m)); break;
        case "sphere": o = new T.Mesh(geo("sph", function () { return new T.SphereGeometry(0.5, 18, 12); }), mat(c, m)); break;
        case "torus": var th = p.th == null ? 0.25 : +p.th, arc = p.arc == null ? 360 : +p.arc; o = new T.Mesh(geo("tor" + th + "_" + arc, function () { return new T.TorusGeometry(0.4, 0.4 * th, 8, 20, arc * D2R); }), mat(c, m)); break;
        case "plane": o = new T.Mesh(geo("pl", function () { return new T.PlaneGeometry(1, 1); }), mat(c, m)); break;
        case "text": o = new T.Mesh(geo("pl", function () { return new T.PlaneGeometry(1, 1); }), new T.MeshBasicMaterial({ map: textTex(p.txt || "TEXT", p.bg || "#ffffff", p.fg || "#222222"), transparent: true })); break;
        default: o = new T.Group();
      }
      var P = p.p || [0, 0, 0], R = p.r || [0, 0, 0], S = p.s || [1, 1, 1];
      o.position.set(+P[0] || 0, +P[1] || 0, +P[2] || 0); o.rotation.set((+R[0] || 0) * D2R, (+R[1] || 0) * D2R, (+R[2] || 0) * D2R);
      o.scale.set(S[0] == null ? 1 : +S[0], S[1] == null ? 1 : +S[1], S[2] == null ? 1 : +S[2]);
      if (p.hide) o.visible = false;
      return o;
    }
    function build(spec) {
      var g = new T.Group(), byId = {}, anims = [], parts = (spec && spec.parts) || [];
      parts.forEach(function (p, i) { var o = makePart(p); o.userData.partIndex = i; byId[p.id || "p" + i] = o; });
      parts.forEach(function (p, i) { var o = byId[p.id || "p" + i], par = p.parent && byId[p.parent] && p.parent !== (p.id || "p" + i) ? byId[p.parent] : g; par.add(o);
        (p.anim || []).forEach(function (a) { anims.push({ o: o, a: a, base: { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone(), vis: o.visible }, mat: null, col: p.c }); }); });
      if (spec && spec.scale) g.scale.setScalar(+spec.scale || 1);
      var me = { g: g, byId: byId, state: "idle", t: 0, anims: anims };
      me.setState = function (s) { me.state = s || "idle"; };
      me.upd = function (dt, time) {
        me.t += dt;
        for (var i = 0; i < anims.length; i++) {
          var A = anims[i], a = A.a, on = a.state === "always" || a.state === me.state || (a.state === "idle" && !me.state), o = A.o, b = A.base, sp = a.speed == null ? 1 : +a.speed, amt = a.amt == null ? 1 : +a.amt, ax = a.axis || "y";
          if (a.type === "show") { o.visible = on; continue; }
          if (a.type === "hide") { o.visible = !on && b.vis; continue; }
          if (a.type === "color") { if (!A.mat && o.material) { A.mat = o.material.clone(); o.material = A.mat; } if (A.mat) A.mat.color.setHex(on ? col(a.color, 0xff0000) : col(A.col)); continue; }
          if (!on) { if (A.was) { o.position.copy(b.p); o.rotation.copy(b.r); o.scale.copy(b.s); o.visible = b.vis; A.was = false; } continue; }
          A.was = true; var ph = (time || me.t) * sp * Math.PI * 2;
          if (a.type === "bob") o.position[ax] = b.p[ax] + Math.sin(ph) * amt * 0.1;
          else if (a.type === "slide") o.position[ax] = b.p[ax] + (Math.sin(ph) * 0.5 + 0.5) * amt;
          else if (a.type === "spin") o.rotation[ax] = b.r[ax] + (time || me.t) * sp * Math.PI * 2;
          else if (a.type === "swing") o.rotation[ax] = b.r[ax] + Math.sin(ph) * amt * 0.5;
          else if (a.type === "scale") { var k = 1 + Math.sin(ph) * amt * 0.15; o.scale.set(b.s.x * k, b.s.y * k, b.s.z * k); }
          else if (a.type === "blink") o.visible = Math.sin(ph) > 0;
        }
      };
      return me;
    }
    return { build: build, col: col };
  }
  root.KitModelCore = KitModelCore;
})(typeof window !== "undefined" ? window : this);
