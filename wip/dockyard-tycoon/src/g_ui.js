
/* ================= SOUND ================= */
var ac=null;
function audioOn(){if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ac=null;}}if(ac&&ac.state==='suspended')ac.resume();startMusic();}
function tone(f,d,type,v,when,f2){
  if(!G||G.mute||!ac)return;var t=ac.currentTime+(when||0),o=ac.createOscillator(),g=ac.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.06,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);
}
var sfx={
  bell:function(){tone(1318,.5,'sine',.035);tone(1760,.6,'sine',.025,.09);},
  load:function(){tone(300,.06,'square',.025);tone(180,.12,'sine',.05,.03);},
  pick:function(){tone(700,.07,'triangle',.06);},
  sel:function(){tone(880,.05,'sine',.05);},
  ding:function(){tone(1046,.12,'sine',.06);tone(1396,.22,'sine',.05,.1);},
  serve:function(){tone(784,.08,'triangle',.06);tone(1046,.12,'triangle',.05,.06);},
  cash:function(){tone(1568,.07,'triangle',.06);tone(2093,.18,'triangle',.06,.07);tone(2637,.22,'sine',.03,.14);},
  bad:function(){tone(330,.16,'square',.035);tone(220,.3,'square',.035,.14);},
  burn:function(){tone(180,.35,'sawtooth',.035,0,90);},
  pop:function(){tone(520,.07,'sine',.05,0,900);},
  nope:function(){tone(200,.1,'square',.03);},
  bin:function(){tone(160,.12,'square',.04);},
  gull:function(){tone(1400,.18,'sawtooth',.03,0,900);tone(1300,.2,'sawtooth',.03,.16,800);},
  buy:function(){tone(523,.08,'triangle',.07);tone(784,.16,'triangle',.07,.08);},
  horn:function(){tone(110,.9,'sawtooth',.03,0,104);tone(165,.9,'sawtooth',.018,0,156);},
  horn2:function(){tone(392,.12,'square',.022);tone(392,.16,'square',.022,.16);},
  honk:function(){tone(330,.18,'square',.03);tone(311,.3,'square',.03,.2);},
  train:function(){tone(587,.5,'triangle',.03);tone(740,.5,'triangle',.025,.02);tone(880,.6,'triangle',.02,.04);},
  clunk:function(){tone(140,.12,'square',.04);tone(90,.18,'sine',.06,.04);},
  lvl:function(){[523,659,784,1046].forEach(function(f,i){tone(f,.2,'triangle',.06,i*.09);});}
};
var MUS={g:null,lp:null,next:0,step:0,timer:0};
var CHORDS=[[53,57,60,64],[50,53,57,60],[55,58,62,65],[48,52,55,58]],SCALE=[60,62,65,67,69,72,74,77];
function mtof(n){return 440*Math.pow(2,(n-69)/12);}
function mnote(f,t,d,type,v,dest){var o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.05);}
function startMusic(){if(!ac||MUS.g)return;MUS.g=ac.createGain();MUS.g.gain.value=0;MUS.lp=ac.createBiquadFilter();MUS.lp.type='lowpass';MUS.lp.frequency.value=2000;MUS.lp.connect(MUS.g);MUS.g.connect(ac.destination);MUS.next=ac.currentTime+.1;
  MUS.timer=setInterval(function(){if(!ac)return;var beat=60/88/2;while(MUS.next<ac.currentTime+.4){var t=MUS.next,st=MUS.step,ch=CHORDS[Math.floor(st/8)%4],pos=st%8;
    if(pos===0)ch.forEach(function(n){mnote(mtof(n),t,beat*7.5,'triangle',.018,MUS.lp);});if(pos===0||pos===4)mnote(mtof(ch[0]-24),t,beat*3,'sine',.06,MUS.g);
    if(Math.random()<.3)mnote(mtof(pick(SCALE)),t+(Math.random()<.5?0:beat*.5),beat*2.5,'sine',.02,MUS.lp);MUS.next+=beat;MUS.step++;}},120);syncMusic();}
function syncMusic(){if(MUS.g&&ac)MUS.g.gain.setTargetAtTime(G&&G.music&&!G.mute?(paused?.4:1):0,ac.currentTime,.3);}

/* ================= FEEDBACK ================= */
var tEl=$('#toast'),tT;
function toast(msg,kind){tEl.textContent=msg;tEl.className='';void tEl.offsetWidth;tEl.className='show '+(kind||'');clearTimeout(tT);tT=setTimeout(function(){tEl.className='';},1800);}
var bnEl=$('#banner'),bnT,bnQ=[];
function banner(big,small,kind){bnEl.className='';void bnEl.offsetWidth;bnEl.innerHTML='<b>'+esc(big)+'</b>'+(small?'<small>'+esc(small)+'</small>':'');bnEl.className='show '+(kind||'');clearTimeout(bnT);bnT=setTimeout(function(){bnEl.className='';},2400);}
var tkEl=$('#ticker'),tkT;
function showNews(text,kind){tkEl.innerHTML='<div class="news '+(kind||'')+'">'+esc(text)+'</div>';clearTimeout(tkT);tkT=setTimeout(function(){var n=tkEl.firstChild;if(n)n.className+=' out';},4200);}
var shakeAmt=0;function shakeCam(a){shakeAmt=Math.max(shakeAmt,a);}
function tutNote(){}

/* ================= HUD ================= */
var hudC={},STAR='<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/>';
function stars(r){var h='<span class="stars">';for(var i=0;i<5;i++){var f=clamp(r-i,0,1)*100;h+='<span class="star"><svg class="s0" viewBox="0 0 24 24">'+STAR+'</svg><span class="fw" style="width:'+f.toFixed(0)+'%"><svg class="s1" viewBox="0 0 24 24">'+STAR+'</svg></span></span>';}return h+'</span>';}
function clockStr(f){var h=7+12*clamp(f,0,1),hh=Math.floor(h),mm=Math.floor((h-hh)*12)*5,ap=hh>=12?'PM':'AM',h12=hh>12?hh-12:hh;return h12+':'+('0'+mm).slice(-2)+' '+ap;}
function setText(id,v){if(hudC[id]!==v){var e=$('#'+id);if(e)e.textContent=v;hudC[id]=v;}}
function setHTML(el,k,v){if(hudC[k]!==v){el.innerHTML=v;hudC[k]=v;}}
var frameNo=0;
function uiReset(){hudC={};clearTags();}
function renderHud(){
  if(!G)return;var loc=curLoc();
  setText('cash',fmt(G.cash));
  if(frameNo%20===0){var r=totalRate(),rt=Math.abs(r)<.005?' ':(r>0?'+':'')+fmt(r)+'/min elsewhere';var el=$('#rate');if(hudC.rate!==rt){el.textContent=rt;el.className=r>0?'pos':r<0?'neg':'';hudC.rate=rt;}}
  setText('dayl',SH?'Day '+SH.s.day:'Day '+(loc.days+1));
  var f=SH?SH.t/SH.len:0;setText('clock',SH?(SH.phase==='open'?clockStr(f):SH.phase==='closing'?'Closing':''):'');
  $('#dbar i').style.transform='scaleX('+clamp(f,0,1).toFixed(3)+')';var cl=!!(SH&&SH.phase!=='open');if(hudC.cl!==cl){$('#dbar').classList.toggle('close',cl);hudC.cl=cl;}
  if(SH){var rev=SH.s.sales+SH.s.tips,gt='Goal '+fmtR(rev)+' / '+fmtR(SH.s.goal);setText('goal',gt);var ok=rev>=SH.s.goal;if(hudC.gok!==ok){$('#goal').classList.toggle('ok',ok);hudC.gok=ok;}}
  var pv=SH&&SH.s?(SH.s.pts||0):0;setText('ptsn',pv.toLocaleString());
  var cm=SH&&SH.streak>=2?'x'+comboMult().toFixed(1)+' combo':'Best '+(G.best||0).toLocaleString();setText('ptsc',cm);var hot=!!(SH&&SH.streak>=2);if(hudC.hot!==hot){$('#ptsc').classList.toggle('hot',hot);hudC.hot=hot;}
  setText('lvln',String(G.lvl));var xf=clamp(G.xp/xpNeed(G.lvl),0,1),off=(132*(1-xf)).toFixed(1);if(hudC.xo!==off){$('#xpring').setAttribute('stroke-dashoffset',off);hudC.xo=off;}
  if(frameNo%30===0){var can=shopRows(loc,'equip').concat(shopRows(loc,'staff')).some(function(r){return r.cost&&!r.dis&&G.cash>=r.cost;});if(hudC.can!==can){$('#bShop').classList.toggle('glow',can);hudC.can=can;}}
  if(frameNo%6===0){
    var h='<span class="chip mpts">'+(SH&&SH.s?(SH.s.pts||0):0).toLocaleString()+' pts</span><span class="chip">'+esc(loc.name)+' '+stars(loc.rep)+'</span>';
    if(loc.comp){var sh=share(loc);h+='<span class="chip">vs '+esc(loc.comp.name)+' <span class="share"><i style="width:'+(sh*100).toFixed(0)+'%"></i></span> '+(sh*100).toFixed(0)+'%</span>';}
    if(SH&&SH.streak>=2)h+='<span class="chip gold">Combo '+SH.streak+' · pts ×'+comboMult().toFixed(1)+' · tips ×'+streakMult().toFixed(2)+'</span>';
    if(SH&&SH.phase!=='done'){var qn=SH.queue.length;h+='<span class="chip'+(qn>=6?' hot':'')+'">Crane queue '+qn+'/6</span>';}
    if(SH&&SH.heat)h+='<span class="chip hot">Heatwave</span>';
    if(SH&&SH.boost>1.2)h+='<span class="chip hot">Rush</span>';else if(SH&&SH.boost<.8)h+='<span class="chip cool">Quiet spell</span>';
    var mk=mktAdd(loc);if(mk>0)h+='<span class="chip good">Marketing +'+Math.round(mk*100)+'%</span>';
    if(hxMult(loc)<1)h+='<span class="chip hot">Price war</span>';
    setHTML($('#sub'),'sub',h);
  }
  renderStaff();
}
function renderStaff(){
  var el=$('#staffbar');if(!SH||SH.phase==='done'){setHTML(el,'staff','');return;}
  var key=SH.bots.map(function(b){return b.name+b.role;}).join(',');
  if(hudC.staff!==key){el.innerHTML=SH.bots.map(function(b,i){return '<div class="sc"><span class="av" style="background:'+hexCss(ROLES[b.role].col)+'">'+b.name[0]+'</span><span class="t"><b>'+esc(b.name)+'</b><small data-i="'+i+'">'+ROLES[b.role].name+'</small><span class="pb"><i></i></span></span></div>';}).join('');hudC.staff=key;}
  var smalls=el.querySelectorAll('small'),bars=el.querySelectorAll('.pb i');
  SH.bots.forEach(function(b,i){if(smalls[i]&&smalls[i]._t!==b.act){smalls[i].textContent=b.act;smalls[i]._t=b.act;}if(bars[i])bars[i].style.transform='scaleX('+(b.task?clamp(b.t/b.dur,0,1):0).toFixed(2)+')';});
}

/* ================= WORLD TAGS ================= */
var ovEl=$('#ov'),tagMap=new Map(),tmpP=new T.Vector3();
function tagFor(key){var t=tagMap.get(key);if(!t){var el=document.createElement('div');el.className='tag';var inn=document.createElement('div');inn.className='in';el.appendChild(inn);ovEl.appendChild(el);t={el:el,in:inn,k:null,hid:false};tagMap.set(key,t);}t.seen=frameNo;return t;}
function clearTags(){tagMap.forEach(function(t){t.el.remove();});tagMap.clear();}
function proj(p){tmpP.copy(p).project(camera);return {x:(tmpP.x*.5+.5)*W,y:(-tmpP.y*.5+.5)*H,ok:tmpP.z<1&&tmpP.z>-1};}
function place(t,p){var s=proj(p);if(!s.ok){if(!t.hid){t.el.style.display='none';t.hid=true;}return;}if(t.hid){t.el.style.display='';t.hid=false;}
  var x=clamp(s.x,50,W-50);t.el.style.transform='translate('+x.toFixed(1)+'px,'+s.y.toFixed(1)+'px)';}
function setTag(t,key,html){if(t.k!==key){t.k=key;t.in.innerHTML=html;t.bar=t.in.querySelector('.pat i');t.patEl=t.in.querySelector('.pat');t.ringF=t.in.querySelector('.f');}}
function ringSvg(cls){return '<svg class="ring '+(cls||'')+'" viewBox="0 0 40 40"><circle class="b" cx="20" cy="20" r="16"></circle><circle class="f" cx="20" cy="20" r="12" stroke-dasharray="75.4" stroke-dashoffset="75.4"></circle></svg>';}
function setRing(t,k){if(t.ringF)t.ringF.setAttribute('stroke-dashoffset',(75.4*(1-clamp(k,0,1))).toFixed(1));}
var POPS=[];
function popWorld(pos,html,cls){var el=document.createElement('div');el.className='tag';el.innerHTML='<div class="in"><div class="pop '+(cls||'')+'">'+html+'</div></div>';ovEl.appendChild(el);POPS.push({el:el,pos:pos.clone(),t:1.4,hid:false});}
function coinsFrom(pos,n){var s=proj(pos),tgt=$('#cash').getBoundingClientRect(),tx=tgt.left+tgt.width/2,ty=tgt.top+tgt.height/2;
  for(var i=0;i<n;i++)(function(i){var c=document.createElement('div');c.className='coin';var sx=s.x+rnd(-24,24),sy=s.y+rnd(-14,14);c.style.transform='translate('+sx+'px,'+sy+'px)';document.body.appendChild(c);
    setTimeout(function(){c.style.transform='translate('+tx+'px,'+ty+'px) scale(.6)';c.style.opacity='0';},40+i*70);setTimeout(function(){c.remove();var cp=$('.cash');if(cp){cp.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:180});}},760+i*70);})(i);}
function itemsHtml(c){return c.items.map(function(x){return '<span class="it'+(x.done?' done':x.inc?' inc':'')+'"><img alt="" src="'+iconBox(x.t)+'"></span>';}).join('');}
var TUT={sel:0,queue:0,serve:0};
function tutNote(k){TUT[k]=(TUT[k]||0)+1;}
function shipTopW(){var r=null;SH.ships.forEach(function(sh){if(r||sh.st!=='dock')return;sh.bays.forEach(function(b){if(!r&&b.length&&!b[b.length-1].res)r=boxWorld(b[b.length-1]).add(V3(0,.75,0));});});return r;}
function tutHint(){
  if(!SH||SH.phase!=='open'||G.stats.served>=4||G.locs.length>1||SH.loc.days>1)return null;
  var w=SH.cust.filter(function(c){return c.state==='wait'&&!c.paid;});
  if(SH.sel){var b=SH.sel.b,c=w.filter(function(c){return wantIndex(c,b)>=0&&deliverable(b);})[0];
    if(c)return {t:'Tap the truck to load it',p:custTop(c).add(V3(0,.9,0))};
    var col=SH.cols.filter(function(cl){return canPlace(b,cl)==='';})[0];if(col)return {t:'Tap a yard column to drop it',p:V3(col.x,colTopY(col)+.7,col.z)};return null;}
  if(SH.queue.length)return null;
  for(var i=0;i<w.length;i++){if(findMatch(w[i]))return {t:'Tap the truck: the crane grabs a match',p:custTop(w[i]).add(V3(0,.9,0))};}
  var p=shipTopW();if(p)return {t:TUT.queue?'Dig: move the top containers to the yard':'Tap the ship to pick up a container',p:p};
  return null;
}
function renderTags(dt){
  frameNo++;
  if(SH){
    SH.cust.forEach(function(c){
      var t=tagFor('c'+c.id),key='',html='';
      if(c.say){key='s'+c.say.text;html='<div class="say '+c.say.kind+'">'+esc(c.say.text)+'</div>';}
      else if(c.state==='wait'){var f=c.pat/c.max,low=f<.3;key='b'+c.items.map(function(x){return x.done?1:0;}).join('')+(c.board?'B':'')+(low?'L':'');
        var tx=c.courier?'<span class="tx del">FREIGHT TRAIN</span>':c.vip?'<span class="tx">SHIPPING MAGNATE</span>':c.insp?'<span class="tx insp">INSPECTOR</span>':c.board?'<span class="tx board">CONVOY</span>':'';
        html='<div class="bub'+(low?' low':'')+'">'+tx+'<div class="its">'+itemsHtml(c)+'</div><div class="pat"><i></i></div></div>';}
      setTag(t,key,html);
      if(t.bar){var fr=clamp(c.pat/c.max,0,1);t.bar.style.transform='scaleX('+fr.toFixed(3)+')';var cl='pat'+(fr<.3?' low':fr<.6?' mid':'');if(t.patEl.className!==cl)t.patEl.className=cl;}
      if(key)place(t,custTop(c).add(V3(0,.15,0)));else if(!t.hid){t.el.style.display='none';t.hid=true;}
    });
    SH.ships.forEach(function(sh,si){var ts=tagFor('sh'+si),sk='',shh='',n=shipCount(sh);
      if(sh.st==='dock'){var lf=clamp(sh.dep/sh.depMax,0,1),low=lf<.25;sk='d'+n+(low?'L':'')+(sh.mega?'M':'');shh='<div class="shipt'+(low?' low':'')+(sh.mega?' mega':'')+'"><b>'+(n>0?n+' to unload':'Empty')+'</b><span class="pat"><i></i></span></div>';}
      else if(sh.st==='in'&&sh.t>=0){sk='in';shh='<div class="shipt dim"><b>Ship mooring…</b></div>';}
      else if(sh.st==='away'&&SH.phase==='open'){sk='aw'+(SH.ice>0?'i':'');shh='<div class="shipt dim"><b>'+(SH.ice>0?'Iced in':'Next ship soon')+'</b></div>';}
      setTag(ts,sk,shh);if(sh.st==='dock'&&ts.bar){ts.bar.style.transform='scaleX('+clamp(sh.dep/sh.depMax,0,1).toFixed(3)+')';}
      if(sk)place(ts,V3(SH.L.berths[sh.bi].x,.25,SH.L.berths[sh.bi].z+.75));else if(!ts.hid){ts.el.style.display='none';ts.hid=true;}});
    if(SH.phase!=='done')SH.cols.forEach(function(c,ci){var t=tagFor('col'+ci),key='',html='',k=0,top=c.stack[c.stack.length-1],y=colTopY(c)+.55;
      if(c.kind==='customs'&&top&&top.hold&&!top.cleared){key='cu';html=ringSvg();k=c.insp/5;}
      else if(top&&top.spoiled){key='sp';html='<div class="cnt bad">Spoiled · scrap it</div>';}
      else{var worst=null;c.stack.forEach(function(b){if(CT[b.t].reefer&&!b.spoiled&&c.kind!=='power'&&b.spoil>.35&&(!worst||b.spoil>worst.spoil))worst=b;});
        if(worst){key='rf'+(worst.spoil>.7?'w':'');html=ringSvg('warn');k=1-worst.spoil;}}
      setTag(t,key,html);setRing(t,k);if(key)place(t,V3(c.x,y,c.z));else if(!t.hid){t.el.style.display='none';t.hid=true;}});
    SH.bots.forEach(function(b,i){var t=tagFor('bot'+i);if(!b.task){if(!t.hid){t.el.style.display='none';t.hid=true;}t.k=null;return;}
      setTag(t,'w'+b.name,'<div class="bot work"><span class="av" style="background:'+hexCss(ROLES[b.role].col)+'">'+b.name[0]+'</span></div>');place(t,V3(b.task.col.x+.25,colTopY(b.task.col)+.4,b.task.col.z));});
    if(SH.pend.length){var tp=tagFor('pend');setTag(tp,'p'+SH.pend.length,'<div class="wait">+'+SH.pend.length+' waiting at the gate</div>');place(tp,V3(SH.L.rx-1.2,1.2,SH.L.roadZ));}
    if(SH.gull&&SH.gull.phase==='in'){var tg=tagFor('gull');setTag(tg,'g','<div class="cnt bad">Tap!</div>');place(tg,SH.gull.m.g.position.clone().add(V3(0,.4,0)));}
    var hn=tutHint();if(hn){var th=tagFor('hint');setTag(th,'h'+hn.t,'<div class="hint">'+esc(hn.t)+'</div>');place(th,hn.p);}
  }
  tagMap.forEach(function(t,k){if(t.seen!==frameNo){t.el.remove();tagMap.delete(k);}});
  for(var i=POPS.length-1;i>=0;i--){var p=POPS[i];p.t-=dt;if(p.t<=0){p.el.remove();POPS.splice(i,1);continue;}place(p,p.pos);}
}
