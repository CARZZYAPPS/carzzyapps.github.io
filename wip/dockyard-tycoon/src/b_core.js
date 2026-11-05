(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s);};
var T=window.THREE;
function fatal(msg){var m=$('#modal');m.hidden=false;m.innerHTML='<div class="card"><h1>Can\'t start</h1><p class="lead">'+msg+'</p></div>';}
if(!T){fatal('The 3D engine did not load. Check your connection and reload the page.');return;}

/* ---------- helpers ---------- */
var rnd=function(a,b){return a+Math.random()*(b-a);};
var pick=function(a){return a[Math.floor(Math.random()*a.length)];};
var clamp=function(v,a,b){return v<a?a:v>b?b:v;};
var lerp=function(a,b,t){return a+(b-a)*t;};
var easeIO=function(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;};
var easeOut=function(t){return 1-Math.pow(1-t,3);};
var easeBack=function(t){var c=1.70158,c3=c+1;return 1+c3*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
var V3=function(x,y,z){return new T.Vector3(x,y,z);};
var now=function(){return Date.now();};
function wpick(list,wf){var tot=0,i,w=[];for(i=0;i<list.length;i++){w[i]=Math.max(0,wf(list[i]));tot+=w[i];}if(tot<=0)return list[0];var r=Math.random()*tot;for(i=0;i<list.length;i++){r-=w[i];if(r<=0)return list[i];}return list[list.length-1];}
function fmt(v){
  var a=Math.abs(v),s=v<0?'-$':'$';
  if(a<1000)return s+(a<100&&Math.abs(a-Math.round(a))>.004?a.toFixed(2):Math.round(a).toString());
  var u=['k','M','B','T','Qa','Qi','Sx'],i=-1;while(a>=1000&&i<u.length-1){a/=1000;i++;}
  return s+(a<10?a.toFixed(2):a<100?a.toFixed(1):Math.round(a))+u[i];
}
function fmtR(v){return fmt(v).replace(/\.00$/,'');}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hexCss(c){return '#'+('000000'+c.toString(16)).slice(-6);}

/* ---------- renderer ---------- */
var host=$('#scene'),renderer;
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(e){fatal('This browser could not start WebGL. Turn on hardware acceleration or try another browser.');return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.NoToneMapping;
host.appendChild(renderer.domElement);
var scene=new T.Scene();
scene.background=new T.Color(0x2a1a12);
var camera=new T.PerspectiveCamera(34,1,.1,80);
var hemi=new T.HemisphereLight(0xfff1e0,0x8a6a56,.5);scene.add(hemi);
var keyL=new T.DirectionalLight(0xffffff,.62);keyL.position.set(-3,9,7);scene.add(keyL);
var fillL=new T.DirectionalLight(0xffd9b0,.22);fillL.position.set(6,3,2);scene.add(fillL);

function makeEnv(r){
  var pm=new T.PMREMGenerator(r),es=new T.Scene();es.background=new T.Color(0x6b5546);
  function add(c,x,y,z,w,h){var m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);}
  add(new T.Color(3,2.8,2.5),0,6,0,8,8);add(new T.Color(1.6,1.5,1.4),7,2,3,4,4);add(new T.Color(.9,1,1.25),-7,2,-2,5,3);add(new T.Color(1.2,1,.8),0,1,8,8,3);
  var t=pm.fromScene(es,.04).texture;pm.dispose();return t;
}
scene.environment=makeEnv(renderer);

/* ---------- materials ---------- */
var grad=(function(){var a=[104,166,218,255],d=new Uint8Array(16);for(var i=0;i<4;i++){d[i*4]=d[i*4+1]=d[i*4+2]=a[i];d[i*4+3]=255;}var t=new T.DataTexture(d,4,1,T.RGBAFormat);t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;})();
var MC={};
function toon(c,o){
  o=o||{};var k='t'+c+'_'+(o.e!=null?o.e+'x'+(o.ei||1):'')+'_'+(o.op||'')+'_'+(o.ds?1:0)+'_'+(o.map?o.map.uuid:'');
  if(MC[k])return MC[k];
  var m=new T.MeshToonMaterial({color:c,gradientMap:grad});
  if(o.map)m.map=o.map;
  if(o.e!=null){m.emissive=new T.Color(o.e);m.emissiveIntensity=o.ei||1;}
  if(o.op){m.transparent=true;m.opacity=o.op;m.depthWrite=false;}
  if(o.ds)m.side=T.DoubleSide;
  return MC[k]=m;
}
function toonU(c,e){var m=new T.MeshToonMaterial({color:c,gradientMap:grad});if(e!=null){m.emissive=new T.Color(e);}return m;}
function metal(c,r){var k='m'+c+'_'+r;return MC[k]||(MC[k]=new T.MeshStandardMaterial({color:c,metalness:.85,roughness:r==null?.28:r,side:T.DoubleSide}));}
function glass(c,op){var k='g'+c+'_'+op;return MC[k]||(MC[k]=new T.MeshStandardMaterial({color:c,metalness:.1,roughness:.06,transparent:true,opacity:op||.25,depthWrite:false,side:T.DoubleSide}));}
function flat(c,o){o=o||{};var k='b'+c+'_'+(o.op||'')+'_'+(o.map?o.map.uuid:'')+(o.add?'a':'');if(MC[k])return MC[k];var m=new T.MeshBasicMaterial({color:c});if(o.map)m.map=o.map;if(o.op){m.transparent=true;m.opacity=o.op;m.depthWrite=false;}if(o.add)m.blending=T.AdditiveBlending;return MC[k]=m;}
var HIT=new T.MeshBasicMaterial({visible:false});

/* ---------- geometry ---------- */
var GC={};
function geo(key,fn){return GC[key]||(GC[key]=fn());}
function mk(g,m,x,y,z,p){var o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);if(p)p.add(o);return o;}
function bx(w,h,d,m,x,y,z,p){return mk(geo('b'+w+'_'+h+'_'+d,function(){return new T.BoxGeometry(w,h,d);}),m,x,y,z,p);}
function cy(rt,rb,h,m,x,y,z,p,s){s=s||20;return mk(geo('c'+rt+'_'+rb+'_'+h+'_'+s,function(){return new T.CylinderGeometry(rt,rb,h,s);}),m,x,y,z,p);}
function cyB(r,h,m,x,y,z,p,s){s=s||20;return mk(geo('cb'+r+'_'+h+'_'+s,function(){var g=new T.CylinderGeometry(r,r,h,s);g.translate(0,h/2,0);return g;}),m,x,y,z,p);}
function sp(r,m,x,y,z,p,s){s=s||16;return mk(geo('s'+r+'_'+s,function(){return new T.SphereGeometry(r,s,Math.max(8,s*.75|0));}),m,x,y,z,p);}
function tor(r,t,m,x,y,z,p,arc,s){arc=arc||Math.PI*2;s=s||20;return mk(geo('t'+r+'_'+t+'_'+arc.toFixed(3)+'_'+s,function(){return new T.TorusGeometry(r,t,8,s,arc);}),m,x,y,z,p);}
function cone(r,h,m,x,y,z,p,s){s=s||16;return mk(geo('k'+r+'_'+h+'_'+s,function(){return new T.ConeGeometry(r,h,s);}),m,x,y,z,p);}
function la(key,pts,m,x,y,z,p,s){return mk(geo('l'+key,function(){return new T.LatheGeometry(pts.map(function(q){return new T.Vector2(q[0],q[1]);}),s||24);}),m,x,y,z,p);}
function plane(w,h,m,x,y,z,p){return mk(geo('p'+w+'_'+h,function(){return new T.PlaneGeometry(w,h);}),m,x,y,z,p);}
function rboxG(w,h,d,r,b){
  b=b==null?Math.min(.02,d*.2,h*.2):b;
  var sw=w-2*b,sh=h-2*b,rr=Math.max(.002,Math.min(r,sw/2-.001,sh/2-.001));
  var s=new T.Shape(),x=-sw/2,y=-sh/2;
  s.moveTo(x+rr,y);s.lineTo(x+sw-rr,y);s.quadraticCurveTo(x+sw,y,x+sw,y+rr);
  s.lineTo(x+sw,y+sh-rr);s.quadraticCurveTo(x+sw,y+sh,x+sw-rr,y+sh);
  s.lineTo(x+rr,y+sh);s.quadraticCurveTo(x,y+sh,x,y+sh-rr);
  s.lineTo(x,y+rr);s.quadraticCurveTo(x,y,x+rr,y);
  var dd=Math.max(.002,d-2*b);
  var g=new T.ExtrudeGeometry(s,{depth:dd,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:4});
  g.translate(0,0,-dd/2);g.computeVertexNormals();return g;
}
function rb(w,h,d,r,m,x,y,z,p){return mk(geo('r'+w+'_'+h+'_'+d+'_'+r,function(){return rboxG(w,h,d,r);}),m,x,y,z,p);}
function hitBox(w,h,d,x,y,z,p,ud){var m=mk(geo('hb'+w+'_'+h+'_'+d,function(){return new T.BoxGeometry(w,h,d);}),HIT,x,y,z,p);m.userData=ud||{};return m;}
function clearGroup(g){while(g.children.length)g.remove(g.children[0]);}

/* ---------- canvas textures ---------- */
var TXC={};
function canvasTex(w,h,draw,rep,key){
  if(key&&TXC[key])return TXC[key];
  var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d');draw(g,w,h);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}
  t.userData={canvas:c};if(key)TXC[key]=t;return t;
}
function speck(g,w,h,n,a){for(var i=0;i<n;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+(Math.random()*a)+')';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
var FD='"Fredoka","Trebuchet MS",sans-serif',FB='"Nunito","Segoe UI",sans-serif';
function labelTex(text,o){
  o=o||{};var w=o.w||512,h=o.h||128,key='lab|'+text+'|'+w+'|'+h+'|'+(o.bg||'')+'|'+(o.fg||'')+'|'+(o.size||'')+'|'+(o.sub||'');
  return canvasTex(w,h,function(g){
    if(o.bg){g.fillStyle=o.bg;rr(g,4,4,w-8,h-8,o.r==null?h*.22:o.r);g.fill();}
    if(o.border){g.lineWidth=o.lw||8;g.strokeStyle=o.border;rr(g,6,6,w-12,h-12,o.r==null?h*.2:o.r);g.stroke();}
    g.fillStyle=o.fg||'#3a2317';g.textAlign='center';g.textBaseline='middle';
    var sz=o.size||Math.round(h*.52);g.font='700 '+sz+'px '+FD;
    while(g.measureText(text).width>w*.88&&sz>10){sz-=2;g.font='700 '+sz+'px '+FD;}
    g.fillText(text,w/2,o.sub?h*.42:h*.53);
    if(o.sub){g.font='800 '+Math.round(h*.17)+'px '+FB;g.globalAlpha=.8;g.fillText(o.sub,w/2,h*.77);g.globalAlpha=1;}
  },null,key);
}

/* ---------- blob shadows ---------- */
var blobTex=canvasTex(64,64,function(g){var gr=g.createRadialGradient(32,32,1,32,32,31);gr.addColorStop(0,'rgba(50,25,10,.55)');gr.addColorStop(.6,'rgba(50,25,10,.25)');gr.addColorStop(1,'rgba(50,25,10,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
var blobMat=new T.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false});
function blob(w,d,p,x,y,z){var m=mk(geo('pl1',function(){return new T.PlaneGeometry(1,1);}),blobMat,x||0,(y||0)+.006,z||0,p);m.rotation.x=-Math.PI/2;m.scale.set(w,d,1);m.renderOrder=1;return m;}

/* ---------- particles ---------- */
var fxG=new T.Group();scene.add(fxG);
var puffTex=canvasTex(64,64,function(g){var gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
var starTex=canvasTex(64,64,function(g){g.translate(32,32);g.fillStyle='#fff';g.beginPath();for(var i=0;i<10;i++){var r=i%2?10:30,a=i*Math.PI/5-Math.PI/2;g.lineTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();});
var PUFF=[];
for(var pi=0;pi<120;pi++){var spr=new T.Sprite(new T.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:0}));spr.visible=false;fxG.add(spr);PUFF.push({s:spr,life:0,max:1,vel:V3(0,0,0),s0:.05,s1:.2,a:.5,grav:0});}
var puffI=0;
function puff(pos,o){
  o=o||{};var p=PUFF[puffI];puffI=(puffI+1)%PUFF.length;
  p.s.position.set(pos.x+rnd(-.02,.02),pos.y,pos.z+rnd(-.02,.02));
  p.vel.set(o.vx!=null?o.vx:rnd(-.05,.05),o.up!=null?o.up:rnd(.25,.4),o.vz!=null?o.vz:rnd(-.05,.05));
  p.max=o.life||rnd(.9,1.4);p.life=p.max;p.s0=o.s0||.05;p.s1=o.s1==null?.22:o.s1;p.a=o.a||.6;p.grav=o.grav||0;
  p.s.material.map=o.star?starTex:puffTex;p.s.material.color.setHex(o.color||0xffffff);p.s.material.blending=o.add?T.AdditiveBlending:T.NormalBlending;p.s.visible=true;
}
function updPuffs(dt){
  for(var i=0;i<PUFF.length;i++){var p=PUFF[i];if(p.life<=0)continue;p.life-=dt;if(p.life<=0){p.s.visible=false;continue;}
    var k=1-p.life/p.max;p.vel.y-=p.grav*dt;p.s.position.addScaledVector(p.vel,dt);var sz=lerp(p.s0,p.s1,k);p.s.scale.set(sz,sz,sz);
    p.s.material.opacity=p.a*Math.sin(Math.PI*Math.min(1,k*1.3+.05));}
}
function sparkle(pos,n,col){for(var i=0;i<(n||8);i++)puff(pos,{star:true,color:col||0xffe27a,s0:.09,s1:0,a:1,up:rnd(.6,1.4),vx:rnd(-.6,.6),vz:rnd(-.3,.3),grav:2.2,life:rnd(.5,.8),add:true});}

/* ---------- tweens ---------- */
var TW=[];
function tween(o){o.t=-(o.delay||0);TW.push(o);return o;}
function updTW(dt){for(var i=TW.length-1;i>=0;i--){var w=TW[i];if(w.dead){TW.splice(i,1);continue;}w.t+=dt;if(w.t<0)continue;var k=Math.min(1,w.t/w.dur);w.upd(k,(w.ease||easeIO)(k));if(k>=1){TW.splice(i,1);if(w.done)w.done();}}}
function killTW(obj,tag){for(var i=0;i<TW.length;i++){var w=TW[i];if(w.obj===obj&&(!tag||w.tag===tag))w.dead=true;}}
function fly(obj,to,dur,arc,done){
  killTW(obj,'mv');var fr=obj.position.clone(),tt=to.clone();
  return tween({obj:obj,tag:'mv',dur:dur,ease:easeIO,upd:function(k,e){obj.position.lerpVectors(fr,tt,e);obj.position.y+=Math.sin(k*Math.PI)*arc;var sq=1+Math.sin(k*Math.PI)*.14;obj.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));},done:function(){obj.scale.set(1,1,1);if(done)done();}});
}
function popIn(obj,from){killTW(obj,'sc');var f=from==null?.2:from;obj.scale.setScalar(f);return tween({obj:obj,tag:'sc',dur:.34,ease:easeBack,upd:function(k,e){obj.scale.setScalar(f+(1-f)*e);}});}
function squash(obj){killTW(obj,'sc');return tween({obj:obj,tag:'sc',dur:.32,ease:function(t){return t;},upd:function(k){var s=1+Math.sin(k*Math.PI*2)*.14*(1-k);obj.scale.set(1/s,s,1/s);},done:function(){obj.scale.set(1,1,1);}});}
function wiggle(obj){killTW(obj,'wg');var r0=obj.rotation.z;return tween({obj:obj,tag:'wg',dur:.36,ease:function(t){return t;},upd:function(k){obj.rotation.z=r0+Math.sin(k*Math.PI*4)*.06*(1-k);},done:function(){obj.rotation.z=r0;}});}
