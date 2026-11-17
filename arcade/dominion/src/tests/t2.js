const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const ctx=await b.newContext({viewport:{width:1280,height:760}});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  await p.route(/cdnjs\.cloudflare\.com.*three/,r=>r.fulfill({path:'/home/claude/dom-test/node_modules/three/build/three.min.js',contentType:'application/javascript'}));
  await p.goto('http://localhost:8765/arcade/dominion/',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#nameIn',{timeout:9000});
  await p.fill('#nameIn','LazerYudel'); await p.click('[data-a=begin]'); await p.waitForTimeout(300); await p.click('[data-a=cont]'); await p.waitForTimeout(500);
  // give resources and levels so every screen has content
  await p.evaluate(()=>{S.coins=9000;S.alloy=400;S.gems=2000;S.stamps=500;addXP(6000);S.army={trooper:20,ranger:12,guardian:8,raider:6,bombard:4};S.clv={trooper:3,ranger:3,guardian:2,raider:2,bombard:2};const wd=W();wd.n.forEach(n=>{if(n.ty<=1&&n.i<30)n.o=1;});S.cap=5;S.capU=Date.now()+60000;S.capCyc=2;S.stats.capT=[10,4,0,0,0];S.stats.wins=12;flowNext();});
  for(let k=0;k<8;k++){const c=await p.$('[data-a=cont]');if(!c)break;await c.click();await p.waitForTimeout(200);}
  const seq=[['tab','army'],['sub','mess'],['feed','1'],['sub','caps'],['capJoin'],['sub','camp'],['recruit','ranger'],['upClass','trooper'],['expand'],
    ['tab','forge'],['gearBuy','weapon'],['gearUp','weapon'],['sub','fort'],['fortUp'],['enchant'],['buy','shield'],['buy','prot'],
    ['tab','quests'],['claimMain'],['sub','ach'],['sub','daily'],['buy','freeze'],['sub','event'],['buy','pass'],
    ['tab','social'],['sub','ally'],['allyJoin','1'],['campTog'],['sub','rank'],['sub','tour'],['sub','chat'],
    ['tab','store'],['starter'],['buy','xp'],['buy','pups'],['buy','general'],['sub','skins'],['skinBuy','chrome'],['skinBuy','aurora'],['sub','wheel'],['spin'],
    ['profile'],['em','3'],['fc1','#2fe6ff'],['saveName'],['menu'],['lens'],['report'],['close'],['alerts'],['close'],['menu'],['howto'],['close'],['tab','world']];
  for(const [a,v] of seq){await p.evaluate(([a,v])=>{const f=__dom.ACT[a];f(v,{dataset:{n:1},remove(){},classList:{toggle(){}}});},[a,v]);await p.waitForTimeout(a==='spin'?5200:120);
    for(let k=0;k<4;k++){const c=await p.$('#modal:not([hidden]) [data-a=cont]');if(!c)break;await c.click();await p.waitForTimeout(150);}}
  await p.screenshot({path:'u-world.png'});
  await p.evaluate(()=>__dom.ACT.tab('quests'));await p.waitForTimeout(200);await p.screenshot({path:'u-quests.png'});
  await p.evaluate(()=>{__dom.ACT.tab('store');sub.store='wheel';renderTab();});await p.waitForTimeout(300);await p.screenshot({path:'u-wheel.png'});
  // a city siege on fortress terrain with the general, watched in 3D
  await p.evaluate(()=>{closeModal(true);const wd=W();const n=wd.n.find(n=>n.ty===2);n.k.forEach(k=>wd.n[k].o=1);n.tr='fort';mapSel=-1;__dom.ACT.tab('world');attackNode(n.i,true,false);B.adv=true;});
  await p.evaluate(()=>{for(let g=0;g<500&&B&&!B.over;g++)bStep(.05);});await p.waitForTimeout(2500);await p.screenshot({path:'u-siege.png'});
  await p.evaluate(()=>{let g=0;while(B&&!B.over&&g++<9000)bStep(.05);if(B)B.endT=0;});await p.waitForFunction(()=>!__dom.B,{timeout:20000}).catch(()=>errs.push('siege did not end'));
  await p.waitForTimeout(500);await p.screenshot({path:'u-siege-result.png'});
  // defense battle + gauntlet + raid
  for(const kind of ['def','gauntlet','raid']){
    await p.evaluate((kind)=>{let g=0;while(!modalFree()&&g++<10)flowNext();closeModal(true);postBattle=null;S.raidCd=0;S.army={trooper:20,ranger:12,guardian:8,raider:6,bombard:4};
      if(kind==='def'){S.threat=null;spawnThreat();defendNow();}else if(kind==='gauntlet')startRaid(true,true);else startRaid(true);if(B){B.adv=true;B.spd=2;}},kind);
    await p.evaluate(()=>{for(let g=0;g<260&&B&&!B.over;g++)bStep(.05);});await p.waitForTimeout(1500);if(kind==='def')await p.screenshot({path:'u-def.png'});
    await p.evaluate(()=>{let g=0;while(B&&!B.over&&g++<9000)bStep(.05);if(B)B.endT=0;});await p.waitForFunction(()=>!__dom.B,{timeout:20000}).catch(()=>errs.push(kind+' did not end'));console.log(kind,await p.evaluate(()=>postBattle?postBattle.o+' score '+postBattle.score:'no result'));
  }
  // mobile portrait siege
  console.log('state',await p.evaluate(()=>JSON.stringify({lvl:S.lvl,w:S.stats.wins,l:S.stats.losses,gems:S.gems,hooks:Object.keys(S.hooks).length,mq:S.mq})));
  console.log('errors:',errs.length?errs.join('\n'):'none');
  await b.close();
})();
