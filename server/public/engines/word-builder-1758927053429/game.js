(function(){
  let creation, items=[], settings, idx=0, score=0, currentAttempts=0, timeLeft=0, timerInterval=null;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),correct:byId('correct'),wrong:byId('wrong'),done:byId('done')};
  const enterBtn=byId('enterBtn'); const wIdx=byId('wIdx'); const timerEl=byId('timer'); const attemptsEl=byId('attempts'); const scoreEl=byId('score');
  const hint=byId('hint'); const wordPreview=byId('wordPreview'); const previewText=byId('previewText');
  const dropZone=byId('dropZone'); const dropLabel=byId('dropLabel'); const assembled=byId('assembled'); const letterBank=byId('letterBank'); const bank=byId('bank');
  const definition=byId('definition'); const wrongMsg=byId('wrongMsg'); const summary=byId('summary');
  const clearBtn=byId('clearBtn'); const submitBtn=byId('submitBtn'); const nextBtn=byId('nextBtn'); const retryBtn=byId('retryBtn');

  // instrumentation
  let qStartMs=0; const answers=[];

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function shuffle(a){ return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(([_,v])=>v); }
  function norm(s){ return settings?.allowLowercase!==false ? s.toLowerCase() : s; }

  // Arabic letter shaping (simplified - handles basic contextual forms)
  function getShapedLetter(letter, position, word) {
    // This is a simplified implementation. Real Arabic shaping requires more complex logic
    // For now, we'll just return the letter as-is, but the structure is ready for enhancement
    return letter;
  }

  function updateWordPreview() {
    const letters = Array.from(assembled.children).map(el => el.textContent);
    if (letters.length === 0) {
      previewText.textContent = '';
      dropLabel.style.display = 'block';
      return;
    }

    dropLabel.style.display = 'none';

    // Apply shaping to each letter based on position
    const shapedWord = letters.map((letter, index) => {
      const position = index === 0 ? 'start' : index === letters.length - 1 ? 'end' : 'middle';
      return getShapedLetter(letter, position, letters.join(''));
    }).join('');

    previewText.textContent = shapedWord;
  }

  function isRTL(text) {
    // Simple RTL detection
    const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text);
  }

  function setLanguageDirection() {
    const html = document.documentElement;
    const hasRTL = items.some(item => isRTL(item.word));
    html.setAttribute('dir', hasRTL ? 'rtl' : 'ltr');
  }

  function createDraggableLetter(letter, uniqueId) {
    const letterEl = document.createElement('div');
    letterEl.className = 'letter';
    letterEl.textContent = letter;
    letterEl.draggable = true;
    letterEl.dataset.letterId = uniqueId; // Store unique ID

    letterEl.addEventListener('dragstart', (e) => {
      letterEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', letter);
      e.dataTransfer.setData('letterId', uniqueId);
      e.dataTransfer.setData('sourceElement', letterEl);
    });

    letterEl.addEventListener('dragend', (e) => {
      letterEl.classList.remove('dragging');
    });

    // Make letters removable by clicking (only when placed)
    letterEl.addEventListener('click', () => {
      if (letterEl.parentNode === assembled) {
        // Move back to bank
        letterEl.classList.remove('placed');
        bank.appendChild(letterEl);
        updateWordPreview();
      }
    });

    return letterEl;
  }

  function startTimer() {
    if (settings.gameMode !== 'time_based') return;

    timeLeft = settings.timePerWord || 30;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      } else if (timeLeft <= 5) {
        timerEl.classList.add('urgent');
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (settings.gameMode === 'time_based') {
      timerEl.textContent = `⏱️ ${timeLeft}s`;
    }
  }

  function updateAttemptsDisplay() {
    if (settings.gameMode === 'attempts_based') {
      attemptsEl.textContent = `❤️ ${currentAttempts}/${settings.maxAttempts || 3}`;
    }
  }

  function handleTimeout() {
    showWrongScreen('Time\'s up! Try again.');
  }

  function render(){
    const it = items[idx]; if(!it){ finish(); return; }

    // Reset state
    clearInterval(timerInterval);
    currentAttempts = settings.gameMode === 'attempts_based' ? (settings.maxAttempts || 3) : 0;

    wIdx.textContent = `${idx+1}/${items.length}`;
    scoreEl.textContent = `⭐ ${score}/${items.length}`;
    timerEl.textContent = '';
    attemptsEl.textContent = '';
    timerEl.classList.remove('urgent');

    hint.textContent = settings?.showHints && it.hint ? `💡 Hint: ${it.hint}` : '';
    definition.textContent = '';
    wrongMsg.textContent = '';

    bank.innerHTML = '';
    assembled.innerHTML = '';
    updateWordPreview();

    // Prepare letters: target word + extra confusing letters
    let letters = norm(it.word).split('');
    if (it.extraLetters) {
      const extraLetters = it.extraLetters.split('\n').map(s => norm(s.trim())).filter(Boolean);
      letters = letters.concat(extraLetters);
    }

    // Shuffle all letters
    letters = shuffle(letters);

    // Create draggable letter elements with unique IDs
    letters.forEach((letter, index) => {
      const uniqueId = `letter-${idx}-${index}`;
      const letterEl = createDraggableLetter(letter, uniqueId);
      bank.appendChild(letterEl);
    });

    // Start timer if time-based mode
    startTimer();
    updateAttemptsDisplay();

    qStartMs = Date.now();
  }

  function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const letter = e.dataTransfer.getData('text/plain');
    const letterId = e.dataTransfer.getData('letterId');
    const sourceElement = e.dataTransfer.getData('sourceElement');

    if (letter && letterId && sourceElement) {
      // Move the existing element to assembled area
      const existingElement = document.querySelector(`[data-letter-id="${letterId}"]`);
      if (existingElement && existingElement.parentNode === bank) {
        existingElement.classList.add('placed');
        addReorderingHandlers(existingElement);
        assembled.appendChild(existingElement);
        updateWordPreview();
        // Mark the drop as successful
        e.dataTransfer.dropEffect = 'move';
      }
    }
  }

  function addLetterToAssembled(letter, uniqueId, insertBefore = null) {
    // This function is now only used for initial placement
    // Letters are moved, not created, during drag/drop
    const letterEl = createDraggableLetter(letter, uniqueId);
    letterEl.classList.add('placed');

    // Add reordering handlers
    addReorderingHandlers(letterEl);

    if (insertBefore) {
      assembled.insertBefore(letterEl, insertBefore);
    } else {
      assembled.appendChild(letterEl);
    }

    updateWordPreview();
  }

  function addReorderingHandlers(letterEl) {
    letterEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      letterEl.classList.add('drag-over');
    });

    letterEl.addEventListener('dragleave', () => {
      letterEl.classList.remove('drag-over');
    });

    letterEl.addEventListener('drop', (e) => {
      e.preventDefault();
      letterEl.classList.remove('drag-over');

      const draggedId = e.dataTransfer.getData('letterId');

      if (draggedId && draggedId !== letterEl.dataset.letterId) {
        // Find the dragged element
        const draggedEl = document.querySelector(`[data-letter-id="${draggedId}"]`);

        if (draggedEl && draggedEl !== letterEl) {
          // Insert the dragged letter before this element
          assembled.insertBefore(draggedEl, letterEl);
          draggedEl.classList.add('placed');
          updateWordPreview();
        }
      }
    });
  }

  function submit(){
    const it = items[idx];
    const guess = norm(Array.from(assembled.children).map(n=>n.textContent).join(''));
    const target = norm(it.word);
    const ok = guess === target;

    const deltaMs = Math.max(0, Date.now() - (qStartMs || Date.now()));

    if (ok) {
      // Correct answer
      score++;
      scoreEl.textContent = `⭐ ${score}/${items.length}`;

      // Show definition if available
      if (it.definition) {
        definition.textContent = `📚 ${it.definition}`;
      }

      answers.push({ index: idx, guess: guess, target: it.word, correct: true, deltaMs, attempts: settings.gameMode === 'attempts_based' ? (settings.maxAttempts - currentAttempts + 1) : 0 });
      try{
        window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: true, deltaMs, scoreDelta: 1, currentScore: score }}, '*');
      }catch{}

      clearInterval(timerInterval);
      show('correct');
    } else {
      // Wrong answer
      if (settings.gameMode === 'attempts_based') {
        currentAttempts--;
        updateAttemptsDisplay();

        if (currentAttempts <= 0) {
          showWrongScreen('No more attempts! The correct word was: ' + it.word);
        } else {
          showWrongScreen(`Try again! ${currentAttempts} attempts left.`);
        }
      } else {
        showWrongScreen('Not quite right! Try again.');
      }

      answers.push({ index: idx, guess: guess, target: it.word, correct: false, deltaMs, attempts: settings.gameMode === 'attempts_based' ? (settings.maxAttempts - currentAttempts) : 0 });
      try{
        window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: false, deltaMs, scoreDelta: 0, currentScore: score }}, '*');
      }catch{}
    }
  }

  function showWrongScreen(message) {
    wrongMsg.textContent = message;
    clearInterval(timerInterval);
    show('wrong');
  }

  function next(){
    idx++;
    if (idx < items.length) {
      show('play');
      render();
    } else {
      finish();
    }
  }

  function retry() {
    show('play');
    // Move all assembled letters back to the bank
    const lettersToReturn = Array.from(assembled.children);
    lettersToReturn.forEach(letterEl => {
      letterEl.classList.remove('placed');
      bank.appendChild(letterEl);
    });
    updateWordPreview();
    qStartMs = Date.now();
    startTimer();
  }

  function start(){
    show('play');
    setLanguageDirection();
    idx=0; score=0; render();
  }

  function finish(){
    clearInterval(timerInterval);
    show('done');
    summary.textContent=`You built ${score} / ${items.length} words correctly!`;
    const totalTimeMs = answers.reduce((a,b)=>a + (Number(b.deltaMs)||0), 0);
    try{ window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs } }, '*'); }catch{}
    window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: items.length, answers }}, '*');
  }

  // Event listeners
  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; items=Array.isArray(p.content)?p.content:[]; settings=p.config||{}; show('ready'); enterBtn.onclick = countdown; }
  });

  // Drag and drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', handleDrop);

  // Button events
  clearBtn.onclick = () => {
    // Move all assembled letters back to the bank
    const lettersToReturn = Array.from(assembled.children);
    lettersToReturn.forEach(letterEl => {
      letterEl.classList.remove('placed');
      bank.appendChild(letterEl);
    });
    updateWordPreview();
  };
  submitBtn.onclick = submit;
  nextBtn.onclick = next;
  retryBtn.onclick = retry;
})();