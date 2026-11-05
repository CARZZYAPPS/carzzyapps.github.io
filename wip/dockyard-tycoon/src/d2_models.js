
/* ================= SYMBOLS + TEXTURES ================= */
var SYM={
  check:function(g){g.lineWidth=9;g.beginPath();g.moveTo(16,34);g.lineTo(28,46);g.lineTo(49,20);g.stroke();},
  snow:function(g){g.lineWidth=6;for(var i=0;i<3;i++){var a=i*Math.PI/3;g.beginPath();g.moveTo(32+Math.cos(a)*19,32+Math.sin(a)*19);g.lineTo(32-Math.cos(a)*19,32-Math.sin(a)*19);g.stroke();}},
  flower:function(g){for(var i=0;i<5;i++){var a=i*Math.PI*2/5;disc(g,32+Math.cos(a)*11,32+Math.sin(a)*11,9,'#fff');}disc(g,32,32,7,'#ffd23f');},
  glass:function(g){g.lineWidth=6;g.beginPath();g.moveTo(20,14);g.lineTo(44,14);g.quadraticCurveTo(44,34,32,36);g.quadraticCurveTo(20,34,20,14);g.stroke();g.beginPath();g.moveTo(32,36);g.lineTo(32,50);g.moveTo(22,51);g.lineTo(42,51);g.stroke();},
  bolt:function(g){g.beginPath();g.moveTo(36,8);g.lineTo(16,36);g.lineTo(30,36);g.lineTo(26,56);g.lineTo(48,26);g.lineTo(34,26);g.closePath();g.fill();},
  diamond:function(g){g.lineWidth=6;g.beginPath();g.moveTo(32,8);g.lineTo(56,32);g.lineTo(32,56);g.lineTo(8,32);g.closePath();g.stroke();g.fillRect(29,20,6,16);g.fillRect(29,40,6,6);},
  lock:function(g){g.lineWidth=6;g.beginPath();g.arc(32,26,10,Math.PI,0);g.stroke();g.fillRect(17,28,30,22);},
  leaf:function(g){g.beginPath();g.moveTo(14,50);g.quadraticCurveTo(12,14,50,12);g.quadraticCurveTo(50,48,14,50);g.fill();},
  globe:function(g){g.lineWidth=5;g.beginPath();g.arc(32,32,19,0,Math.PI*2);g.stroke();g.beginPath();g.ellipse(32,32,8,19,0,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(13,32);g.lineTo(51,32);g.stroke();},
  star:function(g){g.beginPath();for(var i=0;i<10;i++){var r=i%2?9:21,a=i*Math.PI/5-Math.PI/2;g.lineTo(32+Math.cos(a)*r,33+Math.sin(a)*r);}g.closePath();g.fill();},
  up:function(g){g.beginPath();g.moveTo(32,10);g.lineTo(52,32);g.lineTo(40,32);g.lineTo(40,54);g.lineTo(24,54);g.lineTo(24,32);g.lineTo(12,32);g.closePath();g.fill();},
  scale:function(g){g.lineWidth=5;g.beginPath();g.moveTo(32,12);g.lineTo(32,50);g.moveTo(14,22);g.lineTo(50,22);g.moveTo(20,50);g.lineTo(44,50);g.stroke();g.beginPath();g.arc(17,34,8,0,Math.PI);g.fill();g.beginPath();g.arc(47,34,8,0,Math.PI);g.fill();},
  ribbon:function(g){disc(g,32,26,14,'#fff');g.beginPath();g.moveTo(22,36);g.lineTo(16,56);g.lineTo(26,50);g.lineTo(32,40);g.lineTo(38,50);g.lineTo(48,56);g.lineTo(42,36);g.fill();},
  crown:function(g){g.beginPath();g.moveTo(12,46);g.lineTo(12,20);g.lineTo(22,32);g.lineTo(32,14);g.lineTo(42,32);g.lineTo(52,20);g.lineTo(52,46);g.closePath();g.fill();},
  map:function(g){g.beginPath();g.moveTo(10,18);g.lineTo(24,12);g.lineTo(40,18);g.lineTo(54,12);g.lineTo(54,46);g.lineTo(40,52);g.lineTo(24,46);g.lineTo(10,52);g.closePath();g.fill();},
  sun:function(g){disc(g,32,32,11,'#fff');g.lineWidth=5;for(var i=0;i<8;i++){var a=i*Math.PI/4;g.beginPath();g.moveTo(32+Math.cos(a)*16,32+Math.sin(a)*16);g.lineTo(32+Math.cos(a)*23,32+Math.sin(a)*23);g.stroke();}},
  box:function(g){g.fillRect(16,24,32,26);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(16,24,32,6);},
  fruit:function(g){disc(g,32,36,16,'#fff');g.fillRect(31,12,4,10);g.beginPath();g.ellipse(41,17,8,4,-.5,0,Math.PI*2);g.fill();},
  drop:function(g){g.beginPath();g.moveTo(32,10);g.quadraticCurveTo(50,34,44,44);g.arc(32,40,13,0,Math.PI);g.quadraticCurveTo(14,34,32,10);g.fill();},
  fish:function(g){g.beginPath();g.ellipse(28,32,17,10,0,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(42,32);g.lineTo(56,20);g.lineTo(56,44);g.closePath();g.fill();},
  grain:function(g){for(var i=0;i<5;i++){g.beginPath();g.ellipse(32+(i%2?7:-7),16+i*8,5,8,(i%2?.5:-.5),0,Math.PI*2);g.fill();}},
  x:function(g){g.lineWidth=10;g.beginPath();g.moveTo(16,16);g.lineTo(48,48);g.moveTo(48,16);g.lineTo(16,48);g.stroke();}
};
function symTex(sym,bg){return canvasTex(64,64,function(g){g.fillStyle=hexCss(bg);rr(g,2,2,60,60,12);g.fill();g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=3;rr(g,4,4,56,56,10);g.stroke();
  g.fillStyle='#fff';g.strokeStyle='#fff';g.lineCap='round';g.lineJoin='round';(SYM[sym]||SYM.box)(g);},null,'sym|'+sym+'|'+bg);}
function shade(c,k){var r=(c>>16)&255,g=(c>>8)&255,b=c&255;return (Math.round(r*k)<<16)|(Math.round(g*k)<<8)|Math.round(b*k);}
function mix(a,b,t){var r=((a>>16)&255)*(1-t)+((b>>16)&255)*t,g=((a>>8)&255)*(1-t)+((b>>8)&255)*t,bl=(a&255)*(1-t)+(b&255)*t;return (Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(bl);}
function ribTex(c){return canvasTex(128,64,function(g){g.fillStyle=hexCss(c);g.fillRect(0,0,128,64);for(var x=4;x<128;x+=8){g.fillStyle='rgba(0,0,0,.13)';g.fillRect(x,4,3,56);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+3,4,1,56);}
  g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,0,128,4);g.fillRect(0,60,128,4);g.fillRect(0,0,4,64);g.fillRect(124,0,4,64);},null,'rib|'+c);}
function waterTex(c){return canvasTex(256,256,function(g){g.fillStyle=hexCss(c);g.fillRect(0,0,256,256);
  for(var i=0;i<70;i++){var x=Math.random()*256,y=Math.random()*256,w=10+Math.random()*30;g.strokeStyle='rgba(255,255,255,'+(.12+Math.random()*.22)+')';g.lineWidth=2+Math.random()*2;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+w/2,y-4,x+w,y);g.stroke();}
  for(i=0;i<40;i++){g.fillStyle='rgba(0,30,60,.08)';g.beginPath();g.ellipse(Math.random()*256,Math.random()*256,20+Math.random()*30,6,0,0,Math.PI*2);g.fill();}},[6,6],'water|'+c);}
function asphaltTex(){return canvasTex(256,256,function(g){g.fillStyle='#8f969c';g.fillRect(0,0,256,256);speck(g,256,256,1600,.13);for(var i=0;i<6;i++){g.strokeStyle='rgba(40,40,40,.18)';g.lineWidth=2;g.beginPath();var x=Math.random()*256;g.moveTo(x,0);g.lineTo(x+Math.random()*40-20,256);g.stroke();}},[5,4],'asphalt');}
function concreteTex(c){return canvasTex(256,128,function(g){g.fillStyle=hexCss(c);g.fillRect(0,0,256,128);speck(g,256,128,900,.12);g.fillStyle='rgba(0,0,0,.12)';for(var x=0;x<256;x+=64)g.fillRect(x,0,2,128);g.fillRect(0,0,256,2);},[4,1],'conc|'+c);}

/* ================= CONTAINERS ================= */
var CL=.6,CW=.3,CH=.28;
var DMG=0x6b4a33;
function makeBox(t,o){
  o=o||{};var C=CT[t],g=new T.Group(),inner=new T.Group();g.add(inner);
  var box={t:t,g:g,inner:inner,hold:!!o.hold,cleared:false,spoil:0,spoiled:false,res:false};
  if(C.tank){
    var fr=toon(0x2a3a4a);[-1,1].forEach(function(s){bx(CW,.03,.03,fr,0,.015,s*(CL/2-.015),inner);bx(CW,.03,.03,fr,0,CH-.015,s*(CL/2-.015),inner);[-1,1].forEach(function(q){bx(.03,CH,.03,fr,q*(CW/2-.015),CH/2,s*(CL/2-.015),inner);});});
    var tk=cy(.125,.125,CL-.1,toon(C.col),0,CH/2,0,inner,20);tk.rotation.x=Math.PI/2;[-1,1].forEach(function(s){var e=sp(.125,toon(C.col),0,CH/2,s*(CL/2-.05),inner,16);e.scale.z=.3;});
  }else{
    rb(CW,CH,CL,.012,toon(0xffffff,{map:ribTex(C.col)}),0,CH/2,0,inner);
    [-1,1].forEach(function(s){bx(CW+.01,CH+.01,.02,toon(shade(C.col,.72)),0,CH/2,s*(CL/2-.004),inner);});
    if(C.reefer){bx(CW+.006,.04,CL+.006,toon(C.band),0,CH*.78,0,inner);bx(CW*.8,CH*.6,.04,toon(0x3a3f44),0,CH/2,CL/2+.02,inner);}
  }
  var st=plane(.17,.17,toon(0xffffff,{map:symTex(C.sym,C.band||(C.col===0xf4f6f8?0x2f7fd0:shade(C.col,.7)))}),0,CH+.006,.1,inner);st.rotation.x=-Math.PI/2;
  var tag=null;
  box.setHold=function(){if(tag){inner.remove(tag);tag=null;}if(!box.hold)return;tag=plane(.17,.17,toon(0xffffff,{map:symTex(box.cleared?'check':'lock',box.cleared?0x1f9d55:0xe5484d)}),0,CH+.008,-.14,inner);tag.rotation.x=-Math.PI/2;};
  box.setHold();
  box.setSpoiled=function(){if(box.spoiled)return;box.spoiled=true;inner.traverse(function(m){if(m.isMesh&&m.material&&m.material.isMeshToonMaterial&&!m.material.map)m.material=toon(mix(m.material.color.getHex(),DMG,.7));});
    var x=plane(.18,.18,toon(0xffffff,{map:symTex('x',0xe5484d)}),0,CH+.012,-.14,inner);x.rotation.x=-Math.PI/2;};
  return box;
}

/* ================= GANTRY CRANE ================= */
function lampM(){return new T.MeshToonMaterial({color:0x333333,gradientMap:grad,emissive:new T.Color(0x34d27e),emissiveIntensity:.8});}
function makeCrane(th,zBack,zFront,top){
  var g=new T.Group(),cm=toon(th.crane,{op:.72}),dk=toon(shade(th.crane,.62),{op:.72});cm.depthWrite=false;dk.depthWrite=false;
  var zLeg=.7,span=zFront-zBack;
  [-1,1].forEach(function(s){[zBack,zLeg].forEach(function(z){bx(.06,top,.06,cm,s*.33,top/2,z,g);cy(.05,.05,.05,toon(0x2a2f34),s*.33,.05,z,g,10).rotation.z=Math.PI/2;});
    bx(.07,.06,zLeg-zBack,cm,s*.33,.1,(zBack+zLeg)/2,g);bx(.06,.08,span,cm,s*.3,top+.05,(zBack+zFront)/2,g);});
  bx(.72,.08,.09,cm,0,top,zBack,g);bx(.72,.08,.09,cm,0,top,zLeg,g);bx(.66,.06,.06,cm,0,top+.05,zFront,g);
  rb(.2,.15,.18,.03,toon(0xffffff),.27,top-.13,zLeg-.12,g);bx(.16,.07,.01,glass(0x2a3a4a,.7),.27,top-.11,zLeg-.025,g);
  var lamp=sp(.04,lampM(),-.3,top+.13,zBack,g,10);
  var trolley=new T.Group();trolley.position.set(0,top+.02,0);g.add(trolley);bx(.5,.08,.24,dk,0,0,0,trolley);
  var cables=[-.1,.1].map(function(dx){return cy(.006,.006,1,toon(0x2a2f34),dx,0,0,trolley,6);});
  var spreader=new T.Group();trolley.add(spreader);bx(CW+.08,.035,CL+.06,toon(0xffb000),0,0,0,spreader);
  [-1,1].forEach(function(s){[-1,1].forEach(function(q){bx(.035,.05,.035,dk,s*(CW/2+.02),-.03,q*CL/2,spreader);});});
  var c={g:g,trolley:trolley,spreader:spreader,lamp:lamp.material,top:top,x:0,z:0,y:top-.45,carry:null,job:null};
  c.set=function(x,z,y){c.x=x;c.z=z;c.y=y;g.position.x=x;trolley.position.z=z;var drop=Math.max(.06,(top+.02)-y);spreader.position.y=-drop;cables.forEach(function(cb){cb.scale.y=drop;cb.position.y=-drop/2;});};
  c.set(0,0,top-.45);
  return c;
}

/* ================= SHIPS (stacked bays) ================= */
var SHIPC={container:{hull:0xd23a2a,deck:0x2a3a4a},fish:{hull:0x2f9fd0,deck:0xf2f4f6},bulk:{hull:0x3a3f48,deck:0xd23a2a},cruise:{hull:0xffffff,deck:0x2a6a8a}};
function makeShipG(ind,bays,mega){
  var C=SHIPC[ind]||SHIPC.container,g=new T.Group(),L=bays*.38+.95,B=.92,hullM=toon(C.hull);
  rb(L,.34,B,.09,hullM,0,-.07,0,g);bx(L*1.002,.06,B*1.01,toon(0x7a1f1a),0,-.22,0,g);
  var bow=cy(B/2,B/2,.34,hullM,L/2,-.07,0,g,22);bow.scale.set(.9,1,1);
  bx(L*.97,.02,B*.9,toon(C.deck),0,.105,0,g);
  if(ind==='cruise'){for(var d=0;d<2;d++)rb(.5,.13,B*.8,.03,toon(0xffffff),-L/2+.3,.2+d*.13,0,g);cy(.05,.07,.16,toon(0xd23a2a),-L/2+.3,.5,0,g,12);}
  else{rb(.26,.42,B*.82,.04,toon(0xf2f4f6),-L/2+.2,.32,0,g);bx(.27,.07,B*.7,glass(0x2a3a4a,.7),-L/2+.2,.45,0,g);cy(.04,.05,.2,toon(0x2a2f34),-L/2+.14,.62,0,g,10);}
  if(mega)plane(.7,.18,toon(0xffffff,{map:labelTex('MEGA SHIP',{w:320,h:80,bg:'#ffb020',fg:'#13283d',r:14})}),.1,.02,B/2+.006,g);
  return {g:g,L:L,bayX:function(b){return -L/2+.6+b*.38;},deckY:.115};
}

/* ================= YARD ================= */
function stWidth(){return 1;}
function colPadTex(kind,label){return canvasTex(64,128,function(g){g.clearRect(0,0,64,128);var c=kind==='power'?'#5ee39a':kind==='hazmat'?'#ff7a1a':kind==='customs'?'#4fb3ff':'#ffd23f';
  if(kind==='hazmat'){g.fillStyle='rgba(255,122,26,.25)';g.fillRect(5,5,54,118);g.strokeStyle='rgba(255,122,26,.7)';g.lineWidth=5;for(var y=-60;y<128;y+=20){g.beginPath();g.moveTo(5,y);g.lineTo(59,y+54);g.stroke();}}
  if(kind==='power'){g.fillStyle='rgba(94,227,154,.2)';g.fillRect(5,5,54,118);}
  if(kind==='customs'){g.fillStyle='rgba(79,179,255,.25)';g.fillRect(5,5,54,118);}
  g.strokeStyle=c;g.lineWidth=6;g.setLineDash(kind==='std'?[12,8]:[]);g.strokeRect(5,5,54,118);
  g.fillStyle=c;g.font='800 26px '+FB;g.textAlign='center';g.fillText(label,32,114);},null,'colpad|'+kind+'|'+label);}
function buildYard(L,th){
  clearGroup(trayG);var cols=[];
  L.cols.forEach(function(c,i){
    var pad=plane(.44,.8,toon(0xffffff,{map:colPadTex(c.kind,c.kind==='std'?String(i+1):c.kind==='power'?'P':c.kind==='hazmat'?'!':'C'),op:.95}),c.x,.008,c.z,trayG);pad.rotation.x=-Math.PI/2;
    if(c.kind==='power'){var pl=bx(.08,.12,.06,toon(0x2a3a4a),c.x,.06,c.z-.44,trayG);sp(.025,flat(0x5ee39a),c.x,.13,c.z-.44,trayG,8);}
    if(c.kind==='hazmat'){[-1,1].forEach(function(s){bx(.02,.32,.8,toon(0xff7a1a),c.x+s*.24,.16,c.z,trayG);});}
    if(c.kind==='customs'){var bth=new T.Group();bth.position.set(c.x,0,c.z-.62);trayG.add(bth);rb(.36,.36,.26,.03,toon(0xf2f4f6),0,.18,0,bth);bx(.38,.05,.28,toon(0x2f8fd0),0,.38,0,bth);bx(.26,.12,.01,glass(0x9fd7ff,.6),0,.22,.131,bth);}
    var ring=tor(.3,.022,flat(0xffd23f),c.x,.02,c.z,trayG,null,28);ring.rotation.x=-Math.PI/2;ring.scale.set(1,1.55,1);ring.visible=false;
    var hit=hitBox(.48,c.max*CH+.3,.95,c.x,(c.max*CH+.3)/2,c.z,trayG,{col:i});
    cols.push({x:c.x,z:c.z,kind:c.kind,max:c.max,stack:[],inc:0,hit:hit,ring:ring,insp:0});
  });
  var tb=new T.Group();tb.position.set(L.trash.x,0,L.trash.z);trayG.add(tb);blob(.6,.8,tb);
  rb(.42,.24,.66,.04,toon(0x5a6b7a),0,.14,0,tb);bx(.44,.04,.68,toon(0xffc63d),0,.27,0,tb);
  plane(.36,.12,toon(0xffffff,{map:labelTex('SCRAP',{w:256,h:90,bg:'#ffc63d',fg:'#2a3a4a'})}),0,.16,.335,tb);
  var bh=hitBox(.6,.7,.9,L.trash.x,.3,L.trash.z,trayG,{trash:1});
  return {cols:cols,bin:tb,binHit:bh};
}

/* ================= DRIVERS, TRUCKS, TRAINS, PASSENGERS ================= */
var SKIN=[0xffdcc0,0xf3c098,0xdca06f,0xb7794c,0x8c5836,0x63402a];
var HAIRC=[0x2b1a12,0x4a2b1a,0x7a4a26,0xc98a3a,0xf2d07a,0xd65a32,0xa8a8b4,0x3a3a58,0xff8fc4,0x4bb3a3];
var SHIRTC=[0xff6b5b,0x4fb3e8,0x6cc76a,0xffc63d,0x9a7ae0,0xff8fc4,0x2f4a6a,0xf2f2f2,0xff9b3d,0x3fbfb0,0xe2553f,0x7fcdf7];
var PANTC=[0x2f3a56,0x4a3a2e,0x3d4a3a,0x5a5a6a,0x6a4a8a];
var CABC=[0xe2553f,0x2f7fd0,0xffc63d,0x2da35d,0xf2f4f6,0xff7a1a,0x7a5ad8,0x2a3a4a,0x21a98d];
function capG(){return geo('hcap',function(){return new T.SphereGeometry(.348,20,10,0,Math.PI*2,0,Math.PI*.52);});}
function face(head,s){
  var dark=toon(0x231510),eyeM=toon(0x1e1410),whi=flat(0xffffff);
  var eyes=[-1,1].map(function(q){var e=new T.Group();e.position.set(q*.115*s,.02*s,.285*s);head.add(e);var b=sp(.05*s,eyeM,0,0,0,e,10);b.scale.set(.9,1.2,.6);sp(.017*s,whi,.016*s,.026*s,.03*s,e,6);return e;});
  var brows=[-1,1].map(function(q){return bx(.11*s,.026*s,.02*s,dark,q*.12*s,.145*s,.3*s,head);});
  var mouths={smile:tor(.065*s,.016*s,dark,0,-.1*s,.3*s,head,Math.PI,12),frown:tor(.06*s,.016*s,dark,0,-.16*s,.3*s,head,Math.PI,12),flat:bx(.09*s,.022*s,.02*s,dark,0,-.11*s,.31*s,head),open:sp(.045*s,toon(0x8a2a2a),0,-.11*s,.29*s,head,10)};
  mouths.smile.rotation.z=Math.PI;mouths.open.scale.set(1,.8,.5);
  var blush=[-1,1].map(function(q){var b=sp(.045*s,flat(0xff9a9a,{op:.55}),q*.2*s,-.05*s,.27*s,head,8);b.scale.set(1,.6,.3);return b;});
  return {eyes:eyes,brows:brows,mouths:mouths,blush:blush};
}
function moodApi(me){
  me.setMood=function(m){if(me.mood===m)return;me.mood=m;var f=me.f;
    f.mouths.smile.visible=m==='happy'||m==='ok';f.mouths.flat.visible=m==='meh';f.mouths.frown.visible=m==='angry';f.mouths.open.visible=m==='wow';
    f.mouths.smile.scale.set(m==='happy'?1.15:.8,m==='happy'?1.15:.8,1);f.blush.forEach(function(b){b.visible=m==='happy'||m==='wow';});
    f.brows.forEach(function(b,i){var s=i?1:-1;b.rotation.z=m==='angry'?s*-.45:m==='meh'?s*.12:0;});};
  me.setMood('ok');me.hop=function(){me.hopT=.5;};me.shake=function(){me.shakeT=.6;};return me;
}
/* trucks face +z (toward the yard and camera), cargo rides on the flatbed behind the cab */
function makeTruck(D,opt){
  opt=opt||{};var root=new T.Group(),body=new T.Group();root.add(body);blob(.8,1.5,root,0,0,-.1);
  var cc=opt.vip?0x18181c:opt.insp?0xf2f4f6:opt.van?0xf2f4f6:pick(CABC),cab=toon(cc),dk=toon(0x2a2f34);
  var wheels=[];[[.5,.12],[-.28,.12],[-.62,.12]].forEach(function(w){[-1,1].forEach(function(s){var wh=cy(.12,.12,.08,dk,s*.29,w[1],w[0],body,14);wh.rotation.z=Math.PI/2;cy(.05,.05,.085,toon(0xc9d0d6),s*.29,w[1],w[0],body,10).rotation.z=Math.PI/2;wheels.push(wh);});});
  bx(.5,.06,1.6,dk,0,.2,-.12,body);
  var cabG=new T.Group();cabG.position.set(0,.22,.5);body.add(cabG);
  rb(.6,.5,.42,.07,cab,0,.3,0,cabG);bx(.5,.24,.02,glass(0x2a3a4a,.55),0,.4,.21,cabG);rb(.62,.08,.44,.03,toon(shade(cc,.75)),0,.04,0,cabG);
  bx(.5,.06,.04,toon(0xc9d0d6),0,.08,.225,cabG);[-1,1].forEach(function(s){sp(.04,flat(0xfff3b0),s*.22,.12,.215,cabG,8).scale.z=.4;bx(.03,.1,.03,dk,s*.33,.4,.1,cabG);});
  if(opt.vip){bx(.62,.03,.44,toon(0xffd04a),0,.54,0,cabG);}
  if(opt.insp){bx(.61,.07,.43,toon(0x2f6fd6),0,.2,0,cabG);var lb=bx(.22,.06,.1,toon(0xff3b2f,{e:0xff3b2f,ei:.6}),0,.58,.05,cabG);}
  var head=new T.Group();head.position.set(.12,.44,.12);head.scale.setScalar(.36);cabG.add(head);
  var skin=toon(pick(SKIN));var hd=sp(.33,skin,0,0,0,head,18);hd.scale.set(1,.94,.96);var f=face(head,1);
  var hair=mk(capG(),opt.insp?toon(0x1d3a5a):toon(pick(HAIRC)),0,.04,-.015,head);hair.rotation.x=-.28;if(!opt.insp&&Math.random()<.5){var cap=mk(capG(),toon(pick(SHIRTC)),0,.06,0,head);cap.scale.set(1.04,.75,1.04);bx(.3,.02,.2,cap.material,0,.17,.26,head);}
  var bed=new T.Group();bed.position.set(0,.3,-.25);body.add(bed);
  if(opt.van){bx(.62,.04,.8,toon(0xf2f4f6),0,.02,-.02,bed);[-1,1].forEach(function(s){bx(.03,.14,.8,toon(0x21a98d),s*.305,.09,-.02,bed);});bx(.62,.14,.03,toon(0x21a98d),0,.09,-.41,bed);
    var sm=plane(.26,.26,toon(0xffffff,{map:symTex('fish',0x21a98d)}),.322,.12,.12,bed);sm.rotation.y=Math.PI/2;}
  else bx(.62,.04,.95,toon(0x3a4048),0,.02,-.05,bed);
  var loads=[];
  var me={root:root,body:body,head:head,f:f,wheels:wheels,bed:bed,loads:loads,ph:Math.random()*6,blinkT:rnd(1,4),blink:0,mood:'',hopT:0,shakeT:0,kind:'truck',
    loadPos:function(j,n){return V3(n>1?(j%2?.155:-.155):0,.04+Math.floor(j/2)*(opt.van?.19:CH),opt.van?-.02:-.08);}};
  return moodApi(me);
}
function makeTrain(n){
  var root=new T.Group(),body=new T.Group();root.add(body);var cars=[];
  var loco=new T.Group();loco.position.set(.95,0,0);body.add(loco);blob(1.2,.6,loco);
  rb(.95,.45,.5,.06,toon(0xff7a1a),0,.42,0,loco);rb(.35,.3,.48,.05,toon(0x2a3a4a),.25,.78,0,loco);bx(.02,.16,.36,glass(0x9fd7ff,.6),.43,.8,0,loco);bx(.97,.06,.52,toon(0xffc63d),0,.3,0,loco);
  var head=new T.Group();head.position.set(.3,.82,0);head.rotation.y=Math.PI/2;head.scale.setScalar(.36);loco.add(head);sp(.33,toon(pick(SKIN)),0,0,0,head,16);var f=face(head,1);var hc=mk(capG(),toon(0x2a3a4a),0,.06,0,head);hc.scale.set(1.04,.75,1.04);
  for(var i=0;i<n;i++){var c=new T.Group();c.position.set(-(i*.82)-.05,0,0);body.add(c);blob(.9,.5,c);bx(.78,.06,.4,toon(0x3a4048),0,.26,0,c);[-1,1].forEach(function(s){var wh=cy(.1,.1,.42,toon(0x2a2f34),s*.26,.12,0,c,12);wh.rotation.x=Math.PI/2;});cars.push(c);}
  var me={root:root,body:body,head:head,f:f,wheels:[],loads:[],cars:cars,ph:0,blinkT:2,blink:0,mood:'',hopT:0,shakeT:0,kind:'train',
    loadPos:function(j){return V3(-(j*.82)-.05,.29,0);},carOf:function(j){return cars[j];}};
  return moodApi(me);
}
function makePerson(D,opt){
  opt=opt||{};var root=new T.Group(),body=new T.Group();root.add(body);blob(.75,.55,root);
  var skin=toon(pick(SKIN)),shirt=toon(opt.vip?0x26262e:opt.insp?0xf2f4f6:pick([0xff6b5b,0x4fb3e8,0xffc63d,0xff8fc4,0x3fbfb0,0xff9b3d,0xf2f2f2])),pant=toon(pick([0xf2e6cc,0x2f3a56,0x4fb3e8,0x6cc76a]));
  var legs=[-1,1].map(function(s){var p=new T.Group();p.position.set(s*.1,.5,0);body.add(p);cy(.075,.065,.46,pant,0,-.23,0,p,10);bx(.12,.07,.2,toon(0xffffff),0,-.47,.03,p);return p;});
  la('torso',[[0,0],[.22,0],[.27,.1],[.28,.36],[.22,.56],[.08,.62],[0,.62]],shirt,0,.46,0,body,18);
  if(!opt.vip&&!opt.insp)for(var i=0;i<5;i++){var fl=sp(.04,toon(pick([0xffffff,0xffd04a,0xff5a3a])),(Math.random()-.5)*.4,.7+Math.random()*.3,.25,body,6);}
  var head=new T.Group();head.position.set(0,1.33,0);body.add(head);var hd=sp(.33,skin,0,0,0,head,20);hd.scale.set(1,.94,.96);var f=face(head,1);
  sp(.035,skin,0,-.02,.33,head,10);
  var r=Math.random();
  if(r<.5){var brim=cy(.42,.42,.02,toon(0xf2d07a),0,.2,0,head,20);cy(.22,.26,.16,toon(0xf2d07a),0,.28,0,head,16);bx(.44,.03,.03,toon(0xff5a3a),0,.23,.2,head);}
  else{var cap=mk(capG(),toon(pick(HAIRC)),0,.03,-.015,head);cap.rotation.x=-.28;}
  if(Math.random()<.5){[-1,1].forEach(function(s){bx(.12,.07,.02,toon(0x111111),s*.12,.03,.33,head);});}
  var arms=[-1,1].map(function(s){var p=new T.Group();p.position.set(s*.29,1.0,0);body.add(p);cy(.06,.055,.36,shirt,0,-.16,0,p,10);sp(.06,skin,0,-.37,0,p,10);p.rotation.z=s*.12;return p;});
  var me={root:root,body:body,head:head,legs:legs,arms:arms,f:f,wheels:[],loads:[],ph:Math.random()*6,blinkT:rnd(1,4),blink:0,mood:'',hopT:0,shakeT:0,kind:'person',loadPos:function(j){return V3((j%2?.3:-.3),0,.25);}};
  return moodApi(me);
}
function makeCustomer(D,opt){
  opt=opt||{};var ct=SH&&SH.loc?IND[SH.loc.ind].cust:'truck';
  if(opt.rail)return makeTrain(opt.n||2);
  if(ct==='person')return makePerson(D,opt);
  return makeTruck(D,{vip:opt.vip,insp:opt.insp,van:ct==='van'&&!opt.insp&&!opt.vip});
}
function animCust(me,dt,time,moving){
  me.ph+=dt*(moving?10:2.2);var s=Math.sin(me.ph);
  if(me.kind==='person'){
    if(moving){me.legs[0].rotation.x=s*.65;me.legs[1].rotation.x=-s*.65;me.arms[0].rotation.x=-s*.5;me.arms[1].rotation.x=s*.5;me.body.position.y=Math.abs(Math.cos(me.ph))*.06;}
    else{me.legs[0].rotation.x*=.8;me.legs[1].rotation.x*=.8;me.arms[0].rotation.x*=.8;me.arms[1].rotation.x*=.8;me.body.position.y=Math.sin(me.ph)*.012;me.head.rotation.z=Math.sin(me.ph*.5)*.05;}
    if(me.hopT>0){me.hopT-=dt;var k=1-me.hopT/.5;me.body.position.y+=Math.sin(k*Math.PI)*.28;me.arms[0].rotation.z=-.12-Math.sin(k*Math.PI)*1.2;me.arms[1].rotation.z=.12+Math.sin(k*Math.PI)*1.2;}
    else{me.arms[0].rotation.z=-.12;me.arms[1].rotation.z=.12;}
  }else{
    me.wheels.forEach(function(w){if(moving)w.rotation.x+=dt*(me.rev?-9:9);});
    me.body.position.y=moving?Math.abs(Math.sin(me.ph*1.3))*.012:Math.sin(me.ph)*.004;me.body.rotation.z=0;
    if(me.hopT>0){me.hopT-=dt;var k2=1-me.hopT/.5;me.body.position.y+=Math.sin(k2*Math.PI)*.08;me.body.rotation.x=-Math.sin(k2*Math.PI*2)*.03;}else me.body.rotation.x*=.8;
  }
  if(me.shakeT>0){me.shakeT-=dt;me.head.rotation.y=Math.sin(me.shakeT*40)*.25*me.shakeT;if(me.kind!=='person')me.body.rotation.z=Math.sin(me.shakeT*50)*.03*me.shakeT;}else me.head.rotation.y*=.85;
  me.blinkT-=dt;if(me.blinkT<=0){me.blink=.12;me.blinkT=rnd(1.8,4.5);}if(me.blink>0)me.blink-=dt;var ey=me.blink>0?.12:1;me.f.eyes[0].scale.y=ey;me.f.eyes[1].scale.y=ey;
}

/* ================= SEAGULL ================= */
function makeGull(){
  var g=new T.Group(),w=toon(0xffffff),gr=toon(0xaab4bc);
  var b=sp(.15,w,0,0,0,g,14);b.scale.set(1.6,.8,.9);sp(.1,w,.2,.08,0,g,12);
  var bk=cone(.03,.1,toon(0xffa21f),.33,.07,0,g,8);bk.rotation.z=-Math.PI/2;
  [-1,1].forEach(function(s){sp(.016,toon(0x111111),.26,.11,s*.06,g,6);});
  var wings=[-1,1].map(function(s){var p=new T.Group();p.position.set(0,.04,s*.1);g.add(p);bx(.3,.02,.36,gr,0,0,s*.18,p);return p;});
  var tl=cone(.06,.14,gr,-.28,.02,0,g,6);tl.rotation.z=Math.PI/2;
  return {g:g,wings:wings};
}

/* ================= ICONS ================= */
var TR=null,TS=null,TC=null,ICON={};
function thumbInit(){
  try{TR=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});}catch(e){TR=null;return;}
  TR.setPixelRatio(1);TR.setSize(112,112);TR.outputEncoding=T.sRGBEncoding;TR.toneMapping=T.NoToneMapping;TR.setClearColor(0x000000,0);
  TS=new T.Scene();TS.add(new T.HemisphereLight(0xffffff,0x6a7a8a,.6));var d=new T.DirectionalLight(0xffffff,.65);d.position.set(-2,5,4);TS.add(d);
  TS.environment=makeEnv(TR);TC=new T.PerspectiveCamera(26,1,.01,40);
}
function shotOf(obj,el,yaw){
  if(!TR)return '';
  var holder=new T.Group();holder.add(obj);if(yaw!=null)holder.rotation.y=yaw;TS.add(holder);holder.updateMatrixWorld(true);
  var box=new T.Box3();obj.traverse(function(n){if(n.isMesh&&n.material!==blobMat&&n.material!==HIT&&n.visible){if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();var bb=n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld);box.union(bb);}});
  var c=box.getCenter(new T.Vector3()),s=box.getSize(new T.Vector3());
  var r=Math.max(s.x,s.y*1.05,s.z)*.56,dir=V3(.35,el==null?.75:el,1).normalize(),dist=r/Math.tan(13*Math.PI/180);
  TC.position.copy(c).addScaledVector(dir,dist);TC.lookAt(c);TC.updateProjectionMatrix();
  TR.render(TS,TC);var url='';try{url=TR.domElement.toDataURL('image/png');}catch(e){}
  holder.remove(obj);TS.remove(holder);return url;
}
function iconBox(t,hold){var k='bx:'+t+(hold?'h':'');if(ICON[k]!=null)return ICON[k];var b=makeBox(t,{hold:hold});return ICON[k]=shotOf(b.g,1.15,-.5);}
function iconOf(t){return iconBox(t);}
function iconUpg(k){var key='up:'+k;if(ICON[key]!=null)return ICON[key];var g=new T.Group(),th=IND.container.theme;
  if(k==='cranes'||k==='speed'){var c=makeCrane(th,-.5,.9,1);g.add(c.g);}
  else if(k==='berth'){var sh=makeShipG('container',4);g.add(sh.g);}
  else if(k==='rail'){var tr=makeTrain(1);g.add(tr.root);}
  else if(k==='gates'){var tk=makeTruck(null,{});g.add(tk.root);}
  else{var t=k==='power'?'food':k==='hazmat'?'fuel':k==='customs'?'elec':'gen';for(var i=0;i<(k==='height'?3:k==='cols'?1:1);i++){var b=makeBox(t,{hold:k==='customs'});b.g.position.y=i*CH;g.add(b.g);}
    if(k==='cols'){var b2=makeBox('toys');b2.g.position.x=.36;g.add(b2.g);var b3=makeBox('elec');b3.g.position.x=-.36;g.add(b3.g);}}
  return ICON[key]=shotOf(g,.75);}
