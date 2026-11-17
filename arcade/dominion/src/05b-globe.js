/* ================= 3D world map (three.js r128) =================
   The planet is a real globe: the Core sits at the pole, capitals ring it, and each tier steps
   further toward the equator. Drag to spin it. Falls back to the flat map without WebGL. */
var GL=null,glFail=false,GR=100;
var LAT=[-8,14,38,62,90];
function nodeLL(n){var lat=n.rs?-31:LAT[n.ty];return[lat*Math.PI/180,n.a];}
function llPos(lat,lon,r,out){out=out||new THREE.Vector3();var c=Math.cos(lat);return out.set(c*Math.cos(lon)*r,Math.sin(lat)*r,c*Math.sin(lon)*r);}
function gh3(x,y,z,s){var n=Math.sin(x*127.1+y*311.7+z*74.7+s*13.37)*43758.5453;return n-Math.floor(n);}
function gvn(x,y,z,s){var ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
  function L2(a,b,t){return a+(b-a)*t;}
  return L2(L2(L2(gh3(ix,iy,iz,s),gh3(ix+1,iy,iz,s),fx),L2(gh3(ix,iy+1,iz,s),gh3(ix+1,iy+1,iz,s),fx),fy),L2(L2(gh3(ix,iy,iz+1,s),gh3(ix+1,iy,iz+1,s),fx),L2(gh3(ix,iy+1,iz+1,s),gh3(ix+1,iy+1,iz+1,s),fx),fy),fz);}
function gfbm(x,y,z,s){return gvn(x,y,z,s)*.5+gvn(x*2.1,y*2.1,z*2.1,s+7)*.27+gvn(x*4.3,y*4.3,z*4.3,s+19)*.15+gvn(x*8.7,y*8.7,z*8.7,s+31)*.08;}
function glInit(){
  if(GL)return true;if(glFail||!window.THREE)return false;
  try{
    var rd=new THREE.WebGLRenderer({canvas:$("#map3"),antialias:true,powerPreference:"high-performance"}),sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,5,5000);
    sc.background=new THREE.Color(0x090722);
    sc.add(new THREE.HemisphereLight(0xffffff,0x1c1650,.55));var sun=new THREE.DirectionalLight(0xfff4e0,.95);sun.position.set(-260,220,330);sc.add(sun);
    var sp=new Float32Array(1500),sr=rng(77),i;for(i=0;i<500;i++){var a=sr()*TAU,b=Math.acos(sr()*2-1),d=1500+sr()*600;sp[i*3]=Math.sin(b)*Math.cos(a)*d;sp[i*3+1]=Math.cos(b)*d;sp[i*3+2]=Math.sin(b)*Math.sin(a)*d;}
    var sg=new THREE.BufferGeometry();sg.setAttribute("position",new THREE.BufferAttribute(sp,3));sc.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:5,sizeAttenuation:true,transparent:true,opacity:.85})));
    GL={rd:rd,sc:sc,cam:cam,piv:new THREE.Group(),own:[],key:"",sig:"",rot:0,vel:0,tilt:.42,drag:null,spin:true,v:new THREE.Vector3(),n:new THREE.Vector3(),w:0,h:0,scr:[]};sc.add(GL.piv);
    rd.domElement.addEventListener("webglcontextlost",function(e){e.preventDefault();glFail=true;GL=null;$("#map3").style.display="none";});
  }catch(e){glFail=true;GL=null;return false;}
  return true;
}
function glPlanet(wd){
  var T=THREE,th=THEMES[wd.th],sd=hash(wd.nm)%997,i,j,piv=GL.piv;
  GL.own.forEach(function(x){x.dispose();});GL.own=[];while(piv.children.length)piv.remove(piv.children[0]);
  var g=new T.IcosahedronGeometry(GR,20),pos=g.attributes.position,n=pos.count,col=new Float32Array(n*3),base=new Float32Array(n*3),near=new Int16Array(n/3),v=new T.Vector3(),c=new T.Color(),c1=new T.Color(th.g1),c2=new T.Color(th.g2),sea=new T.Color(th.sea),acc=new T.Color(th.acc),ice=new T.Color(0xf2fbff);
  var np=wd.n.map(function(nd){var ll=nodeLL(nd);return llPos(ll[0],ll[1],1);});
  for(i=0;i<n;i++){v.fromBufferAttribute(pos,i).normalize();var h=gfbm(v.x*1.7+3,v.y*1.7+5,v.z*1.7+9,sd),land=h>.47;pos.setXYZ(i,v.x*GR*(land?1+(h-.47)*.16:1),v.y*GR*(land?1+(h-.47)*.16:1),v.z*GR*(land?1+(h-.47)*.16:1));}
  for(i=0;i<n;i+=3){v.set(0,0,0);for(j=0;j<3;j++){v.x+=pos.getX(i+j);v.y+=pos.getY(i+j);v.z+=pos.getZ(i+j);}v.normalize();
    var hh=gfbm(v.x*1.7+3,v.y*1.7+5,v.z*1.7+9,sd),sh=.88+gh3(v.x*40,v.y*40,v.z*40,3)*.22;
    if(hh>.47){c.copy(c2).lerp(c1,clamp((hh-.47)*6,0,1));if(hh>.62)c.lerp(acc,clamp((hh-.62)*5,0,.7));}else{c.copy(sea).multiplyScalar(.55+hh*.9);}
    if((wd.th===0||wd.th===2)&&Math.abs(v.y)>.9-gh3(v.x*9,v.y*9,v.z*9,5)*.06)c.lerp(ice,.85);
    c.multiplyScalar(sh);for(j=0;j<3;j++){base[(i+j)*3]=c.r;base[(i+j)*3+1]=c.g;base[(i+j)*3+2]=c.b;}
    var best=-1,bd=.955;for(j=0;j<np.length;j++){var d=v.dot(np[j]);if(d>bd){bd=d;best=j;}}near[i/3]=best;}
  g.setAttribute("color",new T.BufferAttribute(col,3));g.computeVertexNormals();GL.own.push(g);
  var pm=new T.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:10,specular:0x222233});GL.own.push(pm);piv.add(new T.Mesh(g,pm));
  GL.geo=g;GL.base=base;GL.near=near;
  var ag=new T.SphereGeometry(GR*1.075,40,28),am=new T.MeshBasicMaterial({color:th.acc,transparent:true,opacity:.16,side:T.BackSide,depthWrite:false});GL.own.push(ag,am);GL.sc.remove(GL.atm);GL.atm=new T.Mesh(ag,am);GL.sc.add(GL.atm);
  if(GL.moon)GL.sc.remove(GL.moon);var mg=new T.IcosahedronGeometry(9+wd.w%3*3,1),mm=new T.MeshPhongMaterial({color:wd.th%2?0xd9c7a8:0xb9bfd6,flatShading:true});GL.own.push(mg,mm);GL.moon=new T.Mesh(mg,mm);GL.sc.add(GL.moon);
  if(GL.ring){GL.sc.remove(GL.ring);GL.ring=null;}
  if(wd.th>=3){var rg=new T.RingGeometry(GR*1.35,GR*1.75,64),rm=new T.MeshBasicMaterial({color:th.acc,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false});GL.own.push(rg,rm);GL.ring=new T.Mesh(rg,rm);GL.ring.rotation.x=Math.PI/2-.28;GL.sc.add(GL.ring);}
  GL.mk=new T.Group();piv.add(GL.mk);GL.key=wd.w+":"+wd.nm;GL.sig="";
  // face the first target
  var tg=wd.n.filter(function(x){return attackable(wd,x);})[0];if(tg){GL.rot=Math.PI/2+tg.a;}
}
function glMark(p,g,m,x,y,z){var o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);p.add(o);return o;}
function glMarkers(wd){
  var T=THREE,mk=GL.mk,my=myCols(),ec=enemyCols(),i,up=new T.Vector3(0,1,0);
  while(mk.children.length)mk.remove(mk.children[0]);GL.pulse=[];GL.npos=[];
  // territory paint
  var col=GL.geo.attributes.color,base=GL.base,near=GL.near,mc=new T.Color(my[0]);
  for(i=0;i<near.length;i++){var o=near[i]>=0&&wd.n[near[i]].o===1,k=i*9;for(var j=0;j<9;j+=3){var r=base[k+j],g2=base[k+j+1],b=base[k+j+2];if(o){r=r*.5+mc.r*.5;g2=g2*.5+mc.g*.5;b=b*.5+mc.b*.5;}col.array[k+j]=r;col.array[k+j+1]=g2;col.array[k+j+2]=b;}}
  col.needsUpdate=true;
  var lp=[],lo=[],a=new T.Vector3(),b2=new T.Vector3(),q=new T.Vector3();
  wd.n.forEach(function(n){
    var ll=nodeLL(n),p=llPos(ll[0],ll[1],GR*1.012),can=attackable(wd,n),own=n.o===1,c1=own?my[0]:can?ec[0]:"#9a8aa8",c2=own?my[1]:can?ec[1]:"#55486a",g=new T.Group(),m1=mt(c1),m2=mt(c2),dk=mt("#1d1a33");
    g.position.copy(p);g.quaternion.setFromUnitVectors(up,p.clone().normalize());mk.add(g);GL.npos[n.i]=p.clone();
    if(n.rs==="mine"){glMark(g,gK(3.2,4.4,4),m1,0,2.2,0);glMark(g,gO(1.7),mt("#2fe6ff",true),0,5.8,0);}
    else if(n.rs==="farm"){glMark(g,gS(2.8,true),mt(own?"#8dff5a":can?"#b7c78a":"#6a6a5a"),0,0,0);glMark(g,gB(1.6,2.6,1.6),m1,2.8,1.3,.6);}
    else if(n.ty===0){glMark(g,gB(3.4,2,3.4),m1,0,1,0);glMark(g,gB(1.6,1.4,1.6),m2,0,2.7,0);glMark(g,gC(.2,.2,3,5),dk,.9,4.2,.9);}
    else if(n.ty===1){glMark(g,gB(2.2,5.2,2.2),m1,-1.6,2.6,-.8);glMark(g,gB(2.2,7.4,2.2),m2,1.1,3.7,.2);glMark(g,gB(2,3.6,2),m1,-.4,1.8,2);glMark(g,gC(3.9,3.9,.6,10),dk,0,.3,0);}
    else if(n.ty===2){glMark(g,gC(3.8,4.4,3,8),dk,0,1.5,0);glMark(g,gC(2.4,2.8,6.4,8),m1,0,5,0);glMark(g,gK(3,3.4,8),m2,0,9.8,0);for(var t=0;t<3;t++){var an=t/3*TAU;glMark(g,gC(.9,1,4.6,6),m2,Math.cos(an)*3.4,2.3,Math.sin(an)*3.4);}}
    else if(n.ty===3){glMark(g,gC(5.2,6,2.6,10),dk,0,1.3,0);glMark(g,gC(3,3.6,9,8),m1,0,6.6,0);glMark(g,gK(3.8,5,8),m2,0,13.4,0);for(var t2=0;t2<4;t2++){var an2=t2/4*TAU;glMark(g,gC(1.1,1.3,6.4,6),m1,Math.cos(an2)*4.4,3.2,Math.sin(an2)*4.4);glMark(g,gK(1.5,2.4,6),m2,Math.cos(an2)*4.4,7.6,Math.sin(an2)*4.4);}glMark(g,gC(.2,.2,6,5),mt("#dfe6f5"),0,18,0);glMark(g,gB(3,2,.3),m1,1.6,20,0);}
    else{glMark(g,gC(6.5,7.5,3,10),dk,0,1.5,0);glMark(g,gK(4.4,17,8),m1,0,11.5,0);glMark(g,gS(2.6),mt(own?my[0]:"#ffcf3a",true),0,21.5,0);glMark(g,gC(.7,.7,60,6),mt(own?my[0]:"#ffcf3a",true,.4),0,51,0);}
    if(can){var rg=new T.Mesh(G3.gring||(G3.gring=new T.RingGeometry(.8,1,28)),mt("#ffcf3a",true,.95));rg.rotation.x=-Math.PI/2;rg.position.y=.5;rg.material.side=T.DoubleSide;g.add(rg);var ar=glMark(g,gK(1.7,3.6,6),mt("#ffcf3a",true),0,0,0);ar.rotation.x=Math.PI;GL.pulse.push({r:rg,a:ar,s:[5.5,7,8.5,10.5,13][n.ty],h:[7,12,15,24,30][n.ty]});}
    if(n.p>=0){var pn=wd.n[n.p],pl=nodeLL(pn),both=own&&pn.o===1,arr=both?lo:lp;llPos(ll[0],ll[1],1,a);llPos(pl[0],pl[1],1,b2);for(var s=0;s<8;s++){q.copy(a).lerp(b2,s/8).normalize().multiplyScalar(GR*1.03);arr.push(q.x,q.y,q.z);q.copy(a).lerp(b2,(s+1)/8).normalize().multiplyScalar(GR*1.03);arr.push(q.x,q.y,q.z);}}
  });
  [[lp,0xffffff,.28],[lo,new T.Color(my[0]).getHex(),.95]].forEach(function(L3){if(!L3[0].length)return;var lg=new T.BufferGeometry();lg.setAttribute("position",new T.BufferAttribute(new Float32Array(L3[0]),3));var lm=new T.LineBasicMaterial({color:L3[1],transparent:true,opacity:L3[2]});mk.add(new T.LineSegments(lg,lm));GL.tmp=(GL.tmp||[]);GL.tmp.push(lg,lm);});
  GL.sel=new T.Mesh(G3.gring,mt("#ffffff",true,.9));GL.sel.material.side=T.DoubleSide;GL.sel.visible=false;mk.add(GL.sel);
  GL.thr=new T.Mesh(gS(1),mt("#ff3c5a",true,.45));GL.thr.visible=false;mk.add(GL.thr);
  GL.chest=new T.Group();glMark(GL.chest,gB(4.4,2.8,3),mt("#c9792a"),0,1.4,0);glMark(GL.chest,gB(4.7,.9,3.3),mt("#ffcf3a"),0,3,0);GL.chest.visible=false;mk.add(GL.chest);
}
function glSig(wd){var s=S.skin+S.faction+":";for(var i=0;i<wd.n.length;i++)s+=wd.n[i].o;return s;}
function glFrame(ts,w,h,dpr){
  var wd=W(),t=ts/1000,cam=GL.cam,i,up=GL.n;
  if(GL.key!==wd.w+":"+wd.nm)glPlanet(wd);
  var sig=glSig(wd);if(sig!==GL.sig){if(GL.tmp){GL.tmp.forEach(function(x){x.dispose();});GL.tmp=[];}glMarkers(wd);GL.sig=sig;}
  if(GL.w!==w||GL.h!==h){GL.w=w;GL.h=h;GL.rd.setPixelRatio(dpr);GL.rd.setSize(w,h,false);}
  var top=w<640?150:62,bot=mapSel>=0?170:70,ah=Math.max(120,h-top-bot),asp=w/h;cam.aspect=asp;
  var half=Math.tan(20*Math.PI/180),fit=Math.min(asp,ah/h),d=GR*1.2/(half*fit);
  cam.position.set(0,Math.sin(GL.tilt)*d,Math.cos(GL.tilt)*d);cam.lookAt(0,0,0);cam.updateProjectionMatrix();
  cam.setViewOffset(w,h,0,-(top-bot)/2,w,h);cam.updateMatrixWorld();
  if(!GL.drag){if(GL.focus!==undefined){var df=((GL.focus-GL.rot+Math.PI*3)%TAU)-Math.PI;GL.rot+=df*.12;if(Math.abs(df)<.01)GL.focus=undefined;}else{GL.rot+=GL.vel;GL.vel*=.93;if(GL.spin&&mapSel<0)GL.rot+=.0009;}}
  GL.piv.rotation.y=GL.rot;GL.piv.updateMatrixWorld();
  GL.moon.position.set(Math.cos(t*.12)*GR*2.3,GR*.5,Math.sin(t*.12)*GR*2.3);GL.moon.rotation.y=t*.2;
  for(i=0;i<GL.pulse.length;i++){var p=GL.pulse[i],ps=p.s*(1+.18*Math.sin(t*4+i));p.r.scale.set(ps,ps,1);p.a.position.y=p.h+2+Math.sin(t*5+i)*1.4;}
  if(mapSel>=0&&GL.npos[mapSel]){var sn=wd.n[mapSel];GL.sel.visible=true;GL.sel.position.copy(GL.npos[mapSel]).multiplyScalar(1.006);GL.sel.quaternion.setFromUnitVectors(up.set(0,0,1),GL.v.copy(GL.npos[mapSel]).normalize());var ss=[7,9,11,13.5,17][sn.ty]*(1+.06*Math.sin(t*6));GL.sel.scale.set(ss,ss,1);}else GL.sel.visible=false;
  var th=S.threat&&S.threat.w===wd.w?GL.npos[S.threat.n]:null;GL.thr.visible=!!th;if(th){GL.thr.position.copy(th);var tsz=9+Math.sin(t*9)*3;GL.thr.scale.set(tsz,tsz,tsz);}
  var ch=S.chest&&S.chest.w===wd.w?GL.npos[S.chest.n]:null;GL.chest.visible=!!ch;if(ch){GL.chest.position.copy(ch).multiplyScalar(1.13+.012*Math.sin(t*4));GL.chest.quaternion.setFromUnitVectors(up.set(0,1,0),GL.v.copy(ch).normalize());GL.chest.rotateY(t*1.6);}
  GL.rd.render(GL.sc,cam);
  // labels + hit targets on the 2D overlay
  var cv=$("#map"),c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.textAlign="center";c.textBaseline="top";
  var cd=GL.v.copy(cam.position).normalize();GL.scr=[];M.sc=1;
  for(i=0;i<wd.n.length;i++){var n=wd.n[i],wp=up.copy(GL.npos[i]).applyMatrix4(GL.piv.matrixWorld),facing=up.clone().normalize().dot(cd);
    wp.project(cam);var x=(wp.x*.5+.5)*w,y=(-wp.y*.5+.5)*h;GL.scr[i]=facing>.12?[x,y]:null;
    if(facing<.2)continue;
    if(n.ty>=2||mapSel===i||(n.ty===1&&facing>.55)||n.rs){var al=clamp((facing-.2)*3,0,1);c.globalAlpha=al;c.font="800 "+(n.ty>=3?12.5:11)+"px Nunito,sans-serif";c.lineWidth=3.5;c.strokeStyle="rgba(8,6,30,.85)";var ly=y+(n.ty>=3?12:8);c.strokeText(n.nm,x,ly);c.fillStyle=n.o?myCols()[0]:"#fff";c.fillText(n.nm,x,ly);}
  }
  c.globalAlpha=1;
}
function glDown(e){if(!GL)return;GL.drag={x:e.clientX,y:e.clientY,r:GL.rot,t:GL.tilt,m:0,lx:e.clientX};GL.vel=0;GL.focus=undefined;}
function glMove(e){if(!GL||!GL.drag)return;var d=GL.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;d.m=Math.max(d.m,Math.abs(dx)+Math.abs(dy));if(d.m<7)return;GL.spin=false;GL.rot=d.r-dx*.0075;GL.tilt=clamp(d.t+dy*.004,.12,.95);GL.vel=-(e.clientX-d.lx)*.0075;d.lx=e.clientX;}
function glUp(){if(!GL||!GL.drag)return false;var tap=GL.drag.m<7;GL.drag=null;return tap;}
function glFocus(n){if(GL)GL.focus=Math.PI/2+n.a;}
