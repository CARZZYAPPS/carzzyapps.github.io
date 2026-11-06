
/* ================= RENDER (canvas 2D) ================= */
var cv=$('#cv'),cx=cv.getContext('2d'),DPR=1,CWpx=1,CHpx=1,VIEW={S:40,camX:0,oy:0,follow:false,top:70,bot:110},TOUCH=matchMedia('(pointer:coarse)').matches,BG=null,NIGHT=null,TIME=0;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);CWpx=window.innerWidth;CHpx=window.innerHeight;cv.width=Math.round(CWpx*DPR);cv.height=Math.round(CHpx*DPR);fitView(true);}
function fitView(force){
  if(!LV)return;var L=LV.L,top=(TOUCH?64:70)+(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat'))||0),bot=TOUCH?118:52;
  var wW=L.maxX-L.minX,wH=L.yT+1.1+1.75,aH=CHpx-top-bot,S=Math.min(CWpx/wW,aH/wH);
  VIEW.follow=false;
  if(S<38){S=Math.min(aH/wH,CWpx/7.4);VIEW.follow=CWpx/S<wW;}
  VIEW.S=S;VIEW.top=top;VIEW.bot=bot;var spare=Math.max(0,aH-wH*S);VIEW.oy=CHpx-bot-spare*.45-1.75*S;
  var vw=CWpx/S;
  if(!VIEW.follow)VIEW.camX=(L.minX+L.maxX)/2-vw/2;
  else if(force)VIEW.camX=clamp(hookX()-vw/2,L.minX,L.maxX-vw);
}
function camUpd(dt){if(!VIEW.follow)return;var L=LV.L,vw=CWpx/VIEW.S,t=clamp(hookX()-vw/2+CR.v*.35,L.minX,L.maxX-vw);VIEW.camX=lerp(VIEW.camX,t,Math.min(1,dt*4));}
function SX(x){return (x-VIEW.camX)*VIEW.S;}
function SY(y){return VIEW.oy-y*VIEW.S;}
function WX(px){return px/VIEW.S+VIEW.camX;}

function buildBG(){
  var R=mulberry(LV.pi*31+5),b=[],x=LV.L.minX-8;
  while(x<LV.L.maxX+8){var w=.6+R()*1.4,h=.6+R()*2.4;b.push({x:x,w:w,h:h,win:R()<.6});x+=w+R()*.25;}
  var cl=[];for(var i=0;i<6;i++)cl.push({x:R()*30-6,y:3+R()*3,s:.6+R()*.9,v:.08+R()*.15});
  var st=[];for(i=0;i<70;i++)st.push({x:R(),y:R()*.6,r:R()*1.2+.3});
  BG={city:b,clouds:cl,stars:st,ships:[{x:LV.L.maxX+2,v:-.12,s:.5},{x:LV.L.minX+3,v:.08,s:.35}]};
}
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath();}
function shade(hex,f){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;r=clamp(Math.round(r*f),0,255);g=clamp(Math.round(g*f),0,255);b=clamp(Math.round(b*f),0,255);return 'rgb('+r+','+g+','+b+')';}

function drawSym(sh,x,y,r,col){
  cx.fillStyle=col;cx.strokeStyle=col;cx.lineWidth=Math.max(1.5,r*.32);cx.beginPath();
  if(sh==='tri'){cx.moveTo(x,y-r);cx.lineTo(x+r*.95,y+r*.75);cx.lineTo(x-r*.95,y+r*.75);cx.closePath();cx.fill();}
  else if(sh==='circ'){cx.arc(x,y,r*.85,0,7);cx.fill();}
  else if(sh==='sq'){cx.rect(x-r*.75,y-r*.75,r*1.5,r*1.5);cx.fill();}
  else if(sh==='dia'){cx.moveTo(x,y-r);cx.lineTo(x+r,y);cx.lineTo(x,y+r);cx.lineTo(x-r,y);cx.closePath();cx.fill();}
  else if(sh==='star'){for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,rr_=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*rr_,y+Math.sin(a)*rr_);}cx.closePath();cx.fill();}
  else if(sh==='cross'){cx.rect(x-r*.3,y-r,r*.6,r*2);cx.rect(x-r,y-r*.3,r*2,r*.6);cx.fill();}
  else if(sh==='snow'){for(var j=0;j<3;j++){var b=j*Math.PI/3;cx.moveTo(x-Math.cos(b)*r,y-Math.sin(b)*r);cx.lineTo(x+Math.cos(b)*r,y+Math.sin(b)*r);}cx.stroke();}
  else if(sh==='haz'){cx.moveTo(x,y-r);cx.lineTo(x+r,y);cx.lineTo(x,y+r);cx.lineTo(x-r,y);cx.closePath();cx.fill();cx.fillStyle='#ffd23a';cx.font='900 '+Math.round(r*1.3)+'px Inter,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',x,y+r*.08);}
}
/* a container whose bottom-center sits at world (x,y), rotated by rot around (px,py) world if given */
function drawBox(b,x,y,alpha){
  var T=TYPES[b.t],S=VIEW.S,w=CW*S,h=CH*S,X=SX(x)-w/2,Y=SY(y)-h;
  cx.save();if(alpha!=null)cx.globalAlpha=alpha;
  cx.fillStyle=T.c;rr(X,Y,w,h,Math.max(2,S*.05));cx.fill();
  if(T.hazmat){cx.save();rr(X,Y,w,h,Math.max(2,S*.05));cx.clip();cx.strokeStyle='#1e1e1e';cx.lineWidth=S*.09;for(var k=-1;k<6;k++){cx.beginPath();cx.moveTo(X+k*S*.22,Y+h);cx.lineTo(X+k*S*.22+h,Y);cx.stroke();}cx.restore();
    cx.fillStyle=T.c;rr(X+w*.3,Y+h*.18,w*.4,h*.64,3);cx.fill();}
  else{cx.strokeStyle=T.d;cx.globalAlpha=(alpha==null?1:alpha)*.55;cx.lineWidth=Math.max(1,S*.025);for(var i=1;i<9;i++){var lx=X+w*i/9;cx.beginPath();cx.moveTo(lx,Y+h*.14);cx.lineTo(lx,Y+h*.86);cx.stroke();}cx.globalAlpha=alpha==null?1:alpha;}
  cx.fillStyle=T.d;cx.fillRect(X,Y,w,Math.max(2,h*.1));cx.fillRect(X,Y+h-Math.max(2,h*.1),w,Math.max(2,h*.1));
  cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=1.2;rr(X,Y,w,h,Math.max(2,S*.05));cx.stroke();
  // symbol plate
  var pr=h*.3;cx.fillStyle='rgba(255,255,255,.92)';cx.beginPath();cx.arc(X+w/2,Y+h/2,pr*1.18,0,7);cx.fill();
  drawSym(T.sh,X+w/2,Y+h/2,pr*.82,T.hazmat?'#1e1e1e':T.reefer?'#2f8fd0':T.d);
  if(b.thaw!=null&&T.reefer){var f=clamp(b.thaw/thawTime(),0,1);cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(X+w*.08,Y-h*.28,w*.84,h*.16);cx.fillStyle=f>.5?'#3ddc84':f>.25?'#ffc400':'#ff5a4f';cx.fillRect(X+w*.08,Y-h*.28,w*.84*f,h*.16);
    if(f<.35&&Math.floor(TIME*6)%2){cx.strokeStyle='#ff5a4f';cx.lineWidth=2;rr(X-2,Y-2,w+4,h+4,4);cx.stroke();}}
  cx.restore();
}
function drawBoxRot(b,hx,hy,rot){var S=VIEW.S;cx.save();cx.translate(SX(hx),SY(hy));cx.rotate(rot);cx.translate(-SX(hx),-SY(hy));drawBox(b,hx,hy-.06-CH);cx.restore();}

function drawSky(){
  var th=LV.th,g=cx.createLinearGradient(0,0,0,SY(WATER_Y));g.addColorStop(0,th.sky[0]);g.addColorStop(1,th.sky[1]);cx.fillStyle=g;cx.fillRect(0,0,CWpx,CHpx);
  if(th.night){BG.stars.forEach(function(s){cx.fillStyle='rgba(255,255,255,'+(.4+.4*Math.sin(TIME*2+s.x*40))+')';cx.fillRect(s.x*CWpx,s.y*CHpx,s.r,s.r);});
    cx.fillStyle='#f4f1dc';cx.beginPath();cx.arc(CWpx*.82,CHpx*.13,22,0,7);cx.fill();cx.fillStyle=th.sky[0];cx.beginPath();cx.arc(CWpx*.82+9,CHpx*.13-5,19,0,7);cx.fill();}
  else{var sg=cx.createRadialGradient(CWpx*.8,CHpx*.14,4,CWpx*.8,CHpx*.14,90);sg.addColorStop(0,'rgba(255,250,220,1)');sg.addColorStop(.25,'rgba(255,240,180,.9)');sg.addColorStop(1,'rgba(255,240,180,0)');cx.fillStyle=sg;cx.fillRect(0,0,CWpx,CHpx*.5);}
  // clouds
  BG.clouds.forEach(function(c){c.x+=c.v*.016;var span=LV.L.maxX-LV.L.minX+16;if(c.x>LV.L.maxX+6)c.x-=span;
    var X=SX(c.x*0.5+VIEW.camX*.5),Y=SY(c.y+LV.L.yT*.5),s=c.s*VIEW.S;cx.fillStyle=th.night?'rgba(120,140,190,.18)':'rgba(255,255,255,.85)';
    cx.beginPath();cx.arc(X,Y,s*.9,0,7);cx.arc(X+s,Y+s*.15,s*.7,0,7);cx.arc(X-s,Y+s*.2,s*.6,0,7);cx.arc(X+s*.3,Y-s*.4,s*.6,0,7);cx.fill();});
  // skyline (parallax)
  cx.fillStyle=th.city;BG.city.forEach(function(b){var X=SX(b.x*.6+VIEW.camX*.4),W=b.w*VIEW.S*.6,H=b.h*VIEW.S*.6;cx.fillRect(X,SY(WATER_Y)-H,W,H);
    if(th.night&&b.win){cx.fillStyle='rgba(255,220,130,.55)';for(var i=0;i<3;i++)cx.fillRect(X+W*.25,SY(WATER_Y)-H+H*(.2+i*.25),W*.18,H*.08);cx.fillStyle=th.city;}});
  // distant ships
  BG.ships.forEach(function(s){s.x+=s.v*.016;if(s.x<LV.L.minX-6)s.x=LV.L.maxX+6;if(s.x>LV.L.maxX+6)s.x=LV.L.minX-6;var X=SX(s.x*.7+VIEW.camX*.3),Y=SY(WATER_Y)+2,k=VIEW.S*s.s;
    cx.fillStyle=th.night?'#0d1830':'rgba(40,60,90,.55)';cx.beginPath();cx.moveTo(X-2*k,Y-.35*k);cx.lineTo(X+2.2*k,Y-.35*k);cx.lineTo(X+1.8*k,Y);cx.lineTo(X-1.8*k,Y);cx.fill();cx.fillRect(X-1.6*k,Y-.75*k,2.6*k,.4*k);});
}
function drawSea(){
  var th=LV.th,Y=SY(WATER_Y),g=cx.createLinearGradient(0,Y,0,CHpx);g.addColorStop(0,th.sea[0]);g.addColorStop(1,th.sea[1]);cx.fillStyle=g;cx.fillRect(0,Y,CWpx,CHpx-Y);
  cx.strokeStyle='rgba(255,255,255,.28)';cx.lineWidth=2;for(var r=0;r<4;r++){cx.beginPath();var yy=Y+8+r*VIEW.S*.32;for(var px=-20;px<CWpx+20;px+=8){var wx=WX(px);cx.lineTo(px,yy+Math.sin(wx*2.4+TIME*(1.6+r*.3)+r)*3);}cx.stroke();}
}
function drawQuay(){
  var L=LV.L,th=LV.th,S=VIEW.S,x0=SX(L.minX-4),x1=SX(L.quayEnd),y0=SY(QUAY_Y),y1=SY(-1.9);
  cx.fillStyle=th.quay2;cx.fillRect(x0,y0,x1-x0,y1-y0);
  cx.fillStyle=th.quay;cx.fillRect(x0,y0-S*.06,x1-x0,S*.12);
  // quay wall blocks
  cx.strokeStyle='rgba(0,0,0,.12)';cx.lineWidth=1;for(var bx=Math.floor(L.minX-4);bx<L.quayEnd;bx+=.9){cx.beginPath();cx.moveTo(SX(bx),y0+S*.06);cx.lineTo(SX(bx),y1);cx.stroke();}
  cx.fillStyle='#2b2b2b';cx.fillRect(x1-S*.12,y0+S*.06,S*.12,y1-y0);
  // tyre fenders
  cx.fillStyle='#1b1b1b';for(var f=0;f<2;f++){cx.beginPath();cx.arc(x1-S*.02,SY(-.3-f*.55),S*.13,0,7);cx.fill();}
  // road under lanes
  var lanes=L.slots.filter(function(s){return s.kind==='lane';}),rx1=SX(L.yard0-.15);
  cx.fillStyle=th.night?'#2c3036':'#4a4f57';cx.fillRect(x0,y0-S*.08,rx1-x0,S*.1);
  cx.fillStyle='#ffd23a';cx.fillRect(rx1-S*.04,y0-S*.08,S*.04,S*.1);
  // yard pads
  L.slots.forEach(function(s){if(s.kind!=='yard')return;var X=SX(s.x-CW/2-.03),W=(CW+.06)*S;cx.fillStyle=s.power?'rgba(56,168,255,.55)':'rgba(255,210,58,.75)';cx.fillRect(X,y0-S*.07,W,S*.07);
    if(s.power){cx.fillStyle='#38a8ff';rr(SX(s.x)-S*.16,y0+S*.12,S*.32,S*.22,3);cx.fill();cx.fillStyle='#fff';cx.font='800 '+Math.round(S*.17)+'px Inter,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('⚡',SX(s.x),y0+S*.235);}});
  // bollard
  cx.fillStyle='#2b2b2b';rr(x1-S*.38,y0-S*.22,S*.18,S*.2,3);cx.fill();
}
function shipOffset(){if(!LV.endless||LV.shipT<=0)return 0;var t=LV.shipT;return t>1.5?(3-t)/1.5*14:(t)/1.5*14;}
function drawShip(){
  var L=LV.L,th=LV.th,S=VIEW.S,o=shipOffset(),x0=SX(L.shipStart+o),x1=SX(L.shipEnd+o),yd=SY(QUAY_Y),yb=SY(-1.45),bob=0;
  cx.fillStyle=th.hull;cx.beginPath();cx.moveTo(x0,yd);cx.lineTo(x1,yd);cx.quadraticCurveTo(x1+S*1.1,yd,x1+S*1.2,yd-S*.25);cx.lineTo(x1+S*.55,yb);cx.lineTo(x0+S*.2,yb);cx.closePath();cx.fill();
  cx.fillStyle=shade(th.hull.length===7?th.hull:'#333333',.55);cx.fillRect(x0,yd,x1-x0+S*.9,S*.1);
  cx.fillStyle='rgba(255,255,255,.85)';cx.font='800 '+Math.round(S*.26)+'px Bungee,Inter,sans-serif';cx.textAlign='left';cx.textBaseline='middle';cx.fillText(LV.endless?'RUSH '+LV.ships:LV.P.name.split(' ')[0].toUpperCase()+' '+(LV.li+1),x0+S*.4,SY(-.45));
  // bridge
  var bx=x1+S*.15;cx.fillStyle='#f2f4f6';cx.fillRect(bx,SY(1.5),S*.7,yd-SY(1.5));cx.fillStyle=th.night?'#ffd77a':'#1e3550';for(var i=0;i<3;i++)cx.fillRect(bx+S*.08,SY(1.35-i*.4),S*.54,S*.16);
  cx.fillStyle=th.hull;cx.fillRect(bx+S*.25,SY(1.9),S*.2,S*.4);
  // deck rail
  cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(x0,yd-S*.08);cx.lineTo(x1,yd-S*.08);cx.stroke();
}
function drawStacks(){
  var o=shipOffset();
  LV.L.slots.forEach(function(s){if(s.kind==='lane')return;var ox=s.kind==='ship'?o:0;s.stack.forEach(function(b,i){drawBox(b,s.x+ox,baseY(s)+i*CH);});});
}
function drawTruck(t){
  var S=VIEW.S,x=t.x,shake=t.honk>0?Math.sin(TIME*60)*S*.02:0,X=SX(x)+shake,yb=SY(LANE_Y),yg=SY(QUAY_Y);
  // chassis
  cx.fillStyle='#2a2d33';cx.fillRect(X-S*.72,yb,S*1.95,S*.16);
  // bed
  cx.fillStyle='#565b63';cx.fillRect(X-S*.72,yb-S*.04,S*1.45,S*.08);
  // cab (right)
  var cX=X+S*.78;cx.fillStyle=t.col;rr(cX,yb-S*.62,S*.5,S*.78,S*.08);cx.fill();cx.fillStyle='#9fd3ff';rr(cX+S*.22,yb-S*.52,S*.24,S*.26,S*.04);cx.fill();
  cx.fillStyle='rgba(0,0,0,.18)';cx.fillRect(cX,yb+S*.04,S*.5,S*.12);
  if(LV.th.night){var lg=cx.createRadialGradient(cX+S*.5,yb,2,cX+S*.5,yb,S*1.2);lg.addColorStop(0,'rgba(255,240,180,.55)');lg.addColorStop(1,'rgba(255,240,180,0)');cx.fillStyle=lg;cx.fillRect(cX,yb-S*1.2,S*1.8,S*2.4);}
  // wheels
  cx.fillStyle='#151515';[-.45,.1,.98].forEach(function(w){cx.beginPath();cx.arc(X+w*S,yg-S*.14,S*.15,0,7);cx.fill();cx.fillStyle='#8a8f96';cx.beginPath();cx.arc(X+w*S,yg-S*.14,S*.06,0,7);cx.fill();cx.fillStyle='#151515';});
  if(t.load)drawBox(t.load,x,LANE_Y);
  // want bubble
  if(t.state==='wait'||t.state==='in'){var bx=SX(x),by=SY(LANE_Y+CH+.95)+Math.sin(t.bob*3)*2,bw=S*1.02,bh=S*.62,T=TYPES[t.want],f=clamp(t.pat/t.max,0,1);
    cx.fillStyle='rgba(255,255,255,.96)';rr(bx-bw/2,by-bh/2,bw,bh,S*.14);cx.fill();cx.beginPath();cx.moveTo(bx-S*.1,by+bh/2-1);cx.lineTo(bx,by+bh/2+S*.13);cx.lineTo(bx+S*.1,by+bh/2-1);cx.fill();
    cx.fillStyle=T.c;rr(bx-bw*.38,by-bh*.33,bw*.76,bh*.52,4);cx.fill();if(T.hazmat){cx.strokeStyle='#1e1e1e';cx.lineWidth=2;rr(bx-bw*.38,by-bh*.33,bw*.76,bh*.52,4);cx.stroke();}
    drawSym(T.sh,bx,by-bh*.07,bh*.17,T.hazmat?'#1e1e1e':T.reefer?'#2f8fd0':'#ffffff');
    cx.fillStyle='rgba(0,0,0,.12)';cx.fillRect(bx-bw*.38,by+bh*.27,bw*.76,S*.07);cx.fillStyle=f>.5?'#3ddc84':f>.25?'#ffc400':'#ff5a4f';cx.fillRect(bx-bw*.38,by+bh*.27,bw*.76*f,S*.07);}
}
function drawCrane(){
  var L=LV.L,th=LV.th,S=VIEW.S,yT=L.yT,col=th.crane,dk=shade(col,.7),xb=L.slots[0].x-.95,xf=L.quayEnd-.12,yr=SY(yT+.12);
  // legs + lattice
  cx.lineWidth=Math.max(2,S*.06);
  [xb,xf].forEach(function(x){cx.fillStyle=col;cx.fillRect(SX(x)-S*.09,yr,S*.18,SY(QUAY_Y)-yr);cx.fillStyle='#222';cx.fillRect(SX(x)-S*.18,SY(QUAY_Y)-S*.1,S*.36,S*.1);});
  cx.strokeStyle=dk;for(var y=0;y<yT;y+=.7){cx.beginPath();cx.moveTo(SX(xb),SY(y));cx.lineTo(SX(xb)+S*.0,SY(y+.7));cx.stroke();}
  // boom
  var b0=SX(xb-.6),b1=SX(L.shipEnd+.55);cx.fillStyle=col;cx.fillRect(b0,yr-S*.2,b1-b0,S*.2);cx.fillStyle=dk;cx.fillRect(b0,yr-S*.02,b1-b0,S*.04);
  cx.strokeStyle=dk;cx.lineWidth=Math.max(1.5,S*.035);cx.beginPath();for(var bx=xb-.6;bx<L.shipEnd+.5;bx+=.4){cx.moveTo(SX(bx),yr-S*.2);cx.lineTo(SX(bx+.2),yr);cx.lineTo(SX(bx+.4),yr-S*.2);}cx.stroke();
  // A-frame + stays
  var ax=SX(xf),ay=SY(yT+1.3);cx.strokeStyle=col;cx.lineWidth=Math.max(2,S*.07);cx.beginPath();cx.moveTo(SX(xb),yr-S*.2);cx.lineTo(ax,ay);cx.lineTo(SX(xf),yr-S*.2);cx.stroke();
  cx.strokeStyle=dk;cx.lineWidth=1.5;cx.beginPath();cx.moveTo(ax,ay);cx.lineTo(b1,yr-S*.2);cx.moveTo(ax,ay);cx.lineTo(SX((xf+L.shipEnd)/2),yr-S*.2);cx.stroke();
  // machine house
  cx.fillStyle=dk;rr(SX(xb-.55),yr-S*.62,S*1.0,S*.42,4);cx.fill();cx.fillStyle='rgba(255,255,255,.75)';cx.font='800 '+Math.round(S*.16)+'px Bungee,Inter,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('LZR',SX(xb-.05),yr-S*.41);
  // windsock
  if(LV.rules.wind){var wx=SX(xf),wy=ay-S*.05,w=LV.wind,len=S*(.25+Math.min(.5,Math.abs(w)*.18)),dir=w>=0?1:-1,droop=Math.max(0,.6-Math.abs(w)*.25);
    cx.strokeStyle='#ddd';cx.lineWidth=2;cx.beginPath();cx.moveTo(wx,wy);cx.lineTo(wx,wy-S*.35);cx.stroke();
    cx.save();cx.translate(wx,wy-S*.33);cx.rotate(dir*(Math.PI/2-droop));for(var k=0;k<4;k++){cx.fillStyle=k%2?'#fff':'#ff5a2a';cx.fillRect(-S*.07+k*0,k*len/4*-1-len/4,S*.14-k*S*.015,len/4);}cx.restore();
    if(LV.gust>0){cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=2;for(var g=0;g<7;g++){var gy=(g*.37+TIME*.2)%1,gx=((TIME*1.7*dir+g*.31)%1+1)%1;cx.beginPath();cx.moveTo(gx*CWpx,VIEW.top+gy*(SY(0)-VIEW.top));cx.lineTo(gx*CWpx+dir*40,VIEW.top+gy*(SY(0)-VIEW.top));cx.stroke();}}}
  // trolley
  var tx=SX(CR.x);cx.fillStyle='#2b2f36';rr(tx-S*.42,yr-S*.06,S*.84,S*.26,4);cx.fill();cx.fillStyle=col;cx.fillRect(tx-S*.38,yr+S*.12,S*.76,S*.06);
  // operator cab
  cx.fillStyle='#f2f4f6';rr(tx+S*.18,yr+S*.18,S*.34,S*.32,4);cx.fill();cx.fillStyle='#1e3550';cx.fillRect(tx+S*.24,yr+S*.24,S*.22,S*.14);
  // cables + spreader
  var hx=hookX(),hy=hookY(),HX=SX(hx),HY=SY(hy),r=CR.th,sw=CW*.98*S/2,ca=Math.cos(r),sa=Math.sin(r);
  cx.strokeStyle='#1b1b1b';cx.lineWidth=Math.max(1.2,S*.025);cx.beginPath();cx.moveTo(tx-S*.25,yr+S*.18);cx.lineTo(HX-sw*.55*ca,HY-sw*.55*sa);cx.moveTo(tx+S*.12,yr+S*.18);cx.lineTo(HX+sw*.55*ca,HY+sw*.55*sa);cx.stroke();
  if(CR.carry)drawBoxRot(CR.carry,hx,hy,r);
  cx.save();cx.translate(HX,HY);cx.rotate(r);cx.fillStyle=col;cx.fillRect(-sw,-S*.07,sw*2,S*.1);cx.fillStyle=dk;cx.fillRect(-sw,S*.02,S*.08,S*.06);cx.fillRect(sw-S*.08,S*.02,S*.08,S*.06);cx.restore();
}
function drawGuide(){
  if(LV.phase!=='play'||CR.state==='up')return;
  var hx=hookX(),by=bottomY(),s=slotUnder(hx),S=VIEW.S;if(!s)return;
  var top=s.kind==='lane'?(s.truck&&s.truck.state==='wait'?topY(s):null):topY(s);if(top==null)return;
  var off=Math.abs(hx-s.x),c=off<=tolPerf()?'#3ddc84':off<=(CR.carry?tolLand():tolGrab())?'#ffc400':'#ff5a4f';
  var bad=false;if(CR.carry){if(s.kind==='lane'&&s.truck&&s.truck.want!==CR.carry.t)bad=true;if(s.kind!=='lane'&&s.stack.length>=s.max)bad=true;}else if(s.kind==='lane'||!s.stack.length)bad=true;
  if(bad)c='rgba(255,90,79,.8)';
  cx.save();cx.strokeStyle=c;cx.lineWidth=2;cx.setLineDash([5,5]);cx.beginPath();cx.moveTo(SX(hx),SY(by));cx.lineTo(SX(hx),SY(top));cx.stroke();cx.setLineDash([]);
  // landing brackets at target
  var X=SX(s.x),Y=SY(top),w=CW*S/2,k=S*.16;cx.lineWidth=3;cx.beginPath();cx.moveTo(X-w,Y-k);cx.lineTo(X-w,Y);cx.lineTo(X-w+k,Y);cx.moveTo(X+w,Y-k);cx.lineTo(X+w,Y);cx.lineTo(X+w-k,Y);cx.stroke();
  if(bad){cx.lineWidth=3;cx.beginPath();cx.moveTo(X-k,Y-k*2.4);cx.lineTo(X+k,Y-k*.4);cx.moveTo(X+k,Y-k*2.4);cx.lineTo(X-k,Y-k*.4);cx.stroke();}
  cx.restore();
}
/* ---------- particles ---------- */
function burst(x,y,n,col,sp){for(var i=0;i<n;i++)FX.push({x:x,y:y,vx:rnd(-1,1)*(sp||1),vy:rnd(.3,1.6)*(sp||1),t:0,life:rnd(.4,.8),s:rnd(.04,.09),c:col,g:4});}
function dust(x,y){for(var i=0;i<12;i++)FX.push({x:x+rnd(-.5,.5),y:y,vx:rnd(-.9,.9),vy:rnd(.1,.5),t:0,life:rnd(.5,.9),s:rnd(.08,.16),c:'rgba(200,190,170,.8)',g:-.2,puff:1});}
function sparks(x,y){for(var i=0;i<16;i++)FX.push({x:x,y:y,vx:rnd(-3,3),vy:rnd(0,3),t:0,life:rnd(.25,.5),s:rnd(.03,.05),c:pick(['#fff3a0','#ffc400','#ffffff']),g:9});}
function smoke(x,y,col){for(var i=0;i<18;i++)FX.push({x:x+rnd(-.4,.4),y:y+rnd(-.2,.2),vx:rnd(-.4,.4),vy:rnd(.4,1.2),t:0,life:rnd(.8,1.4),s:rnd(.14,.3),c:col||'rgba(120,200,90,.7)',g:-.3,puff:1});}
function confetti(x,y,n){for(var i=0;i<n;i++)FX.push({x:x,y:y,vx:rnd(-2,2),vy:rnd(1.5,3.5),t:0,life:rnd(.8,1.3),s:rnd(.04,.07),c:pick(['#ffc400','#3ddc84','#38a8ff','#ff5a4f','#ffffff']),g:6,rot:rnd(0,6)});}
function drawFX(dt){
  for(var i=FX.length-1;i>=0;i--){var p=FX[i];p.t+=dt;if(p.t>=p.life){FX.splice(i,1);continue;}p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;var a=1-p.t/p.life,S=VIEW.S;
    cx.globalAlpha=a;cx.fillStyle=p.c;if(p.puff){cx.beginPath();cx.arc(SX(p.x),SY(p.y),p.s*S*(1+p.t),0,7);cx.fill();}else{cx.fillRect(SX(p.x)-p.s*S/2,SY(p.y)-p.s*S/2,p.s*S,p.s*S*.6);}}
  cx.globalAlpha=1;
  for(i=POPS.length-1;i>=0;i--){var q=POPS[i];q.t+=dt;if(q.t>1.2){POPS.splice(i,1);continue;}var k=q.t/1.2,y=q.y+k*.8;
    cx.globalAlpha=k<.75?1:1-(k-.75)/.25;cx.font=Math.round(clamp(VIEW.S*.36,13,22))+'px Bungee,Impact,sans-serif';cx.textAlign='center';cx.textBaseline='middle';
    cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,.55)';cx.strokeText(q.txt,SX(q.x),SY(y));cx.fillStyle=q.cls==='bad'?'#ff6a5f':q.cls==='perf'?'#ffe066':'#7dffb0';cx.fillText(q.txt,SX(q.x),SY(y));}
  cx.globalAlpha=1;
}
function drawNight(){
  if(!LV.th.night)return;
  if(!NIGHT){NIGHT=document.createElement('canvas');}
  if(NIGHT.width!==cv.width||NIGHT.height!==cv.height){NIGHT.width=cv.width;NIGHT.height=cv.height;}
  var n=NIGHT.getContext('2d'),S=VIEW.S;n.setTransform(DPR,0,0,DPR,0,0);n.globalCompositeOperation='source-over';n.clearRect(0,0,CWpx,CHpx);n.fillStyle='rgba(4,8,24,.74)';n.fillRect(0,0,CWpx,CHpx);
  n.globalCompositeOperation='destination-out';
  var light=function(x,y,r,a){var g=n.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(1,'rgba(0,0,0,0)');n.fillStyle=g;n.fillRect(x-r,y-r,r*2,r*2);};
  var hx=SX(hookX()),hy=SY(hookY());light(hx,hy+S*.8,S*2.6,1);light(SX(CR.x),SY(LV.L.yT),S*1.4,.8);
  LV.L.slots.forEach(function(s){if(s.kind==='lane'&&s.truck)light(SX(s.truck.x),SY(1.3),S*1.5,.75);});
  [LV.L.yard0,LV.L.shipStart+1.5,(LV.L.shipStart+LV.L.shipEnd)/2+1].forEach(function(x){light(SX(x),SY(1.2),S*2,.55);});
  POPS.forEach(function(q){light(SX(q.x),SY(q.y),S*1,.6);});
  cx.drawImage(NIGHT,0,0,CWpx,CHpx);
  // lamp posts
  [LV.L.yard0-.2,LV.L.quayEnd-.5].forEach(function(x){cx.fillStyle='#3a3f48';cx.fillRect(SX(x)-2,SY(3.2),4,SY(0)-SY(3.2));cx.fillStyle='#ffe9a8';cx.beginPath();cx.arc(SX(x),SY(3.2),5,0,7);cx.fill();});
}
function drawEdgeHints(){
  if(!VIEW.follow)return;var S=VIEW.S;
  LV.trucks.forEach(function(t){if(t.state!=='wait')return;var X=SX(t.x);if(X>-S*.4&&X<CWpx+S*.4)return;var left=X<0,ex=left?24:CWpx-24,ey=SY(1.6),T=TYPES[t.want],f=clamp(t.pat/t.max,0,1);
    cx.fillStyle='rgba(11,22,38,.85)';rr(ex-20,ey-20,40,40,10);cx.fill();cx.fillStyle=T.c;rr(ex-13,ey-9,26,16,3);cx.fill();drawSym(T.sh,ex,ey-1,5,T.hazmat?'#1e1e1e':'#fff');
    cx.fillStyle=f>.25?'#ffc400':'#ff5a4f';cx.fillRect(ex-14,ey+11,28*f,4);cx.fillStyle='#fff';cx.font='14px Bungee,sans-serif';cx.textAlign='center';cx.fillText(left?'◀':'▶',ex+(left?-27:27)*0,ey-27);});
}
function render(dt){
  TIME+=dt;cx.setTransform(DPR,0,0,DPR,0,0);
  if(!LV){cx.fillStyle='#0b1626';cx.fillRect(0,0,CWpx,CHpx);return;}
  camUpd(dt);
  var sh=SHAKE>0?SHAKE:0;SHAKE=Math.max(0,SHAKE-dt*.9);
  cx.save();if(sh>0)cx.translate(rnd(-1,1)*sh*20,rnd(-1,1)*sh*20);
  drawSky();drawSea();drawShip();drawQuay();drawStacks();
  LV.trucks.forEach(drawTruck);
  drawGuide();drawTut();drawCrane();
  if(LV.th.snow){cx.fillStyle='rgba(255,255,255,.8)';for(var i=0;i<60;i++){var sx=((i*97.3+TIME*(14+i%5*3))%CWpx),sy=((i*53.1+TIME*(30+i%7*6))%CHpx);cx.fillRect(sx,sy,2,2);}}
  drawFX(dt);drawNight();drawEdgeHints();
  cx.restore();
}
