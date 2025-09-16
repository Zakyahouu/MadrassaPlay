(function(){
  let creation, items=[], settings, idx=0, score=0;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
  const enterBtn=byId('enterBtn'); const wIdx=byId('wIdx'); const scoreEl=byId('score'); const hint=byId('hint');
  const bank=byId('bank'); const assembled=byId('assembled'); const summary=byId('summary');
  const undoBtn=byId('undoBtn'), clearBtn=byId('clearBtn'), submitBtn=byId('submitBtn');
  // instrumentation
  let qStartMs=0; const answers=[];

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function shuffle(a){ return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(([_,v])=>v); }
  function norm(s){ return settings?.allowLowercase!==false ? s.toLowerCase() : s; }

  function render(){
    const it = items[idx]; if(!it){ finish(); return; }
    wIdx.textContent = `${idx+1}/${items.length}`;
    bank.innerHTML=''; assembled.innerHTML='';
  // Always shuffle letters to avoid pre-ordered display
  const letters = shuffle(it.word.split(''));
    letters.forEach((ch)=>{
      const btn=document.createElement('button'); btn.className='letter'; btn.textContent=ch; btn.onclick=()=>{
        const pick=document.createElement('span'); pick.className='letter'; pick.textContent=ch; pick.onclick=()=> pick.remove(); assembled.appendChild(pick);
      }; bank.appendChild(btn);
    });
  hint.textContent = settings?.showHint && it.hint ? `Hint: ${it.hint}` : '';
    scoreEl.textContent = `⭐ ${score}/${items.length}`;
    qStartMs = Date.now();
  }

  function submit(){
    const it = items[idx];
    const guess = norm([...assembled.children].map(n=>n.textContent).join(''));
    const target = norm(it.word);
    const ok = guess === target;
    const deltaMs = Math.max(0, Date.now() - (qStartMs || Date.now()));
    if (ok) score++;
    assembled.classList.add(ok?'correct':'wrong');
    // record answer and emit live event
    const selectedText = [...assembled.children].map(n=>n.textContent).join('');
    answers.push({ index: idx, guess: selectedText, target: it.word, correct: ok, deltaMs });
    try{
      window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: ok, deltaMs, scoreDelta: ok?1:0, currentScore: score }}, '*');
    }catch{}
    setTimeout(()=>{ assembled.classList.remove('correct','wrong'); idx++; render(); }, 700);
  }

  function start(){ show('play'); idx=0; score=0; render(); }

  function finish(){
    show('done');
    summary.textContent=`You formed ${score} / ${items.length}`;
    const totalTimeMs = answers.reduce((a,b)=>a + (Number(b.deltaMs)||0), 0);
    try{ window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs } }, '*'); }catch{}
    window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: items.length, answers }}, '*');
  }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; items=Array.isArray(p.content)?p.content:[]; settings=p.config||{}; show('ready'); enterBtn.onclick = countdown; }
  });

  undoBtn.onclick = ()=>{ const last=assembled.lastElementChild; if(last) last.remove(); };
  clearBtn.onclick = ()=>{ assembled.innerHTML=''; };
  submitBtn.onclick = submit;
})();
