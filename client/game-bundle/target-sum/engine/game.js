(function(){
  let creation, settings, puzzles=[], idx=0, score=0;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
  const enterBtn=byId('enterBtn'); const pIdx=byId('pIdx'); const targetEl=byId('target'); const sumEl=byId('sum'); const scoreEl=byId('score');
  const bank=byId('bank'); const clearBtn=byId('clearBtn'); const submitBtn=byId('submitBtn'); const summary=byId('summary');
  // instrumentation
  let qStartMs = 0; const answers = [];

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function gen(){
    if (Array.isArray(creation?.content) && creation.content.length){ puzzles = creation.content.map(p=>({ target:Number(p.target), numbers:(p.numbers||[]).map(Number) })); return; }
    const total = Number(settings?.totalPuzzles ?? 10);
    const npp = Number(settings?.numbersPerPuzzle ?? 6);
    const min = Number(settings?.minNumber ?? 1), max = Number(settings?.maxNumber ?? 9);
    puzzles = Array.from({length: total}).map(()=>{
      const nums = Array.from({length: npp}, ()=> rnd(min,max));
      // choose 2-3 numbers to form target
      const pick = shuffle(nums.slice()).slice(0, Math.min(3, Math.max(2, Math.floor(Math.random()*3)+2)));
      const target = pick.reduce((a,b)=>a+b,0);
      return { target, numbers: nums };
    });
  }

  function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function shuffle(a){ return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(([_,v])=>v); }

  function render(){
    const p = puzzles[idx]; if(!p){ finish(); return; }
    pIdx.textContent = `${idx+1}/${puzzles.length}`;
    targetEl.textContent = `🎯 Target: ${p.target}`;
    updateSum();
    bank.innerHTML='';
    p.numbers.forEach((n,i)=>{
      const b=document.createElement('button'); b.className='num'; b.textContent=String(n); b.dataset.index=i; b.dataset.value=String(n);
      b.onclick=()=>{ b.classList.toggle('selected'); updateSum(); };
      bank.appendChild(b);
    });
    scoreEl.textContent = `⭐ ${score}`;
  qStartMs = Date.now();
  }

  function updateSum(){
    const selected = [...bank.querySelectorAll('.num.selected')].map(el=>Number(el.dataset.value));
    const s = selected.reduce((a,b)=>a+b,0);
    sumEl.textContent = `Σ ${s}`;
    return s;
  }

  function submit(){
    const s = updateSum(); const p = puzzles[idx]; const ok = s===p.target;
    if (ok) score++;
    bank.classList.add(ok? 'correct':'wrong');
  const selected = [...bank.querySelectorAll('.num.selected')].map(el=>Number(el.dataset.value));
  const deltaMs = Math.max(0, Date.now() - (qStartMs || Date.now()));
  answers.push({ index: idx, target: p.target, selected, correct: ok, timeMs: deltaMs });
  try { window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: ok, deltaMs, scoreDelta: ok?1:0, currentScore: score }}, '*'); } catch {}
    setTimeout(()=>{ bank.classList.remove('correct','wrong'); idx++; render(); }, 700);
  }

  function start(){ show('play'); idx=0; score=0; gen(); render(); }

  function finish(){ show('done'); const total = puzzles.length; summary.textContent=`You solved ${score} / ${total}`; const totalTimeMs = answers.reduce((a,b)=>a+(Number(b.timeMs)||0),0); try { window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*'); } catch {} window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: total, answers }}, '*'); }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; settings=p.config||{}; show('ready'); enterBtn.onclick = countdown; }
  });

  clearBtn.onclick = ()=>{ [...bank.querySelectorAll('.num.selected')].forEach(el=>el.classList.remove('selected')); updateSum(); };
  submitBtn.onclick = submit;
})();
