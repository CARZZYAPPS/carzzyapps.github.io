
/* ================= CAMERA ================= */
var camBase={pos:V3(0,6,7),tgt:V3(0,1,0)};
function fitCamera(){
  if(!SH)return;var L=SH.L,portrait=W/H<.95;
  var dir=(portrait?V3(0,.86,.52):V3(0,.76,.65)).normalize();
  var pts=[];L.spots.forEach(function(s){pts.push(V3(s.x,1.2,s.z),V3(s.x,.1,s.z-.5));});
  L.cols.forEach(function(c){pts.push(V3(c.x,c.max*CH+.35,c.z),V3(c.x,0,c.z+.45));});
  pts.push(V3(L.trash.x+.3,.5,L.trash.z+.4));
  L.dspots.forEach(function(s){pts.push(V3(s.x-1.6,1.2,s.z),V3(s.x+1.6,1.2,s.z));});
  L.berths.forEach(function(b){var hl=(6*.38+.95)/2+.45;pts.push(V3(b.x-hl,1.2,b.z),V3(b.x+hl,1.2,b.z),V3(b.x,0,b.z+.5));});
  var zs=pts.map(function(p){return p.z;}),tgt=V3(0,.6,(Math.min.apply(null,zs)+Math.max.apply(null,zs))/2);
  var topEl=$('#top').getBoundingClientRect(),topPx=(topEl.bottom||90)+(portrait?62:72),botPx=58;
  var yTop=1-2*topPx/H,yBot=-1+2*botPx/H,xLim=.95;
  camera.clearViewOffset();camera.fov=portrait?44:34;camera.aspect=W/H;camera.updateProjectionMatrix();
  function test(d){camera.position.copy(tgt).addScaledVector(dir,d);camera.lookAt(tgt);camera.updateMatrixWorld(true);var mn=9,mx=-9,ok=true;
    pts.forEach(function(p){var q=p.clone().project(camera);if(Math.abs(q.x)>xLim)ok=false;mn=Math.min(mn,q.y);mx=Math.max(mx,q.y);});return {ok:ok&&(mx-mn)<=(yTop-yBot),mn:mn,mx:mx};}
  var lo=2,hi=80;for(var i=0;i<30;i++){var m=(lo+hi)/2;if(test(m).ok)hi=m;else lo=m;}
  var r=test(hi),dy=(yTop+yBot)/2-(r.mx+r.mn)/2;
  camBase.pos.copy(camera.position);camBase.tgt.copy(tgt);
  camera.setViewOffset(W,H,0,dy*H/2,W,H);camera.updateProjectionMatrix();
}
function resize(){W=window.innerWidth;H=window.innerHeight;renderer.setSize(W,H);if(SH)fitCamera();else{camera.aspect=W/H;camera.updateProjectionMatrix();}}
window.addEventListener('resize',function(){resize();setTimeout(resize,250);});

/* ================= INPUT ================= */
var ray=new T.Raycaster(),ndc=new T.Vector2(),down=null,cvs=renderer.domElement;
cvs.addEventListener('pointerdown',function(e){down={x:e.clientX,y:e.clientY,id:e.pointerId};});
cvs.addEventListener('pointerup',function(e){if(!down||down.id!==e.pointerId)return;var d=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(d<16)tapAt(e.clientX,e.clientY);});
cvs.addEventListener('pointercancel',function(){down=null;});
function tapAt(x,y){
  audioOn();if(!SH||paused||SH.phase==='done')return;
  var r=cvs.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);scene.updateMatrixWorld();ray.setFromCamera(ndc,camera);
  var hits=ray.intersectObjects(shiftHits(),false);if(!hits.length)return;
  for(var i=0;i<hits.length;i++)if(hits[i].object.userData.gull){shooGull();return;}
  for(i=0;i<hits.length;i++)if(hits[i].object.userData.cust){tapCust(hits[i].object.userData.cust);return;}
  var h=hits[0].object.userData;
  if(h.trash){tapBin();return;}
  if(h.col!=null){tapCol(h.col);return;}
  if(h.ship){tapShip(h.ship,h.bay);return;}
  if(h.cust){tapCust(h.cust);return;}
}
window.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(SHEET){closeSheet();return;}if(MODAL==='pause'){closeModal();return;}if($('#modal').hidden)showPause();}
});
document.addEventListener('visibilitychange',function(){if(document.hidden){save();if(SH&&SH.phase!=='done'&&$('#modal').hidden&&!SHEET)showPause();}});
window.addEventListener('pagehide',save);

/* ================= LOOP ================= */
var last=performance.now(),simT=0,lastReal=Date.now(),PF={acc:0,n:0,tier:0,cool:4};
function applyTier(t){PF.tier=t;var dpr=window.devicePixelRatio||1;renderer.setPixelRatio(t===0?Math.min(dpr,1.5):t===1?1:.75);renderer.setSize(W,H);}
function tick(ts){
  requestAnimationFrame(tick);
  var dt=Math.min(.1,Math.max(0,(ts-last)/1000));last=ts;
  var rn=Date.now(),rdt=Math.min(5,Math.max(0,(rn-lastReal)/1000));lastReal=rn;
  empTick(rdt);
  if(SH&&!paused&&SH.phase!=='done'){simT+=dt;updShift(dt,simT);}
  else if(SH&&SH.phase==='done'&&SH.ships){var tt=ts/1000;SH.ships.forEach(function(sh,i){if(sh.v&&sh.st!=='away'){sh.v.g.position.y=Math.sin(tt*1.2+i)*.025-.02;sh.v.g.rotation.z=Math.sin(tt*.9+i)*.01;}});}
  if(!paused)updTW(dt);
  updPuffs(dt);updEnv(dt,ts/1000);
  if(SH){camera.position.copy(camBase.pos);if(shakeAmt>.002){camera.position.x+=rnd(-1,1)*shakeAmt;camera.position.y+=rnd(-1,1)*shakeAmt;shakeAmt*=Math.exp(-dt*9);}}
  renderHud();renderTags(dt);
  if(paused&&frameNo%3)return;
  renderer.render(scene,camera);
  if(!paused&&!document.hidden&&dt>0){PF.acc+=dt;PF.n++;PF.cool-=dt;if(PF.acc>=2){var avg=PF.acc/PF.n;PF.acc=0;PF.n=0;if(avg>1/38&&PF.tier<2&&PF.cool<=0){applyTier(PF.tier+1);PF.cool=4;}}}
}

/* ================= INIT ================= */
function previewShop(){
  var loc=curLoc(),L=layout(loc,W/H),th=IND[loc.ind].theme;
  buildShop(loc,L);clearGroup(stG);
  SH={loc:loc,D:distOf(loc),L:L,th:th,t:0,len:DAYLEN,phase:'done',cust:[],spots:[],dspots:[],ships:[],cranes:[],queue:[],sel:null,pend:[],bots:[],streak:0,s:{day:loc.days+1,goal:0,sales:0,tips:0,pts:0},ev:{},boost:1,slow:0,ice:0,gull:null};
  var y=buildYard(L,th);SH.cols=y.cols;SH.bin=y.bin;SH.binHit=y.binHit;
  for(var i=0;i<U(loc,'cranes');i++){var c=makeCrane(th,L.zBack,L.zFront,L.craneTop);c.set(i?1.2:-.6,0,L.craneTop-.45);stG.add(c.g);SH.cranes.push(c);}
  L.berths.forEach(function(b,bi){var sh=newShip(bi);sh.st='dock';sh.v.g.position.x=b.x;SH.ships.push(sh);});
  fitCamera();
}
function init(){
  thumbInit();
  var s=load();if(s)G=s;else freshG();
  W=window.innerWidth;H=window.innerHeight;renderer.setSize(W,H);
  window.__off=s?offlineGain():null;
  previewShop();
  showTitle(!!s&&(G.day>1||G.locs.length>1));
  requestAnimationFrame(function(t){last=t;requestAnimationFrame(tick);});
}
var fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1800);})]):Promise.resolve();
Promise.all([fontsReady,lzBoot()]).then(init,init);
})();
