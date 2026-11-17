const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  for(const [nm,vp] of [['m',{width:390,height:780}],['d',{width:1280,height:760}]]){
    const ctx=await b.newContext({viewport:vp,deviceScaleFactor:nm==='m'?2:1});
    const p=await ctx.newPage(); const errs=[];
    await p.route(/cdnjs\.cloudflare\.com.*three/,r=>r.fulfill({path:'/home/claude/dom-test/node_modules/three/build/three.min.js',contentType:'application/javascript'}));
    p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));
    p.on('console',m=>{if(m.type()==='error'&&!/gstatic|firebase|ERR_|Failed to load resource/.test(m.text()))errs.push('CONSOLE '+m.text());});
    await p.goto('http://localhost:8765/arcade/dominion/',{waitUntil:'domcontentloaded'});
    await p.waitForSelector('#nameIn',{timeout:9000});
    await p.screenshot({path:`${nm}-1intro.png`});
    await p.fill('#nameIn','LazerYudel'); await p.click('[data-a=begin]'); await p.waitForTimeout(500);
    await p.screenshot({path:`${nm}-2daily.png`});
    await p.click('[data-a=cont]'); await p.waitForTimeout(700);
    await p.screenshot({path:`${nm}-3world.png`});
    // select an attackable base
    await p.waitForTimeout(1200);const pos=await p.evaluate(()=>{const wd=W();const r=document.querySelector('#map').getBoundingClientRect();let best=null;wd.n.forEach(n=>{if(attackable(wd,n)){const q=nodePos(n);if(q[0]>40&&q[0]<r.width-40&&q[1]>120&&(!best||Math.abs(q[0]-r.width/2)<Math.abs(best[0]-r.width/2)))best=q;}});return [best[0]+r.left,best[1]+r.top];});
    await p.mouse.click(pos[0],pos[1]); await p.waitForTimeout(400);
    await p.screenshot({path:`${nm}-4node.png`});
    await p.click('[data-a=attack]'); await p.waitForTimeout(900);
    await p.screenshot({path:`${nm}-5battle0.png`});
    // deploy by tapping in zone
    for(let i=0;i<8;i++){
      const pt=await p.evaluate((i)=>{const r=document.querySelector('#bf').getBoundingClientRect();const s=fs(150,80+i*38);return [s[0]+r.left,s[1]+r.top];},i);
      if(i===0)console.log(nm,'r3',await p.evaluate(()=>!!(B&&B.r3&&R3)));
      await p.mouse.click(pt[0],pt[1]); await p.waitForTimeout(1500);
      if(i===3) await p.screenshot({path:`${nm}-6battle1.png`}); if(i===6) await p.screenshot({path:`${nm}-6battle2.png`});
    }
    await p.evaluate(()=>{if(__dom.B)__dom.B.spd=2;});
    await p.waitForFunction(()=>!__dom.B,{timeout:90000}).catch(()=>errs.push('battle did not end'));
    await p.waitForTimeout(600);
    await p.screenshot({path:`${nm}-7result.png`});
    console.log(nm,'state',await p.evaluate(()=>JSON.stringify({w:S.stats.wins,l:S.stats.losses,army:S.army,coins:S.coins,xp:S.xp,lvl:S.lvl})));
    await p.click('[data-a=cont]').catch(()=>{}); await p.waitForTimeout(500);
    for(const t of ['army','forge','quests','social','store']){await p.evaluate(t=>__dom.ACT.tab(t),t);await p.waitForTimeout(300);await p.screenshot({path:`${nm}-8${t}.png`});}
    console.log(nm,'errors:',errs.length?errs.join('\n'):'none');
    await ctx.close();
  }
  await b.close();
})();
