(function(){
  let creation, settings, pairs=[], gridEl, first=null, second=null, lock=false, found=0, moves=0;
  const byId=(id)=>document.getElementById(id);
  const screens={ready:byId('ready'),countdown:byId('countdown'),play:byId('play'),done:byId('done')};
    const enterBtn=byId('enterBtn'); const movesEl=byId('moves'); const pairsEl=byId('pairs'); const summary=byId('summary');
  // instrumentation
  let startMs = 0; const answers = [];

  function show(id){ Object.values(screens).forEach(s=>s.classList.add('hidden')); screens[id].classList.remove('hidden'); }
  function countdown(){ show('countdown'); let n=3; const c=document.querySelector('#countdown .count'); c.textContent=n; const iv=setInterval(()=>{ n--; c.textContent=n; if(n<=0){ clearInterval(iv); start(); } }, 800); }

  function shuffle(a){ return a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(([_,v])=>v); }

  function themePairs(){
    const theme = settings?.theme || 'numbers';
  const hasContent = Array.isArray(creation?.content) && creation.content.length;
  const contentHasImages = hasContent && creation.content.some(p => p && p.imageA && p.imageB);
  const useImages = (settings?.pairSource || 'theme') === 'customImages' || contentHasImages;
  if (useImages && hasContent){
        return creation.content
    .filter(p => p && p.imageA && p.imageB)
          .map(p=>[String(p.imageA), String(p.imageB)]);
      }
  // Fallback to custom text pairs only if items have a & b
  if (hasContent && creation.content.every(p => p && p.a !== undefined && p.b !== undefined)){
    return creation.content.map(p=>[String(p.a), String(p.b)]);
      }
    if (theme==='letters') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0,12).split('').map(ch=>[ch,ch]);
    if (theme==='shapes') return [['▲','▲'],['■','■'],['●','●'],['◆','◆'],['★','★'],['♥','♥'],['☀','☀'],['☂','☂'],['♞','♞'],['♣','♣'],['♠','♠'],['♪','♪']];
    // numbers default
    return Array.from({length:12},(_,i)=>[String(i+1), String(i+1)]);
  }

  function gridSize(){
    const g = (settings?.grid||'3x4').split('x').map(Number); return {rows:g[0]||3, cols:g[1]||4};
  }

  function build(){
    const {rows, cols} = gridSize();
    const need = (rows*cols)/2;
    pairs = shuffle(themePairs()).slice(0, need);
    const cards = shuffle(pairs.flat());
    gridEl = document.getElementById('grid');
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridEl.innerHTML='';
      const useImages = (settings?.pairSource || 'theme') === 'customImages';
      cards.forEach((val, i)=>{
        const div=document.createElement('div');
        div.className='card'; div.dataset.value=val; div.dataset.index=i;
        div.onclick=()=>flip(div);
        if (useImages){
          // Hide image until revealed
          const img=document.createElement('img');
          img.src = val; img.alt=''; img.style.display='none'; img.style.maxWidth='80%'; img.style.maxHeight='80%';
          div.appendChild(img);
        }
        gridEl.appendChild(div);
      });
  moves=0; found=0; updateHud(); startMs = Date.now();
      if (settings?.showAllAtStart){
        // Briefly reveal all cards
    const useImages = (settings?.pairSource || 'theme') === 'customImages';
        [...gridEl.children].forEach(card=>{
          card.classList.add('revealed');
          if (useImages) { const img=card.querySelector('img'); if (img) img.style.display='block'; }
          else { card.textContent = card.dataset.value; }
        });
        setTimeout(()=>{
          [...gridEl.children].forEach(card=>{
            card.classList.remove('revealed');
            if (useImages) { const img=card.querySelector('img'); if (img) img.style.display='none'; }
            else { card.textContent = ''; }
          });
        }, 1000);
      }
  }

  function updateHud(){ movesEl.textContent = `Moves: ${moves}`; pairsEl.textContent = `Pairs: ${found}/${pairs.length}`; }

  function flip(card){
    if (lock || card.classList.contains('matched') || card===first) return;
      card.classList.add('revealed');
  const hasContent = Array.isArray(creation?.content) && creation.content.length;
  const contentHasImages = hasContent && creation.content.some(p => p && p.imageA && p.imageB);
  const useImages = (settings?.pairSource || 'theme') === 'customImages' || contentHasImages;
      if (useImages){ const img=card.querySelector('img'); if (img) img.style.display='block'; }
      else { card.textContent = card.dataset.value; }
    if (!first){ first = card; return; }
    second = card; lock=true; moves++; updateHud();
    const ok = first.dataset.value === second.dataset.value;
    setTimeout(()=>{
  if (ok){ first.classList.add('matched'); second.classList.add('matched'); found++; answers.push({ match: first.dataset.value }); if (found===pairs.length) finish(); }
        first.classList.remove('revealed'); second.classList.remove('revealed');
        if (!ok){
          if (useImages){ const i1=first.querySelector('img'); const i2=second.querySelector('img'); if (i1) i1.style.display='none'; if (i2) i2.style.display='none'; }
          else { first.textContent=''; second.textContent=''; }
        }
      first=null; second=null; lock=false;
    }, 500);
  }

  function start(){ show('play'); build(); }

  function finish(){
    show('done');
    // perfect is pairs.length moves min; we consider score inversely proportional to moves, but keep simple: 100% when found all, score=pairs.length
    const score = pairs.length; const total = pairs.length; // treat as full completion
    summary.textContent = `Completed in ${moves} moves`;
  const totalTimeMs = Math.max(0, Date.now() - (startMs || Date.now()));
  try { window.parent.postMessage({ type:'LIVE_FINISH', payload:{ totalTimeMs }}, '*'); } catch {}
  window.parent.postMessage({ type:'GAME_COMPLETE', payload:{ gameCreationId: creation?._id, score, totalPossibleScore: total, answers }}, '*');
  }

  window.addEventListener('message', (e)=>{
    if (e.data?.type==='INIT_GAME'){
      const p=e.data.payload; creation=p; settings=p.config||{};
      show('ready');
      enterBtn.onclick = countdown;
    }
  });
})();
