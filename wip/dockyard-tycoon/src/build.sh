#!/bin/bash
cd "$(dirname "$0")"
{ cat a_shell.html; echo "<script>"; cat b_core.js c_data.js d1_env.js d2_models.js e_shift.js f_empire.js g_ui.js g2_sheets.js h_main.js; echo "</script>"; } > harbor-rush.html
python3 - <<'PY'
import re
s=open('harbor-rush.html').read()
open('chk.js','w').write(re.findall(r'<script>(.*?)</script>',s,re.S)[-1])
t=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','../vendor/three.min.js')
hook="""window.__T={G:function(){return G;},SH:function(){return SH;},cash:function(v){G.cash=v;},lvl:function(l){G.lvl=l;},
 sim:function(sec){for(var i=0;i<sec*20;i++){simT+=.05;if(SH&&SH.phase!=='done')updShift(.05,simT);updTW(.05);updPuffs(.05);empTick(.05);}},
 step:function(){if(!SH||SH.phase==='done')return 'x';if(SH.queue.length>=3)return 'busy';
   var w=SH.cust.filter(function(c){return c.state==='wait'&&!c.paid;});
   for(var i=0;i<w.length;i++){var m=findMatch(w[i]);if(m){enqueue(m.from,{k:'truck',c:w[i],j:m.j},m.b,true);return 'serve';}}
   for(i=0;i<SH.cols.length;i++){var t=SH.cols[i].stack[SH.cols[i].stack.length-1];if(t&&t.spoiled&&!t.res){enqueue({k:'col',i:i},{k:'scrap'},t,true);return 'scrap';}}
   var want=openWants(),best=null;
   SH.cols.forEach(function(c,ci){if(c.kind==='customs')return;var tf=c.stack[c.stack.length-1];if(!tf||tf.res)return;var d=-1;for(var k=c.stack.length-2;k>=0;k--)if(want[c.stack[k].t]&&deliverable(c.stack[k])){d=c.stack.length-1-k;break;}if(d>0&&(!best||d<best.d))best={d:d,from:{k:'col',i:ci},b:tf};});
   SH.ships.forEach(function(sh){if(sh.st!=='dock')return;sh.bays.forEach(function(bay,bi){var tf=bay[bay.length-1];if(!tf||tf.res)return;var d=9;for(var k=bay.length-1;k>=0;k--)if(want[bay[k].t]){d=bay.length-1-k;break;}var sc=d-(sh.dep<20?3:0);if(!best||sc<best.d)best={d:sc,from:{k:'ship',s:sh,b:bi},b:tf};});});
   if(best){var ci=bestCol(best.b);if(best.from.k==='col'&&ci===best.from.i)ci=-1;if(ci>=0){enqueue(best.from,{k:'col',i:ci},best.b,true);return 'move';}if(best.from.k==='ship'&&best.from.s.dep<6){enqueue(best.from,{k:'scrap'},best.b,true);return 'dump';}}
   for(i=0;i<SH.cols.length;i++){var c2=SH.cols[i],t2=c2.stack[0];if(c2.kind==='customs'&&t2&&t2.cleared&&!t2.res&&!want[t2.t]){var c3=bestCol(t2);if(c3>=0&&c3!==i){enqueue({k:'col',i:i},{k:'col',i:c3},t2,true);return 'uncustoms';}}}
   return 'idle';},
 st:function(){return {paused:paused,sel:!!SH.sel,tut:G.stats.served};},
 ray:function(x,y){var r=renderer.domElement.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);return ray.intersectObjects(shiftHits(),false).map(function(h){var u=h.object.userData;return Object.keys(u).join('+')+(u.col!=null?u.col:'')+(u.bay!=null?':'+u.bay:'')+'@'+h.distance.toFixed(2);});},
 scr:function(x,y,z){var v=V3(x,y,z).project(camera);return [(v.x*.5+.5)*W,(-v.y*.5+.5)*H];},
 fn:{compCheck:compCheck,newRival:newRival,hostile:hostile,locEcon:locEcon,share:share,totalRate:totalRate,save:save,upCost:upCost,tapCol:tapCol,tapShip:tapShip,tapCust:tapCust,tapBin:tapBin,bestCol:bestCol,enqueue:enqueue},
 start:function(){startShift();},fit:fitCamera,act:act,buyLoc:buyLoc,openShop:openShop,openEmpire:openEmpire,closeSheet:closeSheet,closeModal:closeModal,end:function(){SH.t=SH.len;},
 info:function(){var i=renderer.info.render;return [i.calls,i.triangles];}};
})();"""
i=t.rindex('})();')
open('test.html','w').write(t[:i]+hook+t[i+5:])
PY
node --check chk.js && echo SYNTAX_OK && wc -c harbor-rush.html
# Lazer Arcade build
python3 - <<'PY'
s=open('harbor-rush.html').read()
inj='<script>window.LZ_GAME="harbor";</script>\n<script type="module" src="/arcade/lz.js"></script>\n'
i=s.index('<script src="https://cdnjs')
s=s[:i]+inj+s[i:]
s=s.replace('<title>Harbor Rush</title>','''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<title>Harbor Rush | Lazer Arcade</title>
<meta name="description" content="Harbor Rush: a 3D port tycoon. Unload ships before they sail, load trucks, clear customs and build a shipping empire.">
<link rel="canonical" href="https://www.carzzyapps.com/arcade/harbor-rush/">
<link rel="icon" href="/arcade/img/icon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0d2034">''')
s=s.replace('<div id="scene">','</head>\n<body>\n<div id="scene">',1)
s=s.rstrip()+'\n</body>\n</html>\n'
open('harbor-rush-arcade.html','w').write(s)
PY
echo ARCADE_OK
