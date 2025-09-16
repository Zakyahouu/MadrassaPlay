/* Sentence Order Engine - Unified INIT/COMPLETE contract */
(function(){
  let creation = window.__GAME_CONFIG__ || null, items=[], settings, qIndex=0, score=0;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
  const enterBtn=byId('enterBtn'); const qIdx=byId('qIdx'); const scoreEl=byId('score');
  const wordBank=byId('wordBank'); const assembled=byId('assembled'); const summary=byId('summary');
  const undoBtn=byId('undoBtn'), clearBtn=byId('clearBtn'), submitBtn=byId('submitBtn');

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function normalize(s){ return (settings?.allowLowercase!==false ? s.toLowerCase() : s).trim(); }

  function prepareWords(sentence){
    const base = sentence.split(/\s+/).map(w=>w.trim()).filter(Boolean);
    return base;
  }

  function render(){
    const item = items[qIndex];
    qIdx.textContent = `${qIndex+1}/${items.length}`;
    wordBank.innerHTML=''; assembled.innerHTML='';
    let words = prepareWords(item.sentence);
    if (Array.isArray(item.distractors)) words = words.concat(item.distractors);
    // shuffle
    words = words.slice().sort(()=>Math.random()-0.5);
    words.forEach((w)=>{
      const btn=document.createElement('button'); btn.className='word'; btn.textContent=w;
      btn.onclick=()=>{
        // move button itself from bank to assembled to avoid duplicates
        btn.parentElement.removeChild(btn);
        btn.onclick=()=>{
          // move back to bank on click
          btn.parentElement.removeChild(btn);
          wordBank.appendChild(btn);
          btn.onclick=()=>{
            btn.parentElement.removeChild(btn);
            assembled.appendChild(btn);
          };
        };
        assembled.appendChild(btn);
      };
      wordBank.appendChild(btn);
    });
  }

  function submit(){
    const item = items[qIndex];
    const target = normalize(item.sentence.replace(/[.,!?]/g, ''));
    const guess = normalize([...assembled.children].map(n=>n.textContent).join(' '));
    const ok = target === guess;
    if (ok) score++;
    scoreEl.textContent = `⭐ ${score}/${items.length}`;
    assembled.classList.add(ok?'correct':'wrong');
    setTimeout(()=>{
      assembled.classList.remove('correct','wrong');
      next();
    }, 800);
  }

  function next(){
    qIndex++;
    if (qIndex < items.length) render();
    else finish();
  }

  function start(){
    show('play'); qIndex=0; score=0; render(); scoreEl.textContent = `⭐ ${score}/${items.length}`;
  }

  function finish(){
    show('done');
    summary.textContent = `You scored ${score} / ${items.length}`;
    // Unified completion contract
    if(creation?.callbacks?.onComplete){
      creation.callbacks.onComplete({ score, totalPossibleScore: items.length });
    }
    try { window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs: null }}, '*'); } catch{}
    try { window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: items.length }}, '*'); } catch{}
  }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; items = Array.isArray(p.content)? p.content: []; settings=p.config||{};
      show('ready');
      enterBtn.onclick = countdown;
    }
  });
  // If pre-injected config exists and autoStart flag is present, optionally start
  if (creation && creation.config && creation.config.autoStart) {
    try { show('ready'); enterBtn.onclick = countdown; } catch {}
  }

  undoBtn.onclick = ()=>{ const last=assembled.lastElementChild; if(last) last.remove(); };
  clearBtn.onclick = ()=>{ assembled.innerHTML=''; };
  submitBtn.onclick = submit;
})();
