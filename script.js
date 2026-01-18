const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const orbTimerElement = document.getElementById('orb-timer');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status-text');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');

// Game Settings
const GRID_SIZE = 20;//size of snake and orb and each block that the snake travels
const ORB_LIFESPAN = 5000; // 5 seconds
const UI_HEIGHT = 50;

// Game State
let snake = [];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let orb = { x: 0, y: 0, spawnTime: 0 };
let score = 0;
let gameStartTime = 0;
let gameRunning = false;
let isPaused = false;
let gameLoop;
let lastPauseTime = 0;

// Resize canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function init() {
    // Reset game state
    score = 0;
    scoreElement.innerText = score;
    gameStartTime = Date.now();
    isPaused = false;
    
    // Initial snake position (center of screen)
    const startX = Math.floor(canvas.width / 2 / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((canvas.height + UI_HEIGHT) / 2 / GRID_SIZE) * GRID_SIZE;
    snake = [
        { x: startX, y: startY },
        { x: startX - GRID_SIZE, y: startY },
        { x: startX - 2 * GRID_SIZE, y: startY }
    ];
    
    // Initial movement "the snake moves to the right at start"
    direction = { x: GRID_SIZE, y: 0 };
    nextDirection = { x: GRID_SIZE, y: 0 };
    
    spawnOrb();
    
    gameRunning = true;
    overlay.style.display = 'none';
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100); // 10 FPS
}

function spawnOrb() {
    // Spawn orb in a random position not occupied by the snake and within bounds
    const maxX = Math.floor(canvas.width / GRID_SIZE) - 1;
    const minY = Math.ceil(UI_HEIGHT / GRID_SIZE);
    const maxY = Math.floor(canvas.height / GRID_SIZE) - 1;

    orb = {
        x: Math.floor(Math.random() * (maxX + 1)) * GRID_SIZE,
        y: Math.floor(Math.random() * (maxY - minY + 1) + minY) * GRID_SIZE,
        spawnTime: Date.now()
    };

    // Prevent spawning on snake
    for (let part of snake) {
        if (part.x === orb.x && part.y === orb.y) {
            spawnOrb();
            return;
        }
    }
}

function update() {
    if (!gameRunning || isPaused) return;

    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // makes sure the snake can transfer from one side of the screen to the other
    if (head.x < 0) head.x = Math.floor(canvas.width / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    else if (head.x >= canvas.width) head.x = 0;

    if (head.y < UI_HEIGHT) head.y = Math.floor(canvas.height / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    else if (head.y >= canvas.height) head.y = Math.floor(UI_HEIGHT / GRID_SIZE) * GRID_SIZE;

    // if the snake collides with itself, the game ends
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    // snake movement
    snake.unshift(head);

    //check if the snake eats the orb
    if (head.x === orb.x && head.y === orb.y) {
        score++;
        scoreElement.innerText = score;
        spawnOrb();
    } else {
        snake.pop();
    }

    // Check orb lifespan
    const now = Date.now();
    const orbAge = now - orb.spawnTime;
    if (orbAge >= ORB_LIFESPAN) {
        spawnOrb();
    }

    // Update UI
    const elapsed = Math.floor((now - gameStartTime) / 1000);
    timeElement.innerText = elapsed;
    const remaining = Math.max(0, (ORB_LIFESPAN - orbAge) / 1000);
    orbTimerElement.innerText = remaining.toFixed(1);

    draw();
}

function draw() {
    // Clear canvas and set background color 
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Orb 
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(orb.x + GRID_SIZE/2, orb.y + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Orb glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f1c40f';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Snake 
    snake.forEach((part, index) => {
        ctx.fillStyle = (index === 0) ? '#2ecc71' : '#27ae60';
        ctx.fillRect(part.x + 1, part.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        
        // Add a small eye to the head
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.fillRect(part.x + 4, part.y + 4, 4, 4);
        }
    });
}

function gameOver() {
    gameRunning = false;
    isPaused = false;
    clearInterval(gameLoop);
    statusText.innerText = "Game Over!";
    finalScore.innerText = `Final Score: ${score}`;
    finalScore.classList.remove('hidden');
    startBtn.innerText = "Try Again";
    overlay.style.display = 'flex';
}

function togglePause() {
    if (!gameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        lastPauseTime = Date.now();
        statusText.innerText = "Paused";
        finalScore.classList.add('hidden');
        startBtn.innerText = "Resume";
        overlay.style.display = 'flex';
    } else {
        // makes sure timers are adjusted correctly after pause
        const pauseDuration = Date.now() - lastPauseTime;
        gameStartTime += pauseDuration;
        orb.spawnTime += pauseDuration;
        overlay.style.display = 'none';
    }
}

// Controls
window.addEventListener('keydown', e => {
    if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        return;
    }

    if (!gameRunning || isPaused) return;
    
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) nextDirection = { x: 0, y: -GRID_SIZE };
            break;
        case 'ArrowDown':
            if (direction.y === 0) nextDirection = { x: 0, y: GRID_SIZE };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) nextDirection = { x: -GRID_SIZE, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) nextDirection = { x: GRID_SIZE, y: 0 };
            break;
    }
});

startBtn.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    } else {
        init();
    }
});
