# Crane engine kit (Lazer Studio)

The "Crane" engine is the physics crane behind **Harbor Rush** (Harbor 3), made pack-driven for Lazer Studio.

- `play.html` — the engine, built from the Harbor 3 source with a kit harness. On load it posts
  `{type:"crane-ready"}` and waits for `{type:"crane-pack", project, save, persist, gameId}`. It reports
  `{type:"crane-score", score}` at the end of each level and `{type:"crane-save", data}` on save.
- `kit.js` — the Studio editor over `project.pack` (ports → levels of numeric params, theme, rules).
  Exports `STARTERS`, `validate(P)`, `thumb(P)`, `editor(app, P, hooks)`.
- `src/build_crane.sh` — rebuilds `play.html` from the Harbor 3 source:
  `bash src/build_crane.sh <harbor3-src-dir> play.html`
  (Harbor 3 source: branch `src/harbor-rush-3`.) The script applies the pack-override + kit-mode patches.

A project's data model (`project.pack`):
```
{ titleKick, titleMain, desc, noEndless,
  ports: [ { id, name, tag, need, th:{sky:[a,b],sea:[a,b],quay,quay2,crane,hull,city,night?,snow?}, rules:["wind"|"reefer"|"hazmat"|"night"],
            lv: [ { c,h,f,y,l,n,p,k,par, w?,r?,pw?,z?,tut? } ] } ] }
```
Next: hand-placed starting stacks and custom crane/container art.
