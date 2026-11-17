/* ================= battle engine =================
   Field coordinates: u runs 0..L from your edge to the enemy edge, v runs 0..WD across.
   On tall screens the field is rotated so you attack upward; all simulation stays in field space. */
var L=720,WD=420,CELL=30,GX=24,GY=14,B=null,bf=null,bx=null,TOPPAD=50;
var ECOST={trooper:1,ranger:1,guardian:1.5,raider:1.2,bombard:2,medic:1.2,lancer:2,titan:5};
var EWT={trooper:4,ranger:3,guardian:2,raider:2,bombard:1,medic:.8,lancer:1.5,titan:.5};

function playerMults(){var f=FACTIONS[S.faction]||FACTIONS.solari,fm=fedMult();return{dmg:f.dmg*(1+gearBonus("weapon"))*fm,hp:f.hp*(1+gearBonus("armor"))*(1+(fm-1)*.5),spd:f.spd*(1+gearBonus("engine")*.5),rng:1+gearBonus("optic")*.5};}
function cellOf(x,y){return clamp((x/CELL)|0,0,GX-1)+clamp((y/CELL)|0,0,GY-1)*GX;}
function blocked(x,y,side){if(x<4||y<4||x>L-4||y>WD-4)return true;var g=B.grid[cellOf(x,y)];return g===1||(g===2&&side===0);}
function hAt(x,y){var h=0;for(var i=0;i<B.hi.length;i++){var z=B.hi[i],dx=(x-z.x)/(z.rx*1.25),dy=(y-z.y)/(z.ry*1.25),d=dx*dx+dy*dy;if(d<1){var k=1-d;h=Math.max(h,16*k*k*(3-2*k));}}return h;}
function inZone(zs,e){for(var i=0;i<zs.length;i++){var z=zs[i],dx=(e.x-z.x)/z.rx,dy=(e.y-z.y)/z.ry;if(dx*dx+dy*dy<=1)return true;}return false;}
function zoneMax(){return B.cfg.mode==="def"?L*.46:L*.3;}
function bfs(gx0,gy0){
  var d=new Int16Array(GX*GY).fill(-1),q=[gx0+gy0*GX],h=0;d[q[0]]=0;
  while(h<q.length){var c=q[h++],x=c%GX,y=(c/GX)|0,dd=d[c]+1;
    if(x>0&&d[c-1]<0&&B.grid[c-1]!==1){d[c-1]=dd;q.push(c-1);}
    if(x<GX-1&&d[c+1]<0&&B.grid[c+1]!==1){d[c+1]=dd;q.push(c+1);}
    if(y>0&&d[c-GX]<0&&B.grid[c-GX]!==1){d[c-GX]=dd;q.push(c-GX);}
    if(y<GY-1&&d[c+GX]<0&&B.grid[c+GX]!==1){d[c+GX]=dd;q.push(c+GX);}}
  return d;
}
var N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function flowDir(d,x,y){
  var gx=clamp((x/CELL)|0,0,GX-1),gy=clamp((y/CELL)|0,0,GY-1),best=d[gx+gy*GX],bx2=-1,by2=-1;
  if(best<0)best=9999;
  for(var i=0;i<8;i++){var nx=gx+N8[i][0],ny=gy+N8[i][1];if(nx<0||ny<0||nx>=GX||ny>=GY)continue;var v=d[nx+ny*GX];if(v<0)continue;
    if(i>3&&(B.grid[nx+gy*GX]===1||B.grid[gx+ny*GX]===1))continue;
    if(v<best||(v===best&&i>3&&bx2<0)){if(v<best){best=v;bx2=nx;by2=ny;}}}
  if(bx2<0)return null;
  return[(bx2+.5)*CELL-x,(by2+.5)*CELL-y];
}
function blockCells(gx,gy,w,h,kind){for(var y=gy;y<gy+h;y++)for(var x=gx;x<gx+w;x++)if(x>=0&&y>=0&&x<GX&&y<GY)B.grid[x+y*GX]=1;B.obst.push({x:gx*CELL,y:gy*CELL,w:w*CELL,h:h*CELL,k:kind||"rock"});}
function genField(){
  var r=B.r,cfg=B.cfg,tr=cfg.tr,def=cfg.mode==="def",i;
  var rocks=tr==="open"?irnd(1,2):irnd(2,3);
  for(i=0;i<rocks;i++){var w=r()<.6?1:2,h=r()<.6?1:2;blockCells((def?12:9)+Math.floor(r()*(def?5:6)),1+Math.floor(r()*(GY-2-h)),w,h);}
  if(tr==="choke"){var gxw=11+Math.floor(r()*3),g1=1+Math.floor(r()*3),g2=8+Math.floor(r()*3);for(i=0;i<GY;i++){if((i>=g1&&i<g1+3)||(i>=g2&&i<g2+3))continue;blockCells(gxw,i,1,1,B.river?"river":"wall");}B.bridges=B.river?[{gx:gxw,gy:g1},{gx:gxw,gy:g2}]:[];}
  if((tr==="fort"||cfg.ty>=2)&&!def){var gw=GX-8,gate=5+Math.floor(r()*2);for(i=1;i<GY-1;i++){if(i>=gate&&i<gate+4)continue;if(tr!=="fort"&&(i<4||i>GY-5))continue;blockCells(gw,i,1,1,"wall");}if(tr==="fort"&&cfg.ty>=1)B.gateInfo={gx:gw,gy:gate};}
  var nh=tr==="high"?3:1,nc=tr==="cover"?4:tr==="open"?0:1;
  for(i=0;i<nh;i++)B.hi.push({x:i===0?rnd(110,190):i===1?rnd(310,420):rnd(480,590),y:rnd(90,WD-90),rx:rnd(60,90),ry:rnd(50,75)});
  for(i=0;i<nc;i++)B.cover.push({x:rnd(140,L-170),y:rnd(70,WD-70),rx:rnd(48,70),ry:rnd(44,62),sd:Math.floor(r()*1e6)});
  var hx=def?2:GX-3,hy=(GY/2)|0,zc=def?11:7;
  for(var y=0;y<GY;y++)for(var x=0;x<GX;x++){if(x<=zc||x>=GX-2||(Math.abs(x-hx)<=1&&Math.abs(y-hy)<=1))B.grid[x+y*GX]=0;}
  B.obst=B.obst.filter(function(o){var keep=true;for(var yy=o.y/CELL;yy<(o.y+o.h)/CELL;yy++)for(var xx=o.x/CELL;xx<(o.x+o.w)/CELL;xx++)if(!B.grid[xx+yy*GX])keep=false;return keep;});
  B.grid.fill(0);B.obst.forEach(function(o){for(var yy=o.y/CELL;yy<(o.y+o.h)/CELL;yy++)for(var xx=o.x/CELL;xx<(o.x+o.w)/CELL;xx++)B.grid[xx+yy*GX]=1;});
  if(B.gateInfo)for(i=0;i<4;i++)B.grid[B.gateInfo.gx+(B.gateInfo.gy+i)*GX]=2;
  B.f0=bfs(GX-3,hy);B.f1=bfs(2,hy);
  if(B.f0[2+hy*GX]<0){B.grid.fill(0);B.obst=[];B.gateInfo=null;B.bridges=[];B.f0=bfs(GX-3,hy);B.f1=bfs(2,hy);}
  if(!def&&cfg.ty>=1){var nr=cfg.ty>=3?2:1;for(i=0;i<nr;i++){var rp=freeSpot(L*rnd(.44,.56),nr===1?(r()<.5?WD*.24:WD*.76):(i?WD*.78:WD*.22));B.relays.push({x:rp[0],y:rp[1],p:0,own:0});}}
}
function mkUnit(side,cls,x,y,o){
  var c=CLASSES[cls],p=side===0&&!(o&&o.ally),m=B.pm,sc=p?clsMult(cls):side===0?es(Math.max(1,S.lvl-1)):B.em;
  var u={side:side,cls:cls,x:x,y:y,r:c.r,hp:c.hp*sc*(p?m.hp:1),dmg:c.dmg*sc*(p?m.dmg:1),rng:c.rng*(p&&c.ranged?m.rng:1),spd:c.spd*(p?m.spd:1),t:Math.random()*c.cd,rt:Math.random()*.3,tgt:null,face:side===0?0:Math.PI,hold:false,charged:false,ally:false,fl:0,flash:0,hi:false,wob:Math.random()*TAU,born:0};
  if(o)for(var k in o)u[k]=o[k];u.mhp=u.hp;B.units.push(u);return u;
}
function freeSpot(x,y){for(var t=0;t<30;t++){if(!blocked(x,y,0))return[x,y];x=clamp(x+rnd(-40,40),20,L-20);y=clamp(y+rnd(-40,40),20,WD-20);}return[x,y];}
function rollArmy(budget,lv,r){
  var ks=CLS.filter(function(k){return CLASSES[k].ul<=Math.max(1,lv);}),out=[],guard=0;
  while(budget>.9&&guard++<80){var tot=0;ks.forEach(function(k){if(ECOST[k]<=budget+.3)tot+=EWT[k];});if(!tot)break;var x=r()*tot,ch="trooper";
    for(var i=0;i<ks.length;i++){if(ECOST[ks[i]]>budget+.3)continue;x-=EWT[ks[i]];if(x<=0){ch=ks[i];break;}}
    out.push(ch);budget-=ECOST[ch];}
  return out;
}
function spawnEnemy(){
  var cfg=B.cfg,r=B.r,ty=cfg.ty,em=B.em,i;
  if(cfg.mode==="def"){
    var hpm=1+.1*(S.lvl-1);
    B.hq=mkStruct(0,70,WD/2,36,(520+190*S.fort)*hpm,true,S.fort>=2?{dmg:(7+3*S.fort)*hpm,rng:145,cd:1}:null);B.hq.aura=S.ench;
    var bud=12+cfg.lv*1.3,parts=[.28,.32,.4],times=[2,B.dur*.3,B.dur*.58];
    for(i=0;i<3;i++)B.waves.push({t:times[i],list:rollArmy(bud*parts[i],cfg.lv,r),edge:"right"});
    return;
  }
  var raid=cfg.mode==="raid";
  B.hq=mkStruct(1,L-70,WD/2,[26,32,36,40,46][ty],[380,850,1350,1900,2900][ty]*em,true,ty>=1?{dmg:(8+3*ty)*em,rng:140,cd:1.1}:null);
  var nt=(ty>=2?2:0)+(cfg.tr==="fort"&&ty>=1?1:0);
  for(i=0;i<nt;i++)mkStruct(1,L-150-(i===2?55:0),i===2?WD/2:(i?WD/2+115:WD/2-115),15,200*em,false,{dmg:(5+ty)*em,rng:118,cd:1.1});
  if(B.gateInfo){var gt=mkStruct(1,(B.gateInfo.gx+.5)*CELL,(B.gateInfo.gy+2)*CELL,46,(260+60*ty)*em,false,null);gt.gate=true;}
  B.relays.forEach(function(rl){for(var q=0;q<2;q++){var gp=freeSpot(rl.x+rnd(-24,24),rl.y+rnd(-24,24));mkUnit(1,"trooper",gp[0],gp[1],{hold:true});}});
  if(cfg.pvp){B.hq.hp=B.hq.mhp=B.hq.hp*(1+.06*cfg.pvp.fort);if(cfg.pvp.ench){mkStruct(1,L-150,WD/2-115,15,200*em,false,{dmg:(5+cfg.pvp.ench)*em,rng:118,cd:1.1});}}
  var budget=eBudget(ty,cfg.lv)*(raid?.9:1)*(cfg.ev?1.35:1)*(S.stats.wins<3?.75:1),list=cfg.pvp?pvpArmy(cfg.pvp,budget,r):rollArmy(budget,cfg.lv,r),gar=ty===0?list.length:Math.ceil(list.length*.68);
  for(i=0;i<list.length;i++){
    if(i<gar){var c=CLASSES[list[i]],back=c.ranged||c.heal,p=freeSpot(back?rnd(L-190,L-100):rnd(L*.54,L-180),rnd(45,WD-45));mkUnit(1,list[i],p[0],p[1],{hold:true});}
  }
  var rest=list.slice(gar);
  if(rest.length){var h=Math.ceil(rest.length/2);B.waves.push({t:B.dur*.3,list:rest.slice(0,h),edge:"right"});if(rest.length>h)B.waves.push({t:B.dur*.55,list:rest.slice(h),edge:"right"});}
  if(ty>=3){var bo=mkUnit(1,"titan",L-125,WD/2,{hold:true,boss:true});bo.hp=bo.mhp=bo.hp*(ty===4?1.8:1.2);bo.r=20;}
}
function mkStruct(side,x,y,r,hp,hq,tur){var s={side:side,x:x,y:y,r:r,hp:hp,mhp:hp,hq:hq,tur:tur?{dmg:tur.dmg,rng:tur.rng,cd:tur.cd,t:1,a:side?Math.PI:0}:null,struct:true,flash:0};B.structs.push(s);return s;}
function spawnWave(w){
  w.list.forEach(function(k,i){var x,y;if(w.edge==="right"){x=L-14-rnd(0,30);y=rnd(40,WD-40);}else{x=rnd(L*.4,L*.62);y=w.edge==="top"?16:WD-16;}var p=freeSpot(x,y);mkUnit(1,k,p[0],p[1],{});});
  w.done=true;
}
function startBattle(cfg){
  closeModal(true);
  B={cfg:cfg,r:rng(cfg.sd),t:0,dur:T_DUR[cfg.ty]*(cfg.mode==="def"?.75:1),units:[],structs:[],shots:[],fx:[],txt:[],cp:5,cpMax:10,sel:null,stance:cfg.mode==="def"?"hold":"charge",
    res:{},dead:{},kills:0,over:false,spd:1,auto:!!cfg.auto,autoT:0,adv:now()<S.genU,chest:null,gotChest:false,waves:[],spiked:false,rageT:0,shieldT:0,
    visT:0,sightX:0,ks:0,ksT:0,grid:new Uint8Array(GX*GY),hi:[],cover:[],obst:[],decals:[],relays:[],bridges:[],corpses:[],gateInfo:null,river:(cfg.th||0)%2===0,shake:0,squads:0,puUsed:0,aiT:1.2,depN:0,pm:playerMults(),em:es(cfg.lv),strikes:[],last:0,endT:0,outcome:null,hintT:0,th:THEMES[cfg.th||0],uiT:0,paused:false};
  for(var k in S.army)if(S.army[k]>0)B.res[k]=S.army[k];
  genField();spawnEnemy();
  if(cfg.mode!=="def"&&B.r()<.24){var p=freeSpot(rnd(L*.36,L*.62),rnd(60,WD-60));B.chest={x:p[0],y:p[1]};}
  if(cfg.ally)B.waves.push({t:1.2,ally:true,done:false});
  S.stats.battles++;if(B.auto)S.stats.autoBattles++;hit("h18");hit("h4");
  $("#battle").hidden=false;bf=$("#bf");bx=bf.getContext("2d");
  if(!B.auto)for(var k0=0;k0<CLS.length;k0++)if(B.res[CLS[k0]]>0){B.sel=CLS[k0];break;}
  B.r3=r3Init();$("#b3").style.display=B.r3?"block":"none";
  buildBattleHud();bResize();
  bmsg(cfg.mode==="def"?"DEFEND!":"ATTACK!");snd("deploy");
  B.last=performance.now();requestAnimationFrame(bLoop);
}
function bmsg(t){var e=$("#bmsg");e.textContent=t;e.classList.remove("show");void e.offsetWidth;e.classList.add("show");}
function bResize(){
  if(!B)return;var wr=$("#bwrap"),w=wr.clientWidth,h=wr.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
  bf.width=Math.round(w*dpr);bf.height=Math.round(h*dpr);B.port=h>w*1.05;var fw=B.port?WD:L,fh=B.port?L:WD,ah=h-TOPPAD;
  B.sc=Math.min(w/fw,ah/fh);B.ox=(w-fw*B.sc)/2;B.oy=TOPPAD+(ah-fh*B.sc)/2;B.dpr=dpr;B.cw=w;B.ch=h;B.bg=null;
  if(B.r3&&R3){try{if(!B.built){r3Build();B.built=true;}else r3Fit();}catch(e){console.warn("3D renderer failed, using 2D",e);B.r3=false;r3fail=true;R3=null;$("#b3").style.display="none";}}
}
function setT(c){var s=B.sc*B.dpr;if(B.port)c.setTransform(0,-s,s,0,B.ox*B.dpr,(B.oy+L*B.sc)*B.dpr);else c.setTransform(s,0,0,s,B.ox*B.dpr,B.oy*B.dpr);}
function fs(u,v){if(B.r3&&R3)return r3Screen(u,v,0);return B.port?[B.ox+v*B.sc,B.oy+(L-u)*B.sc]:[B.ox+u*B.sc,B.oy+v*B.sc];}
function sf(px,py){if(B.r3&&R3)return r3Pick(px,py);return B.port?[L-(py-B.oy)/B.sc,(px-B.ox)/B.sc]:[(px-B.ox)/B.sc,(py-B.oy)/B.sc];}

/* ---------- actions ---------- */
function deploy(cls,x,y,ai){
  var c=CLASSES[cls];if(!B||B.over||B.cp<c.cp||!(B.res[cls]>0))return false;
  x=clamp(x,26,zoneMax()-6);y=clamp(y,24,WD-24);var p=freeSpot(x,y);x=Math.min(p[0],zoneMax()-4);y=p[1];
  var n=Math.min(c.squad,B.res[cls]);B.res[cls]-=n;B.cp-=c.cp;
  for(var i=0;i<n;i++){var q=freeSpot(x+rnd(-5,5),clamp(y+(i-(n-1)/2)*c.r*2.6,14,WD-14));mkUnit(0,cls,q[0],q[1],{hold:B.stance==="hold"});}
  B.depN+=n;B.squads++;B.fx.push({k:"ring",x:x,y:y,r0:6,r1:42,t:0,d:.35,col:myCols()[0]});snd("deploy");B.uiT=0;return true;
}
function usePU(k,x,y){
  if(!B||B.over||!(S.pu[k]>0))return false;
  if(k==="strike"){if(x===undefined)return false;B.strikes.push({x:x,y:y,t:.55});B.fx.push({k:"mark",x:x,y:y,t:0,d:.55});}
  else if(k==="heal"){B.units.forEach(function(u){if(u.side===0&&u.hp>0){u.hp=Math.min(u.mhp,u.hp+u.mhp*.45);B.fx.push({k:"ring",x:u.x,y:u.y,r0:4,r1:22,t:0,d:.5,col:"#8dff5a"});}});bmsg("MED WAVE");}
  else if(k==="rage"){B.rageT=8;bmsg("RAGE!");}
  else if(k==="shield"){B.shieldT=6;bmsg("AEGIS");}
  S.pu[k]--;B.puUsed++;S.stats.puUsed++;snd(k==="strike"?"alert":"lvl");B.sel=null;B.uiT=0;return true;
}
function decal(x,y,r){B.decals.push({x:x,y:y,r:r,a:Math.random()*3});if(B.decals.length>46)B.decals.shift();}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function findTarget(u){
  var c=CLASSES[u.cls],ag=u.hold?Math.max(u.rng+25,125):Math.max(u.rng+40,160),best=null,bd=1e9,i,e,d;
  for(i=0;i<B.units.length;i++){e=B.units[i];if(e.side===u.side||e.hp<=0)continue;d=dist(u,e)-e.r;if(c.vsRanged&&CLASSES[e.cls].ranged)d*=.6;if(d<bd&&d<=ag){bd=d;best=e;}}
  for(i=0;i<B.structs.length;i++){e=B.structs[i];if(e.side===u.side||e.hp<=0)continue;d=dist(u,e)-e.r;if(c.vsStruct)d*=.7;if(d<bd&&d<=ag){bd=d;best=e;}}
  return best;
}
function moveU(u,dx,dy,dt){
  var len=Math.hypot(dx,dy);if(len<.01)return 0;var sp=u.spd*(u.side===0&&B.rageT>0?1.5:1)*dt,nx=u.x+dx/len*sp,ny=u.y+dy/len*sp,st=0;
  if(!blocked(nx,u.y,u.side))u.x=nx;else st|=1;if(!blocked(u.x,ny,u.side))u.y=ny;else st|=2;
  var ta=Math.atan2(dy,dx),da=((ta-u.face+Math.PI*3)%TAU)-Math.PI;u.face+=da*Math.min(1,dt*10);u.wob+=dt*12;return st;
}
function applyDmg(src,tg,dmg,ranged){
  var sc=src&&src.cls?CLASSES[src.cls]:null;
  if(src&&src.hi)dmg*=1.2;
  if(tg.cls){var tc=CLASSES[tg.cls];if(tc.armor)dmg*=1-tc.armor;if(ranged&&inZone(B.cover,tg))dmg*=.65;if(sc&&sc.vsRanged&&tc.ranged)dmg*=sc.vsRanged;if(tg.side===0&&B.shieldT>0)dmg*=.4;if(tg.hold&&tg.side===1)tg.hold=false;}
  else if(sc&&sc.vsStruct)dmg*=sc.vsStruct;
  if(src&&src.side===0&&B.rageT>0)dmg*=1.5;
  tg.hp-=dmg;tg.flash=.1;
  if(B.txt.length<26&&(dmg>=14||Math.random()<.3))B.txt.push({x:tg.x+rnd(-6,6),y:tg.y,s:String(Math.round(dmg)),t:0,d:.6,col:tg.side===0?"#ff8a98":"#fff",sz:dmg>40?17:12});
  if(tg.hp<=0)kill(tg);else snd("hit");
}
function kill(e){
  var i,col=e.side===0?myCols()[0]:B.cfg.ecol[0];
  for(i=0;i<(e.struct?26:8);i++){var a=Math.random()*TAU,s=rnd(40,e.struct?260:150);B.fx.push({k:"sp",x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,d:rnd(.3,.7),col:i%3?col:"#fff",sz:rnd(2,e.struct?6:4)});}
  B.fx.push({k:"ring",x:e.x,y:e.y,r0:e.r,r1:e.r*(e.struct?4.5:2.6),t:0,d:e.struct?.6:.3,col:"#fff"});decal(e.x,e.y,e.struct?e.r*1.5:e.r*1.1);
  if(e.gate){var gi=B.gateInfo;for(i=0;i<4;i++)B.grid[gi.gx+(gi.gy+i)*GX]=0;bmsg("GATE DOWN!");}
  if(e.struct){B.shake=e.hq?16:8;snd("boom");
    if(e.hq)endBattle(e.side===1?"win":"lose");}
  else{if(e.side===1){B.kills++;B.ks=B.ksT>0?B.ks+1:1;B.ksT=2.6;if(B.ks===5)bmsg("RAMPAGE!");else if(B.ks===10)bmsg("UNSTOPPABLE!");}else if(!e.ally){B.dead[e.cls]=(B.dead[e.cls]||0)+1;}B.corpses.push({u:e,t:0});}
}
function attack(u,tg){
  var c=CLASSES[u.cls];u.t=c.cd*(u.side===0&&B.rageT>0?.7:1);var dmg=u.dmg;
  if(c.charge&&!u.charged){dmg*=c.charge;u.charged=true;B.fx.push({k:"ring",x:tg.x,y:tg.y,r0:4,r1:30,t:0,d:.3,col:"#fff"});}
  u.face=Math.atan2(tg.y-u.y,tg.x-u.x);
  if(c.rng>40){B.fx.push({k:"mz",x:u.x+Math.cos(u.face)*u.r*1.5,y:u.y+Math.sin(u.face)*u.r*1.5,a:u.face,t:0,d:.09,sz:c.splash?9:5});B.shots.push({x:u.x+Math.cos(u.face)*u.r,y:u.y+Math.sin(u.face)*u.r,tg:tg,tx:tg.x,ty:tg.y,spd:c.splash?250:430,dmg:dmg,src:u,splash:c.splash||0,col:u.side===0?myCols()[0]:B.cfg.ecol[0]});}
  else{applyDmg(u,tg,dmg,false);B.fx.push({k:"sl",x:(u.x+tg.x)/2,y:(u.y+tg.y)/2,a:u.face,t:0,d:.14,col:u.side===0?"#fff":"#ffd0d6"});}
}
function stepUnit(u,dt){
  var c=CLASSES[u.cls],p=u.side===0&&!u.ally;
  u.t-=dt;u.rt-=dt;u.born+=dt;if(u.flash>0)u.flash-=dt;if(u.fl>0)u.fl-=dt;
  if(p&&B.stance==="retreat"){
    var fd=flowDir(B.f1,u.x,u.y)||[-1,0];moveU(u,fd[0],fd[1],dt*1.15);
    if(u.x<34){u.hp=0;u.gone=true;B.res[u.cls]=(B.res[u.cls]||0)+1;}
    return;
  }
  if(u.rt<=0){u.rt=.22+Math.random()*.12;u.hi=inZone(B.hi,u);
    if(c.heal){var best=null,bw=.97,lead=null,ld=1e9;B.units.forEach(function(a){if(a===u||a.side!==u.side||a.hp<=0)return;var d=dist(u,a);if(d<150&&a.hp/a.mhp<bw){bw=a.hp/a.mhp;best=a;}if(!CLASSES[a.cls].heal&&d<ld){ld=d;lead=a;}});u.tgt=best;u.lead=lead;}
    else u.tgt=findTarget(u);
    if(p)u.hold=B.stance==="hold";
  }
  var tg=u.tgt;if(tg&&tg.hp<=0)tg=u.tgt=null;
  if(c.heal){
    if(tg){var d0=dist(u,tg);if(d0<=u.rng){if(u.t<=0){u.t=c.cd;tg.hp=Math.min(tg.mhp,tg.hp+c.heal*c.cd*(u.side===0?clsMult("medic"):B.em));B.fx.push({k:"ring",x:tg.x,y:tg.y,r0:3,r1:14,t:0,d:.3,col:"#8dff5a"});}}else moveU(u,tg.x-u.x,tg.y-u.y,dt);}
    else if(u.lead&&dist(u,u.lead)>46)moveU(u,u.lead.x-u.x,u.lead.y-u.y,dt);
    return;
  }
  if(tg){
    var d=dist(u,tg)-tg.r,rg=u.rng*(u.hi?1.15:1);
    if(d<=rg){if(u.t<=0)attack(u,tg);}
    else if(u.fl>0){var f=flowDir(u.side===0?B.f0:B.f1,u.x,u.y);if(f)moveU(u,f[0],f[1],dt);}
    else{var st=moveU(u,tg.x-u.x,tg.y-u.y,dt);if(st)u.fl=.7;}
    return;
  }
  if(u.hold)return;
  var fl=flowDir(u.side===0?B.f0:B.f1,u.x,u.y);
  if(fl)moveU(u,fl[0],fl[1],dt);else if(u.side===1&&B.cfg.mode!=="def")moveU(u,-1,0,dt);
}
function stepShots(dt){
  for(var i=B.shots.length-1;i>=0;i--){
    var s=B.shots[i];if(s.tg&&s.tg.hp>0){s.tx=s.tg.x;s.ty=s.tg.y;}
    var dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy),st=s.spd*dt;
    if(d<=st+4){
      if(s.splash){B.fx.push({k:"ring",x:s.tx,y:s.ty,r0:4,r1:s.splash,t:0,d:.28,col:"#ffcf3a"});B.shake=Math.max(B.shake,3);
        var side=s.src.side;B.units.concat(B.structs).forEach(function(e){if(e.side===side||e.hp<=0)return;var dd=Math.hypot(e.x-s.tx,e.y-s.ty)-e.r;if(dd<=s.splash)applyDmg(s.src,e,s.dmg*(e===s.tg?1:.6),true);});}
      else if(s.tg&&s.tg.hp>0)applyDmg(s.src,s.tg,s.dmg,true);
      B.shots.splice(i,1);
    }else{s.x+=dx/d*st;s.y+=dy/d*st;s.dx=dx/d;s.dy=dy/d;}
  }
}
function aiStep(dt){
  B.aiT-=dt;if(B.aiT>0)return;B.aiT=B.adv?.45:1.15;
  var def=B.cfg.mode==="def",zx=zoneMax(),opts=CLS.filter(function(k){return B.res[k]>0&&CLASSES[k].cp<=B.cp;});
  if(B.adv){
    var en=B.units.filter(function(u){return u.side===1&&u.hp>0;}),my=B.units.filter(function(u){return u.side===0&&u.hp>0;});
    if(S.pu.strike>0&&en.length>=4){var best=null,bc=3;en.forEach(function(e){var n=0;en.forEach(function(o){if(dist(e,o)<70)n++;});if(n>bc){bc=n;best=e;}});if(best)usePU("strike",best.x,best.y);}
    if(S.pu.heal>0&&my.length>=5){var a=0;my.forEach(function(u){a+=u.hp/u.mhp;});if(a/my.length<.5)usePU("heal");}
    if(S.pu.rage>0&&my.length>=8&&B.rageT<=0&&B.t>B.dur*.3)usePU("rage");
  }
  if(!opts.length)return;
  var k;
  if(B.adv){var front=B.units.filter(function(u){return u.side===0&&u.hp>0&&!CLASSES[u.cls].ranged&&!CLASSES[u.cls].heal;}).length;
    var fr=opts.filter(function(o){return !CLASSES[o].ranged&&!CLASSES[o].heal;}),bk=opts.filter(function(o){return CLASSES[o].ranged||CLASSES[o].heal;});
    var pool=front<4&&fr.length?fr:(bk.length&&Math.random()<.55?bk:opts);pool.sort(function(a,b){return CLASSES[b].pw-CLASSES[a].pw;});k=pool[0];}
  else k=pick(opts);
  var c=CLASSES[k],x=B.adv?((c.ranged||c.heal)?rnd(zx*.35,zx*.6):rnd(zx*.75,zx-8)):rnd(40,zx-8),y=rnd(50,WD-50);
  if(B.adv||def){var ty=0,n=0;B.units.forEach(function(u){if(u.side===1&&u.hp>0){ty+=u.y;n++;}});if(n)y=clamp(ty/n+rnd(-90,90),40,WD-40);}
  deploy(k,x,y,true);
}
function bStep(dt){
  var i,u;B.t+=dt;
  var ro=0;B.relays.forEach(function(rl){var m=0,f=0;B.units.forEach(function(q){if(q.hp>0&&Math.hypot(q.x-rl.x,q.y-rl.y)<52){if(q.side===0)m++;else f++;}});
    if(m>f)rl.p=Math.min(1,rl.p+dt*.3);else if(f>m)rl.p=Math.max(-1,rl.p-dt*.3);
    var o=rl.own;if(rl.p>=1)rl.own=1;else if(rl.p<=-1)rl.own=-1;else if((o===1&&rl.p<=0)||(o===-1&&rl.p>=0))rl.own=0;
    if(rl.own!==o&&rl.own===1){bmsg("RELAY CAPTURED");snd("lvl");B.fx.push({k:"ring",x:rl.x,y:rl.y,r0:8,r1:60,t:0,d:.5,col:myCols()[0]});}
    if(rl.own===1)ro++;});
  B.cp=Math.min(B.cpMax,B.cp+dt/1.45*(1+.3*ro));if(B.rageT>0)B.rageT-=dt;if(B.shieldT>0)B.shieldT-=dt;
  if(B.auto){B.autoT+=dt;aiStep(dt);}
  B.visT-=dt;if(B.visT<=0){B.visT=.15;var zx=zoneMax()+70,mxu=zx,fr=[];B.units.forEach(function(q){if(q.side===0&&q.hp>0){fr.push(q);if(q.x+175>mxu)mxu=q.x+175;}});if(B.cfg.mode==="def")mxu=Math.max(mxu,B.hq.x+260);B.sightX=mxu;
    var seen=function(e){if(e.x<zx||(B.cfg.mode==="def"&&e.x<B.hq.x+260))return true;for(var q=0;q<fr.length;q++){var dx=fr[q].x-e.x,dy=fr[q].y-e.y;if(dx*dx+dy*dy<30625)return true;}return false;};
    B.units.forEach(function(e){if(e.side===1)e.vis=seen(e);});B.structs.forEach(function(e){if(e.side===1&&!e.seen)e.seen=e.hq||seen(e);});}
  if(B.ksT>0)B.ksT-=dt;
  // waves, ambush
  B.waves.forEach(function(w){if(!w.done&&B.t>=w.t){if(w.ally){w.done=true;var b=ALLIES[S.ally]||ALLIES[0];["guardian","trooper","trooper","ranger","ranger"].forEach(function(k,j){if(CLASSES[k].ul>S.lvl+1)k="trooper";mkUnit(0,k,40,WD/2+(j-2)*26,{ally:true,acol:b.col});});bmsg("ALLIES ARRIVE");}else{spawnWave(w);if(B.cfg.mode!=="def")bmsg("REINFORCEMENTS!");else bmsg("WAVE INCOMING");snd("alert");}}});
  if(B.cfg.mode!=="def"&&!B.spiked&&B.t>B.dur*.28&&B.hq.hp<B.hq.mhp*.75&&(B.cfg.ty>=1||S.stats.wins>4)){
    B.spiked=true;if(Math.random()<(B.cfg.ty>=1?.5:.28)){var n=3+Math.min(3,B.cfg.ty);spawnWave({list:rollArmy(n,B.cfg.lv,Math.random),edge:Math.random()<.5?"top":"bottom"});bmsg("AMBUSH!");snd("alert");B.shake=8;S.stats.spikes++;hit("h10b");}
  }
  if(B.cfg.mode!=="def"&&B.t>B.dur*.5)B.units.forEach(function(e){if(e.side===1&&e.hold&&!e.boss)e.hold=false;});
  for(i=0;i<B.units.length;i++){u=B.units[i];if(u.hp>0)stepUnit(u,dt);}
  // separation
  for(i=0;i<B.units.length;i++){var a=B.units[i];if(a.hp<=0)continue;for(var j=i+1;j<B.units.length;j++){var b=B.units[j];if(b.hp<=0)continue;var dx=b.x-a.x,dy=b.y-a.y,rr=a.r+b.r;if(Math.abs(dx)>rr||Math.abs(dy)>rr)continue;var d=Math.hypot(dx,dy);if(d<rr&&d>.01){var push=(rr-d)*.5,px=dx/d*push,py=dy/d*push;if(!blocked(a.x-px,a.y-py,a.side)){a.x-=px;a.y-=py;}if(!blocked(b.x+px,b.y+py,b.side)){b.x+=px;b.y+=py;}}}}
  // turrets and aura
  B.structs.forEach(function(s){if(s.hp<=0)return;if(s.flash>0)s.flash-=dt;
    if(s.tur){s.tur.t-=dt;var best=null,bd=s.tur.rng;B.units.forEach(function(e){if(e.side===s.side||e.hp<=0)return;var d=dist(s,e);if(d<bd){bd=d;best=e;}});
      if(best){s.tur.a=Math.atan2(best.y-s.y,best.x-s.x);if(s.tur.t<=0){s.tur.t=s.tur.cd;B.shots.push({x:s.x,y:s.y,tg:best,tx:best.x,ty:best.y,spd:460,dmg:s.tur.dmg,src:s,splash:0,col:s.side===0?myCols()[0]:"#ff5468"});}}}
    if(s.aura){B.units.forEach(function(e){if(e.side===1&&e.hp>0&&dist(s,e)<120){e.hp-=6*s.aura*dt;if(e.hp<=0)kill(e);}});}
  });
  stepShots(dt);
  // airstrikes
  for(i=B.strikes.length-1;i>=0;i--){var s=B.strikes[i];s.t-=dt;if(s.t<=0){B.strikes.splice(i,1);B.shake=12;snd("boom");B.fx.push({k:"ring",x:s.x,y:s.y,r0:10,r1:84,t:0,d:.45,col:"#ff9a3d"});decal(s.x,s.y,34);B.fx.push({k:"ring",x:s.x,y:s.y,r0:4,r1:60,t:0,d:.3,col:"#fff"});
    var dm=120*B.pm.dmg*(1+.1*(S.lvl-1));B.units.concat(B.structs).forEach(function(e){if(e.side!==1||e.hp<=0)return;var d=Math.hypot(e.x-s.x,e.y-s.y)-e.r;if(d<75)applyDmg(null,e,dm*(e.struct?.6:1)*(d<36?1:.6),false);});}}
  // chest
  if(B.chest&&!B.gotChest){for(i=0;i<B.units.length;i++){u=B.units[i];if(u.side===0&&u.hp>0&&Math.hypot(u.x-B.chest.x,u.y-B.chest.y)<20){B.gotChest=true;B.fx.push({k:"ring",x:B.chest.x,y:B.chest.y,r0:6,r1:50,t:0,d:.5,col:"#ffcf3a"});B.txt.push({x:B.chest.x,y:B.chest.y,s:"TREASURE!",t:0,d:1.1,col:"#ffcf3a",sz:16});snd("coin");break;}}}
  B.units=B.units.filter(function(u){return u.hp>0;});
  // outcome checks
  if(B.over)return;
  var mine=0,foes=0;B.units.forEach(function(u){if(u.side===0&&!u.ally)mine++;else if(u.side===1)foes++;});B.mine=mine;B.foes=foes;
  var resv=armySize(B.res);
  if(B.cfg.mode==="def"){
    var left=B.waves.filter(function(w){return !w.done;}).length;
    if((!left&&!foes)||B.t>=B.dur)endBattle("win");
  }else{
    if(B.t>=B.dur)endBattle("lose");
    else if(B.stance==="retreat"&&!mine)endBattle("retreat");
    else if(!mine&&!resv&&B.depN>0&&!B.units.some(function(u){return u.ally;}))endBattle("lose");
  }
}
function endBattle(o){
  if(B.over)return;B.over=true;B.outcome=o;B.endT=1.5;B.sel=null;
  bmsg(o==="win"?"VICTORY!":o==="retreat"?"RETREAT":"DEFEAT");snd(o==="win"?"win":"lose");
  if(o==="win"){var cc=["#ffcf3a","#ff4fa3","#2fe6ff","#8dff5a","#fff"];for(var i=0;i<70;i++){var a=Math.random()*TAU,sp=rnd(60,340);B.fx.push({k:"sp",x:B.cfg.mode==="def"?L*.3:B.hq.x,y:WD/2,vx:Math.cos(a)*sp-(B.cfg.mode==="def"?0:90),vy:Math.sin(a)*sp,t:0,d:rnd(.7,1.4),col:cc[i%5],sz:rnd(3,7)});}}
  if(o==="win"&&B.cfg.mode!=="def")B.units.forEach(function(u){if(u.side===1){u.hold=true;}});
}
function bLoop(ts){
  if(!B)return;
  var dt=Math.min(.05,(ts-B.last)/1000);B.last=ts;
  if(!B.paused){
    if(!B.over){for(var i=0;i<B.spd&&!B.over;i++)bStep(dt);stepFx(dt*B.spd);}
    else{B.endT-=dt;stepFx(dt*.6);if(B.endT<=0){var b=B;B=null;$("#battle").hidden=true;$("#btip").textContent="";battleDone(b);return;}}
    B.uiT-=dt;if(B.uiT<=0){B.uiT=.2;updateBattleHud();battleTip();}
  }
  bDraw();requestAnimationFrame(bLoop);
}
function stepFx(dt){
  var i,f;if(B.shake>0)B.shake=Math.max(0,B.shake-dt*40);
  for(i=B.fx.length-1;i>=0;i--){f=B.fx[i];f.t+=dt;if(f.k==="sp"){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;}if(f.t>=f.d)B.fx.splice(i,1);}
  for(i=B.txt.length-1;i>=0;i--){f=B.txt[i];f.t+=dt;if(f.t>=f.d)B.txt.splice(i,1);}
}

/* ---------- drawing ---------- */
function drawSoldier(c,cls,r,c1,c2,flash,wob){
  var b=flash?"#fff":c1,dk="#15122e",i,a;
  c.lineJoin="round";c.lineCap="round";
  c.fillStyle="rgba(0,0,0,.32)";c.beginPath();c.ellipse(-2,2.5,r*1.15,r*1.02,0,0,TAU);c.fill();
  var leg=Math.sin(wob||0)*r*.22;
  function body(rad){c.fillStyle=dk;c.beginPath();c.arc(0,0,rad+r*.2,0,TAU);c.fill();c.fillStyle=b;c.beginPath();c.arc(0,0,rad,0,TAU);c.fill();c.fillStyle="rgba(255,255,255,.35)";c.beginPath();c.arc(-rad*.25,-rad*.3,rad*.45,0,TAU);c.fill();}
  if(cls==="trooper"){
    c.strokeStyle=dk;c.lineWidth=r*.5;c.beginPath();c.moveTo(r*.2,r*.55);c.lineTo(r*1.5,r*.55);c.stroke();c.strokeStyle="#cfd6ea";c.lineWidth=r*.2;c.beginPath();c.moveTo(r*.6,r*.55);c.lineTo(r*1.45,r*.55);c.stroke();
    c.fillStyle=dk;c.beginPath();c.arc(r*.25,r*.62+leg*.3,r*.3,0,TAU);c.fill();
    body(r*.82);
    c.fillStyle=c2;c.beginPath();c.arc(-r*.08,0,r*.5,0,TAU);c.fill();c.fillStyle=dk;c.fillRect(r*.18,-r*.3,r*.2,r*.6);
  }else if(cls==="ranger"){
    c.strokeStyle=dk;c.lineWidth=r*.42;c.beginPath();c.moveTo(-r*.3,r*.5);c.lineTo(r*2.2,r*.5);c.stroke();c.strokeStyle="#cfd6ea";c.lineWidth=r*.16;c.beginPath();c.moveTo(r*.9,r*.5);c.lineTo(r*2.15,r*.5);c.stroke();
    c.fillStyle=dk;c.beginPath();c.moveTo(r*1.15,0);c.lineTo(-r*1.0,r*1.05);c.lineTo(-r*.55,0);c.lineTo(-r*1.0,-r*1.05);c.closePath();c.fill();
    c.fillStyle=b;c.beginPath();c.moveTo(r*.85,0);c.lineTo(-r*.75,r*.78);c.lineTo(-r*.35,0);c.lineTo(-r*.75,-r*.78);c.closePath();c.fill();
    c.fillStyle=c2;c.beginPath();c.arc(r*.05,0,r*.36,0,TAU);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(r*.3,0,r*.14,0,TAU);c.fill();
  }else if(cls==="guardian"){
    body(r*.8);c.fillStyle=c2;c.beginPath();c.arc(-r*.1,0,r*.42,0,TAU);c.fill();
    c.strokeStyle=dk;c.lineWidth=r*.62;c.beginPath();c.arc(0,0,r*1.18,-1.1,1.1);c.stroke();
    c.strokeStyle="#e9f0ff";c.lineWidth=r*.38;c.beginPath();c.arc(0,0,r*1.18,-1.05,1.05);c.stroke();
    c.strokeStyle=b;c.lineWidth=r*.14;c.beginPath();c.arc(0,0,r*1.18,-.7,.7);c.stroke();
  }else if(cls==="raider"){
    c.strokeStyle=dk;c.lineWidth=r*.42;c.beginPath();c.moveTo(r*.3,r*.55);c.lineTo(r*1.9,r*.9+leg);c.moveTo(r*.3,-r*.55);c.lineTo(r*1.9,-r*.9-leg);c.stroke();
    c.strokeStyle="#f2f6ff";c.lineWidth=r*.2;c.beginPath();c.moveTo(r*.5,r*.6);c.lineTo(r*1.85,r*.9+leg);c.moveTo(r*.5,-r*.6);c.lineTo(r*1.85,-r*.9-leg);c.stroke();
    c.fillStyle=dk;c.beginPath();c.moveTo(r*1.3,0);c.lineTo(-r*1.05,r*.9);c.lineTo(-r*.5,0);c.lineTo(-r*1.05,-r*.9);c.closePath();c.fill();
    c.fillStyle=b;c.beginPath();c.moveTo(r*1.0,0);c.lineTo(-r*.8,r*.66);c.lineTo(-r*.3,0);c.lineTo(-r*.8,-r*.66);c.closePath();c.fill();
    c.fillStyle=c2;c.beginPath();c.arc(r*.05,0,r*.26,0,TAU);c.fill();
  }else if(cls==="bombard"){
    c.fillStyle=dk;c.beginPath();c.roundRect(-r*1.0,-r*1.08,r*1.7,r*.44,r*.15);c.fill();c.beginPath();c.roundRect(-r*1.0,r*.64,r*1.7,r*.44,r*.15);c.fill();
    c.fillStyle=dk;c.beginPath();c.roundRect(-r*.98,-r*.84,r*1.74,r*1.68,r*.2);c.fill();c.fillStyle=b;c.beginPath();c.roundRect(-r*.82,-r*.68,r*1.42,r*1.36,r*.14);c.fill();
    c.fillStyle="rgba(255,255,255,.3)";c.fillRect(-r*.7,-r*.56,r*.5,r*.4);
    c.fillStyle=dk;c.fillRect(-r*.05,-r*.3,r*1.95,r*.6);c.fillStyle=c2;c.fillRect(r*.1,-r*.17,r*1.5,r*.34);c.fillStyle=dk;c.fillRect(r*1.55,-r*.4,r*.4,r*.8);
  }else if(cls==="medic"){
    c.fillStyle=dk;c.beginPath();c.arc(0,0,r*1.0,0,TAU);c.fill();c.fillStyle=flash?"#fff":"#f4f8ff";c.beginPath();c.arc(0,0,r*.82,0,TAU);c.fill();
    c.strokeStyle=b;c.lineWidth=r*.2;c.beginPath();c.arc(0,0,r*.82,0,TAU);c.stroke();
    c.fillStyle="#1fc46a";c.fillRect(-r*.17,-r*.52,r*.34,r*1.04);c.fillRect(-r*.52,-r*.17,r*1.04,r*.34);
  }else if(cls==="lancer"){
    c.fillStyle="rgba(47,230,255,.55)";c.beginPath();c.ellipse(-r*1.25,0,r*.55+Math.abs(leg),r*.4,0,0,TAU);c.fill();
    c.strokeStyle=dk;c.lineWidth=r*.4;c.beginPath();c.moveTo(-r*.5,r*.56);c.lineTo(r*2.6,r*.56);c.stroke();c.strokeStyle="#f2f6ff";c.lineWidth=r*.18;c.beginPath();c.moveTo(r*.8,r*.56);c.lineTo(r*2.55,r*.56);c.stroke();
    c.fillStyle=dk;c.beginPath();c.ellipse(0,0,r*1.42,r*.9,0,0,TAU);c.fill();c.fillStyle=b;c.beginPath();c.ellipse(0,0,r*1.22,r*.7,0,0,TAU);c.fill();
    c.fillStyle="rgba(255,255,255,.3)";c.beginPath();c.ellipse(-r*.3,-r*.25,r*.6,r*.25,0,0,TAU);c.fill();
    c.fillStyle=c2;c.beginPath();c.arc(r*.1,0,r*.4,0,TAU);c.fill();
  }else{
    c.fillStyle=dk;c.beginPath();c.roundRect(-r*.4,-r*1.22,r*1.7,r*.46,r*.12);c.fill();c.beginPath();c.roundRect(-r*.4,r*.76,r*1.7,r*.46,r*.12);c.fill();
    c.fillStyle="#cfd6ea";c.fillRect(r*.7,-r*1.12,r*.55,r*.26);c.fillRect(r*.7,r*.86,r*.55,r*.26);
    c.fillStyle=dk;c.beginPath();for(i=0;i<6;i++){a=i/6*TAU;c[i?"lineTo":"moveTo"](Math.cos(a)*r*1.08,Math.sin(a)*r*1.08);}c.closePath();c.fill();
    c.fillStyle=b;c.beginPath();for(i=0;i<6;i++){a=i/6*TAU;c[i?"lineTo":"moveTo"](Math.cos(a)*r*.9,Math.sin(a)*r*.9);}c.closePath();c.fill();
    c.fillStyle="rgba(255,255,255,.28)";c.beginPath();c.arc(-r*.25,-r*.3,r*.4,0,TAU);c.fill();
    c.fillStyle=c2;c.beginPath();c.arc(r*.15,0,r*.42,0,TAU);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(r*.15,0,r*.2,0,TAU);c.fill();
  }
}
function drawFort(c,s,c1,c2){
  var r=s.r,i,a;c.save();c.translate(s.x,s.y);
  c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.arc(-3,3,r*1.08,0,TAU);c.fill();
  c.fillStyle=s.flash>0?"#fff":"#2a2550";c.strokeStyle=c1;c.lineWidth=3;c.beginPath();var n=s.hq?8:6;for(i=0;i<n;i++){a=i/n*TAU+Math.PI/n;c[i?"lineTo":"moveTo"](Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();
  if(s.hq){c.fillStyle=c1;for(i=0;i<4;i++){a=i/4*TAU+Math.PI/4;c.beginPath();c.arc(Math.cos(a)*r*.86,Math.sin(a)*r*.86,r*.2,0,TAU);c.fill();}
    c.fillStyle=c2;c.beginPath();c.arc(0,0,r*.5,0,TAU);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(0,0,r*.2+Math.sin(B.t*5)*r*.05,0,TAU);c.fill();}
  if(s.tur){c.rotate(s.tur.a);c.fillStyle="#12102e";c.fillRect(0,-r*.14,r*(s.hq?.95:1.3),r*.28);c.fillStyle=c1;c.beginPath();c.arc(0,0,r*(s.hq?.3:.5),0,TAU);c.fill();}
  c.restore();
  var f=clamp(s.hp/s.mhp,0,1);c.lineWidth=4;c.strokeStyle="rgba(0,0,0,.5)";c.beginPath();c.arc(s.x,s.y,r+7,0,TAU);c.stroke();c.strokeStyle=f>.5?"#8dff5a":f>.25?"#ffcf3a":"#ff5468";c.beginPath();c.arc(s.x,s.y,r+7,-Math.PI/2,-Math.PI/2+TAU*f);c.stroke();
}
function buildBg(){
  var cv=document.createElement("canvas");cv.width=bf.width;cv.height=bf.height;var c=cv.getContext("2d"),th=B.th,r=rng(B.cfg.sd+7),i;
  c.fillStyle="#05041a";c.fillRect(0,0,cv.width,cv.height);setT(c);
  var g=c.createLinearGradient(0,0,L,0);g.addColorStop(0,th.g1);g.addColorStop(1,th.g2);c.fillStyle=g;c.fillRect(0,0,L,WD);
  for(i=0;i<70;i++){c.fillStyle=r()<.5?"rgba(255,255,255,.05)":"rgba(0,0,0,.07)";c.beginPath();c.ellipse(r()*L,r()*WD,10+r()*46,8+r()*30,r()*3,0,TAU);c.fill();}
  for(i=0;i<130;i++){c.fillStyle=r()<.5?"rgba(255,255,255,.16)":"rgba(0,0,0,.16)";c.fillRect(r()*L,r()*WD,2+r()*3,2+r()*3);}
  c.strokeStyle="rgba(255,255,255,.045)";c.lineWidth=1;for(i=1;i<GX;i++){c.beginPath();c.moveTo(i*CELL,0);c.lineTo(i*CELL,WD);c.stroke();}for(i=1;i<GY;i++){c.beginPath();c.moveTo(0,i*CELL);c.lineTo(L,i*CELL);c.stroke();}
  var zg=c.createLinearGradient(0,0,zoneMax(),0);zg.addColorStop(0,"rgba(255,255,255,.12)");zg.addColorStop(1,"rgba(255,255,255,.02)");c.fillStyle=zg;c.fillRect(0,0,zoneMax(),WD);
  var vg=c.createRadialGradient(L/2,WD/2,WD*.45,L/2,WD/2,L*.62);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,10,.38)");
  B.hi.forEach(function(z){c.fillStyle="rgba(255,255,255,.16)";c.strokeStyle=th.acc;c.lineWidth=2.5;c.beginPath();c.ellipse(z.x,z.y,z.rx,z.ry,0,0,TAU);c.fill();c.stroke();c.fillStyle="rgba(255,255,255,.13)";c.beginPath();c.ellipse(z.x,z.y,z.rx*.66,z.ry*.66,0,0,TAU);c.fill();c.strokeStyle="rgba(255,255,255,.4)";c.lineWidth=1.5;c.stroke();c.fillStyle="rgba(255,255,255,.2)";c.beginPath();c.ellipse(z.x,z.y,z.rx*.3,z.ry*.3,0,0,TAU);c.fill();});
  B.cover.forEach(function(z){var rr=rng(z.sd);c.fillStyle="rgba(0,0,0,.18)";c.beginPath();c.ellipse(z.x,z.y,z.rx,z.ry,0,0,TAU);c.fill();for(var k=0;k<22;k++){var a=rr()*TAU,d=Math.sqrt(rr()),x=z.x+Math.cos(a)*z.rx*d*.92,y=z.y+Math.sin(a)*z.ry*d*.92,s=7+rr()*8;c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.arc(x-2,y+2,s,0,TAU);c.fill();c.fillStyle=th.tree;c.beginPath();c.arc(x,y,s,0,TAU);c.fill();c.fillStyle="rgba(255,255,255,.22)";c.beginPath();c.arc(x+s*.25,y-s*.25,s*.45,0,TAU);c.fill();}});
  B.obst.forEach(function(o){if(o.k==="river"){c.fillStyle=th.sea;c.globalAlpha=.8;c.fillRect(o.x+3,o.y,o.w-6,o.h);c.globalAlpha=1;return;}c.fillStyle="rgba(0,0,0,.35)";c.fillRect(o.x-3,o.y+4,o.w,o.h);c.fillStyle=th.rock;c.strokeStyle="rgba(0,0,0,.45)";c.lineWidth=2;c.beginPath();c.roundRect(o.x+1,o.y+1,o.w-2,o.h-2,7);c.fill();c.stroke();c.fillStyle="rgba(255,255,255,.2)";c.beginPath();c.roundRect(o.x+o.w*.5,o.y+4,o.w*.42,o.h*.3,5);c.fill();});
  c.strokeStyle="rgba(255,255,255,.55)";c.lineWidth=2.5;c.setLineDash([10,9]);c.beginPath();c.moveTo(zoneMax(),0);c.lineTo(zoneMax(),WD);c.stroke();c.setLineDash([]);
  c.fillStyle=vg;c.fillRect(0,0,L,WD);
  c.strokeStyle=th.acc;c.globalAlpha=.5;c.lineWidth=4;c.strokeRect(0,0,L,WD);c.globalAlpha=1;
  B.bg=cv;
}
function bDraw(){
  if(!B)return;if(B.r3&&R3){r3Frame();return;}
  var c=bx,i,u,p;if(!B.bg)buildBg();
  c.setTransform(1,0,0,1,0,0);var sh=B.shake>0?[rnd(-1,1)*B.shake*B.dpr*.4,rnd(-1,1)*B.shake*B.dpr*.4]:[0,0];
  c.drawImage(B.bg,sh[0],sh[1]);
  setT(c);if(B.shake>0)c.translate(sh[0]/(B.sc*B.dpr),sh[1]/(B.sc*B.dpr));
  var my=myCols(),en=B.cfg.ecol;
  for(i=0;i<B.decals.length;i++){var dc=B.decals[i];c.fillStyle="rgba(10,8,20,.22)";c.beginPath();c.ellipse(dc.x,dc.y,dc.r,dc.r*.8,dc.a,0,TAU);c.fill();c.fillStyle="rgba(10,8,20,.2)";c.beginPath();c.ellipse(dc.x,dc.y,dc.r*.55,dc.r*.45,dc.a,0,TAU);c.fill();}
  if(B.sel&&B.sel!=="strike"){c.fillStyle="rgba(255,255,255,"+(.1+.05*Math.sin(B.t*6))+")";c.fillRect(0,0,zoneMax(),WD);}
  if(B.sel==="strike"){c.fillStyle="rgba(255,154,61,"+(.08+.04*Math.sin(B.t*8))+")";c.fillRect(0,0,L,WD);}
  if(B.chest&&!B.gotChest){c.save();c.translate(B.chest.x,B.chest.y);var bob=Math.sin(B.t*4)*2;c.fillStyle="rgba(255,207,58,.3)";c.beginPath();c.arc(0,0,16+bob,0,TAU);c.fill();c.fillStyle="#c9792a";c.strokeStyle="#5a2f08";c.lineWidth=2;c.beginPath();c.roundRect(-9,-7,18,14,3);c.fill();c.stroke();c.fillStyle="#ffcf3a";c.fillRect(-2,-3,4,6);c.restore();}
  for(i=0;i<B.relays.length;i++){var rl=B.relays[i];c.strokeStyle=rl.p>0?my[0]:rl.p<0?en[0]:"#cfd6ea";c.globalAlpha=.4+Math.abs(rl.p)*.5;c.lineWidth=3;c.beginPath();c.arc(rl.x,rl.y,52,0,TAU);c.stroke();c.globalAlpha=1;c.fillStyle=rl.own===1?my[0]:rl.own===-1?en[0]:"#cfd6ea";c.beginPath();c.arc(rl.x,rl.y,7,0,TAU);c.fill();c.strokeStyle="#15122e";c.lineWidth=2;c.stroke();}
  for(i=0;i<B.structs.length;i++){var s=B.structs[i];if(s.hp>0&&(s.side===0||s.seen))drawFort(c,s,s.side===0?my[0]:en[0],s.side===0?my[1]:en[1]);}
  if(B.cfg.mode==="def"&&B.hq.aura&&B.hq.hp>0){c.strokeStyle="rgba(255,79,163,"+(.5+.3*Math.sin(B.t*4))+")";c.lineWidth=3;c.setLineDash([6,8]);c.beginPath();c.arc(B.hq.x,B.hq.y,120,0,TAU);c.stroke();c.setLineDash([]);}
  if(B.sightX<L){c.fillStyle="rgba(4,3,20,.5)";c.fillRect(B.sightX,0,L-B.sightX,WD);}
  for(i=0;i<B.units.length;i++){u=B.units[i];if(u.hp<=0||(u.side===1&&!u.vis))continue;
    c.save();c.translate(u.x,u.y);
    if(u.side===0&&B.shieldT>0){c.strokeStyle="rgba(47,230,255,.8)";c.lineWidth=2;c.beginPath();c.arc(0,0,u.r+5,0,TAU);c.stroke();}
    if(u.side===0&&B.rageT>0){c.fillStyle="rgba(255,79,163,.28)";c.beginPath();c.arc(0,0,u.r+6,0,TAU);c.fill();}
    if(u.boss){c.fillStyle="rgba(255,84,104,.3)";c.beginPath();c.arc(0,0,u.r+9+Math.sin(B.t*6)*2,0,TAU);c.fill();}
    if(u.born<.22){var bs=1+(1-u.born/.22)*.9;c.scale(bs,bs);c.globalAlpha=clamp(u.born/.12,0,1);}
    c.rotate(u.face);
    if(u.side===0)drawSoldier(c,u.cls,u.r,u.ally?u.acol:my[0],u.ally?"#fff":my[1],u.flash>0,u.wob);else drawSoldier(c,u.cls,u.r,en[0],en[1],u.flash>0,u.wob);
    c.restore();c.globalAlpha=1;
    if(u.hp<u.mhp){var f=u.hp/u.mhp;c.lineWidth=2.4;c.strokeStyle="rgba(0,0,0,.55)";c.beginPath();c.arc(u.x,u.y,u.r+3.5,0,TAU);c.stroke();c.strokeStyle=u.side===0?"#8dff5a":"#ff5468";c.beginPath();c.arc(u.x,u.y,u.r+3.5,-Math.PI/2,-Math.PI/2+TAU*f);c.stroke();}
  }
  c.lineCap="round";
  for(i=0;i<B.shots.length;i++){var s2=B.shots[i],tl=s2.splash?10:16,ddx=s2.dx||0,ddy=s2.dy||0;
    if(s2.splash){c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.arc(s2.x-2,s2.y+3,5,0,TAU);c.fill();c.fillStyle=s2.col;c.beginPath();c.arc(s2.x,s2.y,5.5,0,TAU);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(s2.x,s2.y,2.6,0,TAU);c.fill();c.strokeStyle="rgba(255,255,255,.35)";c.lineWidth=3;c.beginPath();c.moveTo(s2.x,s2.y);c.lineTo(s2.x-ddx*tl*1.6,s2.y-ddy*tl*1.6);c.stroke();}
    else{c.strokeStyle=s2.col;c.lineWidth=4;c.globalAlpha=.55;c.beginPath();c.moveTo(s2.x,s2.y);c.lineTo(s2.x-ddx*tl,s2.y-ddy*tl);c.stroke();c.globalAlpha=1;c.strokeStyle="#fff";c.lineWidth=1.8;c.beginPath();c.moveTo(s2.x,s2.y);c.lineTo(s2.x-ddx*tl*.6,s2.y-ddy*tl*.6);c.stroke();}}
  for(i=0;i<B.fx.length;i++){var f2=B.fx[i],k=f2.t/f2.d;
    if(f2.k==="ring"){c.strokeStyle=f2.col;c.globalAlpha=1-k;c.lineWidth=4*(1-k)+1;c.beginPath();c.arc(f2.x,f2.y,lerp(f2.r0,f2.r1,k),0,TAU);c.stroke();}
    else if(f2.k==="sp"){c.fillStyle=f2.col;c.globalAlpha=1-k;c.fillRect(f2.x-f2.sz/2,f2.y-f2.sz/2,f2.sz,f2.sz);}
    else if(f2.k==="sl"){c.save();c.translate(f2.x,f2.y);c.rotate(f2.a);c.strokeStyle=f2.col;c.globalAlpha=1-k;c.lineWidth=2.5;c.beginPath();c.arc(-6,0,11,-.9,.9);c.stroke();c.restore();}
    else if(f2.k==="mz"){c.save();c.translate(f2.x,f2.y);c.rotate(f2.a);c.fillStyle="#fff7c2";c.globalAlpha=1-k;c.beginPath();c.moveTo(0,-f2.sz*.5);c.lineTo(f2.sz*1.8,0);c.lineTo(0,f2.sz*.5);c.closePath();c.fill();c.restore();}
    else if(f2.k==="mark"){c.strokeStyle="#ff9a3d";c.globalAlpha=.9;c.lineWidth=3;c.beginPath();c.arc(f2.x,f2.y,75*(1-k)+8,0,TAU);c.stroke();c.beginPath();c.moveTo(f2.x-14,f2.y);c.lineTo(f2.x+14,f2.y);c.moveTo(f2.x,f2.y-14);c.lineTo(f2.x,f2.y+14);c.stroke();}
    c.globalAlpha=1;}
  // screen-space text
  c.setTransform(B.dpr,0,0,B.dpr,0,0);c.textAlign="center";c.textBaseline="middle";
  for(i=0;i<B.txt.length;i++){var t=B.txt[i],kk=t.t/t.d;p=fs(t.x,t.y);c.globalAlpha=1-kk*kk;c.font="900 "+Math.round(t.sz*Math.max(.85,B.sc))+"px Nunito,sans-serif";c.lineWidth=3;c.strokeStyle="rgba(0,0,0,.7)";c.strokeText(t.s,p[0],p[1]-18-kk*22);c.fillStyle=t.col;c.fillText(t.s,p[0],p[1]-18-kk*22);}
  c.globalAlpha=1;
  if(B.sel&&B.sel!=="strike"&&B.hintT>0){B.hintT-=.016;p=fs(zoneMax()/2,WD/2);c.font="900 15px Nunito,sans-serif";c.fillStyle="#fff";c.strokeStyle="rgba(0,0,0,.7)";c.lineWidth=4;c.strokeText("Deploy inside your zone",p[0],p[1]);c.fillText("Deploy inside your zone",p[0],p[1]);}
}

/* ---------- battle HUD ---------- */
function paintIcons(root){
  $$("canvas[data-u]",root).forEach(function(cv){var c=cv.getContext("2d"),w=cv.width,k=cv.dataset.u,cols=cv.dataset.e?["#ff5468","#7a0b1c"]:myCols(),r=CLASSES[k].r;c.clearRect(0,0,w,w);c.save();c.translate(w/2-(k==="ranger"||k==="lancer"||k==="bombard"?w*.08:0),w/2+w*.06);c.rotate(-Math.PI/2+.5);var s=w/(r*4.4);c.scale(s,s);drawSoldier(c,k,r,cols[0],cols[1],false,0);c.restore();});
  $$("canvas[data-pu]",root).forEach(function(cv){var c=cv.getContext("2d"),w=cv.width,k=cv.dataset.pu,col=PUPS[k].col,m=w/2;c.clearRect(0,0,w,w);c.lineCap="round";c.lineJoin="round";c.strokeStyle=col;c.fillStyle=col;c.lineWidth=w*.09;
    if(k==="strike"){c.beginPath();c.arc(m,m,w*.3,0,TAU);c.stroke();c.beginPath();c.moveTo(m,w*.08);c.lineTo(m,w*.92);c.moveTo(w*.08,m);c.lineTo(w*.92,m);c.stroke();c.beginPath();c.arc(m,m,w*.09,0,TAU);c.fill();}
    else if(k==="heal"){c.fillRect(m-w*.11,w*.16,w*.22,w*.68);c.fillRect(w*.16,m-w*.11,w*.68,w*.22);}
    else if(k==="rage"){c.beginPath();c.moveTo(m,w*.1);c.lineTo(w*.82,w*.5);c.lineTo(w*.6,w*.5);c.lineTo(w*.6,w*.9);c.lineTo(w*.4,w*.9);c.lineTo(w*.4,w*.5);c.lineTo(w*.18,w*.5);c.closePath();c.fill();}
    else{c.beginPath();c.moveTo(m,w*.1);c.lineTo(w*.84,w*.24);c.lineTo(w*.84,w*.52);c.quadraticCurveTo(w*.8,w*.8,m,w*.92);c.quadraticCurveTo(w*.2,w*.8,w*.16,w*.52);c.lineTo(w*.16,w*.24);c.closePath();c.stroke();}
  });
  $$("canvas[data-flag]",root).forEach(function(cv){var v=cv.dataset.flag,f;if(v==="me")f={em:S.flag.em,c1:S.flag.c1,c2:S.flag.c2};else{var b=bots()[+v]||bots()[0];f={em:b.em,c1:b.c1,c2:b.c2==b.c1?"#1a1757":b.c2};}drawFlag(cv.getContext("2d"),cv.width,f.em,f.c1,f.c2);});
}
function drawFlag(c,w,em,c1,c2){
  c.clearRect(0,0,w,w);c.fillStyle=c2;c.fillRect(0,0,w,w);c.fillStyle=c1;c.beginPath();c.moveTo(0,w);c.lineTo(0,w*.45);c.lineTo(w*.55,0);c.lineTo(w,0);c.lineTo(w,w*.2);c.lineTo(w*.2,w);c.closePath();c.fill();
  c.fillStyle="#fff";c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=w*.04;var m=w/2,r=w*.26,i,a;c.beginPath();
  if(em===0){for(i=0;i<10;i++){a=i/10*TAU-Math.PI/2;var rr=i%2?r*.45:r;c[i?"lineTo":"moveTo"](m+Math.cos(a)*rr,m+Math.sin(a)*rr);}}
  else if(em===1){c.moveTo(m+r*.2,m-r);c.lineTo(m-r*.6,m+r*.15);c.lineTo(m-r*.05,m+r*.15);c.lineTo(m-r*.2,m+r);c.lineTo(m+r*.6,m-r*.15);c.lineTo(m+r*.05,m-r*.15);}
  else if(em===2){c.arc(m,m,r*.85,0,TAU);}
  else if(em===3){c.moveTo(m,m-r);c.lineTo(m+r,m+r*.8);c.lineTo(m-r,m+r*.8);}
  else if(em===4){c.moveTo(m,m-r);c.lineTo(m+r*.8,m);c.lineTo(m,m+r);c.lineTo(m-r*.8,m);}
  else if(em===5){c.rect(m-r*.25,m-r,r*.5,r*2);c.rect(m-r,m-r*.25,r*2,r*.5);}
  else if(em===6){c.moveTo(m-r,m+r*.7);c.lineTo(m-r,m-r*.5);c.lineTo(m-r*.45,m);c.lineTo(m,m-r*.8);c.lineTo(m+r*.45,m);c.lineTo(m+r,m-r*.5);c.lineTo(m+r,m+r*.7);}
  else{c.moveTo(m-r,m-r*.2);c.lineTo(m,m-r);c.lineTo(m+r,m-r*.2);c.lineTo(m+r,m+r*.3);c.lineTo(m,m-r*.4);c.lineTo(m-r,m+r*.3);}
  c.closePath();c.stroke();c.fill();
}
function buildBattleHud(){
  var cfg=B.cfg,h="";
  $("#btop").innerHTML='<div class="nm">'+esc(cfg.nm)+'<small>'+esc(cfg.sub||"")+'</small></div><div class="hp"><div class="bar r" id="bhp"><i style="width:100%"></i><span></span></div></div><div class="tm" id="btm"></div>'+hk("h18")+hk("h4");
  CLS.forEach(function(k){if(S.army[k]>0)h+='<button class="uc" data-b="unit" data-v="'+k+'"><span class="cp">'+CLASSES[k].cp+'</span><canvas width="100" height="100" data-u="'+k+'"></canvas><b>'+CLASSES[k].nm+'</b><small></small><span class="wait"></span></button>';});
  h+='<span class="vsep"></span>';
  Object.keys(PUPS).forEach(function(k){h+='<button class="uc pu" data-b="pu" data-v="'+k+'"><canvas width="68" height="68" data-pu="'+k+'"></canvas><b>'+PUPS[k].nm+'</b><small></small></button>';});
  $("#cards").innerHTML=h;paintIcons($("#cards"));
  $("#cpb").innerHTML="";
  $("#stn").innerHTML=(cfg.mode==="def"?[["hold","Hold"],["charge","Charge"]]:[["charge","Charge"],["hold","Hold"],["retreat","Retreat"]]).map(function(s){return '<button data-b="stance" data-v="'+s[0]+'">'+s[1]+"</button>";}).join("");
  updateBattleHud();
}
function updateBattleHud(){
  if(!B)return;
  var cpb=$("#cpb");if(!cpb.firstChild){var ph="<em></em>";for(var pi=0;pi<B.cpMax;pi++)ph+="<b><i></i></b>";cpb.innerHTML=ph;}
  cpb.firstChild.textContent=Math.floor(B.cp);for(var pj=0;pj<B.cpMax;pj++){var pp=cpb.children[pj+1],fv=clamp(B.cp-pj,0,1);pp.firstChild.style.transform="scaleX("+fv+")";pp.classList.toggle("full",fv>=1);}
  var left=B.dur-B.t,tm=$("#btm");tm.textContent=mmss(left);tm.classList.toggle("low",left<12&&B.cfg.mode!=="def");
  var hq=B.hq,f=clamp(hq.hp/hq.mhp,0,1);$("#bhp i").style.width=(f*100)+"%";$("#bhp span").textContent=(B.cfg.mode==="def"?"YOUR FORTRESS ":"ENEMY HQ ")+Math.ceil(f*100)+"%";
  $$("#cards .uc").forEach(function(b){var k=b.dataset.v;
    if(b.dataset.b==="unit"){var n=B.res[k]||0;b.querySelector("small").textContent="×"+n;b.classList.toggle("out",n<=0);b.classList.toggle("dis",n>0&&B.cp<CLASSES[k].cp);b.classList.toggle("sel",B.sel===k);b.querySelector(".wait").style.height=(n>0?clamp(1-B.cp/CLASSES[k].cp,0,1)*100:0)+"%";}
    else{var m=S.pu[k]||0;b.querySelector("small").textContent="×"+m;b.classList.toggle("dis",m<=0);b.classList.toggle("sel",B.sel===k);}});
  $$("#stn button").forEach(function(b){b.classList.toggle("on",b.dataset.v===B.stance);});
  var a=$("#bauto");a.textContent=(B.adv?"Adv. Auto":"Auto")+(B.auto?": ON":": OFF");a.classList.toggle("on",B.auto);
  $("#bspd").textContent=B.spd+"×";var cb=$("#bcmd");if(cb)cb.classList.toggle("on",S.gems>=GP.cmd&&B.cp<=B.cpMax-1);
}
function battleTap(e){
  if(!B||B.over)return;var rc=bf.getBoundingClientRect(),p=sf(e.clientX-rc.left,e.clientY-rc.top);
  if(!B.sel)return;
  if(B.sel==="strike"){if(p[0]>=0&&p[0]<=L&&p[1]>=0&&p[1]<=WD)usePU("strike",p[0],p[1]);return;}
  if(p[0]>zoneMax()+30||p[0]<-20||p[1]<-20||p[1]>WD+20){B.hintT=1.2;snd("bad");return;}
  if(!deploy(B.sel,p[0],p[1])){snd("bad");if(!(B.res[B.sel]>0)){B.sel=null;}}
  updateBattleHud();
}
function battleBtn(b){
  if(!B||B.over)return;var k=b.dataset.b,v=b.dataset.v;snd("tap");
  if(k==="unit"){if(!(B.res[v]>0))return;B.sel=B.sel===v?null:v;}
  else if(k==="pu"){if(!(S.pu[v]>0))return;if(v==="strike")B.sel=B.sel==="strike"?null:"strike";else usePU(v);}
  else if(k==="cmd"){if(S.gems<GP.cmd){bmsg("NOT ENOUGH GEMS");snd("bad");}else if(B.cp>B.cpMax-1){snd("bad");}else{S.gems-=GP.cmd;S.stats.gemsSpent+=GP.cmd;hit("m9");hit("m14");B.cp=Math.min(B.cpMax,B.cp+5);snd("jack");bmsg("+5 COMMAND");}}
  else if(k==="stance"){B.stance=v;if(v==="retreat"){S.stats.retreats++;bmsg("FALL BACK!");B.sel=null;}B.units.forEach(function(u){if(u.side===0&&!u.ally)u.hold=v==="hold";});}
  updateBattleHud();
}
