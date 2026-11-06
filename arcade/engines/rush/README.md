# Rush engine kit

`play.html` is the Crema Rush v3 engine built as a data-pack runtime. Build: put `k_kit.js` and `build_kit.sh` next to the Crema v3 sources (a_shell.html, b_core.js ... h_main.js) and run `./build_kit.sh`. It inserts `k_kit.js` after `c_data.js`, waits for a `rush-pack` postMessage from the parent page, applies the pack over the engine data, and posts `rush-score` at the end of every shift.

`kit.js` is the Lazer Studio editor, starters and validator for this engine.
