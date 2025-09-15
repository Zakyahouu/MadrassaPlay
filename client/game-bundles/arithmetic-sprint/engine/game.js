/* Arithmetic Sprint Engine */
(function(){
  const root = document.getElementById('root');
  const questionEl = document.getElementById('question');
  const choicesEl = document.getElementById('choices');
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const startBtn = document.getElementById('startBtn');
  const progressFill = document.getElementById('progressFill');
  const finishedEl = document.getElementById('finished');

  // Platform init: prefer INIT_GAME postMessage, fallback to global injection
  let creationData = window.__GAME_CONFIG__ || null; // { config, content, callbacks, _id }

  let state = { timeLeft:0, score:0, currentIndex:0, questions:[], active:false };
  let interval = null;

  function randint(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function sample(arr,n){ const c=[...arr]; const out=[]; while(out.length<n&&c.length){ out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); } return out; }

  function generateQuestions(cfg){
    const ops = cfg.operations || ['+','-'];
    const count = cfg.questionCount || 20;
    const maxOp = cfg.maxOperand || 20;
    const out = [];
    for(let i=0;i<count;i++){
      const op = ops[Math.floor(Math.random()*ops.length)];
      let a = randint(0,maxOp); let b = randint(0,maxOp);
      if(op==='/' ){ b = randint(1,maxOp); a = b*randint(0,Math.floor(maxOp/b)); }
      const expr = `${a} ${op} ${b}`;
      let correct;
      switch(op){
        case '+': correct = a+b; break;
        case '-': correct = a-b; break;
        case '*': correct = a*b; break;
        case '/': correct = b===0?0: a/b; break;
      }
      if(op==='/' && !Number.isInteger(correct)) { correct = Number(correct.toFixed(2)); }
      // Generate distractors
      const distractors = new Set();
      while(distractors.size < (cfg.choicesPerQuestion||4)-1){
        let delta = randint(-10,10);
        let val = correct + delta;
        if(val!==correct) distractors.add(val);
      }
      const question = {
        display: expr,
        correctAnswer: correct,
        choices: shuffle([correct,...Array.from(distractors)])
      };
      out.push(question);
    }
    return out;
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()* (i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

  function buildQuestions(cfg, content){
    if(cfg.autoGenerate || !content || content.length===0){
      return generateQuestions(cfg);
    }
    // Manual content
    return content.map(item => {
      const baseChoices = item.distractors && Array.isArray(item.distractors) ? item.distractors : [];
      let choices = [item.correctAnswer, ...baseChoices];
      if(choices.length < (cfg.choicesPerQuestion||4)){
        // pad with near numbers
        const need = (cfg.choicesPerQuestion||4) - choices.length;
        for(let i=0;i<need;i++){ choices.push(item.correctAnswer + (i+1)); }
      }
      return {
        display: `${item.operandA} ${item.operation} ${item.operandB}`,
        correctAnswer: item.correctAnswer,
        choices: shuffle(choices.slice(0,cfg.choicesPerQuestion||4))
      };
    });
  }

  function startGame(){
    const cfg = creationData?.config || {};
    const content = creationData?.content || [];
    state.questions = buildQuestions(cfg, content);
    state.timeLeft = cfg.timeLimit || 60;
    state.score = 0; state.currentIndex=0; state.active=true;
    startBtn.classList.add('hidden');
    finishedEl.classList.add('hidden');
    renderQuestion();
    interval = setInterval(()=>{
      state.timeLeft--; updateHUD();
      if(state.timeLeft<=0){ endGame(); }
    },1000);
    updateHUD();
  }

  function updateHUD(){
    timerEl.textContent = state.timeLeft + 's';
    scoreEl.textContent = state.score;
  }

  function renderQuestion(){
    if(state.currentIndex >= state.questions.length){ return endGame(); }
    const q = state.questions[state.currentIndex];
    questionEl.textContent = q.display;
    choicesEl.innerHTML='';
    q.choices.forEach(choice => {
      const btn = document.createElement('div');
      btn.className='choice fade-in';
      btn.setAttribute('role','option');
      btn.setAttribute('tabindex','0');
      btn.textContent=choice;
      btn.onclick=()=> handleChoice(btn, q, choice);
      btn.onkeydown=(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); handleChoice(btn,q,choice);} };
      choicesEl.appendChild(btn);
    });
    updateProgress();
  }

  function handleChoice(el, q, val){
    if(!state.active) return;
    if(val === q.correctAnswer){
      state.score++; el.classList.add('correct');
    } else { el.classList.add('wrong'); }
    state.currentIndex++;
    setTimeout(()=> renderQuestion(), 300);
    updateHUD();
  }

  function updateProgress(){
    if(!progressFill) return;
    const pct = state.questions.length? (state.currentIndex / state.questions.length)*100 : 0;
    progressFill.style.width = pct.toFixed(1)+'%';
  }

  function endGame(){
    if(!state.active) return;
    state.active=false; clearInterval(interval);
    questionEl.textContent=''; choicesEl.innerHTML='';
    finishedEl.textContent = `Finished! Score: ${state.score} / ${state.questions.length}`;
    finishedEl.classList.remove('hidden');
    startBtn.classList.remove('hidden');
    // Report to parent if callback exists
    if(creationData?.callbacks?.onComplete){
      creationData.callbacks.onComplete({ score: state.score, totalPossibleScore: state.questions.length });
    }
    // Also emit standard postMessage events for live/recording
    try {
      const totalTimeMs = Math.max(0, (creationData?.config?.timeLimit || 0) - state.timeLeft) * 1000;
      window.parent.postMessage({ type: 'LIVE_FINISH', payload: { totalTimeMs } }, '*');
    } catch {}
    try {
      window.parent.postMessage({ type: 'GAME_COMPLETE', payload: { gameCreationId: creationData?._id, score: state.score, totalPossibleScore: state.questions.length } }, '*');
    } catch {}
    updateProgress();
  }

  startBtn.addEventListener('click', startGame);

  // Support postMessage INIT_GAME bootstrap
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'INIT_GAME') {
      creationData = e.data.payload || creationData;
      // auto-show start UI if present
      try { startBtn.classList.remove('hidden'); finishedEl.classList.add('hidden'); } catch {}
    }
  });

  // If pre-injected config exists and autoStart flag is present, optionally start
  if (creationData && creationData.config && creationData.config.autoStart) {
    try { startGame(); } catch {}
  }

})();
