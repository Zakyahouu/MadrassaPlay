(function(){
  let creation, settings, pool=[], idx=0, score=0, streak=0, timerIv, timeLeft=0;
  const answers = [];
  let qStartMs = 0;
  let shuffledBackgrounds = [];
  const byId=(id)=>document.getElementById(id);

  const themes = [ 
    { group: 1, color: '#6366f1' }, // Indigo (core cosmic)
    { group: 2, color: '#8b5cf6' }, // Purple (mystical)
    { group: 3, color: '#06b6d4' }, // Cyan (electric)
    { group: 4, color: '#f59e0b' }  // Amber (star-like)
  ];

  // --- Asset Preloading ---
  let assetsLoaded = false;
  const preloadAssets = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        assetsLoaded = true;
        resolve();
      };
      img.onerror = () => {
        // Continue even if image fails to load
        assetsLoaded = true;
        resolve();
      };
      img.src = 'assets/background.jpeg';
    });
  };

  // --- Element References ---
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done'),loading:byId('loading')};
  const enterBtn=byId('enterBtn'); 
  const timerEl=byId('timer').querySelector('.text'); 
  const progressEl=byId('progress').querySelector('.text'); 
  const scoreEl=byId('score').querySelector('.text');
  const qWrapper=document.querySelector('.question-wrapper'); 
  const qEl=byId('question'); 
  const optionsContainer=byId('options-container'); 
  const summary=byId('summary');
  const progressBar = byId('progress-bar'); 
  const streakCounter = byId('streak-counter');
  
  const show=(id) => { Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); };
  const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([_, v]) => v);
  const rnd=(min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const calc=(a,op,b) => { switch(op){ case '+': return a+b; case '-': return a-b; case '×': return a*b; case '÷': return b===0? NaN : a/b; default: return NaN; } };

  function showBonus(text, type) {
    const bonusEl = document.createElement('div');
    bonusEl.textContent = text;
    bonusEl.className = `bonus-pop ${type}`;
    document.body.appendChild(bonusEl);
    setTimeout(() => bonusEl.remove(), 1500);
  }

  function updateStreakDisplay() {
    if (streak >= 2) {
      streakCounter.textContent = `🔥 ${streak}x Streak!`;
      streakCounter.classList.remove('hidden');
      streakCounter.style.animation = 'pulse 0.5s ease-out';
    } else {
      streakCounter.classList.add('hidden');
    }
  }

  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function gen(){ /* ... (generation logic is the same, omitted for brevity) ... */ }

  function render(){
    qWrapper.style.opacity = '0'; // Start fade out for transition
    
    setTimeout(() => {
      const q = pool[idx]; if(!q){ finish(); return; }
      
      // Update HUD and Progress Bar
      progressEl.textContent = `${idx+1}/${pool.length}`;
      scoreEl.textContent = score;
      progressBar.style.width = `${((idx + 1) / pool.length) * 100}%`;

      qEl.textContent = q.question;
      optionsContainer.innerHTML = '';
      const shuffledChoices = shuffle(q.choices);
      shuffledChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.textContent = choice;
        btn.onclick = () => checkAnswer(choice, q.answer);
        optionsContainer.appendChild(btn);
      });

      qStartMs = Date.now();
      qWrapper.style.opacity = '1'; // Fade in new question
    }, 200); // Delay matches opacity transition time
  }

  function checkAnswer(selectedValue, correctAnswer) {
    const ok = selectedValue === correctAnswer;
    const deltaMs = Date.now() - qStartMs;
    
    // Speed bonus: +50 points if answered within 2 seconds (but score is just correct answers count)
    if (ok && deltaMs <= 2000) {
      showBonus('+50 Speed Bonus!', 'speed');
    }
    
    // Streak logic
    if (ok) {
      streak++;
      score++; // Score is now just the number of correct answers
      if (streak >= 2) {
        updateStreakDisplay();
      }
    } else {
      streak = 0;
      updateStreakDisplay();
    }
    
    // Visual Feedback with enhanced animations
    [...optionsContainer.children].forEach(btn => {
      const choice = Number(btn.textContent);
      if(choice === correctAnswer) {
        btn.classList.add('correct');
        if (ok) btn.style.animation = 'thump 0.3s ease-out';
      } else if(choice === selectedValue && !ok) {
        btn.classList.add('wrong');
        btn.style.animation = 'shake 0.5s ease-out';
      }
      btn.disabled = true;
    });

    answers.push({ index: idx, correct: ok, timeMs: deltaMs, points: ok ? 1 : 0 });
    window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: ok, deltaMs, scoreDelta: ok ? 1 : 0, currentScore: score }}, '*');
    setTimeout(()=>{ idx++; render(); }, 1200); // Longer delay for animations
  }

  function start(){
    // Set background image
    document.body.style.backgroundImage = `url(assets/background.jpeg)`;
    
    show('play'); idx=0; score=0; streak=0; gen(); render();

    if (settings.durationSec > 0){
      timeLeft = Number(settings.durationSec);
      timerEl.textContent = `${timeLeft}s`;
      timerIv = setInterval(()=>{ 
        timeLeft--; 
        timerEl.textContent=`${timeLeft}s`; 
        
        // Add shake effect when time is running low
        if (timeLeft <= 10) {
          timerEl.parentElement.classList.add('urgent-timer');
        } else {
          timerEl.parentElement.classList.remove('urgent-timer');
        }
        
        if(timeLeft<=0){ 
          clearInterval(timerIv); 
          timerEl.parentElement.classList.remove('urgent-timer');
          finish(); 
        } 
      }, 1000);
    } else { timerEl.textContent = 'Sprint'; timerEl.parentElement.style.visibility = 'hidden'; }
  }

  function finish(){
    if (timerIv) clearInterval(timerIv);
    // Remove urgent timer effect
    timerEl.parentElement.classList.remove('urgent-timer');
    show('done');
    summary.textContent = `Final Score: ${score}`;
    const totalTimeMs = answers.reduce((a,b)=>a+(b.timeMs || 0),0);
    window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*');
    window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: pool.length, answers }}, '*');
  }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      creation=e.data.payload; settings=creation.config||{};
      
      // Preload all assets before starting
      show('loading');
      preloadAssets().then(() => {
        // This is the simplified gen() from the file you provided
        // Re-integrating it here for completeness
        gen = function() {
          pool = [];
          if (settings.autoGenerate) {
            const ops = [];
            if (settings.allowAdd) ops.push("+");
            if (settings.allowSubtract) ops.push("-");
            if (settings.allowMultiply) ops.push("×");
            if (settings.allowDivide) ops.push("÷");
            if (ops.length === 0) ops.push("+");
            const min = Number(settings.min ?? 0), max = Number(settings.max ?? 12);
            const target = Number(settings.totalQuestions ?? 20);
            
            while (pool.length < target){
              const op = ops[Math.floor(Math.random()*ops.length)];
              let a = rnd(min,max), b = rnd(min,max);
              if (op==='÷') { b = rnd(1, Math.max(1,max)); a = b * rnd(min, Math.max(1, max)); }
              if (op==='-' && a<b){ const t=a; a=b; b=t; }
              const answer = calc(a,op,b);

              if (Number.isFinite(answer)) {
                const wrongAnswers = new Set();
                while(wrongAnswers.size < 2) {
                  const offset = rnd(1, 5);
                  wrongAnswers.add(answer + (Math.random() > 0.5 ? offset : -offset));
                  wrongAnswers.add(answer + rnd(1, 10));
                  wrongAnswers.delete(answer);
                }
                pool.push({ question: `${a} ${op} ${b}`, answer, choices: [answer, ...wrongAnswers] });
              }
              if (pool.length > 5000) break;
            }
          } else {
            const manualItems = creation?.questions || [];
            pool = manualItems.map(q => {
              const answer = calc(q.a, q.op, q.b);
              const wrong1 = q.wrong1 ?? answer + rnd(1,5);
              const wrong2 = q.wrong2 ?? answer - rnd(1,5);
              return { question: `${q.a} ${q.op} ${q.b}`, answer, choices: [answer, wrong1, wrong2] };
            });
          }
        }
        show('ready');
        enterBtn.onclick = countdown;
      });
    }
  });
})();