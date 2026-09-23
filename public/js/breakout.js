// ===== BREAKOUT GAME =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 400;

const PADDLE_W = 80, PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS = 5, BRICK_COLS = 8;
const BRICK_W = 52, BRICK_H = 18, BRICK_GAP = 4;
const BRICK_OFFSET_TOP = 40, BRICK_OFFSET_LEFT = (canvas.width - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
const BRICK_COLORS = ['#ff0055', '#ff6600', '#ffee00', '#00ff88', '#00d4ff'];

let paddle, ball, bricks, score, lives, running, paused, animId;
let keys = {};

function init() {
  paddle = { x: canvas.width / 2 - PADDLE_W / 2, y: canvas.height - 30, w: PADDLE_W, h: PADDLE_H };
  ball = {
    x: canvas.width / 2, y: canvas.height - 50,
    dx: 3 * (Math.random() > 0.5 ? 1 : -1), dy: -3,
    r: BALL_R, speed: 3
  };
  score = 0;
  lives = 3;
  running = false;
  paused = false;

  // Create bricks
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({
        x: BRICK_OFFSET_LEFT + c * (BRICK_W + BRICK_GAP),
        y: BRICK_OFFSET_TOP + r * (BRICK_H + BRICK_GAP),
        w: BRICK_W, h: BRICK_H,
        color: BRICK_COLORS[r],
        alive: true,
        points: (BRICK_ROWS - r) * 10
      });

  updateScore(0);
  document.getElementById('extraInfo').innerHTML = `Lives: <span id="livesDisplay">❤️❤️❤️</span>`;
  draw();
}

function startGame() {
  if (running && !paused) return;
  if (paused) { pauseGame(); return; }
  init();
  running = true;
  document.getElementById('startBtn').textContent = 'Restart';
  document.getElementById('pauseBtn').style.display = 'inline-block';
  document.getElementById('pauseBtn').textContent = 'Pause';
  cancelAnimationFrame(animId);
  loop();
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
  if (!paused) loop();
}

function loop() {
  if (!running || paused) return;
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

function update() {
  // Paddle movement (keyboard)
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) paddle.x = Math.max(0, paddle.x - 6);
  if (keys['ArrowRight'] || keys['d'] || keys['D']) paddle.x = Math.min(canvas.width - paddle.w, paddle.x + 6);

  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collisions
  if (ball.x - ball.r <= 0 || ball.x + ball.r >= canvas.width) ball.dx *= -1;
  if (ball.y - ball.r <= 0) ball.dy *= -1;

  // Bottom - lose life
  if (ball.y + ball.r >= canvas.height) {
    lives--;
    updateLives();
    if (lives <= 0) {
      gameOver();
      return;
    }
    resetBall();
  }

  // Paddle collision
  if (ball.dy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 4 &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w) {
    // Angle based on where ball hits paddle
    const hitPos = (ball.x - paddle.x) / paddle.w; // 0 to 1
    const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63° to +63°
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -speed * Math.cos(angle);
    ball.y = paddle.y - ball.r;
  }

  // Brick collisions
  for (const brick of bricks) {
    if (!brick.alive) continue;
    if (ball.x + ball.r > brick.x &&
        ball.x - ball.r < brick.x + brick.w &&
        ball.y + ball.r > brick.y &&
        ball.y - ball.r < brick.y + brick.h) {
      brick.alive = false;
      score += brick.points;
      updateScore(score);

      // Determine bounce direction
      const overlapLeft = (ball.x + ball.r) - brick.x;
      const overlapRight = (brick.x + brick.w) - (ball.x - ball.r);
      const overlapTop = (ball.y + ball.r) - brick.y;
      const overlapBottom = (brick.y + brick.h) - (ball.y - ball.r);
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop || minOverlap === overlapBottom) {
        ball.dy *= -1;
      } else {
        ball.dx *= -1;
      }

      // Speed up slightly
      const spd = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      if (spd < 7) {
        const factor = 1.02;
        ball.dx *= factor;
        ball.dy *= factor;
      }
      break;
    }
  }

  // Check win
  if (bricks.every(b => !b.alive)) {
    running = false;
    cancelAnimationFrame(animId);
    draw();
    submitScore(score);
  }
}

function resetBall() {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = canvas.height - 50;
  ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -3;
}

function updateLives() {
  const el = document.getElementById('livesDisplay');
  if (el) el.textContent = '❤️'.repeat(lives) || '💀';
}

function draw() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bricks
  for (const brick of bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.color;
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 5;
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 3);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 3);
  }
  ctx.shadowBlur = 0;

  // Paddle
  ctx.fillStyle = '#00d4ff';
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 8;
  roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ball
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Game over overlay
  if (!running && lives <= 0) {
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

  // Win overlay
  if (!running && bricks.every(b => !b.alive) && lives > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#e0e0ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 25);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function gameOver() {
  running = false;
  cancelAnimationFrame(animId);
  document.getElementById('pauseBtn').style.display = 'none';
  draw();
  submitScore(score);
}

// Keyboard
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Mouse control
canvas.addEventListener('mousemove', (e) => {
  if (!running || paused) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mx = (e.clientX - rect.left) * scaleX;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, mx - paddle.w / 2));
});

// Touch control
canvas.addEventListener('touchmove', (e) => {
  if (!running || paused) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mx = (e.touches[0].clientX - rect.left) * scaleX;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, mx - paddle.w / 2));
}, { passive: false });

init();
