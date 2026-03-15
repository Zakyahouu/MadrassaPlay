(function () {
    let items = [], settings = {}, idx = 0, score = 0, timerInterval = null;
    let correctSentences = [];
    let draggedElement = null;
    let touchClone = null;

    const byId = id => document.getElementById(id);
    const screens = { ready: byId('ready-screen'), countdown: byId('countdown-screen'), play: byId('play-screen'), done: byId('done-screen') };
    const startBtn = byId('start-btn');
    const countdownNumber = byId('countdown-number');
    const progressEl = byId('progress');
    const timerEl = byId('timer');
    const storyContainer = byId('story-container');
    const sentenceBank = byId('sentence-bank');
    const checkBtn = byId('check-btn');
    const nextBtn = byId('next-btn');
    const finalScoreEl = byId('final-score');

    const showScreen = (id) => {
        Object.values(screens).forEach(s => s.classList.add('hidden'));
        screens[id].classList.remove('hidden');
    };

    const runCountdown = () => {
        showScreen('countdown');
        let count = 3;
        countdownNumber.textContent = count;
        const iv = setInterval(() => {
            count--;
            countdownNumber.textContent = count;
            if (count <= 0) { clearInterval(iv); start(); }
        }, 1000);
    };

    const start = () => {
        showScreen('play');
        idx = 0; score = 0;
        renderPuzzle();
    };

    const renderPuzzle = () => {
        if (idx >= items.length) { finish(); return; }

        checkBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        progressEl.textContent = `${idx + 1}/${items.length}`;

        const item = items[idx];
        correctSentences = (item.gapSentences || '').split('\n').filter(s => s.trim() !== '');

        storyContainer.innerHTML = '';
        const storyParts = (item.fullText || '').split('___');
        storyParts.forEach((part, index) => {
            storyContainer.append(document.createTextNode(part));
            if (index < storyParts.length - 1) {
                const gap = document.createElement('span');
                gap.className = 'gap-slot';
                gap.dataset.gapIndex = index;
                gap.addEventListener('dragover', handleDragOver);
                gap.addEventListener('dragleave', handleDragLeave);
                gap.addEventListener('drop', handleDrop);
                gap.addEventListener('click', handleGapClick);
                storyContainer.appendChild(gap);
            }
        });
        
        let allSentences = [...correctSentences];
        const distractors = (item.distractors || '').split('\n').filter(s => s.trim() !== '');
        allSentences.push(...distractors);

        sentenceBank.innerHTML = '';
        shuffle(allSentences).forEach(sentence => {
            if (sentence.trim()) createSentenceCard(sentence, sentenceBank);
        });
        
        startTimer(settings.timeLimit || 60);
    };

    function createSentenceCard(sentence, parent) {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.textContent = sentence;
        card.draggable = true;
        card.addEventListener('click', () => handleCardClick(card));
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        
        // Add touch support for mobile
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd);
        
        parent.appendChild(card);
    }

    const startTimer = (duration) => {
        stopTimer();
        let timeLeft = duration;
        const updateTimer = () => {
            const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const seconds = String(timeLeft % 60).padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
        };
        updateTimer();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) { stopTimer(); checkAnswer(); }
        }, 1000);
    };
    const stopTimer = () => { if (timerInterval) clearInterval(timerInterval); };

    function handleCardClick(card) {
        const firstEmptyGap = storyContainer.querySelector('.gap-slot:not(.filled)');
        if (firstEmptyGap) {
            placeCardInGap(card, firstEmptyGap);
        }
    }

    function handleGapClick(e) {
        const gap = e.currentTarget;
        if (gap.classList.contains('filled')) {
            returnCardToBank(gap);
        }
    }

    function returnCardToBank(gap) {
        const sentenceText = gap.dataset.sentenceText;
        
        // Find the card in the bank that was used
        const cards = sentenceBank.querySelectorAll('.sentence-card');
        let matchingCard = null;
        
        cards.forEach(card => {
            if (card.textContent === sentenceText && card.classList.contains('used')) {
                matchingCard = card;
            }
        });
        
        // If we found the matching card, make it visible again
        if (matchingCard) {
            matchingCard.classList.remove('used');
        }
        
        // Clear the gap
        gap.textContent = '';
        gap.classList.remove('filled', 'correct', 'wrong');
        delete gap.dataset.sentenceText;
    }

    function placeCardInGap(card, gap) {
        // If gap already has a sentence, return it to the bank first
        if (gap.classList.contains('filled') && gap.dataset.sentenceText) {
            const oldSentenceText = gap.dataset.sentenceText;
            
            // Find and restore the old card
            const cards = sentenceBank.querySelectorAll('.sentence-card');
            cards.forEach(oldCard => {
                if (oldCard.textContent === oldSentenceText && oldCard.classList.contains('used')) {
                    oldCard.classList.remove('used');
                }
            });
        }
        
        // Set gap text content to the sentence
        const sentenceText = card.textContent;
        gap.textContent = sentenceText;
        gap.classList.add('filled');
        gap.classList.remove('correct', 'wrong');
        
        // Hide the original card
        card.classList.add('used');
        
        // Store the sentence text in a data attribute for checking later
        gap.dataset.sentenceText = sentenceText;
    }

    const handleDragStart = (e) => { draggedElement = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); };
    const handleDragEnd = (e) => { e.target.classList.remove('dragging'); };
    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };
    const handleDrop = (e) => {
        e.preventDefault();
        const gap = e.currentTarget;
        gap.classList.remove('drag-over');
        placeCardInGap(draggedElement, gap);
    };
    
    // Touch handlers for mobile
    function handleTouchStart(e) {
        const card = e.target;
        if (card.classList.contains('used')) {
            e.preventDefault();
            return;
        }
        
        e.preventDefault();
        draggedElement = card;
        card.classList.add('dragging');
        
        // Create a visual clone
        touchClone = card.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.zIndex = '1000';
        touchClone.style.opacity = '0.8';
        document.body.appendChild(touchClone);
        
        const touch = e.touches[0];
        updateTouchClonePosition(touch.clientX, touch.clientY);
    }

    function handleTouchMove(e) {
        if (!draggedElement || !touchClone) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        updateTouchClonePosition(touch.clientX, touch.clientY);
        
        // Highlight gap if hovering
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        document.querySelectorAll('.gap-slot').forEach(gap => {
            gap.classList.remove('drag-over');
        });
        
        if (elementBelow && elementBelow.classList.contains('gap-slot')) {
            elementBelow.classList.add('drag-over');
        }
    }

    function handleTouchEnd(e) {
        if (!draggedElement || !touchClone) return;
        
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        document.querySelectorAll('.gap-slot').forEach(gap => {
            gap.classList.remove('drag-over');
        });
        
        if (elementBelow && elementBelow.classList.contains('gap-slot')) {
            placeCardInGap(draggedElement, elementBelow);
        }
        
        // Cleanup
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        
        if (touchClone && touchClone.parentNode) {
            touchClone.parentNode.removeChild(touchClone);
        }
        touchClone = null;
    }

    function updateTouchClonePosition(x, y) {
        if (!touchClone) return;
        touchClone.style.left = (x - touchClone.offsetWidth / 2) + 'px';
        touchClone.style.top = (y - touchClone.offsetHeight / 2) + 'px';
    }
    
    const checkAnswer = () => {
        stopTimer();
        const gaps = storyContainer.querySelectorAll('.gap-slot');
        let allCorrect = true;
        
        gaps.forEach((gap, index) => {
            const userAnswer = (gap.dataset.sentenceText || "").trim();
            const correctAnswer = (correctSentences[index] || "").trim();

            if (userAnswer === correctAnswer) {
                gap.classList.add('correct');
                gap.classList.remove('wrong');
            } else {
                gap.classList.add('wrong');
                gap.classList.remove('correct');
                allCorrect = false;
            }
        });

        if (allCorrect) { score++; }
        
        // Send live answer event
        try {
            window.parent.postMessage({
                type: 'LIVE_ANSWER',
                payload: {
                    correct: allCorrect,
                    deltaMs: 0,
                    scoreDelta: allCorrect ? 1 : 0,
                    currentScore: score
                }
            }, '*');
        } catch (e) {}
        
        // Hide check button immediately
        checkBtn.classList.add('hidden');
        
        // If all correct, show green feedback for 1.5 seconds before showing next button
        if (allCorrect) {
            setTimeout(() => {
                nextBtn.classList.remove('hidden');
            }, 1500); // 1.5 second delay to show the green boxes
        } else {
            // If wrong, show next button immediately
            nextBtn.classList.remove('hidden');
        }
    };

    const goToNext = () => { 
        idx++; 
        renderPuzzle(); 
    };
    
    const finish = () => {
        finalScoreEl.textContent = `Your final score is ${score} out of ${items.length}.`;
        showScreen('done');
        
        // Send game complete event
        try {
            window.parent.postMessage({
                type: 'GAME_COMPLETE',
                payload: {
                    score: score,
                    totalPossibleScore: items.length,
                    answers: []
                }
            }, '*');
        } catch (e) {}
    };
    
    const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

    startBtn.onclick = runCountdown;
    checkBtn.onclick = checkAnswer;
    nextBtn.onclick = goToNext;
    
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'INIT_GAME') {
            settings = e.data.payload.config || {};
            items = e.data.payload.content || [];
            if (items.length > 0) { showScreen('ready'); }
            else { document.body.innerHTML = '<h1>Error: No content found.</h1>'; }
        }
    });
})();