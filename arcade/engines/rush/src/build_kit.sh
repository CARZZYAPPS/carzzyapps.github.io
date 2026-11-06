#!/bin/bash
# Builds the Rush engine as a data-pack runtime for Lazer Studio (arcade/engines/rush/play.html).
cd "$(dirname "$0")"
{ cat a_shell.html; echo "<script>"; cat b_core.js /home/claude/carzzyapps.github.io/arcade/engines/rush/models.js c_data.js k_kit.js d1_env.js d2_models.js e_shift.js f_empire.js g_ui.js g2_sheets.js h_main.js; echo "</script>"; } > rush-kit.html
python3 - <<'PY'
s=open('rush-kit.html').read()
def R(a,b):
    global s
    assert a in s, a[:60]
    s=s.replace(a,b)
R("Promise.all([fontsReady,lzBoot()]).then(init,init);","""window.addEventListener('message',function(e){if(!e.data||e.data.type!=='rush-pack'||window.__kitBooted)return;window.__kitBooted=1;var d=e.data;KX.persist=!!d.persist;if(d.save)KX.store.rushkit=String(d.save);try{applyPack(d.project);}catch(err){console.error(err);}if(d.allowScript)kitRunScript(d.project.script);fontsReady.then(function(){init();kitTextStart();},function(){init();kitTextStart();});});
if(parent!==window)parent.postMessage({type:'rush-ready'},'*');else document.body.insertAdjacentHTML('beforeend','<p style="position:fixed;inset:40% 0 auto;text-align:center;font:700 16px system-ui;color:#fff">This page runs Lazer Studio Rush games. Open one from the Community.</p>');""")
R("if(window.LZ_GAME&&window.LZ)LZ.endSession(LZ_GAME,s.total,{grade:s.grade,day:s.day});","")
R("save();sfx.bell();showSummary(s);","save();kitScore(s.total);sfx.bell();showSummary(s);")
R("""<div class="cnt dim">Tap to '+(o.d.role==='comp'?'steam':'brew')+'</div>'""","""<div class="cnt dim">'+esc(txtT(o.d.verb||((KIT.kit&&KIT.kit.stations&&KIT.kit.stations.length)?'Tap to start':'Tap to '+(o.d.role==='comp'?'steam':'brew'))))+'</div>'""")
R('<title>Crema Tycoon</title>','<meta charset="utf-8"><title>Rush engine | Lazer Studio</title>')
R("""'<h1>Crema <span>Rush</span></h1><p class="lead">Run the counter, then build a coffee empire. Bakeries, juice bars and ice cream parlors open up as you grow.</p>'""","""'<h1>'+esc(KIT.title||'Rush')+'</h1><p class="lead">'+esc(KIT.desc||'Run the counter, then grow your shop into an empire.')+'</p><p class="fine">Made with Lazer Studio on the Rush engine (the engine behind Crema Rush and Harbor Rush).</p>'""")
R("cash:60,","cash:(KIT.kit&&+KIT.kit.cash||60),")
R("tops:{},staff","tops:kitStartTops(ind),staff")
i=s.rindex('})();')
s=s[:i]+open('k_kit2.js').read()+"\nwindow.__KIT={G:function(){return G;},SH:function(){return SH;},end:function(){if(SH)SH.t=SH.len;},start:function(){startShift();},close:function(){closeModal();},cam:function(){return JSON.stringify([camera.position,camBase.pos,camBase.tgt,SH&&SH.L.zF]);}};\n"+s[i:]
open('rush-kit.html','w').write(s)
import re;open('chk_kit.js','w').write(re.findall(r'<script>(.*?)</script>',s,re.S)[-1])
PY
node --check chk_kit.js && echo KIT_SYNTAX_OK && mkdir -p /home/claude/carzzyapps.github.io/arcade/engines/rush && cp rush-kit.html /home/claude/carzzyapps.github.io/arcade/engines/rush/play.html
