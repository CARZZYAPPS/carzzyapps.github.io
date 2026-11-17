/* ================= world ================= */
var TAU=Math.PI*2,FED_MS=180000,STAMP_PRICE=3;
var PN_A=["Ar","Vel","Kor","Zan","Tor","Ny","Ex","Um","Or","Cal","Dra","Ith","Sol","Mar","Bel","Quo"],PN_B=["dis","ora","mund","thar","ius","ella","ion","arra","eth","ux","ana","oth"];
var CN_A=["Ash","Bright","Storm","Iron","Gold","Red","Frost","Star","Moon","Sky","Dusk","Silver","Thorn","Glass","Ember","Wolf","Raven","Sun"],CN_B=["ford","haven","gate","hold","reach","fall","watch","spire","mere","vale","crest","port","mark","burn"];
function genWorld(w){
  var r=rng(hash(S.seed+":w"+w)),th=w%THEMES.length,C=w<1?2:3,N=[],used={};
  function nm(){for(var t=0;t<20;t++){var s=CN_A[Math.floor(r()*CN_A.length)]+CN_B[Math.floor(r()*CN_B.length)];if(!used[s]){used[s]=1;return s;}}return "Nova"+N.length;}
  function terr(){var ks=["open","cover","high","choke","fort"];return r()<.5?THEMES[th].bias:ks[Math.floor(r()*ks.length)];}
  function add(ty,p,a,rad,rv){var n={i:N.length,ty:ty,p:p,k:[],o:0,a:a,r:rad+(ty?(r()-.5)*.014:0),nm:"",tr:ty>=2?(r()<.55?"fort":terr()):terr(),sd:Math.floor(r()*1e9),rv:rv};N.push(n);if(p>=0)N[p].k.push(n.i);return n;}
  var pn=PN_A[Math.floor(r()*PN_A.length)]+PN_B[Math.floor(r()*PN_B.length)]+(w>4?" "+["II","III","IV","V","VI","VII","VIII","IX"][Math.min(7,Math.floor(w/5)-1)]:"");
  var boss=Math.floor(r()*3),core=add(4,-1,0,0,boss);core.nm=pn+" Core";
  var a0=-Math.PI/2+r()*.5;
  for(var c=0;c<C;c++){
    var cw=TAU/C,ca=a0+c*cw,rv=3+Math.floor(r()*20),cn=add(3,0,ca+cw/2,.15,rv);cn.nm=nm()+(r()<.5?" Republic":" Dominion");
    for(var s=0;s<2;s++){
      var sw=cw/2,sa=ca+s*sw,sn=add(2,cn.i,sa+sw/2,.262,rv);sn.nm="Fort "+nm();
      for(var ci=0;ci<2;ci++){
        var iw=sw/2,ia=sa+ci*iw,cin=add(1,sn.i,ia+iw/2,.372,rv);cin.nm=nm();
        for(var b=0;b<2;b++){var bn=add(0,cin.i,ia+iw*(b?.76:.24),.468,rv);bn.nm=cin.nm+(b?" East":" West");}
      }
    }
  }
  return {w:w,nm:pn,th:th,n:N,done:false};
}
function W(){return S.worlds[S.cur];}
function attackable(wd,n){return n.o===0&&n.k.every(function(k){return wd.n[k].o===1;});}
function ownedCount(ty){var c=0;S.worlds.forEach(function(wd){wd.n.forEach(function(n){if(n.o===1&&(ty===undefined||n.ty===ty))c++;});});return c;}
function worldPct(wd){var o=0;wd.n.forEach(function(n){if(n.o===1)o++;});return o/wd.n.length;}
function incomeMin(){var t=0;S.worlds.forEach(function(wd){wd.n.forEach(function(n){if(n.o===1)t+=T_INC[n.ty]*(1+.6*wd.w);});});return t*(S.ally>=0?1.05:1);}
function nodeLv(wd,n){return Math.max(1+wd.w*4+n.ty,Math.round(S.lvl-1+n.ty*.75));}
function eBudget(ty,lv){return[8,14,19,24,30][ty]*(1+.07*(lv-1));}
function es(lv){return 1+.1*(lv-1);}

/* ================= army / levels ================= */
function xpNeed(l){return Math.round(50*Math.pow(l,1.7));}
function armySize(a){a=a||S.army;var t=0;for(var k in a)t+=a[k];return t;}
function campCap(){return 16+4*S.lvl+S.campX*6;}
function classMaxLv(){return 2+Math.floor(S.lvl/2);}
function gearTierMax(){var t=0;GEAR_LV.forEach(function(l){if(S.lvl>=l)t++;});return t;}
function gearMaxLv(){return 2+Math.floor(S.lvl/3);}
function gearBonus(slot){var g=S.gear[slot];return g?(6*g.t+2*(g.l-1))/100:0;}
function gearCost(t){return Math.round(8*Math.pow(2.6,t-1));}
function gearUpCost(g){return Math.round(gearCost(g.t)*.4*g.l);}
function clsMult(k){return 1+.12*((S.clv[k]||1)-1);}
function clsUpCost(k){return Math.round(70*Math.pow(S.clv[k]||1,1.8)*(.6+CLASSES[k].cost/60));}
function recruitCost(k){return Math.round(CLASSES[k].cost*.75*(1+.012*armySize())*(1+.03*(S.lvl-1)));}
function fortCost(){return Math.round(120*Math.pow(S.fort,1.7));}
function campCost(){return Math.round(180*Math.pow(S.campX+1,1.6));}
function fedOn(){return S.lvl>=2;}
function fedMult(){if(!fedOn())return 1;return now()<S.fedU?[.92,1,1.12][S.fedQ]:.8;}
function armyPower(){var t=0;for(var k in S.army)t+=S.army[k]*CLASSES[k].pw*clsMult(k);return t*(1+(gearBonus("weapon")+gearBonus("armor"))/2)*fedMult();}
function enemyPower(ty,lv){return(eBudget(ty,lv)*12+[0,40,90,150,240][ty])*es(lv);}
function matchup(ty,lv){var r=armyPower()/enemyPower(ty,lv);return r>=1.6?["Easy","l"]:r>=1.05?["Fair","c"]:r>=.72?["Hard","g"]:["Deadly","r"];}
var pendingLv=[];
function gem(n){S.gems+=n;S.stats.gemsEarned+=n;}
function addXP(n){
  n=Math.round(n);S.xp+=n;S.xpTot+=n;hit("h2");
  while(S.xp>=xpNeed(S.lvl)){S.xp-=xpNeed(S.lvl);S.lvl++;var p=pick(["strike","heal","rage","shield"]);S.pu[p]++;S.pu.strike++;var lg=10+2*Math.min(10,S.lvl);gem(lg);pendingLv.push({l:S.lvl,p:p,g:lg});hit("h3");S.offers.near=0;}
  dirty();
}
function unlockedAt(l){return UNLOCKS.filter(function(u){return u[0]===l;}).map(function(u){return u[1];});}
function nextUnlocks(n){return UNLOCKS.filter(function(u){return u[0]>S.lvl;}).slice(0,n);}

/* ================= feeding / captives ================= */
var FOODS=[{nm:"Gruel",c:.25,m:"-8% combat"},{nm:"Standard",c:.5,m:"normal combat"},{nm:"Feast",c:1,m:"+12% combat"}];
function feedCost(q){return Math.ceil(armySize()*FOODS[q].c*(1+.05*(S.lvl-1)));}
function capFeedCost(){return Math.ceil(S.cap*.2*(1+.05*(S.lvl-1)));}
function feed(q,auto){
  var c=feedCost(q)+(S.capFeed&&S.cap?capFeedCost():0);
  if(S.stamps<c){
    if(auto&&S.feedAuto.buy){var need=c-S.stamps,cost=need*STAMP_PRICE;if(S.coins>=cost){S.coins-=cost;S.stamps+=need;}else return false;}
    else return false;
  }
  S.stamps-=c;S.fedU=now()+FED_MS;S.fedQ=q;
  if(S.capFeed&&S.cap){S.capU=now()+FED_MS+8000;S.capCyc++;}
  S.stats.feeds++;qprog("feed",1);hit("h11");dirty();return true;
}
function capCap(){return 8+2*S.lvl;}
function ransomVal(){return Math.round(S.cap*(7+4*Math.min(S.capCyc,6))*(1+.08*(S.lvl-1)));}

/* ================= quests / achievements ================= */
var QT={
  win:{t:function(n){return "Win "+n+" battle"+(n>1?"s":"");},n:function(q){return 2+Math.floor(q*.55);}},
  kills:{t:function(n){return "Defeat "+n+" enemy soldiers";},n:function(q){return 15+q*9;}},
  recruit:{t:function(n){return "Recruit "+n+" soldiers";},n:function(q){return 6+q*3;}},
  capture:{t:function(n){return "Capture "+n+" territor"+(n>1?"ies":"y");},n:function(q){return 1+Math.floor(q*.4);}},
  feed:{t:function(n){return "Feed your army "+n+" time"+(n>1?"s":"");},n:function(q){return 1+Math.floor(q/4);},lvl:2},
  deploy:{t:function(n){return "Deploy "+n+" squads";},n:function(q){return 8+q*5;}},
  pu:{t:function(n){return "Use "+n+" power-up"+(n>1?"s":"");},n:function(q){return 1+Math.floor(q/5);}},
  collect:{t:function(n){return "Collect "+fmt(n)+" coins from the vault";},n:function(q){return 40+q*60;}},
  upgrade:{t:function(n){return "Buy "+n+" upgrade"+(n>1?"s":"")+" (soldiers, gear or fortress)";},n:function(q){return 1+Math.floor(q/4);}},
  defend:{t:function(n){return "Win "+n+" defense"+(n>1?"s":"");},n:function(q){return 1+Math.floor(q/9);},lvl:4},
  raid:{t:function(n){return "Win "+n+" raid"+(n>1?"s":"")+" on rival camps";},n:function(q){return 1+Math.floor(q/5);},lvl:2}
};
function newQuest(){
  var q=S.qn++,have={};S.quests.forEach(function(x){if(x)have[x.k]=1;});
  var pool=Object.keys(QT).filter(function(k){return !have[k]&&S.lvl>=(QT[k].lvl||1);}),k=q===0?"win":q===1?"recruit":q===2?"capture":pick(pool);
  return {k:k,n:QT[k].n(q),p:0,c:Math.round(50*Math.pow(1+q,.5)),x:Math.round(22*Math.pow(1+q,.45)),a:q%3===2?1+Math.floor(q/9):0,g:q%5===4?8:0,q:q};
}
function qprog(k,n){
  S.quests.forEach(function(q){if(q&&q.k===k&&q.p<q.n){q.p=Math.min(q.n,q.p+n);if(q.p>=q.n)alertAdd("quest","Quest complete: "+QT[q.k].t(q.n));}});
}
function questsReady(){return S.quests.filter(function(q){return q&&q.p>=q.n;}).length;}
function claimQuest(i){
  var q=S.quests[i];if(!q||q.p<q.n)return;
  S.coins+=q.c;if(q.a)S.alloy+=q.a;if(q.g)gem(q.g);addXP(q.x);S.stats.quests++;S.quests[i]=null;S.quests[i]=newQuest();hit("h9");hit("h10");
  snd("coin");toast(IC.quest+" Quest claimed. A new one just dropped.","gold");dirty();
}
var ACH=[
  {id:"w1",nm:"First Blood",d:"Win your first battle",f:function(){return S.stats.wins>=1;},c:50},
  {id:"w10",nm:"Veteran",d:"Win 10 battles",f:function(){return S.stats.wins>=10;},c:150},
  {id:"w50",nm:"Warpath",d:"Win 50 battles",f:function(){return S.stats.wins>=50;},c:600},
  {id:"city",nm:"Mayor",d:"Capture a city",f:function(){return S.stats.capT[1]>=1;},c:100},
  {id:"state",nm:"Governor",d:"Capture a state fortress",f:function(){return S.stats.capT[2]>=1;},c:250},
  {id:"country",nm:"Sovereign",d:"Capture a capital",f:function(){return S.stats.capT[3]>=1;},c:500},
  {id:"core",nm:"World Eater",d:"Conquer an entire world",f:function(){return S.stats.capT[4]>=1;},c:1500},
  {id:"l5",nm:"Rising Star",d:"Reach level 5",f:function(){return S.lvl>=5;},c:150},
  {id:"l10",nm:"Commander",d:"Reach level 10",f:function(){return S.lvl>=10;},c:500},
  {id:"l15",nm:"Warlord",d:"Reach level 15",f:function(){return S.lvl>=15;},c:1200},
  {id:"k100",nm:"Centurion",d:"Defeat 100 enemy soldiers",f:function(){return S.stats.kills>=100;},c:120},
  {id:"k1000",nm:"Thousand Cuts",d:"Defeat 1,000 enemy soldiers",f:function(){return S.stats.kills>=1000;},c:800},
  {id:"s3",nm:"Regular",d:"Log in 3 days in a row",f:function(){return S.streak.best>=3;},c:150},
  {id:"s7",nm:"Devoted",d:"Log in 7 days in a row",f:function(){return S.streak.best>=7;},c:500},
  {id:"def5",nm:"Wall of Iron",d:"Win 5 defenses",f:function(){return S.stats.defends>=5;},c:300},
  {id:"lens",nm:"Eyes Open",d:"Turn on the Hook Lens",f:function(){return S.stats.lensOpens>=1;},c:100},
  {id:"rep",nm:"Behind the Curtain",d:"Read the Hook Report",f:function(){return S.stats.report>=1;},c:100},
  {id:"free",nm:"Iron Discipline",d:"Capture a state fortress without spending a single gem",f:function(){return S.stats.capT[2]>=1&&S.stats.gemsSpent===0;},c:400}
];
var newAch=[];
function checkAch(){
  ACH.forEach(function(a){if(!S.ach[a.id]&&a.f()){S.ach[a.id]=1;hit("h3b");if(quiet)newAch.push(a.nm);else toast(IC.xp+" Badge earned: <b>"+a.nm+"</b>","gold");}});
}
function achReady(){var c=0;for(var k in S.ach)if(S.ach[k]===1)c++;return c;}

/* ================= alerts ================= */
var quiet=false;
function alertAdd(kind,txt){
  S.alerts.unshift({k:kind,t:txt,at:now(),u:1});if(S.alerts.length>30)S.alerts.length=30;S.stats.alerts++;hit("h17");
  if(S.alertCfg[kind]!==false&&!quiet){toast(IC.bell+" "+esc(txt),kind==="attack"?"bad":"");if(kind==="attack")snd("alert");}
  if(typeof renderHud==="function")renderHud();
}
function unread(){return S.alerts.filter(function(a){return a.u;}).length;}

/* ================= rival attacks ================= */
function defPower(){return(S.fort*16+S.ench*34+armyPower()*.05)*(now()<S.campU?1.3:1);}
function spawnThreat(){
  var opts=[];S.worlds.forEach(function(wd){wd.n.forEach(function(n){if(n.o===1&&n.ty<=2)opts.push([wd.w,n.i,n.ty===0?4:n.ty===1?2:1,wd.w===S.cur?3:1]);});});
  if(!opts.length)return;
  var tot=0;opts.forEach(function(o){tot+=o[2]*o[3];});var x=Math.random()*tot,ch=opts[0];
  for(var i=0;i<opts.length;i++){x-=opts[i][2]*opts[i][3];if(x<=0){ch=opts[i];break;}}
  var b=pick(bots());S.threat={w:ch[0],n:ch[1],t:45,lv:Math.max(1,S.lvl+irnd(-1,1)),b:b.i};
  hit("h5");hit("h10b");S.stats.spikes++;
  alertAdd("attack",b.nm+" is attacking "+S.worlds[ch[0]].n[ch[1]].nm+"!");
}
function loseNode(th,auto){
  var wd=S.worlds[th.w],n=wd.n[th.n],b=bots()[th.b],out={node:n.nm,coins:0,sold:0};
  n.o=0;n.rv=th.b;wd.done=false;S.stats.nodesLost++;S.stats.defLost++;hit("h6");
  out.coins=Math.round(S.coins*.06);S.coins-=out.coins;
  if(auto){var lose=Math.round(armySize()*.08);for(var i=0;i<lose;i++){var ks=Object.keys(S.army).filter(function(k){return S.army[k]>0;});if(!ks.length)break;var k=pick(ks);S.army[k]--;out.sold++;}S.stats.lost+=out.sold;}
  alertAdd("land",b.nm+" took "+n.nm+" from you.");
  return out;
}
function resolveThreat(){
  var th=S.threat;if(!th)return null;S.threat=null;
  var atk=(30+20*th.lv)*rnd(.7,1.3),def=defPower(),p=clamp(.5+(def-atk)/atk*.8,.08,.95),res;
  if(Math.random()<p){var c=Math.round(20+10*th.lv);S.coins+=c;S.stats.defends++;qprog("defend",1);res={win:true,node:S.worlds[th.w].n[th.n].nm,coins:c,by:bots()[th.b].nm};alertAdd("land","Your defenses held at "+res.node+". +"+c+" coins.");}
  else{res=loseNode(th,true);res.win=false;res.by=bots()[th.b].nm;}
  dirty();return res;
}

/* ================= chest ================= */
function openChest(){
  var r=Math.random(),lv=S.lvl,out;S.chest=null;S.stats.chests++;hit("h15");
  if(r<.5){var c=Math.round(rnd(40,120)*(1+.15*lv));S.coins+=c;out=IC.coin+" "+c+" coins";}
  else if(r<.72){var s=Math.round(rnd(15,40)*(1+.1*lv));S.stamps+=s;out=IC.stamp+" "+s+" food stamps";}
  else if(r<.87){var a=irnd(1,3)+Math.floor(lv/5);S.alloy+=a;out=IC.alloy+" "+a+" alloy";}
  else if(r<.97){var p=pick(Object.keys(PUPS));S.pu[p]++;out=IC.bolt+" "+PUPS[p].nm+" power-up";}
  else{var j=Math.round(600*(1+.2*lv));S.coins+=j;S.alloy+=5;out=IC.coin+" JACKPOT! "+j+" coins + 5 alloy";snd("jack");}
  snd("coin");toast(IC.chest+" Treasure: "+out,"gold");dirty();
}

/* ================= events / tournament / streak ================= */
function evId(){return Math.floor(dayNum(dayStr())/7);}
function evNow(){return EVENTS[evId()%EVENTS.length];}
function evLeft(){var d=new Date();return((evId()+1)*7-dayNum(dayStr()))*86400-(d.getHours()*3600+d.getMinutes()*60+d.getSeconds());}
function evSync(){if(S.ev.id!==evId()){var first=S.ev.id<0;S.ev={id:evId(),pts:0,cf:0,cp:0,prem:false};if(!first)alertAdd("event","New event: "+evNow().nm+" has begun!");}}
var PASS_F=[["coins",80],["stamps",30],["gems",10],["alloy",4],["pu",1],["coins",300],["gems",20],["alloy",10]];
var PASS_P=[["alloy",6],["pu",2],["coins",400],["alloy",12],["gems",60],["coins",900],["alloy",25],["skin",1]];
function grant(r){
  var k=r[0],n=r[1],m=1+.12*(S.lvl-1);
  if(k==="coins"){n=Math.round(n*m);S.coins+=n;return IC.coin+" "+fmt(n);}
  if(k==="stamps"){n=Math.round(n*m);S.stamps+=n;return IC.stamp+" "+fmt(n);}
  if(k==="alloy"){S.alloy+=n;return IC.alloy+" "+n;}
  if(k==="gems"){gem(n);return IC.gem+" "+n;}
  if(k==="pu"){for(var i=0;i<n;i++)S.pu[pick(Object.keys(PUPS))]++;return IC.bolt+" "+n+" power-up"+(n>1?"s":"");}
  if(k==="skin"){var s=evNow().skin;if(S.skins.indexOf(s.id)<0)S.skins.push(s.id);return "Limited skin: "+s.nm;}
  return "";
}
function rewardTxt(r){var k=r[0],n=r[1],m=1+.12*(S.lvl-1);return k==="coins"?IC.coin+" "+fmt(n*m):k==="stamps"?IC.stamp+" "+fmt(n*m):k==="alloy"?IC.alloy+" "+n:k==="gems"?IC.gem+" "+n:k==="pu"?IC.bolt+" ×"+n:"Skin";}
function passTier(){var t=0;PASS_PTS.forEach(function(p){if(S.ev.pts>=p)t++;});return t;}
function passReady(){var t=passTier();return(t-S.ev.cf)+(S.ev.prem?t-S.ev.cp:0);}
var TOUR_MS=900000,TOUR_ON=600000;
function tourId(){return Math.floor(now()/TOUR_MS);}
function tourOn(){return now()%TOUR_MS<TOUR_ON;}
function tourLeft(){var m=now()%TOUR_MS;return(m<TOUR_ON?TOUR_ON-m:TOUR_MS-m)/1000;}
function tourBoard(id,full){
  var el=full?TOUR_ON/1000:Math.min(TOUR_ON,now()%TOUR_MS)/1000,rows=bots().slice(0,14).map(function(b){var r=rng(hash(id+":"+b.i));return{nm:b.nm,c1:b.c1,p:Math.round((.05+r()*.3)*el*(.6+r()*.8))};});
  rows.push({nm:S.name,me:1,p:S.tour.pts,c1:myCols()[0]});rows.sort(function(a,b){return b.p-a.p;});return rows;
}
function tourSync(){
  var id=tourId();if(S.tour.id===id)return;
  if(S.tour.id>0&&S.tour.pts>0){
    var rows=tourBoard(S.tour.id,true),rk=1;for(var i=0;i<rows.length;i++)if(rows[i].me){rk=i+1;break;}
    var c=Math.round((rk===1?500:rk<=3?260:rk<=8?120:50)*(1+.12*(S.lvl-1))),a=rk===1?6:rk<=3?3:0,g=rk===1?30:rk<=3?15:rk<=8?5:0;S.coins+=c;S.alloy+=a;if(g)gem(g);
    alertAdd("event","Blitz Tournament ended. You placed #"+rk+": +"+c+" coins"+(a?", +"+a+" alloy":"")+(g?", +"+g+" gems":""));hit("h13b");
  }
  S.tour={id:id,pts:0};
}
var STREAK_R=[["coins",60],["stamps",25],["gems",10],["pu",1],["alloy",3],["coins",250],["gems",40]];
var streakPending=null;
function streakSync(){
  var t=dayStr();if(S.streak.last===t)return;
  var prev=S.streak.d,lost=false;
  if(S.streak.last&&dayNum(t)-dayNum(S.streak.last)===1)S.streak.d++;
  else if(S.streak.last&&S.streak.d>0&&S.streak.freeze>0&&dayNum(t)-dayNum(S.streak.last)===2){S.streak.freeze--;S.streak.d++;}
  else{lost=prev>1;S.streak.d=1;}
  S.streak.last=t;S.streak.best=Math.max(S.streak.best,S.streak.d);hit("h8");
  streakPending={lost:lost,prev:prev};
}
function myCols(){var f=FACTIONS[S.faction]||FACTIONS.solari,s=S.skin,ev;if(s==="std")return[f.c1,f.c2];if(SKINS[s])return[SKINS[s].c1,SKINS[s].c2];for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].skin.id===s)ev=EVENTS[i].skin;return ev?[ev.c1,ev.c2]:[f.c1,f.c2];}
function skinName(id){if(SKINS[id])return SKINS[id].nm;for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].skin.id===id)return EVENTS[i].skin.nm;return id;}

/* ================= store ================= */
function spendGems(n,what){
  if(S.gems<n){openGemShort(n,what);return false;}
  S.gems-=n;S.stats.gemsSpent+=n;hit("m4");hit("m14");dirty();return true;
}
var WHEEL=[
  {nm:"JACKPOT",jack:1,col:"#ffcf3a",w:2},{nm:"60 coins",r:["coins",60],col:"#3a55e0",w:20},{nm:"30 stamps",r:["stamps",30],col:"#12b3a6",w:16},{nm:"Power-up",r:["pu",1],col:"#a66bff",w:12},
  {nm:"150 coins",r:["coins",150],col:"#e02f86",w:12},{nm:"2 alloy",r:["alloy",2],col:"#0a8fb0",w:10},{nm:"25 gems",r:["gems",25],col:"#4fd63a",w:8},{nm:"40 coins",r:["coins",40],col:"#5d3fd0",w:20}
];
// Fair wheel: each slot is drawn by its published weight and the stop point inside the slot is uniform.
function wheelRoll(){
  var tot=0,i;for(i=0;i<WHEEL.length;i++)tot+=WHEEL[i].w;var x=Math.random()*tot;
  for(i=0;i<WHEEL.length;i++){x-=WHEEL[i].w;if(x<=0)break;}
  return{seg:Math.min(i,WHEEL.length-1),off:rnd(.08,.92)};
}
function wheelGrant(seg){
  var w=WHEEL[seg];
  if(w.jack){var c=Math.round(3000*(1+.15*(S.lvl-1)));S.coins+=c;S.alloy+=40;gem(100);return IC.coin+" "+fmt(c)+" + "+IC.alloy+" 40 + "+IC.gem+" 100";}
  return grant(w.r);
}
// first-time capture milestones pay gems
function milestone(ty){var k="t"+ty;if(S.mile[k])return 0;S.mile[k]=1;var g=[0,10,20,40,100][ty];if(g)gem(g);return g;}

/* ================= offline ================= */
function offlineSim(){
  var away=(now()-S.seen)/1000,out={away:away,raids:[],auto:[]};
  if(away<1200||!S.name)return null;
  S.stats.away+=away;S.stats.sessions++;hit("h7");
  if(S.genU>S.seen){
    var k=Math.min(3,1+Math.floor(away/5400)),wd=W();hit("m10");
    for(var i=0;i<k;i++){var opts=wd.n.filter(function(n){return attackable(wd,n)&&n.ty<=1;});if(!opts.length)break;var n=pick(opts);if(Math.random()<.75){n.o=1;var c=Math.round(T_COIN[n.ty]*.5);S.coins+=c;S.stats.capT[n.ty]++;out.auto.push({nm:n.nm,c:c});}}
  }
  if(S.lvl>=3&&ownedCount()>=4&&S.shieldU<S.seen+away*500){
    var nr=Math.min(3,1+Math.floor(away/7200));
    for(i=0;i<nr;i++){spawnThreatQuiet();if(S.threat){var res=resolveThreat();if(res)out.raids.push(res);}}
  }
  S.threat=null;S.raidT=irnd(120,200);
  return out;
}
function spawnThreatQuiet(){var cfg=S.alertCfg;S.alertCfg={attack:false,land:false,event:false,streak:false,quest:false};spawnThreat();S.alertCfg=cfg;}

/* ================= heartbeat ================= */
var tickN=0,lastOfferCheck=0;
function tick(){
  if(!S||!S.name||document.hidden)return;
  tickN++;S.stats.time++;
  var inc=incomeMin();if(inc>0)S.vault=Math.min(inc*10,S.vault+inc/60);
  if(S.cap>0&&now()>S.capU){alertAdd("land",S.cap+" captives escaped. Nobody fed them.");S.cap=0;S.capCyc=0;hit("h6");}
  if(fedOn()&&S.feedAuto.on&&S.lvl>=6&&S.fedU-now()<4000&&armySize()>0)feed(S.feedAuto.q,true);
  if(S.allyCd>0)S.allyCd--;if(S.campCd>0)S.campCd--;if(S.raidCd>0)S.raidCd--;
  if(!B){
    if(S.threat){S.threat.t--;if(S.threat.t<=0){var r=resolveThreat();if(r&&!r.win)showDefLoss(r);renderAll();}}
    else if(S.lvl>=3&&ownedCount()>=4&&now()>S.shieldU&&modalFree()){S.raidT--;if(S.raidT<=0){spawnThreat();S.raidT=irnd(150,260);renderAll();}}
    if(!S.chest){S.chestT--;if(S.chestT<=0){var wd=W();S.chest={w:S.cur,n:irnd(1,wd.n.length-1),exp:now()+75000};S.chestT=irnd(110,200);hit("h15");}}
    else if(now()>S.chest.exp)S.chest=null;
  }
  if(tickN%5===0){evSync();tourSync();chatTick();if(dayStr()!==S.lastDay){S.lastDay=dayStr();streakSync();if(streakPending&&modalFree()&&!B)showStreak();}checkAch();}
  if(tickN%30===0){var rk=myRank();if(S.lastRank&&rk>S.lastRank){alertAdd("event","You dropped to #"+rk+" on the leaderboard.");hit("h13b");}S.lastRank=rk;}
  if(tickN%20===0)dirty();
  if(!B)liveUpdate();
}
