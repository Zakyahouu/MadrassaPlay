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
let gameCreationId = null; // To store the ID of the game being played

// --- Core Game Logic ---

function initializeGame(data) {
  console.log('Game Engine: Received data from platform', data);
  gameConfig = data.config.settings;
  questions = data.config.content;
  gameCreationId = data._id; // Store the game creation ID
  
  currentQuestionIndex = 0;
  score = 0;
  
  gameContainer.classList.remove('hidden');
  resultsScreen.classList.add('hidden');
  
  showNextQuestion();
}

function showNextQuestion() {
  if (currentQuestionIndex >= questions.length) {
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

  // --- NEW: Send the final score back to the parent React app ---
  // We post a message with a specific type and a payload containing the results.
  window.parent.postMessage({
    type: 'GAME_COMPLETE',
    payload: {
      gameCreationId: gameCreationId,
      score: score,
      totalPossibleScore: questions.length
    }
  }, '*'); // Again, restrict the target origin in production
}

// --- Event Listeners ---
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_GAME') {
    initializeGame(event.data.payload);
  }
});

restartButton.addEventListener('click', () => {
  // Restarting is disabled for assignments for now.
  // In a real app, you might hide the button or send a "restarted" message.
  alert("You can exit the game and start the assignment again from your dashboard.");
});

console.log('Game Engine: Ready and waiting for initialization data...');
