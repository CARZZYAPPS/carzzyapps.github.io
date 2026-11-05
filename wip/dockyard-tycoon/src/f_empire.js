
/* ================= EMPIRE ================= */
var G=null,SAVEKEY='harbor-rush-v2',LVQ=[];
function newLoc(city,did,ind){
  var D=district(city,did);
  var loc={id:G.nid++,city:city,did:did,ind:ind,name:D.name,u:{},staff:{barista:0,server:0,manager:0,finisher:0,host:0},decor:0,price:0,rep:3,days:0,comp:null,mk:[],hx:[],cd:{},earned:0};
  if(city>0)loc.comp=newRival(loc);
  return loc;
}
function freshG(){G={v:4,cash:60,xp:0,lvl:1,fame:0,day:1,cities:1,act:0,nid:1,locs:[],hq:{},hold:{},news:[],ts:now(),stats:{earned:0,served:0,passive:0},hostT:150,tvcd:0,mute:false,music:true,rebuild:false,started:false};G.locs.push(newLoc(0,'main','container'));return G;}
function load(){try{var s=JSON.parse(localStorage.getItem(SAVEKEY)||'null');if(s&&s.v===4&&s.locs&&s.locs.length){
  s.hq=s.hq||{};s.hold=s.hold||{};s.news=s.news||[];s.stats=Object.assign({earned:0,served:0,passive:0},s.stats||{});
  s.locs.forEach(function(l){l.mk=l.mk||[];l.hx=l.hx||[];l.cd=l.cd||{};l.u=l.u||{};l.staff=Object.assign({barista:0,server:0,manager:0,finisher:0,host:0},l.staff||{});});
  if(s.act>=s.locs.length)s.act=0;return s;}}catch(e){}return null;}
function save(){if(!G)return;G.ts=now();try{localStorage.setItem(SAVEKEY,JSON.stringify(G));}catch(e){}if(window.LZ_GAME&&window.LZ)LZ.save(LZ_GAME);}
var LZR=0.04,LZM=1;
function lzBoot(){return new Promise(function(res){if(!window.LZ_GAME)return res();var done=false,fin=function(){if(!done){done=true;res();}};
  var go=function(){LZ.boot(LZ_GAME,{localKey:SAVEKEY,major:2,minor:0,progressOf:function(d){try{var g=JSON.parse(d);return Math.round((g.stats&&g.stats.earned||0)+(g.day||0)*10);}catch(e){return 0;}}}).then(function(){Promise.all([LZ.gameInfo(LZ_GAME).then(function(g){LZR=g.ratio||LZR;window.LZ_EA=!!(g.released&&LZ.today&&LZ.today()<g.released);}),LZ.multiplier?LZ.multiplier(LZ_GAME).then(function(m){LZM=m||1;}):0]).then(fin,fin);},fin);};
  if(window.LZ)go();else window.addEventListener('lz-ready',go,{once:true});setTimeout(fin,3500);});}

/* ---------- economics ---------- */
function tierOf(loc){return distOf(loc).tier||0;}
function holdLv(k){return (G&&G.hold[k])||0;}
var IND_HOLD={container:'line',fish:'cold',bulk:'refinery',cruise:'resort'};
function holdPrice(ind){return 1+(ind==='container'?0:.03*holdLv(IND_HOLD[ind]));}
function costRate(loc){return Math.max(.08,.3*(loc.ind==='container'?1:1-.06*holdLv(IND_HOLD[loc.ind]))*(1-.04*holdLv('rail')));}
function lsz(loc){return Math.max(1,Math.min(4,U(loc,'gates')-1));}
function priceMult(loc){return IND[loc.ind].pm*TM(tierOf(loc)).pm*PRICE_T[loc.price+1].m*(1+.04*(G.hq.quality||0))*holdPrice(loc.ind);}
function repMult(loc){return .55+.15*loc.rep;}
function famMult(){return 1+Math.min(1.5,G.fame/800);}
function loyMult(){return 1+.06*(G.hq.loyalty||0);}
function mktAdd(loc){var t=now(),a=0;loc.mk=loc.mk.filter(function(m){return m.until>t;});loc.mk.forEach(function(m){a+=m.add;});return a;}
function hxMult(loc){var t=now(),m=1;loc.hx=loc.hx.filter(function(h){return h.until>t;});loc.hx.forEach(function(h){m*=h.m;});return m;}
function priceDemand(loc){return Math.pow(PRICE_T[loc.price+1].dem,1/(distOf(loc).price||1));}
function attract(loc){return 40*(.6+.1*loc.rep)*famMult()*(1+mktAdd(loc))*loyMult()*(1+.04*loc.decor)*priceDemand(loc)*hxMult(loc);}
function share(loc){if(!loc.comp)return 1;var A=attract(loc);return .3+.7*A/(A+loc.comp.S);}
function demandMin(loc,active){var D=distOf(loc);return gatesDem(loc)*(active?1:1.35)*(D.demand||1)*repMult(loc)*share(loc)*(1+mktAdd(loc))*priceDemand(loc)*famMult()*loyMult()*(1+.03*loc.decor)*TM(D.tier).dm*hxMult(loc);}
function wageMin(loc){var s=0;ROLE_ORDER.forEach(function(r){s+=(loc.staff[r]||0)*ROLES[r].wage;});return s*IND[loc.ind].wm*TM(tierOf(loc)).pm;}
function rentMin(loc){return .35*lsz(loc)*lsz(loc)*IND[loc.ind].wm*TM(tierOf(loc)).pm*(distOf(loc).price||1)*Math.pow(.9,holdLv('realty'));}
function trainMult(){return Math.pow(.94,G.hq.training||0);}
function xpScale(loc){return Math.max(1,IND[loc.ind].pm*TM(tierOf(loc)).pm*.6);}
function locEcon(loc){
  var s=loc.staff,dem=demandMin(loc,false)*1.25,sp=Math.pow(1.12,U(loc,'speed'))*Math.pow(1.05,G.hq.grind||0)/trainMult();
  var open=s.manager>0&&s.barista>0,cap=0,bott='';
  var Cr=s.barista*16*sp*Math.pow(U(loc,'cranes'),.7),Dr=s.server*9/trainMult()+Cr*.35;
  if(open){cap=Math.min(Cr,Dr+Cr*.5)*(1+.1*(G.hq.autolab||0));bott=Cr<=Dr+Cr*.5?'crane operators':'straddle drivers';}
  else bott=!s.manager?'a harbor master':'a crane operator';
  var items=open?Math.min(dem,cap):0,price=avgVal(loc)*priceMult(loc)*1.1;
  var rev=items*price,cogs=rev*costRate(loc),wages=open?wageMin(loc):0,rent=open?rentMin(loc):0;
  return {open:open,dem:dem,cap:cap,items:items,rev:rev,cogs:cogs,wages:wages,rent:rent,net:rev-cogs-wages-rent,bott:open?(items<dem*.97?bott:''):bott,util:cap?dem/cap:0};
}
function totalRate(){var t=0;G.locs.forEach(function(l){if(SH&&SH.loc===l&&SH.phase!=='done')return;t+=locEcon(l).net;});return t+holdIncome();}

/* ---------- progression ---------- */
function xpNeed(l){return Math.round(110*Math.pow(1.3,l-1));}
function addXP(x){if(!(x>0))return;G.xp+=x;while(G.xp>=xpNeed(G.lvl)){G.xp-=xpNeed(G.lvl);G.lvl++;LVQ.push(G.lvl);onLevel(G.lvl);}}
function addFame(f){G.fame=Math.max(0,G.fame+f*(f>0?1+.15*(G.hq.ambassador||0):1));}
function repAdd(loc,d){loc.rep=clamp(loc.rep+d*(distOf(loc).rep||1),.5,5);}
function heroIcon(ik){return iconOf(IND[ik].hero);}
function unlocksAt(l){
  var u=[];
  IND_ORDER.forEach(function(ik){var I=IND[ik];if(I.lvl===l)u.push({t:'New industry: '+I.name,ic:heroIcon(ik)});
    I.cargo.forEach(function(t){if(CT[t].lvl===l&&CT[t].lvl>I.lvl)u.push({t:'New cargo at '+I.name.toLowerCase()+'s: '+CT[t].name,ic:iconOf(t)});});});
  UPG_ORDER.forEach(function(k){if(UPG[k].lvl===l&&l>1)u.push({t:'Upgrade: '+UPG[k].name,ic:iconUpg(k)});});
  ROLE_ORDER.forEach(function(r){if(ROLES[r].lvl===l)u.push({t:'Hire '+ROLES[r].name.toLowerCase()+'s',ic:''});});
  DIST0.forEach(function(d){if(d.lvl===l&&l>1)u.push({t:'New port: '+d.name,ic:distPic(d.win)});});
  HQ_ORDER.forEach(function(k){if(HQ[k].lvl===l)u.push({t:'HQ: '+HQ[k].name,ic:''});});
  HOLD_ORDER.forEach(function(k){if(HOLD[k].lvl===l)u.push({t:'Holding: '+HOLD[k].name,ic:''});});
  Object.keys(MKT).forEach(function(k){if(MKT[k].lvl===l)u.push({t:'Marketing: '+MKT[k].name,ic:''});});
  Object.keys(SAB).forEach(function(k){if(SAB[k].lvl===l)u.push({t:'Dirty trick: '+SAB[k].name,ic:''});});
  if(l===12)u.push({t:'Rival terminals start opening near yours',ic:''});
  if(l===20)u.push({t:'HQ: national TV campaigns',ic:''});
  for(var n=1;n<8;n++)if(cityReq(n).lvl===l)u.push({t:'Expansion to '+cityName(n)+' (own 4 terminals on the '+cityName(n-1)+' coast)',ic:''});
  return u;
}

/* ---------- rivals ---------- */
function newRival(loc){var tier=tierOf(loc);return {name:pick(RIVALS[loc.ind]),S:14+(G?G.lvl:1)*.7+tier*22,prev:0};}
function news(text,kind,loc){G.news.unshift({t:now(),text:text,kind:kind||''});if(G.news.length>40)G.news.length=40;showNews(text,kind);}
function compCheck(){
  var owned=G.locs.length;
  if(G.lvl>=12||owned>=3)G.locs.forEach(function(loc){if(!loc.comp&&Math.random()<.012*(1+owned*.15)){loc.comp=newRival(loc);loc.comp.prev=loc.comp.S;news(loc.comp.name+' just opened a terminal across the bay from '+loc.name+'.','bad',loc);}});
  G.hostT-=5;if(G.hostT<=0){G.hostT=rnd(90,180);var c=G.locs.filter(function(l){return l.comp;});if(c.length)hostile(pick(c));}
}
function hostile(loc){
  var cn=loc.comp.name;
  if(Math.random()<.15*(G.hq.security||0)){news('Your security team stopped a dirty trick by '+cn+'.','good',loc);return;}
  var r=Math.random();
  if(r<.12){loc.comp.S=Math.max(5,loc.comp.S-20);news(cn+' got hit by a health scandal. Their shippers are looking for a new port.','good',loc);return;}
  if(r<.4){loc.hx.push({m:.72,until:now()+180000,k:'pricewar'});news(cn+' started a price war near '+loc.name+'. Fewer trucks for 3 minutes.','bad',loc);}
  else if(r<.6){repAdd(loc,-.3);news(cn+' paid for a wave of fake bad reviews of '+loc.name+'.','bad',loc);}
  else if(r<.8){var roles=ROLE_ORDER.filter(function(k){return k!=='manager'&&loc.staff[k]>0;});
    if(roles.length){var k=pick(roles);loc.staff[k]--;news(cn+' poached a '+ROLES[k].name.toLowerCase()+' from '+loc.name+'.','bad',loc);if(SH&&SH.loc===loc&&SH.phase!=='done')resetBots();}
    else{loc.comp.S+=12;news(cn+' expanded right next to '+loc.name+'.','bad',loc);}}
  else{loc.comp.S+=15;news(cn+' opened a bigger terminal near '+loc.name+'.','bad',loc);}
}
function resetBots(){SH.bots.forEach(function(b){if(b.task){b.task.b.res=false;if(b.task.c.items[b.task.j])b.task.c.items[b.task.j].inc=false;}});mkBots();}

/* ---------- actions ---------- */
function cmul(loc){return IND[loc.ind].cm*TM(tierOf(loc)).cm;}
function upCost(loc,k){var d=UPG[k];return Math.round(d.cost*Math.pow(d.g,U(loc,k)-d.base)*cmul(loc));}
function hireCost(loc,r){return Math.round(ROLES[r].cost*(1+.7*(loc.staff[r]||0))*IND[loc.ind].wm*TM(tierOf(loc)).cm);}
function decorCost(loc){return Math.round(150*Math.pow(2.3,loc.decor)*IND[loc.ind].wm*TM(tierOf(loc)).cm);}
function hqCost(k){return Math.round(HQ[k].cost*Math.pow(HQ[k].g,G.hq[k]||0));}
function holdCostOf(k){return Math.round(HOLD[k].cost*Math.pow(HOLD[k].g,G.hold[k]||0));}
function locCost(city,did,ind){var D=district(city,did);return Math.round(D.cost*(ind==='container'?1:1.5)*Math.pow(.95,holdLv('realty')));}
function holdIncome(){var s=0;HOLD_ORDER.forEach(function(k){var l=G.hold[k]||0;if(l)s+=HOLD[k].inc*l*Math.pow(1.25,l);});return s;}
function holdReq(k){var d=HOLD[k];if(G.lvl<d.lvl)return 'Level '+d.lvl;if(d.need.locs&&G.locs.length<d.need.locs)return 'Own '+d.need.locs+' terminals';
  if(d.need.ind){var n=G.locs.filter(function(l){return l.ind===d.need.ind;}).length;if(n<d.need.n)return 'Own '+d.need.n+' '+IND[d.need.ind].name.toLowerCase()+(d.need.n>1?'s':'');}return '';}
function mktCost(loc,k){return Math.round(MKT[k].cost*(1+.6*(lsz(loc)-1))*TM(tierOf(loc)).pm*IND[loc.ind].wm*Math.pow(.9,holdLv('adagency')));}
function sabCost(loc,k){return Math.round(SAB[k].cost*(1+.5*(lsz(loc)-1))*TM(tierOf(loc)).pm*IND[loc.ind].wm);}
function tvCost(){var t=0;G.locs.forEach(function(l){t+=Math.max(0,locEcon(l).rev);});return Math.max(4000,Math.round(t*10));}
function spend(c){if(G.cash<c)return false;G.cash-=c;return true;}
function inShiftAt(loc){return SH&&SH.loc===loc&&SH.phase!=='done';}

function act(kind,arg,loc){
  var c,r='ok';
  switch(kind){
    case 'up':var ud=UPG[arg];if(!ud)return 'bad';if(G.lvl<ud.lvl)return 'req';if(U(loc,arg)>=ud.max)return 'max';c=upCost(loc,arg);if(!spend(c))return 'cash';loc.u[arg]=U(loc,arg)+1;G.rebuild=true;break;
    case 'hire':if(!ROLES[arg])return 'bad';if(G.lvl<ROLES[arg].lvl)return 'req';if((loc.staff[arg]||0)>=staffCap(loc,arg))return 'max';c=hireCost(loc,arg);if(!spend(c))return 'cash';loc.staff[arg]=(loc.staff[arg]||0)+1;if(inShiftAt(loc))resetBots();break;
    case 'fire':if(!loc.staff[arg])return 'max';loc.staff[arg]--;if(inShiftAt(loc))resetBots();break;
    case 'decor':if(loc.decor>=5)return 'max';c=decorCost(loc);if(!spend(c))return 'cash';loc.decor++;G.rebuild=true;break;
    case 'price':loc.price=clamp(+arg,-1,2);G.rebuild=true;break;
    case 'mkt':var d=MKT[arg];if(!d)return 'bad';if(G.lvl<d.lvl)return 'req';if((loc.cd[arg]||0)>now())return 'cd';c=mktCost(loc,arg);if(!spend(c))return 'cash';
      loc.mk.push({add:d.add*(1+.1*holdLv('adagency')),until:now()+d.dur*1000,k:arg});loc.cd[arg]=now()+d.cd*1000;addFame(d.fame);if(d.rep)repAdd(loc,d.rep);news(d.name+' at '+loc.name+'. Trucks incoming.','good',loc);break;
    case 'sab':var s=SAB[arg];if(!s)return 'bad';if(G.lvl<s.lvl)return 'req';if(!loc.comp)return 'none';if((loc.cd['s_'+arg]||0)>now())return 'cd';if(s.req&&!holdLv(s.req))return 'req';c=sabCost(loc,arg);if(!spend(c))return 'cash';
      loc.cd['s_'+arg]=now()+180000;
      if(Math.random()<s.risk*Math.pow(.88,G.hq.legal||0)){var fine=Math.round(c*2*(1-.1*(G.hq.legal||0)));G.cash-=fine;repAdd(loc,-.5);G.fame*=.9;loc.comp.S+=10;news('Scandal! You got caught trying to '+s.name.toLowerCase()+'. Fined '+fmt(fine)+'.','bad',loc);r='caught';}
      else{loc.comp.S=Math.max(5,loc.comp.S-s.hit);if(s.gift&&loc.staff.barista<staffCap(loc,'barista')){loc.staff.barista++;if(inShiftAt(loc))resetBots();}news('It worked. '+loc.comp.name+' is reeling.','good',loc);}
      break;
    case 'hq':if(!HQ[arg])return 'bad';if(G.lvl<HQ[arg].lvl)return 'req';if((G.hq[arg]||0)>=HQ[arg].max)return 'max';c=hqCost(arg);if(!spend(c))return 'cash';G.hq[arg]=(G.hq[arg]||0)+1;break;
    case 'hold':if(!HOLD[arg])return 'bad';if((G.hold[arg]||0)>=HOLD[arg].max)return 'max';if(holdReq(arg))return 'req';c=holdCostOf(arg);if(!spend(c))return 'cash';G.hold[arg]=(G.hold[arg]||0)+1;news('Your '+HOLD[arg].name.toLowerCase()+' is now level '+G.hold[arg]+'.','good');break;
    case 'tv':if(G.lvl<20)return 'req';if((G.tvcd||0)>now())return 'cd';c=tvCost();if(!spend(c))return 'cash';G.locs.forEach(function(l){l.mk.push({add:.35,until:now()+600000,k:'tv'});});G.tvcd=now()+900000;addFame(20);news('Your national ad campaign is running on every coast.','good');break;
    case 'city':var n=+arg,q=cityReq(n),own=G.locs.filter(function(l){return l.city===n-1;}).length;if(G.lvl<q.lvl||own<q.own)return 'req';G.cities=Math.max(G.cities,n+1);news('You opened a regional office on the '+cityName(n)+' coast.','good');break;
    default:return 'bad';
  }
  save();return r;
}
function buyLoc(city,did,ind){
  var D=district(city,did);if(G.locs.some(function(l){return l.city===city&&l.did===did;}))return 'owned';
  if(G.lvl<D.lvl||G.lvl<IND[ind].lvl)return 'req';var c=locCost(city,did,ind);if(!spend(c))return 'cash';
  var loc=newLoc(city,did,ind);G.locs.push(loc);news('You opened a '+IND[ind].name.toLowerCase()+' at '+D.name+'.','good',loc);save();return G.locs.length-1;
}

/* ---------- ticking ---------- */
var EA={chk:0,save:0,trend:0};
function empTick(dt){
  if(!G)return;
  G.locs.forEach(function(loc){
    if(loc.comp){var tier=tierOf(loc),cap=30+25*tier+G.lvl*1.4+G.fame/40;loc.comp.S=clamp(loc.comp.S+dt/60*.55*(1+.5*tier)*(1+G.fame/1500)+(Math.random()-.5)*dt*.5,5,Math.max(cap,loc.comp.S));}
    if(inShiftAt(loc))return;
    var e=locEcon(loc),net=e.net/60*dt;G.cash+=net;loc.earned+=net;G.stats.passive+=net;if(SH&&SH.phase!=='done')SH.s.passive+=net;
    if(e.open){addFame(e.items/60*dt*.004);addXP(e.rev/60*dt*.18/xpScale(loc));
      var target=Math.min(5,3.2+.25*loc.decor+(loc.price<0?.2:0));if(e.util>1.25)repAdd(loc,-.0025*dt*(e.util-1.25)*2);else if(loc.rep<target)repAdd(loc,.0015*dt);}
  });
  var hi=holdIncome();if(hi){G.cash+=hi/60*dt;G.stats.passive+=hi/60*dt;if(SH&&SH.phase!=='done')SH.s.passive+=hi/60*dt;}
  EA.trend+=dt;if(EA.trend>30){EA.trend=0;G.locs.forEach(function(l){if(l.comp)l.comp.prev=l.comp.S;});}
  EA.chk+=dt;if(EA.chk>5){EA.chk=0;compCheck();}
  EA.save+=dt;if(EA.save>10){EA.save=0;save();}
}
function offlineGain(){
  var el=(now()-(G.ts||now()))/1000;if(el<90)return null;
  var capH=4+(G.hq.offline||0);el=Math.min(el,capH*3600);var eff=.3+.08*(G.hq.offline||0),net=holdIncome(),open=0;
  G.locs.forEach(function(l){var e=locEcon(l);net+=e.net;if(e.open)open++;});
  var gain=net/60*el*eff;G.cash+=gain;G.stats.passive+=gain;
  return {sec:el,gain:gain,eff:eff,open:open,capH:capH};
}
