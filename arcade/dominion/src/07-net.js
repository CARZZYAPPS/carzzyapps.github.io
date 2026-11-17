/* ================= shared world (Firestore) =================
   Signed-in commanders publish a camp snapshot, raid each other's snapshots, leave attack reports,
   share one leaderboard and one chat. Signed out, everything falls back to the AI rivals. */
var NET={on:false,uid:"",rivals:[],rivT:0,top:[],topT:0,msgs:[],unsub:null,pubT:0,sendT:0,hidden:{},admin:false,inboxT:0};
var BADW=["fuck","shit","bitch","asshole","dick","pussy","cunt","nigg","fag","retard","slut","whore","rape","porn","sex","nude","kys","kill yourself","hitler","nazi","penis","vagina","cock","bastard","damn","hell no"];
function chatClean(t){
  t=String(t||"").replace(/\s+/g," ").trim().slice(0,120);
  t=t.replace(/(https?:\/\/|www\.)\S+/gi,"[link removed]").replace(/\S+@\S+\.\S+/g,"[removed]").replace(/(\d[\s().-]?){7,}/g,"[removed]");
  var low=t.toLowerCase().replace(/[@4]/g,"a").replace(/[!1|]/g,"i").replace(/0/g,"o").replace(/3/g,"e").replace(/[$5]/g,"s");
  for(var i=0;i<BADW.length;i++){var w=BADW[i],at=low.indexOf(w);while(at>=0){t=t.slice(0,at)+"*".repeat(w.length)+t.slice(at+w.length);low=low.slice(0,at)+"*".repeat(w.length)+low.slice(at+w.length);at=low.indexOf(w);}}
  return t;
}
function netReady(){return !!(window.FS&&window.LZ&&LZ.signedIn&&LZ.signedIn()&&LZ.user&&S&&S.name);}
function netInit(){
  if(!netReady()){if(NET.unsub){try{NET.unsub();}catch(e){}NET.unsub=null;}NET.on=false;return;}
  if(NET.on&&NET.uid===LZ.user.uid)return;
  NET.on=true;NET.uid=LZ.user.uid;NET.pubT=0;
  try{var rl=LZ.roles&&LZ.roles();if(rl&&rl.then)rl.then(function(r){NET.admin=!!(r&&r[String(LZ.username||"").toLowerCase()]);});}catch(e){}
  netPublish();netInbox();netRivals();netTop();netChatSub();
}
function netCol(){return FS.collection.apply(null,[LZ.db].concat([].slice.call(arguments)));}
function netPublish(){
  if(!NET.on||now()-NET.pubT<45000)return;NET.pubT=now();
  var army={},clv={};CLS.forEach(function(k){if(S.army[k]>0){army[k]=Math.min(999,Math.round(S.army[k]));clv[k]=Math.min(99,S.clv[k]||1);}});
  FS.setDoc(FS.doc(LZ.db,"dominionPlayers",NET.uid),{name:S.name,lvl:S.lvl,xp:Math.round(S.xpTot),pw:Math.round(armyPower()),fort:S.fort,ench:S.ench,em:S.flag.em,c1:S.flag.c1,c2:S.flag.c2,army:army,clv:clv,wins:S.stats.wins,land:ownedCount(),sh:Math.round(S.shieldU),at:FS.serverTimestamp()}).catch(function(e){console.warn("dominion publish",e.code||e);});
}
function netRivals(){
  if(!NET.on||now()-NET.rivT<300000)return;NET.rivT=now();
  FS.getDocs(FS.query(netCol("dominionPlayers"),FS.where("lvl",">=",Math.max(1,S.lvl-2)),FS.where("lvl","<=",S.lvl+2),FS.limit(30))).then(function(sn){var a=[];sn.forEach(function(d){var x=d.data();x.uid=d.id;if(d.id!==NET.uid&&x.army&&!(x.sh>now()))a.push(x);});NET.rivals=a;}).catch(function(e){console.warn("dominion rivals",e.code||e);});
}
function netTop(cb){
  if(!NET.on)return;if(now()-NET.topT<60000){if(cb)cb();return;}NET.topT=now();
  FS.getDocs(FS.query(netCol("dominionPlayers"),FS.orderBy("xp","desc"),FS.limit(40))).then(function(sn){var a=[];sn.forEach(function(d){var x=d.data();x.uid=d.id;a.push(x);});NET.top=a;if(cb)cb();}).catch(function(e){console.warn("dominion ranks",e.code||e);});
}
// a real commander's camp as a raid target
function netTarget(){
  if(!NET.on||!NET.rivals.length||Math.random()<.2)return null;var t=pick(NET.rivals),n=0,sum=0;
  for(var k in t.clv){if(CLASSES[k]){sum+=t.clv[k];n++;}}
  return{uid:t.uid,name:String(t.name||"Commander").slice(0,16),lvl:clamp(t.lvl|0,1,S.lvl+3),army:t.army||{},avg:n?sum/n:1,fort:clamp(t.fort|0,1,40),ench:clamp(t.ench|0,0,5)};
}
function pvpArmy(pv,budget,r){
  var ks=Object.keys(pv.army).filter(function(k){return CLASSES[k]&&pv.army[k]>0;}),out=[],g=0;if(!ks.length)return rollArmy(budget,pv.lvl,r);
  var tot=0;ks.forEach(function(k){tot+=pv.army[k];});
  while(budget>.9&&g++<80){var x=r()*tot,ch=ks[0];for(var i=0;i<ks.length;i++){x-=pv.army[ks[i]];if(x<=0){ch=ks[i];break;}}if(ECOST[ch]>budget+.3)ch="trooper";out.push(ch);budget-=ECOST[ch];}
  return out;
}
function netReport(pv,win){
  if(!NET.on||!pv)return;var coins=win?Math.min(600,Math.round(40+14*S.lvl)):0;
  FS.addDoc(netCol("dominionInbox",pv.uid,"reports"),{from:NET.uid,name:S.name,win:!!win,coins:coins,at:FS.serverTimestamp()}).catch(function(e){console.warn("dominion report",e.code||e);});
}
function netInbox(){
  if(!NET.on||now()-NET.inboxT<120000)return;NET.inboxT=now();
  FS.getDocs(FS.query(netCol("dominionInbox",NET.uid,"reports"),FS.limit(12))).then(function(sn){
    var out={away:0,raids:[],auto:[],real:true},n=0;
    sn.forEach(function(d){var r=d.data();FS.deleteDoc(d.ref).catch(function(){});if(n>=3)return;n++;
      var by=String(r.name||"A commander").slice(0,16);
      if(r.win&&now()>S.shieldU){var c=Math.min(r.coins|0,Math.round(S.coins*.06)),nd="";S.coins-=c;
        if(Math.random()<.5){var opts=[];S.worlds.forEach(function(wd){wd.n.forEach(function(x){if(x.o===1&&x.ty<=1)opts.push([wd,x]);});});if(opts.length>4){var o=pick(opts);o[1].o=0;o[0].done=false;nd=o[1].nm;S.stats.nodesLost++;}}
        S.stats.defLost++;hit("h5");hit("h7");out.raids.push({win:false,by:by,node:nd||"your camp",coins:c});}
      else{var b=Math.round(20+10*S.lvl);S.coins+=b;S.stats.defends++;out.raids.push({win:true,by:by,node:"your camp",coins:b});}});
    if(out.raids.length){alertAdd("attack",out.raids.length+" commander"+(out.raids.length>1?"s":"")+" attacked you while you were away.");dirty();if(modalFree()&&!B)showAway(out);else renderAll();}
  }).catch(function(e){console.warn("dominion inbox",e.code||e);});
}
function netChatSub(){
  if(!NET.on||NET.unsub)return;
  try{NET.unsub=FS.onSnapshot(FS.query(netCol("dominionChat","global","msgs"),FS.orderBy("at","desc"),FS.limit(40)),function(sn){
    var a=[],had=NET.msgs.length?NET.msgs[NET.msgs.length-1].id:"";sn.forEach(function(d){var x=d.data();a.push({id:d.id,uid:x.uid,n:String(x.name||"").slice(0,16),l:x.lvl|0,t:String(x.text||"").slice(0,120)});});a.reverse();NET.msgs=a;
    if(a.length&&a[a.length-1].id!==had&&a[a.length-1].uid!==NET.uid&&!(tab==="social"&&sub.social==="chat")){chatNew++;hit("h13");}
    if(tab==="social"&&sub.social==="chat"&&modalFree()){var c=$("#chatBox");if(c){c.innerHTML=netChatHtml();c.scrollTop=c.scrollHeight;}}
  },function(e){console.warn("dominion chat",e.code||e);NET.unsub=null;});}catch(e){console.warn(e);}
}
function netChatHtml(){
  if(!NET.msgs.length)return '<div class="m sys">Nobody has said anything yet. Go first.</div>';
  return NET.msgs.filter(function(m){return !NET.hidden[m.id];}).map(function(m){return '<div class="m '+(m.uid===NET.uid?"me":"")+'"><span class="bd">'+rankOf(m.l||1)+"</span><b>"+esc(m.n)+":</b> "+esc(chatClean(m.t))+(m.uid===NET.uid||NET.admin?' <button class="mut" style="font-size:11px" data-a="chatDel" data-v="'+esc(m.id)+'">delete</button>':' <button class="mut" style="font-size:11px" data-a="chatFlag" data-v="'+esc(m.id)+'">report</button>')+"</div>";}).join("");
}
function netChatSend(t){
  if(!NET.on)return false;t=chatClean(t);if(!t)return false;
  if(now()-NET.sendT<3300){toast("Slow down a moment.");return false;}NET.sendT=now();
  var b=FS.writeBatch(LZ.db);b.set(FS.doc(netCol("dominionChat","global","msgs")),{uid:NET.uid,name:S.name,lvl:S.lvl,text:t,at:FS.serverTimestamp()});b.set(FS.doc(LZ.db,"dominionChatRate",NET.uid),{at:FS.serverTimestamp()});
  b.commit().catch(function(e){console.warn("dominion chat send",e.code||e);toast("Message not sent. Try again in a few seconds.","bad");});hit("h13");return true;
}
function netChatFlag(id){var m=NET.msgs.filter(function(x){return x.id===id;})[0];if(!m||!NET.on)return;NET.hidden[id]=1;
  FS.addDoc(netCol("dominionChatFlags"),{ch:"global",msg:id,text:m.t,by:NET.uid,at:FS.serverTimestamp()}).catch(function(){});toast("Reported. It is hidden for you and sent to the moderators.");var c=$("#chatBox");if(c)c.innerHTML=netChatHtml();}
function netChatDel(id){if(!NET.on)return;FS.deleteDoc(FS.doc(LZ.db,"dominionChat","global","msgs",id)).catch(function(e){toast("Could not delete that message.","bad");});}
