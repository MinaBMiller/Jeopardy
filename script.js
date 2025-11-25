// ------------------------------------
// Load Questions From External JSON
// ------------------------------------
let categories = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    categories = data;
    buildGameBoard();  // Build AFTER loading JSON
  })
  .catch(err => console.error("Error loading questions.json:", err));


// ------------------------------------
// DOM Elements
// ------------------------------------
const board = document.getElementById("game-board");
const categoryRow = document.getElementById("category-row");
const modal = document.getElementById("modal");            // FIXED
const questionText = document.getElementById("question-text");
const closeBtn = document.getElementById("close-btn");
const timerEl = document.getElementById("timer");
const answerInput = document.getElementById("user-answer"); // FIXED
const submitBtn = document.getElementById("submit-answer");
const scoreDisplay = document.getElementById("score");


// ------------------------------------
// Game State
// ------------------------------------
let timeRemaining = 30;
let timerInterval = null;
let score = 0;
let currentAnswer = "";
let currentValue = 0;


// ------------------------------------
// Levenshtein Distance (Fuzzy Matching)
// ------------------------------------
function levenshtein(a, b) {
  const matrix = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenA; i++) matrix[i] = [i];
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[lenA][lenB];
}


// ------------------------------------
// Number → Word Converter
// ------------------------------------
function numberToWords(num) {
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  const teens = ["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen",
                 "seventeen","eighteen","nineteen"];
  const tens = ["", "", "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    return tens[Math.floor(num / 10)] +
      (num % 10 !== 0 ? " " + ones[num % 10] : "");
  }
  return num.toString();
}


// ------------------------------------
// Timer Controls
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
  alert(`⏳ Time's up! -${currentValue}\nCorrect answer was: ${currentAnswer}`);
  score -= currentValue;
  scoreDisplay.textContent = "Score: " + score;
  closeModal();
}


// ------------------------------------
// Modal Controls
// ------------------------------------
function openModal(question) {
  modal.classList.remove("hidden");
  questionText.textContent = question;
  answerInput.value = "";
  startTimer();
}

function closeModal() {
  stopTimer();
  modal.classList.add("hidden");
}


// ------------------------------------
// Build Game Board (After JSON Loads)
// ------------------------------------
function buildGameBoard() {
  const numCategories = categories.length;

  categoryRow.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;
  board.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;

  // Create category headers
  categories.forEach(cat => {
    const header = document.createElement("div");
    header.classList.add("category-title");
    header.textContent = cat.title;
    categoryRow.appendChild(header);
  });

  // Determine max rows
  const maxRows = Math.max(...categories.map(c => c.questions.length));

  // Create question tiles
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
  stopTimer();

  const user = answerInput.value.toLowerCase().trim();
  const correct = currentAnswer.toLowerCase().trim();

  // Jeopardy phrasing required
  const validForm =
    user.startsWith("what is") ||
    user.startsWith("who is") ||
    user.startsWith("what are") ||
    user.startsWith("who are") ||
    user.startsWith("what's") ||
    user.startsWith("who's");

  // Clean up answers
  const cleanedUser = user
    .replace(/^(what is|what are|who is|who are|what's|who's)/, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  const cleanedCorrect = correct.replace(/[^a-z0-9 ]/g, "").trim();

  // Numeric handling
  let numericAccepted = false;
  if (!isNaN(Number(cleanedCorrect))) {
    const wordForm = numberToWords(Number(cleanedCorrect));
    numericAccepted =
      cleanedUser === cleanedCorrect || cleanedUser === wordForm;
  }

  // Fuzzy matching
  const dist = levenshtein(cleanedUser, cleanedCorrect);
  const allowedDistance = cleanedCorrect.length <= 4 ? 1 : 2;
  const fuzzyAccepted = dist <= allowedDistance;

  // Final check
  const isCorrect =
    validForm &&
    (numericAccepted ||
     cleanedUser.includes(cleanedCorrect) ||
     cleanedCorrect.includes(cleanedUser) ||
     fuzzyAccepted);

  if (isCorrect) {
    alert(`Correct! +${currentValue}`);
    score += currentValue;
  } else {
    alert(`Incorrect! -${currentValue}\nCorrect answer was: ${currentAnswer}`);
    score -= currentValue;
  }

  scoreDisplay.textContent = "Score: " + score;
  closeModal();
});

// Close modal
closeBtn.addEventListener("click", closeModal);
