// ===== DODGE ENGINE =====
// Player avoids falling/rising obstacles
// Config: { playerEmoji, obstacleEmoji, obstacleSpeed, spawnRate, playerSize, obstacleSize, gravity, multiDir }

function createDodgeGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cfg = Object.assign({ playerEmoji: '🏃', obstacleEmoji: '💣', obstacleSpeed: 2, spawnRate: 600, playerSize: 24, obstacleSize: 20, gravity: false, multiDir: false, bgColor: '#0a0a1a', lives: 3, invincibleTime: 1500 }, config);
  let player, obstacles, score, lives, running, paused, spawnTimer, speedMul, invincible, invTimer, particles, startTime;

  function init() {
    player = { x: W / 2, y: H - 50, w: cfg.playerSize * 2, h: cfg.playerSize * 2 };
    obstacles = []; score = 0; lives = cfg.lives; spawnTimer = 0; speedMul = 1;
    invincible = false; invTimer = 0; particles = []; running = false; paused = false;
    updateScore(0);
    document.getElementById('extraInfo').innerHTML = `Lives: <span id="livesD">${'❤️'.repeat(lives)}</span>`;
  }

  function start() { init(); running = true; startTime = Date.now(); document.getElementById('startBtn').textContent = 'Restart'; document.getElementById('pauseBtn').style.display = 'inline-block'; }
  function pause() { if (!running) return; paused = !paused; document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause'; }

  function spawnObstacle() {
    if (cfg.multiDir) {
      const side = Math.floor(Math.random() * 4);
      let x, y, dx, dy;
      const spd = cfg.obstacleSpeed * speedMul;
      if (side === 0) { x = Math.random() * W; y = -cfg.obstacleSize; dx = (Math.random() - 0.5) * 2; dy = spd; }
      else if (side === 1) { x = Math.random() * W; y = H + cfg.obstacleSize; dx = (Math.random() - 0.5) * 2; dy = -spd; }
      else if (side === 2) { x = -cfg.obstacleSize; y = Math.random() * H; dx = spd; dy = (Math.random() - 0.5) * 2; }
      else { x = W + cfg.obstacleSize; y = Math.random() * H; dx = -spd; dy = (Math.random() - 0.5) * 2; }
      obstacles.push({ x, y, dx, dy, size: cfg.obstacleSize + Math.random() * 8, emoji: cfg.obstacleEmoji });
    } else {
      obstacles.push({
        x: Math.random() * (W - 40) + 20, y: -cfg.obstacleSize,
        dx: (Math.random() - 0.5) * 1.5, dy: cfg.obstacleSpeed * speedMul * (0.8 + Math.random() * 0.4),
        size: cfg.obstacleSize + Math.random() * 8, emoji: cfg.obstacleEmoji
      });
    }
  }

  function update(dt) {
    if (!running || paused) return;
    score += dt * 10;
    speedMul = 1 + Math.floor(score / 100) * 0.15;
    spawnTimer -= dt * 1000;
    if (spawnTimer <= 0) { spawnObstacle(); spawnTimer = Math.max(150, cfg.spawnRate - score * 0.5); }
    if (invincible) { invTimer -= dt * 1000; if (invTimer <= 0) invincible = false; }

    obstacles.forEach(o => { o.x += o.dx; o.y += o.dy; });
    obstacles = obstacles.filter(o => o.y < H + 50 && o.y > -50 && o.x > -50 && o.x < W + 50);

    // Collision
    if (!invincible) {
      for (const o of obstacles) {
        const dist = Math.sqrt((player.x - o.x) ** 2 + (player.y - o.y) ** 2);
        if (dist < (player.w / 2 + o.size / 2) * 0.7) {
          lives--;
          invincible = true;
          invTimer = cfg.invincibleTime;
          document.getElementById('livesD').textContent = '❤️'.repeat(Math.max(0, lives)) || '💀';
          if (lives <= 0) { running = false; document.getElementById('pauseBtn').style.display = 'none'; submitScore(Math.floor(score)); }
          break;
        }
      }
    }
    updateScore(Math.floor(score));
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
    // Obstacles
    obstacles.forEach(o => {
      ctx.font = `${o.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff3355';
      ctx.shadowBlur = 6;
      ctx.fillText(o.emoji, o.x, o.y);
      ctx.shadowBlur = 0;
    });
    // Player
    const blink = invincible && Math.floor(Date.now() / 100) % 2;
    if (!blink) {
      ctx.font = `${cfg.playerSize * 2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 10;
      ctx.fillText(cfg.playerEmoji, player.x, player.y);
      ctx.shadowBlur = 0;
    }
    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff3355';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#e0e0ff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${Math.floor(score)}`, W / 2, H / 2 + 20);
    }
  }

  let keys = {};
  document.addEventListener('keydown', e => { keys[e.key] = true; });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    if (!running || paused) return;
    const spd = 5;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x = Math.max(20, player.x - spd);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x = Math.min(W - 20, player.x + spd);
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y = Math.max(20, player.y - spd);
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y = Math.min(H - 20, player.y + spd);
  }

  canvas.addEventListener('mousemove', e => {
    if (!running || paused) return;
    const rect = canvas.getBoundingClientRect();
    player.x = (e.clientX - rect.left) * (W / rect.width);
    player.y = (e.clientY - rect.top) * (H / rect.height);
  });
  canvas.addEventListener('touchmove', e => {
    if (!running || paused) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    player.x = (e.touches[0].clientX - rect.left) * (W / rect.width);
    player.y = (e.touches[0].clientY - rect.top) * (H / rect.height);
  }, { passive: false });

  return { init, start, pause, update, draw, handleInput, isRunning: () => running, isPaused: () => paused };
}
