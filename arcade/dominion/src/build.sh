#!/bin/bash
# Concatenates the source parts into the single-file game. Usage: ./build.sh [out.html]
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"; OUT=${1:-$SRC/../index.html}
{ cat $SRC/00-head.html; echo "<script>"; cat $SRC/01-core.js $SRC/02-game.js $SRC/03-battle.js $SRC/03b-render3d.js $SRC/04-flow.js $SRC/05-ui.js $SRC/06-main.js; echo "</script>"; echo "</body>"; echo "</html>"; } > "$OUT"
node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/<script>\n([\s\S]*)<\/script>\n<\/body>/);new Function(m[1]);console.log("syntax ok",s.length,"bytes")' "$OUT"
