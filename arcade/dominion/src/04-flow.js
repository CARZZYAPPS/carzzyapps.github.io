/* ================= modal plumbing ================= */
var modalTimer=0,modalOnClose=null;
function modalFree(){return $("#modal").hidden;}
function openModal(html,o){
  o=o||{};clearInterval(modalTimer);modalTimer=0;var m=$("#modal");
  m.innerHTML='<div class="mb '+(o.cls||"")+'">'+(o.noX?"":'<button class="x" data-a="close">✕</button>')+html+"</div>";m.hidden=false;modalOnClose=o.onClose||null;
  if(B)B.paused=true;paintIcons(m);return m.firstChild;
}
function closeModal(silent){
  var m=$("#modal");if(m.hidden)return;clearInterval(modalTimer);modalTimer=0;m.hidden=true;m.innerHTML="";if(B){B.paused=false;B.last=performance.now();}
  var f=modalOnClose;modalOnClose=null;if(f&&!silent)f();
}

/* ================= arcade points ================= */
var LZR=.04,LZM=1,LZ_EA=false;
function lzBoot(){return new Promise(function(res){if(!window.LZ_GAME)return res();var done=false,fin=function(){if(!done){done=true;res();}};
  var go=function(){try{LZ.boot(LZ_GAME,{localKey:SAVEKEY,major:1,minor:0,progressOf:function(d){try{var g=JSON.parse(d);return(g.gen||0)*1e9+(g.xpTot||0);}catch(e){return 0;}}}).then(function(){
    Promise.all([LZ.gameInfo(LZ_GAME).then(function(g){LZR=g.ratio||LZR;}),LZ.inEarlyAccess?LZ.inEarlyAccess(LZ_GAME).then(function(e){LZ_EA=!!e;}):0,LZ.multiplier?LZ.multiplier(LZ_GAME).then(function(m){LZM=m||1;}):0]).then(fin,fin);},fin);}catch(e){fin();}};
  if(window.LZ)go();else window.addEventListener("lz-ready",go,{once:true});setTimeout(fin,4000);});}
function lzAward(score){if(score>0&&window.LZ&&window.LZ_GAME)try{LZ.endSession(LZ_GAME,score,{});}catch(e){}}

/* ================= starting battles ================= */
function enemyCols(){return S.skin==="inferno"||S.faction==="solari"&&S.skin==="std"?["#6f8cff","#1b2a7a"]:["#ff5468","#6b0b1c"];}
function attackNode(i,auto,ally){
  var wd=W(),n=wd.n[i];if(!n||!attackable(wd,n))return;
  if(armySize()<1){toast("You have no soldiers. Recruit some in Army.","bad");return;}
  var lv=nodeLv(wd,n);if(ally)S.allyCd=180;
  startBattle({mode:"atk",ty:n.ty,lv:lv,tr:n.tr,sd:n.sd+S.stats.battles*7919,nm:n.nm,sub:TIER[n.ty]+" · "+TERR[n.tr].nm+" · Lv "+lv,th:wd.th,w:wd.w,n:i,ecol:enemyCols(),auto:!!auto,ally:!!ally});
}
function startRaid(auto){
  if(S.raidCd>0){toast("Scouts are still looking for a target ("+S.raidCd+"s).");return;}
  if(armySize()<1){toast("You have no soldiers. Recruit some in Army.","bad");return;}
  var b=pick(bots()),lv=Math.max(1,S.lvl+irnd(-1,1)),tr=pick(["open","cover","high","choke"]);
  startBattle({mode:"raid",ty:1,lv:lv,tr:tr,sd:(Math.random()*1e9)|0,nm:b.nm+"'s Camp",sub:"Raid · "+TERR[tr].nm+" · Lv "+lv,th:W().th,w:S.cur,ecol:enemyCols(),auto:!!auto,bot:b.i});
}
function defendNow(){
  var th=S.threat;if(!th)return;var wd=S.worlds[th.w],n=wd.n[th.n],b=bots()[th.b];
  startBattle({mode:"def",ty:1,lv:th.lv,tr:"open",sd:(Math.random()*1e9)|0,nm:"Defend "+n.nm,sub:b.nm+" attacks · Lv "+th.lv,th:wd.th,w:th.w,ecol:enemyCols(),thr:th});
}

/* ================= after a battle ================= */
function battleDone(b){
  var cfg=b.cfg,o=b.outcome,win=o==="win",def=cfg.mode==="def",res=b.res,dead=b.dead,k,deadN=0,recN=0,rec={};quiet=true;newAch=[];
  b.units.forEach(function(u){if(u.side===0&&!u.ally&&u.hp>0)res[u.cls]=(res[u.cls]||0)+1;});
  for(k in dead){deadN+=dead[k];if(win){rec[k]=Math.floor(dead[k]*.5);recN+=rec[k];res[k]=(res[k]||0)+rec[k];}}
  S.army={};for(k in res)if(res[k]>0)S.army[k]=res[k];
  S.lastDead={};for(k in dead){var nd=dead[k]-(rec[k]||0);if(nd>0)S.lastDead[k]=nd;}
  var lostN=deadN-recN;S.stats.lost+=lostN;S.stats.kills+=b.kills;qprog("kills",b.kills);qprog("deploy",b.squads);if(b.puUsed)qprog("pu",b.puUsed);
  var R={win:win,o:o,cfg:cfg,items:[],bad:[],score:0,lostN:lostN,recN:recN,kills:b.kills,auto:b.autoT>b.t*.5};
  if(lostN>0)hit("h6");
  if(win){
    S.stats.wins++;qprog("win",1);
    var surv=b.depN?1-deadN/b.depN:1,tf=clamp(1-b.t/b.dur,0,1);
    var score=Math.round(T_SCORE[cfg.ty]*(def?.75:cfg.mode==="raid"?.85:1)*(.72+.2*surv+.16*tf)*(R.auto?.5:1));R.score=score;
    var wm=1+.5*(cfg.w||0),lm=1+.06*(cfg.lv-1);
    var coins=Math.round(T_COIN[cfg.ty]*wm*lm*rnd(.9,1.15)*(def?.5:1)*(S.ally>=0?1.05:1)),xp=Math.round(T_XP[cfg.ty]*(1+.1*(cfg.lv-1))*(def?.6:1)),alloy=def?0:Math.round(T_ALLOY[cfg.ty]*wm)+(cfg.ty===0&&Math.random()<.14?1:0);
    S.coins+=coins;S.alloy+=alloy;R.items.push([IC.coin,"Coins","+"+fmt(coins)]);if(alloy)R.items.push([IC.alloy,"Alloy","+"+alloy]);R.items.push([IC.xp,"XP","+"+xp]);
    if(cfg.mode==="atk"){
      var wd=S.worlds[cfg.w],n=wd.n[cfg.n];n.o=1;S.stats.capT[cfg.ty]++;S.stats.captures++;qprog("capture",1);
      R.items.push([IC.flag,"Captured",esc(n.nm)]);var mg=milestone(n.ty);if(mg)R.items.push([IC.gem,"First "+TIER[n.ty].toLowerCase()+" captured","+"+mg]);
      if(n.ty===4&&!wd.done){wd.done=true;hit("h1");R.core=true;if(S.worlds.length<=wd.w+1){S.worlds.push(genWorld(wd.w+1));}}
      alertAdd("land","You captured "+n.nm+".");
    }
    if(cfg.mode==="raid"){qprog("raid",1);S.raidCd=40;}
    if(def){S.stats.defends++;qprog("defend",1);S.threat=null;R.items.push([IC.shield,"Held",esc(S.worlds[cfg.thr.w].n[cfg.thr.n].nm)]);}
    if(!def){var cp=Math.min(capCap()-S.cap,Math.floor(b.kills*rnd(.1,.3)));if(cp>0){if(S.cap===0)S.capCyc=0;S.cap+=cp;S.capU=Math.max(S.capU,now()+FED_MS);S.stats.captives+=cp;R.items.push([IC.cap,"Captives taken","+"+cp]);}}
    if(!def&&cfg.ty>=1&&Math.random()<.18){
      var slot=pick(Object.keys(GEAR)),t=clamp(1+Math.floor(cfg.lv/3),1,6),cur0=S.gear[slot];
      if(t>gearTierMax()){R.tease={slot:slot,t:t};hit("h3");}
      else if(!cur0||cur0.t<t){S.gear[slot]={t:t,l:1};R.items.push([IC.alloy,"Gear looted",GEAR[slot].names[t-1]+" (Tier "+t+")"]);}
      else{var sal=Math.round(gearCost(t)*.3);S.alloy+=sal;R.items.push([IC.alloy,"Gear salvaged","+"+sal+" alloy"]);}
    }
    if(b.gotChest){var cc=Math.round(rnd(40,110)*(1+.15*S.lvl));S.coins+=cc;S.stats.chests++;hit("h15");var extra="";if(Math.random()<.35){var pk=pick(Object.keys(PUPS));S.pu[pk]++;extra=" + "+PUPS[pk].nm;}R.items.push([IC.chest,"Treasure chest","+"+cc+" coins"+extra]);}
    S.ev.pts+=Math.round(score/60);if(tourOn())S.tour.pts+=Math.round(score/100);
    S.total+=score;addXP(xp);lzAward(score);
  }else{
    S.stats.losses++;
    if(def){var out=loseNode(cfg.thr,false);S.threat=null;R.bad.push("Lost territory: "+esc(out.node));if(out.coins)R.bad.push("Plundered: "+fmt(out.coins)+" coins");}
    else if(o==="lose"&&Math.random()<.32){
      var have=Object.keys(GEAR).filter(function(s){return S.gear[s];});
      if(have.length){var s2=pick(have),g=S.gear[s2],nm=GEAR[s2].names[g.t-1];
        if(S.lossProt>0){S.lossProt--;R.items.push([IC.shield,"Loss Protection","saved your "+nm]);}
        else{g.l--;if(g.l<1){S.gear[s2]=null;R.bad.push(nm+" destroyed");}else R.bad.push(nm+" damaged (level "+g.l+")");}}
    }
    if(o==="lose")addXP(Math.round(T_XP[cfg.ty]*.15));
  }
  checkAch();R.ach=newAch.slice();quiet=false;save();showResults(R);
}
function showResults(R){
  var h="",lp=Math.round(R.score*LZR*LZM);
  h+='<div class="ban '+(R.win?"":"lose")+'">'+(R.win?"VICTORY":R.o==="retreat"?"RETREAT":"DEFEAT")+"</div>";
  h+='<p class="ctr mut sm">'+esc(R.cfg.nm)+"</p>";
  if(R.win)h+='<p class="ctr"><span class="tag g">Battle score '+fmt(R.score)+'</span> <span class="tag c">+'+fmt(lp)+" LP"+(LZ_EA?" held":"")+"</span>"+(R.auto?' <span class="tag">Autopilot: half score</span>':"")+"</p>";
  h+='<div class="lst">';
  R.items.forEach(function(it){h+='<div class="li good">'+it[0]+" "+it[1]+" <b>"+it[2]+"</b></div>";});
  if(R.lostN>0)h+='<div class="li bad">'+IC.army+" Soldiers lost <b>"+R.lostN+"</b></div>";
  if(R.recN>0)h+='<div class="li">'+IC.army+" Wounded recovered <b>"+R.recN+"</b></div>";
  (R.ach||[]).forEach(function(t){h+='<div class="li" style="background:#4a3500;color:#ffe9a8">'+IC.xp+" Badge earned <b>"+esc(t)+"</b></div>";});
  R.bad.forEach(function(t){h+='<div class="li bad">'+t+"</div>";});
  h+="</div>";
  if(R.tease)h+='<div class="hkc" style="display:block"><b>You found '+GEAR[R.tease.slot].names[R.tease.t-1]+" (Tier "+R.tease.t+")</b> but your level is too low to field it. Reach level "+GEAR_LV[R.tease.t-1]+" to use Tier "+R.tease.t+" gear. "+hk("h3")+"</div>";
  if(R.core)h+='<p class="ctr" style="color:var(--gold)">World conquered! A new planet has appeared on your star chart. '+hk("h1")+"</p>";
  if(R.lostN>0)h+='<p class="ctr sm mut">'+(R.win?"Half of your fallen were patched up. The rest are gone.":"Soldiers lost in a defeat stay lost.")+" "+hk("h6")+"</p>";
  h+='<div class="acts">';
  if(R.lostN>0)h+='<button class="btn b3" data-a="revive">'+IC.gem+" Revive all "+R.lostN+" · "+reviveCost()+"</button>";
  h+='<button class="btn big" data-a="cont">Continue</button></div>';
  if(R.lostN>0)h+='<p class="ctr">'+hk("m11")+"</p>";
  openModal(h,{noX:true,cls:R.win?"ray":""});
  postBattle=R;
}
var postBattle=null;
function reviveCost(){var n=armySize(S.lastDead||{});return Math.max(60,Math.round(GP.revive*(.5+n/12)/10)*10);}
function flowNext(){
  closeModal(true);
  if(pendingLv.length){showLevel(pendingLv.shift());return;}
  if(streakPending){showStreak();return;}
  var R=postBattle;postBattle=null;
  if(R){
    if(R.win&&S.offers.starter&&!S.offers.shownStarter&&S.stats.wins>=2){S.offers.shownStarter=true;showOffer("starter");return;}
    if(!R.win&&R.o==="lose"&&offerDue()){showOffer("comeback");return;}
    if(R.win&&S.xp/xpNeed(S.lvl)>.8&&S.offers.near!==S.lvl&&offerDue()){S.offers.near=S.lvl;showOffer("near");return;}
  }
  renderAll();
}
function offerDue(){return now()-S.offers.last>70000;}
function showLevel(lv){
  var un=unlockedAt(lv.l),nx=nextUnlocks(2),h='<div class="ban">LEVEL '+lv.l+"!</div><p class=\"ctr\">You are now a <b>"+rankOf(lv.l)+"</b>. "+hk("h2")+"</p><div class=\"lst\">";
  un.forEach(function(u){h+='<div class="li good">'+IC.lock+" Unlocked <b>"+esc(u)+"</b></div>";});
  h+='<div class="li">'+IC.army+" Camp size <b>"+campCap()+"</b></div>";
  h+='<div class="li">'+IC.bolt+" Free power-ups <b>Airstrike + "+PUPS[lv.p].nm+"</b></div>";
  h+='<div class="li">'+IC.gem+" Gems <b>+"+lv.g+"</b></div></div>";
  if(nx.length)h+='<p class="ctr sm mut">Coming up: '+nx.map(function(u){return "<b>Lv "+u[0]+"</b> "+esc(u[1]);}).join(" · ")+" "+hk("h3")+"</p>";
  h+='<div class="acts"><button class="btn big" data-a="cont">Onward</button></div>';
  openModal(h,{noX:true,cls:"ray"});snd("lvl");
}
function showStreak(){
  var sp=streakPending;streakPending=null;if(!sp)return flowNext();
  var d=S.streak.d,idx=(d-1)%7,r=STREAK_R[idx],got=grant(r),h="<h2>Daily Reward "+hk("h8")+"</h2>";
  if(sp.lost)h+='<p class="ctr" style="color:var(--red)">Your '+sp.prev+"-day streak broke. Back to day 1.</p>";
  h+='<p class="ctr">Day <b>'+d+"</b> streak. Come back tomorrow to keep it going.</p><div class=\"days\">";
  for(var i=0;i<7;i++)h+='<div class="day '+(i<idx?"got":i===idx?"now":"")+'"><b>Day '+(i+1)+"</b>"+rewardTxt(STREAK_R[i])+"</div>";
  h+='</div><p class="ctr" style="margin-top:10px">Today: <b>'+got+'</b></p><div class="acts"><button class="btn big" data-a="cont">Collect</button></div>';
  openModal(h,{noX:true});snd("coin");dirty();
}
var OFFER={};
function showOffer(kind){
  var h="",secs=kind==="starter"?90:45,nd=armySize(S.lastDead||{});
  S.offers.last=now();S.stats.popups++;hit("m8");
  if(kind==="starter"){hit("m2");OFFER={kind:kind,g:GP.starter};
    h='<p class="ctr"><span class="burst">ONE TIME ONLY · 90% OFF</span></p><h2>Starter Pack</h2><div class="lst"><div class="li">'+IC.coin+" Coins <b>400</b></div><div class=\"li\">"+IC.stamp+" Food Stamps <b>60</b></div><div class=\"li\">"+IC.bolt+' Airstrikes <b>2</b></div><div class="li">'+IC.shield+' Aegis <b>1</b></div></div><p class="ctr"><span class="was">'+IC.gem+' 200</span> <b style="font:400 30px var(--disp);color:var(--gold)">'+IC.gem+" "+GP.starter+"</b></p>";
  }else if(kind==="comeback"){OFFER={kind:kind,g:250};
    h='<p class="ctr"><span class="burst">DON\'T LET IT END LIKE THIS</span></p><h2>Comeback Pack</h2><div class="lst">'+(nd?'<div class="li">'+IC.army+" Revive fallen soldiers <b>"+nd+"</b></div>":"")+'<div class="li">'+IC.bolt+" Airstrikes <b>2</b></div><div class=\"li\">"+IC.shield+" Aegis <b>1</b></div></div>";
  }else if(kind==="siege"){OFFER={kind:kind,g:GP.pups};
    h='<p class="ctr"><span class="burst">BIG FIGHT AHEAD</span></p><h2>Siege Bundle</h2><p class="ctr sm">That stronghold hits hard. Go in prepared.</p><div class="lst"><div class="li">'+IC.bolt+" Airstrikes <b>2</b></div><div class=\"li\">"+IC.bolt+" Med Wave, Rage, Aegis <b>1 each</b></div></div>";
  }else{var pct=Math.floor(S.xp/xpNeed(S.lvl)*100);OFFER={kind:kind,g:GP.xp};
    h='<p class="ctr"><span class="burst">SO CLOSE</span></p><h2>Level '+(S.lvl+1)+" is right there</h2><p class=\"ctr\">You are <b>"+pct+'%</b> of the way. Finish it now and unlock: <b>'+esc((unlockedAt(S.lvl+1)[0]||"bigger camp and free power-ups"))+'</b></p><div class="bar g" style="margin:10px 0"><i style="width:'+pct+'%"></i></div>';
  }
  h+='<p class="ctr">Offer ends in <span class="cd" id="ofcd">'+mmss(secs)+'</span></p><div class="acts"><button class="btn big b4" data-a="offerBuy">'+(kind==="starter"?"Claim · ":"")+IC.gem+" "+OFFER.g+'</button></div><p class="ctr">'+hk("m8")+(kind==="starter"?" "+hk("m2"):kind==="near"?" "+hk("m9"):kind==="comeback"?" "+hk("m11"):"")+'</p>';
  openModal(h,{cls:"offer",onClose:function(){flowNext();}});snd("alert");
  modalTimer=setInterval(function(){secs--;var e=$("#ofcd");if(e)e.textContent=mmss(secs);if(secs<=0){toast("Offer expired.");closeModal();}},1000);
}
function offerBuy(){
  var k=OFFER.kind;
  if(!spendGems(OFFER.g,"this offer"))return;
  {
    if(k==="starter"){S.offers.starter=false;S.coins+=400;S.stamps+=60;S.pu.strike+=2;S.pu.shield++;}
    else if(k==="comeback"){doRevive();S.pu.strike+=2;S.pu.shield++;hit("m11");}
    else if(k==="siege"){S.pu.strike+=2;S.pu.heal++;S.pu.rage++;S.pu.shield++;hit("m9");}
    else{addXP(xpNeed(S.lvl)-S.xp);hit("m9");}
    toast(IC.gem+" Purchased.","gold");snd("jack");
  }
  S.stats.popupBuys++;dirty();closeModal();
}
function doRevive(){var d=S.lastDead||{},n=0;for(var k in d){S.army[k]=(S.army[k]||0)+d[k];n+=d[k];}S.lastDead={};return n;}
function openGemShort(n,what){
  hit("m3");hit("m5");
  openModal("<h2>Not enough gems</h2><p class=\"ctr\">You need <b>"+fmt(n-S.gems)+" more</b> "+IC.gem+" for "+esc(what||"that")+".</p><p class=\"ctr sm mut\">Gems are never sold. Earn them from level-ups, first captures, badges, streaks, tournaments and events. "+hk("m3")+" "+hk("m5")+'</p><div class="acts"><button class="btn" data-a="close">OK</button></div>',{onClose:function(){if(postBattle||pendingLv.length)flowNext();else renderAll();}});
}
function showDefLoss(r){
  if(!modalFree())return;
  openModal('<div class="ban lose">TERRITORY LOST</div><p class="ctr"><b>'+esc(r.by)+"</b> overran <b>"+esc(r.node)+'</b> while you were busy. '+hk("h5")+'</p><div class="lst"><div class="li bad">'+IC.coin+" Plundered <b>"+fmt(r.coins)+"</b></div>"+(r.sold?'<div class="li bad">'+IC.army+" Garrison lost <b>"+r.sold+"</b></div>":"")+'</div><p class="ctr sm mut">Upgrade your Fortress, or defend in person next time.</p><div class="acts"><button class="btn" data-a="close">OK</button><button class="btn b2" data-a="tab" data-v="forge">Fortress</button></div>');
  snd("lose");
}
function showAway(o){
  var h="<h2>While you were away "+hk("h7")+"</h2><p class=\"ctr sm mut\">Gone for "+dur(o.away)+". You earned nothing while offline.</p><div class=\"lst\">";
  if(!o.raids.length&&!o.auto.length)h+='<div class="li">Nobody attacked. This time.</div>';
  o.raids.forEach(function(r){h+=r.win?'<div class="li good">'+IC.shield+" Held "+esc(r.node)+" against "+esc(r.by)+" <b>+"+r.coins+"</b></div>":'<div class="li bad">'+IC.flag+" "+esc(r.by)+" took "+esc(r.node)+" <b>-"+fmt(r.coins)+"</b></div>";});
  o.auto.forEach(function(a){h+='<div class="li good">'+IC.sword+" Your Advanced General captured "+esc(a.nm)+" <b>+"+a.c+"</b></div>";});
  h+='</div><div class="acts"><button class="btn big" data-a="cont">Back to the front</button></div>';
  openModal(h,{noX:true});
}
