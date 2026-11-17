const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  const p=await (await b.newContext({viewport:{width:1280,height:760}})).newPage();
  p.on('pageerror',e=>console.log('PAGEERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | ')));
  await p.goto('http://localhost:8765/arcade/dominion/',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#nameIn',{timeout:9000});
  await p.fill('#nameIn','Sim'); await p.click('[data-a=begin]'); await p.waitForTimeout(300);
  const out=await p.evaluate((maxB)=>{
    const log=[];let clock=0,wait=0;const lab={};
    function closeAll(){let g=0;while(!modalFree()&&g++<12){flowNext();}closeModal(true);postBattle=null;}
    function manage(){
      closeAll();
      if(S.vault>=1)ACT.collect();
      for(let i=0;i<3;i++)if(S.quests[i].p>=S.quests[i].n)claimQuest(i);
      for(const k in S.ach)if(S.ach[k]===1)ACT.claimA(k);
      while(S.ev.cf<passTier())ACT.passF();
      if(S.offers.starter&&S.gems>=GP.starter)claimStarter();
      if(S.threat){resolveThreat();}
      if(fedOn()&&now()>S.fedU){const c=feedCost(1)+(S.cap?capFeedCost():0);if(S.stamps<c){const need=Math.ceil((c-S.stamps)/20)*20;if(S.coins>=need*STAMP_PRICE){S.coins-=need*STAMP_PRICE;S.stamps+=need;}}feed(1,false)||feed(0,false);}
      if(S.cap&&S.capCyc>=2)ACT.capJoin(); if(S.cap&&S.capCyc>=2)ACT.ransom();
      // recruit: keep camp full, mix by unlocked classes
      const pref=['guardian','ranger','trooper','raider','bombard','medic','lancer','titan'].filter(k=>CLASSES[k].ul<=S.lvl);
      let guard=0;
      while(armySize()<campCap()&&guard++<200){
        const want={trooper:.35,ranger:.25,guardian:.15,raider:.1,bombard:.08,medic:.04,lancer:.08,titan:.03};let best=null,bd=-1;const n=armySize()||1;
        pref.forEach(k=>{const d=want[k]-(S.army[k]||0)/n;if(d>bd){bd=d;best=k;}});
        if(S.coins<recruitCost(best)){if(S.coins>=recruitCost('trooper'))best='trooper';else break;}
        ACT.recruit(best,{dataset:{n:1}});
      }
      // upgrades with spare coins
      guard=0;while(guard++<20){let did=false;
        const ks=Object.keys(S.army).filter(k=>S.army[k]>0&&(S.clv[k]||1)<classMaxLv()).sort((a,b)=>clsUpCost(a)-clsUpCost(b));
        if(ks.length&&S.coins>clsUpCost(ks[0])+150){ACT.upClass(ks[0]);did=true;}
        if(S.lvl>=3&&S.fort<2+S.lvl&&S.coins>fortCost()+400){ACT.fortUp();did=true;}
        if(S.campX<S.lvl&&S.coins>campCost()+300){ACT.expand();did=true;}
        if(!did)break;}
      Object.keys(GEAR).forEach(s=>{const g=S.gear[s],nt=g?g.t+1:1;if(nt<=gearTierMax()&&S.alloy>=gearCost(nt))ACT.gearBuy(s);else if(g&&g.l<gearMaxLv()&&S.alloy>=gearUpCost(g)+10)ACT.gearUp(s);});
      if(S.lvl>=4&&S.ally<0)S.ally=0;
    }
    for(let i=0;i<maxB;i++){
      manage();
      const wd=W();let opts=wd.n.filter(n=>attackable(wd,n)).sort((a,b)=>a.ty-b.ty);
      if(!opts.length){if(S.cur<S.worlds.length-1){S.cur++;continue;}log.push('no targets');break;}
      const n=opts[0],lv=nodeLv(wd,n),mu=matchup(n.ty,lv)[0];
      let kind='atk';
      if(S.mq!==undefined&&mainQ().f())claimMain();
      if((mu==='Deadly'||(mu==='Hard'&&n.ty>=2))||armySize()<campCap()*.6){if(armySize()>=14&&Math.random()<.5){kind='raid';S.raidCd=0;startRaid(false);}else{for(let k=0;k<45;k++)tick();S.fedU-=45000;clock+=45;wait=(wait||0)+1;if(wait<400){i--;continue;}}}
      else attackNode(n.i,false,false);
      if(!B&&kind==='atk'){attackNode(n.i,false,false);}
      if(!B){log.push('no battle');break;}
      B.auto=true;B.adv=true;const pu0=JSON.stringify(S.pu);
      let g=0;while(B&&!B.over&&g++<8000)bStep(.05);
      const bb=B,t=bb.t;B=null;document.querySelector('#battle').hidden=true;const army0=armySize(bb.res);
      battleDone(bb);
      closeAll();const dt=Math.round(t+30);clock+=dt;for(let k=0;k<dt;k++){S.fedU-=0;tick();}
      // simulate wall clock for fed timers
      S.fedU-=dt*1000;S.capU-=dt*1000;
      const key=kind+n.ty+'/'+mu;lab[key]=lab[key]||[0,0];lab[key][bb.outcome==='win'?0:1]++;log.push([i,(clock/60).toFixed(1)+'m','L'+S.lvl,kind+n.ty+'@'+lv,mu,bb.outcome,t.toFixed(0)+'s','army '+armySize()+'/'+campCap(),'c'+Math.round(S.coins),'a'+S.alloy,'g'+S.gems,'own '+ownedCount(),'lost '+S.stats.lost,'tot '+S.total].join(' '));
      if(wd.done&&S.cur===0&&S.worlds.length>1){log.push('WORLD 1 DONE at '+(clock/60).toFixed(1)+'m, LP '+Math.round(S.total*.04)+' → '+(S.total*.04/(clock/60)).toFixed(0)+' LP/min');S.cur=1;}
    }
    log.push(JSON.stringify(lab));log.push('waits '+wait);log.push(JSON.stringify({lvl:S.lvl,wins:S.stats.wins,losses:S.stats.losses,clv:S.clv,gear:S.gear,fort:S.fort,nodesLost:S.stats.nodesLost,def:S.stats.defends,gemsE:S.stats.gemsEarned,army:S.army,q:S.stats.quests}));
    return log;
  },+process.argv[2]||80);
  console.log(out.join('\n'));
  await b.close();
})();
