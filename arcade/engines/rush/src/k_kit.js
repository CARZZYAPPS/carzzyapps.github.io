
/* ================= RUSH KIT: run the engine from a creator's data pack ================= */
var KIT={title:'Rush',kit:{}},KX={store:{},saveKey:'',mods:[],vars:{},fired:{},stPrev:{},hz:[],props:[],hooks:{},every:[],scriptOk:false,typeMap:{}};
// Saves go to the parent page (the game runs in a sandboxed frame with no storage of its own).
var localStorage={getItem:function(k){return KX.store[k]==null?null:KX.store[k];},setItem:function(k,v){KX.store[k]=String(v);try{if(KX.persist)parent.postMessage({type:'rush-save',key:k,data:String(v)},'*');}catch(e){}},removeItem:function(k){delete KX.store[k];}};
function kcol(c,d){if(typeof c==='number')return c;if(typeof c==='string'&&/^#?[0-9a-f]{6}$/i.test(c))return parseInt(c.replace('#',''),16);return d;}
var KIND_KEYS=['coffee','bakery','juice','icecream'];
function applyPack(P){
  KIT=P;var k=P.kit=P.kit||{};
  SAVEKEY='rushkit';
  if(k.dayLen)DAYLEN=Math.max(60,Math.min(300,+k.dayLen||150));
  // products (bases)
  Object.keys(k.bases||{}).forEach(function(id){var b=k.bases[id];BASES[id]={name:b.name,vessel:b.model?'custom':(b.vessel||'cup'),model:b.model||null,liq:kcol(b.liq,0x6b3a1f),mug:kcol(b.mug,0xe9584a),food:b.food||undefined,scoop:kcol(b.scoop,0xfff1d6),lv:b.lv||undefined};
    if(BASES[id].vessel!=='plate')delete BASES[id].food;});
  Object.keys(k.toppings||{}).forEach(function(id){var t=k.toppings[id];TOPS[id]={name:t.name,col:kcol(t.col,0xffffff),vis:t.vis||'dollop',box:t.box||'tub',model:t.model||null};if(VIS_ORDER.indexOf(id)<0)VIS_ORDER.push(id);});
  // machines: any number; each has an archetype (how it works) and a look (built-in machine or a custom model)
  var ids=[];
  (k.stations||[]).forEach(function(s,i){
    var id=s.id||('k_st'+i),look=s.look||s.model,arch=s.kind||(STN[look]&&STN[look].kind)||'cooker';if(ids.indexOf(id)>=0)id=id+'_'+i;
    var base=STN[look]||(arch==='batch'?STN.drip:STN.espresso);
    var o=Object.assign({},base,{name:s.name||base.name,kind:arch,makes:s.makes,time:+s.time||base.time||5,lvl:+s.lvl||1,cost:+s.cost||0,desc:s.desc||base.desc||'',w:+s.w||(s.custom?1.2:base.w||1),spd:+s.spd||base.spd||80,look:look,custom:(k.models||{})[look]?look:null,kitId:id});
    if(arch==='cooker'){o.burn=+s.burn||base.burn||6;o.slots=s.slots?[+s.slots,+s.slots+1,+s.slots+2]:(base.slots||[2,3,4]);delete o.role;}
    else{o.serv=s.serv?[+s.serv,+s.serv+1,+s.serv+2]:(base.serv||[4,5,6]);o.stale=+s.stale||base.stale||30;o.role=TOPS[s.makes]&&!BASES[s.makes]?'comp':'base';delete o.slots;}
    STN[id]=o;ids.push(id);
    M[id]=o.custom?kitStationFactory(k.models[look]):(KIT_BUILTIN_M[look]||KIT_BUILTIN_M[arch==='batch'?'drip':'espresso']);
  });
  KX.stIds=ids;
  // shop types (industries)
  var types=k.types&&k.types.length?k.types:[{id:'main',name:k.name||'Shop',lvl:1,pm:1,cm:1,wm:1,theme:k.theme||{},stations:ids,start:null,toppings:null,customers:null,rivals:k.rivals}];
  Object.keys(IND).forEach(function(x){delete IND[x];});IND_ORDER.length=0;KX.typeMap={};
  types.forEach(function(t,ti){
    var key=KIND_KEYS[ti]||('kt'+ti);KX.typeMap[t.id||key]=key;
    var sts=(t.stations||ids).map(function(x){return KX.stIdMap?KX.stIdMap[x]:x;}).filter(function(x){return STN[x];});
    var start=(t.start&&t.start.length?t.start:sts.filter(function(m){return STN[m].lvl<=Math.max(1,+t.lvl||1);})).filter(function(m){return sts.indexOf(m)>=0;});if(!start.length&&sts.length)start=[sts[0]];
    var compMade={};sts.forEach(function(m){if(STN[m].role==='comp')compMade[STN[m].makes]=1;});
    var tops={},tl=t.toppings||Object.keys(k.toppings||{});tl.forEach(function(id){var tp=(k.toppings||{})[id];if(tp&&!compMade[id])tops[id]={lvl:Math.max(+tp.lvl||1,+t.lvl||1),cost:+tp.cost||60};});
    var th=t.theme||k.theme||{},T0={wall:0x3f8f7a,wall2:0x2c6a5a,accent:0xffb83d,counter:0xa0663f,top:0xf4e8d6,trim:0x5b3a25,flA:0xf6ead6,flB:0xddb48c,stn:0xe2553f},theme={};
    Object.keys(T0).forEach(function(c){theme[c]=kcol(th[c],T0[c]);});
    var R=(k.recipes||[]).filter(function(r){return BASES[r.base]&&(!r.type||r.type===(t.id||key)||types.length===1);}).map(function(r){var o={base:r.base,comps:(r.comps||[]).filter(function(c){return TOPS[c];}).slice().sort(),name:r.name,price:+r.price||3,w:+r.w||2,tags:(r.tags||'').split(' ').filter(Boolean),ind:key};o.key=rkey(o.base,o.comps);return o;});
    var RM={};R.forEach(function(r){RM[r.key]=r;});
    var hero=R.length?[R[R.length-1].base].concat(R[R.length-1].comps).join('+'):'';
    IND[key]={id:key,kitId:t.id||key,name:t.name||'Shop',lvl:ti?Math.max(2,+t.lvl||ti*8):1,pm:+t.pm||1,cm:+t.cm||1,wm:+t.wm||1,stations:sts.concat(Object.keys(tops).length?['rack']:[]),start:start.slice(0,3),tops:tops,theme:theme,hero:hero,R:R,RM:RM,customers:t.customers||null};
    IND_ORDER.push(key);
    RIVALS[key]=(t.rivals&&t.rivals.length?t.rivals:(k.rivals&&k.rivals.length?k.rivals:RIVALS.coffee||['The Competition'])).slice();
  });
  if(k.rack)STN.rack=Object.assign({},STN.rack,{name:k.rack.name||STN.rack.name,desc:k.rack.desc||STN.rack.desc});
  if(k.districts&&k.districts.length){DIST0.length=0;k.districts.forEach(function(d,i){DIST0.push({id:i?'k'+i:'main',kitName:d.id||'',name:d.name||('District '+(i+1)),lvl:i?Math.max(2,+d.lvl||i*2+2):1,cost:i?Math.max(100,+d.cost||1500*i):0,demand:+d.demand||1,pat:+d.pat||1,tips:+d.tips||1,price:+d.price||1,am:d.am==null?1:+d.am,lunch:d.lunch==null?1:+d.lunch,eve:d.eve==null?.5:+d.eve,big:d.big?1:0,pref:d.pref||{},ev:(d.ev||[]).slice(),win:d.win||'street',twist:d.twist||'',rep:d.rep?+d.rep:undefined,scene:d.scene||null});});}
  if(k.cities&&k.cities.length){CITY_NAMES.length=0;k.cities.forEach(function(c){CITY_NAMES.push(c);});}
  // staff, sizes, HQ, holdings, marketing, dirty tricks, price tiers: names and numbers
  var st=k.staff||{};Object.keys(st).forEach(function(r){if(ROLES[r])['name','desc','lvl','cost','wage'].forEach(function(f){if(st[r][f]!=null&&st[r][f]!=='')ROLES[r][f]=typeof ROLES[r][f]==='number'?+st[r][f]:st[r][f];});if(st[r].col)ROLES[r].col=kcol(st[r].col,ROLES[r].col);});
  (k.sizes||[]).forEach(function(z,i){var S=SIZES[i+1];if(!S)return;['name','spots','tray','stations','cost','dem'].forEach(function(f){if(z[f]!=null&&z[f]!=='')S[f]=f==='name'?z[f]:+z[f];});});
  [['hq',HQ],['hold',HOLD],['mkt',MKT],['sab',SAB]].forEach(function(pr){var src=(k.names||{})[pr[0]]||{};Object.keys(src).forEach(function(id){if(!pr[1][id])return;['name','eff','desc'].forEach(function(f){if(src[id][f])pr[1][id][f]=src[id][f];});
    if(pr[0]==='hold'&&src[id].ind!=null){var key=KX.typeMap[src[id].ind]||src[id].ind;pr[1][id].need={ind:key,n:+src[id].n||1};}});});
  (k.prices||[]).forEach(function(p,i){if(PRICE_T[i]&&p&&p.name)PRICE_T[i].name=p.name;});
  KX.terms=buildTerms(k.terms||{});KX.currency=k.currency||'';
  KX.rules=(k.rules||[]).slice();KX.hazards=k.hazards||{};KX.customers=k.customers||[];KX.variants=k.variants||{};KX.scene=k.scene||null;KX.models=k.models||{};
  KX.text=k.text||{};
  document.title=(P.title||'Rush game')+' | Lazer Arcade Community';
}
function buildTerms(t){var pairs=[];Object.keys(t).forEach(function(a){var b=t[a];if(!a||b==null)return;pairs.push([a,b]);});pairs.sort(function(x,y){return y[0].length-x[0].length;});
  return pairs.map(function(p){var a=p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return {re:new RegExp('\\b'+a+'\\b','gi'),from:p[0],to:p[1]};});}
function kitScore(total){try{parent.postMessage({type:'rush-score',score:total},'*');}catch(e){}}
function kitStartTops(ind){var o={},T_=IND[ind]&&IND[ind].tops||{},n=0;Object.keys(T_).forEach(function(t){if(n<5&&T_[t].lvl<=1&&!+((KIT.kit.toppings||{})[t]||{}).cost){o[t]=1;n++;}});return o;}
