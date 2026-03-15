(function () {
    let creation, settings, items = [],
        idx = 0, score = 0, currentAttempts = 0, timerInterval = null;
    const byId = id => document.getElementById(id);

    // --- Element References ---
    const container = byId('container');
    const screens = { ready: byId('ready-screen'), play: byId('play-screen'), done: byId('done-screen') };
    const loader = byId('loader'); 
    const readyContent = [byId('start-btn'), document.querySelector('.logo'), document.querySelector('.title')];
    const startBtn = byId('start-btn');
    const timerContainer = byId('timer-container');
    const scoreContainer = byId('score-container');
    const timerEl = byId('timer');
    const progressEl = byId('progress');
    const attemptsContainer = byId('attempts-container');
    const attemptsEl = byId('attempts');
    const hintBox = byId('hint-box');
    const hintText = byId('hint-text');
    const wordPreview = byId('word-preview');
    const buildArea = byId('build-area');
    const letterBank = byId('letter-bank');
    const clearBtn = byId('clear-btn');
    const checkBtn = byId('check-btn');
    const goNextBtn = byId('go-next-btn');
    const summaryText = byId('summary-text');

    let draggedElement = null;

    const showScreen = (id) => {
        Object.values(screens).forEach(s => s.classList.add('hidden'));
        screens[id].classList.remove('hidden');
    };

    const start = () => {
        document.body.classList.remove('game-ended'); // Ensure end-game class is removed on new start
        showScreen('play');
        idx = 0;
        score = 0;
        renderPuzzle();
    };

    const renderPuzzle = () => {
        const puzzle = items[idx];
        if (!puzzle) {
            finish();
            return;
        }

        stopTimer();
        container.classList.remove('correct-state');
        buildArea.classList.remove('wrong-state');
        buildArea.innerHTML = '<span class="placeholder">Drop letters here to build your world . . .</span>';
        wordPreview.textContent = '';
        
        progressEl.textContent = `${idx + 1}/${items.length}`;
        scoreContainer.classList.remove('hidden');

        if (settings.gameMode === 'attempts_based') {
            currentAttempts = settings.maxAttempts || 3;
            attemptsEl.textContent = currentAttempts;
            attemptsContainer.classList.remove('hidden');
            timerContainer.classList.add('hidden');
        } else {
            attemptsContainer.classList.add('hidden');
            timerContainer.classList.remove('hidden');
            startTimer(settings.timePerWord || 30);
        }

        if (puzzle.hint && settings.showHints) {
            hintText.textContent = puzzle.hint;
            hintBox.style.display = 'block';
        } else {
            hintBox.style.display = 'none';
        }

        letterBank.innerHTML = '';
        let lettersToUse = (puzzle.word || '').split('');
        if (puzzle.extraLetters) {
            lettersToUse = lettersToUse.concat((puzzle.extraLetters || '').split(''));
        }
        
        shuffle(lettersToUse).forEach(letter => {
            if (letter.trim() !== '') createLetterButton(letter, letterBank);
        });

        checkBtn.classList.remove('hidden');
        clearBtn.classList.remove('hidden');
        goNextBtn.classList.add('hidden');
    };

    function createLetterButton(letter, parent) {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter.toUpperCase();
        btn.draggable = true;

        btn.addEventListener('click', () => handleLetterClick(btn));
        btn.addEventListener('dragstart', handleDragStart);
        btn.addEventListener('dragend', handleDragEnd);
        btn.addEventListener('dragover', handleDragOver);
        btn.addEventListener('drop', handleDropOnLetter);
        
        parent.appendChild(btn);
    }
    
    function startTimer(duration) {
        let timeLeft = duration;
        timerEl.textContent = `${timeLeft}s`;
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) {
                stopTimer();
                handleTimeoutOrNoTries();
            }
        }, 1000);
    }

    const stopTimer = () => {
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    };

    function updateWordPreview() {
        const builtWord = Array.from(buildArea.children).map(btn => btn.textContent).join('');
        wordPreview.textContent = builtWord;
    }
    
    function handleLetterClick(btn) {
        if (btn.parentElement === letterBank) moveLetter(btn, 'to_build');
        else moveLetter(btn, 'to_bank');
    }

    function moveLetter(btn, destination) {
        const target = destination === 'to_build' ? buildArea : letterBank;
        if (buildArea.querySelector('.placeholder')) buildArea.innerHTML = '';
        target.appendChild(btn);
        if (buildArea.children.length === 0) buildArea.innerHTML = '<span class="placeholder">Drop letters here to build your world . . .</span>';
        updateWordPreview();
    }

    function handleDragStart() { draggedElement = this; this.classList.add('dragging'); }
    function handleDragEnd() { if(draggedElement) draggedElement.classList.remove('dragging'); draggedElement = null; }
    function handleDragOver(e) { e.preventDefault(); }
    function handleDropOnBuildArea(e) { e.preventDefault(); if (draggedElement) moveLetter(draggedElement, 'to_build'); }
    function handleDropOnLetter(e) {
        e.preventDefault(); e.stopPropagation();
        if (draggedElement && draggedElement !== this && this.parentElement === buildArea) {
            this.parentElement.insertBefore(draggedElement, this);
            updateWordPreview();
        }
    }

    function checkAnswer() {
        const puzzle = items[idx];
        const builtWord = Array.from(buildArea.children).map(btn => btn.textContent).join('');

        if (builtWord.toLowerCase() === (puzzle.word || '').toLowerCase()) {
            stopTimer();
            score++;
            container.classList.add('correct-state');
            wordPreview.textContent = 'Correct!!!!';
            checkBtn.classList.add('hidden');
            clearBtn.classList.add('hidden');
            goNextBtn.classList.remove('hidden');
        } else {
            wordPreview.textContent = 'Wrong word';
            buildArea.classList.add('wrong-state');

            if (settings.gameMode === 'attempts_based') {
                currentAttempts--;
                attemptsEl.textContent = currentAttempts;
                if (currentAttempts <= 0) {
                    stopTimer();
                    handleTimeoutOrNoTries();
                    return;
                }
            }

            setTimeout(() => {
                buildArea.classList.remove('wrong-state');
                clearBuildArea();
            }, 1200);
        }
    }
    
    function handleTimeoutOrNoTries() {
        buildArea.innerHTML = `<span class="feedback-text">Word was: ${items[idx].word.toUpperCase()}</span>`;
        letterBank.innerHTML = '';
        checkBtn.classList.add('hidden');
        clearBtn.classList.add('hidden');
        goNextBtn.classList.remove('hidden');
    }

    function clearBuildArea() {
        const lettersInBuildArea = Array.from(buildArea.children);
        lettersInBuildArea.forEach(btn => {
            if (btn.classList.contains('letter-btn')) moveLetter(btn, 'to_bank');
        });
        updateWordPreview();
    }

    function goToNext() {
        idx++;
        renderPuzzle();
    }

    function finish() {
        stopTimer();
        // CORRECTED: Apply the correct classes for the end screen
        document.body.classList.add('game-ended');
        container.classList.add('correct-state'); 
        summaryText.textContent = `You scored ${score} out of ${items.length}!`;
        showScreen('done');
        window.parent.postMessage({ type:'GAME_COMPLETE', payload: { score, totalPossibleScore: items.length }}, '*');
    }

    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    function preloadAssets(assetList, onComplete) {
        if (!assetList || assetList.length === 0) { onComplete(); return; }
        let loaded = 0;
        assetList.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = img.onerror = () => {
                loaded++;
                if(loaded === assetList.length) onComplete();
            }
        });
    }

    startBtn.onclick = start;
    clearBtn.onclick = clearBuildArea;
    checkBtn.onclick = checkAnswer;
    goNextBtn.onclick = goToNext;
    buildArea.addEventListener('dragover', handleDragOver);
    buildArea.addEventListener('drop', handleDropOnBuildArea);

    window.addEventListener('message', (e) => {
        if (e.data?.type === 'INIT_GAME') {
            creation = e.data.payload;
            settings = creation.config || {};
            items = Array.isArray(creation.content) ? creation.content : [];

            if (items.length > 0) {
                const assetsToLoad = ['assets/image.png', 'assets/image_correct.png', 'assets/background_end.png'];
                preloadAssets(assetsToLoad, () => {
                    loader.classList.add('hidden');
                    readyContent.forEach(el => el.classList.remove('hidden'));
                });
                showScreen('ready');
            } else {
                document.body.innerHTML = '<h1>Error: No game content found.</h1>';
            }
        }
    });
})();