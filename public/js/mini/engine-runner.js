// ===== RUNNER ENGINE =====
// Side-scrolling auto-runner with jumping
// Config: { playerEmoji, obstacleEmojis, groundY, jumpForce, gravity, scrollSpeed, gapRange }

function createRunnerGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cfg = Object.assign({ playerEmoji: '🦖', obstacleEmojis: ['🌵','🪨','🔥'], groundY: H - 60, jumpForce: -10, gravity: 0.5, scrollSpeed: 4, gapMin: 200, gapMax: 350, bgColor: '#0a0a1a', playerSize: 32, obstacleSize: 28, collectEmoji: '⭐' }, config);
  let player, obstacles, collectibles, score, running, paused, speedMul, frameCount, particles, nextObstacleIn;

  function init() {
    player = { x: 60, y: cfg.groundY, vy: 0, onGround: true, size: cfg.playerSize };
    obstacles = []; collectibles = []; score = 0; speedMul = 1; frameCount = 0;
    nextObstacleIn = 120; particles = []; running = false; paused = false;
    updateScore(0);
    document.getElementById('extraInfo').innerHTML = '';
  }

  function start() { init(); running = true; document.getElementById('startBtn').textContent = 'Restart'; document.getElementById('pauseBtn').style.display = 'inline-block'; }
  function pause() { if (!running) return; paused = !paused; document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause'; }

  function update(dt) {
    if (!running || paused) return;
    frameCount++;
    speedMul = 1 + score / 1000;
    score += dt * 10 * speedMul;
    updateScore(Math.floor(score));

    // Player physics
    player.vy += cfg.gravity;
    player.y += player.vy;
    if (player.y >= cfg.groundY) { player.y = cfg.groundY; player.vy = 0; player.onGround = true; }

    // Spawn obstacles
    nextObstacleIn -= cfg.scrollSpeed * speedMul;
    if (nextObstacleIn <= 0) {
      const h = cfg.obstacleSize + Math.random() * 15;
      obstacles.push({ x: W + 30, y: cfg.groundY + cfg.playerSize / 2 - h, w: 20 + Math.random() * 10, h, emoji: cfg.obstacleEmojis[Math.floor(Math.random() * cfg.obstacleEmojis.length)] });
      if (Math.random() < 0.4) collectibles.push({ x: W + 80 + Math.random() * 100, y: cfg.groundY - 40 - Math.random() * 60, size: 20, collected: false });
      nextObstacleIn = cfg.gapMin + Math.random() * (cfg.gapMax - cfg.gapMin);
    }

    // Move obstacles
    const spd = cfg.scrollSpeed * speedMul;
    obstacles.forEach(o => o.x -= spd);
    obstacles = obstacles.filter(o => o.x > -50);
    collectibles.forEach(c => c.x -= spd);
    collectibles = collectibles.filter(c => c.x > -50 && !c.collected);

    // Collision with obstacles
    for (const o of obstacles) {
      if (player.x + player.size / 3 > o.x && player.x - player.size / 3 < o.x + o.w &&
          player.y + player.size / 2 > o.y && player.y - player.size / 2 < o.y + o.h) {
        running = false; document.getElementById('pauseBtn').style.display = 'none'; submitScore(Math.floor(score)); return;
      }
    }
    // Collect items
    collectibles.forEach(c => {
      const dist = Math.sqrt((player.x - c.x) ** 2 + (player.y - c.y) ** 2);
      if (dist < player.size) { c.collected = true; score += 50; for (let i = 0; i < 6; i++) particles.push({ x: c.x, y: c.y, dx: (Math.random()-0.5)*4, dy: (Math.random()-0.5)*4, life: 20, color: '#ffee00', size: 3 }); }
    });
    particles = particles.filter(p => { p.x += p.dx; p.y += p.dy; p.life--; return p.life > 0; });
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
    // Ground
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cfg.groundY + cfg.playerSize / 2 + 5);
    ctx.lineTo(W, cfg.groundY + cfg.playerSize / 2 + 5);
    ctx.stroke();
    // Ground dots
    ctx.fillStyle = '#1a1a3a';
    for (let i = 0; i < W; i += 30) {
      const offset = (frameCount * cfg.scrollSpeed * speedMul) % 30;
      ctx.fillRect(i - offset, cfg.groundY + cfg.playerSize / 2 + 10, 2, 2);
    }
    // Obstacles
    obstacles.forEach(o => {
      ctx.font = `${o.h}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = '#ff3355';
      ctx.shadowBlur = 6;
      ctx.fillText(o.emoji, o.x + o.w / 2, o.y + o.h);
      ctx.shadowBlur = 0;
    });
    // Collectibles
    collectibles.forEach(c => {
      ctx.font = `${c.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ffee00';
      ctx.shadowBlur = 8;
      ctx.fillText(cfg.collectEmoji, c.x, c.y);
      ctx.shadowBlur = 0;
    });
    // Player
    ctx.font = `${player.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.fillText(cfg.playerEmoji, player.x, player.y);
    ctx.shadowBlur = 0;
    // Particles
    particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });

    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff3355'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Game Over!', W/2, H/2-20);
      ctx.fillStyle = '#e0e0ff'; ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${Math.floor(score)}`, W/2, H/2+20);
    }
  }

  function jump() {
    if (!running || paused) return;
    if (player.onGround) { player.vy = cfg.jumpForce; player.onGround = false; }
  }

  document.addEventListener('keydown', e => {
    if (['ArrowUp', ' ', 'w', 'W'].includes(e.key)) { e.preventDefault(); jump(); }
  });
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });

  return { init, start, pause, update, draw, isRunning: () => running, isPaused: () => paused };
}
