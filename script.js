// ------------------------------------
// Load Questions From External JSON
// ------------------------------------
let categories = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    categories = data;
    buildGameBoard();
  })
  .catch(err => console.error("Error loading questions.json:", err));


// ------------------------------------
// PLAYER SETUP
// ------------------------------------
const players = [
  { name: "Player 1", score: 0, key: "a" },
  { name: "Player 2", score: 0, key: "l" },
  { name: "Player 3", score: 0, key: " " },  // spacebar
];

let buzzingEnabled = false;
let buzzWinner = null;


// ------------------------------------
// DOM Elements
// ------------------------------------
const board = document.getElementById("game-board");
const categoryRow = document.getElementById("category-row");
const modal = document.getElementById("modal");
const questionText = document.getElementById("question-text");
const closeBtn = document.getElementById("close-btn");
const timerEl = document.getElementById("timer");
const answerInput = document.getElementById("user-answer");
const submitBtn = document.getElementById("submit-answer");
const scoreDisplay = document.getElementById("score");
const buzzDisplay = document.getElementById("buzz-display");
const p1ScoreEl = document.getElementById("p1-score");
const p2ScoreEl = document.getElementById("p2-score");
const p3ScoreEl = document.getElementById("p3-score");



// ------------------------------------
// Allow all typing once buzzed
// Disable until buzzed
// ------------------------------------
answerInput.disabled = true;
submitBtn.disabled = true;


// ------------------------------------
// BUZZER LISTENER
// ------------------------------------
document.addEventListener("keydown", (e) => {
  if (!buzzingEnabled) return;

  const key = e.key.toLowerCase();

  if (key === "a") return handleBuzz(1);
  if (key === "l") return handleBuzz(2);
  if (key === " " || e.code === "Space") return handleBuzz(3);
});

function updatePlayerScores() {
  p1ScoreEl.textContent = `${players[0].name}: ${players[0].score}`;
  p2ScoreEl.textContent = `${players[1].name}: ${players[1].score}`;
  p3ScoreEl.textContent = `${players[2].name}: ${players[2].score}`;
}



// ------------------------------------
// Game State
// ------------------------------------
let timeRemaining = 30;
let timerInterval = null;
let score = 0;
let currentAnswer = "";
let currentValue = 0;


// ------------------------------------
// Timer
// ------------------------------------
function startTimer() {
  clearInterval(timerInterval);
  timeRemaining = 30;
  timerEl.textContent = timeRemaining;

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerEl.textContent = timeRemaining;

    if (timeRemaining <= 0) handleTimeUp();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function handleTimeUp() {
  stopTimer();
  alert(`Time's up! -${currentValue}\nCorrect: ${currentAnswer}`);
  score -= currentValue;
  scoreDisplay.textContent = "Score: " + score;
  closeModal();
}


// ------------------------------------
// Modal Controls
// ------------------------------------
function openModal(questionObj) {
  modal.classList.remove("hidden");
  questionText.textContent = questionObj;

  answerInput.value = "";
  answerInput.disabled = true;
  submitBtn.disabled = true;

  buzzWinner = null;
  enableBuzzers();

  startTimer();
}

function closeModal() {
  stopTimer();
  modal.classList.add("hidden");
  buzzingEnabled = false;

  answerInput.disabled = true;
  submitBtn.disabled = true;
}


// ------------------------------------
// BUZZER SYSTEM
// ------------------------------------
function enableBuzzers() {
  buzzingEnabled = true;
  buzzWinner = null;

  buzzDisplay.textContent = "Buzzers live! (A, L, SPACE)";
  buzzDisplay.classList.remove("hidden");
}

function handleBuzz(playerNum) {
  buzzingEnabled = false;
  buzzWinner = players[playerNum - 1];

  buzzDisplay.textContent = `${buzzWinner.name} buzzed in!`;
  answerInput.disabled = false;
  submitBtn.disabled = false;

  answerInput.focus();
}


// ------------------------------------
// Build Game Board
// ------------------------------------
function buildGameBoard() {
  const numCategories = categories.length;

  categoryRow.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;
  board.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;

  // Category headers
  categories.forEach(cat => {
    const header = document.createElement("div");
    header.classList.add("category-title");
    header.textContent = cat.title;
    categoryRow.appendChild(header);
  });

  const maxRows = Math.max(...categories.map(c => c.questions.length));

  // Question tiles
  for (let row = 0; row < maxRows; row++) {
    categories.forEach(cat => {
      const q = cat.questions[row];
      const tile = document.createElement("div");
      tile.classList.add("tile");

      if (q) {
        tile.textContent = q.value;
        tile.addEventListener("click", () => {
          if (!tile.classList.contains("used")) {
            tile.classList.add("used");

            currentAnswer = q.answer.toLowerCase().trim();
            currentValue = q.value;

            openModal(q.question);
          }
        });
      } else {
        tile.style.visibility = "hidden";
      }

      board.appendChild(tile);
    });
  }
}


// ------------------------------------
// Answer Submission
// ------------------------------------
submitBtn.addEventListener("click", () => {
  if (!buzzWinner) {
    alert("A player must buzz in first!");
    return;
  }

  stopTimer();

  const user = answerInput.value.toLowerCase().trim();
  const correct = currentAnswer.toLowerCase().trim();

  const validForm =
    user.startsWith("what is") ||
    user.startsWith("who is") ||
    user.startsWith("what are") ||
    user.startsWith("who are") ||
    user.startsWith("what's") ||
    user.startsWith("who's");

  const cleanedUser = user.replace(/^(what is|what are|who is|who are|what's|who's)/, "").trim();
  const cleanedCorrect = correct.trim();

  const isCorrect =
    validForm &&
    (cleanedUser.includes(cleanedCorrect) ||
     cleanedCorrect.includes(cleanedUser));

  if (isCorrect) {
    alert(`Correct, ${buzzWinner.name}! +${currentValue}`);
    buzzWinner.score += currentValue;
  } else {
    alert(`Incorrect, ${buzzWinner.name}! -${currentValue}\nCorrect: ${correct}`);
    buzzWinner.score -= currentValue;
  }

  updatePlayerScores();
  closeModal();
});



// Close modal button
closeBtn.addEventListener("click", closeModal);
