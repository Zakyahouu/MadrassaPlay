(function(){
	let creation, settings, items=[], idx=0, score=0, timerIv, timeLeft=0, selected=null;
	const byId=(id)=>document.getElementById(id);
	const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
	const enterBtn=byId('enterBtn'); const qIdx=byId('qIdx'); const timer=byId('timer'); const scoreEl=byId('score');
	const qEl=byId('question'); const opts=byId('options'); const explain=byId('explain'); const nextBtn=byId('nextBtn');

	function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
	function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }
	function shuffle(a){ return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(([_,v])=>v); }

	function secondsPerQuestion(){
		const opt = String(settings?.timePerQuestion || '0 - No timer');
		const m = opt.match(/^(\d+)/); return m? Number(m[1]) : 0;
	}

	function current(){ return items[idx]; }

	function render(){
		const it=current(); if(!it){ finish(); return; }
		qIdx.textContent = `${idx+1}/${items.length}`;
		qEl.textContent = it.question;
		scoreEl.textContent = `★ ${score}/${items.length}`;
		explain.textContent = '';
		nextBtn.disabled = true;
		selected = null;
		// build options list from available fields A-D; enforce single-selection radio-like
		const rawOptions = [
			['A', it.optionA], ['B', it.optionB], ['C', it.optionC], ['D', it.optionD]
		].filter(([key, val])=> typeof val === 'string' && val.trim().length>0);
		const options = (settings?.shuffleChoices!==false) ? shuffle(rawOptions) : rawOptions;
		opts.innerHTML='';
		options.forEach(([key,label])=>{
			const btn=document.createElement('button');
			btn.type='button'; btn.className='opt'; btn.textContent=label;
			btn.onclick=()=> select(btn, key, it.correct);
			opts.appendChild(btn);
		});
		// set timer
		const sec = secondsPerQuestion();
		if (sec>0){
			timeLeft = sec; timer.textContent = `⏱️ ${timeLeft}s`;
			if (timerIv) clearInterval(timerIv);
			timerIv = setInterval(()=>{ timeLeft--; timer.textContent = `⏱️ ${timeLeft}s`; if (timeLeft<=0){ clearInterval(timerIv); lockAndReveal(); } }, 1000);
		} else { timer.textContent = ''; if (timerIv) clearInterval(timerIv); }
	}

	function select(btn, key, correct){
		// single selection
		[...opts.children].forEach(b=> b.classList.remove('selected'));
		btn.classList.add('selected');
		selected = key;
		nextBtn.disabled = false;
	}

	function lockAndReveal(){
		const it=current(); if(!it) return;
		if (timerIv) { clearInterval(timerIv); timerIv=null; }
		// grade
		const ok = String(selected||'').toUpperCase() === String(it.correct||'A').toUpperCase();
		if (ok) score++;
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
		if (settings?.showExplanations && it.explanation){ explain.textContent = `Why: ${it.explanation}`; }
		nextBtn.disabled = false;
	}

	nextBtn.onclick = ()=>{ if([...opts.children].some(b=>b.disabled)) { idx++; render(); } else { lockAndReveal(); } };

	function start(){ show('play'); idx=0; score=0; render(); }
	function finish(){ show('done'); const total=items.length; const summary=byId('summary'); summary.textContent = `You scored ${score} / ${total}`; window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: total }}, '*'); }

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
				explanation: q.explanation||''
			})) : [];
			show('ready'); enterBtn.onclick = countdown;
		}
	});
})();
