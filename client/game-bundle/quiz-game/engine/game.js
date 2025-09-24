(function(){
	let creation, settings, items=[], idx=0, score=0, timerIv, timeLeft=0, selected=null, selectedLabel=null;
	const byId=(id)=>document.getElementById(id);
	const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
	const enterBtn=byId('enterBtn'); const qIdx=byId('qIdx'); const timer=byId('timer'); const scoreEl=byId('score');
	const qEl=byId('question'); const opts=byId('options'); const explain=byId('explain'); const nextBtn=byId('nextBtn');
	// instrumentation
	let qStartMs = 0; const answers = [];

	function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
	function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }
	function shuffle(a){ return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(([_,v])=>v); }

	function secondsPerQuestion(){
			// Use per-question timeLimit if present, else fallback to global setting
			const it = current();
			if (it && typeof it.timeLimit === 'number') return it.timeLimit;
			const opt = String(settings?.timePerQuestion || '0 - No timer');
			const m = opt.match(/^(\d+)/); return m? Number(m[1]) : 0;
	}

	function current(){ return items[idx]; }

	function render(){
		const it=current(); if(!it){ finish(); return; }
		// Background switching logic
		const bgImages = [
			'assets/Colorful Minimalism1.jpg', 'assets/Colorful Minimalism2.jpg', 'assets/Colorful Minimalism3.jpg',
			'assets/Modern Abstract Shapes1.jpg', 'assets/Modern Abstract Shapes2.jpg', 'assets/Modern Abstract Shapes3.jpg',
			'assets/Nature Inspiration1.jpg', 'assets/Nature Inspiration2.jpg', 'assets/Nature Inspiration3.jpg',
			'assets/Playful School Theme1.jpg', 'assets/Playful School Theme2.jpg',
			'assets/Space Adventure1.jpg', 'assets/Space Adventure2.jpg'
		];
		const bg = bgImages[Math.floor(Math.random()*bgImages.length)];
		document.body.style.backgroundImage = `url('${bg}')`;
		document.body.style.backgroundSize = 'cover';
		document.body.style.backgroundPosition = 'center';
		document.body.style.transition = 'background-image 0.5s';
		qIdx.textContent = `${idx+1}/${items.length}`;
		qEl.textContent = it.question;
		scoreEl.textContent = `★ ${score}/${items.length}`;
		explain.textContent = '';
		nextBtn.disabled = true;
		selected = null;
	selectedLabel = null;
		// build options list from available fields A-D; enforce single-selection radio-like
		const rawOptions = [
			['A', it.optionA], ['B', it.optionB], ['C', it.optionC], ['D', it.optionD]
		].filter(([key, val])=> typeof val === 'string' && val.trim().length>0);
		const options = (settings?.shuffleChoices!==false) ? shuffle(rawOptions) : rawOptions;
		opts.innerHTML='';
		// grid layout: if 3 options, center last one
		if (options.length === 3) {
			for (let i=0; i<2; i++) {
				const [key,label]=options[i];
				const btn=document.createElement('button');
				btn.type='button'; btn.className='opt'; btn.textContent=label;
				btn.onclick=()=> select(btn, key, it.correct);
				opts.appendChild(btn);
			}
			// empty cell then centered third
			const empty=document.createElement('div'); empty.style.visibility='hidden'; opts.appendChild(empty);
			const [key,label]=options[2];
			const btn=document.createElement('button');
			btn.type='button'; btn.className='opt'; btn.textContent=label;
			btn.onclick=()=> select(btn, key, it.correct);
			opts.appendChild(btn);
		} else {
			options.forEach(([key,label])=>{
				const btn=document.createElement('button');
				btn.type='button'; btn.className='opt'; btn.textContent=label;
				btn.onclick=()=> select(btn, key, it.correct);
				opts.appendChild(btn);
			});
		}
		// progress bar
		const progressFill = document.getElementById('progressFill');
		if (progressFill) progressFill.style.width = `${((idx+1)/items.length)*100}%`;
		// set timer
		const sec = secondsPerQuestion();
		if (sec>0){
			timeLeft = sec; timer.textContent = `⏱️ ${timeLeft}s`;
			if (timerIv) clearInterval(timerIv);
			timerIv = setInterval(()=>{
				timeLeft--;
				timer.textContent = `⏱️ ${timeLeft}s`;
				// Animate shake when time is low
				const qCard = document.querySelector('.question-card');
				if (qCard) {
					if (timeLeft <= 3 && timeLeft > 0) {
						qCard.style.animation = 'shake 0.3s';
						qCard.addEventListener('animationend', ()=>{qCard.style.animation='';},{once:true});
					} else {
						qCard.style.animation = '';
					}
				}
				if (timeLeft<=0){ clearInterval(timerIv); lockAndReveal(); }
			}, 1000);
		} else { timer.textContent = ''; if (timerIv) clearInterval(timerIv); }
		qStartMs = Date.now();
	}

	function select(btn, key, correct){
		// single selection
		[...opts.children].forEach(b=> b.classList.remove('selected'));
		btn.classList.add('selected');
		selected = key;
	selectedLabel = btn.textContent;
	nextBtn.disabled = false;
	// auto-advance after selection
	setTimeout(()=>{ lockAndReveal(); }, 400);
	}

	function lockAndReveal(){
		const it=current(); if(!it) return;
		if (timerIv) { clearInterval(timerIv); timerIv=null; }
		// grade
	const correctKey = String(it.correct||'A').toUpperCase();
	const selectedKey = String(selected||'').toUpperCase();
	const ok = selectedKey === correctKey;
	const deltaMs = Math.max(0, Date.now() - (qStartMs || Date.now()));
		if (ok) score++;
	// record + emit live
	answers.push({ index: idx, correct: ok, selectedText: String(selectedLabel||'').trim(), timeMs: deltaMs });
	try { window.parent.postMessage({ type:'LIVE_ANSWER', payload:{ correct: ok, deltaMs, scoreDelta: ok?1:0, currentScore: score }}, '*'); } catch {}
		// mark options
		[...opts.children].forEach(b=>{
			const isThis = b.classList.contains('selected');
			// We can’t reverse-lookup key after shuffle, so compare by label text
			const label = b.textContent;
			const keyForBtn = ['A','B','C','D'].find(k=> it['option'+k]===label) || '';
			if (keyForBtn.toUpperCase() === String(it.correct).toUpperCase()) b.classList.add('correct');
			else if (isThis) b.classList.add('wrong');
			b.disabled = true;
		});
	if (settings?.showExplanations && it.explanation){ explain.textContent = `Explanation: ${it.explanation}`; }
	// Motivational message
	const msg = document.createElement('div');
	msg.className = 'motivate';
	msg.textContent = ok ? 'Great job!' : 'Keep trying!';
	explain.appendChild(msg);
	// Sound effect hooks (simple, can be replaced with actual audio)
	if (ok) { /* play correct sound */ }
	else { /* play wrong sound */ }
	nextBtn.disabled = false;
	// auto-advance to next question after explanation
	setTimeout(()=>{ idx++; render(); }, 1200);
	}

	nextBtn.onclick = ()=>{ if([...opts.children].some(b=>b.disabled)) { idx++; render(); } else { lockAndReveal(); } };

	function start(){ show('play'); idx=0; score=0; render(); }
	function finish(){
		show('done');
		const total=items.length;
		const summary=byId('summary');
		summary.textContent = `You scored ${score} / ${total}`;
		const totalTimeMs = answers.reduce((a,b)=> a + (Number(b.timeMs)||0), 0);
		try { window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*'); } catch {}
		window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: total, answers }}, '*');
	}

	window.addEventListener('message', (e)=>{
			if (e.data?.type==='INIT_GAME'){
				const p=e.data.payload; creation=p; settings=p.config||{};
				// normalize items from content
				items = Array.isArray(p.content) ? p.content.map(q=>({
					question: q.question?.trim()||'',
					optionA: q.optionA?.trim()||'',
					optionB: q.optionB?.trim()||'',
					optionC: q.optionC?.trim()||'',
					optionD: q.optionD?.trim()||'',
					correct: (q.correct||'A').toUpperCase(),
					explanation: q.explanation||'',
					timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : 0
				})) : [];
				// Shuffle questions if enabled
				if (settings?.shuffleQuestions) items = shuffle(items);
				show('ready'); enterBtn.onclick = countdown;
		}
	});
})();
