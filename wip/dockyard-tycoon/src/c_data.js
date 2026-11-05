
/* ================= DATA ================= */
var DAYLEN=150;

/* cargo types: each container has one. rules: reefer needs a powered column, hazmat needs the hazmat bay */
var CT={
  gen:{name:'General cargo',col:0x2f7fd0,sym:'box',val:3,lvl:1},
  toys:{name:'Toys',col:0xff8a1f,sym:'star',val:3.5,lvl:1},
  elec:{name:'Electronics',col:0x7a5ad8,sym:'bolt',val:5,lvl:2},
  food:{name:'Frozen food',col:0xf4f6f8,band:0x2da35d,sym:'snow',val:5.5,lvl:3,reefer:1},
  fuel:{name:'Fuel tank',col:0xffc63d,sym:'diamond',val:6,lvl:5,hazmat:1,tank:1},
  cars:{name:'Cars',col:0xe2553f,sym:'up',val:6.5,lvl:7},
  fish:{name:'Fresh fish',col:0xe8f4fa,band:0x2f9fd0,sym:'fish',val:4.5,lvl:10,reefer:1},
  crab:{name:'Crab',col:0xff6a4a,sym:'leaf',val:5,lvl:10},
  ice:{name:'Ice blocks',col:0xbfe9ff,sym:'snow',val:3.5,lvl:10},
  oyster:{name:'Oysters',col:0x8fa3b0,sym:'globe',val:6,lvl:12,reefer:1},
  ore:{name:'Iron ore',col:0x8a5a44,sym:'scale',val:5,lvl:16},
  grain:{name:'Grain',col:0xf2a33a,sym:'grain',val:5.5,lvl:16},
  oil:{name:'Crude oil',col:0x3a3f48,sym:'drop',val:8,lvl:17,hazmat:1,tank:1},
  steel:{name:'Steel coils',col:0x9aa6b2,sym:'ribbon',val:7,lvl:18},
  bags:{name:'Luggage',col:0x7a5ad8,sym:'map',val:4,lvl:22},
  gifts:{name:'Souvenirs',col:0xff79b4,sym:'flower',val:4.5,lvl:22},
  wine:{name:'Fine wine',col:0x8a1f3a,sym:'glass',val:7,lvl:23,reefer:1},
  vip:{name:'VIP freight',col:0xd9a400,sym:'crown',val:9,lvl:24}
};

/* terminal types (industries): each has its own cargo mix, look and customers */
var IND={
  container:{name:'Container terminal',lvl:1,pm:1,cm:1,wm:1,cust:'truck',cargo:['gen','toys','elec','food','fuel','cars'],
    theme:{sea:0x2f8fc4,quay:0xd9d2c3,quay2:0xc7bfae,line:0xffc63d,accent:0xff7a1a,trim:0x2a3a4a,crane:0xffb000,stn:0x2f7fd0,hull:0xd23a2a},hero:'elec'},
  fish:{name:'Fish wharf',lvl:10,pm:1.6,cm:4,wm:1.5,cust:'van',cargo:['fish','crab','ice','oyster','gen'],
    theme:{sea:0x2c7fa8,quay:0xb89a72,quay2:0xa3865f,line:0xf4f0e6,accent:0x21a98d,trim:0x3a4a52,crane:0x21a98d,stn:0x21a98d,hull:0x2f9fd0},hero:'fish'},
  bulk:{name:'Bulk & energy terminal',lvl:16,pm:2.6,cm:14,wm:2.4,cust:'truck',cargo:['ore','grain','oil','steel','fuel'],
    theme:{sea:0x3a7fa0,quay:0xb9b4aa,quay2:0xa59f93,line:0xffc63d,accent:0xff7a1a,trim:0x3a3f48,crane:0xff7a1a,stn:0xff7a1a,hull:0x3a3f48},hero:'oil'},
  cruise:{name:'Cruise terminal',lvl:22,pm:4,cm:45,wm:3.6,cust:'person',cargo:['bags','gifts','wine','vip','food'],
    theme:{sea:0x22a7c9,quay:0xf2e6cc,quay2:0xe3d3b2,line:0xffffff,accent:0xff79b4,trim:0x2a6a8a,crane:0x2a6a8a,stn:0xff79b4,hull:0xf2f4f6},hero:'vip'}
};
var IND_ORDER=['container','fish','bulk','cruise'];

/* per-terminal upgrades: they reshape the yard itself */
var UPG={
  cols:{name:'Yard columns',desc:'One more stack in the yard. More room to sort and dig.',base:5,max:9,cost:120,g:1.9,lvl:1,icon:'cols'},
  height:{name:'Stack height',desc:'Every yard column holds one more container.',base:3,max:5,cost:400,g:3.2,lvl:3,icon:'height'},
  speed:{name:'Crane motors',desc:'The crane moves 12% faster per level.',base:0,max:6,cost:90,g:1.8,lvl:1,icon:'speed'},
  cranes:{name:'Second gantry crane',desc:'Another crane works your queue at the same time.',base:1,max:2,cost:2500,g:4,lvl:8,icon:'crane'},
  power:{name:'Reefer power',desc:'Powers one more yard column so frozen cargo keeps cold there.',base:0,max:4,cost:150,g:2,lvl:3,icon:'power'},
  hazmat:{name:'Hazmat bay',desc:'A fenced column for fuel and oil. Hazmat can only go here.',base:0,max:2,cost:350,g:3,lvl:5,icon:'hazmat'},
  customs:{name:'Customs lane',desc:'Containers with a customs hold get inspected here before trucks will take them.',base:0,max:3,cost:300,g:2.4,lvl:4,icon:'customs'},
  gates:{name:'Gate lanes',desc:'One more truck lane at the gate. More trucks, more money.',base:2,max:5,cost:250,g:2.6,lvl:2,icon:'gates'},
  berth:{name:'Second berth',desc:'Two ships at once. Twice the cargo, twice the timers.',base:1,max:2,cost:6000,g:4,lvl:9,icon:'berth'},
  rail:{name:'Rail siding',desc:'Freight trains arrive wanting 3 to 4 containers and pay 60% more.',base:0,max:1,cost:4000,g:4,lvl:7,icon:'rail'}
};
var UPG_ORDER=['cols','speed','gates','power','height','customs','hazmat','rail','cranes','berth'];
function U(loc,k){return (loc.u&&loc.u[k]!=null)?loc.u[k]:UPG[k].base;}

/* ports of the home coast; later coasts are generated */
var DIST0=[
  {id:'main',name:'Old Harbor',lvl:1,cost:0,demand:1,pat:1,tips:1,price:1,am:1,lunch:1,win:'harbor',twist:'Your first berth. Steady ships, steady trucks.'},
  {id:'river',name:'River Docks',lvl:4,cost:1500,demand:1.15,pat:1.2,tips:.6,price:.85,am:.6,lunch:1.3,ev:['barges'],win:'river',twist:'Barges come down the river in convoys. Patient drivers, small fees, big rushes.'},
  {id:'ind',name:'Industrial Bay',lvl:6,cost:3500,demand:1.05,pat:.7,tips:1.7,price:1.35,am:2.2,lunch:.8,win:'industry',twist:'Factories open early. A huge morning rush of impatient drivers who pay well.'},
  {id:'tropic',name:'Palm Cove',lvl:8,cost:7000,demand:1.2,pat:1,tips:1.1,price:1.1,am:.5,lunch:1.5,ev:['gull','heat'],reef:1.8,win:'tropic',twist:'Heat makes reefers spoil faster, and seagulls raid the yard. Tap them away.'},
  {id:'old',name:'Lighthouse Quay',lvl:10,cost:12000,demand:.95,pat:1.15,tips:1.2,price:1.15,am:1,lunch:1,rep:2,win:'old',twist:'Old-school shippers who talk. Reputation swings twice as hard here.'},
  {id:'ftz',name:'Free Trade Zone',lvl:13,cost:24000,demand:1.7,pat:.55,tips:1.4,price:1.6,am:1.4,lunch:1.2,ev:['convoy'],hold:2,win:'ftz',twist:'Huge volume and premium fees. Twice as many customs holds.'},
  {id:'arctic',name:'Frost Harbor',lvl:15,cost:45000,demand:1.1,pat:1.2,tips:1.3,price:1.4,am:.8,lunch:1.4,ev:['ice'],reef:.4,win:'arctic',twist:'Reefers barely spoil in the cold. Pack ice closes the harbor, then the backlog hits.'},
  {id:'canal',name:'Canal Locks',lvl:17,cost:80000,demand:1.1,pat:.9,tips:1.1,price:1.25,am:1.6,lunch:1,ev:['lock'],win:'canal',twist:'When the lock opens, every berth gets a fresh ship at once.'},
  {id:'night',name:'Night Port',lvl:19,cost:140000,demand:1.4,pat:.9,tips:1.2,price:1.3,am:.3,lunch:.6,eve:2.4,big:1,win:'night',twist:'The rush comes after dark with double-container orders.'},
  {id:'mega',name:'Megaport',lvl:21,cost:250000,demand:1.25,pat:1,tips:1.3,price:1.35,am:1,lunch:1,ev:['fog','inspector'],win:'mega',twist:'Mega ships and fog banks. Inspectors fine you for spoiled cargo in the yard.'}
];
var CITY_NAMES=['Saltmouth','Bayport','Cape Royale','Port Azure','Iron Coast','Sunreef','Northwater','Grand Strait','Coral Bay','Stormhaven','Silver Sound','Starboard City'];
var PREFIX=['North','East','West','New','Upper','Outer','Old','South','Grand','Little'];
var CITYC={};
function cityDistricts(n){
  if(n===0)return DIST0;
  if(CITYC[n])return CITYC[n];
  var r=mulberry(n*7919+13),tp=DIST0.slice(1),out=[];
  for(var i=0;i<6;i++){
    var t=tp[Math.floor(r()*tp.length)],pre=PREFIX[Math.floor(r()*PREFIX.length)];
    var base=t.name.split(' ');var nm=pre+' '+(base.length>1?base[base.length-1]:t.name);
    out.push(Object.assign({},t,{id:'c'+n+'_'+i,name:nm,lvl:25+(n-1)*6+i,cost:Math.round(400000*Math.pow(3.2,n-1)*(1+.5*i)),tier:n,
      demand:t.demand*(1+r()*.3),pat:t.pat*(.85+r()*.25),tips:t.tips*(1+r()*.3)}));
  }
  return CITYC[n]=out;
}
function district(city,id){var l=cityDistricts(city);for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return l[0];}
function cityName(n){return n<CITY_NAMES.length?CITY_NAMES[n]:'Coast '+(n+1);}
function cityReq(n){return {lvl:25+(n-1)*6,own:4};}
function TM(t){t=t||0;return {pm:Math.pow(1.7,t),dm:Math.pow(1.2,t),cm:Math.pow(2.6,t)};}

/* crew (internal keys shared with the Rush engine) */
var ROLES={
  barista:{name:'Crane operator',lvl:3,cost:250,wage:4,act:2.2,cap:[0,1,1,2,3],col:0xff9b1a,desc:'Unloads the ship into the yard on their own whenever your crane queue is empty, and keeps reefers and hazmat in the right columns.'},
  server:{name:'Straddle driver',lvl:5,cost:300,wage:3,act:2.6,cap:[0,1,1,2,2],col:0x2f8fd0,desc:'Drives containers from the top of the yard straight onto waiting trucks, without the crane.'},
  manager:{name:'Harbor master',lvl:6,cost:700,wage:6,act:0,cap:[0,1,1,1,1],col:0x7a5ad8,desc:'Runs the terminal while you work elsewhere. With no harbor master it earns nothing while you are away.'},
  finisher:{name:'Customs officer',lvl:8,cost:450,wage:4,act:0,cap:[0,0,1,1,2],col:0x21a98d,desc:'Inspects held containers twice as fast in the customs lane.'},
  host:{name:'Dispatcher',lvl:9,cost:400,wage:3,act:0,cap:[0,0,1,1,1],col:0xd99a12,desc:'Radios the gate so every driver waits 15% longer.'}
};
var ROLE_ORDER=['barista','server','manager','finisher','host'];
function staffCap(loc,r){return ROLES[r].cap[Math.min(4,Math.max(1,U(loc,'gates')-1))];}
var FIRST=['Mia','Leo','Ava','Kai','Zoe','Sam','Ivy','Max','Ruby','Theo','Nia','Owen','Lila','Finn','Aria','Jude','Maya','Eli','Rosa','Gus','Noor','Wes','June','Omar','Bea','Raf','Tess','Hugo','Ada','Cole'];

var PRICE_T=[
  {name:'Budget',m:.85,dem:1.16,pat:1.05},
  {name:'Standard',m:1,dem:1,pat:1},
  {name:'Premium',m:1.22,dem:.84,pat:.95},
  {name:'Luxury',m:1.5,dem:.66,pat:.9}];

var MKT={
  flyers:{name:'Call the freight brokers',lvl:2,cost:30,add:.25,dur:180,cd:120,fame:.5,desc:'+25% trucks for 3 minutes.'},
  social:{name:'Shipping-line promo',lvl:7,cost:160,add:.4,dur:300,cd:240,fame:3,desc:'+40% trucks for 5 minutes and some fame.'},
  event:{name:'Open-port day',lvl:12,cost:900,add:.8,dur:240,cd:600,fame:8,rep:.25,desc:'+80% trucks for 4 minutes and a reputation bump.'},
  billboard:{name:'Trade-show booth',lvl:16,cost:4000,add:.5,dur:900,cd:1200,fame:12,desc:'+50% trucks for 15 minutes.'}
};
var SAB={
  rumor:{name:'Leak delay rumors',lvl:14,cost:250,hit:15,risk:.3,desc:'Knocks their strength down 15. 30% chance you get caught.'},
  poach:{name:'Poach their best operator',lvl:16,cost:700,hit:25,risk:.35,gift:1,desc:'Strength -25 and the operator joins you if there is room. 35% risk.'},
  squeeze:{name:'Undercut their shipping line',lvl:20,cost:2500,hit:40,risk:.4,req:'line',desc:'Strength -40. Needs your own shipping line. 40% risk.'},
  crash:{name:'Block their berth',lvl:25,cost:7000,hit:60,risk:.45,desc:'Strength -60. 45% risk of a big scandal.'}
};
var RIVALS={
  container:['Maersky Lines','Box Kings','Port Authority Co.','TideRunner','Gantry Bros','BlueWave Freight'],
  fish:['Catch of the Day Co.','Reel Deal Fisheries','Salty Sam\'s','North Sea Haul'],
  bulk:['Heavy Lift Inc.','Ore-Some Logistics','Grain Train','Crude Awakening'],
  cruise:['Sunset Cruises','Wave Royale','Island Hoppers','Ocean Dream Lines']
};
var HQ={
  training:{name:'Crane academy',lvl:6,cost:400,g:1.9,max:10,col:0xff9b1a,l:'A',eff:'Crew work 6% faster per level, at every terminal.'},
  offline:{name:'Night shift',lvl:7,cost:500,g:2.1,max:8,col:0x4a5aa8,l:'N',eff:'Earn more while the game is closed: +8% rate and +1 hour cap per level.'},
  loyalty:{name:'Freight app',lvl:9,cost:900,g:2,max:10,col:0x21a98d,l:'F',eff:'+6% trucks at every terminal per level.'},
  grind:{name:'Crane R&D',lvl:11,cost:1500,g:2.1,max:6,col:0x6b6f75,l:'R',eff:'Every crane moves 5% faster per level.'},
  quality:{name:'Premium contracts',lvl:12,cost:2000,g:2.1,max:10,col:0xd99a12,l:'P',eff:'All fees +4% per level.'},
  ambassador:{name:'Port PR team',lvl:14,cost:3000,g:2.2,max:8,col:0xff79b4,l:'B',eff:'Fame grows 15% faster per level.'},
  security:{name:'Harbor police',lvl:15,cost:5000,g:2.3,max:5,col:0x2f3a56,l:'S',eff:'Blocks 15% of rival attacks per level.'},
  legal:{name:'Maritime lawyers',lvl:17,cost:8000,g:2.3,max:5,col:0x7a5ad8,l:'J',eff:'Your sabotage gets caught 12% less often per level.'},
  autolab:{name:'Automation lab',lvl:23,cost:25000,g:2.4,max:6,col:0x2f8fd0,l:'X',eff:'Terminals handle 10% more volume per level when you are away.'}
};
var HQ_ORDER=['training','offline','loyalty','grind','quality','ambassador','security','legal','autolab'];
var HOLD={
  line:{name:'Shipping line',lvl:18,need:{ind:'container',n:3},cost:30000,g:2.3,max:10,inc:40,col:0xd23a2a,l:'L',eff:'Your own ships: every ship stays 6% longer per level.'},
  trucking:{name:'Trucking company',lvl:20,need:{locs:4},cost:45000,g:2.3,max:10,inc:55,col:0x2f8fd0,l:'T',eff:'Drivers wait 5% longer at every terminal per level.'},
  cold:{name:'Cold storage',lvl:21,need:{ind:'fish',n:1},cost:60000,g:2.3,max:10,inc:70,col:0x7fc0e8,l:'C',eff:'Unpowered reefers last 10% longer per level, everywhere.'},
  rail:{name:'Rail freight',lvl:22,need:{locs:5},cost:90000,g:2.4,max:10,inc:90,col:0x3f8f7a,l:'R',eff:'All handling costs -4% per level, and freight trains pay 5% more per level.'},
  adagency:{name:'Trade magazine',lvl:24,need:{locs:6},cost:140000,g:2.4,max:10,inc:110,col:0xff79b4,l:'M',eff:'Marketing 10% cheaper and 10% stronger per level.'},
  refinery:{name:'Refinery',lvl:24,need:{ind:'bulk',n:1},cost:180000,g:2.4,max:10,inc:140,col:0x3a3f48,l:'O',eff:'Bulk terminals: costs -6% and fees +3% per level.'},
  realty:{name:'Waterfront real estate',lvl:26,need:{locs:7},cost:300000,g:2.5,max:10,inc:200,col:0x2f3a56,l:'E',eff:'Berth rent -10% and new terminals 5% cheaper per level.'},
  resort:{name:'Island resort',lvl:28,need:{ind:'cruise',n:1},cost:600000,g:2.5,max:10,inc:320,col:0xff9fcf,l:'I',eff:'Cruise terminals: costs -6% and fees +3% per level.'}
};
var HOLD_ORDER=['line','trucking','cold','rail','adagency','refinery','realty','resort'];
