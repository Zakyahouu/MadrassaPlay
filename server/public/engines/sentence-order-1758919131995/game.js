(function(){
  let creation, items=[], settings, qIndex=0, score=0, currentTries=0;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),reveal:byId('reveal'),done:byId('done')};
  const enterBtn=byId('enterBtn'); const qIdx=byId('qIdx'); const triesEl=byId('tries'); const scoreEl=byId('score');
  const sequenceTemplate=byId('sequenceTemplate'); const blankSlots=byId('blankSlots'); const itemBank=byId('itemBank');
  const correctAnswer=byId('correctAnswer'); const checkBtn=byId('checkBtn'); const clearBtn=byId('clearBtn'); const nextBtn=byId('nextBtn');

  // instrumentation
  let qStartMs = 0; const answers = [];
  let draggedElement = null;

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function normalize(s){
    let normalized = s.trim();
    if (settings?.allowLowercase !== false) normalized = normalized.toLowerCase();
    if (settings?.includePunctuation === false) normalized = normalized.replace(/[.,!?]/g, '');
    return normalized;
  }

  function validateBracketSyntax(text) {
    const openBrackets = (text.match(/\[/g) || []).length;
    const closeBrackets = (text.match(/\]/g) || []).length;
    return openBrackets === closeBrackets;
  }

  function parseStoryText(storyText) {
    if (!validateBracketSyntax(storyText)) {
      throw new Error('Invalid bracket syntax: brackets must be properly matched');
    }

    const bracketRegex = /\[([^\]]+)\]/g;
    const sentences = [];
    let match;
    let template = storyText;

    while ((match = bracketRegex.exec(storyText)) !== null) {
      const sentence = match[1].trim();
      if (sentence) {
        sentences.push(sentence);
        template = template.replace(match[0], '___');
      }
    }

    return { sentences, template };
  }

  function setLanguageDirection() {
    const html = document.documentElement;
    // Check if any item contains RTL characters
    const hasRTL = items.some(item => {
      if (settings.gameMode === 'sentence_order') {
        return item.sentences.some(s => isRTL(s)) || item.sequenceTemplate && isRTL(item.sequenceTemplate);
      } else if (settings.gameMode === 'word_order') {
        return isRTL(item.targetSentence);
      }
      return false;
    });
    html.setAttribute('dir', hasRTL ? 'rtl' : 'ltr');
  }

  function createDraggableItem(text, type = 'item') {
    const item = document.createElement('div');
    item.className = `draggable ${type}`;
    item.textContent = text;
    item.draggable = true;

    item.addEventListener('dragstart', (e) => {
      draggedElement = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedElement = null;
    });

    return item;
  }

  function createBlankSlot(index) {
    const slot = document.createElement('div');
    slot.className = 'blank-slot';
    slot.dataset.index = index;

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');

      if (draggedElement && !slot.hasChildNodes()) {
        const clone = draggedElement.cloneNode(true);
        clone.className = 'draggable item placed';
        clone.draggable = false;

        // Add remove functionality
        clone.addEventListener('click', () => {
          clone.remove();
        });

        slot.appendChild(clone);
        draggedElement.remove();
      }
    });

    return slot;
  }

  function render(){
    const item = items[qIndex];
    currentTries = settings.maxTries || 3;

    qIdx.textContent = `${qIndex+1}/${items.length}`;
    triesEl.textContent = `❤️ ${currentTries}`;
    scoreEl.textContent = `⭐ ${score}/${items.length}`;

    sequenceTemplate.innerHTML = '';
    blankSlots.innerHTML = '';
    itemBank.innerHTML = '';

    if (settings.gameMode === 'sentence_order') {
      // Parse sequence template with underscore placeholders (one or more underscores = one blank)
      const template = item.sequenceTemplate;
      const parts = template.split(/(\_+)/);
      let blankIndex = 0;

      parts.forEach(part => {
        if (part.match(/^_+$/)) { // One or more underscores together
          const slot = createBlankSlot(blankIndex++);
          blankSlots.appendChild(slot);
        } else if (part.trim()) {
          const textNode = document.createElement('span');
          textNode.className = 'template-text';
          textNode.textContent = part;
          sequenceTemplate.appendChild(textNode);
        }
      });

      // Parse story text with [sentence] syntax
      const { sentences, template: storyTemplate } = parseStoryText(storyText);

      // Validate that we have at least 2 sentences
      if (sentences.length < 2) {
        console.error('Sentence order mode requires at least 2 sentences in [brackets]');
        return;
      }

      // Render template with blanks
      const storyParts = storyTemplate.split(/(\_+)/);
      let storyBlankIndex = 0;

      storyParts.forEach(part => {
        if (part.match(/^_+$/)) { // One or more underscores together
          const slot = createBlankSlot(storyBlankIndex++);
          blankSlots.appendChild(slot);
        } else if (part.trim()) {
          const textNode = document.createElement('span');
          textNode.className = 'template-text';
          textNode.textContent = part;
          sequenceTemplate.appendChild(textNode);
        }
      });

      // Add distractors if they exist
      if (item.distractors) {
        const distractorSentences = item.distractors.split('\n').map(s => s.trim()).filter(Boolean);
        sentences.push(...distractorSentences);
      }
      sentences.sort(() => Math.random() - 0.5); // Shuffle

      sentences.forEach(sentence => {
        const draggableItem = createDraggableItem(sentence, 'sentence');
        itemBank.appendChild(draggableItem);
      });

      sentences.forEach(sentence => {
        const draggableItem = createDraggableItem(sentence, 'sentence');
        itemBank.appendChild(draggableItem);
      });

    } else { // word_order mode
      // Show target sentence with blanks
      const words = item.targetSentence.split(/\s+/).filter(Boolean);
      words.forEach((_, index) => {
        const slot = createBlankSlot(index);
        blankSlots.appendChild(slot);
      });

      // Create draggable words
      const draggableWords = [...words];
      // Add word distractors if they exist
      if (item.wordDistractors) {
        const distractorWords = item.wordDistractors.split('\n').map(s => s.trim()).filter(Boolean);
        draggableWords.push(...distractorWords);
      }
      draggableWords.sort(() => Math.random() - 0.5); // Shuffle

      draggableWords.forEach(word => {
        const draggableItem = createDraggableItem(word, 'word');
        itemBank.appendChild(draggableItem);
      });
    }

    qStartMs = Date.now();
  }

  function checkAnswer() {
    const item = items[qIndex];
    let isCorrect = true;
    let userAnswer = [];

    if (settings.gameMode === 'sentence_order') {
      // Check sentence order
      const slots = blankSlots.querySelectorAll('.blank-slot');
      const { sentences: expectedSentences } = parseStoryText(item.storyText);

      slots.forEach((slot, index) => {
        const placedItem = slot.querySelector('.placed');
        if (placedItem) {
          userAnswer.push(normalize(placedItem.textContent));
        } else {
          userAnswer.push('');
        }
      });

      expectedSentences.forEach((expected, index) => {
        if (normalize(expected) !== userAnswer[index]) {
          isCorrect = false;
        }
      });

    } else { // word_order mode
      // Check word order
      const slots = blankSlots.querySelectorAll('.blank-slot');
      const expectedWords = item.targetSentence.split(/\s+/).filter(Boolean);

      slots.forEach((slot, index) => {
        const placedItem = slot.querySelector('.placed');
        if (placedItem) {
          userAnswer.push(normalize(placedItem.textContent));
        } else {
          userAnswer.push('');
        }
      });

      expectedWords.forEach((expected, index) => {
        if (normalize(expected) !== userAnswer[index]) {
          isCorrect = false;
        }
      });
    }

    // Visual feedback
    blankSlots.classList.add(isCorrect ? 'correct' : 'wrong');

    const deltaMs = Math.max(0, Date.now() - (qStartMs || Date.now()));
    const selectedItems = Array.from(blankSlots.querySelectorAll('.placed')).map(el => el.textContent);
    answers.push({
      index: qIndex,
      selected: selectedItems,
      target: settings.gameMode === 'sentence_order' ? (() => {
        try {
          const { sentences } = parseStoryText(item.storyText);
          return sentences;
        } catch (e) {
          console.error('Error parsing story text:', e);
          return [];
        }
      })() : item.targetSentence,
      correct: isCorrect,
      timeMs: deltaMs,
      triesUsed: (settings.maxTries || 3) - currentTries + 1
    });

    try {
      window.parent.postMessage({
        type:'LIVE_ANSWER',
        payload:{ correct: isCorrect, deltaMs, scoreDelta: isCorrect?1:0, currentScore: score }
      }, '*');
    } catch {}

    if (isCorrect) {
      score++;
      scoreEl.textContent = `⭐ ${score}/${items.length}`;
      setTimeout(() => {
        blankSlots.classList.remove('correct', 'wrong');
        next();
      }, 1500);
    } else {
      currentTries--;
      triesEl.textContent = `❤️ ${currentTries}`;

      if (currentTries <= 0) {
        // Show correct answer
        setTimeout(() => {
          showCorrectAnswer();
        }, 1500);
      } else {
        setTimeout(() => {
          blankSlots.classList.remove('correct', 'wrong');
        }, 1500);
      }
    }
  }

  function showCorrectAnswer() {
    const item = items[qIndex];
    correctAnswer.innerHTML = '';

    if (settings.gameMode === 'sentence_order') {
      const { sentences: expectedSentences, template: correctTemplate } = parseStoryText(item.storyText);
      let sentenceIndex = 0;

      const correctParts = correctTemplate.split(/(\_+)/);

      correctParts.forEach(part => {
        if (part.match(/^_+$/)) { // One or more underscores together
          const answerSpan = document.createElement('span');
          answerSpan.className = 'correct-answer';
          answerSpan.textContent = expectedSentences[sentenceIndex++] || '';
          correctAnswer.appendChild(answerSpan);
        } else if (part.trim()) {
          const textNode = document.createElement('span');
          textNode.className = 'template-text';
          textNode.textContent = part;
          correctAnswer.appendChild(textNode);
        }
      });

      parts.forEach(part => {
        if (part.match(/^_+$/)) { // One or more underscores together
          const answerSpan = document.createElement('span');
          answerSpan.className = 'correct-answer';
          answerSpan.textContent = expectedSentences[sentenceIndex++] || '';
          correctAnswer.appendChild(answerSpan);
        } else if (part.trim()) {
          const textNode = document.createElement('span');
          textNode.className = 'template-text';
          textNode.textContent = part;
          correctAnswer.appendChild(textNode);
        }
      });
    } else {
      const words = item.targetSentence.split(/\s+/).filter(Boolean);
      words.forEach(word => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'correct-answer';
        wordSpan.textContent = word + ' ';
        correctAnswer.appendChild(wordSpan);
      });
    }

    show('reveal');
  }

  function next(){
    qIndex++;
    if (qIndex < items.length) {
      show('play');
      render();
    } else {
      finish();
    }
  }

  function start(){
    show('play');
    setLanguageDirection();
    qIndex=0; score=0; render();
    scoreEl.textContent = `⭐ ${score}/${items.length}`;
  }

  function finish(){
    show('done');
    const summary = byId('summary');
    summary.textContent = `You scored ${score} / ${items.length}`;

    const totalTimeMs = answers.reduce((a,b)=>a+(Number(b.timeMs)||0),0);
    try { window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*'); } catch {}
    window.parent.postMessage({
      type:'GAME_COMPLETE',
      payload:{
        gameCreationId: creation?._id,
        score,
        totalPossibleScore: items.length,
        answers
      }
    }, '*');
  }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; items = Array.isArray(p.content)? p.content: []; settings=p.config||{};
      show('ready');
      enterBtn.onclick = countdown;
    }
  });

  checkBtn.onclick = checkAnswer;
  clearBtn.onclick = () => {
    blankSlots.innerHTML = '';
    // Recreate blank slots
    const item = items[qIndex];
    if (settings.gameMode === 'sentence_order') {
      try {
        const { sentences } = parseStoryText(item.storyText);
        const blankCount = sentences.length;
        for (let i = 0; i < blankCount; i++) {
          blankSlots.appendChild(createBlankSlot(i));
        }
      } catch (e) {
        console.error('Error parsing story text for clear:', e);
      }
    } else {
      const wordCount = item.targetSentence.split(/\s+/).filter(Boolean).length;
      for (let i = 0; i < wordCount; i++) {
        blankSlots.appendChild(createBlankSlot(i));
      }
    }
  };
  nextBtn.onclick = next;
})();
