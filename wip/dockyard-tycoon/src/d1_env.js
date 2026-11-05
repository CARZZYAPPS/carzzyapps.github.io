
/* ================= PORT ENVIRONMENT ================= */
var envG=new T.Group(),stG=new T.Group(),trayG=new T.Group(),itemG=new T.Group(),custG=new T.Group();
scene.add(envG,stG,trayG,itemG,custG);

/* painted backdrops (also used as port pictures in menus) */
function sky(g,w,h,a,b){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,w,h);}
function disc(g,x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
function cloud(g,x,y,s){g.fillStyle='rgba(255,255,255,.9)';[[0,0,22],[24,-8,26],[50,0,20],[26,6,22]].forEach(function(c){disc(g,x+c[0]*s,y+c[1]*s,c[2]*s,'rgba(255,255,255,.9)');});}
function skyline(g,w,base,col,minH,maxH,seed,lit){var r=mulberry(seed),x=-10;while(x<w){var bw=30+r()*50,bh=minH+r()*(maxH-minH);g.fillStyle=col;g.fillRect(x,base-bh,bw,bh);
  if(lit){g.fillStyle='rgba(255,220,140,.75)';for(var yy=base-bh+6;yy<base-6;yy+=10)for(var xx=x+5;xx<x+bw-5;xx+=9)if(r()<.45)g.fillRect(xx,yy,4,5);}x+=bw+2+r()*8;}}
function seaBand(g,w,y,h,a,b){var gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,y,w,h);g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=2;
  for(var i=0;i<26;i++){var x=Math.random()*w,yy=y+6+Math.random()*(h-8);g.beginPath();g.moveTo(x,yy);g.lineTo(x+14+Math.random()*20,yy);g.stroke();}}
function gantry(g,x,base,s,col){g.fillStyle=col;g.fillRect(x,base-60*s,6*s,60*s);g.fillRect(x+30*s,base-60*s,6*s,60*s);g.fillRect(x-30*s,base-66*s,100*s,7*s);g.fillRect(x+10*s,base-74*s,12*s,10*s);}
function shipSil(g,x,base,s,hull,stack){g.fillStyle=hull;g.beginPath();g.moveTo(x,base);g.lineTo(x+120*s,base);g.lineTo(x+132*s,base-16*s);g.lineTo(x-8*s,base-16*s);g.closePath();g.fill();
  var cs=['#d23a2a','#2f7fd0','#2da35d','#ffc63d','#f2f4f6'];for(var i=0;i<7;i++)for(var j=0;j<2;j++){g.fillStyle=cs[(i*3+j)%5];g.fillRect(x+10*s+i*14*s,base-28*s-j*11*s,13*s,10*s);}g.fillStyle=stack||'#f2f4f6';g.fillRect(x+108*s,base-44*s,14*s,28*s);}
function palm(g,x,y,s){g.strokeStyle='#7a4a2a';g.lineWidth=5*s;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+10*s,y-30*s,x+4*s,y-60*s);g.stroke();g.fillStyle='#2f9a4a';for(var i=0;i<6;i++){var a=i/6*Math.PI*2;g.beginPath();g.ellipse(x+4*s+Math.cos(a)*16*s,y-60*s+Math.sin(a)*6*s,18*s,5*s,a,0,Math.PI*2);g.fill();}}
var PAINT={
  harbor:function(g,w,h){sky(g,w,h,'#7cc8f0','#d6f0ff');disc(g,420,60,26,'#fff3c0');cloud(g,60,50,.9);cloud(g,300,36,.7);skyline(g,w,150,'#9fb6c8',30,80,3);gantry(g,80,160,1,'#ffb000');gantry(g,330,160,.8,'#ffb000');shipSil(g,160,170,1,'#d23a2a');seaBand(g,w,160,96,'#3a9fd4','#1f6fa8');},
  river:function(g,w,h){sky(g,w,h,'#9fdcf0','#eaf8ff');cloud(g,90,40,.8);g.fillStyle='#5aa864';g.beginPath();g.moveTo(0,150);g.quadraticCurveTo(130,110,260,140);g.quadraticCurveTo(390,170,512,130);g.lineTo(512,170);g.lineTo(0,170);g.fill();
    g.fillStyle='#8a6a4a';for(var i=0;i<4;i++)g.fillRect(40+i*120,160,90,10);seaBand(g,w,168,88,'#4a9a9a','#2a6a7a');g.fillStyle='#6a4a2a';g.fillRect(150,176,140,14);g.fillStyle='#f2a33a';g.fillRect(160,168,120,10);},
  industry:function(g,w,h){sky(g,w,h,'#c9b9a8','#efe3d2');skyline(g,w,160,'#7a7068',40,110,9);for(var i=0;i<4;i++){g.fillStyle='#5a5048';g.fillRect(60+i*110,40,14,120);g.fillStyle='rgba(200,190,180,.7)';disc(g,67+i*110,32,16,'rgba(220,212,200,.75)');disc(g,80+i*110,18,20,'rgba(220,212,200,.6)');}
    gantry(g,380,170,.9,'#ff7a1a');seaBand(g,w,166,90,'#5a8aa0','#38667a');},
  tropic:function(g,w,h){sky(g,w,h,'#3fd0e8','#c9f6ff');disc(g,90,60,30,'#fff6b0');cloud(g,300,50,.8);g.fillStyle='#f2e0a8';g.fillRect(0,150,w,16);palm(g,40,155,1);palm(g,470,158,1.1);palm(g,420,156,.8);shipSil(g,170,166,.8,'#2a6a8a');seaBand(g,w,164,92,'#2fc9d9','#1a8fb0');},
  old:function(g,w,h){sky(g,w,h,'#f6c49a','#ffe9d0');disc(g,400,80,34,'#fff0c8');g.fillStyle='#a8705a';g.beginPath();g.moveTo(0,160);g.lineTo(120,120);g.lineTo(220,160);g.fill();
    g.fillStyle='#f2f4f6';g.fillRect(84,60,26,90);g.fillStyle='#d23a2a';for(var i=0;i<3;i++)g.fillRect(84,70+i*26,26,10);g.fillStyle='#2a3a4a';g.fillRect(80,50,34,12);disc(g,97,46,7,'#ffd23f');skyline(g,w,165,'#c48a6a',20,50,4);seaBand(g,w,164,92,'#5a9ac0','#2f6a90');},
  ftz:function(g,w,h){sky(g,w,h,'#9ad0ff','#e6f4ff');skyline(g,w,150,'#6a88aa',60,130,21);gantry(g,40,165,1.1,'#2f7fd0');gantry(g,200,165,1.1,'#2f7fd0');gantry(g,360,165,1.1,'#2f7fd0');shipSil(g,250,172,1.1,'#2a3a4a');seaBand(g,w,166,90,'#3a8fc4','#1f5f90');},
  arctic:function(g,w,h){sky(g,w,h,'#b9d9f0','#f2f8ff');g.fillStyle='#ffffff';g.beginPath();g.moveTo(0,150);g.lineTo(80,80);g.lineTo(160,150);g.lineTo(240,70);g.lineTo(340,150);g.lineTo(420,90);g.lineTo(512,150);g.fill();
    g.fillStyle='#dfefff';for(var i=0;i<8;i++){g.beginPath();g.ellipse(30+i*64,180,26,8,0,0,Math.PI*2);g.fill();}seaBand(g,w,166,90,'#5a8ab0','#2f5a80');g.fillStyle='rgba(255,255,255,.85)';for(i=0;i<60;i++)g.fillRect(Math.random()*w,Math.random()*h,2,2);},
  canal:function(g,w,h){sky(g,w,h,'#8fd0ff','#e8f6ff');cloud(g,200,40,.8);g.fillStyle='#7a6a58';g.fillRect(0,140,140,40);g.fillRect(372,140,140,40);g.fillStyle='#4a3a2a';g.fillRect(140,120,16,60);g.fillRect(356,120,16,60);g.fillStyle='#5a4a3a';g.fillRect(156,124,200,12);
    shipSil(g,190,168,.9,'#2a6a8a');seaBand(g,w,166,90,'#3a8aa8','#1f6080');},
  night:function(g,w,h){sky(g,w,h,'#0b1430','#2a2a5a');for(var i=0;i<80;i++){g.fillStyle='rgba(255,255,255,'+Math.random()+')';g.fillRect(Math.random()*w,Math.random()*120,1.5,1.5);}disc(g,420,50,20,'#f4f0d0');skyline(g,w,160,'#1a2040',50,110,7,true);
    gantry(g,90,168,1,'#ffb000');seaBand(g,w,166,90,'#1a2a50','#0a1430');g.fillStyle='rgba(255,210,120,.5)';for(i=0;i<20;i++)g.fillRect(Math.random()*w,170+Math.random()*80,14,2);},
  mega:function(g,w,h){sky(g,w,h,'#b8c8d6','#e8eef2');for(var i=0;i<6;i++)gantry(g,20+i*85,170,1.2,'#ff7a1a');shipSil(g,120,176,1.3,'#2a3a4a');g.fillStyle='rgba(235,240,245,.55)';g.fillRect(0,100,w,90);seaBand(g,w,170,86,'#4a7a9a','#2a5070');}
};
function winTex(kind){return canvasTex(512,256,function(g,w,h){(PAINT[kind]||PAINT.harbor)(g,w,h);},null,'win|'+kind);}
var PICS={};
function distPic(kind){if(PICS[kind])return PICS[kind];var c=winTex(kind).userData.canvas;try{PICS[kind]=c.toDataURL('image/jpeg',.8);}catch(e){PICS[kind]='';}return PICS[kind];}
var SKYC={harbor:0x9fd6f4,river:0xb9e6f4,industry:0xd9cbb9,tropic:0x8fe4f2,old:0xf8d2b0,ftz:0xb5dcff,arctic:0xd6e8f6,canal:0xaedcff,night:0x141c3a,mega:0xc9d4de};

var WATER=null,GULLS=[];
function corrTex(c){return canvasTex(256,128,function(g){g.fillStyle=hexCss(c);g.fillRect(0,0,256,128);for(var x=0;x<256;x+=10){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,0,4,128);}g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,0,256,10);},[2,1],'corr|'+c);}
function warehouse(x,z,w,col,label,night){
  var g=new T.Group();g.position.set(x,0,z);envG.add(g);
  bx(w,1.5,1.6,toon(0xffffff,{map:corrTex(col)}),0,.75,0,g);var rf=bx(w+.1,.12,1.7,toon(shade(col,.7)),0,1.56,0,g);
  for(var i=0;i<Math.floor(w/1.3);i++){var dx=-w/2+.75+i*1.3;bx(.9,.95,.03,toon(0xc9d0d6),dx,.48,.81,g);for(var j=0;j<6;j++)bx(.9,.012,.035,toon(0x9aa3ab),dx,.12+j*.15,.82,g);bx(.95,.06,.06,toon(0xffc63d),dx,.98,.82,g);
    if(night){var lm=sp(.05,flat(0xfff3b0),dx,1.1,.85,g,8);}}
  if(label){var sg=plane(Math.min(w*.6,3),.36,toon(0xffffff,{map:labelTex(label,{w:512,h:96,bg:'#ffffff',fg:'#2a3a4a',r:12})}),0,1.3,.82,g);}
  return g;
}
function contStack(x,z,nx,nz,ny,rot,seed){var r=mulberry(seed),cs=[0xd23a2a,0x2f7fd0,0x2da35d,0xffc63d,0x8a5a44,0xf2f4f6,0xff7a1a,0x7a5ad8];
  var g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot||0;envG.add(g);
  for(var i=0;i<nx;i++)for(var k=0;k<nz;k++){var hgt=1+Math.floor(r()*ny);for(var j=0;j<hgt;j++){var c=cs[Math.floor(r()*cs.length)];rb(.62,.3,.3*2.05,.012,toon(0xffffff,{map:ribTex(c)}),i*.66,.15+j*.31,k*.66,g).rotation.y=Math.PI/2;}}
  return g;}
function lightPole(x,z,night){var g=new T.Group();g.position.set(x,0,z);envG.add(g);cy(.05,.07,3.2,toon(0x9aa3ab),0,1.6,0,g,8);bx(.6,.08,.18,toon(0x5a6b7a),0,3.2,0,g);
  [-.18,.06].forEach(function(dx){var l=bx(.16,.04,.12,night?flat(0xfff3c0):toon(0xf2f4f6),dx+.06,3.15,.02,g);});return g;}
function palm3(x,z,s){var g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s||1);envG.add(g);var tr=cy(.07,.1,1.8,toon(0x9a6a3a),0,.9,0,g,8);tr.rotation.z=.08;
  for(var i=0;i<7;i++){var lf=bx(.9,.03,.22,toon(0x2f9a4a),0,0,0,g);lf.position.set(Math.cos(i/7*Math.PI*2)*.35+.07,1.78,Math.sin(i/7*Math.PI*2)*.35);lf.rotation.y=-i/7*Math.PI*2;lf.rotation.z=-.45;}return g;}

function buildShop(loc,L){
  clearGroup(envG);GULLS=[];var D=distOf(loc),th=IND[loc.ind].theme,win=D.win||'harbor',night=win==='night',rx=L.rx,dec=loc.decor;
  scene.background=new T.Color(SKYC[win]||0x9fd6f4);
  hemi.intensity=night?.36:.5;keyL.intensity=night?.4:.62;hemi.color.setHex(night?0xb9c4ff:0xfff6ea);
  var qz=L.qEdge,W2=rx+14;
  // yard asphalt
  var yard=plane(W2*2,qz+7,toon(0xffffff,{map:asphaltTex()}),0,0,(qz-7)/2,envG);yard.rotation.x=-Math.PI/2;yard.material=toon(night?0x7a8088:0xffffff,{map:asphaltTex()});
  // quay apron
  var ap=plane(W2*2,.85,toon(0xffffff,{map:concreteTex(th.quay)}),0,.004,qz-.42,envG);ap.rotation.x=-Math.PI/2;
  var sl=plane(W2*2,.05,flat(th.line),0,.008,qz-.78,envG);sl.rotation.x=-Math.PI/2;
  bx(W2*2,.42,.25,toon(shade(th.quay,.75)),0,-.21,qz+.12,envG);bx(W2*2,.05,.27,toon(th.quay2),0,.0,qz+.12,envG);
  for(var x=-rx-1;x<=rx+1;x+=1.25){cy(.05,.07,.14,toon(0x2a3a4a),x,.07,qz-.08,envG,10);sp(.07,toon(0x2a3a4a),x,.15,qz-.08,envG,10).scale.y=.5;var t=tor(.09,.04,toon(0x1e2328),x+.62,-.16,qz+.26,envG,null,12);}
  // extra pier rows (portrait / big terminals)
  for(var ri=1;ri<L.rows;ri++){var rz=L.rowZ[ri],pw=L.rowW[ri]+.8;var pr=plane(pw,1.05,toon(0xffffff,{map:concreteTex(th.quay)}),L.rowX[ri],.004,rz-.1,envG);pr.rotation.x=-Math.PI/2;bx(pw,.42,1.05,toon(shade(th.quay,.75)),L.rowX[ri],-.21,rz-.1,envG);
    for(var p=-pw/2+.3;p<pw/2;p+=.9)cy(.06,.06,.6,toon(0x5a4a3a),L.rowX[ri]+p,-.3,rz+.38,envG,8);}
  // water
  WATER=toon(0xffffff,{map:waterTex(th.sea)});var wt=plane(W2*2+10,30,WATER,0,-.26,qz+15,envG);wt.rotation.x=-Math.PI/2;
  // truck bays + road + gate
  L.spots.forEach(function(s){[-1,1].forEach(function(q){var ln=plane(.04,1.2,flat(0xf2f4f6),s.x+q*L.bayW/2,.01,s.z-.15,envG);ln.rotation.x=-Math.PI/2;});var stp=bx(.5,.06,.06,toon(0xffc63d),s.x,.03,s.z+.62,envG);});
  var road=plane(W2*2,1.1,toon(0x5d6368),0,.006,L.roadZ,envG);road.rotation.x=-Math.PI/2;
  for(x=-W2;x<W2;x+=.9){var dl=plane(.45,.05,flat(0xf2f4f6),x,.011,L.roadZ,envG);dl.rotation.x=-Math.PI/2;}
  var gx=rx-.6,gate=new T.Group();gate.position.set(gx,0,L.roadZ-.85);envG.add(gate);rb(.5,.6,.5,.05,toon(0xf2f4f6),0,.3,0,gate);bx(.52,.06,.52,toon(th.accent),0,.62,0,gate);bx(.36,.2,.01,glass(0x2a3a4a,.6),0,.38,.255,gate);
  var bar=bx(1.2,.05,.05,toon(0xea4b3c),-.65,.5,.35,gate);
  // rail siding
  if(L.dspots.length){var rz2=L.railZ;[-.14,.14].forEach(function(o){bx(W2*2,.03,.03,toon(0x8a939b),0,.03,rz2+o,envG);});for(x=-W2;x<W2;x+=.32)bx(.08,.02,.42,toon(0x6a4a2a),x,.01,rz2,envG);}
  // back: warehouses, stacks, poles, distant cranes and backdrop
  var bz=L.backZ;
  warehouse(-rx*.45,bz-.9,Math.max(4,rx*.8),night?0x3a4a6a:th.stn,'HARBOR RUSH',night);warehouse(rx*.55,bz-.9,Math.max(3.4,rx*.7),night?0x4a3a5a:0xd9d2c3,D.name.toUpperCase(),night);
  contStack(-L.hw-2.1,-2.3,2,3,3,0,7);contStack(L.hw+.8,-2.3,2,3,3,0,11);contStack(-rx-3.2,qz-1.6,3,2,2,0,13);contStack(rx+1.4,qz-1.6,3,2,2,0,17);
  lightPole(-rx+.2,L.roadZ-.7,night);lightPole(rx-.2,L.roadZ-.7,night);lightPole(-rx-1,qz-.5,night);lightPole(rx+1,qz-.5,night);
  for(var i=0;i<3;i++){var cg=new T.Group();cg.position.set(-rx-4+i*(rx+4),0,bz-4.5);envG.add(cg);var cc=toon(th.crane);[-1,1].forEach(function(s){bx(.12,3.4,.12,cc,s*.8,1.7,0,cg);});bx(2.2,.18,.2,cc,0,3.4,0,cg);var bm=bx(.18,.14,4,cc,0,3.45,.8,cg);}
  var bd=plane(80,30,toon(0xffffff,{map:winTex(win)}),0,10,bz-14,envG);bd.material=flat(0xffffff,{map:winTex(win)});
  // port flavor
  if(win==='tropic'){palm3(-rx-1.6,.2,.9);palm3(rx+1.7,.1,1);palm3(-rx-2.2,-2.6,1.1);}
  if(win==='arctic'){for(i=0;i<8;i++){var sn=sp(.4,toon(0xffffff),(i%2?1:-1)*(rx+.5+Math.random()*2),0,-3+i*.6,envG,10);sn.scale.y=.35;}for(i=0;i<5;i++){var ice=bx(.6+Math.random(),.08,.4+Math.random()*.5,toon(0xeaf6ff),(Math.random()-.5)*rx*2,-.24,qz+3+Math.random()*5,envG);}}
  if(win==='old'){var lh=new T.Group();lh.position.set(rx+1.8,0,qz-.6);envG.add(lh);cy(.28,.36,2.4,toon(0xf2f4f6),0,1.2,0,lh,16);for(i=0;i<3;i++)cy(.31-i*.02,.33-i*.02,.25,toon(0xd23a2a),0,.4+i*.7,0,lh,16);cy(.24,.24,.3,glass(0xfff3b0,.6),0,2.55,0,lh,16);cone(.3,.3,toon(0x2a3a4a),0,2.85,0,lh,16);sp(.12,flat(0xfff3b0),0,2.55,0,lh,10);}
  if(night){for(i=0;i<14;i++){var bl=sp(.05,flat(pick([0xfff3b0,0xffb84a,0x8fd3ff])),-rx+i*rx/7,1.5+Math.sin(i)*.1,L.roadZ-1.2,envG,6);}}
  // decor upgrades
  if(dec>=1){for(i=0;i<4;i++){var fp=new T.Group();fp.position.set(-rx+.4+i*(rx*2-.8)/3,0,qz-.3);envG.add(fp);cy(.02,.02,1.4,toon(0xc9d0d6),0,.7,0,fp,6);var fl=plane(.36,.22,toon(pick([th.accent,0x2f7fd0,0xffc63d,0xd23a2a]),{ds:1}),.19,1.28,0,fp);}}
  if(dec>=2){for(i=0;i<16;i++){sp(.04,flat(pick([0xffd23f,0xff7a1a,0x8fd3ff,0xff79b4])),-rx+i*(rx*2)/15,1.9+Math.sin(i*.8)*.08,L.roadZ+.6,envG,6);}}
  if(dec>=3){var lg=plane(2.2,1.1,toon(0xffffff,{map:labelTex('HARBOR RUSH',{w:512,h:256,fg:'rgba(255,255,255,.55)',size:84})}),0,.012,(L.tray[0].z+L.spots[0].z)/2+.1,envG);lg.rotation.x=-Math.PI/2;}
  if(dec>=4){var ns=plane(2.4,.5,flat(0xffffff,{map:labelTex('HARBOR RUSH',{w:512,h:110,bg:'#13283d',fg:'#ffd23f',r:24})}),-rx*.45,1.85,bz-.08,envG);}
  if(dec>=5){var bc=sp(.18,flat(0xfff3b0),gx,1.3,L.roadZ-.85,envG,10);bx(.54,.04,.54,toon(0xffd04a),gx,.66,L.roadZ-.85,envG);}
  // ambient gulls
  for(i=0;i<2;i++){var gm=makeGull();gm.g.scale.setScalar(.55);envG.add(gm.g);GULLS.push({m:gm,r:1.6+i*1.2,h:4.6+i*.6,sp:.22+i*.08,ph:i*2,cx:(i?1:-1)*rx*.55,cz:L.backZ+1});}
}
function updEnv(dt,time){
  if(WATER&&WATER.map){WATER.map.offset.x=(time*.012)%1;WATER.map.offset.y=(Math.sin(time*.3)*.02);}
  GULLS.forEach(function(gl){var a=time*gl.sp+gl.ph;gl.m.g.position.set(gl.cx+Math.cos(a)*gl.r,gl.h+Math.sin(time*1.3+gl.ph)*.15,gl.cz+Math.sin(a)*gl.r*.5);gl.m.g.rotation.y=-a-Math.PI/2;
    gl.m.wings.forEach(function(w,i){w.rotation.x=(i?1:-1)*Math.sin(time*7+gl.ph)*.5;});});
}
