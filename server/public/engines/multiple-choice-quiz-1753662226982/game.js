// engine/game.js

// --- DOM Element References ---
const gameContainer = document.getElementById('game-container');
const resultsScreen = document.getElementById('results-screen');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const questionCounter = document.getElementById('question-counter');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// --- Game State ---
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let gameConfig = {};
let gameCreationId = null;

// --- Core Game Logic ---

function initializeGame(data) {
  console.log('Game Engine: Received data from platform', data);
  gameConfig = data.config?.settings || data.config || {};
  questions = data.questions || data.content || data.config?.content || [];
  gameCreationId = data._id;

  currentQuestionIndex = 0;
  score = 0;

  gameContainer.classList.remove('hidden');
  resultsScreen.classList.add('hidden');

  showNextQuestion();
}

function showNextQuestion() {
  if (!Array.isArray(questions) || currentQuestionIndex >= questions.length) {
    showResults();
    return;
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  questionText.textContent = currentQuestion.question;
  questionCounter.textContent = `Question ${currentQuestionIndex + 1} / ${questions.length}`;
  scoreDisplay.textContent = `Score: ${score}`;
  
  optionsContainer.innerHTML = '';

  const optionsArray = currentQuestion.options.split(',').map(option => option.trim());

  optionsArray.forEach((option, index) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.classList.add('option-btn');
    button.dataset.index = index;
    button.addEventListener('click', handleOptionSelect);
    optionsContainer.appendChild(button);
  });
}

function handleOptionSelect(e) {
  const selectedButton = e.target;
  const selectedIndex = parseInt(selectedButton.dataset.index);
  const correctIndex = parseInt(questions[currentQuestionIndex].correctOptionIndex);

  document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

  if (selectedIndex === correctIndex) {
    score++;
    selectedButton.classList.add('correct');
  } else {
    selectedButton.classList.add('incorrect');
    const correctButton = optionsContainer.querySelector(`[data-index='${correctIndex}']`);
    if (correctButton) {
      correctButton.classList.add('correct');
    }
  }

  setTimeout(() => {
    currentQuestionIndex++;
    showNextQuestion();
  }, 1500);
}

function showResults() {
  gameContainer.classList.add('hidden');
  resultsScreen.classList.remove('hidden');
  finalScore.textContent = `${score} / ${questions.length}`;

  window.parent.postMessage({
    type: 'GAME_COMPLETE',
    payload: {
      gameCreationId: gameCreationId,
      score: score,
      totalPossibleScore: questions.length
    }
  }, '*');
}

// --- Event Listeners ---
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_GAME') {
    initializeGame(event.data.payload);
  }
});

restartButton.addEventListener('click', () => {
  alert("Restarting is disabled for this game mode.");
});

console.log('Game Engine: Ready and waiting for initialization data...');
