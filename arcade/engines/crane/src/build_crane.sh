#!/bin/bash
# Builds arcade/engines/crane/play.html — the Harbor 3 "Crane" engine, pack-driven, for Lazer Studio.
set -e
H="$1"; OUT="$2"   # H=harbor3 src dir, OUT=play.html path
JS=$(cat "$H/a_core.js" "$H/b_world.js" "$H/c_render.js" "$H/d_ui.js")

node - "$OUT" "$H/shell.html" <<'NODE'
const fs=require('fs');
const out=process.argv[2], shellPath=process.argv[3];
let js=require('child_process').execSync('cat '+process.env.H+'/a_core.js '+process.env.H+'/b_world.js '+process.env.H+'/c_render.js '+process.env.H+'/d_ui.js').toString();

function rep(a,b){ if(js.indexOf(a)<0){throw new Error('patch target not found: '+a.slice(0,60));} if(js.split(a).length-1>1){throw new Error('patch target not unique: '+a.slice(0,60));} js=js.replace(a,b); }

// 1) configurable title text near top (after COLOR_ORDER def)
rep("var COLOR_ORDER=['red','blue','green','yellow','purple','orange'];",
    "var COLOR_ORDER=['red','blue','green','yellow','purple','orange'];\nvar TITLE_KICK='LAZER ARCADE',TITLE_MAIN='HARBOR<span>RUSH</span>';");

// 2) title screen uses configurable text
rep('<div class="k">LAZER ARCADE</div><h1>HARBOR<span>RUSH</span></h1>',
    "<div class=\"k\">'+TITLE_KICK+'</div><h1>'+TITLE_MAIN+'</h1>");

// 3) kit score report in endLevel (after the LZ.endSession line)
rep("if(window.LZ_GAME&&window.LZ&&r.total>0)try{LZ.endSession(LZ_GAME,r.total,{level:LV.endless?'rush':key,stars:r.stars||0});}catch(e){}",
    "if(window.LZ_GAME&&window.LZ&&r.total>0)try{LZ.endSession(LZ_GAME,r.total,{level:LV.endless?'rush':key,stars:r.stars||0});}catch(e){}\n  if(window.__KIT&&r.total>0)try{parent.postMessage({type:'crane-score',score:r.total,won:!!win},'*');}catch(e){}");

// 4) gate boot + pack apply + kit save/load, replacing the auto-boot tail
rep("Promise.all([fontsReady,lzBoot()]).then(init,init);",
`function applyPack(pk){ if(!pk)return;
  try{
    if(pk.ports&&pk.ports.length)PORTS=pk.ports;
    if(pk.colorOrder&&pk.colorOrder.length)COLOR_ORDER=pk.colorOrder;
    if(pk.types)for(var k in pk.types){TYPES[k]=Object.assign({},TYPES[k]||{},pk.types[k]);}
    if(pk.titleMain)TITLE_MAIN=pk.titleMain;
    if(pk.titleKick)TITLE_KICK=pk.titleKick;
    SAVEKEY='cranekit.'+(pk.gameId||'test');
    if(pk.noEndless){endlessOpen=function(){return false;};}
    if(pk.title){document.title=pk.title;}
  }catch(e){}
}
if(window.__KIT){
  load=function(){try{var s=JSON.parse(window.__SAVE||'null');if(s&&s.v===3){s.stars=s.stars||{};s.best=s.best||{};s.up=s.up||{};return s;}}catch(e){}return null;};
  save=function(){if(!G)return;try{var d=JSON.stringify(G);window.__SAVE=d;if(window.__PERSIST)parent.postMessage({type:'crane-save',data:d},'*');}catch(e){}};
}
window.__CRANE_BOOT=function(){applyPack(window.__PACK);Promise.all([fontsReady,lzBoot()]).then(init,init);};
if(window.__KIT){try{parent.postMessage({type:'crane-ready'},'*');}catch(e){}}else{window.__CRANE_BOOT();}`);

// assemble: shell + kit harness head + engine
let shell=fs.readFileSync(shellPath,'utf8');
const head=`<meta name="robots" content="noindex,nofollow"><script>
window.__KIT=1;
window.addEventListener('message',function(e){var d=e.data||{};if(d.type!=='crane-pack')return;
  var proj=d.project||{};var pk=proj.pack||d.pack||{};pk=JSON.parse(JSON.stringify(pk));
  pk.title=proj.title||pk.title;pk.gameId=d.gameId||pk.gameId||'test';
  window.__PACK=pk;window.__SAVE=d.save||null;window.__PERSIST=!!d.persist;
  if(window.__CRANE_BOOT&&!window.__booted){window.__booted=1;window.__CRANE_BOOT();}
});
<\/script>`;
shell=shell.replace('<!--LZHEAD-->',head);
const END='})();';
// shell.html already ends with an open <script> tag; append engine JS then close.
const full=shell+'\n'+js+'\n'+END+'\n</script>\n</body>\n</html>\n';
// sanity parse
try{new Function(js+'\n'+END);}catch(err){console.error('ENGINE SYNTAX ERROR:',err.message);process.exit(1);}
fs.writeFileSync(out,full);
console.log('built',out,(full.length/1024|0)+'KB');
NODE
