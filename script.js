// ------------------------------------
// Game Data
// ------------------------------------
const categories = [
  {
    title: "Math",
    questions: [
      { value: 100, question: "2 + 2", answer: "4" },
      { value: 200, question: "5 x 6", answer: "30" },
      { value: 300, question: "12 / 3", answer: "4" }
    ]
  },
  {
    title: "Science",
    questions: [
      { value: 100, question: "Water's chemical formula", answer: "H2O" },
      { value: 200, question: "The Earth is a ___", answer: "planet" },
      { value: 300, question: "Gas humans breathe in", answer: "oxygen" }
    ]
  },
  {
    title: "History",
    questions: [
      { value: 100, question: "Who was the first US President?", answer: "George Washington" },
      { value: 200, question: "Year WW2 ended", answer: "1945" },
      { value: 300, question: "Ancient civilization that built pyramids", answer: "Egyptians" }
    ]
  }
];

// ------------------------------------
// DOM Elements
// ------------------------------------
const board = document.getElementById("game-board");
const categoryRow = document.getElementById("category-row");
const modal = document.getElementById("question-modal");
const questionText = document.getElementById("question-text");
const closeBtn = document.getElementById("close-btn");
const timerEl = document.getElementById("timer");
const answerInput = document.getElementById("answer-input");
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
// Fuzzy Matching (Levenshtein Distance)
// ------------------------------------
function levenshtein(a, b) {
  const matrix = [];
  const lenA = a.length;
  const lenB = b.length;

  for (let i = 0; i <= lenA; i++) matrix[i] = [i];
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      if (a[i-1] === b[j-1]) matrix[i][j] = matrix[i-1][j-1];
      else {
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j-1] + 1
        );
      }
    }
  }

  return matrix[lenA][lenB];
}

// Similarity score between 0 and 1
function similarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

// ------------------------------------
// Number to Words (for numeric answers)
// ------------------------------------
function numberToWords(num) {
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  const teens = ["ten","eleven","twelve","thirteen","fourteen","fifteen",
                 "sixteen","seventeen","eighteen","nineteen"];
  const tens = ["", "", "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    return tens[Math.floor(num/10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
  }
  return num.toString();
}

// ------------------------------------
// Timer Functions
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
// Build Game Board
// ------------------------------------
const numCategories = categories.length;
categoryRow.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;
board.style.gridTemplateColumns = `repeat(${numCategories}, 1fr)`;

// Add category headers
categories.forEach(cat => {
  const header = document.createElement("div");
  header.classList.add("category-title");
  header.textContent = cat.title;
  categoryRow.appendChild(header);
});

// Add question tiles row by row
const maxRows = Math.max(...categories.map(c => c.questions.length));

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
      tile.textContent = "";
      tile.style.visibility = "hidden";
    }

    board.appendChild(tile);
  });
}

// ------------------------------------
// Answer Submission with Fuzzy, Numeric & Jeopardy Checks
// ------------------------------------
submitBtn.addEventListener("click", () => {
  stopTimer();

  const user = answerInput.value.toLowerCase().trim();
  const correct = currentAnswer.toLowerCase().trim();

  // 1. Jeopardy question form
  const validForm = (
    user.startsWith("what is") ||
    user.startsWith("who is") ||
    user.startsWith("what are") ||
    user.startsWith("who are") ||
    user.startsWith("what's") ||
    user.startsWith("who's")
  );

  // 2. Clean input
  const cleanedUser = user
    .replace(/^(what is|what are|who is|who are|what's|who's)/, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  const cleanedCorrect = correct.replace(/[^a-z0-9 ]/g, "").trim();

  console.log("User raw:", user);
  console.log("Cleaned user:", cleanedUser);
  console.log("Correct answer:", currentAnswer);
  console.log("Cleaned correct:", cleanedCorrect);
  console.log("Valid Jeopardy form:", validForm);

  // 3. Handle numeric answers (digits or words)
  let numericAccepted = false;
  if (!isNaN(Number(cleanedCorrect))) {
    const wordForm = numberToWords(Number(cleanedCorrect));
    numericAccepted = cleanedUser === cleanedCorrect || cleanedUser === wordForm;
    console.log("Numeric check:", numericAccepted, cleanedUser, cleanedCorrect, wordForm);
  }

  // 4. Fuzzy similarity
  const dist = levenshtein(cleanedUser, cleanedCorrect);
  let allowedDistance = cleanedCorrect.length <= 4 ? 1 : 2;
  const fuzzyAccepted = dist <= allowedDistance;
  console.log("Levenshtein dist:", dist, "Allowed:", allowedDistance, "Fuzzy accepted:", fuzzyAccepted);

  // 5. Final correctness
  const isCorrect = validForm && (numericAccepted || cleanedUser.includes(cleanedCorrect) || cleanedCorrect.includes(cleanedUser) || fuzzyAccepted);

  console.log("Is Correct?", isCorrect);

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


// Close modal button
closeBtn.addEventListener("click", closeModal);
