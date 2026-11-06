
/* ================= RUSH KIT runtime hooks (models, scene, customers, rules, hazards, scripts, text) ================= */
var KIT_BUILTIN_M=Object.assign({},M),KIT_BUILTIN_TOPS=Object.keys(TOPS);
var KMC=KitModelCore(T,{mat:function(c,m){return m==='metal'?metal(c,.3):m==='glass'?glass(c,.35):m==='glow'?flat(c):toon(c);},
  labelTex:function(txt,bg,fg){return labelTex(txtT(txt),{w:512,h:128,bg:bg||'#ffffff',fg:fg||'#222222'});}});
function kitModel(id){var s=KX.models[id];return s?KMC.build(s):null;}
function txtT(s){s=String(s==null?'':s);if(!KX.terms||!KX.terms.length)return s;KX.terms.forEach(function(t){s=s.replace(t.re,function(m){var r=t.to;if(m[0]===m[0].toUpperCase()&&m[0]!==m[0].toLowerCase())r=r.charAt(0).toUpperCase()+r.slice(1);if(m===m.toUpperCase()&&m.length>1)r=r.toUpperCase();return r;});});return s;}

/* ---------- custom machine looks ---------- */
function kitStationFactory(spec){return function(o,th){
  var mm=KMC.build(spec),g=new T.Group();g.add(mm.g);blob((o.d.w||1.2)*1.1,.9,g);
  var slotP=[],hits=[],w=o.d.w||1.2,y=spec.slotY==null?.11:+spec.slotY,z=spec.slotZ==null?.2:+spec.slotZ;
  if(o.kind==='cooker'){var n=o.slots.length,xs=slotXs(n,w*.82);xs.forEach(function(x,j){slotP.push(V3(x,y,z));hits.push(hitBox(Math.min(.36,w*.82/n),.5,.45,x,y+.2,z,g,{st:o,slot:j}));});}
  hits.push(hitBox(w,1,.85,0,.45,0,g,{st:o}));
  var lamp=lampM();if(spec.lamp!==false){var lm=sp(.03,lamp,w/2-.08,spec.lampY==null?.6:+spec.lampY,.22,g,10);}
  return {g:g,slotP:slotP,outP:V3(0,y+.18,z),hits:hits,upd:function(o,dt,time){
    var s=o.kind==='cooker'?cookState(o):batchState(o),st=s==='work'?'working':s==='bad'?'angry':s==='ready'?(o.kind==='batch'&&o.serv>=o.max?'full':'ready'):'idle';
    setLamp(lamp,s,time);mm.setState(st);mm.upd(dt,time);}};
};}

/* ---------- custom item looks ---------- */
var _makeItem=makeItem;
makeItem=function(base,comps){
  var B=BASES[base];if(!B||!B.model||!KX.models[B.model])return _makeItem(base,comps);
  var g=new T.Group(),mm=KMC.build(KX.models[B.model]),sh=new T.Group();sh.add(mm.g);g.add(sh);var spec=KX.models[B.model];
  var it={g:g,base:base,comps:(comps||[]).slice(),liq:null,lvl:1,liqY0:0,liqH:.1,food:[],foodG:null,plate:null,top:spec.top==null?.14:+spec.top,r:spec.r==null?.08:+spec.r,cx:0,cz:0,prog:1,burnt:false,mm:mm};
  it.comps.slice().sort(function(a,b){return VIS_ORDER.indexOf(a)-VIS_ORDER.indexOf(b);}).forEach(function(c){addComp(it,c);});
  it.setProg=function(k){it.prog=k;sh.scale.setScalar(.45+.55*Math.min(1,k));};
  it.setBurnt=function(){it.burnt=true;mm.g.traverse(function(o){if(o.isMesh)o.material=toon(0x3a2416);});};
  return it;
};
var _addComp=addComp;
addComp=function(it,c){
  var t=TOPS[c];if(!t||KIT_BUILTIN_TOPS.indexOf(c)>=0&&!t.model)return _addComp(it,c);
  if(t.model&&KX.models[t.model]){var mm=KMC.build(KX.models[t.model]);mm.g.position.set(it.cx,it.top,it.cz);it.g.add(mm.g);it.top+=(KX.models[t.model].h==null?.04:+KX.models[t.model].h);return;}
  var vis=t.vis||'dollop',map={drizzle:'caramel',whip:'whip',dust:'cinn',sprinkles:'sprinkles',glaze:'glaze',dollop:'cream',berries:'berries',banana:'banana',granola:'granola',mint:'mint',cherry:'cherry',nuts:'nuts'},key=map[vis]||'cream',keep=TOPS[key];
  TOPS[key]=Object.assign({},keep,{col:t.col});try{_addComp(it,key);}finally{TOPS[key]=keep;}
};

/* ---------- customers: types, looks, variants ---------- */
var _makeCustomer=makeCustomer,_animCust=animCust;
function custTypesFor(){var ind=SH&&SH.loc?IND[SH.loc.ind]:null,list=KX.customers||[];if(ind&&ind.customers&&ind.customers.length)list=list.filter(function(c){return ind.customers.indexOf(c.id)>=0;});
  var d=SH&&SH.D?SH.D.kitName:'';list=list.filter(function(c){return !c.districts||!c.districts.length||c.districts.indexOf(d)>=0;});return list;}
function pickCustType(){var l=custTypesFor();if(!l.length)return null;var tot=0;l.forEach(function(c){tot+=+c.weight||1;});var r=Math.random()*tot;for(var i=0;i<l.length;i++){r-=+l[i].weight||1;if(r<=0)return l[i];}return l[0];}
makeCustomer=function(D,opt){
  opt=opt||{};var V=KX.variants||{},model=null,ct=null;
  if(opt.staff!=null)return _makeCustomer(D,opt);
  if(opt.vip&&V.vip&&V.vip.model)model=V.vip.model;else if(opt.insp&&V.insp&&V.insp.model)model=V.insp.model;else if(opt.courier&&V.courier&&V.courier.model)model=V.courier.model;
  else if(!opt.vip&&!opt.insp&&!opt.courier){ct=KX.nextType||pickCustType();if(ct&&ct.model)model=ct.model;}
  KX.lastType=ct;KX.nextType=null;
  if(!model||!KX.models[model])return _makeCustomer(D,opt);
  var root=new T.Group(),body=new T.Group();root.add(body);var spec=KX.models[model],mm=KMC.build(spec);body.add(mm.g);blob(spec.shadow==null?.9:+spec.shadow,.7,root);
  var dummy=function(){var g=new T.Group();return g;},me={root:root,body:body,head:dummy(),legs:[dummy(),dummy()],arms:[dummy(),dummy()],eyes:[dummy(),dummy()],brows:[dummy(),dummy()],mouths:{smile:dummy(),frown:dummy(),flat:dummy(),open:dummy()},blush:[dummy(),dummy()],ph:Math.random()*6,blinkT:9,blink:0,mood:'',hopT:0,shakeT:0,kit:mm,kitSpec:spec};
  me.setMood=function(m){me.mood=m;};me.hop=function(){me.hopT=.5;};me.shake=function(){me.shakeT=.6;};
  return me;
};
animCust=function(me,dt,time,moving){
  if(!me.kit)return _animCust(me,dt,time,moving);
  var st=moving?'moving':me.mood==='angry'?'angry':me.mood==='happy'||me.mood==='wow'?'happy':'idle';me.kit.setState(st);me.kit.upd(dt,time);
  var bob=me.kitSpec.walk==='roll'?0:(moving?Math.abs(Math.sin(time*10))*.04:0);me.body.position.y=bob;
  if(me.hopT>0){me.hopT-=dt;var k=1-me.hopT/.5;me.body.position.y+=Math.sin(k*Math.PI)*.18;}
  if(me.shakeT>0){me.shakeT-=dt;me.body.rotation.z=Math.sin(time*50)*.06*me.shakeT;}else me.body.rotation.z=0;
};
var _spawnCust=spawnCust;
spawnCust=function(opt){
  var n0=SH.cust.length,ok=_spawnCust(opt);if(!ok||SH.cust.length===n0)return ok;
  var c=SH.cust[SH.cust.length-1],ct=KX.lastType;c.kitType=ct?ct.id:(c.vip?'vip':c.insp?'insp':c.courier?'courier':'');
  if(ct){if(ct.speed)c.speed*=+ct.speed;if(ct.pat){c.max*=+ct.pat;c.pat=c.max;}
    var mn=+((ct.size||[])[0])||0,mx=+((ct.size||[])[1])||0;if(mx){var want=Math.round(mn+Math.random()*(mx-mn));while(c.items.length<want){var o=makeOrder()[0];if(!o)break;c.items.push({r:o,key:o.key,done:false,inc:false});}if(c.items.length>want&&want>0)c.items.length=want;}
    if(ct.scale)c.v.root.scale.setScalar(1.25*+ct.scale);
    if(ct.say)say(c,ct.say,'',2);}
  var V=KX.variants||{};if(c.vip&&V.vip&&V.vip.banner)banner(V.vip.banner,V.vip.sub||'','hot');if(c.insp&&V.insp&&V.insp.banner)banner(V.insp.banner,V.insp.sub||'','cool');
  var pm=modVal('patience');if(pm!==1){c.max*=pm;c.pat=c.max;}
  kitEmit('arrive',{type:c.kitType,c:c});
  return ok;
};
var _payFull=payFull;
payFull=function(c){var ct=(KX.customers||[]).filter(function(x){return x.id===c.kitType;})[0],D=SH.D,keep=D.tips;if(ct&&ct.tips)D.tips=(keep||1)*+ct.tips;try{_payFull(c);}finally{D.tips=keep;}kitEmit('served',{type:c.kitType,items:c.items.length});};
var _walkout=walkout;walkout=function(c){_walkout(c);kitEmit('walkout',{type:c.kitType});};

/* ---------- scene / environment ---------- */
var _buildShop=buildShop,_layout=layout;
function sceneOf(){var s=KX.scene;if(SH&&SH.D&&SH.D.scene&&KX.scenes&&KX.scenes[SH.D.scene])s=Object.assign({},s,KX.scenes[SH.D.scene]);return s;}
layout=function(loc,aspect){var L=_layout(loc,aspect),S=KX.scene;if(S&&S.mode==='custom'){if(S.noTables){L.tables=[];}if(S.noExpress)L.express=null;}return L;};
buildShop=function(loc,L){
  var S=KX.scene;KX.props=[];
  if(!S||S.mode!=='custom'){scene.background=null;custG.position.y=0;scene.fog=null;return _buildShop(loc,L);}
  clearGroup(envG);var th=IND[loc.ind].theme,D=district(loc.city,loc.did),ds=(S.districts||{})[D.kitName]||{},sky=kcol(ds.sky||S.sky,0x9fd6f4),dy=S.deck?.86:0,W=2*L.rx+8,zF=L.zF;
  scene.background=new T.Color(sky);scene.fog=S.fog&&S.fog.on?new T.Fog(kcol(S.fog.color,sky),+S.fog.near||12,+S.fog.far||40):null;
  custG.position.y=S.deck?dy:0;
  function ground(c,z0,z1,y,pat){var p=plane(1,1,pat?toon(0xffffff,{map:patTex(c,pat)}):toon(c),0,y,(z0+z1)/2,envG);p.rotation.x=-Math.PI/2;p.scale.set(W,z1-z0,1);if(pat&&p.material.map)p.material.map.repeat.set(W/2,(z1-z0)/2);return p;}
  var zBack=-1.12,zB=-6;
  ground(kcol(S.back||S.ground,0x8f969c),zB,zBack,dy+.001,S.backPat||'');
  ground(kcol(S.ground,0xd9d2c3),zBack,zF+(S.water&&S.water.on?(+S.water.gap||.6):6),dy,S.groundPat||'');
  if(S.water&&S.water.on){var wz=zF+(+S.water.gap||.6),wc=kcol(S.water.color,0x2f8fc4),wp=plane(1,1,toon(0xffffff,{map:waterTex2(wc)}),0,dy-.35,wz+8,envG);wp.rotation.x=-Math.PI/2;wp.scale.set(W+20,16,1);KX.water=wp;
    bx(W,dy+.35,.3,toon(kcol(S.edge,0xc7bfae)),0,(dy-.35)/2,wz,envG);}
  if(S.lane&&S.lane.on){for(var x=-W/2;x<W/2;x+=1.2){var ln=plane(.6,.08,flat(kcol(S.lane.color,0xffffff)),x,dy+.004,-2.75,envG);ln.rotation.x=-Math.PI/2;}}
  if(S.counter!=='none')_counterOnly(loc,L,th,dy);
  (S.props||[]).forEach(function(p){if(!KX.models[p.model])return;var mm=KMC.build(KX.models[p.model]),g=mm.g;
    var ox=p.side==='right'?L.rx-1:p.side==='left'?-L.rx+1:0;g.position.set((+p.x||0)+ox,(+p.y||0)+dy,+p.z||0);g.rotation.y=(+p.ry||0)*Math.PI/180;g.scale.multiplyScalar(+p.s||1);envG.add(g);KX.props.push(mm);});
  if(S.sign!==false){var sg=new T.Group();sg.position.set(0,dy+.02,zBack-.02);}
};
function _counterOnly(loc,L,th,dy){
  var hw=L.hw,zF=L.zF,dw=2*hw+.5,d=zF+.9,S=KX.scene;
  if(S.deck){var dk=bx(dw,.12,d+.3,toon(kcol(S.counterColor,th.counter)),0,dy-.06,(zF-.9)/2,envG);return;}
  bx(dw,.1,d,toon(kcol(S.counterTop,th.top)),0,.85,(zF-.9)/2,envG);bx(dw,.8,.12,toon(kcol(S.counterColor,th.counter)),0,.4,zF+.02,envG);
  if(S.divider!==false){bx(L.divR+hw+.25,1.05,.4,toon(kcol(S.counterColor,th.counter)),(L.divR-(hw+.25))/2,.525,-1.12,envG);bx(L.divR+hw+.45,.08,.56,toon(kcol(S.counterTop,th.top)),(L.divR-(hw+.25))/2,1.09,-1.12,envG);}
}
function patTex(c,pat){return canvasTex(128,128,function(g){g.fillStyle=hexCss(c);g.fillRect(0,0,128,128);
  if(pat==='tiles'){g.fillStyle='rgba(0,0,0,.08)';for(var i=0;i<4;i++)for(var j=0;j<4;j++)if((i+j)%2)g.fillRect(i*32,j*32,32,32);}
  else if(pat==='planks'){g.fillStyle='rgba(0,0,0,.14)';for(var y=0;y<128;y+=16)g.fillRect(0,y,128,2);for(var k=0;k<12;k++)g.fillRect((k*53)%128,(k*16)%128,2,16);}
  else if(pat==='concrete'){g.fillStyle='rgba(0,0,0,.1)';g.fillRect(0,0,128,2);g.fillRect(0,0,2,128);speck(g,128,128,300,.06);}
  else if(pat==='asphalt'){speck(g,128,128,700,.08);}
  else if(pat==='grass'){g.fillStyle='rgba(0,80,0,.15)';for(var q=0;q<200;q++)g.fillRect(Math.random()*128,Math.random()*128,2,4);}
  else if(pat==='sand'){speck(g,128,128,500,.07);}},[1,1],'pat|'+c+'|'+pat);}
function waterTex2(c){return canvasTex(256,256,function(g){g.fillStyle=hexCss(c);g.fillRect(0,0,256,256);g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=3;for(var i=0;i<40;i++){var x=Math.random()*256,y=Math.random()*256;g.beginPath();g.moveTo(x,y);g.lineTo(x+18+Math.random()*20,y);g.stroke();}},[6,4],'wat|'+c);}
var _fitCamera=fitCamera;
fitCamera=function(){_fitCamera();var C=(KX.scene||{}).camera;if(!SH||!C)return;var tgt=camBase.tgt,z=+C.zoom||1,tilt=(+C.tilt||0)*Math.PI/180;
  if(tilt){var v=camera.position.clone().sub(tgt),r=v.length(),a=Math.atan2(v.y,v.z)+tilt;v.set(v.x,Math.sin(a)*r,Math.cos(a)*r);camera.position.copy(tgt).add(v);camera.lookAt(tgt);}
  if(z!==1){camera.position.copy(tgt).add(camera.position.clone().sub(tgt).multiplyScalar(1/z));camera.lookAt(tgt);}
  camera.updateMatrixWorld(true);camBase.pos.copy(camera.position);};

/* ---------- modifiers (rules change demand, prices, patience, machine speed) ---------- */
function modVal(kind,id){var m=1,now=SH?SH.t:0;KX.mods=KX.mods.filter(function(x){return x.until>now;});KX.mods.forEach(function(x){if(x.kind===kind&&(!x.id||x.id===id))m*=x.mult;});return m;}
var _spawnRate=spawnRate;spawnRate=function(){return _spawnRate()*modVal('demand');};
var _priceMult=priceMult;priceMult=function(loc){return _priceMult(loc)*(SH&&SH.loc===loc?modVal('price'):1);};
var _stTime=stTime;stTime=function(o){return _stTime(o)/modVal('speed',o.k);};

/* ---------- hazards (tap-to-clear) ---------- */
function hazardStart(id){
  var H=KX.hazards[id];if(!H||!SH||SH.phase!=='open')return;var eff=H.effect||'steal';
  var target=null,ti=-1;if(eff==='steal'){var items=[];SH.tray.forEach(function(e,i){if(e&&!e.fly)items.push(i);});if(!items.length)return;ti=pick(items);target=trayW(ti).add(V3(0,.25,0));}
  else{var o=pick(SH.st);target=o?o.v.g.position.clone().add(V3(0,1.2,0)):V3(0,1.5,0);}
  var mm=H.model&&KX.models[H.model]?KMC.build(KX.models[H.model]):null,g=mm?mm.g:makeGull().g;var wrap=new T.Group();wrap.add(g);custG.add(wrap);
  var side=Math.random()<.5?-1:1,from=V3(side*(SH.L.rx-.5),3,-1);wrap.position.copy(from);if(side>0)wrap.rotation.y=Math.PI;
  var hit=hitBox(1,.9,1,0,.2,0,wrap,{khz:1});
  var h={id:id,H:H,mm:mm,g:wrap,from:from,to:target.clone().sub(V3(0,custG.position.y,0)),ti:ti,e:ti>=0?SH.tray[ti]:null,t:0,dur:+H.dur||2.6,side:side,hit:hit,phase:'in'};KX.hz.push(h);
  if(H.banner!==false)banner(H.banner||H.name||'Look out!',H.sub||'Tap it before it hits','hot');if(H.sound&&sfx[H.sound])sfx[H.sound]();
}
function updHazards(dt,time){
  KX.hz.slice().forEach(function(h){h.t+=dt;if(h.mm){h.mm.setState(h.phase==='in'?'moving':'idle');h.mm.upd(dt,time);}
    if(h.phase==='in'){var k=Math.min(1,h.t/h.dur);h.g.position.lerpVectors(h.from,h.to,easeIO(k));h.g.position.y+=Math.sin(k*Math.PI)*.6;
      if(k>=1){hazardHit(h);h.phase='out';h.t=0;h.from=h.g.position.clone();h.to=V3(-h.side*(SH.L.hw+4),4,-2);h.g.rotation.y+=Math.PI;}}
    else{var k2=Math.min(1,h.t/1.4);h.g.position.lerpVectors(h.from,h.to,easeIO(k2));if(k2>=1){custG.remove(h.g);KX.hz.splice(KX.hz.indexOf(h),1);}}});
}
function hazardHit(h){var H=h.H,eff=H.effect||'steal',amt=+H.amount||0;
  if(eff==='steal'){var en=SH.tray[h.ti];if(en&&en===h.e&&!en.fly){SH.tray[h.ti]=null;if(SH.sel===h.ti)SH.sel=-1;h.g.add(en.it.g);en.it.g.position.set(0,-.2,0);wasteCost(en.base);toast(txtT(H.hitText||((H.name||'It')+' took a '+BASES[en.base].name.toLowerCase()+'!')),'bad');}}
  else if(eff==='money'){G.cash-=amt||20;toast(txtT(H.hitText||((H.name||'It')+' cost you '+fmt(amt||20))),'bad');}
  else if(eff==='rep'){repAdd(SH.loc,-(amt||.2));toast(txtT(H.hitText||'Your reputation took a hit'),'bad');}
  else if(eff==='patience'){SH.cust.forEach(function(c){if(c.state==='wait')c.pat*=Math.max(.2,1-(amt||.3));});toast(txtT(H.hitText||'Customers are getting impatient'),'bad');}
  shakeCam&&shakeCam(.05);kitEmit('hazardHit',{id:h.id});}
var _shiftHits=shiftHits;shiftHits=function(){var a=_shiftHits();KX.hz.forEach(function(h){if(h.phase==='in')a.push(h.hit);});return a;};
var _tapAt=tapAt;
tapAt=function(x,y){
  if(SH&&!paused&&SH.phase!=='done'&&KX.hz.length){var r=cvs.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    var hs=ray.intersectObjects(KX.hz.filter(function(h){return h.phase==='in';}).map(function(h){return h.hit;}),false);
    if(hs.length){var h=KX.hz.filter(function(q){return q.hit===hs[0].object;})[0];if(h){h.phase='out';h.t=0;h.from=h.g.position.clone();h.to=V3(-h.side*(SH.L.hw+4),4.5,-2);h.g.rotation.y+=Math.PI;sparkle(h.from.clone().add(V3(0,custG.position.y,0)),8,0xffffff);addXP(5);toast(txtT(h.H.clearText||'Cleared!'),'good');kitEmit('hazardClear',{id:h.id});return;}}}
  return _tapAt(x,y);
};
function shakeCam(a){try{camera.position.x+=a;setTimeout(function(){camera.position.copy(camBase.pos);},120);}catch(e){}}

/* ---------- rules ---------- */
function kitCond(cs){return (cs||[]).every(function(c){var v=0,n=c.n,ok;
  switch(c.v){case 'money':v=G.cash;break;case 'day':v=SH?SH.s.day:G.day;break;case 'level':v=G.lvl;break;case 'rep':v=SH?SH.loc.rep:3;break;case 'streak':v=SH?SH.streak:0;break;case 'served':v=SH?SH.s.served:0;break;
    case 'time':v=SH?SH.t/SH.len:0;break;case 'waiting':v=SH?SH.cust.filter(function(x){return x.state==='wait';}).length:0;break;
    case 'district':return c.op==='!='?(SH&&SH.D.kitName)!==n&&(SH&&SH.D.name)!==n:(SH&&(SH.D.kitName===n||SH.D.name===n));
    case 'type':return c.op==='!='?(SH&&IND[SH.loc.ind].kitId)!==n:(SH&&IND[SH.loc.ind].kitId===n);
    case 'chance':return Math.random()<(+n||0)/100;
    default:if(String(c.v).indexOf('var.')===0)v=KX.vars[c.v.slice(4)]||0;}
  n=+n||0;switch(c.op){case '>':ok=v>n;break;case '<':ok=v<n;break;case '<=':ok=v<=n;break;case '==':ok=v==n;break;case '!=':ok=v!=n;break;default:ok=v>=n;}return ok;});}
function kitEmit(ev,data){
  if(!KX.rules)return;data=data||{};
  KX.rules.forEach(function(r,i){var w=r.when||{};if(w.t!==ev)return;
    if(ev==='arrive'&&w.type&&w.type!==data.type)return;if((ev==='served'||ev==='walkout')&&w.type&&w.type!==data.type)return;
    if((ev==='done'||ev==='burnt')&&w.station&&w.station!==data.station)return;if((ev==='hazardHit'||ev==='hazardClear')&&w.hazard&&w.hazard!==data.id)return;
    if(!kitCond(r.if))return;kitDo(r.do,data,i);});
  try{(KX.hooks[ev]||[]).forEach(function(f){f(data);});(KX.hooks['*']||[]).forEach(function(f){f(ev,data);});}catch(e){scriptErr(e);}
}
function kitDo(acts,data){(acts||[]).forEach(function(a){var n=+a.n||0,sec=+a.sec||15;try{switch(a.t){
  case 'banner':banner(txtT(a.big||''),txtT(a.small||''),a.kind||'hot');break;
  case 'toast':toast(txtT(a.text||''),a.kind||'');break;
  case 'spawn':for(var i=0;i<(+a.n||1);i++){if(a.type){KX.nextType=(KX.customers||[]).filter(function(c){return c.id===a.type;})[0]||null;}if(a.variant==='vip')spawnCust({vip:true});else if(a.variant==='insp')spawnCust({insp:true});else if(!spawnCust())SH.pend.push(SH.t);}break;
  case 'burst':SH.burst+=(+a.n||3);break;
  case 'demand':KX.mods.push({kind:'demand',mult:+a.mult||1,until:SH.t+sec});break;
  case 'price':KX.mods.push({kind:'price',mult:+a.mult||1,until:SH.t+sec});break;
  case 'patience':KX.mods.push({kind:'patience',mult:+a.mult||1,until:SH.t+sec});if(a.now!==false)SH.cust.forEach(function(c){if(c.state==='wait'){c.pat=Math.min(c.max,c.pat*(+a.mult||1));}});break;
  case 'rush':SH.cust.filter(function(c){return c.state==='wait'&&!c.board&&!c.courier;}).slice(0,+a.n||2).forEach(function(c){c.board=true;c.dirty=true;});break;
  case 'speed':KX.mods.push({kind:'speed',id:a.station||null,mult:+a.mult||1,until:SH.t+sec});break;
  case 'money':G.cash+=n;if(n)popWorld(V3(0,2,0),(n>0?'+':'')+fmt(n),n>0?'tip':'bad');break;
  case 'rep':repAdd(SH.loc,n);break;
  case 'xp':addXP(n);break;
  case 'score':SH.s.pts=Math.max(0,(SH.s.pts||0)+n);break;
  case 'hazard':hazardStart(a.id);break;
  case 'sound':if(sfx[a.s])sfx[a.s]();break;
  case 'setvar':var nm=a.v||'x';KX.vars[nm]=a.op==='set'?n:(KX.vars[nm]||0)+n;break;
  case 'heat':SH.heat=true;break;
  case 'script':var f=KX.actions&&KX.actions[a.name];if(f)f(data);break;
}}catch(e){console.warn('rule action',a.t,e);}});}
function kitTick(dt){
  if(!SH||SH.phase!=='open')return;
  (KX.rules||[]).forEach(function(r,i){var w=r.when||{};
    if(w.t==='every'){KX.every[i]=(KX.every[i]||0)+dt;var p=Math.max(1,+w.sec||30);if(KX.every[i]>=p){KX.every[i]-=p;if(kitCond(r.if))kitDo(r.do,{},i);}}
    else if(w.t==='random'){if(Math.random()<dt*(+w.per||1)/60&&kitCond(r.if))kitDo(r.do,{},i);}
    else if(w.t==='at'){if(!KX.fired[i]&&SH.t/SH.len>=(+w.f||.5)){KX.fired[i]=1;if(kitCond(r.if))kitDo(r.do,{},i);}}
    else if(w.t==='money'||w.t==='served'||w.t==='streak'){var v=w.t==='money'?G.cash:w.t==='served'?SH.s.served:SH.streak;if(!KX.fired[i]&&v>=(+w.n||0)){KX.fired[i]=1;if(kitCond(r.if))kitDo(r.do,{},i);}}
  });
  SH.st.forEach(function(o){var prev=KX.stPrev[o.k]||{},cur=o.kind==='cooker'?o.slots.map(function(s){return s.st;}):[o.st];
    cur.forEach(function(s,j){var p=prev[j];if(p!==s){if(s==='ready')kitEmit('done',{station:STN[o.k].kitId||o.k});if(s==='burnt'||s==='stale')kitEmit('burnt',{station:STN[o.k].kitId||o.k});}});KX.stPrev[o.k]=cur;});
}
var _startShift=startShift;startShift=function(){KX.mods=[];KX.fired={};KX.every={};KX.stPrev={};KX.hz=[];_startShift();kitEmit('start',{day:SH.s.day});};
var _endShift=endShift;endShift=function(){kitEmit('end',{day:SH.s.day});KX.hz.forEach(function(h){custG.remove(h.g);});KX.hz=[];_endShift();};
var _updShift=updShift;updShift=function(dt,time){_updShift(dt,time);if(!SH)return;kitTick(dt);updHazards(dt,time);KX.props.forEach(function(m){m.upd(dt,time);});if(KX.water&&KX.water.material.map)KX.water.material.map.offset.x+=dt*.01;
  try{(KX.hooks.tick||[]).forEach(function(f){f(dt);});}catch(e){scriptErr(e);}};
var _onLevel=onLevel;onLevel=function(l){_onLevel(l);kitEmit('levelup',{level:l});};

/* ---------- generic tutorial hints ---------- */
tutHint=function(){
  if(!SH||SH.phase!=='open'||G.stats.served>=3||G.locs.length>1)return null;
  if(!SH.cust.some(function(c){return c.state==='wait';}))return null;var tx=KX.text||{},i,e;
  for(i=0;i<SH.tray.length;i++){e=SH.tray[i];if(e&&!e.fly&&findCust(rkey(e.base,e.comps)))return {t:txtT(tx.tutServe||'Tap it to hand it over'),p:trayW(i).add(V3(0,.5,0))};}
  for(var a=0;a<SH.st.length;a++){var o=SH.st[a];if(o.kind==='cooker')for(i=0;i<o.slots.length;i++)if(o.slots[i].st==='ready')return {t:txtT(tx.tutTake||'Tap it to put it on the tray'),p:slotW(o,i).add(V3(0,.75,0))};}
  for(i=0;i<SH.tray.length;i++){e=SH.tray[i];if(!e||e.fly)continue;for(a=0;a<SH.st.length;a++){var s=SH.st[a];if(s.kind==='batch'&&s.d.role==='comp'&&accepts(e,s.d.makes)&&wanted(e,s.d.makes))return {t:txtT((tx.tutComp||'Tap the {machine} to add it').replace('{machine}',s.d.name)),p:outW(s).add(V3(0,.75,0))};}}
  for(a=0;a<SH.st.length;a++){var b=SH.st[a];if(b.d.role!=='comp'&&b.kind!=='rack'&&demandBase(b.d.makes)>supplyBase(b.d.makes))return {t:txtT((tx.tutStart||'Tap the {machine}').replace('{machine}',b.d.name)),p:b.v.g.position.clone().add(V3(0,1.25,0))};}
  return null;
};

/* ---------- text: rename words everywhere ---------- */
var _labelTex=labelTex;labelTex=function(t,o){return _labelTex(txtT(t),o);};
var _fmt=fmt;fmt=function(v){var s=_fmt(v);return KX.currency?s.replace('$',KX.currency):s;};
function txNode(n){if(n.nodeType===3){var v=n.nodeValue;if(n.__tx===v)return;var t=txtT(v);n.__tx=t;if(t!==v)n.nodeValue=t;}else if(n.nodeType===1&&n.tagName!=='SCRIPT'&&n.tagName!=='STYLE'){for(var c=n.firstChild;c;c=c.nextSibling)txNode(c);}}
function kitTextStart(){if(!KX.terms||!KX.terms.length)return;txNode(document.body);new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='characterData')txNode(m.target);else m.addedNodes.forEach(txNode);});}).observe(document.body,{childList:true,subtree:true,characterData:true});}

/* ---------- saves: repair saves made with an older version of this pack ---------- */
var _load=load;load=function(){var s=_load();if(!s)return s;var okInd=IND_ORDER.length?IND_ORDER:['coffee'];
  s.locs.forEach(function(l){if(!IND[l.ind])l.ind=okInd[0];Object.keys(l.st||{}).forEach(function(k){if(!STN[k]||IND[l.ind].stations.indexOf(k)<0)delete l.st[k];});
    IND[l.ind].start.forEach(function(k){if(!l.st[k])l.st[k]={s:0,c:0};});Object.keys(l.tops||{}).forEach(function(t){if(!IND[l.ind].tops[t])delete l.tops[t];});
    if(!cityDistricts(l.city).some(function(d){return d.id===l.did;}))l.did=cityDistricts(l.city)[0].id;});return s;};

/* ---------- creator scripts ---------- */
function scriptErr(e){console.warn('script',e);if(!KX.errShown){KX.errShown=1;toast('Script error: '+String(e&&e.message||e).slice(0,80),'bad');}}
function kitApi(){
  var on=function(ev,f){(KX.hooks[ev]=KX.hooks[ev]||[]).push(f);};
  return {
    on:on, onTick:function(f){on('tick',f);}, onEvent:function(f){on('*',f);}, action:function(name,f){(KX.actions=KX.actions||{})[name]=f;},
    get money(){return G?G.cash:0;}, addMoney:function(n){G.cash+=+n||0;}, addScore:function(n){if(SH)SH.s.pts=Math.max(0,(SH.s.pts||0)+(+n||0));},
    get score(){return SH?SH.s.pts||0:0;}, get day(){return SH?SH.s.day:G.day;}, get level(){return G.lvl;}, get time(){return SH?SH.t/SH.len:0;}, get reputation(){return SH?SH.loc.rep:0;},
    addRep:function(n){if(SH)repAdd(SH.loc,+n||0);}, addXP:function(n){addXP(+n||0);},
    banner:function(a,b){banner(String(a||''),String(b||''),'hot');}, toast:function(t){toast(String(t||''));},
    spawn:function(type,n){kitDo([{t:'spawn',type:type,n:n||1}]);}, burst:function(n){if(SH)SH.burst+=+n||3;}, hazard:function(id){hazardStart(id);},
    demand:function(m,sec){kitDo([{t:'demand',mult:m,sec:sec}]);}, prices:function(m,sec){kitDo([{t:'price',mult:m,sec:sec}]);}, patience:function(m,sec){kitDo([{t:'patience',mult:m,sec:sec}]);},
    machineSpeed:function(id,m,sec){var k=Object.keys(STN).filter(function(x){return STN[x].kitId===id;})[0];kitDo([{t:'speed',station:k||id,mult:m,sec:sec}]);},
    get customers(){return SH?SH.cust.filter(function(c){return c.state==='wait';}).map(function(c){return {type:c.kitType,patience:c.pat/c.max,items:c.items.map(function(x){return x.r.name;}),rush:function(){c.board=true;c.dirty=true;}};}):[];},
    get machines(){return SH?SH.st.filter(function(o){return o.kind!=='rack';}).map(function(o){return {id:STN[o.k].kitId||o.k,name:o.d.name,state:o.kind==='cooker'?cookState(o):batchState(o)};}):[];},
    getVar:function(k){return KX.vars[k]||0;}, setVar:function(k,v){KX.vars[k]=v;}, random:Math.random,
    sound:function(n){if(sfx[n])sfx[n]();},
    ui:function(html){var el=document.getElementById('kitui');if(!el){el=document.createElement('div');el.id='kitui';el.style.cssText='position:fixed;left:50%;top:118px;transform:translateX(-50%);z-index:30;pointer-events:none;font:800 14px system-ui;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.6);text-align:center';document.body.appendChild(el);}el.textContent=String(html==null?'':html);}
  };
}
function kitRunScript(code){if(!code||!String(code).trim())return;try{var api=kitApi();(new Function('api','"use strict";\n'+code))(api);}catch(e){scriptErr(e);}}
window.__KITAPI=function(){return kitApi();};
