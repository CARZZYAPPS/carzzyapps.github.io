/* ================= 3D battlefield (three.js r128) =================
   The simulation stays in flat field coordinates; this file only draws it. If WebGL or three.js is
   missing the game falls back to the 2D canvas renderer in 03-battle.js. */
var R3=null,r3fail=false,G3={},M3={};
function gB(w,h,d){var k="b"+w+"_"+h+"_"+d;return G3[k]||(G3[k]=new THREE.BoxGeometry(w,h,d));}
function gC(rt,rb,h,s){var k="c"+rt+"_"+rb+"_"+h+"_"+s;return G3[k]||(G3[k]=new THREE.CylinderGeometry(rt,rb,h,s||8));}
function gS(r,half){var k="s"+r+(half?"h":"");return G3[k]||(G3[k]=half?new THREE.SphereGeometry(r,10,6,0,TAU,0,Math.PI/2):new THREE.SphereGeometry(r,10,8));}
function gK(r,h,s){var k="k"+r+"_"+h+"_"+s;return G3[k]||(G3[k]=new THREE.ConeGeometry(r,h,s||7));}
function gD(r){var k="d"+r;return G3[k]||(G3[k]=new THREE.DodecahedronGeometry(r,0));}
function gO(r){var k="o"+r;return G3[k]||(G3[k]=new THREE.OctahedronGeometry(r,0));}
function mt(col,glow,op){var k=col+(glow?"g":"")+(op||"");if(M3[k])return M3[k];var m=glow?new THREE.MeshBasicMaterial({color:col}):new THREE.MeshPhongMaterial({color:col,flatShading:true,shininess:8,specular:0x161616});if(op){m.transparent=true;m.opacity=op;}return(M3[k]=m);}
function mk(p,g,m,x,y,z){var o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);p.add(o);return o;}
function r3Init(){
  if(R3)return true;if(r3fail||!window.THREE)return false;
  try{
    var rd=new THREE.WebGLRenderer({canvas:$("#b3"),antialias:true,powerPreference:"high-performance"});
    var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,10,7000);
    sc.add(new THREE.HemisphereLight(0xffffff,0x2a2466,.62));var dl=new THREE.DirectionalLight(0xfff1d6,.72);dl.position.set(-320,560,280);sc.add(dl);
    R3={rd:rd,sc:sc,cam:cam,root:null,um:[],own:[],ray:new THREE.Raycaster(),pl:new THREE.Plane(new THREE.Vector3(0,1,0),0),v:new THREE.Vector3(),camPos:new THREE.Vector3(),tgt:new THREE.Vector3()};
    rd.domElement.addEventListener("webglcontextlost",function(e){e.preventDefault();r3fail=true;R3=null;if(B){B.r3=false;B.bg=null;$("#b3").style.display="none";}});
  }catch(e){r3fail=true;R3=null;return false;}
  return true;
}
/* ---------- models (built facing +x) ---------- */
function r3Unit(cls,c1,c2){
  var g=new THREE.Group(),b=new THREE.Group(),dk=mt("#1d1a33"),skin=mt("#ffd4a8"),steel=mt("#dfe6f5"),m1=mt(c1),m2=mt(c2),r=CLASSES[cls].r;g.add(b);g.userData.b=b;
  var sh=new THREE.Mesh(G3.shadow||(G3.shadow=new THREE.CircleGeometry(1,14)),M3.shadow||(M3.shadow=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3,depthWrite:false})));sh.rotation.x=-Math.PI/2;sh.position.y=.7;sh.scale.set(r*1.2,r*1.2,1);g.add(sh);
  if(cls==="trooper"){
    mk(b,gB(5,7,7),dk,0,3.5,0);mk(b,gC(5,6,9,8),m1,0,11.5,0);mk(b,gS(3.6),skin,0,18.6,0);mk(b,gS(4.2,true),m2,0,19,0);mk(b,gB(12,1.7,1.7),dk,6.5,12.5,4.6);mk(b,gB(3,5.5,5.5),m2,-4.8,12,0);
  }else if(cls==="ranger"){
    mk(b,gB(4.4,7,6),dk,0,3.5,0);mk(b,gC(4,5,9,8),m1,0,11.5,0);mk(b,gS(3.3),skin,0,18.3,0);mk(b,gK(4.4,7,7),m2,0,21,0);mk(b,gB(19,1.4,1.4),dk,9,13,4.2);mk(b,gB(1.2,10,8),m2,-4.6,10.5,0);
  }else if(cls==="guardian"){
    mk(b,gB(7,8,9),dk,0,4,0);mk(b,gC(6.6,7.8,11,8),m1,0,13.5,0);mk(b,gS(4),skin,0,21.6,0);mk(b,gS(4.7,true),m2,0,22,0);mk(b,gB(2.2,16,15),steel,8.4,10,0);mk(b,gB(.9,7,7),m1,9.7,10.5,0);
  }else if(cls==="raider"){
    mk(b,gB(4.4,6,6),dk,0,3,0);var t=mk(b,gC(3.8,4.8,9,8),m1,1,10.5,0);t.rotation.z=-.28;mk(b,gS(3.3),skin,2.6,16.8,0);mk(b,gB(4,1.6,7.4),m2,2.6,17.6,0);
    var b1=mk(b,gB(11,.9,2.2),steel,7.5,10,5.4);b1.rotation.y=-.3;var b2=mk(b,gB(11,.9,2.2),steel,7.5,10,-5.4);b2.rotation.y=.3;
  }else if(cls==="bombard"){
    mk(b,gB(21,4.4,3.8),dk,0,2.2,7.4);mk(b,gB(21,4.4,3.8),dk,0,2.2,-7.4);mk(b,gB(18,7,13),m1,0,6.5,0);mk(b,gC(5.6,6.2,4.4,8),m2,-1,12,0);
    var br=mk(b,gC(1.9,2.3,18,8),dk,7,15.5,0);br.rotation.z=-Math.PI/2+.42;mk(b,gC(2.8,2.8,3,8),m2,14.2,18.7,0).rotation.z=-Math.PI/2+.42;
  }else if(cls==="medic"){
    var w=mt("#f4f8ff"),gr=mt("#1fc46a");mk(b,gB(4.6,7,6.4),dk,0,3.5,0);mk(b,gC(4.6,5.4,9,8),w,0,11.5,0);mk(b,gS(3.4),skin,0,18.4,0);mk(b,gS(4,true),m1,0,18.8,0);
    mk(b,gB(3.4,6.5,6.5),w,-5,12,0);mk(b,gB(.7,5,1.7),gr,-6.9,12,0);mk(b,gB(.7,1.7,5),gr,-6.9,12,0);
  }else if(cls==="lancer"){
    var bd=mk(b,gS(8),m1,0,8,0);bd.scale.set(1.75,.55,.85);mk(b,gC(6.2,6.2,.7,12),mt("#2fe6ff",true,.75),-1,2.6,0);mk(b,gC(3.4,4.2,7.5,8),m2,-1.5,14.5,0);mk(b,gS(3.2),skin,-1.5,20.2,0);mk(b,gS(3.8,true),m1,-1.5,20.6,0);
    mk(b,gB(27,1.1,1.1),steel,11,11.5,5.6);mk(b,gK(1.6,5,6),steel,25.5,11.5,5.6).rotation.z=-Math.PI/2;mk(b,gB(5,3,9),dk,-10,8.5,0);
  }else{
    mk(b,gB(6.5,13,6.5),dk,0,6.5,6.5);mk(b,gB(6.5,13,6.5),dk,0,6.5,-6.5);mk(b,gB(9,3,8),dk,1.5,1.5,6.5);mk(b,gB(9,3,8),dk,1.5,1.5,-6.5);
    mk(b,gB(16,14,19),m1,0,20.5,0);mk(b,gB(6,7,11),m2,7,22,0);mk(b,gS(2.6),mt("#ffffff",true),10.4,21,0);
    mk(b,gC(2.3,2.3,16,8),dk,6,29.5,10.5).rotation.z=-Math.PI/2;mk(b,gC(2.3,2.3,16,8),dk,6,29.5,-10.5).rotation.z=-Math.PI/2;mk(b,gB(8,6,5),m2,-1,29.5,10.5);mk(b,gB(8,6,5),m2,-1,29.5,-10.5);
  }
  var s=cls==="titan"?r/17:cls==="bombard"?r/11:cls==="lancer"?r/10.5:cls==="guardian"?r/11:r/8.8;b.scale.set(s,s,s);g.userData.s=s;
  return g;
}
function r3Struct(s,c1,c2){
  var g=new THREE.Group(),r=s.r,st=mt("#3b3566"),st2=mt("#544c8a"),m1=mt(c1),m2=mt(c2),i,a;
  if(s.gate){
    mk(g,gB(CELL-6,26,4*CELL-4),mt("#6b4a2a"),0,13,0);for(i=-1;i<=1;i++)mk(g,gB(CELL-4,3,5),mt("#2b2440"),0,8+i*8+5,0).scale.set(1,1,(4*CELL-2)/5);
    mk(g,gB(CELL+4,34,8),st2,0,17,-2*CELL);mk(g,gB(CELL+4,34,8),st2,0,17,2*CELL);mk(g,gB(6,8,10),m1,-CELL/2,24,0);
  }else if(s.hq){
    mk(g,gC(r*1.02,r*1.12,9,8),st,0,4.5,0);mk(g,gC(r*.56,r*.64,30,8),st2,0,23,0);mk(g,gK(r*.66,15,8),m1,0,45,0);
    for(i=0;i<4;i++){a=i/4*TAU+Math.PI/4;mk(g,gC(r*.2,r*.24,22,6),st2,Math.cos(a)*r*.82,19,Math.sin(a)*r*.82);mk(g,gK(r*.27,9,6),m1,Math.cos(a)*r*.82,34,Math.sin(a)*r*.82);}
    mk(g,gC(.8,.8,16,5),mt("#dfe6f5"),0,60,0);mk(g,gB(11,7,.8),m1,5.8,64,0);
    g.userData.core=mk(g,gS(r*.17),mt(c1,true),r*.6*(s.side?-1:1),24,0);
    mk(g,gB(r*.5,12,r*.34),mt("#1d1a33"),r*.6*(s.side?-1:1),9,0);
  }else{
    mk(g,gC(r*.9,r*1.1,12,8),st,0,6,0);
  }
  if(s.tur){var h=new THREE.Group();h.position.y=s.hq?36:15;g.add(h);mk(h,gS(s.hq?r*.2:r*.62),m2,0,0,0);mk(h,gC(1.8,2.2,s.hq?r*.9:r*1.5,8),mt("#1d1a33"),s.hq?r*.5:r*.8,0,0).rotation.z=-Math.PI/2;g.userData.head=h;}
  g.position.set(s.x-L/2,0,s.y-WD/2);return g;
}
function r3Prop(p,type,x,z,sc,rr){
  var g=new THREE.Group(),th=B.th,o;g.position.set(x,hAt(x+L/2,z+WD/2),z);g.scale.set(sc,sc,sc);g.rotation.y=rr()*TAU;p.add(g);
  if(type===0){mk(g,gC(1.6,2,7,6),mt("#5a3d22"),0,3.5,0);mk(g,gK(8,13,7),mt(th.tree),0,12,0);mk(g,gK(6,11,7),mt("#2f9a55"),0,19,0);}
  else if(type===1){mk(g,gC(.9,1.6,20,5),mt("#2a1a1a"),0,10,0);o=mk(g,gC(.6,.9,9,5),mt("#2a1a1a"),3,15,0);o.rotation.z=-.9;mk(g,gD(5),mt("#3d2424"),-4,3,3);mk(g,gD(2.2),mt("#ff7a2a",true),-4,5.4,3);}
  else if(type===2){o=mk(g,gO(6),mt("#d9f4ff",false,.88),0,11,0);o.scale.set(.8,2.1,.8);o=mk(g,gO(4),mt("#aee3ff",false,.88),5,6,2);o.scale.set(.8,1.7,.8);o.rotation.z=-.3;}
  else if(type===3){mk(g,gC(2.6,2.8,15,7),mt("#5f8a3a"),0,7.5,0);mk(g,gS(2.6),mt("#5f8a3a"),0,15,0);o=mk(g,gC(1.5,1.5,6,6),mt("#5f8a3a"),4,9,0);o.rotation.z=-Math.PI/2;mk(g,gC(1.5,1.5,6,6),mt("#5f8a3a"),6.4,12,0);mk(g,gD(4),mt(th.rock),-6,2,4);}
  else{mk(g,gC(2,3,18,6),mt("#3d2d80"),0,9,0);mk(g,gS(3.6),mt("#39e8ff",true),0,19.5,0);mk(g,gC(1.4,2,11,6),mt("#3d2d80"),5,5.5,3);mk(g,gS(2.4),mt("#ff5bab",true),5,12,3);}
}
function r3Build(){
  var T=THREE,th=B.th,rr=rng(B.cfg.sd+11),i,root=new T.Group(),my=myCols(),en=B.cfg.ecol,zm=zoneMax();if(!G3.shadow)G3.shadow=new T.CircleGeometry(1,14);
  if(R3.root){R3.sc.remove(R3.root);R3.own.forEach(function(x){x.dispose();});}
  R3.root=root;R3.own=[];R3.um=[];R3.sc.add(root);
  var bg=new T.Color(th.g2).multiplyScalar(.3);R3.sc.background=bg;R3.sc.fog=new T.Fog(bg.getHex(),1400,4200);
  // ground with real hills
  var gg=new T.PlaneGeometry(L,WD,56,32);gg.rotateX(-Math.PI/2);var pos=gg.attributes.position,col=new Float32Array(pos.count*3),c1=new T.Color(th.g1),c2=new T.Color(th.g2),ca=new T.Color(th.acc),c=new T.Color();
  for(i=0;i<pos.count;i++){var u=pos.getX(i)+L/2,v=pos.getZ(i)+WD/2,h=hAt(u,v);pos.setY(i,h);c.copy(c1).lerp(c2,u/L).multiplyScalar(.8+rr()*.34);if(h>0)c.lerp(ca,Math.min(.5,h/16*.5));if(u<zm)c.lerp(new T.Color(0xffffff),.06);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  gg.setAttribute("color",new T.BufferAttribute(col,3));gg.computeVertexNormals();R3.own.push(gg);
  var gm=new T.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:4,specular:0x080808});R3.own.push(gm);root.add(new T.Mesh(gg,gm));
  var ap=mk(root,G3.apron||(G3.apron=new T.PlaneGeometry(9000,9000)),mt("#"+new T.Color(th.g2).multiplyScalar(.5).getHexString()),0,-1.2,0);ap.rotation.x=-Math.PI/2;
  var skirt=mt("#"+new T.Color(th.g2).multiplyScalar(.36).getHexString());mk(root,gB(L+16,10,8),skirt,0,-4,WD/2+4);mk(root,gB(L+16,10,8),skirt,0,-4,-WD/2-4);mk(root,gB(8,10,WD),skirt,-L/2-4,-4,0);mk(root,gB(8,10,WD),skirt,L/2+4,-4,0);
  var edge=mt(th.acc,true,.55);mk(root,gB(L,1,2),edge,0,.4,WD/2);mk(root,gB(L,1,2),edge,0,.4,-WD/2);mk(root,gB(2,1,WD),edge,L/2,.4,0);mk(root,gB(2,1,WD),edge,-L/2,.4,0);
  // deploy zone
  var zmat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.06,depthWrite:false,depthTest:false});R3.own.push(zmat);var zg=new T.PlaneGeometry(zm,WD);R3.own.push(zg);R3.zone=new T.Mesh(zg,zmat);R3.zone.rotation.x=-Math.PI/2;R3.zone.position.set(-L/2+zm/2,1,0);R3.zone.renderOrder=2;root.add(R3.zone);R3.zone.visible=false;
  for(i=0;i<14;i++)mk(root,gB(2.4,1.2,16),mt("#ffffff",true,.8),-L/2+zm,.9,-WD/2+15+i*30);
  // obstacles
  var stone=mt("#"+new T.Color(th.rock).multiplyScalar(1.15).getHexString()),stone2=mt(th.rock),water=mt(th.sea,false,.86);
  B.obst.forEach(function(o){var cx=o.x+o.w/2-L/2,cz=o.y+o.h/2-WD/2;
    if(o.k==="river"){mk(root,gB(o.w-6,1,o.h+.4),water,cx,.55,cz);mk(root,gB(3.2,2.2,o.h+.4),stone2,cx-o.w/2+1.6,1.1,cz);mk(root,gB(3.2,2.2,o.h+.4),stone2,cx+o.w/2-1.6,1.1,cz);}
    else if(o.k==="wall"){mk(root,gB(o.w-4,24,o.h+.4),stone,cx,12,cz);mk(root,gB(o.w+1,5,9),stone2,cx,26.5,cz-o.h/4);mk(root,gB(o.w+1,5,9),stone2,cx,26.5,cz+o.h/4);}
    else{var n=o.w*o.h>1000?3:2;for(var q=0;q<n;q++){var rk=mk(root,gD(1),q%2?stone2:stone,cx+(rr()-.5)*o.w*.4,0,cz+(rr()-.5)*o.h*.4);var sx=o.w*(.3+rr()*.2),sz=o.h*(.3+rr()*.2),sy=10+rr()*12;rk.scale.set(sx,sy,sz);rk.position.y=sy*.55;rk.rotation.y=rr()*3;}}
  });
  B.bridges.forEach(function(br){var bx=(br.gx+.5)*CELL-L/2,bz=(br.gy+1.5)*CELL-WD/2,wd=mt("#8a6238");mk(root,gB(CELL+14,2.2,3*CELL-8),wd,bx,1.5,bz);mk(root,gB(CELL+14,5,2),mt("#5a3d22"),bx,4,bz-1.5*CELL+5);mk(root,gB(CELL+14,5,2),mt("#5a3d22"),bx,4,bz+1.5*CELL-5);});
  // forests / theme cover, plus scenery outside the field
  var pt=B.cfg.th%5;
  B.cover.forEach(function(z){var r2=rng(z.sd);for(var k=0;k<13;k++){var a=r2()*TAU,d=Math.sqrt(r2())*.9;r3Prop(root,pt,z.x+Math.cos(a)*z.rx*d-L/2,z.y+Math.sin(a)*z.ry*d-WD/2,.75+r2()*.5,r2);}
    var fl=mk(root,G3.shadow||(G3.shadow=new T.CircleGeometry(1,14)),mt("#000000",true,.16),z.x-L/2,.8,z.y-WD/2);fl.rotation.x=-Math.PI/2;fl.scale.set(z.rx,z.ry,1);fl.material.depthWrite=false;});
  for(i=0;i<34;i++){var side=i%4,px=side<2?(rr()-.5)*(L+500):(side===2?-1:1)*(L/2+40+rr()*240),pz=side<2?(side?1:-1)*(WD/2+40+rr()*240):(rr()-.5)*(WD+400);r3Prop(root,pt,px,pz,1+rr()*1.3,rr);}
  for(i=0;i<46;i++){var qx=(rr()-.5)*(L-30),qz=(rr()-.5)*(WD-30),qh=hAt(qx+L/2,qz+WD/2);if(B.grid[cellOf(qx+L/2,qz+WD/2)])continue;if(rr()<.5){var pb=mk(root,gD(1),stone2,qx,qh+1,qz);var ps=1.6+rr()*2.4;pb.scale.set(ps,ps*.6,ps);}else{var tf=mk(root,gK(2.2,5,5),mt("#"+new T.Color(th.g1).multiplyScalar(1.25).getHexString()),qx,qh+2.4,qz);tf.rotation.y=rr()*3;}}
  // relays
  R3.rel=B.relays.map(function(rl){var g=new T.Group();g.position.set(rl.x-L/2,0,rl.y-WD/2);root.add(g);mk(g,gC(5,7,5,8),mt("#3b3566"),0,2.5,0);mk(g,gC(1.6,2.4,30,6),mt("#dfe6f5"),0,20,0);
    var lm=new T.MeshBasicMaterial({color:0xcfd6ea});R3.own.push(lm);mk(g,gS(4.4),lm,0,37,0);var rg=new T.RingGeometry(49,52,40);R3.own.push(rg);var rm=new T.MeshBasicMaterial({color:0xcfd6ea,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide});R3.own.push(rm);var ring=new T.Mesh(rg,rm);ring.rotation.x=-Math.PI/2;ring.position.y=1;g.add(ring);return{lm:lm,rm:rm};});
  B.structs.forEach(function(s){s.m=r3Struct(s,s.side===0?my[0]:en[0],s.side===0?my[1]:en[1]);root.add(s.m);});
  if(B.chest){R3.chest=new T.Group();mk(R3.chest,gB(13,8,9),mt("#c9792a"),0,4,0);mk(R3.chest,gB(13.6,2.4,9.6),mt("#ffcf3a"),0,8.4,0);mk(R3.chest,gB(2.6,4,1),mt("#ffcf3a"),0,5,4.8);R3.chest.position.set(B.chest.x-L/2,3,B.chest.y-WD/2);root.add(R3.chest);}else R3.chest=null;
  // pools
  R3.rings=[];for(i=0;i<22;i++){var rgm=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});R3.own.push(rgm);var rm2=new T.Mesh(G3.ring||(G3.ring=new T.RingGeometry(.86,1,36)),rgm);rm2.rotation.x=-Math.PI/2;rm2.visible=false;root.add(rm2);R3.rings.push(rm2);}
  R3.domes=[];for(i=0;i<5;i++){var dm=new T.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:0,depthWrite:false});R3.own.push(dm);var dome=new T.Mesh(gS(1,true),dm);dome.visible=false;root.add(dome);R3.domes.push(dome);}
  R3.shots=[];for(i=0;i<70;i++){var sm=new T.Mesh(gB(7,1.5,1.5),mt("#ffffff",true));sm.visible=false;root.add(sm);R3.shots.push(sm);}
  R3.shells=[];for(i=0;i<14;i++){var sl=new T.Mesh(gS(2.6),mt("#22232e"));sl.visible=false;root.add(sl);R3.shells.push(sl);}
  R3.miss=[];for(i=0;i<4;i++){var ms=new T.Group();mk(ms,gC(2.4,2.4,22,8),mt("#dfe6f5"),0,11,0);mk(ms,gK(2.4,7,8),mt("#ff5468"),0,-3.5,0).rotation.x=Math.PI;mk(ms,gS(4),mt("#ffb347",true),0,24,0);ms.visible=false;root.add(ms);R3.miss.push(ms);}
  R3.dec=[];for(i=0;i<46;i++){var dc=new T.Mesh(G3.shadow,mt("#0a0814",true,.3));dc.material.depthWrite=false;dc.rotation.x=-Math.PI/2;dc.visible=false;root.add(dc);R3.dec.push(dc);}
  var NP=420,pg=new T.BufferGeometry();pg.setAttribute("position",new T.BufferAttribute(new Float32Array(NP*3),3));pg.setAttribute("color",new T.BufferAttribute(new Float32Array(NP*3),3));R3.own.push(pg);
  var pm=new T.PointsMaterial({size:7,vertexColors:true,transparent:true,opacity:.95,depthWrite:false,sizeAttenuation:true});R3.own.push(pm);R3.pts=new T.Points(pg,pm);R3.pts.frustumCulled=false;root.add(R3.pts);R3.np=NP;
  r3Fit();
}
function r3Fit(){
  if(!R3||!B)return;var cam=R3.cam,w=B.cw,h=B.ch,T=THREE,port=B.port,i,j;R3.rd.setPixelRatio(B.dpr);R3.rd.setSize(w,h,false);cam.aspect=w/h;cam.fov=port?48:38;
  var tgt=R3.tgt.set(port?14:0,0,port?0:6),dir=(port?new T.Vector3(-.5,1,0):new T.Vector3(0,1,.74)).normalize(),top=1-2*(TOPPAD+4)/h,lo=120,hi=5200;
  var pts=[[-L/2,0,-WD/2],[L/2,0,-WD/2],[-L/2,0,WD/2],[L/2,0,WD/2],[L/2-70,70,0],[L/2,30,-WD/2],[L/2,30,WD/2],[-L/2,26,-WD/2],[-L/2,26,WD/2]];
  for(i=0;i<24;i++){var mid=(lo+hi)/2,ok=true;cam.position.copy(tgt).addScaledVector(dir,mid);cam.lookAt(tgt);cam.updateMatrixWorld();cam.updateProjectionMatrix();
    for(j=0;j<pts.length;j++){R3.v.set(pts[j][0],pts[j][1],pts[j][2]).project(cam);if(Math.abs(R3.v.x)>.975||R3.v.y<-.985||R3.v.y>top){ok=false;break;}}
    if(ok)hi=mid;else lo=mid;}
  cam.position.copy(tgt).addScaledVector(dir,hi);cam.lookAt(tgt);cam.updateMatrixWorld();cam.updateProjectionMatrix();R3.camPos.copy(cam.position);
  R3.sc.fog.near=hi*.9;R3.sc.fog.far=hi*3.2;R3.pts.material.size=7;
}
function r3Screen(u,v,h){R3.v.set(u-L/2,h||0,v-WD/2).project(R3.cam);return[(R3.v.x*.5+.5)*B.cw,(-R3.v.y*.5+.5)*B.ch];}
function r3Pick(px,py){R3.v.set(px/B.cw*2-1,-(py/B.ch)*2+1,.5);R3.ray.setFromCamera(R3.v,R3.cam);var p=R3.ray.ray.intersectPlane(R3.pl,new THREE.Vector3());return p?[p.x+L/2,p.z+WD/2]:[-999,-999];}
function r3Frame(){
  var i,u,m,my=myCols(),en=B.cfg.ecol,root=R3.root,t=B.t,k;
  // units
  for(i=0;i<B.units.length;i++){u=B.units[i];if(u.hp<=0)continue;
    if(!u.m){u.m=r3Unit(u.cls,u.side===0?(u.ally?u.acol:my[0]):en[0],u.side===0?(u.ally?"#ffffff":my[1]):en[1]);if(u.boss){u.m.userData.b.scale.multiplyScalar(1.2);}root.add(u.m);R3.um.push(u);}
    m=u.m;var gy=hAt(u.x,u.y),drop=u.born<.28?(1-u.born/.28):0,cl=CLASSES[u.cls],hov=u.cls==="lancer"?2+Math.sin(u.wob*.5)*1.2:0;
    m.position.set(u.x-L/2,gy,u.y-WD/2);m.rotation.y=-u.face;var b=m.userData.b,s=m.userData.s*(u.boss?1.2:1)*(u.flash>0?1.16:1);
    b.position.y=drop*drop*90+hov+(cl.spd>60?0:Math.abs(Math.sin(u.wob))*1.1);b.scale.set(s,s*(1+Math.sin(u.wob*2)*.015),s);
    b.rotation.z=u.t>CLASSES[u.cls].cd*.82?-.16:0;
  }
  if(R3.um.length){var keep=[];for(i=0;i<R3.um.length;i++){u=R3.um[i];if(u.hp>0)keep.push(u);else if(u.gone){root.remove(u.m);u.m=null;}}R3.um=keep;}
  for(i=B.corpses.length-1;i>=0;i--){var co=B.corpses[i];co.t+=.016*B.spd;if(!co.u.m){B.corpses.splice(i,1);continue;}var cb=co.u.m.userData.b;cb.rotation.z=Math.min(1.45,co.t*6);cb.position.y=co.t>.5?-(co.t-.5)*22:0;if(co.t>1.1){root.remove(co.u.m);co.u.m=null;B.corpses.splice(i,1);}}
  // structures
  for(i=0;i<B.structs.length;i++){var s=B.structs[i];if(!s.m)continue;
    if(s.hp<=0){s.m.position.y-=1.6*B.spd;s.m.rotation.z+=.012*B.spd;if(s.m.position.y<-70){root.remove(s.m);s.m=null;}continue;}
    var ps=s.flash>0?1.05:1;s.m.scale.set(ps,ps,ps);if(s.m.userData.head)s.m.userData.head.rotation.y=-s.tur.a;if(s.m.userData.core){var cs=1+Math.sin(t*5)*.22;s.m.userData.core.scale.set(cs,cs,cs);}}
  for(i=0;i<B.relays.length;i++){var rl=B.relays[i],o=R3.rel[i],cc=rl.own===1?my[0]:rl.own===-1?en[0]:"#cfd6ea";o.lm.color.set(cc);o.rm.color.set(rl.p>0?my[0]:rl.p<0?en[0]:"#cfd6ea");o.rm.opacity=.35+Math.abs(rl.p)*.55;}
  if(R3.chest){R3.chest.visible=!B.gotChest;R3.chest.rotation.y=t*1.5;R3.chest.position.y=4+Math.sin(t*4)*2;}
  // zone highlight
  var zon=B.sel&&B.sel!=="strike"&&!B.over;R3.zone.visible=!!zon;if(zon)R3.zone.material.opacity=.13+.06*Math.sin(t*6);
  // shots
  var si=0,sh=0;for(i=0;i<B.shots.length;i++){var q=B.shots[i];
    if(q.d0===undefined){q.d0=Math.max(1,Math.hypot(q.tx-q.x,q.ty-q.y));q.h0=(q.src&&q.src.struct)?(q.src.hq?36:15):11;}
    var fr=1-Math.min(1,Math.hypot(q.tx-q.x,q.ty-q.y)/q.d0);
    if(q.splash){if(sh<R3.shells.length){m=R3.shells[sh++];m.visible=true;m.position.set(q.x-L/2,lerp(q.h0,6,fr)+Math.sin(fr*Math.PI)*Math.min(70,q.d0*.4),q.y-WD/2);}}
    else if(si<R3.shots.length){m=R3.shots[si++];m.visible=true;m.material=mt(q.col,true);m.position.set(q.x-L/2,lerp(q.h0,9,fr)+hAt(q.x,q.y)*(1-fr*.3),q.y-WD/2);m.rotation.y=-Math.atan2(q.dy||0,q.dx||1);}}
  for(;si<R3.shots.length;si++)R3.shots[si].visible=false;for(;sh<R3.shells.length;sh++)R3.shells[sh].visible=false;
  for(i=0;i<R3.miss.length;i++){var ms=R3.miss[i],sk=B.strikes[i];ms.visible=!!sk;if(sk)ms.position.set(sk.x-L/2,sk.t/.55*420,sk.y-WD/2);}
  // rings, domes, particles
  var ri=0,di=0,pi=0,pa=R3.pts.geometry.attributes.position,pc=R3.pts.geometry.attributes.color,col=R3.col||(R3.col=new THREE.Color());
  for(i=0;i<B.fx.length;i++){var f=B.fx[i];k=f.t/f.d;
    if((f.k==="ring"||f.k==="mark")&&ri<R3.rings.length){m=R3.rings[ri++];m.visible=true;var rad=f.k==="mark"?75*(1-k)+8:lerp(f.r0,f.r1,k);m.scale.set(rad,rad,1);m.position.set(f.x-L/2,hAt(f.x,f.y)+1.4,f.y-WD/2);m.material.color.set(f.k==="mark"?"#ff9a3d":f.col);m.material.opacity=f.k==="mark"?.9:(1-k)*.95;
      if(f.k==="ring"&&f.r1>=55&&di<R3.domes.length){var dmn=R3.domes[di++];dmn.visible=true;var dr=lerp(f.r0,f.r1*.8,k);dmn.scale.set(dr,dr*.9,dr);dmn.position.set(f.x-L/2,0,f.y-WD/2);dmn.material.color.set(f.col);dmn.material.opacity=(1-k)*.5;}}
    else if(f.k==="sp"&&pi<R3.np){if(f.up===undefined)f.up=20+Math.random()*60;pa.setXYZ(pi,f.x-L/2,6+f.up*4*k*(1-k)+2,f.y-WD/2);col.set(f.col);var fa=1-k*.6;pc.setXYZ(pi,col.r*fa,col.g*fa,col.b*fa);pi++;}
    else if((f.k==="sl"||f.k==="mz")&&pi<R3.np){pa.setXYZ(pi,f.x-L/2,12,f.y-WD/2);pc.setXYZ(pi,1,.97,.7);pi++;}}
  for(;ri<R3.rings.length;ri++)R3.rings[ri].visible=false;for(;di<R3.domes.length;di++)R3.domes[di].visible=false;
  R3.pts.geometry.setDrawRange(0,pi);pa.needsUpdate=true;pc.needsUpdate=true;
  for(i=0;i<R3.dec.length;i++){var dc=R3.dec[i],dd=B.decals[i];dc.visible=!!dd;if(dd){dc.position.set(dd.x-L/2,hAt(dd.x,dd.y)+.5,dd.y-WD/2);dc.scale.set(dd.r,dd.r*.85,1);}}
  // camera
  R3.cam.position.copy(R3.camPos);if(B.shake>0){R3.cam.position.x+=rnd(-1,1)*B.shake*.9;R3.cam.position.y+=rnd(-1,1)*B.shake*.6;R3.cam.position.z+=rnd(-1,1)*B.shake*.9;}
  R3.rd.render(R3.sc,R3.cam);
  // overlay: health bars and floating numbers
  var c=bx,p;c.setTransform(B.dpr,0,0,B.dpr,0,0);c.clearRect(0,0,B.cw,B.ch);
  for(i=0;i<B.units.length;i++){u=B.units[i];if(u.hp<=0||u.hp>=u.mhp)continue;p=r3Screen(u.x,u.y,hAt(u.x,u.y)+(u.cls==="titan"?46:28));var bw=u.cls==="titan"||u.boss?30:20,fq=u.hp/u.mhp;c.fillStyle="rgba(8,6,30,.75)";c.fillRect(p[0]-bw/2-1,p[1]-1,bw+2,5);c.fillStyle=u.side===0?"#8dff5a":"#ff5468";c.fillRect(p[0]-bw/2,p[1],bw*fq,3);}
  for(i=0;i<B.structs.length;i++){var s2=B.structs[i];if(s2.hp<=0||(s2.hp>=s2.mhp&&!s2.hq))continue;p=r3Screen(s2.x,s2.y,s2.hq?76:s2.gate?42:30);var w2=s2.hq?64:40,f2=clamp(s2.hp/s2.mhp,0,1);c.fillStyle="rgba(8,6,30,.8)";c.fillRect(p[0]-w2/2-2,p[1]-2,w2+4,9);c.fillStyle=f2>.5?"#8dff5a":f2>.25?"#ffcf3a":"#ff5468";c.fillRect(p[0]-w2/2,p[1],w2*f2,5);}
  c.textAlign="center";c.textBaseline="middle";
  for(i=0;i<B.txt.length;i++){var tx=B.txt[i],kk=tx.t/tx.d;p=r3Screen(tx.x,tx.y,26+kk*26);c.globalAlpha=1-kk*kk;c.font="900 "+Math.round(tx.sz*1.15)+"px Nunito,sans-serif";c.lineWidth=3;c.strokeStyle="rgba(0,0,0,.75)";c.strokeText(tx.s,p[0],p[1]);c.fillStyle=tx.col;c.fillText(tx.s,p[0],p[1]);}
  c.globalAlpha=1;
  for(i=0;i<B.relays.length;i++){var r2=B.relays[i];p=r3Screen(r2.x,r2.y,50);c.font="900 11px Nunito,sans-serif";c.lineWidth=3;c.strokeStyle="rgba(0,0,0,.75)";var lb=r2.own===1?"RELAY +30% CMD":r2.own===-1?"ENEMY RELAY":"RELAY";c.strokeText(lb,p[0],p[1]);c.fillStyle=r2.own===1?"#8dff5a":r2.own===-1?"#ff8a98":"#fff";c.fillText(lb,p[0],p[1]);}
  if(B.sel&&B.sel!=="strike"&&B.hintT>0){B.hintT-=.016;p=r3Screen(zoneMax()/2,WD/2,0);c.font="900 15px Nunito,sans-serif";c.fillStyle="#fff";c.strokeStyle="rgba(0,0,0,.7)";c.lineWidth=4;c.strokeText("Deploy inside your zone",p[0],p[1]);c.fillText("Deploy inside your zone",p[0],p[1]);}
}
