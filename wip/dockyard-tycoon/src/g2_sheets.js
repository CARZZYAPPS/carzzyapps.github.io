
/* ================= SHEETS ================= */
var SHEET=null,MODAL=null,lastSum=null;
var DECOR_NEXT=['harbor flags','string lights over the gate','a painted logo on the yard','a neon HARBOR RUSH sign','a beacon on the gate and gold trim'];
function pauseFor(){paused=true;syncMusic();}
function unpause(){if(SH&&SH.phase!=='done'&&$('#sheet').hidden&&$('#modal').hidden){paused=false;syncMusic();}}
function btn(label,a,o){o=o||{};return '<button type="button" class="buy '+(o.cls||'')+'" data-a="'+a+'"'+(o.k?' data-k="'+o.k+'"':'')+(o.p!=null?' data-p="'+o.p+'"':'')+(o.l!=null?' data-l="'+o.l+'"':'')+(o.c!=null?' data-c="'+o.c+'"':'')+(o.dis?' disabled':'')+(o.poor?' data-poor':'')+'>'+label+'</button>';}
function costBtn(cost,kind,p,li,label){return btn((label?label+' · ':'')+fmtR(cost),'act',{k:kind,p:p,l:li,poor:G.cash<cost});}
function img(u){return u?'<img alt="" src="'+u+'">':'';}
function letterIc(l,col){return '<span style="background:'+hexCss(col)+';width:100%;height:100%;display:grid;place-items:center;font:700 24px var(--display);color:#fff">'+l+'</span>';}
function rowHtml(r){return '<div class="row'+(r.lock?' lock':'')+(r.on?' on':'')+'"><div class="ic">'+(r.ic||'')+'</div><div class="tx"><b>'+r.title+'</b>'+(r.desc?'<small>'+r.desc+'</small>':'')+(r.tags&&r.tags.length?'<div class="meta">'+r.tags.map(function(t){return '<span class="tg '+(t.c||'')+'">'+t.t+'</span>';}).join('')+'</div>':'')+'</div><div class="ac">'+(r.lock?'<span class="lk">'+r.lock+'</span>':(r.btns||[]).join(''))+'</div></div>';}
function mmss(ms){var s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}

function shopRows(loc,tab){
  var li=G.locs.indexOf(loc),I=IND[loc.ind],rows=[];
  if(tab==='equip'){
    UPG_ORDER.forEach(function(k){var d=UPG[k],v=U(loc,k),r={ic:img(iconUpg(k)),title:d.name+(d.max-d.base>1?' <span class="tg">'+(v-d.base)+'/'+(d.max-d.base)+'</span>':''),desc:d.desc};
      if(v>=d.max){r.on=true;r.btns=[btn(d.max-d.base>1?'Maxed':'Built','x',{dis:1})];}
      else if(G.lvl<d.lvl){r.lock='Level '+d.lvl;r.dis=1;}
      else{r.cost=upCost(loc,k);r.btns=[costBtn(r.cost,'up',k,li,v>d.base?'Upgrade':'Build')];if(v>d.base)r.on=true;}
      rows.push(r);});
  }
  if(tab==='staff'){
    ROLE_ORDER.forEach(function(rk){var d=ROLES[rk],n=loc.staff[rk]||0,cap=staffCap(loc,rk);
      var r={ic:letterIc(d.name[0],d.col),title:d.name+(n?' ×'+n:''),desc:d.desc,tags:[{t:'Wage '+fmt(d.wage*IND[loc.ind].wm*TM(tierOf(loc)).pm)+'/min each'},{t:n+' of '+cap+' hired',c:n?'g':''}]};
      if(cap<d.cap[4])r.tags.push({t:'More gate lanes allow more',c:'b'});
      if(G.lvl<d.lvl){r.lock='Level '+d.lvl;r.dis=1;}
      else{r.btns=[];if(n<cap){r.cost=hireCost(loc,rk);r.btns.push(costBtn(r.cost,'hire',rk,li,'Hire'));}else{r.btns.push(btn('Full','x',{dis:1}));r.dis=1;}if(n)r.btns.push(btn('Let go','act',{k:'fire',p:rk,l:li,cls:'sec'}));}
      rows.push(r);});
  }
  return rows;
}
function groupRows(rows){var h='',g=null;rows.forEach(function(r){var gg=r.grp||'';if(gg!==g){g=gg;if(gg==='tops')h+='<div class="grp">Tag board</div>';else if(gg==='mkt')h+='<div class="grp">Marketing</div>';else if(gg==='sab')h+='<div class="grp">Dirty tricks</div>';}h+=rowHtml(r);});return h;}

function shopBody(loc,tab){
  var li=G.locs.indexOf(loc),D=distOf(loc),h='',e=locEcon(loc);
  if(tab==='equip'){h+='<div class="kv"><span>Yard</span><span>'+U(loc,'cols')+' columns × '+U(loc,'height')+' high</span><span>Cargo types</span><span>'+cargoTypes(loc).map(function(t){return CT[t].name;}).join(', ')+'</span></div>';
    var lockd=IND[loc.ind].cargo.filter(function(t){return cargoTypes(loc).indexOf(t)<0;});if(lockd.length)h+='<p class="fine">Locked cargo: '+lockd.map(function(t){var C=CT[t];return C.name+' ('+(G.lvl<C.lvl?'level '+C.lvl:C.reefer?'needs reefer power':'needs a hazmat bay')+')';}).join(', ')+'.</p>';
    if(G.rebuild&&inShiftAt(loc))h+='<p class="fine">New yard layout is built at the start of your next day. Crane motors work right away.</p>';
    h+='<div class="grp">Yard & equipment</div>'+groupRows(shopRows(loc,'equip'));}
  if(tab==='staff'){
    h+='<div class="kv"><span>While you work elsewhere</span><span>'+(e.open?'Open':'Closed')+'</span>';
    if(e.open){h+='<span>Trucks that want in</span><span>'+e.dem.toFixed(1)+' loads/min</span><span>Your crew can handle</span><span>'+e.cap.toFixed(1)+' loads/min</span><span>Wages and rent</span><span class="neg">-'+fmt(e.wages+e.rent)+'/min</span><span class="tot">Profit</span><span class="tot '+(e.net>=0?'pos':'neg')+'">'+(e.net>=0?'+':'')+fmt(e.net)+'/min</span>';}
    h+='</div>';
    if(!e.open)h+='<p class="fine">To earn while you are away this terminal needs '+e.bott+'. It needs a harbor master and a crane operator at minimum.</p>';
    else if(e.bott)h+='<p class="fine">Bottleneck: '+e.bott+'. Trucks are leaving because your crew cannot keep up.</p>';
    else if(e.cap>e.dem*1.3)h+='<p class="fine">Your crew has spare time. Marketing or more gate lanes would bring more trucks.</p>';
    h+='<p class="fine">Your crew also works beside you during your shift.</p>'+groupRows(shopRows(loc,'staff'));}
  if(tab==='store'){
    var r2={ic:letterIc('D',IND[loc.ind].theme.accent),title:'Decor level '+loc.decor+' of 5',desc:'Each level: drivers wait 6% longer, pay 5% more and traffic +3%.'+(loc.decor<5?' Next: '+DECOR_NEXT[loc.decor]+'.':'')};
    r2.btns=loc.decor<5?[costBtn(decorCost(loc),'decor',0,li,'Decorate')]:[btn('Maxed','x',{dis:1})];
    h+='<div class="grp">Terminal</div>'+rowHtml(r2);
    h+='<div class="grp">Fees</div><div class="row"><div class="tx"><b>'+PRICE_T[loc.price+1].name+' fees</b><small>Higher fees earn more per load but bring fewer, less patient drivers. '+esc(D.name)+(D.price>=1.3?' happily pays premium fees.':D.price<.95?' is very price sensitive.':' is about average.')+'</small><div class="seg" style="margin-top:8px">'+
      PRICE_T.map(function(p,i){return '<button type="button" data-a="act" data-k="price" data-p="'+(i-1)+'" data-l="'+li+'" aria-pressed="'+(loc.price===i-1)+'">'+p.name+' ×'+p.m+'</button>';}).join('')+'</div></div></div>';
    h+='<div class="grp">About this terminal</div><div class="kv"><span>Port</span><span>'+esc(D.name)+'</span><span>Days open</span><span>'+loc.days+'</span><span>Reputation</span><span>'+loc.rep.toFixed(2)+' / 5</span><span>Lifetime profit</span><span class="'+(loc.earned>=0?'pos':'neg')+'">'+fmt(loc.earned)+'</span></div><p class="fine">'+esc(D.twist)+'</p>';
  }
  if(tab==='market'){
    if(loc.comp){var c=loc.comp,tr=c.S-(c.prev||c.S),sh=share(loc);
      h+='<div class="kv"><span>Rival</span><span>'+esc(c.name)+'</span><span>Their strength</span><span class="'+(tr>0?'neg':'pos')+'">'+c.S.toFixed(0)+(tr>.5?' ▲':tr<-.5?' ▼':'')+'</span><span>Your pull</span><span>'+attract(loc).toFixed(0)+'</span><span class="tot">Your market share</span><span class="tot">'+(sh*100).toFixed(0)+'%</span></div><p class="fine">Their strength creeps up over time and as your brand gets famous. Marketing raises your pull; dirty tricks knock them down.</p>';}
    else h+='<div class="kv"><span>Rival</span><span>None yet</span></div><p class="fine">Rival terminals start opening once you reach level 12 or own 3 terminals.</p>';
    var fx=[];loc.mk.forEach(function(m){if(m.until>now())fx.push('<span class="tg g">'+(m.k==='tv'?'TV campaign':MKT[m.k].name)+' +'+Math.round(m.add*100)+'% · '+mmss(m.until-now())+'</span>');});
    loc.hx.forEach(function(x){if(x.until>now())fx.push('<span class="tg r">Price war · '+mmss(x.until-now())+'</span>');});
    if(fx.length)h+='<div class="meta" style="margin:6px 0">'+fx.join('')+'</div>';
    var rows=[];
    Object.keys(MKT).forEach(function(k){var d=MKT[k],r={ic:letterIc(d.name[0],0x21a98d),title:d.name,desc:d.desc,grp:'mkt'};
      if(G.lvl<d.lvl){r.lock='Level '+d.lvl;}else if((loc.cd[k]||0)>now()){r.btns=[btn('Ready in '+mmss(loc.cd[k]-now()),'x',{dis:1})];}else r.btns=[costBtn(mktCost(loc,k),'mkt',k,li,'Run')];rows.push(r);});
    Object.keys(SAB).forEach(function(k){var d=SAB[k],r={ic:letterIc(d.name[0],0x3a2317),title:d.name,desc:d.desc,grp:'sab'};
      if(G.lvl<d.lvl)r.lock='Level '+d.lvl;else if(!loc.comp)r.btns=[btn('No rival','x',{dis:1})];else if(d.req&&!holdLv(d.req))r.lock='Needs '+HOLD[d.req].name.toLowerCase();
      else if((loc.cd['s_'+k]||0)>now())r.btns=[btn('Ready in '+mmss(loc.cd['s_'+k]-now()),'x',{dis:1})];else r.btns=[costBtn(sabCost(loc,k),'sab',k,li,'Do it')];rows.push(r);});
    h+=groupRows(rows);
  }
  return h;
}

function empBody(tab){
  var h='';
  if(tab==='shops'){
    var c=SHEET.city;
    h+='<div class="seg" style="margin:8px 0 4px">';for(var n=0;n<G.cities;n++)h+='<button type="button" data-a="city" data-p="'+n+'" aria-pressed="'+(n===c)+'">'+esc(cityName(n))+'</button>';h+='</div>';
    var tot=totalRate();h+='<div class="kv"><span>Terminals</span><span>'+G.locs.length+'</span><span>Earning while you play</span><span class="'+(tot>=0?'pos':'neg')+'">'+(tot>=0?'+':'')+fmt(tot)+'/min</span><span>Brand fame</span><span>'+Math.round(G.fame)+'</span></div>';
    cityDistricts(c).forEach(function(D){
      var li=-1;G.locs.forEach(function(l,i){if(l.city===c&&l.did===D.id)li=i;});
      if(li>=0){var loc=G.locs[li],e=locEcon(loc),here=li===G.act;
        h+='<div class="loc'+(here?' act':'')+'"><div class="lh"><div class="pic">'+img(distPic(D.win))+'</div><div class="tx"><b>'+esc(loc.name)+'</b><small>'+IND[loc.ind].name+' · '+U(loc,'gates')+' gates · '+loc.days+' days</small>'+stars(loc.rep)+'</div>'+
          '<div class="net '+(here&&inShiftAt(loc)?'off':e.open?(e.net>=0?'pos':'neg'):'off')+'">'+(here&&inShiftAt(loc)?'You are here':e.open?(e.net>=0?'+':'')+fmt(e.net)+'/min':'Closed')+'</div></div><div class="meta">'+
          (loc.comp?'<span class="tg r">vs '+esc(loc.comp.name)+' · '+(share(loc)*100).toFixed(0)+'% share</span>':'')+
          (!e.open?'<span class="tg">Needs '+e.bott+' to run without you</span>':e.bott?'<span class="tg y">Short on '+e.bott+'</span>':'')+
          (mktAdd(loc)>0?'<span class="tg g">Marketing on</span>':'')+'</div><div class="bt">'+
          (here?btn('Working here','x',{dis:1}):btn('Work here','work',{l:li,cls:'gold'}))+btn('Manage','manage',{l:li,cls:'sec'})+'</div></div>';}
      else{var r={ic:img(distPic(D.win)),title:esc(D.name)+(D.tier?' <span class="tg b">City tier '+D.tier+'</span>':''),desc:esc(D.twist)};
        if(G.lvl<D.lvl)r.lock='Level '+D.lvl;else r.btns=[btn('Open a terminal · '+fmtR(locCost(c,D.id,'container')),'open',{p:D.id,c:c,poor:G.cash<locCost(c,D.id,'container')})];
        h+=rowHtml(r);}
    });
    var nn=G.cities,q=cityReq(nn),own=G.locs.filter(function(l){return l.city===nn-1;}).length;
    h+='<div class="grp">Next coast</div>'+rowHtml({ic:letterIc(cityName(nn)[0],0x2f8fd0),title:'Expand to '+esc(cityName(nn)),desc:'Six new ports with bigger ships, higher fees and tougher rivals.',tags:[{t:'Level '+q.lvl,c:G.lvl>=q.lvl?'g':'r'},{t:own+' of '+q.own+' terminals on '+cityName(nn-1),c:own>=q.own?'g':'r'}],
      btns:[btn('Open office','act',{k:'city',p:nn,l:0,dis:G.lvl<q.lvl||own<q.own})]});
  }
  if(tab==='hq'){
    h+='<p class="fine" style="text-align:left">Port authority upgrades apply to every terminal you own.</p>';
    HQ_ORDER.forEach(function(k){var d=HQ[k],l=G.hq[k]||0,r={ic:letterIc(d.l,d.col),title:d.name+' <span class="tg">'+l+'/'+d.max+'</span>',desc:d.eff};
      if(G.lvl<d.lvl)r.lock='Level '+d.lvl;else if(l>=d.max)r.btns=[btn('Maxed','x',{dis:1})];else r.btns=[costBtn(hqCost(k),'hq',k,0,'Upgrade')];h+=rowHtml(r);});
    var tv={ic:letterIc('AD',0xea4b3c),title:'National ad campaign',desc:'Every terminal gets +35% trucks for 10 minutes, plus a fame boost. Price scales with your empire.'};
    if(G.lvl<20)tv.lock='Level 20';else if((G.tvcd||0)>now())tv.btns=[btn('Ready in '+mmss(G.tvcd-now()),'x',{dis:1})];else tv.btns=[costBtn(tvCost(),'tv',0,0,'Air it')];
    h+='<div class="grp">Campaigns</div>'+rowHtml(tv);
  }
  if(tab==='hold'){
    h+='<p class="fine" style="text-align:left">Holdings in related businesses. Each one pays you every minute and gives your terminals an edge.</p>';
    HOLD_ORDER.forEach(function(k){var d=HOLD[k],l=G.hold[k]||0,req=holdReq(k),inc=l?d.inc*l*Math.pow(1.25,l):0,nx=d.inc*(l+1)*Math.pow(1.25,l+1);
      var r={ic:letterIc(d.l,d.col),title:d.name+' <span class="tg">'+l+'/'+d.max+'</span>',desc:d.eff,tags:[{t:l?'Pays '+fmt(inc)+'/min':'Would pay '+fmt(nx)+'/min',c:'g'}]};
      if(req)r.lock=req;else if(l>=d.max)r.btns=[btn('Maxed','x',{dis:1})];else r.btns=[costBtn(holdCostOf(k),'hold',k,0,l?'Expand':'Acquire')];h+=rowHtml(r);});
  }
  if(tab==='news'){
    if(!G.news.length)h+='<p class="fine">Nothing yet. Rival moves and big events show up here.</p>';
    h+='<div class="newsl" style="margin-top:8px">'+G.news.map(function(n){var m=Math.round((now()-n.t)/60000);return '<div class="'+n.kind+'"><time>'+(m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago')+'</time>'+esc(n.text)+'</div>';}).join('')+'</div>';
  }
  return h;
}

function renderSheet(){
  if(!SHEET)return;var el=$('#sheet'),old=el.querySelector('.sh-b'),sc=old?old.scrollTop:0,h,tabs;
  if(SHEET.kind==='shop'){var loc=G.locs[SHEET.li],D=distOf(loc);tabs=[['equip','Equipment'],['staff','Crew'],['store','Terminal'],['market','Marketing']];
    h='<div class="sh"><div class="sh-h"><div class="ti"><h2>'+esc(loc.name)+'</h2><p>'+IND[loc.ind].name+' · '+U(loc,'gates')+' gates · '+esc(cityName(loc.city))+'</p></div><div class="cashb">'+fmt(G.cash)+'</div><button class="x" type="button" data-a="close" aria-label="Close">✕</button></div>';
    h+='<div class="tabs" role="tablist">'+tabs.map(function(t){return '<button type="button" role="tab" data-a="tab" data-p="'+t[0]+'" aria-selected="'+(SHEET.tab===t[0])+'">'+t[1]+'</button>';}).join('')+'</div>';
    h+='<div class="sh-b">'+shopBody(loc,SHEET.tab)+'</div></div>';}
  else{tabs=[['shops','Terminals'],['hq','Port authority'],['hold','Holdings'],['news','News']];
    h='<div class="sh"><div class="sh-h"><div class="ti"><h2>Your shipping empire</h2><p>Level '+G.lvl+' · '+G.locs.length+' terminal'+(G.locs.length>1?'s':'')+' · fame '+Math.round(G.fame)+'</p></div><div class="cashb">'+fmt(G.cash)+'</div><button class="x" type="button" data-a="close" aria-label="Close">✕</button></div>';
    h+='<div class="tabs" role="tablist">'+tabs.map(function(t){return '<button type="button" role="tab" data-a="tab" data-p="'+t[0]+'" aria-selected="'+(SHEET.tab===t[0])+'">'+t[1]+'</button>';}).join('')+'</div>';
    h+='<div class="sh-b">'+empBody(SHEET.tab)+'</div></div>';}
  if(SHEET.fresh){h=h.replace('<div class="sh">','<div class="sh in">');SHEET.fresh=false;}
  el.innerHTML=h;el.hidden=false;var nb=el.querySelector('.sh-b');if(nb)nb.scrollTop=sc;SHEET.body=nb?nb.innerHTML:'';
}
var sheetPtr=false;
$('#sheet').addEventListener('pointerdown',function(){sheetPtr=true;});
window.addEventListener('pointerup',function(){setTimeout(function(){sheetPtr=false;},60);});
window.addEventListener('pointercancel',function(){sheetPtr=false;});
function refreshSheet(){
  var el=$('#sheet');if(!SHEET||el.hidden||sheetPtr)return;
  var cb=el.querySelector('.cashb');if(cb){var ct=fmt(G.cash);if(cb.textContent!==ct)cb.textContent=ct;}
  if(SHEET.tab!=='market'&&SHEET.tab!=='shops'&&SHEET.tab!=='hq')return;
  var nb=el.querySelector('.sh-b');if(!nb)return;
  var html=SHEET.kind==='shop'?shopBody(G.locs[SHEET.li],SHEET.tab):empBody(SHEET.tab);
  var tmp=document.createElement('div');tmp.innerHTML=html;html=tmp.innerHTML;
  if(html===SHEET.body)return;
  var sc=nb.scrollTop;nb.innerHTML=html;nb.scrollTop=sc;SHEET.body=html;
}
function openShop(li,tab){SHEET={kind:'shop',li:li==null?G.act:li,tab:tab||'equip',fresh:true};renderSheet();pauseFor();}
function openEmpire(tab){SHEET={kind:'emp',tab:tab||'shops',city:curLoc().city,fresh:true};renderSheet();pauseFor();}
function closeSheet(){SHEET=null;$('#sheet').hidden=true;if(SH&&SH.phase==='done'&&lastSum&&$('#modal').hidden){showSummary(lastSum);return;}unpause();}
setInterval(refreshSheet,1000);

/* ================= MODALS ================= */
function openModal(html,kind){MODAL=kind;var m=$('#modal');m.innerHTML='<div class="card">'+html+'</div>';m.hidden=false;pauseFor();}
function closeModal(){MODAL=null;$('#modal').hidden=true;unpause();}
function starRow(n){var h='<div class="starrow">';for(var i=0;i<3;i++)h+='<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" fill="'+(i<n?'#ffc63d':'#ead7bf')+'" stroke="#3a2317" stroke-width="1.5"/></svg>';return h+'</div>';}
function kvl(a,b,cls){return '<span'+(cls&&cls.indexOf('tot')>=0?' class="tot"':'')+'>'+a+'</span><span class="'+(cls||'')+'">'+b+'</span>';}
function lvlList(){if(!LVQ.length)return '';var h='';LVQ.forEach(function(l){h+='<div class="grp">Level '+l+'</div><div class="unl">';var u=unlocksAt(l);if(!u.length)h+='<div>Bigger crowds and better tips</div>';u.forEach(function(x){h+='<div>'+(x.ic?'<img alt="" src="'+x.ic+'">':'')+esc(x.t)+'</div>';});h+='</div>';});LVQ=[];return h;}
function showSummary(s){
  lastSum=s;var net=s.sales+s.tips+(s.bonusShip||0)-s.cogs-s.wages-s.rent-s.fine+s.bonus,dr=s.rep1-s.rep0;
  var h='<span class="tg y">DAY '+s.day+' · '+esc(s.locName).toUpperCase()+'</span><h1>Shift over</h1>'+starRow(s.stars)+'<div class="big '+(net>=0?'pos':'neg')+'">'+(net>=0?'+':'')+fmt(net)+'</div>';
  if(s.total!=null){var P=function(n){return Math.round(n).toLocaleString();};
    h+='<div class="ptsbox"><div class="grade '+s.grade+'">'+s.grade+'</div><div><div class="pv">'+P(s.total)+' pts</div><div class="pl">Best day '+P(G.best)+' · Lifetime '+P(s.life)+'</div>'+(s.newBest?'<span class="nb">NEW BEST!</span>':'')+'</div></div>';
    h+='<div class="kv">'+kvl('Truck points',P(s.opts||0))+(s.pts>(s.opts||0)+1?kvl('Turnaround points','+'+P(s.pts-(s.opts||0)),'pos'):'')+(s.perf?kvl('Perfect orders',s.perf,'pos'):'')+kvl('Star bonus ('+s.stars+'★)','+'+P(s.stars*150),s.stars?'pos':'')+(s.ptsBonus>s.stars*150?kvl('No walkouts','+300','pos'):'')+kvl('Shift score',P(s.total)+' pts','tot pos')+(window.LZ_GAME?kvl('Lazer Points'+(s.ea?' (held for launch, paid 1.5×)':s.lzm>1?' ('+s.lzm+'× Game of the Day)':''),'+'+P(s.ea?Math.round((s.lp||0)*1.5):(s.lp||0))+' LP','pos'):'')+'</div>';}
  h+='<div class="kv">'+kvl('Sales',fmt(s.sales))+kvl('Tips',fmt(s.tips),'pos')+kvl('Handling costs','-'+fmt(s.cogs),'neg')+(s.wages?kvl('Crew wages','-'+fmt(s.wages),'neg'):'')+(s.bonusShip?kvl('Turnaround bonuses','+'+fmt(s.bonusShip),'pos'):'')+(s.rent>.5?kvl('Berth rent','-'+fmt(s.rent),'neg'):'')+(s.fine?kvl('Fines & demurrage','-'+fmt(s.fine),'neg'):'')+
    kvl('Daily goal '+fmtR(s.goal),s.bonus?'+'+fmt(s.bonus):'missed',s.bonus?'pos':'neg')+kvl('Profit this shift',(net>=0?'+':'')+fmt(net),'tot '+(net>=0?'pos':'neg'))+(Math.abs(s.passive)>.5?kvl('Other terminals + holdings',(s.passive>=0?'+':'')+fmt(s.passive),s.passive>=0?'pos':'neg'):'')+'</div>';
  h+='<div class="kv">'+kvl('Trucks loaded',s.served)+kvl('Crane moves',s.moves||0)+(s.trains?kvl('Freight trains',s.trains):'')+kvl('Ships turned around',s.ships||0,(s.ships?'pos':''))+(s.missed?kvl('Ships sailed early',s.missed,'neg'):'')+kvl('Drove off empty',s.walk,s.walk?'neg':'')+(s.turned?kvl('Turned away at the gate',s.turned,'neg'):'')+(s.spoiled?kvl('Reefers spoiled',s.spoiled,'neg'):'')+(s.waste?kvl('Containers scrapped',s.waste,'neg'):'')+kvl('Best streak',s.bestStreak)+kvl('Reputation',s.rep1.toFixed(2)+' ('+(dr>=0?'+':'')+dr.toFixed(2)+')',dr>=0?'pos':'neg')+'</div>';
  h+=lvlList();
  h+='<div class="btns">'+btn('Port','shop',{cls:'sec'})+btn('Empire','emp',{cls:'sec'})+btn('Next day','next',{cls:'gold'})+'</div>';
  openModal(h,'sum');
}
function onLevel(l){sfx.lvl();if(SH&&SH.phase!=='done'){var u=unlocksAt(l);banner('Level '+l,u.length?u.length+' new unlock'+(u.length>1?'s':'')+'. See them after the shift.':'Bigger crowds ahead','good');}
  else if(!MODAL){setTimeout(function(){if(!MODAL&&LVQ.length)openModal('<h1>Level up!</h1>'+lvlList()+'<div class="btns">'+btn('Nice','mclose',{cls:'gold'})+'</div>','lvl');},300);}}
function showTitle(hasSave){
  openModal('<div class="ttl"><span class="kick">LAZER ARCADE</span><h1>Harbor <span>Rush</span></h1></div><p class="lead">You run the crane. Ships arrive stacked high, trucks want specific containers, and nothing is ever on top when you need it.</p>'+
    '<ol><li><b>Pick:</b> tap a stack on the ship or in the yard to grab its top container.</li><li><b>Drop:</b> tap a yard column to stack it there, or a truck that wants it to load it.</li><li><b>Dig:</b> the one you need is buried? Shuffle the boxes above it to other columns.</li><li><b>Mind the rules:</b> frozen cargo spoils outside powered columns, hazmat lives in the hazmat bay, and held boxes clear in the customs lane.</li></ol><p class="fine" style="text-align:left">Tip: tap a truck with nothing picked and the crane grabs a matching container from the top of any stack. Empty a ship before it sails for a turnaround bonus.</p>'+
    '<div class="btns">'+(hasSave?btn('Keep playing','start',{cls:'gold'})+btn('New game','new',{cls:'sec'}):btn('Open the port','start',{cls:'gold'}))+'</div>'+arcadeTitle(),'title');
}
function arcadeTitle(){if(!window.LZ_GAME||!window.LZ)return '<p class="fine">Progress saves in this browser.</p>';
  var x2=LZM>1?'<div class="lzbar" style="background:#fff3c4;border-color:#f2c94c"><span><b>Game of the Day:</b> '+LZM+'× Lazer Points on every shift today.</span></div>':'';
  var u=LZ.signedIn()?LZ.username:'';
  return x2+'<div class="lzbar"><span>'+(u?'Signed in as <b>'+esc(u)+'</b>. Progress saves to your account.':'Playing as guest. Progress saves in this browser.')+'</span>'+(u?'':btn('Sign in','acct',{cls:'sec'}))+'</div>'+
    '<div class="btns">'+btn('Leaderboard','lb',{cls:'sec'})+btn('Lazer Arcade','arcade',{cls:'sec'})+'</div>'+
    (window.LZ_EA?'<p class="fine"><b>Early access.</b> Points you earn now count 1.5× when Harbor Rush launches.</p>':'');}
function showPause(){openModal('<h1>Paused</h1><p class="lead">'+esc(curLoc().name)+' · Level '+G.lvl+' · '+fmt(G.cash)+'</p><div class="btns">'+btn('Resume','mclose',{cls:'gold'})+'</div><div class="btns">'+btn('Sound '+(G.mute?'off':'on'),'snd',{cls:'sec'})+btn('Music '+(G.music?'on':'off'),'mus',{cls:'sec'})+'</div><div class="btns">'+btn('Start over','new',{cls:'warn'})+'</div>'+(window.LZ_GAME?'<div class="btns">'+btn(LZ.signedIn()?esc(LZ.username):'Sign in','acct',{cls:'sec'})+btn('Leaderboard','lb',{cls:'sec'})+btn('Feedback','fb',{cls:'sec'})+'</div><div class="btns">'+btn('Back to Lazer Arcade','arcade',{cls:'sec'})+'</div>':''),'pause');}
function chooser(city,did){
  var D=district(city,did),h='<span class="tg b">'+esc(cityName(city))+'</span><h1>'+esc(D.name)+'</h1><p class="lead">'+esc(D.twist)+'</p>';
  IND_ORDER.forEach(function(k){var I=IND[k],c=locCost(city,did,k),r={ic:img(heroIcon(k)),title:I.name,desc:'Fees ×'+I.pm+' · equipment costs ×'+I.cm};
    if(G.lvl<I.lvl)r.lock='Level '+I.lvl;else r.btns=[btn(fmtR(c),'buyloc',{k:k,p:did,c:city,poor:G.cash<c})];h+=rowHtml(r);});
  h+='<div class="btns">'+btn('Cancel','mclose',{cls:'sec'})+'</div>';openModal(h,'choose');
}

/* ================= CLICK DISPATCH ================= */
var REASON={cash:'Not enough cash yet',room:'No quay space. Expand the terminal first.',max:'Already maxed out',cd:'Still cooling down',req:'Requirements not met yet',none:'No rival here',rackfull:'The tag board holds five tags',owned:'You already have a terminal there'};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b||b.disabled)return;var a=b.dataset.a,p=b.dataset.p,k=b.dataset.k;audioOn();
  if(a==='act'){var li=+(b.dataset.l||0),loc=G.locs[li]||curLoc(),r=act(k,p,loc);
    if(r==='ok'){sfx.buy();if(k!=='price'&&k!=='fire')toast(['st','cap','top','size','decor'].indexOf(k)>=0&&inShiftAt(loc)?'Bought. It arrives at your next shift.':'Done!','good');hudC={};
      if(k==='city'&&SHEET){SHEET.city=+p;}}
    else if(r==='caught'){sfx.bad();toast('You got caught!','bad');}
    else{sfx.nope();b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast(REASON[r]||'Not available','bad');return;}
    if(SHEET)renderSheet();return;}
  if(a==='tab'){SHEET.tab=p;renderSheet();return;}
  if(a==='close'){closeSheet();return;}
  if(a==='city'){SHEET.city=+p;renderSheet();return;}
  if(a==='manage'){openShop(+b.dataset.l,'equip');return;}
  if(a==='work'){var i=+b.dataset.l;lastSum=null;closeModal();SHEET=null;$('#sheet').hidden=true;if(SH&&SH.phase!=='done')SH.phase='done';G.act=i;save();startShift();toast('Now working at '+G.locs[i].name,'good');return;}
  if(a==='open'){chooser(+b.dataset.c,p);return;}
  if(a==='buyloc'){var res=buyLoc(+b.dataset.c,p,k);if(typeof res==='number'){sfx.buy();openModal('<h1>Grand opening!</h1><p class="lead">Your '+esc(IND[k].name.toLowerCase())+' at '+esc(G.locs[res].name)+' is ready. Hire a harbor master and a crane operator there so it earns while you work elsewhere.</p><div class="btns">'+btn('Stay here','mclose',{cls:'sec'})+btn('Go work there','work',{l:res,cls:'gold'})+'</div>','opened');if(SHEET)renderSheet();}
    else{sfx.nope();toast(REASON[res]||'Not available','bad');}return;}
  if(a==='mclose'){closeModal();if(SH&&SH.phase==='done'&&lastSum&&!SHEET)showSummary(lastSum);return;}
  if(a==='next'){closeModal();lastSum=null;startShift();return;}
  if(a==='shop'){closeModal();openShop(G.act,'equip');return;}
  if(a==='emp'){closeModal();openEmpire();return;}
  if(a==='start'){lastSum=null;closeModal();if(!G.started){G.started=true;}startShift();var og=window.__off;if(og&&Math.abs(og.gain)>1){setTimeout(function(){showNews('While you were away: '+(og.gain>=0?'+':'')+fmt(og.gain)+' from your shops ('+Math.round(og.eff*100)+'% rate).',og.gain>=0?'good':'bad');},1200);}return;}
  if(a==='arcade'){save();if(window.LZ)LZ.flush();setTimeout(function(){location.href='/arcade/';},250);return;}
  if(a==='lb'){save();if(window.LZ)LZ.flush();setTimeout(function(){location.href='/arcade/leaderboard/?game=harbor';},250);return;}
  if(a==='fb'){if(window.LZ)LZ.openFeedback('harbor');return;}
  if(a==='acct'){if(window.LZ)LZ.openAccount('signin');return;}
  if(a==='snd'){G.mute=!G.mute;syncMusic();showPause();return;}
  if(a==='mus'){G.music=!G.music;syncMusic();showPause();return;}
  if(a==='new'){openModal('<h1>Start over?</h1><p class="lead">This erases every terminal, upgrade and dollar.</p><div class="btns">'+btn('Keep my empire','mclose',{cls:'sec'})+btn('Erase and restart','new2',{cls:'warn'})+'</div>','confirm');return;}
  if(a==='new2'){try{localStorage.removeItem(SAVEKEY);}catch(er){}freshG();LVQ=[];closeModal();SHEET=null;$('#sheet').hidden=true;startShift();return;}
});
$('#bShop').addEventListener('click',function(){audioOn();if(SHEET&&SHEET.kind==='shop'){closeSheet();return;}openShop(G.act,'equip');});
$('#bEmp').addEventListener('click',function(){audioOn();if(SHEET&&SHEET.kind==='emp'){closeSheet();return;}openEmpire();});
$('#bPause').addEventListener('click',function(){audioOn();if(MODAL==='pause'){closeModal();return;}if(!$('#modal').hidden)return;showPause();});
