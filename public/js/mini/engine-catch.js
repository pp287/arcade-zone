// ===== CATCH ENGINE =====
// Player catches falling items, avoids bad ones
// Config: { playerEmoji, goodEmojis, badEmoji, fallSpeed, spawnRate, playerWidth }

function createCatchGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cfg = Object.assign({ playerEmoji: '🧺', goodEmojis: ['🍎','🍊','🍋','🍇','🍓'], badEmoji: '💀', fallSpeed: 2, spawnRate: 700, playerWidth: 60, bgColor: '#0a0a1a', lives: 3, catchScore: 15, badScore: -20 }, config);
  let catcher, items, score, lives, running, paused, spawnTimer, speedMul, particles;

  function init() {
    catcher = { x: W / 2, y: H - 40, w: cfg.playerWidth, h: 20 };
    items = []; score = 0; lives = cfg.lives; spawnTimer = 0; speedMul = 1;
    paused = false; running = false; particles = [];
    updateScore(0);
    document.getElementById('extraInfo').innerHTML = `Lives: <span id="livesC">${'❤️'.repeat(lives)}</span>`;
  }

  function start() { init(); running = true; document.getElementById('startBtn').textContent = 'Restart'; document.getElementById('pauseBtn').style.display = 'inline-block'; }
  function pause() { if (!running) return; paused = !paused; document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause'; }

  function spawnItem() {
    const isBad = Math.random() < 0.2;
    items.push({
      x: 20 + Math.random() * (W - 40), y: -20,
      dy: cfg.fallSpeed * speedMul * (0.8 + Math.random() * 0.4),
      emoji: isBad ? cfg.badEmoji : cfg.goodEmojis[Math.floor(Math.random() * cfg.goodEmojis.length)],
      bad: isBad, size: 24 + Math.random() * 8, wobble: Math.random() * Math.PI * 2
    });
  }

  function addParticles(x, y, color) {
    for (let i = 0; i < 8; i++) particles.push({ x, y, dx: (Math.random()-0.5)*5, dy: -Math.random()*4, life: 25, color, size: 3 });
  }

  function update(dt) {
    if (!running || paused) return;
    speedMul = 1 + score / 500;
    spawnTimer -= dt * 1000;
    if (spawnTimer <= 0) { spawnItem(); spawnTimer = Math.max(200, cfg.spawnRate - score * 0.3); }

    items.forEach(it => { it.y += it.dy; it.wobble += dt * 3; it.x += Math.sin(it.wobble) * 0.5; });

    // Catch check
    items = items.filter(it => {
      if (it.y > H + 20) {
        if (!it.bad) { lives--; document.getElementById('livesC').textContent = '❤️'.repeat(Math.max(0, lives)) || '💀'; if (lives <= 0) { running = false; document.getElementById('pauseBtn').style.display = 'none'; submitScore(Math.floor(score)); } }
        return false;
      }
      if (it.y + it.size / 2 > catcher.y - catcher.h / 2 && it.y - it.size / 2 < catcher.y + catcher.h / 2 &&
          it.x > catcher.x - catcher.w / 2 && it.x < catcher.x + catcher.w / 2) {
        if (it.bad) { score = Math.max(0, score + cfg.badScore); lives--; addParticles(it.x, it.y, '#ff3355'); document.getElementById('livesC').textContent = '❤️'.repeat(Math.max(0, lives)) || '💀'; if (lives <= 0) { running = false; document.getElementById('pauseBtn').style.display = 'none'; submitScore(Math.floor(score)); } }
        else { score += cfg.catchScore; addParticles(it.x, it.y, '#00ff88'); }
        updateScore(Math.floor(score));
        return false;
      }
      return true;
    });
    particles = particles.filter(p => { p.x += p.dx; p.y += p.dy; p.dy += 0.2; p.life--; return p.life > 0; });
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
    // Items
    items.forEach(it => {
      ctx.font = `${it.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = it.bad ? '#ff3355' : '#00ff88';
      ctx.shadowBlur = 6;
      ctx.fillText(it.emoji, it.x, it.y);
      ctx.shadowBlur = 0;
    });
    // Catcher
    ctx.font = `${cfg.playerWidth * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 8;
    ctx.fillText(cfg.playerEmoji, catcher.x, catcher.y);
    ctx.shadowBlur = 0;
    // Particles
    particles.forEach(p => { ctx.globalAlpha = p.life / 25; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff3355'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Game Over!', W/2, H/2-20);
      ctx.fillStyle = '#e0e0ff'; ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${Math.floor(score)}`, W/2, H/2+20);
    }
  }

  let keys = {};
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  function handleInput() {
    if (!running || paused) return;
    const spd = 7;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) catcher.x = Math.max(catcher.w/2, catcher.x - spd);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) catcher.x = Math.min(W - catcher.w/2, catcher.x + spd);
  }
  canvas.addEventListener('mousemove', e => { if (!running || paused) return; const rect = canvas.getBoundingClientRect(); catcher.x = (e.clientX - rect.left) * (W / rect.width); });
  canvas.addEventListener('touchmove', e => { if (!running || paused) return; e.preventDefault(); const rect = canvas.getBoundingClientRect(); catcher.x = (e.touches[0].clientX - rect.left) * (W / rect.width); }, { passive: false });

  return { init, start, pause, update, draw, handleInput, isRunning: () => running, isPaused: () => paused };
}
