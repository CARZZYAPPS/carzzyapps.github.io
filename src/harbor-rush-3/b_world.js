
/* ================= LEVEL / WORLD ================= */
var LV=null,CR=null,INP={dir:0,drag:null,act:false},FX=[],POPS=[],SHAKE=0;
var LANE_Y=.62,QUAY_Y=0,WATER_Y=-.55;

function layout(p){
  var slots=[],x=.2,i;
  for(i=0;i<p.l;i++){slots.push({kind:'lane',x:x+.72,stack:[],max:1,i:i});x+=1.5;}
  x+=.3;var yard0=x;
  for(i=0;i<p.y;i++){slots.push({kind:'yard',x:x+.52,stack:[],max:p.h,power:i<(p.pw||0)});x+=1.06;}
  var quayEnd=x+.25,shipStart=quayEnd+.45,sx=shipStart+.38;
  for(i=0;i<p.c;i++){slots.push({kind:'ship',x:sx+.5,stack:[],max:p.h});sx+=1.04;}
  var shipEnd=sx+.3;
  return {slots:slots,yard0:yard0,quayEnd:quayEnd,shipStart:shipStart,shipEnd:shipEnd,minX:-1.6,maxX:shipEnd+1.7,yT:p.h*CH+2.15};
}
function baseY(s){return s.kind==='lane'?LANE_Y:QUAY_Y;}
function topY(s){return baseY(s)+s.stack.length*CH;}
function mkBox(t){return {t:t,thaw:null,id:Math.random()};}

function startLevel(pi,li,endless){
  var P=PORTS[pi],p=Object.assign({},endless?endlessParams():P.lv[li]),L=layout(p),R=mulberry(endless?Math.floor(Math.random()*1e9):pi*977+li*131+7);
  var rules={};(endless?endlessRules():P.rules).forEach(function(r){rules[r]=1;});if(p.w)rules.wind=1;if(p.r)rules.reefer=1;if(p.z)rules.hazmat=1;
  LV={pi:pi,li:li,endless:!!endless,P:P,p:p,L:L,rules:rules,R:R,t:0,score:0,combo:0,best:0,hearts:3,served:0,missed:0,spawned:0,trucks:[],next:1.2,
      perf:0,bumps:0,clangs:0,lost:0,phase:'play',wind:0,windT:rnd(6,10),gust:0,gustDir:1,tutStep:p.tut?0:-1,shipT:0,ships:1,endT:0,
      th:P.th,stats:{perfPts:0,deliverPts:0,pen:0}};
  fillShip(R);
  var x0=L.slots.filter(function(s){return s.kind==='yard';})[0].x;
  CR={x:x0,v:0,a:0,th:0,om:0,L:.9,Lrest:.9,state:'idle',carry:null,stun:0,lastAct:0};
  FX=[];POPS=[];SHAKE=0;
  if(endless)LV.next=.5;
  buildBG();fitView(true);
}
function shipTypes(R){
  var p=LV.p,out=[],k=Math.min(p.k,6),i;
  return function(){var r=R();if(LV.rules.reefer&&r<(p.r||0))return 'reef';r=R();if(LV.rules.hazmat&&r<(p.z||0))return 'haz';return COLOR_ORDER[Math.floor(R()*k)];};
}
function fillShip(R){
  var p=LV.p,ships=LV.L.slots.filter(function(s){return s.kind==='ship';}),tot=Math.max(p.n+3,Math.round(ships.length*p.h*p.f)),tf=shipTypes(R);
  if(LV.endless)tot=Math.round(ships.length*p.h*p.f);
  for(var i=0;i<tot;i++){var room=ships.filter(function(s){return s.stack.length<s.max;});if(!room.length)break;
    room.sort(function(a,b){return a.stack.length-b.stack.length;});var cand=room.filter(function(s){return s.stack.length<=room[0].stack.length+1;});
    cand[Math.floor(R()*cand.length)].stack.push(mkBox(tf()));}
}

/* ---------- trucks ---------- */
function allBoxes(){var a=[];LV.L.slots.forEach(function(s){if(s.kind!=='lane')s.stack.forEach(function(b){a.push(b);});});if(CR.carry)a.push(CR.carry);return a;}
function wantedCounts(){var w={};LV.trucks.forEach(function(t){if(t.state!=='out')w[t.want]=(w[t.want]||0)+1;});return w;}
function chooseWant(){
  var w=wantedCounts(),pool=allBoxes().filter(function(b){if(w[b.t]>0){w[b.t]--;return false;}return true;});
  if(!pool.length)return null;
  if(LV.p.tut&&LV.spawned===0){var tops=pool.filter(function(b){return depthOf(b)===0&&!(CR.carry===b);});if(tops.length)pool=tops;}
  // pick a specific box: favor ones that are not right on top, so you have to dig (more as levels go on)
  var deep=pool.filter(function(b){return depthOf(b)>0;}),dp=LV.p.tut?0:Math.min(.75,.35+.06*LV.li+.06*LV.pi+(LV.endless?.25:0));
  var b=deep.length&&Math.random()<dp?pick(deep):pick(pool);return b.t;
}
function depthOf(b){var r=-1;LV.L.slots.forEach(function(s){var i=s.stack.indexOf(b);if(i>=0)r=s.stack.length-1-i;});return r<0?0:r;}
function freeLane(){var ls=LV.L.slots.filter(function(s){return s.kind==='lane'&&!s.truck;});return ls.length?pick(ls):null;}
function spawnTruck(){
  var lane=freeLane();if(!lane)return false;var want=chooseWant();if(!want)return false;
  var pat=LV.p.p*(1+.08*U('radio'))*(LV.endless?Math.max(.55,1-LV.t/600):1);
  var t={lane:lane,want:want,x:LV.L.minX-2.5,state:'in',pat:pat,max:pat,col:pick(['#e9eef3','#3a7bd5','#e05a47','#2fa36b','#f2b233','#7a5cd6']),honk:0,load:null,bob:0};
  lane.truck=t;LV.trucks.push(t);LV.spawned++;SFX.horn();return true;
}
function truckGone(t){if(t.lane.truck===t)t.lane.truck=null;}
function updTrucks(dt){
  var p=LV.p;
  if(LV.phase==='play'){
    var need=LV.endless?true:LV.spawned<p.n;
    LV.next-=dt;
    if(need&&LV.next<=0){if(spawnTruck())LV.next=LV.endless?Math.max(3.6,9-LV.t/50):rnd(1.2,2.4);else LV.next=.6;
      if(!LV.endless&&LV.spawned===1&&p.l>1)LV.next=Math.max(LV.next,p.tut?99:5);}
    if(!LV.endless&&LV.spawned<p.n&&!LV.trucks.some(function(t){return t.state!=='out';})&&!chooseWantPossible()){LV.p.n=LV.spawned;}
  }
  LV.trucks.slice().forEach(function(t){
    t.bob+=dt;
    if(t.state==='in'){t.x=Math.min(t.lane.x,t.x+dt*6.5*clamp((t.lane.x-t.x)/1.4+.15,.15,1));if(t.lane.x-t.x<.01){t.x=t.lane.x;t.state='wait';}}
    else if(t.state==='wait'){if(LV.phase==='play'&&!(LV.tutStep>=0&&LV.tutStep<4))t.pat-=dt;if(t.honk>0)t.honk-=dt;
      if(t.pat<=0){t.state='out';t.angry=1;truckGone(t);LV.missed++;loseHeart('Truck left empty!');LV.combo=0;addScore(-150,t.x,1.8,'bad');SFX.horn();}}
    else if(t.state==='out'){t.x-=dt*(t.angry?7:5.5);if(t.x<LV.L.minX-3)LV.trucks.splice(LV.trucks.indexOf(t),1);}
  });
}
function chooseWantPossible(){var w=wantedCounts(),n=allBoxes().length,used=0;for(var k in w)used+=w[k];return n>used;}

/* ---------- scoring ---------- */
function comboMult(){return 1+.1*Math.min(LV.combo,20);}
function addScore(n,x,y,cls,txt){LV.score=Math.max(0,LV.score+n);pop(x,y,(txt?txt+' ':'')+(n>=0?'+':'')+fmt(n),cls||(n>=0?'good':'bad'));}
function pop(x,y,txt,cls){POPS.push({x:x,y:y,txt:txt,cls:cls,t:0});}
function loseHeart(msg){LV.hearts--;LV.lost++;callout(msg,LV.hearts>0?LV.hearts+' '+(LV.hearts===1?'heart':'hearts')+' left':'Out of hearts');SFX.bad();SHAKE=Math.max(SHAKE,.18);if(LV.hearts<=0)endLevel(false);}

/* ---------- crane ---------- */
function vmax(){return 3.1+.42*U('motor');}
function hoistSp(){return 2.5+.42*U('hoist');}
function damp(){return .95+.22*U('damper');}
function tolPerf(){return .1+.018*U('spreader');}
function tolLand(){return .33+.035*U('spreader');}
function tolGrab(){return .36+.035*U('spreader');}
function hookX(){return CR.x+CR.L*Math.sin(CR.th);}
function hookY(){return LV.L.yT-CR.L*Math.cos(CR.th);}
function slotUnder(x){var best=null,bd=9;LV.L.slots.forEach(function(s){var d=Math.abs(s.x-x);if(d<bd){bd=d;best=s;}});return bd<=.55?best:null;}
function surfaceAt(x){var L=LV.L;if(x>L.quayEnd&&x<L.shipStart)return WATER_Y;if(x>=L.shipEnd)return WATER_Y;return QUAY_Y;}
function action(){
  if(!LV||LV.phase!=='play')return;audio();
  if(CR.state!=='idle'||CR.stun>0){return;}
  CR.state='down';CR.lastAct=LV.t;
}
function bounce(msg,sub,snd){CR.state='up';if(msg)callout(msg,sub);(snd||SFX.nope)();}
function updCrane(dt){
  var L=LV.L,vm=vmax(),tgt=0,v0=CR.v;
  if(CR.stun>0)CR.stun-=dt;
  if(INP.dir)tgt=INP.dir*vm;else if(INP.drag!=null)tgt=clamp((INP.drag-CR.x)*3.4,-vm,vm);
  var acc=(tgt===0||tgt*CR.v<0)?8:6.5,dv=clamp(tgt-CR.v,-acc*dt,acc*dt);CR.v+=dv;var nx=CR.x+CR.v*dt,lo=L.slots[0].x-.3,hi=L.shipEnd-.15;
  if(nx<lo){nx=lo;CR.v=0;}if(nx>hi){nx=hi;CR.v=0;}CR.x=nx;var a=dt>0?(CR.v-v0)/dt:0;CR.a=a;
  // hoist
  var L0=CR.L;
  if(CR.state==='down')CR.L+=hoistSp()*dt;
  else if(CR.state==='up'){CR.L-=hoistSp()*1.25*dt;if(CR.L<=CR.Lrest){CR.L=CR.Lrest;CR.state='idle';}}
  if(CR.L!==L0){var off=L0*Math.sin(CR.th);CR.th=Math.asin(clamp(off/CR.L,-.95,.95));CR.om*=L0/CR.L;} // keep the sideways offset as the rope pays out
  // wind
  var wind=0;if(LV.rules.wind){wind=LV.wind;}
  // pendulum (substeps)
  var g=13,c=damp(),n=4,h=dt/n;
  for(var i=0;i<n;i++){var al=-(g/CR.L)*Math.sin(CR.th)-(a/CR.L)*Math.cos(CR.th)-c*CR.om+wind*Math.cos(CR.th)/CR.L;CR.om+=al*h;CR.th+=CR.om*h;}
  CR.th=clamp(CR.th,-1.1,1.1);
  if(CR.state==='down')checkContact();
  humSet(Math.abs(CR.v),CR.state!=='idle');
}
function bottomY(){return hookY()-.06-(CR.carry?CH:0);}
function checkContact(){
  var hx=hookX(),by=bottomY(),s=slotUnder(hx);
  // carried box clipping a neighbour stack on the way down
  if(CR.carry){var hit=null;LV.L.slots.forEach(function(o){if(o===s||hit)return;if(Math.abs(o.x-hx)<CW*.98&&by<topY(o)-.03&&(o.kind!=='lane'||o.truck))hit=o;});
    if(hit){clang(hx,by,hit);return;}}
  var top=s?(s.kind==='lane'?(s.truck&&s.truck.state==='wait'?topY(s):LANE_Y-.1):topY(s)):surfaceAt(hx);
  if(by>top)return;
  CR.L-=top-by;   // sit exactly on the contact surface
  if(s&&s.kind==='ship'&&LV.shipT>0){bounce('Ship is away','A fresh one is docking');return;}
  if(!s){bounce(surfaceAt(hx)<0?'That\'s the sea!':'Nothing there','Line up over a stack');return;}
  var off=hx-s.x;
  if(!CR.carry){
    if(s.kind==='lane'||!s.stack.length){bounce('Nothing to grab');return;}
    if(Math.abs(off)>tolGrab()){bounce('Missed!','Center the hook over the box',SFX.clang);CR.om+=-Math.sign(off)*.6;return;}
    var b=s.stack.pop();CR.carry=b;if(s.kind==='ship'&&LV.rules.reefer&&TYPES[b.t].reefer&&b.thaw==null)b.thaw=thawTime();
    SFX.grab();burst(s.x,topY(s)+CH,6,'#ffffff',.6);CR.state='up';tut('grab');return;
  }
  var b2=CR.carry;
  if(s.kind==='lane'){var t=s.truck;if(!t||t.state!=='wait'){bounce('No truck here');return;}
    if(t.want!==b2.t){bounce('Wrong container','This driver wants '+TYPES[t.want].n);t.honk=.6;SFX.horn();return;}}
  else if(s.stack.length>=s.max){bounce('Stack full');return;}
  var ao=Math.abs(off),kind=ao<=tolPerf()?'perf':ao<=tolLand()?'bump':'clang';
  if(kind==='clang'){clang(hx,by,s);return;}
  CR.carry=null;
  if(s.kind==='lane')s.truck.load=b2;else s.stack.push(b2);
  if(s.kind==='ship'&&b2.thaw!=null&&TYPES[b2.t].reefer){} // thaw keeps counting unless powered/ship: handled in rules
  CR.om*=.3;CR.state='up';
  if(kind==='perf'&&s.kind!=='lane'){SFX.perfect();pop(s.x,topY(s)+.4,'NICE','perf');burst(s.x,topY(s)-CH+.05,6,'#fff3c4',.7);}
  else if(kind==='perf'){LV.combo++;LV.perf++;var pp=Math.round(60*comboMult());LV.stats.perfPts+=pp;addScore(pp,s.x,topY(s)+.4,'perf','PERFECT');SFX.perfect();burst(s.x,topY(s)-CH+.05,10,'#fff3c4',.9);}
  else{LV.combo=0;LV.bumps++;LV.stats.pen+=20;addScore(-20,s.x,topY(s)+.4,'bad','BUMP');SFX.bump();SHAKE=Math.max(SHAKE,.12);dust(s.x,topY(s)-CH);
    if(LV.rules.hazmat&&(TYPES[b2.t].hazmat||(s.stack.length>1&&TYPES[s.stack[s.stack.length-2].t].hazmat))){smoke(s.x,topY(s));LV.stats.pen+=100;addScore(-100,s.x,topY(s)+.9,'bad','HAZMAT');callout('Careful with hazmat!','A clang costs a heart');SFX.bad();}}
  if(s.kind==='lane')deliver(s.truck,kind);
  tut('drop');
}
function clang(hx,by,o){
  LV.combo=0;LV.clangs++;LV.stats.pen+=40;addScore(-40,hx,by+.6,'bad','CLANG');SFX.clang();SHAKE=Math.max(SHAKE,.2);sparks(hx,by);
  CR.om+=(hx<o.x?-1:1)*1.4;CR.stun=.45;CR.state='up';
  if(LV.rules.hazmat&&(CR.carry&&TYPES[CR.carry.t].hazmat||o.stack.length&&TYPES[o.stack[o.stack.length-1].t].hazmat)){smoke(hx,by);loseHeart('Hazmat hit!');}
}
function deliver(t,kind){
  var mood=clamp(t.pat/t.max,0,1),pts=Math.round((200+150*mood)*comboMult()*(t.want==='reef'||t.want==='haz'?1.3:1)*(LV.endless?.4:1));
  LV.stats.deliverPts+=pts;addScore(pts,t.x,2,'good','LOADED');LV.served++;SFX.deliver();
  t.state='out';t.happy=1;truckGone(t);LV.next=Math.min(LV.next,LV.endless?LV.next:1.4);confetti(t.x,1.4,14);
  if(!LV.endless&&LV.served+LV.missed>=LV.p.n)LV.endT=.9;
}

/* ---------- rules: reefers, wind ---------- */
function thawTime(){return 26;}
function updRules(dt){
  if(LV.rules.reefer){
    var check=function(b,where){if(!b||!TYPES[b.t].reefer||b.thaw==null)return;var cold=where&&(where.kind==='ship'||where.power);if(cold){b.thaw=Math.min(thawTime(),b.thaw+dt*3);return;}
      b.thaw-=dt;if(b.thaw<=0){b.dead=1;}};
    LV.L.slots.forEach(function(s){if(s.kind!=='lane')s.stack.forEach(function(b){check(b,s);});});check(CR.carry,null);
    LV.L.slots.forEach(function(s){if(s.kind==='lane')return;for(var i=s.stack.length-1;i>=0;i--){var b=s.stack[i];if(b.dead){s.stack.splice(i,1);smoke(s.x,baseY(s)+i*CH+CH/2,'#c9d2d8');spoiled();}}});
    if(CR.carry&&CR.carry.dead){smoke(hookX(),bottomY()+CH/2,'#c9d2d8');CR.carry=null;spoiled();}
  }
  if(LV.rules.wind){
    var w=LV.p.w||1;LV.windT-=dt;
    if(LV.gust>0){LV.gust-=dt;if(LV.gust<=0)LV.windT=rnd(5,9);}
    else if(LV.windT<=0){LV.gust=rnd(2.2,3.6);LV.gustDir=Math.random()<.5?-1:1;SFX.gust();callout('Gust!','Hold steady');}
    var target=(LV.gust>0?LV.gustDir*1.5*w:Math.sin(LV.t*.4)*.35*w);LV.wind=lerp(LV.wind,target,Math.min(1,dt*2));
  }
}
function spoiled(){LV.combo=0;SFX.puff();loseHeart('Reefer spoiled!');
  // any truck waiting on a reefer that no longer exists picks something else
  LV.trucks.forEach(function(t){if(t.state==='wait'&&t.want==='reef'&&!allBoxes().some(function(b){return b.t==='reef';})){var nw=chooseWant();if(nw)t.want=nw;}});}

/* ---------- endless ---------- */
function endlessParams(){var mx=0;for(var pi=0;pi<PORTS.length;pi++)if(portOpen(pi))mx=pi;var w=mx>=1?.9:0,r=mx>=2?.22:0,z=mx>=3?.15:0;
  return {c:6,h:5,f:.62,y:4,l:mx>=2?3:2,n:9999,p:44,k:5,par:0,w:w,r:r,pw:r?2:0,z:z};}
function endlessRules(){return [];}
function updEndless(dt){
  if(!LV.endless)return;
  var ships=LV.L.slots.filter(function(s){return s.kind==='ship';}),n=0;ships.forEach(function(s){n+=s.stack.length;});
  if(LV.shipT>0){LV.shipT-=dt;if(LV.shipT<=0){fillShip(Math.random);LV.ships++;callout('New ship docked','Ship '+LV.ships);SFX.ship();}}
  else if(n<=4&&!(CR.carry&&CR.state!=='idle')){ships.forEach(function(s){s.stack.length=0;});LV.shipT=3;LV.shipOut=0;callout('Ship sailing','Fresh one inbound');SFX.ship();addScore(300,(LV.L.shipStart+LV.L.shipEnd)/2,2.2,'good','TURNAROUND');}
}

/* ---------- step ---------- */
function update(dt){
  if(!LV||LV.phase!=='play')return;
  LV.t+=dt;if(LV.endT>0){LV.endT-=dt;if(LV.endT<=0){endLevel(true);return;}}
  updCrane(dt);updTrucks(dt);updRules(dt);updEndless(dt);
}
