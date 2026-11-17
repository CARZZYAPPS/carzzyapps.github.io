/* ================= actions ================= */
var introFac="solari";
function cleanName(v){v=String(v||"").replace(/[<>&"'\/\\]/g,"").replace(/\s+/g," ").trim().slice(0,16);return v||"Commander";}
function showHook(id){
  var hh=HOOKS[id];if(!hh)return;var p=$("#hookpop");
  p.innerHTML='<div class="mb"><p class="ctr"><span class="tag p">HOOK '+hh.n+"</span></p><h2>"+hh.t+'</h2><div class="hkc" style="display:block">'+hh.d+'</div><p class="ctr sm mut">Fired <b style="color:var(--gold)">'+(S.hooks[id]||0)+'</b> times for you so far.</p><div class="acts"><button class="btn" data-a="hookX">Got it</button></div></div>';
  p.hidden=false;if(B)B.paused=true;
}
function rr(){renderHud();renderTab();dirty();}
function claimStarter(){if(!S.offers.starter)return;if(!spendGems(GP.starter,"the Starter Pack"))return;S.offers.starter=false;S.coins+=400;S.stamps+=60;S.pu.strike+=2;S.pu.shield++;hit("m2");snd("jack");toast(IC.gem+" Starter Pack claimed.","gold");}
var ACT={
  tab:function(v){closeModal(true);postBattle=null;tab=v;mapSel=-1;if(v==="social")chatNew=0;renderAll();$("#view").scrollTop=0;},
  sub:function(v){sub[tab]=v;renderTab();},
  close:function(){closeModal();},
  cont:function(){flowNext();},
  hook:function(v){showHook(v);},
  hookX:function(){$("#hookpop").hidden=true;if(B&&modalFree()){B.paused=false;B.last=performance.now();}},
  lens:function(){S.lens=!S.lens;if(S.lens){S.stats.lensOpens++;toast(IC.eye+" Hook Lens on. Tap any purple tag.","gold");}document.body.classList.toggle("lens",S.lens);checkAch();dirty();if(!modalFree())showMenu();},
  menu:function(){showMenu();},alerts:function(){showAlerts();},alertCfg:function(){showAlertCfg();},
  acfg:function(v){S.alertCfg[v]=S.alertCfg[v]===false;showAlertCfg();dirty();},
  profile:function(){showProfile();},report:function(){$("#hookpop").hidden=true;showReport();},howto:function(){showHowto();},
  mute:function(){S.mute=!S.mute;showMenu();dirty();},
  arcade:function(){save();if(window.LZ)try{LZ.flush();}catch(e){}location.href="/arcade/";},
  reset:function(){openModal('<h2>Reset everything?</h2><p class="ctr">Your army, worlds, gems and streak will be wiped. Lazer Points you already earned stay on your account.</p><div class="acts"><button class="btn red" data-a="resetYes">Wipe it</button><button class="btn bx" data-a="close">Keep playing</button></div>');},
  resetYes:function(){var g=(S.gen||0)+1,mute=S.mute;S=fresh();S.gen=g;S.mute=mute;_bots=null;save();if(window.LZ)try{LZ.flush();}catch(e){}location.reload();},
  collect:function(){var v=Math.floor(S.vault);if(v<1){toast("The vault is empty. Capture territory to fill it.");return;}S.coins+=v;S.vault-=v;S.stats.collected+=v;qprog("collect",v);snd("coin");toast(IC.coin+" +"+fmt(v)+" collected","gold");renderWorld();renderHud();dirty();},
  raid:function(){startRaid(false);},
  attack:function(v){attackNode(+v,false,false);},
  attackAuto:function(v){attackNode(+v,true,false);},
  attackAlly:function(v){if(S.allyCd>0)return;attackNode(+v,false,true);},
  unsel:function(){mapSel=-1;renderWorld();},
  chest:function(){if(S.chest){openChest();renderWorld();renderHud();}},
  defend:function(){defendNow();},
  autodef:function(){var r=resolveThreat();renderAll();if(r&&!r.win)showDefLoss(r);},
  planet:function(v){S.cur=clamp(S.cur+(+v),0,S.worlds.length-1);mapSel=-1;renderWorld();dirty();},
  goEvent:function(){tab="quests";sub.quests="event";renderAll();},
  goTour:function(){tab="social";sub.social="tour";renderAll();},
  recruit:function(v,el){var n=+el.dataset.n||1,done=0;for(var i=0;i<n;i++){var c=recruitCost(v);if(armySize()>=campCap()||S.coins<c)break;S.coins-=c;S.army[v]=(S.army[v]||0)+1;done++;}if(!done)return;if(!S.clv[v])S.clv[v]=1;S.stats.recruits+=done;qprog("recruit",done);hit("h11");snd("deploy");rr();},
  upClass:function(v){var c=clsUpCost(v);if(S.coins<c||(S.clv[v]||1)>=classMaxLv())return;S.coins-=c;S.clv[v]=(S.clv[v]||1)+1;S.stats.upgrades++;qprog("upgrade",1);hit("h11");snd("lvl");rr();},
  expand:function(){var c=campCost();if(S.coins<c||S.campX>=S.lvl)return;S.coins-=c;S.campX++;snd("coin");rr();},
  feed:function(v){if(feed(+v,false)){snd("coin");toast(IC.stamp+" The army is fed: "+FOODS[+v].nm,"good");}else{toast("Not enough food stamps. Buy more below.","bad");snd("bad");}rr();renderNav();},
  stamps:function(v){var n=+v,c=n*STAMP_PRICE;if(S.coins<c)return;S.coins-=c;S.stamps+=n;hit("m4");snd("coin");rr();},
  faOn:function(){S.feedAuto.on=!S.feedAuto.on;rr();},faQ:function(v){S.feedAuto.q=+v;rr();},faBuy:function(){S.feedAuto.buy=!S.feedAuto.buy;rr();},
  capFeed:function(){S.capFeed=!S.capFeed;rr();},
  ransom:function(){if(!S.cap)return;var c=ransomVal();S.coins+=c;S.cap=0;S.capCyc=0;snd("coin");toast(IC.coin+" Ransom paid: +"+fmt(c),"gold");rr();},
  capJoin:function(){var n=Math.min(S.cap,campCap()-armySize());if(n<1||S.capCyc<2)return;S.army.trooper=(S.army.trooper||0)+n;S.cap-=n;if(!S.cap)S.capCyc=0;snd("deploy");toast(IC.army+" "+n+" captives joined as Troopers","good");rr();},
  gearBuy:function(v){var g=S.gear[v],nt=g?g.t+1:1,c=gearCost(nt);if(nt>gearTierMax()||S.alloy<c)return;S.alloy-=c;S.gear[v]={t:nt,l:1};S.stats.upgrades++;qprog("upgrade",1);hit("m7");snd("lvl");rr();},
  gearUp:function(v){var g=S.gear[v];if(!g)return;var c=gearUpCost(g);if(g.l>=gearMaxLv()||S.alloy<c)return;S.alloy-=c;g.l++;S.stats.upgrades++;qprog("upgrade",1);hit("m7");snd("lvl");rr();},
  fortUp:function(){var c=fortCost();if(S.coins<c||S.fort>=2+S.lvl)return;S.coins-=c;S.fort++;S.stats.upgrades++;qprog("upgrade",1);snd("lvl");rr();},
  enchant:function(){if(S.ench>=5)return;if(!spendGems(80*(S.ench+1),"an enchantment"))return;S.ench++;hit("m3");snd("jack");rr();},
  starter:function(){claimStarter();rr();},
  buy:function(v){
    var nm={shield:"a Shield",prot:"Loss Protection",xp:"an XP Surge",skip:"a Level Skip",pups:"a Power-up Crate",general:"the Advanced General",freeze:"a Streak Freeze",pass:"the premium track"}[v];
    if(v==="pass"&&S.ev.prem)return;
    if(!spendGems(GP[v],nm))return;
    if(v==="shield"){S.shieldU=Math.max(now(),S.shieldU)+8*3600e3;S.threat=null;hit("m11");}
    else if(v==="prot"){S.lossProt+=3;hit("m11");}
    else if(v==="xp"){addXP(Math.round(xpNeed(S.lvl)*.3));hit("m9");}
    else if(v==="skip"){addXP(xpNeed(S.lvl)-S.xp);hit("m9");}
    else if(v==="pups"){S.pu.strike+=2;S.pu.heal++;S.pu.rage++;S.pu.shield++;hit("m9");}
    else if(v==="general"){S.genU=Math.max(now(),S.genU)+24*3600e3;hit("m10");}
    else if(v==="freeze"){S.streak.freeze++;hit("m11");}
    else if(v==="pass"){S.ev.prem=true;hit("m13");}
    snd("jack");toast(IC.gem+" Purchased: "+nm.replace(/^(a|an|the) /,""),"gold");
    if(pendingLv.length)flowNext();else renderAll();
  },
  claimQ:function(v){claimQuest(+v);if(pendingLv.length)flowNext();else{rr();renderNav();}},
  claimA:function(v){if(S.ach[v]!==1)return;var a=ACH.filter(function(x){return x.id===v;})[0];S.ach[v]=2;S.coins+=a.c;snd("coin");rr();renderNav();},
  passF:function(){if(S.ev.cf>=passTier())return;var g=grant(PASS_F[S.ev.cf]);S.ev.cf++;snd("coin");toast("Event reward: "+g,"gold");rr();renderNav();},
  passP:function(){if(!S.ev.prem||S.ev.cp>=passTier())return;var g=grant(PASS_P[S.ev.cp]);S.ev.cp++;snd("coin");toast("Premium reward: "+g,"gold");rr();renderNav();},
  chat:function(){var i=$("#chatIn");if(!i)return;var t=i.value.replace(/\s+/g," ").trim().slice(0,80);if(!t)return;i.value="";chatPush(S.name,t,{me:1,l:S.lvl});hit("h13");if(Math.random()<.7)setTimeout(function(){var b=pick(bots());chatPush(b.nm,pick(CHAT_REPLY),{l:botLvl(b)});},1400+Math.random()*2200);},
  allyJoin:function(v){S.ally=+v;chatPush("",ALLIES[S.ally].nm+" welcomes "+S.name+".",{sys:1});hit("h13");rr();},
  allyLeave:function(){S.ally=-1;rr();},
  campTog:function(){if(S.campCd>0||S.ally<0)return;S.campU=now()+600e3;S.campCd=1200;toast(IC.shield+" Allies are camped with you: +30% defense for 10 minutes","good");rr();},
  spin:function(){spinWheel();},
  skinBuy:function(v){
    if(S.skins.indexOf(v)>=0)return;var s=SKINS[v],ev=evNow().skin;
    if(s){if(s.coins){if(S.coins<s.coins)return;S.coins-=s.coins;}else if(s.gems){if(!spendGems(s.gems,s.nm))return;}else if(S.lvl<s.lvl)return;}
    else if(ev.id===v){if(!spendGems(GP.evskin,ev.nm))return;hit("m12");}else return;
    S.skins.push(v);S.skin=v;hit("h12");snd("jack");rr();
  },
  skinUse:function(v){if(S.skins.indexOf(v)<0)return;S.skin=v;hit("h12");rr();},
  fac:function(v){S.name=cleanName(($("#nameIn")||{}).value||S.name);S.faction=v;hit("h12");dirty();showProfile();renderHud();},
  em:function(v){S.name=cleanName(($("#nameIn")||{}).value||S.name);S.flag.em=+v;hit("h12");dirty();showProfile();renderHud();},
  fc1:function(v){S.name=cleanName(($("#nameIn")||{}).value||S.name);S.flag.c1=v;hit("h12");dirty();showProfile();renderHud();},
  fc2:function(v){S.name=cleanName(($("#nameIn")||{}).value||S.name);S.flag.c2=v;hit("h12");dirty();showProfile();renderHud();},
  saveName:function(){S.name=cleanName($("#nameIn").value);hit("h12");closeModal(true);renderAll();dirty();},
  tabSkins:function(){S.name=cleanName(($("#nameIn")||{}).value||S.name);closeModal(true);tab="store";sub.store="skins";renderAll();},
  facI:function(v,el){introFac=v;$$(".fpick button").forEach(function(b){b.classList.toggle("on",b===el);});},
  begin:function(){
    S.name=cleanName($("#nameIn").value);S.faction=introFac;S.flag.c1=FACTIONS[introFac].c1;S.lastDay=dayStr();streakSync();hit("h12");
    closeModal(true);renderAll();save();flowNext();
  },
  revive:function(v,el){var c=reviveCost();if(!armySize(S.lastDead||{}))return;if(!spendGems(c,"a revive"))return;var n=doRevive();hit("m11");snd("jack");toast(IC.army+" "+n+" soldiers revived","good");el.remove();renderHud();},
  offerBuy:function(){offerBuy();}
};

/* ================= wiring ================= */
function wire(){
  document.addEventListener("click",function(e){
    var b=e.target.closest("[data-b]");if(b){battleBtn(b);return;}
    var a=e.target.closest("[data-a]");if(!a||a.classList.contains("off")||a.disabled)return;
    var f=ACT[a.dataset.a];if(f){if(a.dataset.a!=="hook")snd("tap");f(a.dataset.v,a);}
  });
  $("#bf").addEventListener("pointerdown",function(e){e.preventDefault();battleTap(e);});
  $("#bauto").addEventListener("click",function(){if(!B||B.over)return;B.auto=!B.auto;if(B.auto){B.sel=null;S.stats.autoBattles++;}snd("tap");updateBattleHud();});
  $("#bspd").addEventListener("click",function(){if(!B||B.over)return;B.spd=B.spd===1?2:1;snd("tap");updateBattleHud();});
  window.addEventListener("resize",function(){if(B)bResize();});
  document.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target&&e.target.id==="chatIn")ACT.chat();});
  document.addEventListener("visibilitychange",function(){if(document.hidden)save();});
  window.addEventListener("pagehide",save);
}
function battleTip(){
  var e=$("#btip");if(!e||!B)return;var t="";
  if(S.stats.wins<2&&!B.auto&&!B.over){
    if(B.cfg.mode==="def")t=B.depN?"":"Enemies are marching on your fortress. Tap a squad, then tap near the fortress to deploy.";
    else if(!B.depN)t="Tap anywhere in the bright zone to drop a Trooper squad.";
    else if(B.t<16)t="Keep deploying as Command refills. Destroy the enemy HQ before the clock runs out.";
  }
  if(e.textContent!==t)e.textContent=t;
}
function boot(){
  S=load();document.body.classList.toggle("lens",!!S.lens);wire();
  lzBoot().then(function(){
    S=load();document.body.classList.toggle("lens",!!S.lens);
    if(!S.worlds.length)S.worlds.push(genWorld(0));
    S.quests=S.quests.filter(function(q){return q&&QT[q.k];});while(S.quests.length<3)S.quests.push(newQuest());
    S.cur=clamp(S.cur,0,S.worlds.length-1);evSync();if(S.tour.id<0)S.tour={id:tourId(),pts:0};tourSync();
    if(!S.chat.length){chatPush("","Channel open. Rival commanders are online.",{sys:1});for(var i=0;i<4;i++){var b=bots()[i+3];chatPush(b.nm,botLine(b),{l:botLvl(b)});}chatNew=0;}
    if(!S.name){showIntro();}
    else{
      var off=offlineSim();if(dayStr()!==S.lastDay){S.lastDay=dayStr();streakSync();}
      renderAll();if(off)showAway(off);else flowNext();
    }
    save();setInterval(tick,1000);requestAnimationFrame(mapLoop);
  });
}
window.__dom={get S(){return S;},get B(){return B;},ACT:ACT,startBattle:startBattle,attackNode:attackNode,deploy:deploy,tick:tick,save:save};
boot();
