// Minimal MCQ engine compatible with PlayGame.jsx postMessage payload

const els = {
  root: document.getElementById('game-root'),
  game: document.getElementById('game-container'),
  results: document.getElementById('results-screen'),
  title: document.getElementById('game-title'),
  qText: document.getElementById('question-text'),
  options: document.getElementById('options-container'),
  qCounter: document.getElementById('question-counter'),
  score: document.getElementById('score-display'),
  final: document.getElementById('final-score'),
  restart: document.getElementById('restart-button'),
};

let questions = [];
let current = 0;
let score = 0;
let gameCreationId = null;
let settings = {};

function init(data) {
  // Expectation from platform (PlayGame.jsx):
  // payload contains the gameCreation fields, plus: questions: gameCreation.content
  gameCreationId = data._id || null;
  settings = data.config || {};
  questions = Array.isArray(data.questions) ? data.questions : [];
  els.title.textContent = settings.title || 'Quiz';

  current = 0;
  score = 0;

  els.results.classList.add('hidden');
  els.game.classList.remove('hidden');
  renderQuestion();
}

function renderQuestion() {
  if (current >= questions.length) return showResults();
  const q = questions[current];
  const options = (q.options || '').split(',').map(s => s.trim()).filter(Boolean);
  const correctIdx = Number(q.correctOptionIndex);

  els.qText.textContent = q.question || '';
  els.qCounter.textContent = `Question ${current + 1} / ${questions.length}`;
  els.score.textContent = `Score: ${score}`;

  els.options.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.dataset.index = String(idx);
    btn.addEventListener('click', () => handleAnswer(idx, correctIdx));
    els.options.appendChild(btn);
  });
}

function handleAnswer(idx, correctIdx) {
  const buttons = Array.from(els.options.querySelectorAll('.option-btn'));
  buttons.forEach(b => (b.disabled = true));

  const picked = buttons[idx];
  if (idx === correctIdx) {
    score += 1;
    picked.classList.add('correct');
  } else {
    picked.classList.add('incorrect');
    const correctBtn = buttons[correctIdx];
    if (correctBtn) correctBtn.classList.add('correct');
  }

  setTimeout(() => {
    current += 1;
    renderQuestion();
  }, 900);
}

function showResults() {
  els.game.classList.add('hidden');
  els.results.classList.remove('hidden');
  els.final.textContent = `${score} / ${questions.length}`;

  // Report back to host application
  window.parent?.postMessage(
    {
      type: 'GAME_COMPLETE',
      payload: {
        gameCreationId,
        score,
        totalPossibleScore: questions.length,
      },
    },
    '*'
  );
}

window.addEventListener('message', (evt) => {
  const data = evt?.data;
  if (data && data.type === 'INIT_GAME') {
    try {
      init(data.payload || {});
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Engine init failed', e);
    }
  }
});

els.restart.addEventListener('click', () => {
  alert('To retake, exit and start the assignment again.');
});

// Ready
// eslint-disable-next-line no-console
console.log('[MCQ Engine] Ready for INIT_GAME');
