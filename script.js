const board = document.getElementById("board");
const modal = document.getElementById("modal");
const questionText = document.getElementById("question-text");
const closeBtn = document.getElementById("close-btn");
const scoreDisplay = document.getElementById("score");

let playerScore = 0;

const categories = [
    {
        name: "Math",
        questions: [
            { value: 100, question: "What is 5 + 7?" },
            { value: 200, question: "What is 12 × 3?" },
            { value: 300, question: "What is the square root of 81?" }
        ]
    },
    {
        name: "Science",
        questions: [
            { value: 100, question: "What planet is closest to the sun?" },
            { value: 200, question: "What gas do plants breathe in?" },
            { value: 300, question: "What force keeps us on the ground?" }
        ]
    },
    {
        name: "History",
        questions: [
            { value: 100, question: "Who was the first US President?" },
            { value: 200, question: "In what year did WW2 end?" },
            { value: 300, question: "What empire built the Colosseum?" }
        ]
    }
];

// Dynamically set grid columns based on number of categories
board.style.gridTemplateColumns = `repeat(${categories.length}, 1fr)`;

// Add category headers
categories.forEach(category => {
    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = category.name;
    board.appendChild(header);
});

// Add tiles row by row
const maxQuestions = Math.max(...categories.map(c => c.questions.length));

for (let i = 0; i < maxQuestions; i++) {
    categories.forEach(category => {
        const q = category.questions[i];
        const tile = document.createElement("div");
        tile.className = "tile";

        if (q) {
            tile.textContent = q.value;
            tile.addEventListener("click", () => {
                if (tile.classList.contains("used")) return;

                questionText.textContent = q.question;
                modal.classList.remove("hidden");
                tile.classList.add("used");

                // Update player score
                playerScore += q.value;
                scoreDisplay.textContent = playerScore;
            });
        } else {
            tile.textContent = "";
            tile.style.background = "#0a0a6a"; // empty spot
            tile.style.cursor = "default";
        }

        board.appendChild(tile);
    });
}

// Close modal
closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
});
