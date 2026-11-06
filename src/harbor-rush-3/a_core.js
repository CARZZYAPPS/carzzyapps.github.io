(function(){
'use strict';
/* ================= UTIL ================= */
var $=function(s){return document.querySelector(s);};
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function fmt(n){return Math.round(n).toLocaleString();}
function mmss(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
function easeOut(t){return 1-Math.pow(1-t,3);}

/* ================= AUDIO (all synthesized) ================= */
var AC=null,master=null,hum=null;
function audio(){if(AC)return AC;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=G&&G.mute?0:.55;master.connect(AC.destination);}catch(e){AC=null;}return AC;}
function setMute(m){G.mute=m;if(master)master.gain.value=m?0:.55;save();}
function tone(f,d,type,vol,delay,f2){var a=AC;if(!a||G.mute)return;var t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.1,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05);}
var NB=null;function noise(d,vol,freq,delay,q){var a=AC;if(!a||G.mute)return;if(!NB){var n=a.sampleRate*2;NB=a.createBuffer(1,n,a.sampleRate);var c=NB.getChannelData(0);for(var i=0;i<n;i++)c[i]=Math.random()*2-1;}
  var t=a.currentTime+(delay||0),s=a.createBufferSource();s.buffer=NB;var f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq||800;f.Q.value=q||.9;var g=a.createGain();g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+d+.05);}
var SFX={
  grab:function(){noise(.07,.35,2400,0,3);tone(260,.07,'square',.04);},
  clunk:function(){noise(.16,.55,380);tone(95,.16,'triangle',.12);},
  perfect:function(){noise(.12,.4,420);tone(880,.07,'triangle',.07);tone(1320,.13,'triangle',.06,.06);},
  bump:function(){noise(.28,.7,240);tone(70,.25,'sawtooth',.09);},
  clang:function(){tone(523,.45,'square',.035);tone(587,.45,'square',.03);noise(.15,.4,2600,0,4);},
  horn:function(){tone(196,.45,'sawtooth',.045);tone(247,.45,'sawtooth',.035);},
  beep:function(){tone(1000,.09,'square',.03);tone(1000,.09,'square',.03,.25);},
  deliver:function(){tone(660,.08,'triangle',.08);tone(990,.09,'triangle',.08,.08);tone(1320,.16,'triangle',.07,.16);},
  bad:function(){tone(220,.22,'square',.06);tone(150,.32,'square',.06,.16);},
  nope:function(){tone(180,.1,'square',.04);},
  star:function(i){tone(660+i*240,.3,'triangle',.09);tone(1320+i*240,.2,'sine',.04,.05);},
  ship:function(){tone(98,1.2,'sawtooth',.05);tone(131,1.2,'sawtooth',.035);},
  coin:function(){tone(1568,.06,'square',.035);tone(2093,.12,'square',.035,.05);},
  gust:function(){noise(1.6,.22,450,0,.6);},
  splash:function(){noise(.6,.45,700,0,.5);},
  puff:function(){noise(.5,.4,900,0,.7);tone(300,.4,'sawtooth',.03,0,90);},
  ui:function(){tone(740,.05,'triangle',.06);},
  win:function(){[523,659,784,1046].forEach(function(f,i){tone(f,.22,'triangle',.08,i*.1);});}
};
function humSet(sp,hoist){var a=AC;if(!a)return;if(!hum){var o=a.createOscillator(),o2=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='sawtooth';o2.type='square';o.frequency.value=55;o2.frequency.value=82;f.type='lowpass';f.frequency.value=380;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(master);o.start();o2.start();hum={o:o,o2:o2,g:g};}
  var v=G.mute?0:Math.min(.045,sp*.011+(hoist?.02:0));hum.o.frequency.setTargetAtTime(45+sp*22+(hoist?30:0),a.currentTime,.06);hum.o2.frequency.setTargetAtTime(70+sp*30,a.currentTime,.06);hum.g.gain.setTargetAtTime(v,a.currentTime,.06);}

/* ================= DATA ================= */
var CW=.96,CH=.5;   // container width / height in world units
var TYPES={
  red:{c:'#e5483b',d:'#a42a20',sh:'tri',n:'red'},
  blue:{c:'#2f8ff0',d:'#1a5ea8',sh:'circ',n:'blue'},
  green:{c:'#2fbf6a',d:'#1a7f44',sh:'sq',n:'green'},
  yellow:{c:'#ffc61a',d:'#b88a00',sh:'dia',n:'yellow'},
  purple:{c:'#8a5cf0',d:'#5a36ad',sh:'star',n:'purple'},
  orange:{c:'#ff8a2a',d:'#b85a10',sh:'cross',n:'orange'},
  reef:{c:'#eef4f8',d:'#93a9ba',sh:'snow',n:'reefer',reefer:1},
  haz:{c:'#ffd23a',d:'#1e1e1e',sh:'haz',n:'hazmat',hazmat:1}
};
var COLOR_ORDER=['red','blue','green','yellow','purple','orange'];
/* c ship columns · h max stack · f fill · y yard columns · l truck lanes · n trucks · p patience (s) · k colors · par (s)
   r reefer share · pw powered yard slots · z hazmat share · w wind strength */
var PORTS=[
  {id:'old',name:'Old Harbor',tag:'Learn the crane. Dig out what each truck wants.',need:0,
   th:{sky:['#7fc8ff','#dff3ff'],sea:['#2a8fd0','#0f4f85'],quay:'#cfc7b8',quay2:'#a99f8d',crane:'#ffb21a',hull:'#d8402f',city:'#9cc6e6'},rules:[],
   lv:[{c:3,h:3,f:.6,y:2,l:1,n:3,p:75,k:3,par:70,tut:1},{c:4,h:3,f:.62,y:2,l:1,n:5,p:60,k:3,par:95},{c:4,h:4,f:.6,y:3,l:1,n:6,p:55,k:4,par:115},
       {c:5,h:4,f:.62,y:3,l:2,n:8,p:55,k:4,par:140},{c:6,h:4,f:.64,y:3,l:2,n:10,p:50,k:5,par:170},{c:6,h:5,f:.6,y:4,l:2,n:12,p:48,k:5,par:200}]},
  {id:'gale',name:'Gale Point',tag:'Gusts shove the load sideways. Watch the windsock.',need:12,
   th:{sky:['#93aec6','#e6eef5'],sea:['#3d7da6','#173f61'],quay:'#bdbbb3',quay2:'#93918a',crane:'#ee5a2f',hull:'#2d5f8f',city:'#a9bccd'},rules:['wind'],
   lv:[{c:4,h:4,f:.6,y:3,l:1,n:6,p:60,k:4,par:120,w:1},{c:5,h:4,f:.62,y:3,l:2,n:8,p:55,k:4,par:145,w:1.2},{c:5,h:4,f:.65,y:3,l:2,n:9,p:52,k:5,par:160,w:1.4},
       {c:6,h:4,f:.64,y:3,l:2,n:10,p:50,k:5,par:175,w:1.6},{c:6,h:5,f:.6,y:4,l:2,n:11,p:48,k:5,par:190,w:1.8},{c:7,h:5,f:.62,y:4,l:2,n:13,p:46,k:6,par:215,w:2}]},
  {id:'frost',name:'Frost Bay',tag:'Reefers start thawing once they leave the ship. Plug them in or ship them fast.',need:26,
   th:{sky:['#bfe0f5','#f5fbff'],sea:['#4a8fb3','#1f5a7a'],quay:'#e3eaef',quay2:'#b9c6cf',crane:'#22a39e',hull:'#39404c',city:'#cfe1ee',snow:1},rules:['reefer'],
   lv:[{c:4,h:4,f:.6,y:3,l:1,n:6,p:60,k:3,par:120,r:.3,pw:1},{c:5,h:4,f:.62,y:3,l:2,n:8,p:55,k:4,par:145,r:.3,pw:1},{c:5,h:4,f:.65,y:3,l:2,n:9,p:52,k:4,par:160,r:.35,pw:1},
       {c:6,h:4,f:.64,y:4,l:2,n:10,p:50,k:5,par:180,r:.35,pw:1,w:.8},{c:6,h:5,f:.6,y:4,l:2,n:11,p:48,k:5,par:195,r:.4,pw:2},{c:7,h:5,f:.62,y:4,l:3,n:14,p:46,k:5,par:225,r:.4,pw:2,w:1}]},
  {id:'chem',name:'Chem Terminal',tag:'Night shift with hazmat. Clang a hazmat box and you lose a heart.',need:42,
   th:{night:1,sky:['#0b1530','#26365f'],sea:['#16395a','#081a2d'],quay:'#757a83',quay2:'#50555d',crane:'#ffd23f',hull:'#1d2a36',city:'#1a2747'},rules:['hazmat','night'],
   lv:[{c:4,h:4,f:.6,y:3,l:1,n:6,p:60,k:4,par:125,z:.2},{c:5,h:4,f:.62,y:3,l:2,n:8,p:55,k:4,par:150,z:.22},{c:5,h:4,f:.65,y:3,l:2,n:9,p:52,k:5,par:165,z:.25,r:.15,pw:1},
       {c:6,h:4,f:.64,y:4,l:2,n:10,p:50,k:5,par:185,z:.25,w:1},{c:6,h:5,f:.6,y:4,l:2,n:12,p:48,k:5,par:205,z:.28,r:.15,pw:1,w:1.2},{c:7,h:5,f:.62,y:4,l:3,n:15,p:45,k:6,par:240,z:.3,r:.2,pw:2,w:1.4}]}
];
var UPG={
  motor:{name:'Trolley motor',desc:'The crane slides faster.',ic:'⚡'},
  hoist:{name:'Hoist winch',desc:'Lowers and lifts faster.',ic:'⛓'},
  damper:{name:'Anti-sway damper',desc:'Swinging loads settle quicker.',ic:'〰'},
  spreader:{name:'Wide spreader',desc:'More forgiving grabs and landings.',ic:'⬌'},
  radio:{name:'Gate radio',desc:'Drivers wait 8% longer per level.',ic:'📻'}
};
var UPG_ORDER=['motor','hoist','damper','spreader','radio'],UPG_COST=[40,90,160,260,400];
function U(k){return (G&&G.up&&G.up[k])||0;}

/* ================= SAVE ================= */
var G=null,SAVEKEY='harbor-rush-v3';
function freshG(){return {v:3,stars:{},best:{},coins:0,up:{},endless:0,tut:0,mute:false,plays:0,total:0};}
function load(){try{var s=JSON.parse(localStorage.getItem(SAVEKEY)||'null');if(s&&s.v===3){s.stars=s.stars||{};s.best=s.best||{};s.up=s.up||{};return s;}}catch(e){}return null;}
function save(){if(!G)return;try{localStorage.setItem(SAVEKEY,JSON.stringify(G));}catch(e){}if(window.LZ_GAME&&window.LZ)try{LZ.save(LZ_GAME);}catch(e){}}
function starsTotal(){var t=0;for(var k in G.stars)t+=G.stars[k];return t;}
function portStars(pi){var t=0;for(var i=0;i<6;i++)t+=G.stars[pi+'-'+i]||0;return t;}
function portOpen(pi){return starsTotal()>=PORTS[pi].need;}
function lvOpen(pi,li){return portOpen(pi)&&(li===0||G.stars[pi+'-'+(li-1)]>0);}
function endlessOpen(){return (G.stars['0-5']||0)>0;}

/* ================= ARCADE ================= */
var LZR=0.04,LZM=1;
function lzBoot(){return new Promise(function(res){if(!window.LZ_GAME)return res();var done=false,fin=function(){if(!done){done=true;res();}};
  var go=function(){LZ.boot(LZ_GAME,{localKey:SAVEKEY,major:3,minor:0,progressOf:function(d){try{var g=JSON.parse(d);var t=0;for(var k in g.stars)t+=g.stars[k];return t*1000+(g.total||0)/100;}catch(e){return 0;}}}).then(function(){
    Promise.all([LZ.gameInfo(LZ_GAME).then(function(g){LZR=g.ratio||LZR;window.LZ_EA=!!(g.released&&LZ.today&&LZ.today()<g.released);}),LZ.multiplier?LZ.multiplier(LZ_GAME).then(function(m){LZM=m||1;}):0]).then(fin,fin);},fin);};
  if(window.LZ)go();else window.addEventListener('lz-ready',go,{once:true});setTimeout(fin,3500);});}
