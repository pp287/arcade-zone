// ===== CLICKER ENGINE =====
// Games: whack-a-mole variants, target shooting, reaction games
// Config: { targetEmoji, bgColor, maxTargets, spawnRate, targetLifetime, scorePerHit, shrink, moving }

function createClickerGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let targets = [], score = 0, timeLeft = 30, running = false, spawnTimer = 0, combo = 0, paused = false;
  let particles = [];
  const cfg = Object.assign({ targetEmoji: '🎯', bgColor: '#0a0a1a', maxTargets: 3, spawnRate: 800, targetLifetime: 2000, scorePerHit: 10, shrink: false, moving: false, badEmoji: null, badChance: 0.15, targetSize: 40 }, config);

  function spawnTarget() {
    if (targets.length >= cfg.maxTargets) return;
    const isBad = cfg.badEmoji && Math.random() < cfg.badChance;
    const size = cfg.targetSize + Math.random() * 15;
    targets.push({
      x: size + Math.random() * (W - size * 2),
      y: size + Math.random() * (H - size * 2),
      size, life: cfg.targetLifetime, maxLife: cfg.targetLifetime,
      emoji: isBad ? cfg.badEmoji : cfg.targetEmoji,
      bad: isBad, dx: cfg.moving ? (Math.random() - 0.5) * 3 : 0,
      dy: cfg.moving ? (Math.random() - 0.5) * 3 : 0,
      born: Date.now()
    });
  }

  function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, dx: (Math.random() - 0.5) * 6, dy: (Math.random() - 0.5) * 6, life: 30, color, size: 3 + Math.random() * 4 });
    }
  }

  function init() { targets = []; score = 0; timeLeft = 30; combo = 0; particles = []; spawnTimer = 0; running = false; paused = false; }

  function start() { init(); running = true; document.getElementById('startBtn').textContent = 'Restart'; document.getElementById('pauseBtn').style.display = 'inline-block'; }
  function pause() { if (!running) return; paused = !paused; document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause'; }

  function update(dt) {
    if (!running || paused) return;
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; running = false; document.getElementById('pauseBtn').style.display = 'none'; submitScore(score); }
    spawnTimer -= dt * 1000;
    if (spawnTimer <= 0) { spawnTarget(); spawnTimer = cfg.spawnRate; }
    targets = targets.filter(t => {
      t.life -= dt * 1000;
      if (cfg.moving) { t.x += t.dx; t.y += t.dy; if (t.x < t.size || t.x > W - t.size) t.dx *= -1; if (t.y < t.size || t.y > H - t.size) t.dy *= -1; }
      if (cfg.shrink) t.size = Math.max(15, t.size - dt * 8);
      return t.life > 0;
    });
    particles = particles.filter(p => { p.x += p.dx; p.y += p.dy; p.life--; return p.life > 0; });
    document.getElementById('extraInfo').innerHTML = `Time: <span>${Math.ceil(timeLeft)}s</span> | Combo: <span>${combo}x</span>`;
    updateScore(score);
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
    // Timer bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(10, 10, W - 20, 8);
    ctx.fillStyle = timeLeft > 10 ? '#00ff88' : '#ff3355';
    ctx.fillRect(10, 10, (W - 20) * (timeLeft / 30), 8);
    // Targets
    targets.forEach(t => {
      const alpha = t.life / t.maxLife;
      ctx.globalAlpha = alpha;
      ctx.font = `${t.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (t.bad) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10; }
      else { ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8; }
      ctx.fillText(t.emoji, t.x, t.y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    // Game over
    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Time\'s Up!', W / 2, H / 2 - 20);
      ctx.fillStyle = '#e0e0ff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 20);
    }
  }

  function handleClick(mx, my) {
    if (!running || paused) return;
    let hit = false;
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      const dist = Math.sqrt((mx - t.x) ** 2 + (my - t.y) ** 2);
      if (dist < t.size) {
        if (t.bad) { score = Math.max(0, score - 20); combo = 0; addParticles(t.x, t.y, '#ff3355', 8); }
        else { combo++; score += cfg.scorePerHit * Math.min(combo, 5); addParticles(t.x, t.y, '#00ff88', 12); }
        targets.splice(i, 1);
        hit = true;
        break;
      }
    }
    if (!hit) combo = 0;
  }

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    handleClick((e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height));
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleClick((touch.clientX - rect.left) * (W / rect.width), (touch.clientY - rect.top) * (H / rect.height));
  }, { passive: false });

  return { init, start, pause, update, draw, isRunning: () => running, isPaused: () => paused };
}
