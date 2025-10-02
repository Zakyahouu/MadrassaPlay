(function(){
	let creation, settings, items=[], idx=0, score=0, timerIv, qStartMs = 0;
	const answers = [];
	const byId = (id) => document.getElementById(id);

	// --- UPDATED Dynamic Theme Palettes (Based on your images) ---
	const themes = [
		{ bg: 1, color: '#ec4899' },  // Vibrant Pink (from 1.jpg)
		{ bg: 2, color: '#ec4899' },  // Vibrant Pink
		{ bg: 3, color: '#ec4899' },  // Vibrant Pink
		{ bg: 4, color: '#3b82f6' },  // Royal Blue (from 4.jpg)
		{ bg: 5, color: '#3b82f6' },  // Royal Blue
		{ bg: 6, color: '#3b82f6' },  // Royal Blue
		{ bg: 7, color: '#22c55e' },  // Leafy Green (from 7.jpg)
		{ bg: 8, color: '#22c55e' },  // Leafy Green
		{ bg: 9, color: '#22c55e' },  // Leafy Green
		{ bg: 10, color: '#fb923c' }, // Academic Orange (from 10.jpg)
		{ bg: 11, color: '#fb923c' }, // Academic Orange
		{ bg: 12, color: '#f97316' }, // Fiery Orange (from 12.jpg)
		{ bg: 13, color: '#f97316' }  // Fiery Orange
	];

	// --- Element References ---
	const screens = { ready: byId('ready-screen'), countdown: byId('countdown-screen'), play: byId('play-screen'), done: byId('done-screen') };
	const enterBtn = byId('enter-btn');
	const qIdxEl = byId('q-idx');
	const timerTextEl = byId('timer-display').querySelector('.text');
	const scoreTextEl = byId('score-display').querySelector('.text');
	const qCard = byId('question-card');
	const qEl = byId('question-text');
	const optsGrid = byId('options-grid');
	const explainEl = byId('explain-container');
	const timerBorder = byId('timer-border');
	const nextBtn = byId('next-btn');
	
	const show = (id) => { Object.values(screens).forEach(s => s.classList.add('hidden')); screens[id].classList.remove('hidden'); };
	const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([_, v]) => v);
	const stopTimer = () => { if (timerIv) { clearInterval(timerIv); timerIv = null; } };

	const countdown = () => { 
		show('countdown');
		let n = 3;
		const c = document.querySelector('#countdown-screen .count');
		c.textContent = n;
		const iv = setInterval(() => { n--; c.textContent = n; if (n <= 0) { clearInterval(iv); start(); } }, 800); 
	};
	
	const render = () => {
		const item = items[idx];
		if (!item) { finish(); return; }

		stopTimer();
		
		// --- DYNAMIC THEME LOGIC ---
		const defaultColor = '#3b82f6'; // Default blue
		if (!settings.backgroundUrl) {
			const bgIndex = (idx % 13) + 1;
			document.body.style.backgroundImage = `url(assets/${bgIndex}.jpg)`;
			const theme = themes.find(t => t.bg === bgIndex);
			document.documentElement.style.setProperty('--primary-color', theme ? theme.color : defaultColor);
		} else {
			document.documentElement.style.setProperty('--primary-color', defaultColor);
		}

		// Reset UI state for the new question
		qIdxEl.textContent = `${idx + 1} / ${items.length}`;
		explainEl.classList.add('hidden');
		nextBtn.classList.add('hidden');
		qEl.textContent = item.question;
		
		const optionsMap = { A: 'triangle', B: 'diamond', C: 'square', D: 'circle' };
		const rawOptions = [['A', item.optionA], ['B', item.optionB], ['C', item.optionC], ['D', item.optionD]].filter(([_, val]) => val?.trim());
		
		optsGrid.innerHTML = '';
		optsGrid.className = `options-grid ${rawOptions.length === 3 ? 'three-options' : ''}`;
		
		rawOptions.forEach(([key, label]) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'opt';
			btn.textContent = label;
			btn.setAttribute('data-key', key);
			btn.setAttribute('data-shape', optionsMap[key]);
			btn.onclick = () => lockAndReveal(key);
			optsGrid.appendChild(btn);
		});

		// --- TIMER SETUP & BUG FIX ---
		const sec = settings.timePerQuestion || 0;
		if (sec > 0) {
			let timeLeft = sec;
			timerTextEl.textContent = `${timeLeft}s`;
			
			timerBorder.style.transition = 'none';
			timerBorder.style.width = '100%';
			void timerBorder.offsetWidth;
			
			timerBorder.style.transition = `width ${sec}s linear`;
			timerBorder.style.width = '0%';
			
			timerIv = setInterval(() => {
				timeLeft--;
				timerTextEl.textContent = `${timeLeft}s`;
				if (timeLeft <= 3 && timeLeft > 0) qCard.style.animation = 'shake 0.5s infinite';
				if (timeLeft <= 0) lockAndReveal(null, true);
			}, 1000);
		} else {
			timerTextEl.textContent = '---';
			timerBorder.style.width = '100%';
		}
		
		qStartMs = Date.now();
	};

	const lockAndReveal = (selectedKey, timedOut = false) => {
		stopTimer();
		qCard.style.animation = '';
		
		const item = items[idx];
		if (!item) return;

		const correctKey = String(item.correct || 'A').toUpperCase();
		const ok = selectedKey && selectedKey.toUpperCase() === correctKey;
		if (ok) {
			score++;
			scoreTextEl.textContent = score;
			scoreTextEl.classList.add('pop');
			scoreTextEl.addEventListener('animationend', () => scoreTextEl.classList.remove('pop'), { once: true });
		}
		
		const deltaMs = Math.max(0, Date.now() - qStartMs);
		window.parent.postMessage({ type:'LIVE_ANSWER', payload: { correct: ok, deltaMs, scoreDelta: ok ? 1 : 0, currentScore: score } }, '*');
		answers.push({ index: idx, correct: ok, selectedKey: selectedKey || 'TIMEOUT', timeMs: deltaMs });

		[...optsGrid.children].forEach(b => {
			const key = b.getAttribute('data-key');
			if (key.toUpperCase() === correctKey) b.classList.add('correct');
			else if (key === selectedKey) b.classList.add('wrong');
			b.disabled = true;
		});

		if (item.explanation) {
			explainEl.innerHTML = `<strong>Explanation:</strong> ${item.explanation}`;
			explainEl.classList.remove('hidden');
		}

		nextBtn.classList.remove('hidden');
		nextBtn.onclick = () => {
			idx++;
			render();
		};
	};

	const start = () => { show('play'); idx = 0; score = 0; scoreTextEl.textContent = score; render(); };
	
	const finish = () => {
		show('done');
		stopTimer();
		byId('summary-text').textContent = `You scored ${score} out of ${items.length}!`;
		const totalTimeMs = answers.reduce((a, b) => a + (b.timeMs || 0), 0);
		window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*');
		window.parent.postMessage({ type:'GAME_COMPLETE', payload: { gameCreationId: creation?.gameCreationId || creation?._id, score, totalPossibleScore: items.length, answers }}, '*');
	};
	
	window.addEventListener('message', (e) => {
		if (e.data?.type === 'INIT_GAME') {
			const p = e.data.payload;
			creation = p;
			settings = p.config || {};
			items = Array.isArray(p.content) ? p.content : [];
			if (settings.shuffleQuestions) items = shuffle(items);
			if (items.length === 0) { byId('ready-screen').innerHTML = '<h2>Error: No questions provided.</h2>'; return; }
			show('ready'); 
			enterBtn.onclick = countdown;
		}
	});
})();