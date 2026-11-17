"use strict";
/* Dominion: Infinite Frontiers — endless planetary conquest for Lazer Arcade.
   Real-time squad battles, a layered world map, four currencies, rivals, quests, events and a forge.
   Nothing in the game is sold: gems are earned by playing. The optional Hook Lens (Menu) annotates
   the engagement design, after the concept deck the game grew out of. */
var SAVEKEY="dominion.v1",VER=1;
var $=function(s,r){return(r||document).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}
function rnd(a,b){return a+Math.random()*(b-a);}
function irnd(a,b){return Math.floor(rnd(a,b+1));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function fmt(n){n=Math.floor(n||0);var a=Math.abs(n);if(a>=1e9)return(n/1e9).toFixed(a>=1e10?0:1)+"B";if(a>=1e6)return(n/1e6).toFixed(a>=1e7?0:1)+"M";if(a>=1e4)return(n/1e3).toFixed(a>=1e5?0:1)+"K";return n.toLocaleString("en-US");}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function now(){return Date.now();}
function mmss(s){s=Math.max(0,Math.ceil(s));var m=Math.floor(s/60);return m+":"+(s%60<10?"0":"")+s%60;}
function dur(s){s=Math.max(0,Math.floor(s));var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);if(d)return d+"d "+h+"h";if(h)return h+"h "+m+"m";if(m)return m+"m "+(s%60)+"s";return s+"s";}
function dayStr(d){d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function dayNum(s){return Math.round(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5);}
if(window.CanvasRenderingContext2D&&!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h);};

/* ---------------- icons ---------------- */
var IC={
coin:'<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffcf3a" stroke="#b86d00" stroke-width="2"/><path d="M12 6.5v11M9 9.2c0-1.2 1.2-2 3-2s3 .8 3 2-1.1 1.9-3 2.4-3 1.2-3 2.6 1.2 2.1 3 2.1 3-.8 3-2" fill="none" stroke="#b86d00" stroke-width="1.8" stroke-linecap="round"/></svg>',
stamp:'<svg class="ic" viewBox="0 0 24 24"><path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z" fill="#5fe08a" stroke="#0e7a3a" stroke-width="2" stroke-linejoin="round"/><path d="M9 15c0-4 2.5-6 6-6-.2 3.6-2 6-6 6zm0 0 3.2-3.2" fill="#0e7a3a" stroke="#0e7a3a" stroke-width="1.2" stroke-linecap="round"/></svg>',
alloy:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 2l8.7 5v10L12 22l-8.7-5V7z" fill="#2fe6ff" stroke="#0a6f8a" stroke-width="2" stroke-linejoin="round"/><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z" fill="#c9f9ff" stroke="#0a6f8a" stroke-width="1.4" stroke-linejoin="round"/></svg>',
gem:'<svg class="ic" viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z" fill="#ff4fa3" stroke="#8f124f" stroke-width="2" stroke-linejoin="round"/><path d="M2 9h20M9 3 7 9l5 12 5-12-2-6" fill="none" stroke="#ffd0e8" stroke-width="1.3" stroke-linejoin="round"/></svg>',
xp:'<svg class="ic" viewBox="0 0 24 24"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.2l1.5-7L2 9.4l7-.8z" fill="#8dff5a" stroke="#1d7a16" stroke-width="2" stroke-linejoin="round"/></svg>',
globe:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
army:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a8 8 0 0 1 16 0v3H4z"/><path d="M2 16h20M9 16v4h6v-4"/></svg>',
forge:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>',
quest:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3a2 2 0 0 0-2 2v2h2M9.5 9h6M9.5 13h6M9.5 17h3"/></svg>',
chat:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 9h8M8 12.5h5"/></svg>',
store:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
bell:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
eye:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
gear:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
sword:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 9 15M20 4h-5M20 4v5M6 12l6 6M4 20l4-4"/></svg>',
shield:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
lock:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
chest:'<svg class="ic" viewBox="0 0 24 24"><path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v9H3z" fill="#c9792a" stroke="#5a2f08" stroke-width="2" stroke-linejoin="round"/><path d="M3 12h18" stroke="#5a2f08" stroke-width="2"/><rect x="10" y="10" width="4" height="5" rx="1" fill="#ffcf3a" stroke="#5a2f08" stroke-width="1.5"/></svg>',
cap:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>',
bolt:'<svg class="ic" viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="#ffcf3a" stroke="#b86d00" stroke-width="1.8" stroke-linejoin="round"/></svg>',
flag:'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h13l-3 4 3 4H5"/></svg>'
};
function cur(k,n,cls){return '<span class="'+(cls||"")+'" style="white-space:nowrap">'+IC[k]+" "+fmt(n)+"</span>";}

/* ---------------- game data ---------------- */
var FACTIONS={
  solari:{nm:"Solari Dawn",c1:"#ffb629",c2:"#ff5d3a",perk:"+8% damage",dmg:1.08,hp:1,spd:1},
  verdant:{nm:"Verdant Pact",c1:"#4dea82",c2:"#12b3a6",perk:"+10% health",dmg:1,hp:1.1,spd:1},
  voidborn:{nm:"Voidborn",c1:"#c183ff",c2:"#4d7dff",perk:"+10% speed",dmg:1,hp:1,spd:1.1}
};
// squad = soldiers per deploy, cp = command points per deploy, pw = power rating per soldier
var CLASSES={
  trooper:{nm:"Trooper",ul:1,hp:62,dmg:9,rng:26,spd:46,cd:.7,cost:24,squad:4,cp:2,pw:10,r:9,d:"Cheap, dependable line infantry."},
  ranger:{nm:"Ranger",ul:2,hp:36,dmg:12,rng:112,spd:40,cd:1.05,cost:42,squad:3,cp:3,pw:12,r:8.5,ranged:1,d:"Long range, fragile. Loves high ground."},
  guardian:{nm:"Guardian",ul:3,hp:170,dmg:8,rng:22,spd:30,cd:.9,cost:70,squad:2,cp:3,pw:18,r:11,armor:.3,d:"Shield wall. Takes 30% less damage."},
  raider:{nm:"Raider",ul:5,hp:50,dmg:15,rng:20,spd:78,cd:.6,cost:78,squad:3,cp:3,pw:16,r:8.5,vsRanged:1.7,d:"Fast flanker. Shreds ranged units."},
  bombard:{nm:"Bombardier",ul:7,hp:44,dmg:34,rng:152,spd:24,cd:2.4,cost:140,squad:1,cp:4,pw:30,r:11,ranged:1,splash:36,vsStruct:2.2,d:"Slow artillery. Splash damage, wrecks forts."},
  medic:{nm:"Medic",ul:9,hp:48,dmg:0,rng:66,spd:42,cd:.5,cost:120,squad:1,cp:3,pw:14,r:8.5,heal:9,d:"Heals nearby soldiers. Keep it behind the line."},
  lancer:{nm:"Lancer",ul:12,hp:96,dmg:24,rng:24,spd:96,cd:.8,cost:185,squad:2,cp:4,pw:34,r:10.5,charge:3,d:"Hover cavalry. First strike hits triple."},
  titan:{nm:"Titan",ul:15,hp:560,dmg:44,rng:60,spd:22,cd:1.4,cost:480,squad:1,cp:6,pw:110,r:17,splash:22,d:"Walking fortress. One soldier, one army."}
};
var CLS=Object.keys(CLASSES);
var PUPS={
  strike:{nm:"Airstrike",d:"Tap the field: heavy blast in a wide area.",col:"#ff9a3d"},
  heal:{nm:"Med Wave",d:"Instantly heal every soldier by 45%.",col:"#8dff5a"},
  rage:{nm:"Rage",d:"8 seconds of +50% damage and speed.",col:"#ff4fa3"},
  shield:{nm:"Aegis",d:"6 seconds: your soldiers take 60% less damage.",col:"#2fe6ff"}
};
var GEAR={
  weapon:{nm:"Weapons",stat:"damage",names:["Scrap Rifles","Pulse Carbines","Plasma Rifles","Arc Lances","Nova Cannons","Singularity Arms"]},
  armor:{nm:"Armor",stat:"health",names:["Padded Vests","Plate Rigs","Reactive Plating","Hardlight Shells","Titan Weave","Eternity Plate"]},
  engine:{nm:"Vehicles",stat:"speed",names:["Field Boots","Scout Bikes","Hover Sleds","Grav Skiffs","Warp Striders","Phase Engines"]},
  optic:{nm:"Optics",stat:"range",names:["Iron Sights","Red Dots","Smart Scopes","Drone Spotters","Orbital Uplink","Oracle Array"]}
};
var GEAR_LV=[1,3,7,10,13,16];
var TIER=["Outpost","City","State Fortress","Capital","World Core"];
var TIERS=["base","city","state","country","core"];
var T_SCORE=[1800,3200,4500,6000,9000],T_COIN=[46,130,300,640,1500],T_XP=[20,46,92,180,420],T_ALLOY=[0,3,8,20,50],T_INC=[4,11,26,64,180],T_DUR=[55,80,95,115,150];
var THEMES=[
  {nm:"Verdis",g1:"#3fae63",g2:"#17603f",acc:"#b7ff7a",sea:"#1f77d6",rock:"#586a60",tree:"#0e5c34",bias:"cover",d:"Forest world. Lots of cover."},
  {nm:"Emberfall",g1:"#c2552e",g2:"#611d1b",acc:"#ffc24a",sea:"#ff7a2a",rock:"#3d2424",tree:"#8a3414",bias:"high",d:"Volcanic ridges. High ground everywhere."},
  {nm:"Glacius",g1:"#8bcdf0",g2:"#2e66a6",acc:"#f0fdff",sea:"#c9f3ff",rock:"#5f83ad",tree:"#e2f7ff",bias:"choke",d:"Ice canyons. Narrow choke points."},
  {nm:"Dune",g1:"#e0b257",g2:"#8f6026",acc:"#fff0a8",sea:"#cf9230",rock:"#7d5d3c",tree:"#66822e",bias:"open",d:"Open desert. Nowhere to hide."},
  {nm:"Neon Reef",g1:"#8447da",g2:"#2c1676",acc:"#5ff0ff",sea:"#ff5bab",rock:"#3d2d80",tree:"#39e8ff",bias:"fort",d:"Fortified megacities."}
];
var TERR={open:{nm:"Open ground",d:"Few obstacles. Raw strength decides it."},cover:{nm:"Cover",d:"Forest and ruins: units inside take 35% less ranged damage."},high:{nm:"High ground",d:"Ridges: units standing on them deal +20% damage with +15% range."},choke:{nm:"Choke point",d:"A wall with narrow gaps. Hold the gap or get funneled."},fort:{nm:"Fortress",d:"Walled stronghold with extra turrets. Bring Bombardiers."}};
var RANKS=[[1,"Recruit"],[3,"Sergeant"],[6,"Captain"],[9,"Commander"],[12,"General"],[15,"Warlord"],[20,"Overlord"],[30,"Star Emperor"]];
function rankOf(l){var r=RANKS[0][1];RANKS.forEach(function(x){if(l>=x[0])r=x[1];});return r;}
var UNLOCKS=[[2,"Ranger squads"],[2,"Mess Hall: your army now needs food"],[3,"Guardian squads"],[3,"Tier 2 gear"],[3,"Fortress upgrades (rivals start raiding you)"],[4,"Alliances and joint attacks"],[5,"Raider squads"],[6,"Feeding autopilot"],[7,"Bombardier squads"],[7,"Tier 3 gear"],[9,"Medic squads"],[10,"Tier 4 gear"],[12,"Lancer squads"],[13,"Tier 5 gear"],[15,"Titan squads"],[16,"Tier 6 gear"]];
var SKINS={
  std:{nm:"Faction Colors",how:"Default"},
  chrome:{nm:"Chrome Legion",c1:"#e8eef7",c2:"#7f93b8",coins:900,how:"900 coins"},
  inferno:{nm:"Inferno",c1:"#ff5a2a",c2:"#7a0b0b",lvl:8,how:"Reach level 8"},
  aurora:{nm:"Aurora",c1:"#5fffd0",c2:"#7a5bff",gems:150,how:"150 gems"},
  royal:{nm:"Royal Gold",c1:"#ffe27a",c2:"#b8860b",gems:240,how:"240 gems"}
};
var EVENTS=[
  {nm:"Meteor Festival",col:"#ff9a3d",skin:{id:"ev_meteor",nm:"Meteor Guard",c1:"#ffb347",c2:"#ff3d6e"}},
  {nm:"Frostfall Games",col:"#7fd8ff",skin:{id:"ev_frost",nm:"Frostfall Elite",c1:"#d9f6ff",c2:"#3aa0ff"}},
  {nm:"Neon Carnival",col:"#ff4fa3",skin:{id:"ev_neon",nm:"Carnival Neon",c1:"#ff5bd0",c2:"#2fe6ff"}},
  {nm:"Harvest of Stars",col:"#8dff5a",skin:{id:"ev_harvest",nm:"Starharvest",c1:"#d7ff6a",c2:"#1fbf6a"}}
];
var PASS_PTS=[40,100,180,280,400,560,760,1000];
var GP={spin:30,shield:60,revive:40,prot:60,xp:80,skip:250,pups:70,general:120,freeze:40,pass:300,evskin:250,starter:20};
var ALLIES=[{nm:"Crimson Pact",col:"#ff5468"},{nm:"Star Syndicate",col:"#2fe6ff"},{nm:"Iron Lotus",col:"#8dff5a"}];
var BOTN=["Kragmoor","NovaQueen","xX_Vex_Xx","IronTide","Zyra","Mako77","LordPickle","Astra","Brakka","SilentFox","Quillon","DuneRat","Hexa","Tornwing","Juno","Okabe","Rustbolt","Mirelle","Vanta","GrimLoaf","Peachy","Solenne","Draxis","Wobble","Kestrel","Ymir","Fennec","Onyx","Talon","Bex"];
var BOTC=["#ff5468","#ff9a3d","#2fe6ff","#8dff5a","#ff4fa3","#a66bff","#ffe27a","#5d8bff","#3fe3b0","#ff7a5c"];

/* ---------------- the hooks (from the deck) ---------------- */
var HOOKS={
h1:{n:"#1",t:"Endless game",d:"There is no final level. Every conquered world reveals another, so you never get the feeling of being finished."},
h2:{n:"#2",t:"Progress bars and levels",d:"XP bars fill fast early on. Each small jump feels like a win, and you start chasing the next one."},
h3:{n:"#3",t:"Unlocks over time",d:"Showing you what is locked makes you want it. You keep playing to reach things you have only seen as silhouettes."},
h3b:{n:"#3b",t:"Achievements",d:"Badges and titles are mini-wins outside of battle. They feel like proof you are improving, so you collect them."},
h4:{n:"#4",t:"Control and decisions",d:"You pick the targets, the deployment and the retreat. Feeling in control makes you more attached and more likely to try again."},
h4b:{n:"#4b",t:"Guided hints",d:"A tip always points at a next step, so you never hit a moment of boredom where you might close the game."},
h5:{n:"#5",t:"Multiple fronts",d:"Anything you own can be taken back while you look elsewhere. You can never fully relax."},
h6:{n:"#6",t:"Real losses",d:"Losing soldiers, gear or land hurts more than winning feels good. One loss turns into several sessions of winning it back."},
h7:{n:"#7",t:"Offline vulnerability",d:"You earn nothing while away, but you can still be attacked. Checking in starts to feel like protecting yourself."},
h8:{n:"#8",t:"Streaks and daily rewards",d:"A streak is a chain you do not want to break. Missing a day feels like losing something you earned."},
h9:{n:"#9",t:"Quests that refill forever",d:"Finish a quest and another takes its place immediately. The to-do list never empties."},
h10:{n:"#10",t:"Harder quests, slightly better rewards",d:"Quest targets grow faster than the rewards do. It stays just barely worth it, so you play longer for the same payoff."},
h10b:{n:"#10b",t:"Difficulty spikes while online",d:"Sudden ambushes and surprise attacks only happen while you are playing. Stress makes people react fast and stay."},
h11:{n:"#11",t:"Needs grow faster than income",d:"A bigger army eats more and costs more to upgrade. You earn more too, but never quite enough, which nudges you toward grinding or shortcuts."},
h12:{n:"#12",t:"Customization and identity",d:"Once you have named it and dressed it, quitting feels like abandoning something you built."},
h13:{n:"#13",t:"Chat, badges and status",d:"Chat keeps you connected and badges show rank in public. People come back to keep up their reputation. Here the rival commanders are AI."},
h13b:{n:"#13b",t:"Leaderboards and tournaments",d:"Seeing your rank slip is a reason to play more. The top AI rivals here are tuned to stay a little ahead of you, so there is always someone to chase."},
h14:{n:"#14",t:"Seasonal events and limited items",d:"A countdown on something that may never come back makes showing up feel necessary."},
h15:{n:"#15",t:"Hidden treasure and surprise drops",d:"Random rewards hit harder than predictable ones. Not knowing what is inside is the whole point."},
h16:{n:"#16",t:"Wheel spins and near-misses",d:"Many games steer the wheel to stop right beside the jackpot, because almost winning makes people spin again. This wheel is fair and shows its odds."},
h17:{n:"#17",t:"Notifications",d:"Alerts about attacks, timers and rewards are built to interrupt you. Just checking turns into playing."},
h18:{n:"#18",t:"Speed and bright visuals",d:"Fast battles, flashes and instant feedback keep attention locked and make it hard to stop mid-session."},
m1:{n:"$1",t:"Optional but tempting",d:"Pressure rises over time and premium shortcuts are always one tap away. In a paid game this is where the money comes in. Here the shortcuts cost gems you earned."},
m2:{n:"$2",t:"First-time offer (price anchor)",d:"A cheap one-time starter deal sets what a normal price feels like, so later prices seem reasonable."},
m3:{n:"$3",t:"Purchase-only currency",d:"Most games sell their premium currency for real money. Here gems are only ever earned, but they still sit apart from the normal economy so spending them feels like special access."},
m4:{n:"$4",t:"Multiple currencies",d:"Coins become stamps, gems become spins or boosts. Splitting value across currencies makes each spend feel smaller than it is."},
m5:{n:"$5",t:"Leftover currency",d:"Prices rarely match what you hold. Being a few gems short, or having a few left over, keeps you playing toward the next purchase."},
m6:{n:"$6",t:"Bundles and a price ladder",d:"Bundles show better value than single buys, so spending more feels like the smart choice."},
m7:{n:"$7",t:"Currencies paced differently",d:"Coins flow steadily so you keep playing. Alloy trickles in and is tied to the strongest upgrades, so it always feels scarce."},
m8:{n:"$8",t:"Timed pop-ups",d:"Offers appear right when you feel something: after a loss, before a big fight, or one step from an unlock."},
m9:{n:"$9",t:"Buying XP and power-ups",d:"Paying to skip is framed as saving time. It is most tempting right after a loss or right before an unlock."},
m10:{n:"$10",t:"Paid autopilot",d:"A free general exists, but the premium one is better and even attacks while you are away. Premium currency replaces time."},
m11:{n:"$11",t:"Paid protection and recovery",d:"Shields, revives and loss protection feel like saving what you already earned instead of buying something new."},
m12:{n:"$12",t:"Limited skins and bundles",d:"Cosmetics that may not return create urgency, and they double as status in chat."},
m13:{n:"$13",t:"Event pass and premium track",d:"You can see the premium rewards you have already earned sitting locked. Buying feels like unlocking what is already yours."},
m14:{n:"$14",t:"Small purchases add up",d:"One more spin, one more boost. Each feels minor. The running total is the part games rarely show you."}
};
var HOOK_ORDER=["h1","h2","h3","h3b","h4","h4b","h5","h6","h7","h8","h9","h10","h10b","h11","h12","h13","h13b","h14","h15","h16","h17","h18","m1","m2","m3","m4","m5","m6","m7","m8","m9","m10","m11","m12","m13","m14"];
function hk(id){var h=HOOKS[id];return '<span class="hk" data-a="hook" data-v="'+id+'">HOOK '+h.n+"</span>";}
function hit(id,n){if(!S)return;S.hooks[id]=(S.hooks[id]||0)+(n||1);}

/* ---------------- state ---------------- */
var S=null;
function fresh(){
  return {v:VER,gen:0,seed:(Math.random()*2e9)|0,born:now(),seen:now(),name:"",faction:"",flag:{em:0,c1:"#ffb629",c2:"#1a1757"},skin:"std",skins:["std"],
    lvl:1,xp:0,xpTot:0,coins:120,stamps:0,alloy:0,gems:30,
    army:{trooper:16},clv:{trooper:1},campX:0,pu:{strike:1,heal:1,rage:0,shield:0},
    gear:{weapon:null,armor:null,engine:null,optic:null},fort:1,ench:0,
    fedU:0,fedQ:1,feedAuto:{on:false,q:1,cap:true,buy:true},cap:0,capU:0,capCyc:0,capFeed:true,
    worlds:[],cur:0,vault:0,raidT:200,threat:null,raidCd:0,chest:null,chestT:90,
    quests:[],qn:0,ach:{},
    stats:{wins:0,losses:0,battles:0,kills:0,lost:0,spins:0,nearMiss:0,spent:0,buys:0,topups:0,popups:0,popupBuys:0,chests:0,defends:0,defLost:0,nodesLost:0,time:0,feeds:0,captures:0,recruits:0,upgrades:0,puUsed:0,collected:0,gemsSpent:0,spikes:0,alerts:0,hints:0,autoBattles:0,retreats:0,sessions:0,away:0,captives:0,quests:0,lensOpens:0,report:0,gemsEarned:30,capT:[0,0,0,0,0]},
    hooks:{},lens:false,mute:false,
    streak:{d:0,last:"",best:0,freeze:0},shieldU:0,genU:0,lossProt:0,
    ally:-1,allyCd:0,campCd:0,campU:0,
    ev:{id:-1,pts:0,cf:0,cp:0,prem:false},tour:{id:-1,pts:0},
    offers:{starter:true,shownStarter:false,last:0,near:0,siege:{}},alerts:[],alertCfg:{attack:true,land:true,event:true,streak:true,quest:true},
    chat:[],lastDay:"",tut:0,total:0,lastRank:0,lastDead:{},spinDay:"",mile:{}};
}
function load(){
  try{var d=JSON.parse(localStorage.getItem(SAVEKEY));if(d&&d.v===VER&&d.worlds){var f=fresh();for(var k in f){if(d[k]===undefined)d[k]=f[k];else if(f[k]&&typeof f[k]==="object"&&!Array.isArray(f[k])&&d[k]&&typeof d[k]==="object"){for(var j in f[k])if(d[k][j]===undefined)d[k][j]=f[k][j];}}return d;}}catch(e){}
  return fresh();
}
var saveT=0;
function save(){if(!S)return;S.seen=now();try{localStorage.setItem(SAVEKEY,JSON.stringify(S));}catch(e){}if(window.LZ&&window.LZ_GAME)try{LZ.save(LZ_GAME);}catch(e){}}
function dirty(){if(!saveT)saveT=setTimeout(function(){saveT=0;save();},900);}

/* ---------------- audio ---------------- */
var AC=null,lastHit=0;
function tone(f,d,type,vol,slide,delay){
  if(!S||S.mute)return;
  try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
    var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||"square";o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t+d);
    g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02);}catch(e){}
}
function snd(k){
  if(k==="tap")tone(520,.06,"square",.03);
  else if(k==="coin"){tone(880,.07,"square",.04);tone(1320,.1,"square",.04,0,.06);}
  else if(k==="hit"){var n=now();if(n-lastHit<70)return;lastHit=n;tone(rnd(150,240),.05,"sawtooth",.025,80);}
  else if(k==="boom")tone(120,.35,"sawtooth",.08,35);
  else if(k==="deploy")tone(300,.12,"triangle",.06,620);
  else if(k==="win")[523,659,784,1047].forEach(function(f,i){tone(f,.22,"square",.05,0,i*.11);});
  else if(k==="lose")[392,330,262,196].forEach(function(f,i){tone(f,.28,"sawtooth",.045,0,i*.14);});
  else if(k==="lvl")[523,784,1047,1319,1568].forEach(function(f,i){tone(f,.18,"square",.05,0,i*.08);});
  else if(k==="tick")tone(1200,.03,"square",.025);
  else if(k==="alert"){tone(740,.14,"square",.06);tone(540,.2,"square",.06,0,.15);}
  else if(k==="jack")[784,988,1175,1568,1976].forEach(function(f,i){tone(f,.2,"square",.06,0,i*.07);});
  else if(k==="bad")tone(180,.25,"sawtooth",.05,90);
}

/* ---------------- toasts ---------------- */
function toast(html,cls){var t=document.createElement("div");t.className="toast "+(cls||"");t.innerHTML=html;$("#toasts").appendChild(t);var all=$$("#toasts .toast");if(all.length>4)all[0].remove();setTimeout(function(){t.remove();},3300);}

/* ---------------- rivals (simulated players) ---------------- */
var _bots=null;
function bots(){
  if(_bots)return _bots;var r=rng(hash(S.seed+":bots"));_bots=[];
  var names=BOTN.slice();for(var i=names.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=names[i];names[i]=names[j];names[j]=t;}
  for(i=0;i<24;i++)_bots.push({i:i,nm:names[i],off:Math.round(-3+r()*9),c1:BOTC[Math.floor(r()*BOTC.length)],c2:BOTC[Math.floor(r()*BOTC.length)],em:Math.floor(r()*8),base:Math.round(60+Math.pow(r(),1.6)*5200),rate:.5+r()*1.6,al:Math.floor(r()*4)-1,chase:i<3?[1.9,1.42,1.16][i]:0});
  return _bots;
}
function botLvl(b){return Math.max(1,S.lvl+b.off);}
function botScore(b){var t=S.stats.time/60*.9+S.stats.away/3600*14;var v=b.base+b.rate*t*9;if(b.chase)v=Math.max(v,S.xpTot*b.chase+140*b.chase);return Math.round(v);}
function myRank(){var s=S.xpTot,r=1;bots().forEach(function(b){if(botScore(b)>s)r++;});return r;}
