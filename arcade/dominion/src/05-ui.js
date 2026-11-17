/* ================= UI ================= */
var tab="world",sub={army:"camp",forge:"gear",quests:"q",social:"chat",store:"boost"},mapSel=-1,M={cx:0,cy:0,R:1,sc:1},lastHint="",chatNew=0,bannerKey="";
function renderAll(){if(!S||!S.name)return;renderHud();renderNav();renderBanner();renderTab();}
function renderHud(){
  var h=$("#hud");
  if(!h.dataset.b){h.dataset.b=1;
    h.innerHTML='<button class="cmd" data-a="profile"><canvas width="76" height="76" data-flag="me" id="hflag"></canvas><div><div class="nm" id="hname"></div><div class="lv"><b id="hlv"></b><div class="xpb"><i id="hxp"></i></div>'+hk("h2")+'</div></div></button><span class="sp"></span><button class="hb" data-a="alerts">'+IC.bell+'<em id="hbell"></em></button><button class="hb" data-a="menu">'+IC.gear+'</button><div class="cur"><div class="c">'+IC.coin+'<span id="hc"></span></div><div class="c">'+IC.stamp+'<span id="hs"></span></div><div class="c">'+IC.alloy+'<span id="ha"></span></div><button class="c gem" data-a="tab" data-v="store">'+IC.gem+'<span id="hg"></span><u>+</u></button></div>';}
  $("#hname").textContent=S.name;$("#hlv").textContent="LV "+S.lvl;$("#hxp").style.width=clamp(S.xp/xpNeed(S.lvl)*100,0,100)+"%";
  $("#hc").textContent=fmt(S.coins);$("#hs").textContent=fmt(S.stamps);$("#ha").textContent=fmt(S.alloy);$("#hg").textContent=fmt(S.gems);
  var u=unread(),e=$("#hbell");e.textContent=u||"";e.style.display=u?"":"none";
  var fk=S.flag.em+S.flag.c1+S.flag.c2;if(h.dataset.f!==fk){h.dataset.f=fk;paintIcons(h);}
}
function renderNav(){
  var hungry=fedOn()&&now()>S.fedU&&armySize()>0,dots={army:hungry||(S.cap>0&&S.capU-now()<40000),quests:questsReady()+achReady()+passReady()>0,social:chatNew>0&&tab!=="social"};
  $("#nav").innerHTML=[["world","World",IC.globe],["army","Army",IC.army],["forge","Forge",IC.forge],["quests","Quests",IC.quest],["social","Social",IC.chat],["store","Store",IC.store]].map(function(t){return '<button data-a="tab" data-v="'+t[0]+'" class="'+(tab===t[0]?"on":"")+'">'+t[2]+t[1]+(dots[t[0]]?'<span class="dot"></span>':"")+"</button>";}).join("");
}
function renderBanner(){
  var th=S.threat,key=th?th.w+":"+th.n+":"+th.b:"";if(key===bannerKey&&(!th||$("#thrT"))){if(th)$("#thrT").textContent=th.t;return;}
  bannerKey=key;
  if(!th||B){$("#alerts").innerHTML="";return;}
  var n=S.worlds[th.w].n[th.n],b=bots()[th.b],p=defPower()/(30+20*th.lv),ds=p>1.15?"strong":p>.8?"shaky":"weak";
  $("#alerts").innerHTML='<div class="thr"><div class="sp"><b>'+esc(b.nm)+" is attacking "+esc(n.nm)+'!</b><small>Auto-defense in <span id="thrT">'+th.t+"</span>s · your defenses look "+ds+" "+hk("h5")+hk("h10b")+'</small></div><button class="btn s" data-a="defend">Defend</button><button class="btn s bx" data-a="autodef">Auto</button></div>';
}
function seg(key,opts){return '<div class="seg">'+opts.map(function(o){return '<button data-a="sub" data-v="'+o[0]+'" class="'+(sub[key]===o[0]?"on":"")+'">'+o[1]+(o[2]?'<span class="dot"></span>':"")+"</button>";}).join("")+"</div>";}
function renderTab(){
  var v=$("#view");
  if(tab==="world"){if(!$("#world")){v.innerHTML='<div id="world"><canvas id="map"></canvas><div class="wtop" id="wtop"></div><div class="wleft" id="wleft"></div><div class="wside" id="wside"></div><div id="wbot"></div></div>';$("#map").addEventListener("pointerdown",mapTap);}renderWorld();return;}
  var h='<div class="page">';
  if(tab==="army")h+=pgArmy();else if(tab==="forge")h+=pgForge();else if(tab==="quests")h+=pgQuests();else if(tab==="social")h+=pgSocial();else h+=pgStore();
  v.innerHTML=h+"</div>";paintIcons(v);
  if(tab==="social"&&sub.social==="chat"){var c=$("#chatBox");if(c)c.scrollTop=c.scrollHeight;chatNew=0;}
  if(tab==="store"&&sub.store==="wheel")drawWheel(wheelRot);
}
function cd(ts){return '<span data-cd="'+ts+'">'+dur((ts-now())/1000)+"</span>";}
function liveUpdate(){
  renderHud();renderBanner();
  $$("[data-cd]").forEach(function(e){var s=(+e.dataset.cd-now())/1000;e.textContent=s>0?dur(s):"0s";});
  if(tab==="world"){var vv=$("#vaultN");if(vv){var inc=incomeMin();vv.textContent=fmt(S.vault);vv.parentNode.parentNode.classList.toggle("full",inc>0&&S.vault>=inc*9.9);}var rb=$("#raidB");if(rb){rb.classList.toggle("off",S.raidCd>0);rb.lastChild.textContent=S.raidCd>0?" Scouting "+S.raidCd+"s":" Raid a rival";}
    var tp=$("#tourP");if(tp)tp.textContent=(tourOn()?"LIVE ":"in ")+mmss(tourLeft());
    var ht=hintText();if(ht!==lastHint&&mapSel<0)renderWorld();}
  if(tickN%4===0){var fb=$("#fedBar");if(fb){var f=clamp((S.fedU-now())/FED_MS,0,1);fb.style.width=(f*100)+"%";}}
  if(tickN%6===0)renderNav();
}

/* ---------- world ---------- */
function hintText(){
  var wd=W(),inc=incomeMin(),i,n;
  if(armySize()<6)return "Your army is nearly gone. Recruit soldiers in the Army tab.";
  if(fedOn()&&now()>S.fedU)return "Your army is hungry and fighting at 80%. Feed them in Army, Mess Hall.";
  if(questsReady())return "A quest reward is waiting in Quests.";
  if(inc>0&&S.vault>=inc*9)return "Your vault is full. Collect it before it stops filling.";
  if(S.stats.wins===0)return "Tap a glowing outpost on the rim of the planet to launch your first attack.";
  for(i=0;i<wd.n.length;i++){n=wd.n[i];if(n.ty===1&&attackable(wd,n))return n.nm+" has lost its outposts. Strike the city now.";}
  for(i=0;i<wd.n.length;i++){n=wd.n[i];if(n.ty>=2&&attackable(wd,n))return n.nm+" is exposed. This is the big one.";}
  if(S.lvl>=3&&S.fort<S.lvl-1)return "Rivals raid weak fortresses. Upgrade yours in Forge before you log off.";
  if(armySize()<campCap()-4&&S.coins>recruitCost("trooper")*4)return "You have room in camp. Split your coins between recruits and upgrades.";
  if(wd.done&&S.cur<S.worlds.length-1)return "This world is yours. A new planet is waiting on the star chart.";
  return "Pick your next target. Outposts first, then the city they guard.";
}
function renderWorld(){
  var wd=W(),th=THEMES[wd.th],ev=evNow(),inc=incomeMin();
  $("#wtop").innerHTML='<div class="pl"><button data-a="planet" data-v="-1" '+(S.cur<=0?"disabled":"")+'>‹</button><div style="text-align:center"><b>'+esc(wd.nm)+"</b><small>"+th.nm+" world · "+Math.round(worldPct(wd)*100)+"% yours "+hk("h1")+'</small></div><button data-a="planet" data-v="1" '+(S.cur>=S.worlds.length-1?"disabled":"")+">›</button></div>";
  var l='<button class="pill ev" data-a="goEvent"><span><b>'+ev.nm+"</b><br>ends in "+cd(now()+evLeft()*1000)+"</span>"+hk("h14")+'</button><button class="pill tr" data-a="goTour"><span><b>Blitz Tournament</b><br><span id="tourP"></span></span>'+hk("h13b")+"</button>";
  if(now()<S.shieldU)l+='<div class="pill sh">'+IC.shield+"<span><b>Shield</b> "+cd(S.shieldU)+"</span></div>";
  if(now()<S.genU)l+='<div class="pill">'+IC.sword+"<span><b>Adv. General</b> "+cd(S.genU)+"</span></div>";
  $("#wleft").innerHTML=l;
  $("#wside").innerHTML='<div class="vault"><div><b>'+IC.coin+' <span id="vaultN">'+fmt(S.vault)+"</span></b><small>"+fmt(inc)+'/min · online only</small></div><button class="btn s" data-a="collect">Collect</button></div><button class="btn s b2" id="raidB" data-a="raid">'+IC.sword+"<span> Raid a rival</span></button>";
  var b=$("#wbot");
  if(mapSel>=0&&wd.n[mapSel])b.innerHTML=nodePanel(wd,wd.n[mapSel]);
  else{var ht=hintText();if(ht!==lastHint){lastHint=ht;S.stats.hints++;hit("h4b");}b.innerHTML='<div class="hint"><span>'+esc(ht)+"</span>"+hk("h4b")+"</div>";}
  liveUpdate();
}
function nodePanel(wd,n){
  var lv=nodeLv(wd,n),mu=matchup(n.ty,lv),can=attackable(wd,n),kids=n.k.length,got=n.k.filter(function(k){return wd.n[k].o===1;}).length,rv=bots()[n.rv%24],wm=1+.5*wd.w;
  var h='<div id="node"><button class="x" data-a="unsel">✕</button><h3>'+esc(n.nm)+' <span class="tag">'+TIER[n.ty]+"</span>"+(n.o?' <span class="tag l">Yours</span>':' <span class="tag '+mu[1]+'">'+mu[0]+"</span>")+"</h3>";
  if(S.chest&&S.chest.w===wd.w&&S.chest.n===n.i)h+='<div class="row" style="margin:6px 0"><span class="sp">'+IC.chest+" A treasure chest is sitting here. "+hk("h15")+'</span><button class="btn s" data-a="chest">Open</button></div>';
  if(n.o){h+='<p class="sm mut" style="margin:4px 0">Earning '+fmt(T_INC[n.ty]*(1+.6*wd.w))+" coins per minute while you are online. Rivals can take it back. "+hk("h5")+"</p></div>";return h;}
  h+='<div class="st"><span>Held by <b>'+esc(rv.nm)+"</b></span><span>Enemy level <b>"+lv+"</b></span><span>Terrain <b>"+TERR[n.tr].nm+"</b></span></div><p class=\"sm mut\" style=\"margin:2px 0\">"+TERR[n.tr].d+'</p><div class="loot"><span>'+IC.coin+" ~"+fmt(T_COIN[n.ty]*wm*(1+.06*(lv-1)))+"</span>"+(T_ALLOY[n.ty]?"<span>"+IC.alloy+" "+Math.round(T_ALLOY[n.ty]*wm)+"</span>":"")+"<span>"+IC.xp+" "+Math.round(T_XP[n.ty]*(1+.1*(lv-1)))+"</span><span>"+IC.flag+" +"+fmt(T_INC[n.ty]*(1+.6*wd.w))+"/min</span></div>";
  if(!can){h+='<p class="sm" style="color:var(--gold)">'+IC.lock+" Capture everything that guards it first ("+got+"/"+kids+").</p></div>";return h;}
  h+='<div class="row w"><button class="btn big" data-a="attack" data-v="'+n.i+'">'+IC.sword+' Attack</button><button class="btn bx" data-a="attackAuto" data-v="'+n.i+'">Send General</button>';
  if(S.ally>=0)h+='<button class="btn b2 '+(S.allyCd>0?"off":"")+'" data-a="attackAlly" data-v="'+n.i+'">'+(S.allyCd>0?"Ally "+S.allyCd+"s":"With ally")+"</button>";
  h+="</div><p class=\"sm mut\" style=\"margin:6px 0 0\">You command: "+armySize()+" soldiers. The free General fights for you at half score. "+hk("h4")+"</p></div>";
  return h;
}
function nodePos(n){return[M.cx+Math.cos(n.a)*n.r*2*M.R,M.cy+Math.sin(n.a)*n.r*2*M.R];}
function mapTap(e){
  var cv=$("#map"),rc=cv.getBoundingClientRect(),x=e.clientX-rc.left,y=e.clientY-rc.top,wd=W(),best=-1,bd=30*M.sc;
  wd.n.forEach(function(n){var p=nodePos(n),d=Math.hypot(p[0]-x,p[1]-y)-[4,7,9,11,16][n.ty]*M.sc;if(d<bd){bd=d;best=n.i;}});
  if(best!==mapSel){mapSel=best;if(best>=0){snd("tap");var n=wd.n[best];if(!n.o&&n.ty>=2&&attackable(wd,n)&&!S.offers.siege[wd.w+":"+n.i]&&offerDue()&&S.stats.wins>4){S.offers.siege[wd.w+":"+n.i]=1;renderWorld();showOffer("siege");return;}}renderWorld();}
}
var stars=null;
function mapLoop(ts){
  requestAnimationFrame(mapLoop);
  var cv=$("#map");if(!cv||B||tab!=="world"||!S||!S.name)return;
  var w=cv.clientWidth,h=cv.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  var c=cv.getContext("2d"),t=ts/1000,wd=W(),th=THEMES[wd.th],my=myCols(),i,n,p;
  c.setTransform(dpr,0,0,dpr,0,0);
  var g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,"#0a0926");g.addColorStop(1,"#1c0f52");c.fillStyle=g;c.fillRect(0,0,w,h);
  if(!stars){stars=[];var sr=rng(77);for(i=0;i<110;i++)stars.push([sr(),sr(),.5+sr()*1.6,sr()*TAU]);}
  for(i=0;i<stars.length;i++){var s=stars[i];c.globalAlpha=.35+.45*Math.abs(Math.sin(t*.8+s[3]));c.fillStyle="#fff";c.fillRect(s[0]*w,s[1]*h,s[2],s[2]);}c.globalAlpha=1;
  var top=58,bot=mapSel>=0?150:64,ah=h-top-bot;M.R=Math.max(90,Math.min(w*.47,ah*.5));M.cx=w/2;M.cy=top+ah/2;M.sc=clamp(M.R/200,.72,1.5);
  var R=M.R,cx=M.cx,cy=M.cy;
  var hg=c.createRadialGradient(cx,cy,R*.9,cx,cy,R*1.35);hg.addColorStop(0,th.acc+"55");hg.addColorStop(1,"transparent");c.fillStyle=hg;c.beginPath();c.arc(cx,cy,R*1.35,0,TAU);c.fill();
  var pg=c.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R);pg.addColorStop(0,th.g1);pg.addColorStop(1,th.g2);c.fillStyle=pg;c.beginPath();c.arc(cx,cy,R,0,TAU);c.fill();
  c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();
  var pr=rng(hash(wd.nm));for(i=0;i<9;i++){c.fillStyle=i%2?th.sea+"66":"rgba(255,255,255,.07)";c.beginPath();c.ellipse(cx+(pr()-.5)*R*1.8,cy+(pr()-.5)*R*1.8,R*(.12+pr()*.3),R*(.08+pr()*.2),pr()*3,0,TAU);c.fill();}
  var C=0;wd.n.forEach(function(x){if(x.ty===3)C++;});
  wd.n.forEach(function(x){if(x.ty!==3)return;var a0=x.a-TAU/C/2,a1=x.a+TAU/C/2;if(x.o){c.fillStyle=my[0]+"3a";c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,R,a0,a1);c.closePath();c.fill();}c.strokeStyle="rgba(255,255,255,.2)";c.lineWidth=1.5;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a0)*R,cy+Math.sin(a0)*R);c.stroke();});
  var sg=c.createRadialGradient(cx-R*.45,cy-R*.5,R*.5,cx,cy,R*1.05);sg.addColorStop(0,"rgba(0,0,0,0)");sg.addColorStop(.75,"rgba(5,3,30,.12)");sg.addColorStop(1,"rgba(5,3,30,.55)");c.fillStyle=sg;c.fillRect(cx-R,cy-R,R*2,R*2);
  c.restore();
  c.strokeStyle=th.acc+"aa";c.lineWidth=2.5;c.beginPath();c.arc(cx,cy,R,0,TAU);c.stroke();
  // links
  for(i=1;i<wd.n.length;i++){n=wd.n[i];p=nodePos(n);var q=nodePos(wd.n[n.p]),both=n.o&&wd.n[n.p].o;c.strokeStyle=both?my[0]:n.o?"rgba(255,255,255,.55)":"rgba(10,8,40,.45)";c.lineWidth=both?3:1.8;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();}
  // nodes
  var sc=M.sc,ec=enemyCols(),s2,x,y;
  for(i=wd.n.length-1;i>=0;i--){
    n=wd.n[i];p=nodePos(n);s2=[6.5,9.5,12.5,15.5,22][n.ty]*sc;x=p[0];y=p[1];var can=attackable(wd,n),k;
    if(can){var pu=.5+.5*Math.sin(t*4+i);c.strokeStyle="rgba(255,207,58,"+(.5+.5*pu)+")";c.lineWidth=3;c.beginPath();c.arc(x,y,s2+5+pu*4,0,TAU);c.stroke();}
    if(S.threat&&S.threat.w===wd.w&&S.threat.n===i){var tp=.5+.5*Math.sin(t*9);c.strokeStyle="rgba(255,60,90,"+(.6+.4*tp)+")";c.lineWidth=4;c.beginPath();c.arc(x,y,s2+7+tp*7,0,TAU);c.stroke();}
    c.fillStyle=n.o?my[0]:can?ec[0]:"#5a2340";c.strokeStyle=n.o?"#fff":can?"#fff":"rgba(255,255,255,.4)";c.lineWidth=2;c.beginPath();
    if(n.ty===0){c.moveTo(x,y-s2);c.lineTo(x+s2,y);c.lineTo(x,y+s2);c.lineTo(x-s2,y);c.closePath();}
    else if(n.ty===1)c.arc(x,y,s2,0,TAU);
    else if(n.ty===2){c.moveTo(x-s2,y-s2*.8);c.lineTo(x+s2,y-s2*.8);c.lineTo(x+s2,y+s2*.2);c.lineTo(x,y+s2*1.1);c.lineTo(x-s2,y+s2*.2);c.closePath();}
    else if(n.ty===3){for(k=0;k<10;k++){var a=k/10*TAU-Math.PI/2,rr=k%2?s2*.55:s2*1.15;c[k?"lineTo":"moveTo"](x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();}
    else{c.arc(x,y,s2,0,TAU);}
    c.fill();c.stroke();
    if(n.ty===4){c.strokeStyle=n.o?"#fff":"#ffcf3a";c.lineWidth=2;c.beginPath();c.arc(x,y,s2*(.45+.12*Math.sin(t*3)),0,TAU);c.stroke();c.beginPath();c.arc(x,y,s2*.18,0,TAU);c.fillStyle="#fff";c.fill();}
    if(n.ty===1){c.fillStyle=n.o?my[1]:"rgba(0,0,0,.4)";c.fillRect(x-s2*.45,y-s2*.1,s2*.3,s2*.55);c.fillRect(x-s2*.1,y-s2*.5,s2*.3,s2*.95);c.fillRect(x+s2*.25,y-s2*.2,s2*.25,s2*.65);}
    if(mapSel===i){c.strokeStyle="#fff";c.lineWidth=2.5;c.setLineDash([5,4]);c.lineDashOffset=-t*20;c.beginPath();c.arc(x,y,s2+9,0,TAU);c.stroke();c.setLineDash([]);}
    if(S.chest&&S.chest.w===wd.w&&S.chest.n===i){var by=y-s2-13+Math.sin(t*5)*3;c.fillStyle="#c9792a";c.strokeStyle="#5a2f08";c.lineWidth=1.5;c.beginPath();c.roundRect(x-8,by-6,16,12,3);c.fill();c.stroke();c.fillStyle="#ffcf3a";c.fillRect(x-2,by-3,4,5);}
  }
  for(i=wd.n.length-1;i>=0;i--){
    n=wd.n[i];p=nodePos(n);x=p[0];y=p[1];s2=[6.5,9.5,12.5,15.5,22][n.ty]*sc;
    if((n.ty>=2||(n.ty===1&&sc>=.95)||mapSel===i)&&n.ty<4){c.font="800 "+Math.round((n.ty>=2?11:10)*Math.max(.9,sc))+"px Nunito,sans-serif";c.textAlign="center";c.textBaseline="top";c.lineWidth=3;c.strokeStyle="rgba(8,6,30,.75)";c.strokeText(n.nm,x,y+s2+4);c.fillStyle="#fff";c.fillText(n.nm,x,y+s2+4);}
  }
}

/* ---------- army ---------- */
function pgArmy(){
  var hungry=fedOn()&&now()>S.fedU,h="<h2>"+IC.army+" Army</h2>"+seg("army",[["camp","Camp"],["mess","Mess Hall",hungry],["caps","Captives",S.cap>0&&S.capU-now()<40000]]);
  if(sub.army==="camp"){
    var n=armySize(),cap=campCap();
    h+='<div class="pn"><div class="row w"><div class="sp"><h3>Camp '+n+" / "+cap+'</h3><div class="bar"><i style="width:'+clamp(n/cap*100,0,100)+'%"></i></div></div><button class="btn s '+(S.campX>=S.lvl||S.coins<campCost()?"off":"")+'" data-a="expand">Expand +6 · '+IC.coin+fmt(campCost())+'</button></div><p class="sm mut" style="margin:8px 0 0">Army power <b style="color:#fff">'+fmt(armyPower())+"</b>. Recruits cost more as the army grows. "+hk("h11")+"</p></div><div class=\"grid2\">";
    CLS.forEach(function(k){var c=CLASSES[k],own=S.army[k]||0,lv=S.clv[k]||1,lock=S.lvl<c.ul,m=clsMult(k);
      h+='<div class="card '+(lock?"lock":"")+'"><div class="row"><canvas class="ui" width="108" height="108" data-u="'+k+'"></canvas><div class="sp"><h4>'+c.nm+' <span class="tag">'+(lock?"Level "+c.ul:"Lv "+lv)+'</span></h4><div class="sm mut">'+c.d+"</div></div>"+(lock?"":'<b style="font:400 22px var(--disp)">×'+own+"</b>")+"</div>";
      if(lock)h+='<p class="sm" style="color:var(--gold);margin:8px 0 0">'+IC.lock+" Unlocks at level "+c.ul+". "+hk("h3")+"</p>";
      else{h+='<div class="st"><span>HP <b>'+Math.round(c.hp*m)+"</b></span><span>"+(c.heal?"Heal <b>"+Math.round(c.heal*m):"DMG <b>"+Math.round(c.dmg*m))+"</b></span><span>Range <b>"+c.rng+"</b></span><span>Squad <b>"+c.squad+"</b></span></div>";
        var rc=recruitCost(k),full=n>=cap,uc=clsUpCost(k),mx=lv>=classMaxLv();
        h+='<div class="row w"><button class="btn s '+(full||S.coins<rc?"off":"")+'" data-a="recruit" data-v="'+k+'" data-n="1">+1 · '+IC.coin+fmt(rc)+'</button><button class="btn s '+(n+c.squad>cap||S.coins<rc*c.squad?"off":"")+'" data-a="recruit" data-v="'+k+'" data-n="'+c.squad+'">+'+c.squad+" · "+IC.coin+fmt(rc*c.squad)+'</button><button class="btn s b2 '+(mx||S.coins<uc?"off":"")+'" data-a="upClass" data-v="'+k+'">'+(mx?"Max for your level":"Upgrade · "+IC.coin+fmt(uc))+"</button></div>";}
      h+="</div>";});
    h+="</div>";
  }else if(sub.army==="mess"){
    if(!fedOn())return h+'<div class="pn"><h3>'+IC.lock+" Mess Hall</h3><p>Opens at level 2. Until then your soldiers live on field rations. "+hk("h3")+"</p></div>";
    var fed=now()<S.fedU,f=clamp((S.fedU-now())/FED_MS,0,1);
    h+='<div class="pn"><h3>'+(fed?"Fed: "+FOODS[S.fedQ].nm+" ("+FOODS[S.fedQ].m+")":'<span style="color:var(--red)">Hungry: fighting at 80%</span>')+" "+hk("h11")+'</h3><div class="bar '+(fed?"":"r")+'"><i id="fedBar" style="width:'+f*100+'%"></i></div><p class="sm mut">'+(fed?"Next meal due in "+cd(S.fedU):"Feed them before your next fight.")+" A meal lasts 3 minutes. Bigger armies eat more.</p><div class=\"grid3\">";
    FOODS.forEach(function(fd,q){var c=feedCost(q)+(S.capFeed&&S.cap?capFeedCost():0);h+='<div class="card"><h4>'+fd.nm+'</h4><div class="sm mut">'+fd.m+'</div><button class="btn s '+(S.stamps<c?"off":"")+'" style="margin-top:8px;width:100%" data-a="feed" data-v="'+q+'">Serve · '+IC.stamp+c+"</button></div>";});
    h+='</div></div><div class="pn"><h3>'+IC.stamp+" Food Stamps: "+fmt(S.stamps)+" "+hk("m4")+'</h3><p class="sm mut">Bought with coins. Every stamp is a coin you did not spend on upgrades.</p><div class="row w">';
    [20,60,200].forEach(function(nn){h+='<button class="btn s '+(S.coins<nn*STAMP_PRICE?"off":"")+'" data-a="stamps" data-v="'+nn+'">+'+nn+" · "+IC.coin+nn*STAMP_PRICE+"</button>";});
    h+='</div></div><div class="pn"><h3>Feeding autopilot '+(S.lvl<6?'<span class="tag">Level 6</span>':"")+"</h3>";
    if(S.lvl<6)h+='<p class="sm mut">'+IC.lock+" Earn it at level 6. Until then you serve every meal by hand. "+hk("h3")+"</p>";
    else h+='<p class="sm mut">Serves a meal automatically just before the last one runs out.</p><div class="row w"><button class="btn s '+(S.feedAuto.on?"b4":"bx")+'" data-a="faOn">'+(S.feedAuto.on?"Autopilot ON":"Autopilot OFF")+"</button>"+FOODS.map(function(fd,q){return '<button class="btn s '+(S.feedAuto.q===q?"b2":"bx")+'" data-a="faQ" data-v="'+q+'">'+fd.nm+"</button>";}).join("")+'<button class="btn s '+(S.feedAuto.buy?"b2":"bx")+'" data-a="faBuy">Auto-buy stamps: '+(S.feedAuto.buy?"yes":"no")+"</button></div>";
    h+="</div>";
  }else{
    h+='<div class="pn"><h3>'+IC.cap+" Captives: "+S.cap+" / "+capCap()+"</h3>";
    if(!S.cap)h+='<p class="sm mut">Win battles to take captives. They must be fed or they slip away, so decide whether they are worth the food.</p>';
    else{h+='<p class="sm mut">Fed until '+cd(S.capU)+". Fed "+S.capCyc+" time"+(S.capCyc===1?"":"s")+". Each meal raises their ransom, and after 2 meals they will join you as Troopers.</p><div class=\"row w\"><button class=\"btn s\" data-a=\"ransom\">Ransom all · +"+IC.coin+fmt(ransomVal())+'</button><button class="btn s b2 '+(S.capCyc<2||armySize()>=campCap()?"off":"")+'" data-a="capJoin">Recruit as Troopers</button><button class="btn s '+(S.capFeed?"b4":"bx")+'" data-a="capFeed">Feed with army: '+(S.capFeed?"yes":"no")+"</button></div><p class=\"sm mut\" style=\"margin-top:8px\">Feeding them costs "+IC.stamp+capFeedCost()+" extra per meal.</p>";}
    h+="</div>";
  }
  return h;
}

/* ---------- forge ---------- */
function pgForge(){
  var h="<h2>"+IC.forge+" Forge</h2>"+seg("forge",[["gear","Gear"],["fort","Fortress"]]);
  if(sub.forge==="gear"){
    h+='<p class="sub">Gear boosts the whole army. It costs Alloy, which only drips in from cities and bigger. '+hk("m7")+'</p><div class="grid2">';
    Object.keys(GEAR).forEach(function(s){var G2=GEAR[s],g=S.gear[s],nt=g?g.t+1:1,tm=gearTierMax();
      h+='<div class="card"><h4>'+G2.nm+' <span class="tag c">+'+Math.round(gearBonus(s)*(s==="engine"||s==="optic"?50:100))+"% "+G2.stat+"</span></h4>";
      h+='<div class="sm mut" style="margin:4px 0 8px">'+(g?G2.names[g.t-1]+" · Tier "+g.t+" · Level "+g.l:"Nothing equipped")+'</div><div class="row w">';
      if(g){var mx=g.l>=gearMaxLv(),uc=gearUpCost(g);h+='<button class="btn s b2 '+(mx||S.alloy<uc?"off":"")+'" data-a="gearUp" data-v="'+s+'">'+(mx?"Max level for now":"Level up · "+IC.alloy+uc)+"</button>";}
      if(nt<=6){if(nt<=tm)h+='<button class="btn s '+(S.alloy<gearCost(nt)?"off":"")+'" data-a="gearBuy" data-v="'+s+'">Tier '+nt+" "+G2.names[nt-1]+" · "+IC.alloy+gearCost(nt)+"</button>";else h+='<span class="sm" style="color:var(--gold)">'+IC.lock+" Tier "+nt+" at level "+GEAR_LV[nt-1]+" "+hk("h3")+"</span>";}
      h+="</div></div>";});
    h+="</div>";
  }else{
    var fm=S.fort>=2+S.lvl,fc=fortCost(),ec=300*(S.ench+1);
    h+='<div class="pn"><h3>Fortress level '+S.fort+' <span class="tag c">Defense '+fmt(defPower())+"</span> "+hk("h7")+'</h3><p class="sm mut">When a rival attacks and you are busy or offline, your fortress and army fight back on their own. You earn nothing while offline, but you can still lose land, coins and soldiers. Set this before you log off.</p><div class="row w"><button class="btn '+(fm||S.coins<fc?"off":"")+'" data-a="fortUp">'+(fm?"Max for your level":"Upgrade · "+IC.coin+fmt(fc))+"</button></div></div>";
    h+='<div class="pn"><h3>Enchantment '+S.ench+" / 5 "+hk("m3")+'</h3><p class="sm mut">A premium ward that burns attackers near your fortress and adds a big chunk of defense. Gems only.</p><button class="btn b3 '+(S.ench>=5?"off":"")+'" data-a="enchant">'+(S.ench>=5?"Fully enchanted":"Enchant · "+IC.gem+ec)+"</button></div>";
    h+='<div class="pn"><h3>Protection '+hk("m11")+'</h3><div class="row w"><div class="sp"><b>Shield</b><div class="sm mut">'+(now()<S.shieldU?"Active for "+cd(S.shieldU):"No rival can attack for 8 hours, online or off.")+'</div></div><button class="btn s b3" data-a="buy" data-v="shield">'+IC.gem+GP.shield+'</button></div><div class="row w" style="margin-top:10px"><div class="sp"><b>Gear Loss Protection ×'+S.lossProt+'</b><div class="sm mut">Saves a piece of gear the next 3 times a defeat would damage it.</div></div><button class="btn s b3" data-a="buy" data-v="prot">'+IC.gem+GP.prot+"</button></div></div>";
  }
  return h;
}

/* ---------- quests ---------- */
function pgQuests(){
  var h="<h2>"+IC.quest+" Quests</h2>"+seg("quests",[["q","Quests",questsReady()>0],["ach","Badges",achReady()>0],["daily","Daily"],["event","Event",passReady()>0]]);
  if(sub.quests==="q"){
    h+='<p class="sub">Finish one and the next appears. There is always another. '+hk("h9")+" "+hk("h10")+"</p>";
    S.quests.forEach(function(q,i){var done=q.p>=q.n;h+='<div class="pn"><div class="row w"><div class="sp"><h3 style="font-size:16px">'+QT[q.k].t(q.n)+'</h3><div class="bar '+(done?"g":"")+'"><i style="width:'+clamp(q.p/q.n*100,0,100)+'%"></i><span>'+fmt(q.p)+" / "+fmt(q.n)+'</span></div><div class="loot"><span>'+IC.coin+fmt(q.c)+"</span><span>"+IC.xp+q.x+"</span>"+(q.a?"<span>"+IC.alloy+q.a+"</span>":"")+(q.g?"<span>"+IC.gem+q.g+"</span>":"")+'</div></div><button class="btn '+(done?"":"off")+'" data-a="claimQ" data-v="'+i+'">Claim</button></div></div>';});
    var nx=nextUnlocks(4);
    if(nx.length){h+='<div class="pn"><h3>Coming up '+hk("h3")+'</h3><div class="lst">';nx.forEach(function(u){h+='<div class="li">'+IC.lock+" "+esc(u[1])+" <b>Level "+u[0]+"</b></div>";});h+="</div></div>";}
  }else if(sub.quests==="ach"){
    h+='<p class="sub">Your rank badge shows next to your name in chat: <span class="tag g">'+rankOf(S.lvl)+"</span> "+hk("h3b")+'</p><div class="grid2">';
    ACH.forEach(function(a){var st=S.ach[a.id]||0;h+='<div class="card '+(st?"":"lock")+'"><div class="row"><div class="sp"><h4>'+a.nm+'</h4><div class="sm mut">'+a.d+"</div></div>"+(st===1?'<button class="btn s" data-a="claimA" data-v="'+a.id+'">'+IC.coin+a.c+"</button>":st===2?'<span class="tag l">Earned</span>':'<span class="tag">'+IC.coin+a.c+"</span>")+"</div></div>";});
    h+="</div>";
  }else if(sub.quests==="daily"){
    var idx=(Math.max(1,S.streak.d)-1)%7;
    h+='<div class="pn"><h3>Login streak: day '+S.streak.d+" "+hk("h8")+'</h3><p class="sm mut">Come back every day to climb the row. Miss one and you start over at day 1.</p><div class="days">';
    for(var i=0;i<7;i++)h+='<div class="day '+(i<idx?"got":i===idx?"now":"")+'"><b>Day '+(i+1)+"</b>"+rewardTxt(STREAK_R[i])+"</div>";
    h+='</div><div class="row w" style="margin-top:12px"><div class="sp"><b>Streak Freeze ×'+S.streak.freeze+'</b><div class="sm mut">Covers one missed day so the chain survives. '+hk("m11")+'</div></div><button class="btn s b3" data-a="buy" data-v="freeze">'+IC.gem+GP.freeze+"</button></div></div>";
  }else{
    var ev=evNow(),t=passTier();
    h+='<div class="pn" style="border-color:'+ev.col+'"><h3>'+ev.nm+" "+hk("h14")+'</h3><p class="sm mut">Ends in '+cd(now()+evLeft()*1000)+". Win battles to earn event points. Unclaimed rewards vanish with the event.</p><div class=\"bar g\"><i style=\"width:"+clamp(S.ev.pts/PASS_PTS[7]*100,0,100)+'%"></i><span>'+fmt(S.ev.pts)+" pts</span></div>";
    h+='<h3 style="margin-top:12px;font-size:15px">Free track</h3><div class="track">';
    PASS_F.forEach(function(r,i){var got=i<S.ev.cf,can=!got&&i<t;h+='<button class="tk '+(got?"got":can?"can":"")+'" '+(can?'data-a="passF"':"")+"><b>"+PASS_PTS[i]+" pts</b>"+rewardTxt(r)+"<br>"+(got?"Claimed":can?"Tap to claim":"Locked")+"</button>";});
    h+='</div><h3 style="font-size:15px">Premium track '+hk("m13")+'</h3><div class="track">';
    PASS_P.forEach(function(r,i){var got=i<S.ev.cp,can=S.ev.prem&&!got&&i<t;h+='<button class="tk prem '+(got?"got":can?"can":"")+'" '+(can?'data-a="passP"':"")+"><b>"+PASS_PTS[i]+" pts</b>"+(r[0]==="skin"?ev.skin.nm:rewardTxt(r))+"<br>"+(got?"Claimed":!S.ev.prem?(i<t?"Earned, locked":"Locked"):can?"Tap to claim":"Locked")+"</button>";});
    h+="</div>"+(S.ev.prem?'<span class="tag p">Premium unlocked</span>':'<button class="btn b3" data-a="buy" data-v="pass">Unlock premium track · '+IC.gem+GP.pass+"</button>")+"</div>";
  }
  return h;
}

/* ---------- social (simulated) ---------- */
var CHAT_LINES=["anyone else getting raided nonstop today","just hit level {L}, feels good","who wants to team up on a capital?","lost half my camp while I was asleep. never again","got the JACKPOT on the wheel!! only took like 30 spins","how do you beat fortress walls?","bombardiers. always bombardiers","{A} is recruiting, top 3 alliance","only a few days left on the event skin","feed your army before a fight, it matters","gg {P}","is the Advanced General worth the gems?","spent all my alloy and now I regret it","my streak is at 41 days, not breaking it now","tournament soon, get ready","someone took my city while I was mid battle lol","need 12 more xp to level up. one more fight","captives ate all my food stamps","{P} is climbing fast","who else is saving gems for the limited skin"];
var CHAT_REPLY=["lol true","same here","gl out there","nice","try guardians in front, rangers behind","join an alliance, it helps a lot","haha","welcome","gg","what level are you now?"];
function chatPush(nm,t,o){o=o||{};S.chat.push({n:nm,t:t,l:o.l||0,me:o.me?1:0,sys:o.sys?1:0});if(S.chat.length>40)S.chat.shift();if(tab==="social"&&sub.social==="chat"){var c=$("#chatBox");if(c){c.insertAdjacentHTML("beforeend",chatRow(S.chat[S.chat.length-1]));c.scrollTop=c.scrollHeight;}}else if(!o.me)chatNew++;}
function chatRow(m){if(m.sys)return '<div class="m sys">'+esc(m.t)+"</div>";return '<div class="m '+(m.me?"me":"")+'"><span class="bd">'+rankOf(m.l||1)+"</span><b>"+esc(m.n)+":</b> "+esc(m.t)+"</div>";}
function botLine(b){return pick(CHAT_LINES).replace("{P}",S.name).replace("{L}",botLvl(b)).replace("{A}",pick(ALLIES).nm);}
function chatTick(){if(Math.random()<.4){var b=pick(bots());chatPush(b.nm,botLine(b),{l:botLvl(b)});hit("h13");if(tickN%30===0)renderNav();}}
function pgSocial(){
  var h="<h2>"+IC.chat+" Social</h2>"+seg("social",[["chat","Chat"],["ally","Alliance"],["rank","Ranks"],["tour","Tournament"]]);
  if(sub.social==="chat"){
    h+='<div class="pn"><h3>Global chat '+hk("h13")+'</h3><div class="chat" id="chatBox">'+S.chat.map(chatRow).join("")+'</div><div class="chin"><input id="chatIn" maxlength="80" placeholder="Say something" autocomplete="off"><button class="btn" data-a="chat">Send</button></div><p class="demo">Rival commanders are AI. Anything you type stays on this device.</p></div>';
  }else if(sub.social==="ally"){
    if(S.lvl<4)return h+'<div class="pn"><h3>'+IC.lock+" Alliances</h3><p>Unlock at level 4: joint attacks, shared camps and an income bonus. "+hk("h3")+"</p></div>";
    if(S.ally<0){h+='<p class="sub">Join one to call allies into battle and camp together for defense.</p><div class="grid2">';ALLIES.forEach(function(a,i){h+='<div class="card" style="border-color:'+a.col+'"><h4>'+a.nm+'</h4><div class="sm mut">'+(18+i*7)+" members · +5% coins · joint attacks</div><button class=\"btn s\" style=\"margin-top:8px\" data-a=\"allyJoin\" data-v=\""+i+'">Join</button></div>';});h+="</div>";}
    else{var a=ALLIES[S.ally];h+='<div class="pn" style="border-color:'+a.col+'"><h3>'+a.nm+' <span class="tag l">Member</span></h3><div class="lst"><div class="li">'+IC.coin+" Income and loot <b>+5%</b></div><div class=\"li\">"+IC.sword+" Joint attack: pick <b>With ally</b> on any target</div><div class=\"li\">"+IC.shield+" Camp together "+(now()<S.campU?"<b>active "+cd(S.campU)+"</b>":"<b>+30% defense for 10 min</b>")+'</div></div><div class="row w"><button class="btn s b2 '+(S.campCd>0?"off":"")+'" data-a="campTog">'+(S.campCd>0?"Camp ready in "+dur(S.campCd):"Camp together")+'</button><button class="btn s bx" data-a="allyLeave">Leave</button></div><p class="sm mut" style="margin-top:8px">Your allies would notice if you stopped showing up. '+hk("h13")+"</p></div>";}
  }else if(sub.social==="rank"){
    var rows=bots().map(function(b){return{nm:b.nm,s:botScore(b),l:botLvl(b),i:b.i};});rows.push({nm:S.name,s:S.xpTot,l:S.lvl,me:1});rows.sort(function(x,y){return y.s-x.s;});
    var mi=0;rows.forEach(function(r,i){if(r.me)mi=i;});
    h+='<p class="sub">Ranked by total XP. You are <b style="color:var(--gold)">#'+(mi+1)+"</b> of "+rows.length+". "+hk("h13b")+'</p><div class="lb">';
    rows.forEach(function(r,i){if(i<8||Math.abs(i-mi)<=2)h+='<div class="r '+(r.me?"me":"")+'"><i>#'+(i+1)+'</i><canvas class="fl" width="44" height="44" data-flag="'+(r.me?"me":r.i)+'"></canvas><span>'+esc(r.nm)+' <span class="tag">'+rankOf(r.l)+"</span></span><b>"+fmt(r.s)+"</b></div>";else if(i===8&&mi>10)h+='<div class="r"><i>…</i></div>';});
    h+="</div>";
  }else{
    var on=tourOn(),tb=tourBoard(tourId(),false);
    h+='<div class="pn"><h3>Blitz Tournament '+(on?'<span class="tag r">LIVE</span>':'<span class="tag">Break</span>')+" "+hk("h13b")+'</h3><p class="sm mut">'+(on?"Ends in "+cd(now()+tourLeft()*1000)+". Every win scores points. Top 3 take alloy.":"Next round starts in "+cd(now()+tourLeft()*1000)+".")+'</p><div class="lb">';
    tb.slice(0,10).forEach(function(r,i){h+='<div class="r '+(r.me?"me":"")+'"><i>#'+(i+1)+"</i><span>"+esc(r.nm)+"</span><b>"+fmt(r.p)+"</b></div>";});
    h+="</div></div>";
  }
  return h;
}

/* ---------- store ---------- */
var wheelRot=0,wheelBusy=false;
function pgStore(){
  var h="<h2>"+IC.store+" Store</h2>"+seg("store",[["boost","Boosts"],["wheel","Wheel",S.spinDay!==dayStr()],["skins","Skins"]]);
  if(sub.store==="boost"){
    h+='<div class="pn" style="border-color:var(--pink)"><h3>'+IC.gem+" "+fmt(S.gems)+" gems "+hk("m3")+'</h3><p class="sm mut" style="margin:0">Gems are never sold. You earn them: every level-up, first captures, day 3 and day 7 of a streak, tournament podiums, event tiers and every fifth quest.</p></div>';
    var items=[["xp","XP Surge","Instantly gain 30% of a level.",GP.xp,"m9"],["skip","Level Skip","Jump straight to the next level.",GP.skip,"m9"],["pups","Power-up Crate","2 Airstrikes, Med Wave, Rage and Aegis.",GP.pups,"m9"],["general","Advanced General · 24h","A smarter autopilot that also attacks while you are offline."+(now()<S.genU?" Active.":""),GP.general,"m10"],["shield","Shield · 8h","Nobody can attack you, online or off.",GP.shield,"m11"],["prot","Gear Loss Protection ×3","Defeats cannot damage your gear.",GP.prot,"m11"]];
    h+='<div class="grid2">';
    if(S.offers.starter)h+='<div class="card" style="border-color:var(--gold)"><div class="row"><div class="sp"><h4>Starter Pack <span class="tag r">ONE TIME</span> '+hk("m2")+'</h4><div class="sm mut">400 coins, 60 food stamps, 2 Airstrikes and an Aegis.</div></div><button class="btn s" data-a="starter">'+IC.gem+GP.starter+"</button></div></div>";
    items.forEach(function(it){h+='<div class="card"><div class="row"><div class="sp"><h4>'+it[1]+" "+hk(it[4])+'</h4><div class="sm mut">'+it[2]+'</div></div><button class="btn s b3" data-a="buy" data-v="'+it[0]+'">'+IC.gem+it[3]+"</button></div></div>";});
    h+="</div>";
  }else if(sub.store==="wheel"){
    var free=S.spinDay!==dayStr(),tot=0;WHEEL.forEach(function(w){tot+=w.w;});
    h+='<div class="pn" style="text-align:center"><h3 style="justify-content:center">Wheel of Fortune '+hk("h16")+'</h3><canvas id="wheelC" width="600" height="600"></canvas><div id="wheelMsg" style="min-height:24px;font:400 18px var(--disp)"></div><div class="acts"><button class="btn '+(free?"b4":"b3")+' big" data-a="spin">'+(free?"Free daily spin":"Spin · "+IC.gem+GP.spin)+'</button></div><p class="sm mut" style="margin:10px 0 4px">Odds, exactly as the wheel rolls them:</p><div class="loot" style="justify-content:center">'+WHEEL.map(function(w){return "<span>"+w.nm+" <b>"+(w.w/tot*100).toFixed(0)+"%</b></span>";}).join("")+"</div></div>";
  }else{
    var ev=evNow(),sk=ev.skin,own=S.skins.indexOf(sk.id)>=0;
    h+='<p class="sub">Skins recolor your whole army. '+hk("h12")+'</p><div class="grid2">';
    h+='<div class="card" style="border-color:'+ev.col+'"><div class="row"><span class="fl" style="width:40px;height:40px;background:linear-gradient(135deg,'+sk.c1+","+sk.c2+')"></span><div class="sp"><h4>'+sk.nm+' <span class="tag r">LIMITED</span></h4><div class="sm mut">Leaves the store in '+cd(now()+evLeft()*1000)+". "+hk("m12")+"</div></div>"+(own?skinBtn(sk.id):'<button class="btn s b3" data-a="skinBuy" data-v="'+sk.id+'">'+IC.gem+GP.evskin+"</button>")+"</div></div>";
    Object.keys(SKINS).forEach(function(id){var s=SKINS[id],o=S.skins.indexOf(id)>=0,f=FACTIONS[S.faction],c1=s.c1||f.c1,c2=s.c2||f.c2,btn;
      if(o)btn=skinBtn(id);else if(s.coins)btn='<button class="btn s '+(S.coins<s.coins?"off":"")+'" data-a="skinBuy" data-v="'+id+'">'+IC.coin+s.coins+"</button>";else if(s.gems)btn='<button class="btn s b3" data-a="skinBuy" data-v="'+id+'">'+IC.gem+s.gems+"</button>";else btn='<button class="btn s '+(S.lvl<s.lvl?"off":"")+'" data-a="skinBuy" data-v="'+id+'">'+(S.lvl<s.lvl?"Level "+s.lvl:"Claim")+"</button>";
      h+='<div class="card"><div class="row"><span class="fl" style="width:40px;height:40px;background:linear-gradient(135deg,'+c1+","+c2+')"></span><div class="sp"><h4>'+s.nm+'</h4><div class="sm mut">'+s.how+"</div></div>"+btn+"</div></div>";});
    S.skins.forEach(function(id){if(!SKINS[id]&&id!==sk.id)h+='<div class="card"><div class="row"><div class="sp"><h4>'+skinName(id)+' <span class="tag">Past event</span></h4></div>'+skinBtn(id)+"</div></div>";});
    h+="</div>";
  }
  return h;
}
function skinBtn(id){return S.skin===id?'<span class="tag l">Wearing</span>':'<button class="btn s b2" data-a="skinUse" data-v="'+id+'">Wear</button>';}
function drawWheel(rot){
  var cv=$("#wheelC");if(!cv)return;var c=cv.getContext("2d"),w=cv.width,m=w/2,R=m-26,sa=TAU/WHEEL.length,i;
  c.clearRect(0,0,w,w);c.save();c.translate(m,m);c.rotate(rot);
  for(i=0;i<WHEEL.length;i++){var s=WHEEL[i];c.fillStyle=s.col;c.beginPath();c.moveTo(0,0);c.arc(0,0,R,i*sa,(i+1)*sa);c.closePath();c.fill();c.strokeStyle="#0b0930";c.lineWidth=4;c.stroke();
    c.save();c.rotate(i*sa+sa/2);c.textAlign="right";c.textBaseline="middle";c.fillStyle=s.jack?"#3a2300":"#fff";c.font=(s.jack?"400 40px":"400 28px")+" 'Lilita One',sans-serif";c.fillText(s.nm,R-18,0);c.restore();}
  c.restore();
  c.strokeStyle="#ffcf3a";c.lineWidth=12;c.beginPath();c.arc(m,m,R+6,0,TAU);c.stroke();
  for(i=0;i<16;i++){var a=i/16*TAU;c.fillStyle=i%2?"#fff":"#ff4fa3";c.beginPath();c.arc(m+Math.cos(a)*(R+6),m+Math.sin(a)*(R+6),5,0,TAU);c.fill();}
  c.fillStyle="#0b0930";c.beginPath();c.arc(m,m,34,0,TAU);c.fill();c.fillStyle="#ffcf3a";c.beginPath();c.arc(m,m,22,0,TAU);c.fill();
  c.fillStyle="#fff";c.strokeStyle="#0b0930";c.lineWidth=5;c.beginPath();c.moveTo(m-22,4);c.lineTo(m+22,4);c.lineTo(m,58);c.closePath();c.fill();c.stroke();
}
function spinWheel(){
  if(wheelBusy)return;var free=S.spinDay!==dayStr();
  if(free)S.spinDay=dayStr();else if(!spendGems(GP.spin,"a spin"))return;
  wheelBusy=true;var sb=$("[data-a=spin]");if(sb)sb.innerHTML="Spin · "+IC.gem+GP.spin;S.stats.spins++;qprog("spin",1);renderHud();
  var roll=wheelRoll(),sa=TAU/WHEEL.length,target=(roll.seg+roll.off)*sa,from=wheelRot%TAU,to=-Math.PI/2-target;while(to<from+TAU*5)to+=TAU;
  var t0=performance.now(),D=4600,lastSeg=-1,msg=$("#wheelMsg");if(msg)msg.textContent="";
  (function step(ts){var k=clamp((ts-t0)/D,0,1),e=1-Math.pow(1-k,3.4);wheelRot=from+(to-from)*e;drawWheel(wheelRot);
    var sg=Math.floor((((-Math.PI/2-wheelRot)%TAU)+TAU)%TAU/sa);if(sg!==lastSeg){lastSeg=sg;snd("tick");}
    if(k<1){requestAnimationFrame(step);return;}
    wheelBusy=false;var got=wheelGrant(roll.seg),m2=$("#wheelMsg");
    if(WHEEL[roll.seg].jack){snd("jack");if(m2)m2.innerHTML='<span style="color:var(--gold)">JACKPOT! '+got+"</span>";}
    else{snd("coin");hit("h16");if(m2)m2.innerHTML="You won "+got;}
    renderHud();dirty();
  })(t0);
}

/* ---------- modals: profile, menu, report, alerts, intro ---------- */
function showProfile(){
  var h="<h2>Commander "+hk("h12")+'</h2><input class="txtin" id="nameIn" maxlength="16" value="'+esc(S.name)+'"><p class="sm mut ctr">'+rankOf(S.lvl)+" · Level "+S.lvl+" · "+S.stats.wins+" wins · "+ownedCount()+' territories</p><h3 style="font-size:15px;margin-top:8px">Faction</h3><div class="fpick">';
  Object.keys(FACTIONS).forEach(function(k){var f=FACTIONS[k];h+='<button data-a="fac" data-v="'+k+'" class="'+(S.faction===k?"on":"")+'"><span class="fl" style="display:block;width:40px;height:40px;margin:0 auto 4px;background:linear-gradient(135deg,'+f.c1+","+f.c2+')"></span><b>'+f.nm+"</b>"+f.perk+"</button>";});
  h+='</div><h3 style="font-size:15px">Flag emblem</h3><div class="sw">';
  for(var i=0;i<8;i++)h+='<button data-a="em" data-v="'+i+'" class="'+(S.flag.em===i?"on":"")+'" style="width:42px;height:42px;padding:0;overflow:hidden"><canvas width="72" height="72" data-em="'+i+'" style="width:100%;height:100%;display:block"></canvas></button>';
  h+='</div><h3 style="font-size:15px;margin-top:8px">Flag colors</h3><div class="sw">';
  BOTC.forEach(function(c){h+='<button data-a="fc1" data-v="'+c+'" class="'+(S.flag.c1===c?"on":"")+'" style="background:'+c+'"></button>';});
  h+='</div><div class="sw" style="margin-top:6px">';
  ["#1a1757","#0b0930","#3a0d1c","#0d3a1c","#3a2300","#ffffff","#22104d","#04303a"].forEach(function(c){h+='<button data-a="fc2" data-v="'+c+'" class="'+(S.flag.c2===c?"on":"")+'" style="background:'+c+';box-shadow:inset 0 0 0 1px #fff4"></button>';});
  h+='</div><div class="acts"><button class="btn" data-a="saveName">Save</button><button class="btn b2" data-a="tabSkins">Army skins</button></div>';
  var m=openModal(h);$$("canvas[data-em]",m).forEach(function(cv){drawFlag(cv.getContext("2d"),72,+cv.dataset.em,S.flag.c1,S.flag.c2);});
}
function showMenu(){
  openModal("<h2>Menu</h2><div class=\"lst\">"+'<button class="li" data-a="report">'+IC.eye+" Hook Report <b>How this game keeps you playing</b></button>"+'<button class="li" data-a="lens">'+IC.eye+" Hook Lens <b>"+(S.lens?"ON":"OFF")+"</b></button>"+'<button class="li" data-a="mute">'+IC.bell+" Sound <b>"+(S.mute?"OFF":"ON")+"</b></button>"+'<button class="li" data-a="alertCfg">'+IC.bell+" Alert settings <b>›</b></button>"+'<button class="li" data-a="howto">'+IC.quest+" How to play <b>›</b></button>"+'<button class="li" data-a="arcade">'+IC.globe+" Back to Lazer Arcade <b>›</b></button>"+'<button class="li bad" data-a="reset">Reset all progress <b>›</b></button></div><p class="demo">Dominion: Infinite Frontiers · a Lazer Yudel game · v1.0<br>Nothing in this game is sold. The Hook Lens labels the engagement design behind each screen.</p>');
}
function showHowto(){
  openModal("<h2>How to play</h2><div class=\"lst\">"+["Tap a glowing outpost on the rim of the planet and attack it.","In battle, tap a squad card, then tap inside your zone to deploy. Command points refill over time.","Charge, Hold or Retreat with the buttons. Retreating saves whoever makes it out.","Take both outposts to expose a city, both cities to expose the fortress, and so on to the Core.","Coins recruit and upgrade. Food Stamps keep the army fed. Alloy buys gear. Gems are rare and earned from milestones, never sold.","Rivals attack what you own. Defend in person or let your Fortress handle it.","Curious how the game keeps you playing? Switch on the Hook Lens in the menu."].map(function(t,i){return '<div class="li"><b style="margin:0 6px 0 0">'+(i+1)+"</b> "+t+"</div>";}).join("")+'</div><div class="acts"><button class="btn" data-a="close">Got it</button></div>',{cls:"wide"});
}
function showAlerts(){
  var h="<h2>Alerts "+hk("h17")+'</h2><div class="lst">';
  if(!S.alerts.length)h+='<div class="li">Nothing yet.</div>';
  S.alerts.slice(0,18).forEach(function(a){h+='<div class="li '+(a.k==="attack"?"bad":"")+'" style="font-size:13px">'+esc(a.t)+' <b class="mut" style="font-weight:700;white-space:nowrap">'+dur((now()-a.at)/1000)+" ago</b></div>";});
  h+='</div><div class="acts"><button class="btn bx" data-a="alertCfg">Settings</button><button class="btn" data-a="close">Close</button></div>';
  S.alerts.forEach(function(a){a.u=0;});openModal(h);renderHud();
}
function showAlertCfg(){
  var nm={attack:"Attacks on your land",land:"Territory changes",event:"Events and rankings",streak:"Streak timers",quest:"Quest drops"},h="<h2>Alert settings</h2><p class=\"ctr sm mut\">Choose which alerts pop up on screen. They all still land in the bell.</p><div class=\"lst\">";
  Object.keys(nm).forEach(function(k){h+='<button class="li" data-a="acfg" data-v="'+k+'">'+nm[k]+" <b>"+(S.alertCfg[k]!==false?"ON":"OFF")+"</b></button>";});
  openModal(h+'</div><div class="acts"><button class="btn" data-a="close">Done</button></div>');
}
function showReport(){
  S.stats.report++;checkAch();
  var st=S.stats,h="<h2>Hook Report</h2><p class=\"ctr sm mut\">The engagement design behind the game, and how often each piece has fired for you.</p><div class=\"grid3\" style=\"margin:10px 0\">";
  [["Time played",dur(st.time)],["Gems earned",fmt(st.gemsEarned)],["Gems spent",fmt(st.gemsSpent)],["Pop-up offers shown",st.popups],["Pop-up offers bought",st.popupBuys],["Wheel spins",st.spins],["Alerts sent to you",st.alerts],["Surprise attacks and ambushes",st.spikes],["Territories lost",st.nodesLost],["Soldiers lost",st.lost],["Hints shown",st.hints],["Quests finished",st.quests],["Login streak",S.streak.d+" days"]].forEach(function(r){h+='<div class="card" style="text-align:center"><div style="font:400 22px var(--disp);color:var(--gold)">'+r[1]+'</div><div class="sm mut">'+r[0]+"</div></div>";});
  h+='</div><div class="hkc" style="display:block">Dominion grew out of a concept deck about how games hold attention. Every technique below is running in this game. The difference from a paid game is that <b>nothing here is sold</b>: the '+fmt(st.gemsSpent)+" gems you have spent were all earned by playing.</div><div class=\"rep\">";
  HOOK_ORDER.forEach(function(id){var k=HOOKS[id];h+='<div class="r"><span class="n">'+k.n+"</span><div><b>"+k.t+"</b><p>"+k.d+'</p></div><span class="ct">'+(S.hooks[id]||0)+"×</span></div>";});
  h+='</div><div class="acts"><button class="btn" data-a="close">Close</button></div>';
  openModal(h,{cls:"wide"});
}
function showIntro(){
  var def=(window.LZ&&LZ.username)||"";
  var h='<div class="ban" style="font-size:34px">DOMINION</div><p class="ctr" style="font:400 17px var(--disp);color:var(--cy);margin-top:-6px">INFINITE FRONTIERS</p><p class="ctr sm">Raise an army. Take outposts, cities and capitals, world after world. Hold what you own while rivals come for it.</p><input class="txtin" id="nameIn" maxlength="16" placeholder="Commander name" value="'+esc(def.slice(0,16))+'"><h3 style="font-size:15px;margin-top:10px">Choose a faction</h3><div class="fpick">';
  Object.keys(FACTIONS).forEach(function(k,i){var f=FACTIONS[k];h+='<button data-a="facI" data-v="'+k+'" class="'+(i===0?"on":"")+'"><span class="fl" style="display:block;width:40px;height:40px;margin:0 auto 4px;background:linear-gradient(135deg,'+f.c1+","+f.c2+')"></span><b>'+f.nm+"</b>"+f.perk+"</button>";});
  h+='</div><div class="acts"><button class="btn big" data-a="begin">Begin conquest</button></div>';
  openModal(h,{noX:true,cls:"ray"});
}
