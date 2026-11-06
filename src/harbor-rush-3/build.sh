#!/bin/bash
# Builds harbor-rush.html (standalone), harbor-rush-arcade.html (Lazer Arcade) and test.html (with __T hook).
cd "$(dirname "$0")"
JS=$(cat a_core.js b_world.js c_render.js d_ui.js)
END='})();'
HOOK='window.__T={G:function(){return G;},LV:function(){return LV;},CR:function(){return CR;},start:function(p,l,e){startGame(p||0,l||0,!!e);},sim:function(s){var n=Math.round(s/0.016);for(var i=0;i<n;i++)update(0.016);},act:function(){action();},dir:function(d){INP.dir=d;},endLevel:endLevel,showMap:showMap,hookX:hookX,slotUnder:slotUnder,tol:function(){return [tolPerf(),tolLand(),tolGrab()];},
 step:function(){if(!LV||LV.phase!=="play")return "x";if(CR.state!=="idle"||CR.stun>0)return "busy";if(LV.gust>0||Math.abs(LV.wind)>0.6)return "gust";var sl=LV.L.slots,want=LV.trucks.filter(function(t){return t.state==="wait";}),target=null;
  var W={};want.forEach(function(t){W[t.want]=1;});if(CR.carry){var t=want.filter(function(t){return t.want===CR.carry.t;})[0];if(t)target=t.lane;else{var best=null,bs=-1e9;sl.forEach(function(s){if(s.kind==="lane"||s.stack.length>=s.max||s===window.__src)return;var sc=-s.stack.length-(s.kind==="ship"?0.5:0)+(s.power&&TYPES[CR.carry.t].reefer?5:0)-(s.stack.some(function(b){return W[b.t];})?6:0)-(TYPES[CR.carry.t].reefer&&!s.power&&s.kind!=="ship"?3:0);if(sc>bs){bs=sc;best=s;}});target=best;}}
  else{var cand=null,cd=99;want.forEach(function(t){sl.forEach(function(s){if(s.kind==="lane")return;for(var i=s.stack.length-1;i>=0;i--)if(s.stack[i].t===t.want){var d=s.stack.length-1-i;if(d<cd){cd=d;cand=s;}break;}});});target=cand;window.__src=cand;if(!target)return "wait";}
  if(!target)return "idle";var dx=target.x-CR.x;if(Math.abs(dx)>0.03||Math.abs(CR.v)>0.05||Math.abs(CR.th)>0.03){CR.x=target.x;CR.v=0;CR.th*=0.2;CR.om*=0.2;}action();return "act";},
 scr:function(x,y){return [SX(x),SY(y)];}};'
mk(){ # $1 out, $2 head-insert, $3 extra js before end
  sed "s#<!--LZHEAD-->#$2#" shell.html > "$1"
  printf '%s\n%s\n%s\n</script>\n</body>\n</html>\n' "$JS" "$3" "$END" >> "$1"
}
mk harbor-rush.html "" ""
mk harbor-rush-arcade.html '<meta name="description" content="Run the crane at a busy port. Swing containers off the ship, dig out what each truck wants and land every box dead center."><link rel="canonical" href="https://www.carzzyapps.com/arcade/harbor-rush/"><link rel="icon" href="/favicon.png"><script>window.LZ_GAME="harbor";</script><script type="module" src="/arcade/lz.js"></script>' ""
mk test.html "" "$HOOK"
sed -i 's#<title>Harbor Rush</title>#<title>Harbor Rush | Lazer Arcade</title>#' harbor-rush-arcade.html
node -e "
const fs=require('fs');for(const f of ['harbor-rush.html','test.html']){const s=fs.readFileSync(f,'utf8');const m=s.match(/<script>\n([\s\S]*)<\/script>\n<\/body>/);try{new Function(m[1]);console.log(f,'OK');}catch(e){console.log(f,'SYNTAX',e.message);}}"
