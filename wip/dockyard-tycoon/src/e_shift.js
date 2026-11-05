
/* ================= SHIFT: the stacking yard ================= */
var SH=null,paused=true,W=1,H=1;
function curLoc(){return G.locs[G.act];}
function distOf(loc){return district(loc.city,loc.did);}
function cargoTypes(loc){return IND[loc.ind].cargo.filter(function(t){var C=CT[t];return C&&G.lvl>=C.lvl&&(!C.reefer||U(loc,'power')>0)&&(!C.hazmat||U(loc,'hazmat')>0);});}
function avgVal(loc){var l=cargoTypes(loc);if(!l.length)return 3;var s=0;l.forEach(function(t){s+=CT[t].val;});return s/l.length;}

/* layout: truck lanes at the back, the stacking yard in the middle, ships moored in front; gantries span it all */
function layout(loc,aspect){
  var portrait=aspect<.95,H0=U(loc,'height'),nStd=U(loc,'cols'),nPow=Math.min(U(loc,'power'),nStd),nHz=U(loc,'hazmat'),nCu=U(loc,'customs');
  var kinds=[],i;for(i=0;i<nStd;i++)kinds.push(i<nPow?'power':'std');for(i=0;i<nHz;i++)kinds.push('hazmat');for(i=0;i<nCu;i++)kinds.push('customs');
  var gap=.52,perRow=portrait?7:99,rows=Math.ceil(kinds.length/perRow),cols=[];
  kinds.forEach(function(k,i){var r=Math.floor(i/perRow),inRow=Math.min(perRow,kinds.length-r*perRow),ci=i-r*perRow;cols.push({x:(ci-(inRow-1)/2)*gap-.3,z:-1.35+r*.95,kind:k,max:k==='customs'?1:H0});});
  var lz=cols[cols.length-1].z,lastRow=cols.filter(function(c){return c.z===lz;}),trash={x:Math.max.apply(null,lastRow.map(function(c){return c.x;}))+.62,z:lz};
  var nG=U(loc,'gates'),sgap=Math.min(1.2,(portrait?4.4:8.8)/nG),spots=[],dspots=[];
  for(i=0;i<nG;i++)spots.push({x:(i-(nG-1)/2)*sgap,z:-2.75});
  var rail=U(loc,'rail')>0;if(rail)dspots.push({x:0,z:-5.25});
  var nB=U(loc,'berth'),shipL=6*.38+.95,berths=[];for(i=0;i<nB;i++)berths.push(portrait?{x:0,z:1.25+(rows-1)*.95+i*1.15}:{x:nB===1?0:(i?1:-1)*(shipL/2+.2),z:1.25+(rows-1)*.95});
  var yW=Math.max.apply(null,cols.map(function(c){return Math.abs(c.x);}))+.6;
  var hw=Math.max(yW,trash.x+.4,(nG-1)/2*sgap+.7,(portrait?1:nB)*shipL/2+.2,portrait?2.3:3)+.3;
  return {cols:cols,trash:trash,spots:spots,dspots:dspots,berths:berths,tray:[{x:0,z:-1.35}],tables:[],rows:1,rowZ:[.35],rowW:[0],rowX:[0],
    rx:hw+3.2,hw:hw,portrait:portrait,qEdge:.6+(rows-1)*.95,roadZ:-3.95,railZ:-5.25,backZ:rail?-6.2:-5.2,bayW:Math.min(1,sgap*.9),zBack:-3.2,zFront:1.7+(rows-1)*.95+(portrait&&nB>1?1.15:0),craneTop:Math.max(1.6,(H0+1)*CH+.6),yardRows:rows};
}

/* ---------- ships ---------- */
function pickType(loc){var l=cargoTypes(loc);if(!l.length)return 'gen';var w=l.map(function(t){return CT[t].hazmat?.45:CT[t].reefer?.8:1;}),tot=w.reduce(function(a,b){return a+b;},0),r=Math.random()*tot;for(var i=0;i<l.length;i++){r-=w[i];if(r<=0)return l[i];}return l[0];}
function moveTime(dist){return (.95+dist*.16)*Math.pow(.88,U(SH.loc,'speed'))*Math.pow(.95,G.hq.grind||0)*(SH.slow>0?1.3:1);}
function newShip(bi,mega){
  var loc=SH.loc,D=SH.D,b=SH.L.berths[bi],bays=Math.min(6,2+U(loc,'gates')+Math.floor(loc.days/4)),tiers=Math.min(U(loc,'height')+1,3+(loc.days>=5?1:0));
  var sh={bi:bi,st:'in',t:0,bays:[],mega:!!mega,x:b.x,z:b.z};
  var shp=makeShipG(loc.ind,6,mega);shp.g.position.set(b.x-8,0,b.z);stG.add(shp.g);sh.v=shp;
  var n=0,hp=U(loc,'customs')>0?.16*(D.hold||1):0;
  for(var i=0;i<6;i++){sh.bays.push([]);if(i>=bays&&!mega)continue;var h=mega?tiers:Math.max(1,Math.round(rnd(tiers*.45,tiers)));
    for(var k=0;k<h;k++){var bo=makeBox(pickType(loc),{hold:Math.random()<hp});shp.g.add(bo.g);bo.g.position.set(shp.bayX(i),shp.deckY+k*CH,0);sh.bays[i].push(bo);n++;}}
  sh.max=n;sh.hits=sh.bays.map(function(_,i){return hitBox(.38,1.4,.9,shp.bayX(i),.6,0,shp.g,{ship:sh,bay:i});});
  sh.dep=sh.depMax=(22+n*moveTime(2.6)*1.75)*Math.pow(1.06,holdLv('line'))*(1+Math.max(0,.25-.04*loc.days))*(mega?1.25:1);
  return sh;
}
function shipCount(sh){var n=0;sh.bays.forEach(function(b){n+=b.length;});return n;}
function shipLeave(sh,turned){
  if(sh.st!=='dock')return;sh.st='out';sh.t=0;var pm=priceMult(SH.loc),left=shipCount(sh);
  if(turned){var b=avgVal(SH.loc)*pm*sh.max*.25*(sh.mega?2:1);G.cash+=b;SH.loc.earned+=b;SH.s.bonusShip+=b;SH.s.ships++;var p=Math.round(sh.max*8*(sh.mega?2:1)/5)*5;SH.s.pts+=p;
    var wp=sh.v.g.position.clone().add(V3(0,1.2,0));popWorld(wp,'Turnaround! +'+fmt(b)+'<small>+'+p+' pts</small>','tip');coinsFrom(wp,4);addXP(b*.4/xpScale(SH.loc));repAdd(SH.loc,.02);sfx.horn();}
  else if(left>0){var f=avgVal(SH.loc)*pm*left*.15;G.cash-=f;SH.s.fine+=f;SH.s.missed++;repAdd(SH.loc,-Math.min(.12,.015*left));toast('Ship sailed with '+left+' aboard · demurrage -'+fmt(f),'bad');sfx.horn();shakeCam(.05);
    sh.bays.forEach(function(bay){bay.forEach(function(bo){bo.res=false;});});}
  SH.queue=SH.queue.filter(function(j){if(j.from.k==='ship'&&j.from.s===sh&&!j.grabbed){cancelJob(j);return false;}return true;});
  if(SH.sel&&SH.sel.k==='ship'&&SH.sel.s===sh)SH.sel=null;
}
function updShips(dt,time){
  SH.ships.forEach(function(sh,i){
    sh.t+=dt;var g=sh.v.g,bx0=SH.L.berths[sh.bi].x;
    if(sh.st==='in'){g.position.x=lerp(bx0-8,bx0,easeOut(clamp(sh.t/1.8,0,1)));if(sh.t>=1.8){sh.st='dock';sh.t=0;sfx.horn();}}
    else if(sh.st==='dock'){g.position.x=bx0;if(!(SH.ice>0))sh.dep-=dt;var busy=SH.cranes.some(function(c){return c.job&&c.job.from.k==='ship'&&c.job.from.s===sh&&!c.job.grabbed;});
      if(shipCount(sh)===0&&!busy)shipLeave(sh,true);else if(sh.dep<=0&&!busy)shipLeave(sh,false);}
    else if(sh.st==='out'){g.position.x=lerp(bx0,bx0+9,easeIO(clamp(sh.t/1.4,0,1)));if(sh.t>=1.4){sh.st='away';sh.t=0;sh.away=rnd(7,12)*(SH.loc.days<1?.8:1);g.visible=false;}}
    else if(sh.st==='away'){if(SH.ice>0||SH.phase!=='open')return;if(sh.t>=sh.away){stG.remove(g);var mega=SH.megaNext===i;if(mega){SH.megaNext=null;banner('Mega ship!','Empty it in time for a huge bonus','hot');}SH.ships[i]=newShip(sh.bi,mega);}}
    if(sh.st!=='away'){g.position.y=Math.sin(time*1.2+i)*.025-.02;g.rotation.z=Math.sin(time*.9+i)*.01;}
  });
}

/* ---------- start / teardown ---------- */
function startShift(){
  var loc=curLoc();
  if(SH)teardown();
  var L=layout(loc,W/H),D=distOf(loc),th=IND[loc.ind].theme;
  SH={loc:loc,D:D,L:L,th:th,t:0,len:DAYLEN,phase:'open',cust:[],spots:L.spots.map(function(){return null;}),dspots:L.dspots.map(function(){return null;}),
    ships:[],cranes:[],queue:[],sel:null,next:2.6,pend:[],bots:[],streak:0,bestStreak:0,cid:1,gull:null,ev:{},boost:1,burst:0,burstT:0,heat:false,storm:0,slow:0,ice:0,megaNext:null,
    s:{sales:0,tips:0,cogs:0,wages:0,rent:0,served:0,items:0,walk:0,turned:0,waste:0,xp:0,fame:0,pts:0,perf:0,rep0:loc.rep,vip:0,goal:dayGoal(loc),fine:0,passive:0,ships:0,missed:0,bonusShip:0,trains:0,moves:0,spoiled:0,day:loc.days+1,locName:loc.name}};
  buildShop(loc,L);clearGroup(stG);
  var y=buildYard(L,th);SH.cols=y.cols;SH.bin=y.bin;SH.binHit=y.binHit;
  for(var i=0;i<U(loc,'cranes');i++){var c=makeCrane(th,L.zBack,L.zFront,L.craneTop);c.set(i?1.2:-.6,0,L.craneTop-.45);stG.add(c.g);SH.cranes.push(c);}
  L.berths.forEach(function(b,bi){var sh=newShip(bi);sh.t=-bi*.6;SH.ships.push(sh);});
  SH.selMesh=new THREE.Mesh(new THREE.BoxGeometry(CW+.08,CH+.08,CL+.08),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.42,depthWrite:false}));itemG.add(SH.selMesh);SH.selMesh.visible=false;
  mkBots();initEvents();fitCamera();
  paused=false;G.rebuild=false;
  banner('Day '+(loc.days+1),D.name+' · '+IND[loc.ind].name,'good');
  if(SH.heat)setTimeout(function(){if(SH&&SH.heat)banner('Heatwave','Reefers spoil twice as fast today','hot');},2600);
  sfx.bell();uiReset();
}
function teardown(){clearGroup(itemG);clearGroup(custG);clearGroup(stG);TW.length=0;}
function shiftHits(){var a=SH.cols.map(function(c){return c.hit;});SH.ships.forEach(function(sh){if(sh.st==='dock')a=a.concat(sh.hits);});SH.cust.forEach(function(c){if(c.hit&&c.state==='wait')a.push(c.hit);});a.push(SH.binHit);if(SH.gull)a.push(SH.gull.hit);return a;}

/* ---------- goals and patience ---------- */
function gatesDem(loc){return 4.6+2.4*U(loc,'gates');}
function dayGoal(loc){var D=distOf(loc);return Math.round(gatesDem(loc)*DAYLEN/60*1.3*avgVal(loc)*priceMult(loc)*(D.demand||1)*TM(D.tier).dm*(1+Math.min(2,loc.days*.1))*(loc.days<2?.78:1));}
function diff(){return Math.max(.6,1-.012*SH.loc.days-.005*(G.lvl-1));}
function patienceFor(n,c){var loc=SH.loc,D=SH.D;
  return (1+Math.max(0,.2-.04*loc.days))*(24+11*(n-1))*(D.pat||1)*(1+.05*loc.decor)*(loc.staff.host?1.15:1)*Math.pow(1.05,holdLv('trucking'))*diff()*PRICE_T[loc.price+1].pat*(c.vip?.8:1);}

/* ---------- where things sit ---------- */
function colTopY(c,extra){return (c.stack.length+(extra||0))*CH;}
function boxWorld(b){return b.g.getWorldPosition(V3(0,0,0));}
function deliverable(b){return !b.spoiled&&(!b.hold||b.cleared);}
function topFree(stack){for(var i=stack.length-1;i>=0;i--){if(!stack[i].res)return {b:stack[i],depth:stack.length-1-i};}return null;}
function openWants(){var w={};SH.cust.forEach(function(c){if(c.state!=='wait'&&c.state!=='in')return;c.items.forEach(function(x){if(!x.done&&!x.inc)w[x.t]=(w[x.t]||0)+1;});});return w;}
function available(){var a={};SH.cols.forEach(function(c){c.stack.forEach(function(b){if(!b.res&&!b.spoiled)a[b.t]=(a[b.t]||0)+1;});});SH.ships.forEach(function(sh){if(sh.st!=='dock'&&sh.st!=='in')return;sh.bays.forEach(function(bay){bay.forEach(function(b){if(!b.res)a[b.t]=(a[b.t]||0)+1;});});});return a;}

/* ---------- crane jobs ---------- */
function canPlace(b,c){if(b.spoiled)return 'Spoiled cargo can only go in the scrap skip.';
  if(c.stack.length+c.inc>=c.max)return 'That column is full.';
  if(CT[b.t].hazmat&&c.kind!=='hazmat')return 'Hazmat only goes in the hazmat bay.';
  if(!CT[b.t].hazmat&&c.kind==='hazmat')return 'The hazmat bay is for fuel and oil only.';
  if(c.kind==='customs'&&!(b.hold&&!b.cleared))return 'The customs lane is for containers on hold.';
  return '';}
function enqueue(from,to,box,silent){
  if(SH.queue.length>=6){if(!silent){toast('The crane queue is full.','bad');sfx.nope();}return false;}
  var j={from:from,to:to,box:box};box.res=true;
  if(to.k==='col')SH.cols[to.i].inc++;if(to.k==='truck')to.c.items[to.j].inc=true;
  SH.queue.push(j);if(!silent){sfx.sel();tutNote('queue');}return true;}
function cancelJob(j){j.box.res=false;if(j.to.k==='col')SH.cols[j.to.i].inc=Math.max(0,SH.cols[j.to.i].inc-1);if(j.to.k==='truck'&&j.to.c.items[j.to.j])j.to.c.items[j.to.j].inc=false;}
function srcStack(f){return f.k==='col'?SH.cols[f.i].stack:f.s.bays[f.b];}
function jobReady(j){var st=srcStack(j.from);if(st[st.length-1]!==j.box)return false;if(j.from.k==='ship'&&j.from.s.st!=='dock')return false;if(j.to.k==='truck'&&(j.to.c.state!=='wait'||j.to.c.paid))return false;return true;}
function jobDead(j){var st=srcStack(j.from);if(st.indexOf(j.box)<0)return true;if(j.to.k==='truck'&&(j.to.c.state==='out'||j.to.c.paid))return true;if(j.from.k==='ship'&&j.from.s.st!=='dock'&&j.from.s.st!=='in')return true;return false;}
function dstPos(to){if(to.k==='col'){var c=SH.cols[to.i];return V3(c.x,colTopY(c),c.z);}
  if(to.k==='truck'){var cu=to.c;if(cu.kind==='train')return cu.v.carOf(to.j).localToWorld(V3(0,.29,0));var lp=cu.v.loadPos(to.j,cu.items.length);return (cu.v.bed||cu.v.body||cu.v.root).localToWorld(lp.clone());}
  return SH.bin.position.clone().add(V3(0,.3,0));}
function updCranes(dt){
  SH.queue=SH.queue.filter(function(j){if(!j.taken&&jobDead(j)){cancelJob(j);return false;}return true;});
  SH.cranes.forEach(function(cr){
    if(!cr.job){var j=null;for(var i=0;i<SH.queue.length;i++){var q=SH.queue[i];if(q.taken||!jobReady(q))continue;
        if(SH.cranes.length>1){var other=SH.cranes.filter(function(o){return o!==cr&&o.job;})[0];if(other){var qx=boxWorld(q.box).x;if(Math.abs(qx-other.x)<.9)continue;}}
        j=q;break;}
      if(!j){cr.lamp.emissive.setHex(0x222222);cr.idle=(cr.idle||0)+dt;if(cr.idle>.8){var ci=SH.cranes.indexOf(cr),xs=SH.cols.map(function(c){return c.x;}),px=ci?SH.L.trash.x+.55:Math.min.apply(null,xs)-.6,k0=Math.min(1,dt*2.5);cr.set(lerp(cr.x,px,k0),lerp(cr.z,SH.L.cols[0].z-.9,k0),lerp(cr.y,SH.L.craneTop-.45,k0));}return;}
      cr.idle=0;
      j.taken=true;cr.job=j;j.t=0;var sp0=boxWorld(j.box),dp=dstPos(j.to);j.src=sp0;j.dst=dp;j.c0={x:cr.x,z:cr.z,y:cr.y};
      j.dur=moveTime(Math.abs(cr.x-sp0.x)+Math.abs(cr.z-sp0.z)*.6)*.55+moveTime(Math.abs(sp0.x-dp.x)+Math.abs(sp0.z-dp.z)*.6);j.grabbed=false;cr.lamp.emissive.setHex(0xffb21f);}
    var j2=cr.job;j2.t+=dt;var k=clamp(j2.t/j2.dur,0,1),Hs=SH.L.craneTop-.35,s=j2.src,d=j2.dst,c0=j2.c0;
    if(j2.grabbed&&j2.to.k==='truck'&&j2.to.c.state==='wait'){d=j2.dst=dstPos(j2.to);}
    if(k<.24){var a=easeIO(k/.24);cr.set(lerp(c0.x,s.x,a),lerp(c0.z,s.z,a),lerp(c0.y,Hs,Math.min(1,a*2)));}
    else if(k<.36){cr.set(s.x,s.z,lerp(Hs,s.y+CH+.02,easeIO((k-.24)/.12)));}
    else if(k<.48){if(!j2.grabbed)grab(cr,j2);cr.set(s.x,s.z,lerp(s.y+CH+.02,Hs,easeIO((k-.36)/.12)));}
    else if(k<.82){var b2=easeIO((k-.48)/.34);cr.set(lerp(s.x,d.x,b2),lerp(s.z,d.z,b2),Hs);}
    else if(k<.95){cr.set(d.x,d.z,lerp(Hs,d.y+CH+.02,easeIO((k-.82)/.13)));}
    else{if(!j2.done)release(cr,j2);cr.set(d.x,d.z,lerp(d.y+CH+.02,d.y+CH+.4,(k-.95)/.05));}
    if(k>=1){cr.job=null;var qi=SH.queue.indexOf(j2);if(qi>=0)SH.queue.splice(qi,1);}
  });
}
function grab(cr,j){j.grabbed=true;var st=srcStack(j.from),i=st.indexOf(j.box);if(i>=0)st.splice(i,1);var b=j.box;cr.spreader.add(b.g);b.g.position.set(0,-CH-.02,0);b.g.rotation.set(0,0,0);b.g.scale.setScalar(1);sfx.clunk();
  if(SH.sel&&SH.sel.b===b)SH.sel=null;}
function release(cr,j){j.done=true;var b=j.box,t=j.to;cr.spreader.remove(b.g);SH.s.moves++;b.res=false;
  if(t.k==='col'){var c=SH.cols[t.i];c.inc=Math.max(0,c.inc-1);if(c.stack.length>=c.max){scrapBox(b);toast('No room — container scrapped','bad');return;}itemG.add(b.g);b.g.position.set(c.x,c.stack.length*CH,c.z);c.stack.push(b);squash(b.g);sfx.clunk();if(c.kind==='customs')c.insp=0;}
  else if(t.k==='truck')loadOnto(t.c,t.j,b);
  else scrapBox(b);}
function scrapBox(b){itemG.add(b.g);b.g.position.copy(SH.bin.position).add(V3(0,.5,0));fly(b.g,SH.bin.position.clone().add(V3(0,.05,0)),.25,0,function(){itemG.remove(b.g);squash(SH.bin);});
  var c=b.spoiled?CT[b.t].val*priceMult(SH.loc)*.2:CT[b.t].val*priceMult(SH.loc)*.4;G.cash-=c;SH.s.cogs+=c;SH.s.waste++;SH.s.pts=Math.max(0,SH.s.pts-(b.spoiled?3:10));sfx.bin();}
function loadOnto(c,j,b){var x=c.items[j];x.inc=false;if(c.state!=='wait'||c.paid){scrapBox(b);return;}
  if(c.kind==='train'){var car=c.v.carOf(j);car.add(b.g);b.g.position.set(0,.29,0);b.g.rotation.set(0,Math.PI/2,0);}
  else{var h=c.v.bed||c.v.body||c.v.root;h.add(b.g);b.g.position.copy(c.v.loadPos(j,c.items.length));b.g.rotation.set(0,0,0);if(c.kind==='person')b.g.scale.setScalar(.55);}
  x.done=true;c.dirty=true;SH.s.items++;if(c.v.hop)c.v.hop();sfx.serve();tutNote('serve');
  if(c.items.every(function(q){return q.done;}))payFull(c);}

/* ---------- player input ---------- */
function selectFrom(ref){var st=srcStack(ref),tf=topFree(st);if(!tf||tf.depth>0){if(st.length&&st[st.length-1].res)toast('That one is already queued.');sfx.nope();return;}
  SH.sel={k:ref.k,i:ref.i,s:ref.s,bay:ref.b,b:tf.b};sfx.sel();tutNote('sel');}
function selRef(){var s=SH.sel;return s.k==='col'?{k:'col',i:s.i}:{k:'ship',s:s.s,b:s.bay};}
function tapCol(i){
  var c=SH.cols[i];
  if(SH.sel){if(SH.sel.k==='col'&&SH.sel.i===i){SH.sel=null;sfx.sel();return;}
    var b=SH.sel.b,why=canPlace(b,c);if(why){toast(why,'bad');sfx.nope();return;}
    if(enqueue(selRef(),{k:'col',i:i},b))SH.sel=null;return;}
  if(!c.stack.length){toast('Empty column. Pick a container from the ship first.');return;}
  selectFrom({k:'col',i:i});
}
function tapShip(sh,bay){
  if(sh.st!=='dock'){toast('That ship is still mooring.');return;}
  if(SH.sel&&SH.sel.k==='ship'&&SH.sel.s===sh&&SH.sel.bay===bay){SH.sel=null;sfx.sel();return;}
  if(!sh.bays[bay].length){if(SH.sel)toast('You can\'t load containers back onto the ship.');return;}
  selectFrom({k:'ship',s:sh,b:bay});
}
function wantIndex(c,b){for(var j=0;j<c.items.length;j++){var x=c.items[j];if(!x.done&&!x.inc&&x.t===b.t)return j;}return -1;}
function wantNames(c){return c.items.filter(function(x){return !x.done;}).map(function(x){return CT[x.t].name.toLowerCase();}).join(' + ');}
function tapCust(c){
  if(c.state!=='wait'||c.paid)return;
  if(SH.sel){var b=SH.sel.b,j=wantIndex(c,b);
    if(j<0){toast('This driver wants '+wantNames(c)+'.');sfx.nope();if(c.v.shake)c.v.shake();return;}
    if(!deliverable(b)){toast(b.spoiled?'That one is spoiled. Scrap it.':'On customs hold. Drop it in the customs lane first.','bad');sfx.nope();return;}
    if(enqueue(selRef(),{k:'truck',c:c,j:j},b))SH.sel=null;return;}
  var best=findMatch(c);
  if(best){enqueue(best.from,{k:'truck',c:c,j:best.j},best.b);return;}
  toast('Nothing on top matches '+wantNames(c)+'. Dig it out first.');sfx.nope();
}
function findMatch(c,yardOnly){var best=null;
  c.items.forEach(function(x,j){if(x.done||x.inc||best)return;
    SH.cols.forEach(function(col,ci){if(best)return;var t=col.stack[col.stack.length-1];if(t&&!t.res&&t.t===x.t&&deliverable(t))best={from:{k:'col',i:ci},b:t,j:j,col:col};});
    if(yardOnly)return;
    SH.ships.forEach(function(sh){if(best||sh.st!=='dock')return;sh.bays.forEach(function(bay,bi){if(best)return;var t=bay[bay.length-1];if(t&&!t.res&&t.t===x.t&&deliverable(t))best={from:{k:'ship',s:sh,b:bi},b:t,j:j};});});});
  return best;}
function tapBin(){if(!SH.sel){toast('Pick a container first, then tap the scrap skip.');return;}var b=SH.sel.b;if(enqueue(selRef(),{k:'scrap'},b))SH.sel=null;}

/* ---------- trucks, trains, passengers ---------- */
function spawnCust(opt){
  opt=opt||{};var rail=!!opt.courier,arr=rail?SH.dspots:SH.spots,free=[];arr.forEach(function(s,i){if(!s)free.push(i);});if(!free.length)return false;
  var av=available(),w=openWants(),pool=[];Object.keys(av).forEach(function(t){var n=av[t]-(w[t]||0);for(var i=0;i<n;i++)pool.push(t);});
  var D=SH.D,loc=SH.loc,n=rail?(3+(Math.random()<.4?1:0)):(Math.random()<Math.min(.45,.12+loc.days*.04+(D.big?.25:0))?2:1);
  if(loc.days<1&&G.lvl<3)n=Math.min(n,1);
  if(opt.insp)n=1;
  if(pool.length<n)return false;
  var items=[];for(var i=0;i<n;i++){var k=Math.floor(Math.random()*pool.length);items.push({t:pool[k],done:false,inc:false});pool.splice(k,1);}
  var si=pick(free),p=(rail?SH.L.dspots:SH.L.spots)[si],side=Math.random()<.5?-1:1,L=SH.L,ct=IND[loc.ind].cust;
  var vip=!rail&&!opt.insp&&(!!opt.vip||(loc.days>=2&&Math.random()<.06));
  var c={id:SH.cid++,spot:si,courier:rail,x:p.x,z:p.z,state:'in',vip:vip,insp:!!opt.insp,board:false,speed:rail?2.4:ct==='person'?rnd(2.3,2.9):rnd(3,3.6),yaw:0,yawT:0,dirty:true,say:null,sayT:0,moving:true,rev:0,kind:rail?'train':ct,items:items};
  if(rail){c.pos=V3(-(L.rx+7),0,p.z);c.path=[V3(p.x,0,p.z)];c.yawFix=-Math.PI/2;}
  else if(ct==='person'){c.pos=V3(side*(L.rx-.4),0,L.roadZ+.3);c.path=[V3(p.x+side*.25,0,L.roadZ+.3),V3(p.x,0,p.z+.2)];}
  else{c.pos=V3(side*(L.rx+4),0,L.roadZ);c.path=[V3(p.x,0,L.roadZ),V3(p.x,0,p.z)];}
  c.v=makeCustomer(D,{vip:vip,insp:c.insp,rail:rail,n:n});
  c.max=c.pat=patienceFor(n,c)*(rail?1.45:1);
  c.hit=hitBox(rail?n*.82+1:.9,1.3,rail?.7:1.5,0,.6,0,c.v.root,{cust:c});
  arr[si]=c;SH.cust.push(c);custG.add(c.v.root);c.v.root.position.copy(c.pos);
  c.yaw=Math.atan2(c.path[0].x-c.pos.x,c.path[0].z-c.pos.z)+(c.yawFix||0);c.v.root.rotation.y=c.yaw;
  if(rail){SH.s.trains++;banner('Freight train','Fill every car for a big payout','hot');sfx.train&&sfx.train();}
  if(vip){SH.s.vip++;banner('Shipping magnate','Triple fees. Triple the stakes.','hot');}
  if(c.insp)banner('Port inspector','No spoiled cargo in the yard!','cool');
  return true;
}
function say(c,text,kind,dur){c.say={text:text,kind:kind||''};c.sayT=dur||2;c.dirty=true;}
function freeSpot(c){var arr=c.courier?SH.dspots:SH.spots;if(arr[c.spot]===c)arr[c.spot]=null;}
function custLeave(c,happy){
  c.state='out';freeSpot(c);var L=SH.L,side=c.x<0?-1:1;
  if(c.kind==='train')c.path=[V3(L.rx+8+c.items.length*.82,0,c.z)];
  else if(c.kind==='person')c.path=[V3(c.x,0,L.roadZ+.3),V3(side*(L.rx-.3),0,L.roadZ+.3)];
  else{c.rev=1;c.path=[V3(c.x,0,L.roadZ),V3(side*(L.rx+5),0,L.roadZ)];}
  if(c.v.setMood)c.v.setMood(happy?'happy':'angry');c.dirty=true;if(!happy&&c.kind!=='person')sfx.honk&&sfx.honk();
  SH.queue=SH.queue.filter(function(j){if(j.to.k==='truck'&&j.to.c===c&&!j.taken){cancelJob(j);return false;}return true;});
}
var HAPPY=['Thanks!','Perfect!','Right on time.','Smooth!','You rock!','Nice work!'];
function streakMult(){return 1+.06*Math.min(SH.streak,12);}
function comboMult(){return 1+.1*Math.min(SH.streak,20);}
function payFull(c){
  var loc=SH.loc,base=0;c.items.forEach(function(x){base+=CT[x.t].val;});base*=priceMult(loc)*(c.courier?1.6*Math.pow(1.05,holdLv('rail')):1);
  var mood=clamp(c.pat/c.max,0,1),tip=base*(.04+.3*mood)*(SH.D.tips||1)*(1+.05*loc.decor)*streakMult()*(c.vip?3:1)*(c.board?2:1);
  earn(base,tip,c);scorePts(c,mood);SH.streak++;SH.bestStreak=Math.max(SH.bestStreak,SH.streak);
  repAdd(loc,(.004+.01*mood)*(c.vip?3:1));addFame((.06+.06*mood)*(c.vip?4:1));
  if(c.insp&&!c.fined){repAdd(loc,.25);addFame(2);say(c,'Clean yard. Well done.','good',2.2);}
  else say(c,c.vip?pick(['Impressive operation.','I will send more ships.','First class.']):pick(HAPPY),'good',1.8);
  sparkle(custTop(c).add(V3(0,.2,0)),c.vip?16:8);
  if([3,5,8,12,20].indexOf(SH.streak)>=0)banner(SH.streak+' combo!','Points ×'+comboMult().toFixed(1)+' · Fees ×'+streakMult().toFixed(2),'good');
  c.paid=true;c.leaveT=.5;sfx.cash();
}
function custTop(c){var y=c.kind==='train'?1.3:c.kind==='person'?2.1:1.35;return V3(c.pos.x,y,c.pos.z);}
function scorePts(c,mood){
  var n=c.items.length,base=30*n+(n>1?16*(n-1):0),spd=1+mood,perf=mood>=.7;
  var p=Math.round(base*spd*comboMult()*(c.vip?3:1)*(c.courier?1.2:1)*(perf?1.25:1)/5)*5;
  SH.s.pts+=p;SH.s.opts=(SH.s.opts||0)+p;if(perf)SH.s.perf++;
  popWorld(custTop(c).add(V3(0,.75,0)),(perf?'<i>PERFECT</i>':'')+'+'+p.toLocaleString()+' pts'+(SH.streak>=2?'<small>x'+comboMult().toFixed(1)+'</small>':''),'pts');
}
function earn(base,tip,c){
  var loc=SH.loc,cogs=base*costRate(loc);
  G.cash+=base+tip-cogs;loc.earned+=base+tip-cogs;G.stats.earned+=base+tip-cogs;
  SH.s.sales+=base;SH.s.tips+=tip;SH.s.cogs+=cogs;SH.s.served++;
  var xp=(base+tip)*1.1/Math.max(1,xpScale(loc));addXP(xp);SH.s.xp+=xp;G.stats.served++;
  var p=custTop(c).add(V3(0,.3,0));popWorld(p,'+'+fmt(base)+(tip>=.01?'<small>+'+fmt(tip)+'</small>':''),'');coinsFrom(p,Math.min(6,2+Math.round(tip)));
}
function walkout(c){
  var loc=SH.loc,base=0;c.items.forEach(function(x){if(x.done)base+=CT[x.t].val;});if(base)earn(base*priceMult(loc),0,c);
  repAdd(loc,-(c.vip?.35:.09));addFame(c.vip?-6:-.3);
  if(SH.streak>=3)toast('Combo lost','bad');SH.streak=0;SH.s.walk++;SH.s.pts=Math.max(0,SH.s.pts-40);popWorld(custTop(c).add(V3(0,.6,0)),'-40 pts','bad');
  say(c,pick(['Forget it.','Too slow!','I\'m out.','Ugh.','Not waiting.']),'bad',2);if(c.v.shake)c.v.shake();shakeCam(.05);sfx.bad();
  custLeave(c,false);
}
function updCust(dt,time){
  SH.cust.slice().forEach(function(c){
    if(c.path.length){var tg=c.path[0],dx=tg.x-c.pos.x,dz=tg.z-c.pos.z,d=Math.hypot(dx,dz),stp=c.speed*dt*(c.kind==='train'&&c.state==='in'?clamp(d/1.5,.25,1):1);
      if(d<=stp){c.pos.x=tg.x;c.pos.z=tg.z;c.path.shift();if(c.rev&&!c.path.length)c.rev=0;}else{c.pos.x+=dx/d*stp;c.pos.z+=dz/d*stp;}
      if(d>.01)c.yawT=Math.atan2(c.rev?-dx:dx,c.rev?-dz:dz)+(c.yawFix||0);c.moving=true;}else c.moving=false;
    if(c.state==='in'&&!c.path.length){c.state='wait';c.dirty=true;if(c.v.hop)c.v.hop();sfx.pop();}
    else if(c.state==='wait'&&c.paid){c.leaveT-=dt;if(c.leaveT<=0)custLeave(c,true);}
    else if(c.state==='wait'){
      var busy=SH.queue.some(function(j){return j.to.k==='truck'&&j.to.c===c&&j.taken;})||SH.bots.some(function(b){return b.task&&b.task.c===c;});
      c.pat-=dt*(c.board?2.1:1)*(busy?.25:1);
      var f=c.pat/c.max;if(c.v.setMood)c.v.setMood(f>.66?'ok':f>.33?'meh':'angry');
      if(c.insp&&!c.fined&&SH.cols.some(function(cl){return cl.stack.some(function(b){return b.spoiled;});})){c.fined=true;var fine=Math.round(40*TM(SH.D.tier).pm*IND[SH.loc.ind].pm);G.cash-=fine;SH.s.fine+=fine;repAdd(SH.loc,-.3);say(c,'Spoiled cargo in the yard! Fined '+fmt(fine)+'.','bad',3);sfx.bad();shakeCam(.08);}
      if(c.pat<=0)walkout(c);
    }
    else if(c.state==='out'&&!c.path.length){custG.remove(c.v.root);SH.cust.splice(SH.cust.indexOf(c),1);return;}
    if(c.sayT>0){c.sayT-=dt;if(c.sayT<=0){c.say=null;c.dirty=true;}}
    var ty=c.moving?c.yawT:(c.kind==='train'?c.yawFix+Math.PI/2:0),dy=ty-c.yaw;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;c.yaw+=dy*Math.min(1,dt*(c.kind==='person'?10:6));
    c.v.root.position.set(c.pos.x,0,c.pos.z);c.v.root.rotation.y=c.yaw;animCust(c.v,dt,time,c.moving);
  });
}

/* ---------- yard life: reefers spoil without power, customs inspects holds ---------- */
function reefTime(){return 26*Math.pow(1.1,holdLv('cold'))/(SH.D.reef||1)/(SH.heat?2:1);}
function updYard(dt,time){
  var rt=reefTime();
  SH.cols.forEach(function(c){
    c.stack.forEach(function(b){if(CT[b.t].reefer&&!b.spoiled&&c.kind!=='power'){b.spoil+=dt/rt;if(b.spoil>=1){b.setSpoiled();SH.s.spoiled++;toast(CT[b.t].name+' spoiled! Scrap it.','bad');sfx.burn&&sfx.burn();puff(boxWorld(b).add(V3(0,.35,0)),{color:0x6a5a4a,a:.6,s1:.35});}}
      else if(c.kind==='power'&&b.spoil>0)b.spoil=Math.max(0,b.spoil-dt/20);});
    if(c.kind==='customs'){var b=c.stack[0];if(b&&b.hold&&!b.cleared){c.insp+=dt*(SH.loc.staff.finisher?2:1);if(c.insp>=5){b.cleared=true;b.setHold();sfx.ding&&sfx.ding();sparkle(boxWorld(b).add(V3(0,.35,0)),6,0x5ee39a);}}}
  });
  SH.cols.forEach(function(c){c.ring.visible=!!(SH.sel&&canPlace(SH.sel.b,c)==='');});
  var s=SH.sel;if(s&&s.b&&!s.b.res){SH.selMesh.position.copy(boxWorld(s.b)).add(V3(0,CH/2,0));SH.selMesh.visible=true;SH.selMesh.scale.setScalar(1+Math.sin(time*8)*.04);}else{SH.selMesh.visible=false;if(s&&s.b&&s.b.res)SH.sel=null;}
}

/* ---------- crew ---------- */
function mkBots(){var loc=SH.loc;SH.bots=[];['barista','server'].forEach(function(r){for(var i=0;i<(loc.staff[r]||0);i++)SH.bots.push({role:r,name:staffName(loc,r,i),t:0,dur:1,idle:rnd(0,1),task:null,act:'Waiting'});});}
function staffName(loc,r,i){return FIRST[(loc.id*7+ROLE_ORDER.indexOf(r)*5+i*3)%FIRST.length];}
function botDur(b){return ROLES[b.role].act*Math.pow(.94,G.hq.training||0)*(SH.loc.staff.manager?.92:1);}
function bestCol(b){var w=openWants(),best=-1,bs=-1e9;
  SH.cols.forEach(function(c,i){if(canPlace(b,c))return;var top=c.stack[c.stack.length-1],s=-(c.stack.length+c.inc)*1.2;
    if(CT[b.t].reefer)s+=c.kind==='power'?8:-6;if(b.hold&&!b.cleared)s+=c.kind==='customs'?9:-2;if(c.kind==='power'&&!CT[b.t].reefer)s-=3;
    if(top&&w[top.t])s-=4;if(s>bs){bs=s;best=i;}});return best;}
function updBots(dt){
  SH.bots.forEach(function(b){
    if(b.task){b.t+=dt;if(b.t>=b.dur){var t=b.task;b.task=null;b.act='Waiting';straddleDone(t);}return;}
    if(SH.phase==='done')return;b.idle+=dt;if(b.idle<botDur(b)*.5)return;b.idle=0;
    if(b.role==='barista'){if(SH.queue.length>1)return;
      var w=openWants(),ps=null;SH.ships.forEach(function(sh){if(sh.st!=='dock')return;sh.bays.forEach(function(bay,bi){var t=bay[bay.length-1];if(!t||t.res)return;var sc=(w[t.t]?2:0)+bay.length*.1;if(!ps||sc>ps.sc)ps={sc:sc,sh:sh,bi:bi,b:t};});});
      if(!ps)return;var to=null;
      if(w[ps.b.t]&&deliverable(ps.b))SH.cust.forEach(function(c){if(!to&&c.state==='wait'&&!c.paid){var j=wantIndex(c,ps.b);if(j>=0)to={k:'truck',c:c,j:j};}});
      if(!to){var ci=bestCol(ps.b);if(ci<0)return;to={k:'col',i:ci};}
      enqueue({k:'ship',s:ps.sh,b:ps.bi},to,ps.b,true);b.act='Queued a lift';
    }
    if(b.role==='server'){var found=null;
      SH.cust.forEach(function(c){if(found||c.state!=='wait'||c.paid)return;var m=findMatch(c,true);if(m)found={c:c,j:m.j,col:m.col,b:m.b};});
      if(!found)return;found.b.res=true;found.c.items[found.j].inc=true;b.task={c:found.c,j:found.j,col:found.col,b:found.b};b.t=0;b.dur=botDur(b);b.act='Driving to a truck';
    }
  });
}
function straddleDone(t){var col=t.col,b=t.b,i=col.stack.indexOf(b);if(i!==col.stack.length-1||t.c.state!=='wait'||t.c.paid){b.res=false;t.c.items[t.j].inc=false;return;}
  col.stack.pop();var dest=dstPos({k:'truck',c:t.c,j:t.j});fly(b.g,dest,.5,.6,function(){b.res=false;itemG.remove(b.g);loadOnto(t.c,t.j,b);});}

/* ---------- port events ---------- */
function initEvents(){
  var E=SH.D.ev||[],ev=SH.ev;
  if(E.indexOf('gull')>=0)ev.gull=rnd(18,28);
  if(E.indexOf('barges')>=0)ev.barges=rnd(22,32);
  if(E.indexOf('convoy')>=0)ev.convoy=rnd(18,28);
  if(E.indexOf('heat')>=0&&Math.random()<.6)SH.heat=true;
  if(E.indexOf('ice')>=0)ev.ice=rnd(30,50);
  if(E.indexOf('lock')>=0)ev.lock=rnd(35,45);
  if(E.indexOf('fog')>=0){ev.fog=rnd(12,20);SH.fogOn=false;}
  var ip=E.indexOf('inspector')>=0?.6:.18;if(SH.loc.days>=3&&Math.random()<ip)ev.insp=rnd(30,SH.len-30);
  if(SH.D.big)ev.group=rnd(30,45);
  if(SH.loc.days>=2&&Math.random()<.45)ev.mega=rnd(20,70);
  if(SH.loc.days>=3&&Math.random()<.35)ev.squall=rnd(40,100);
}
function updEvents(dt){
  var ev=SH.ev;if(SH.slow>0)SH.slow-=dt;if(SH.phase!=='open')return;
  for(var k in ev){ev[k]-=dt;if(ev[k]>0)continue;
    if(k==='gull'){if(!SH.gull&&SH.cols.some(function(c){return c.stack.length;}))gullStart();ev.gull=rnd(22,34);}
    else if(k==='barges'){SH.burst+=3;banner('Barge convoy!','Here come the trucks','hot');ev.barges=rnd(32,46);}
    else if(k==='group'){SH.burst+=3;banner('Night rush','A line of trucks at the gate','hot');ev.group=rnd(35,50);}
    else if(k==='convoy'){var w=SH.cust.filter(function(c){return c.state==='wait'&&!c.board&&!c.courier&&!c.paid;});w.slice(0,2).forEach(function(c){c.board=true;c.dirty=true;});if(w.length)banner('Convoy deadline','Rush them for double fees','hot');ev.convoy=rnd(24,36);}
    else if(k==='ice'){SH.ice=16;SH.boost=.25;banner('Pack ice','The harbor is frozen in','cool');ev.ice=rnd(45,65);}
    else if(k==='lock'){SH.ships.forEach(function(sh){if(sh.st==='away')sh.away=0;});banner('Lock opens!','The next ships come straight in','hot');ev.lock=rnd(40,55);}
    else if(k==='fog'){SH.fogOn=!SH.fogOn;SH.boost=SH.fogOn?.3:2.3;if(SH.fogOn)banner('Fog rolls in','Dead quiet for a bit','cool');else banner('Fog lifts','Every truck at once!','hot');ev.fog=SH.fogOn?rnd(14,20):rnd(12,16);}
    else if(k==='insp'){spawnCust({insp:true});delete ev.insp;}
    else if(k==='mega'){SH.megaNext=Math.floor(Math.random()*SH.ships.length);toast('A mega ship is next in line','good');delete ev.mega;}
    else if(k==='squall'){SH.slow=14;banner('Squall','The crane slows down in the wind','cool');delete ev.squall;}
  }
  if(SH.ice>0){SH.ice-=dt;if(SH.ice<=0){SH.ice=0;SH.boost=2.2;SH.storm=-12;banner('Ice breaks','Ships and trucks pour in','hot');}}
  else if(SH.storm<0){SH.storm+=dt;if(SH.storm>=0){SH.storm=0;SH.boost=1;}}
}
function gullStart(){
  var cs=SH.cols.filter(function(c){var t=c.stack[c.stack.length-1];return t&&!t.res&&!t.spoiled;});if(!cs.length)return;
  var col=pick(cs),m=makeGull(),side=Math.random()<.5?-1:1;custG.add(m.g);
  var from=V3(side*(SH.L.rx-.5),3,-1),to=V3(col.x,colTopY(col)+.3,col.z);m.g.position.copy(from);m.g.rotation.y=side>0?Math.PI:0;
  var hit=hitBox(.9,.7,.9,0,0,0,m.g,{gull:1});SH.gull={m:m,col:col,b:col.stack[col.stack.length-1],t:0,dur:2.6,from:from,to:to,side:side,hit:hit,phase:'in'};
  sfx.gull&&sfx.gull();banner('Seagull!','Tap it before it wrecks a container','hot');
}
function updGull(dt,time){
  var g=SH.gull;if(!g)return;g.t+=dt;if(g.m.wings)g.m.wings.forEach(function(w,i){w.rotation.x=(i?1:-1)*Math.sin(time*18)*.7;});
  if(g.phase==='in'){var k=Math.min(1,g.t/g.dur);g.m.g.position.lerpVectors(g.from,g.to,easeIO(k));g.m.g.position.y+=Math.sin(k*Math.PI)*.6;
    if(k>=1){var top=g.col.stack[g.col.stack.length-1];if(top&&top===g.b&&!top.res){top.setSpoiled();toast('The seagull wrecked a container!','bad');for(var i=0;i<5;i++)puff(g.to,{color:0xffffff,a:.7,s1:.3});}
      g.phase='out';g.t=0;g.from=g.m.g.position.clone();g.to=V3(-g.side*(SH.L.hw+4),4,-2);g.m.g.rotation.y+=Math.PI;}}
  else{var k2=Math.min(1,g.t/1.6);g.m.g.position.lerpVectors(g.from,g.to,easeIO(k2));if(k2>=1){custG.remove(g.m.g);SH.gull=null;}}
}
function shooGull(){var g=SH.gull;if(!g||g.phase!=='in')return;g.phase='out';g.t=0;g.from=g.m.g.position.clone();g.to=V3(-g.side*(SH.L.hw+4),4.5,-2);g.m.g.rotation.y+=Math.PI;sparkle(g.from,8,0xffffff);addXP(5);toast('Shoo!','good');}

/* ---------- spawning + main update ---------- */
function spawnRate(){
  var f=SH.t/SH.len,D=SH.D;
  var cur=.55+(D.am||1)*.85*Math.exp(-Math.pow((f-.16)/.08,2))+(D.lunch||1)*.8*Math.exp(-Math.pow((f-.52)/.09,2))+(D.eve||.5)*.8*Math.exp(-Math.pow((f-.86)/.09,2));
  return demandMin(SH.loc,true)/60*cur*SH.boost*(SH.loc.days<2?.85:1);
}
function updShift(dt,time){
  SH.t+=dt;var loc=SH.loc;
  var wg=wageMin(loc)/60*dt,rt=rentMin(loc)/60*dt;G.cash-=wg+rt;SH.s.wages+=wg;SH.s.rent+=rt;
  if(SH.phase==='open'){
    SH.next-=dt;
    if(SH.burst>0){SH.burstT-=dt;if(SH.burstT<=0){SH.burstT=.8;SH.burst--;if(!spawnCust())SH.pend.push(SH.t);}}
    if(SH.next<=0){var ok=SH.dspots.length&&!SH.dspots[0]&&Math.random()<.16&&spawnCust({courier:true});if(!ok&&!spawnCust())SH.pend.push(SH.t);var r=spawnRate();SH.next=clamp(-Math.log(1-Math.random()*.98)/Math.max(.02,r),.8,16);}
    if(SH.pend.length&&SH.spots.some(function(s){return !s;})){if(spawnCust())SH.pend.shift();}
    SH.pend=SH.pend.filter(function(t0){if(SH.t-t0>9){SH.s.turned++;return false;}return true;});
    if(SH.t>=SH.len){SH.phase='closing';SH.s.turned+=SH.pend.length;SH.pend=[];banner('Gate closing','Load whoever is still here','cool');sfx.bell();}
  }else if(SH.phase==='closing'){if(!SH.cust.length&&!SH.cranes.some(function(c){return c.job;}))endShift();}
  updEvents(dt);updShips(dt,time);updCranes(dt);updYard(dt,time);updBots(dt);updCust(dt,time);updGull(dt,time);
}
function endShift(){
  SH.phase='done';paused=true;var loc=SH.loc,s=SH.s;
  loc.days++;G.day++;s.rep1=loc.rep;s.bestStreak=SH.bestStreak;
  var rev=s.sales+s.tips;s.stars=rev>=s.goal*1.35?3:rev>=s.goal?2:rev>=s.goal*.6?1:0;
  s.bonus=0;if(rev>=s.goal){s.bonus=Math.round(s.goal*(.15+.08*s.stars));G.cash+=s.bonus;addFame(3*s.stars);addXP(s.goal*.25);}
  s.ptsBonus=s.stars*150+(s.walk===0&&s.served>=5?300:0);s.total=s.pts+s.ptsBonus;
  G.best=G.best||0;s.prevBest=G.best;s.newBest=s.total>G.best&&s.total>0;if(s.newBest)G.best=s.total;
  G.stats.pts=(G.stats.pts||0)+s.total;s.life=G.stats.pts;
  var avg=(s.opts||0)/Math.max(1,s.served+s.walk);s.grade=avg>=170?'S':avg>=130?'A':avg>=95?'B':avg>=60?'C':'D';
  s.lp=Math.round(Math.round(s.total*LZR)*LZM);s.lzm=LZM;s.ea=!!window.LZ_EA;save();sfx.bell();showSummary(s);
  if(window.LZ_GAME&&window.LZ)LZ.endSession(LZ_GAME,s.total,{grade:s.grade,day:s.day});
}
