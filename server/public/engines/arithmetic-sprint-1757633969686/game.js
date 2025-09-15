(function(){
  let creation, settings, pool=[], idx=0, score=0, startTs=0, timerIv, timeLeft=0;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
  const enterBtn=byId('enterBtn'); const timer=byId('timer'); const progress=byId('progress'); const scoreEl=byId('score');
  const qEl=byId('question'); const form=byId('answerForm'); const ans=byId('answer'); const summary=byId('summary');
  // instrumentation
  let qStartMs = 0; const answers = [];

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function gen(){
    if (Array.isArray(creation?.content) && creation.content.length){
      pool = creation.content.map(q=>({ a:q.a, op:q.op, b:q.b, ans:calc(q.a,q.op,q.b) }));
      return;
    }
    const ops = Object.entries(settings?.ops || {"+":true,"-":true,"×":true}).filter(([k,v])=>v).map(([k])=>k);
    const min = Number(settings?.min ?? 0), max = Number(settings?.max ?? 12);
    const allowNeg = !!settings?.allowNegative;
    const target = settings?.mode==='fixed_count' ? Number(settings?.totalQuestions ?? 20) : 99999;
    pool=[];
    while (pool.length < target){
      const op = ops[Math.floor(Math.random()*ops.length)] || "+";
      let a = rnd(min,max), b = rnd(min,max);
      if (op==='÷') { b = rnd(1, Math.max(1,max)); a = b * rnd(min, Math.max(min, max)); }
      if (!allowNeg && op==='-' && a<b){ const t=a; a=b; b=t; }
      const ans = calc(a,op,b);
      if (Number.isFinite(ans)) pool.push({a,op,b,ans});
      if (pool.length>5000) break; // safety
    }
  }

  function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function calc(a,op,b){ switch(op){ case '+': return a+b; case '-': return a-b; case '×': return a*b; case '÷': return b===0? NaN : a/b; default: return NaN; } }

  function render(){
    const q = pool[idx]; if(!q){ finish(); return; }
    qEl.textContent = `${q.a} ${q.op} ${q.b} = ?`;
    progress.textContent = settings?.mode==='fixed_count' ? `${idx+1}/${pool.length}` : '';
    scoreEl.textContent = `⭐ ${score}`;
    ans.value=''; ans.focus();
  qStartMs = Date.now();
  }

  function start(){
    show('play'); idx=0; score=0; gen(); render();
    if (settings?.mode==='timed'){
      timeLeft = Number(settings?.durationSec ?? 60);
      timer.textContent = `⏱️ ${timeLeft}s`;
      timerIv = setInterval(()=>{ timeLeft--; timer.textContent=`⏱️ ${timeLeft}s`; if(timeLeft<=0){ clearInterval(timerIv); finish(); } }, 1000);
    } else { timer.textContent = ''; }
    startTs = Date.now();
  }

  form.onsubmit = (e)=>{
    e.preventDefault();
    const q = pool[idx]; if(!q) return;
    const val = Number(ans.value);
  const ok = val===q.ans;
  const deltaMs = Math.max(0, Date.now() - (qStartMs || Date.now()));
    if (ok) score++;
    qEl.classList.add(ok? 'correct':'wrong');
  // record and emit live
  answers.push({ index: idx, a: q.a, op: q.op, b: q.b, value: val, correctAnswer: q.ans, correct: ok, timeMs: deltaMs });
  try { window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: ok, deltaMs, scoreDelta: ok?1:0, currentScore: score }}, '*'); } catch {}
    setTimeout(()=>{ qEl.classList.remove('correct','wrong'); idx++; render(); }, 200);
  };

  function finish(){
    if (timerIv) clearInterval(timerIv);
    show('done');
    const total = settings?.mode==='fixed_count' ? pool.length : score; // in timed mode, score is count of correct; set total=score for 100%
    summary.textContent = `You answered ${score}${settings?.mode==='fixed_count'?` / ${pool.length}`:''} correctly`;
    const totalTimeMs = answers.reduce((a,b)=>a+(Number(b.timeMs)||0),0);
    try { window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*'); } catch {}
    window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: total, answers }}, '*');
  }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; settings=p.config||{};
      show('ready');
      enterBtn.onclick = countdown;
    }
  });
})();
