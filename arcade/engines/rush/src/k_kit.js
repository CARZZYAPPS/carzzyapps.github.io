
/* ================= RUSH KIT: run the engine from a creator's data pack ================= */
var KIT={title:'Rush'},KIT_ON=true;
function kcol(c,d){if(typeof c==='number')return c;if(typeof c==='string'&&/^#?[0-9a-f]{6}$/i.test(c))return parseInt(c.replace('#',''),16);return d;}
function applyPack(P){
  KIT=P;var k=P.kit||{};
  SAVEKEY='rushkit-'+String(P.kitId||P.pubId||'test').replace(/[^a-z0-9]/gi,'').slice(0,40);
  if(k.dayLen)DAYLEN=Math.max(60,Math.min(300,+k.dayLen||150));
  var I=IND.coffee;
  // products (bases)
  Object.keys(k.bases||{}).forEach(function(id){var b=k.bases[id];BASES[id]={name:b.name,vessel:b.vessel||'cup',liq:kcol(b.liq,0x6b3a1f),mug:kcol(b.mug,0xe9584a),food:b.food||undefined,scoop:kcol(b.scoop,0xfff1d6),lv:b.lv||undefined};
    if(!/^(plate)$/.test(BASES[id].vessel))delete BASES[id].food;});
  // toppings
  Object.keys(k.toppings||{}).forEach(function(id){var t=k.toppings[id];TOPS[id]={name:t.name,col:kcol(t.col,0xffffff),vis:t.vis||'dollop',box:t.box||'tub'};if(VIS_ORDER.indexOf(id)<0)VIS_ORDER.push(id);});
  // machines: each one reuses an engine machine model (archetype) with the creator's settings
  var sts=[];
  (k.stations||[]).forEach(function(s){var base=STN[s.model];if(!base||s.model==='rack'||sts.indexOf(s.model)>=0)return;
    var o=Object.assign({},base,{name:s.name||base.name,makes:s.makes,time:+s.time||base.time,lvl:+s.lvl||1,cost:+s.cost||0,desc:s.desc||base.desc});
    if(base.kind==='cooker'){o.burn=+s.burn||base.burn;o.slots=s.slots?[+s.slots,+s.slots+1,+s.slots+2]:base.slots;}
    else{o.serv=s.serv?[+s.serv,+s.serv+1,+s.serv+2]:base.serv;o.stale=+s.stale||base.stale;o.role=TOPS[s.makes]?'comp':'base';}
    STN[s.model]=o;sts.push(s.model);});
  var compMade={};sts.forEach(function(m){if(STN[m].role==='comp')compMade[STN[m].makes]=1;});
  sts.push('rack');
  I.name=k.name||'Shop';I.stations=sts;
  I.start=sts.filter(function(m){return m!=='rack'&&STN[m].lvl<=1;});if(!I.start.length)I.start=[sts[0]];I.start=I.start.slice(0,3);
  I.tops={};Object.keys(k.toppings||{}).forEach(function(id){if(!compMade[id])I.tops[id]={lvl:+k.toppings[id].lvl||1,cost:+k.toppings[id].cost||60};});
  var th=k.theme||{};I.theme=Object.assign({},I.theme,{wall:kcol(th.wall,I.theme.wall),wall2:kcol(th.wall2,I.theme.wall2),accent:kcol(th.accent,I.theme.accent),counter:kcol(th.counter,I.theme.counter),top:kcol(th.top,I.theme.top),trim:kcol(th.trim,I.theme.trim),flA:kcol(th.flA,I.theme.flA),flB:kcol(th.flB,I.theme.flB),stn:kcol(th.stn,I.theme.stn)});
  I.RM={};I.R=(k.recipes||[]).filter(function(r){return BASES[r.base];}).map(function(r){var o={base:r.base,comps:(r.comps||[]).filter(function(c){return TOPS[c];}).slice().sort(),name:r.name,price:+r.price||3,w:+r.w||2,tags:(r.tags||'').split(' ').filter(Boolean),ind:'coffee'};o.key=rkey(o.base,o.comps);I.RM[o.key]=o;return o;});
  if(I.R.length)I.hero=[I.R[I.R.length-1].base].concat(I.R[I.R.length-1].comps).join('+');
  IND_ORDER.length=0;IND_ORDER.push('coffee');
  if(k.districts&&k.districts.length){DIST0.length=0;k.districts.forEach(function(d,i){DIST0.push({id:i?'k'+i:'main',name:d.name||('District '+(i+1)),lvl:i?Math.max(2,+d.lvl||i*2+2):1,cost:i?Math.max(100,+d.cost||1500*i):0,demand:+d.demand||1,pat:+d.pat||1,tips:+d.tips||1,price:+d.price||1,am:+d.am||1,lunch:+d.lunch||1,eve:+d.eve||.5,big:d.big?1:0,pref:d.pref||{},ev:(d.ev||[]).slice(),win:d.win||'street',twist:d.twist||''});});}
  document.title=(P.title||'Rush game')+' | Lazer Arcade Community';
}
function kitScore(total){try{parent.postMessage({type:'rush-score',score:total},'*');}catch(e){}}
function kitStartTops(ind){var o={},T_=IND[ind]&&IND[ind].tops||{},n=0;Object.keys(T_).forEach(function(t){if(n<5&&T_[t].lvl<=1&&!T_[t].cost){o[t]=1;n++;}});return o;}
