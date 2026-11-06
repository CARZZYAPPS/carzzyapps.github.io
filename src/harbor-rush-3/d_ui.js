
/* ================= UI ================= */
var PAUSED=true,SCREEN=null,callT=null,lastRes=null;
function show(html,cls,id){var el=$('#scr');el.innerHTML='<div class="scr '+(cls||'')+'"'+(id?' id="'+id+'"':'')+'>'+html+'</div>';SCREEN=id||cls||'x';el.scrollTop=0;}
function hideScr(){$('#scr').innerHTML='';SCREEN=null;}
function gameUI(on){$('#hud').classList.toggle('hide',!on);$('#ctl').classList.toggle('hide',!on||!TOUCH);$('#keys').classList.toggle('hide',!on||TOUCH);if(!on)$('#tip').classList.add('hide');}
function callout(msg,sub){var c=$('#call');c.innerHTML='<div>'+esc(msg)+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';clearTimeout(callT);callT=setTimeout(function(){c.innerHTML='';},1300);}
function starsStr(n){var s='';for(var i=0;i<3;i++)s+=i<n?'★':'☆';return s;}
var STAR_SVG='<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="#0b1626" stroke-width="1.2" d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 17.3l-6.1 3.4 1.5-6.7L2.3 9.4l6.8-.7z"/></svg>';
var CRANE_ART='<svg class="crane-art" viewBox="0 0 300 130" aria-hidden="true"><rect x="0" y="112" width="300" height="18" fill="#2a8fd0"/><rect x="0" y="100" width="128" height="14" fill="#cfc7b8"/>'+
  '<rect x="28" y="22" width="9" height="80" fill="#ffb21a"/><rect x="102" y="22" width="9" height="80" fill="#ffb21a"/><rect x="10" y="16" width="285" height="10" fill="#ffb21a"/><path d="M32 16 L106 0 L106 16" stroke="#ffb21a" stroke-width="5" fill="none"/>'+
  '<path d="M106 0 L292 16" stroke="#c88a10" stroke-width="2"/><rect x="190" y="25" width="34" height="9" rx="2" fill="#2b2f36"/><line x1="200" y1="34" x2="196" y2="64" stroke="#111" stroke-width="2"/><line x1="214" y1="34" x2="218" y2="64" stroke="#111" stroke-width="2"/>'+
  '<rect x="186" y="64" width="42" height="4" fill="#ffb21a"/><rect x="186" y="68" width="42" height="20" rx="2" fill="#e5483b"/><circle cx="207" cy="78" r="6" fill="#fff"/>'+
  '<path d="M140 100 L292 100 L280 122 L148 122Z" fill="#d8402f"/><rect x="150" y="80" width="26" height="20" fill="#2f8ff0"/><rect x="178" y="80" width="26" height="20" fill="#2fbf6a"/><rect x="150" y="60" width="26" height="20" fill="#ffc61a"/><rect x="232" y="80" width="26" height="20" fill="#8a5cf0"/><rect x="262" y="66" width="18" height="34" fill="#f2f4f6"/></svg>';

function showTitle(){
  LV=null;gameUI(false);PAUSED=true;
  var ea=window.LZ_EA?'<div id="tEA">Early access · points held and paid 1.5× at launch</div>':'';
  var lz=window.LZ_GAME?'<div id="tLz">Signed-in progress syncs to your Lazer Arcade account.</div>':'<div id="tLz">Progress saves in this browser.</div>';
  show('<div class="logo"><div class="k">LAZER ARCADE</div><h1>HARBOR<span>RUSH</span></h1><div class="st stripe"></div></div>'+CRANE_ART+
    '<div class="card"><p>You\'re the crane operator. Swing containers off the ship, dig out what each truck wants, and land every box dead center.</p>'+
    '<div class="row"><button class="btn" data-a="play">'+(starsTotal()?'Continue':'Play')+'</button></div>'+ea+lz+
    '<button class="tgl" data-a="mute">Sound: '+(G.mute?'off':'on')+'</button></div>','', 'title');
}
function showMap(){
  LV=null;gameUI(false);PAUSED=true;var st=starsTotal(),h='';
  h+='<div class="top"><button class="btn sec" data-a="title" aria-label="Back">◀</button><div class="sp"></div><div class="coins">★ '+st+'</div><div class="coins">⛁ '+fmt(G.coins)+'</div><button class="btn sec" data-a="shop">Workshop</button></div>';
  h+='<h1>Ports</h1>';
  PORTS.forEach(function(P,pi){var open=portOpen(pi),bg='linear-gradient(160deg,'+P.th.sky[0]+' 0%,'+P.th.sea[0]+' 70%,'+P.th.sea[1]+' 100%)';
    h+='<div class="port" style="background:'+bg+'"><div class="stc">'+portStars(pi)+'/18 ★</div><h3>'+esc(P.name)+'</h3><div class="tg">'+esc(P.tag)+'</div><div class="lvls">';
    for(var li=0;li<6;li++){var s=G.stars[pi+'-'+li]||0,ok=lvOpen(pi,li),nx=ok&&!s;h+='<button class="lv'+(nx?' next':'')+'" data-a="lv" data-p="'+pi+'" data-l="'+li+'"'+(ok?'':' disabled')+'>'+(li+1)+'<small>'+(s?starsStr(s):ok?'':'🔒')+'</small></button>';}
    h+='</div>'+(open?'':'<div class="lock">🔒 '+P.need+' ★ to unlock<br>(you have '+st+')</div>')+'</div>';});
  var eo=endlessOpen();
  h+='<div class="mode"><button class="btn'+(eo?' grn':' sec')+'" data-a="endless"'+(eo?'':' disabled')+'>Rush Hour'+(eo?' · best '+fmt(G.endless):' · clear 1-6')+'</button></div>';
  h+='<div class="mode"><button class="btn sec" data-a="mute">Sound: '+(G.mute?'off':'on')+'</button></div>';
  show(h,'','map');
}
function showIntro(pi,li){
  var P=PORTS[pi],p=P.lv[li],rules=P.rules.slice();if(p.w&&rules.indexOf('wind')<0)rules.push('wind');if(p.r&&rules.indexOf('reefer')<0)rules.push('reefer');if(p.z&&rules.indexOf('hazmat')<0)rules.push('hazmat');
  var R={wind:['💨','Wind gusts push the hanging load. Wait for it to settle.'],reefer:['❄','Reefers thaw off the ship. Ship them or park them on a ⚡ powered slot.'],hazmat:['☢','Hazmat: a clang costs a heart, a bump costs 100 points. Land it clean.'],night:['🌙','Night shift: only the lights show what\'s what.']};
  var g='<div class="goal"><div><i>🚚</i>Load '+p.n+' trucks</div><div><i>⏱</i>Par time '+mmss(p.par)+' with all 3 hearts for ★★★</div>';
  rules.forEach(function(r){g+='<div><i>'+R[r][0]+'</i>'+R[r][1]+'</div>';});g+='</div>';
  var best=G.best[pi+'-'+li];
  show('<div class="card"><div class="gold" style="font:13px var(--disp)">'+esc(P.name.toUpperCase())+'</div><h2>Level '+(pi+1)+'-'+(li+1)+'</h2>'+g+(best?'<p>Best: <b>'+fmt(best)+'</b> · '+starsStr(G.stars[pi+'-'+li]||0)+'</p>':'')+
    '<div class="row"><button class="btn sec" data-a="map">Back</button><button class="btn" data-a="go" data-p="'+pi+'" data-l="'+li+'">Start</button></div></div>','glass','intro');
}
function showPause(){if(!LV||LV.phase!=='play')return;PAUSED=true;
  show('<div class="card"><h2>Paused</h2><p>'+(LV.endless?'Rush Hour':'Level '+(LV.pi+1)+'-'+(LV.li+1))+' · '+fmt(LV.score)+' pts</p><div class="row"><button class="btn" data-a="resume">Resume</button></div><div class="row"><button class="btn sec" data-a="retry">Restart</button><button class="btn sec" data-a="map">Ports</button></div><button class="tgl" data-a="mute">Sound: '+(G.mute?'off':'on')+'</button></div>','glass','pause');}
function showShop(){
  var h='<div class="card"><div style="display:flex;align-items:center;gap:10px"><h2 style="flex:1">Workshop</h2><div class="coins">⛁ '+fmt(G.coins)+'</div></div><p>Earn coins by finishing levels. Upgrades apply everywhere.</p>';
  UPG_ORDER.forEach(function(k){var d=UPG[k],l=U(k),c=UPG_COST[l];h+='<div class="up"><div class="ic">'+d.ic+'</div><div class="tx"><b>'+d.name+'</b><small>'+d.desc+'</small><div class="pips">';for(var i=0;i<5;i++)h+='<i'+(i<l?' class="on"':'')+'></i>';h+='</div></div>'+(l>=5?'<button class="btn sec" disabled>Max</button>':'<button class="btn" data-a="buy" data-p="'+k+'"'+(G.coins<c?' disabled':'')+'>⛁ '+c+'</button>')+'</div>';});
  h+='<div class="row"><button class="btn sec" data-a="map">Done</button></div></div>';show(h,'glass','shop');}

function startGame(pi,li,endless){hideScr();audio();startLevel(pi,li,endless);gameUI(true);PAUSED=false;G.plays++;save();
  if(endless)callout('Rush Hour','Trucks never stop. 3 hearts.');else callout('Level '+(pi+1)+'-'+(li+1),'Load '+LV.p.n+' trucks');}

/* ---------- end of level ---------- */
function endLevel(win){
  if(!LV||LV.phase!=='play')return;LV.phase='done';humSet(0,false);var p=LV.p,key=LV.pi+'-'+LV.li,r={win:win,endless:LV.endless,score:LV.score,t:LV.t};
  if(LV.endless){r.total=LV.score;r.newBest=r.total>(G.endless||0);if(r.newBest)G.endless=r.total;r.coins=Math.floor(r.total/150);}
  else{r.timeB=win?Math.round(Math.max(0,p.par-LV.t)*12):0;r.heartB=win?LV.hearts*250:0;r.total=LV.score+r.timeB+r.heartB;
    r.stars=!win?0:(LV.t<=p.par&&LV.hearts===3)?3:(LV.t<=p.par*1.35&&LV.hearts>=2)?2:1;
    var prev=G.stars[key]||0;r.newStars=Math.max(0,r.stars-prev);if(r.stars>prev)G.stars[key]=r.stars;
    r.newBest=r.total>(G.best[key]||0)&&win;if(r.newBest)G.best[key]=r.total;
    r.coins=Math.floor(r.total/120)+r.newStars*15;}
  G.coins+=r.coins;G.total=(G.total||0)+r.total;r.stats=LV.stats;r.perf=LV.perf;r.served=LV.served;r.missed=LV.missed;r.bumps=LV.bumps;r.clangs=LV.clangs;r.lp=Math.round(r.total*LZR*LZM);r.ea=!!window.LZ_EA;
  save();lastRes=r;
  if(window.LZ_GAME&&window.LZ&&r.total>0)try{LZ.endSession(LZ_GAME,r.total,{level:LV.endless?'rush':key,stars:r.stars||0});}catch(e){}
  if(win){SFX.win();for(var i=0;i<4;i++)setTimeout(function(){if(LV)confetti(rnd(LV.L.minX+2,LV.L.maxX-2),3,18);},i*180);}
  setTimeout(function(){showResults(r);},win?1100:900);
}
function showResults(r){
  PAUSED=true;gameUI(false);var h='<div class="card" style="text-align:center">',P=function(n){return fmt(n);};
  if(r.endless)h+='<h2>Rush Hour over</h2><div class="big gold">'+P(r.total)+'</div>'+(r.newBest?'<span class="nb">NEW BEST</span>':'<p>Best '+P(G.endless)+'</p>');
  else{h+='<h2>'+(r.win?'Level clear!':'Out of hearts')+'</h2><div class="stars" style="color:var(--hz)">'+STAR_SVG+STAR_SVG+STAR_SVG+'</div><div class="big">'+P(r.total)+'</div>'+(r.newBest?'<span class="nb">NEW BEST</span>':'');}
  h+='<div class="kv" style="text-align:left"><span>Trucks loaded</span><span>'+r.served+(r.missed?' <span class="neg">('+r.missed+' left)</span>':'')+'</span><span>Delivery points</span><span class="pos">+'+P(r.stats.deliverPts)+'</span><span>Perfect drops ('+r.perf+')</span><span class="pos">+'+P(r.stats.perfPts)+'</span>';
  if(r.stats.pen)h+='<span>Bumps & clangs</span><span class="neg">-'+P(r.stats.pen)+'</span>';
  if(!r.endless&&r.win)h+='<span>Time bonus ('+mmss(r.t)+')</span><span class="pos">+'+P(r.timeB)+'</span><span>Hearts bonus</span><span class="pos">+'+P(r.heartB)+'</span>';
  h+='<span class="t">Score</span><span class="t">'+P(r.total)+'</span><span>Coins</span><span class="gold">+'+P(r.coins)+' ⛁</span>';
  if(window.LZ_GAME)h+='<span>Lazer Points'+(r.ea?' (held, paid 1.5× at launch)':LZM>1?' ('+LZM+'× today)':'')+'</span><span class="pos">+'+P(r.ea?Math.round(r.lp*1.5):r.lp)+' LP</span>';
  h+='</div>';
  var nx=!r.endless&&r.win&&LV&&LV.li<5?[LV.pi,LV.li+1]:!r.endless&&r.win&&LV&&LV.pi<PORTS.length-1&&portOpen(LV.pi+1)?[LV.pi+1,0]:null;
  h+='<div class="row"><button class="btn sec" data-a="map">Ports</button><button class="btn sec" data-a="retry">Retry</button>'+(nx?'<button class="btn" data-a="lv" data-p="'+nx[0]+'" data-l="'+nx[1]+'">Next</button>':'')+'</div></div>';
  show(h,'glass','res');
  if(!r.endless)$('#scr .stars').querySelectorAll('svg').forEach(function(s,i){if(i<r.stars)setTimeout(function(){s.classList.add('in');SFX.star(i);},250+i*300);else{s.style.color='rgba(255,255,255,.15)';setTimeout(function(){s.classList.add('in');},250+i*300);}});
}

/* ---------- HUD ---------- */
var hudC={};
function setT(id,v){if(hudC[id]!==v){hudC[id]=v;$('#'+id).textContent=v;}}
function hud(){
  if(!LV)return;
  setT('hName',LV.endless?'RUSH HOUR':(LV.pi+1)+'-'+(LV.li+1)+(CWpx>520?' '+LV.P.name.toUpperCase():''));
  setT('hTime',LV.endless?mmss(LV.t)+' · ship '+LV.ships:mmss(LV.t)+' / par '+mmss(LV.p.par));
  setT('hPts',fmt(LV.score));setT('hCombo',LV.combo>=2?'×'+comboMult().toFixed(1)+' COMBO':'');
  var hh='';for(var i=0;i<3;i++)hh+=i<LV.hearts?'❤️':'🖤';setT('hHearts',hh);
  var tk=LV.endless?'s'+LV.served:LV.served+'/'+LV.missed+'/'+LV.p.n;
  if(hudC.tk!==tk){hudC.tk=tk;var e=$('#hTrucks');if(LV.endless)e.innerHTML='<b style="font:15px var(--disp)">🚚 '+LV.served+'</b>';else{var s='';for(var j=0;j<LV.p.n;j++)s+='<i class="'+(j<LV.served?'ok':j<LV.served+LV.missed?'miss':'')+'"></i>';e.innerHTML=s;}}
  var ab=$('#bAct'),lab=CR.carry?'DROP':'GRAB';if(hudC.ab!==lab){hudC.ab=lab;ab.textContent=lab;ab.classList.toggle('drop',!!CR.carry);}
  var busy=CR.state!=='idle'||CR.stun>0;if(hudC.busy!==busy){hudC.busy=busy;ab.classList.toggle('busy',busy);}
  tutTick();
}

/* ---------- tutorial (level 1-1) ---------- */
var tutTarget=null;
function tip(t){var e=$('#tip');if(!t){e.classList.add('hide');return;}if(e.textContent!==t)e.textContent=t;e.classList.remove('hide');}
function tutTick(){
  tutTarget=null;if(!LV||LV.tutStep<0||LV.phase!=='play'){if(LV&&LV.tutStep<0)tip(null);return;}
  var t=LV.trucks.filter(function(x){return x.state==='wait';})[0];
  if(!t){tip(LV.tutStep>=3?null:'A truck is pulling in…');return;}
  if(LV.tutStep===0||LV.tutStep===1){var s=null;LV.L.slots.forEach(function(sl){if(!s&&sl.kind!=='lane'&&sl.stack.length&&sl.stack[sl.stack.length-1].t===t.want)s=sl;});
    if(CR.carry){LV.tutStep=2;return;}
    if(!s){tip('Dig! Move the boxes on top to the yard first.');return;}tutTarget=s;
    var over=Math.abs(hookX()-s.x)<tolGrab();
    tip(over?(TOUCH?'Now tap GRAB':'Now press SPACE (or click) to grab'):(TOUCH?'Hold ◀ ▶ (or drag) to move over the '+TYPES[t.want].n+' container':'Use ← → (or drag) to move over the '+TYPES[t.want].n+' container'));return;}
  if(LV.tutStep===2){tutTarget=t.lane;tip(CR.carry?'Swing it over the truck. Drop when the guide turns green':'Grab the container the truck wants');return;}
  if(LV.tutStep===3){tip('Buried? Move the boxes on top to the yard first.');}
}
function tut(ev){if(!LV||LV.tutStep<0)return;if(ev==='grab'&&LV.tutStep<2)LV.tutStep=2;else if(ev==='drop'&&LV.tutStep===2&&LV.served>=1){LV.tutStep=3;setTimeout(function(){if(LV&&LV.tutStep===3){LV.tutStep=-1;tip(null);G.tut=1;save();}},9000);}}
function drawTut(){if(!tutTarget)return;var s=tutTarget,S=VIEW.S,y=s.kind==='lane'?LANE_Y+CH:topY(s),p=.5+.5*Math.sin(TIME*6);
  cx.strokeStyle='rgba(255,255,255,'+(.5+.5*p)+')';cx.lineWidth=3;rr(SX(s.x)-CW*S/2-4,SY(y)-4,CW*S+8,CH*S*(s.kind==='lane'?1:1)+8,6);cx.stroke();
  cx.fillStyle='#fff';cx.font=Math.round(S*.5)+'px Bungee,sans-serif';cx.textAlign='center';cx.fillText('▼',SX(s.x),SY(y+CH+.35+p*.15));}

/* ---------- input ---------- */
var keys={};
function dirFromKeys(){return (keys.r?1:0)-(keys.l?1:0);}
window.addEventListener('keydown',function(e){var k=e.key;
  if(k==='Escape'||k==='p'||k==='P'){if(SCREEN==='pause'){hideScr();PAUSED=false;}else if(LV&&LV.phase==='play'&&!SCREEN)showPause();return;}
  if(!LV||PAUSED)return;
  if(k==='ArrowLeft'||k==='a'||k==='A'){keys.l=1;INP.dir=dirFromKeys();e.preventDefault();}
  else if(k==='ArrowRight'||k==='d'||k==='D'){keys.r=1;INP.dir=dirFromKeys();e.preventDefault();}
  else if((k===' '||k==='Enter'||k==='ArrowDown'||k==='s'||k==='S')&&!e.repeat){action();e.preventDefault();}});
window.addEventListener('keyup',function(e){var k=e.key;if(k==='ArrowLeft'||k==='a'||k==='A')keys.l=0;if(k==='ArrowRight'||k==='d'||k==='D')keys.r=0;INP.dir=dirFromKeys();});
function holdBtn(el,d){var on=function(e){e.preventDefault();audio();INP.dir=d;el.classList.add('on');},off=function(){if(INP.dir===d)INP.dir=0;el.classList.remove('on');};
  el.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(function(ev){el.addEventListener(ev,off);});}
holdBtn($('#bL'),-1);holdBtn($('#bR'),1);
$('#bAct').addEventListener('pointerdown',function(e){e.preventDefault();var b=e.currentTarget;b.classList.add('on');setTimeout(function(){b.classList.remove('on');},120);action();});
var PD=null;
cv.addEventListener('pointerdown',function(e){audio();if(!LV||PAUSED)return;PD={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),drag:false,cx:CR.x};});
cv.addEventListener('pointermove',function(e){if(!PD||e.pointerId!==PD.id)return;if(!PD.drag&&Math.hypot(e.clientX-PD.x,e.clientY-PD.y)>12)PD.drag=true;if(PD.drag)INP.drag=PD.cx+(e.clientX-PD.x)/VIEW.S;});
function pEnd(e){if(!PD||e.pointerId!==PD.id)return;if(!PD.drag&&performance.now()-PD.t<400)action();PD=null;INP.drag=null;}
cv.addEventListener('pointerup',pEnd);cv.addEventListener('pointercancel',function(){PD=null;INP.drag=null;});
$('#hPause').addEventListener('click',function(){showPause();});
document.addEventListener('visibilitychange',function(){if(document.hidden){save();if(LV&&LV.phase==='play'&&!SCREEN)showPause();}});
window.addEventListener('pagehide',save);
window.addEventListener('resize',function(){resize();setTimeout(resize,250);});

$('#scr').addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b||b.disabled)return;audio();SFX.ui();var a=b.dataset.a,p=b.dataset.p,l=b.dataset.l;
  if(a==='play'){if(!starsTotal())showIntro(0,0);else showMap();}
  else if(a==='title')showTitle();
  else if(a==='map')showMap();
  else if(a==='shop')showShop();
  else if(a==='lv')showIntro(+p,+l);
  else if(a==='go')startGame(+p,+l,false);
  else if(a==='endless')startGame(0,0,true);
  else if(a==='resume'){hideScr();PAUSED=false;}
  else if(a==='retry'){if(LV)startGame(LV.pi,LV.li,LV.endless);else showMap();}
  else if(a==='mute'){setMute(!G.mute);b.textContent='Sound: '+(G.mute?'off':'on');}
  else if(a==='buy'){var c=UPG_COST[U(p)];if(G.coins>=c&&U(p)<5){G.coins-=c;G.up[p]=U(p)+1;save();SFX.coin();showShop();}}
});

/* ================= LOOP ================= */
var last=performance.now();
function frame(ts){requestAnimationFrame(frame);var dt=Math.min(.05,Math.max(0,(ts-last)/1000));last=ts;
  if(LV&&!PAUSED)update(dt);render(dt);if(LV&&!PAUSED)hud();}
function init(){
  var s=load();G=s||freshG();
  resize();
  // menu backdrop: a quiet demo level behind the title
  showTitle();
  requestAnimationFrame(function(t){last=t;requestAnimationFrame(frame);});
}
var fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1500);})]):Promise.resolve();
Promise.all([fontsReady,lzBoot()]).then(init,init);
