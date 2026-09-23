// ===== SNAKE GAME =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;

let snake, food, direction, nextDir, score, gameLoop, running, paused, speed;

function init() {
  snake = [{ x: 10, y: 10 }];
  direction = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  speed = 120;
  running = false;
  paused = false;
  placeFood();
  updateScore(0);
  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function startGame() {
  if (running && !paused) return;
  if (paused) { togglePause(); return; }
  init();
  running = true;
  document.getElementById('startBtn').textContent = 'Restart';
  document.getElementById('pauseBtn').style.display = 'inline-block';
  clearInterval(gameLoop);
  gameLoop = setInterval(update, speed);
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
  if (!paused) {
    clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
  } else {
    clearInterval(gameLoop);
  }
}

function update() {
  direction = nextDir;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver(); return;
  }
  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver(); return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    updateScore(score);
    placeFood();
    // Speed up slightly
    if (speed > 60) {
      speed -= 2;
      clearInterval(gameLoop);
      gameLoop = setInterval(update, speed);
    }
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * GRID, 0); ctx.lineTo(i * GRID, canvas.height); ctx.stroke();
  }
  for (let i = 0; i < ROWS; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * GRID); ctx.lineTo(canvas.width, i * GRID); ctx.stroke();
  }

  // Food
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake
  snake.forEach((seg, i) => {
    const ratio = 1 - i / snake.length;
    const g = Math.floor(180 + 75 * ratio);
    ctx.fillStyle = i === 0 ? '#00ff88' : `rgb(0, ${g}, ${Math.floor(80 + 50 * ratio)})`;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = i === 0 ? 8 : 3;
    const pad = i === 0 ? 1 : 2;
    ctx.fillRect(seg.x * GRID + pad, seg.y * GRID + pad, GRID - pad * 2, GRID - pad * 2);
  });
  ctx.shadowBlur = 0;

  // Game over overlay
  if (!running && score > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#e0e0ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 25);
  }
}

function gameOver() {
  running = false;
  clearInterval(gameLoop);
  document.getElementById('pauseBtn').style.display = 'none';
  draw();
  submitScore(score);
}

// Controls
document.addEventListener('keydown', (e) => {
  if (!running) return;
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W':
      if (direction.y === 0) nextDir = { x: 0, y: -1 }; break;
    case 'ArrowDown': case 's': case 'S':
      if (direction.y === 0) nextDir = { x: 0, y: 1 }; break;
    case 'ArrowLeft': case 'a': case 'A':
      if (direction.x === 0) nextDir = { x: -1, y: 0 }; break;
    case 'ArrowRight': case 'd': case 'D':
      if (direction.x === 0) nextDir = { x: 1, y: 0 }; break;
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});

init();
