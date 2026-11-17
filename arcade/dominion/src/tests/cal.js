const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  const p=await (await b.newContext({viewport:{width:1280,height:760}})).newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message));
  await p.goto('http://localhost:8765/arcade/dominion/',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#nameIn',{timeout:9000});
  await p.fill('#nameIn','Sim'); await p.click('[data-a=begin]'); await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{
    const res=[];
    function setup(lv){S.lvl=lv;S.campX=Math.floor(lv/2);const cap=campCap();const mix={trooper:.3,ranger:.24,guardian:.16,raider:.1,bombard:.1,medic:.04,lancer:.06};S.army={};S.clv={};
      Object.keys(mix).forEach(k=>{if(CLASSES[k].ul<=lv){S.army[k]=Math.round(cap*mix[k]);S.clv[k]=Math.max(1,classMaxLv()-1);}});
      const t=Math.max(1,gearTierMax()-1);Object.keys(GEAR).forEach(s=>S.gear[s]={t:t,l:2});S.fedU=Date.now()+1e7;S.pu={strike:2,heal:1,rage:1,shield:1};}
    for(const [ty,lv] of [[0,3],[1,4],[2,6],[3,7],[3,9],[4,9],[4,11]]){
      let w=0,l=0,tt=0,lost=0;const wd=W();
      for(let i=0;i<10;i++){setup(lv);closeModal(true);postBattle=null;pendingLv.length=0;wd.n.forEach(n=>{n.o=n.ty<ty?1:0;});const n=wd.n.find(n=>n.ty===ty);
        const nl=nodeLv(wd,n),mu=matchup(ty,nl)[0];attackNode(n.i,false,false);B.auto=true;B.adv=true;let g=0;while(B&&!B.over&&g++<9000)bStep(.05);
        const bb=B;B=null;document.querySelector('#battle').hidden=true;tt+=bb.t;let d=0;for(const k in bb.dead)d+=bb.dead[k];lost+=d;if(bb.outcome==='win')w++;else l++;res.label=mu+'@'+nl;}
      res.push(`ty${ty} L${lv} ${res.label}: ${w}W ${l}L avg ${(tt/10).toFixed(0)}s lost ${(lost/10).toFixed(0)} army ${campCap()}`);
    }
    return res;
  });
  console.log(out.join('\n'));await b.close();
})();
