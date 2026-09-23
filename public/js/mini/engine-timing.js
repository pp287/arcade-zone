// ===== TIMING ENGINE =====
// Stop the timer, rhythm, precision games
// Config: { mode: 'stop'|'rhythm'|'orbit', speed, targetZone, bgColor }

function createTimingGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cfg = Object.assign({ mode: 'stop', speed: 3, targetZone: 0.15, bgColor: '#0a0a1a', rounds: 10, indicatorEmoji: '⏱️', targetEmoji: '🎯' }, config);
  let angle, score, round, running, paused, direction, speedMul, resultTimer, lastResult, particles, zones;

  function init() {
    angle = 0; score = 0; round = 0; direction = 1; speedMul = 1;
    paused = false; running = false; resultTimer = 0; lastResult = '';
    particles = [];
    zones = [];
    for (let i = 0; i < 2; i++) zones.push(Math.random() * Math.PI * 2);
    updateScore(0);
  }

  function start() { init(); running = true; round = 1; document.getElementById('startBtn').textContent = 'Restart'; document.getElementById('pauseBtn').style.display = 'none'; }
  function pause() {}

  function update(dt) {
    if (!running || paused) return;
    if (resultTimer > 0) { resultTimer -= dt; if (resultTimer <= 0 && round <= cfg.rounds) { angle = 0; zones = [Math.random()*Math.PI*2, Math.random()*Math.PI*2]; lastResult = ''; } if (round > cfg.rounds) { running = false; submitScore(score); } return; }
    angle += dt * cfg.speed * speedMul * direction;
    if (angle > Math.PI * 2) angle -= Math.PI * 2;
    particles = particles.filter(p => { p.x += p.dx; p.y += p.dy; p.life--; return p.life > 0; });
    document.getElementById('extraInfo').innerHTML = `Round: <span>${Math.min(round, cfg.rounds)}/${cfg.rounds}</span> | ${lastResult}`;
    updateScore(score);
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
    const cx = W/2, cy = H/2, radius = Math.min(W, H) * 0.35;

    // Draw ring
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Target zones
    zones.forEach(z => {
      const zoneAngle = cfg.targetZone * Math.PI;
      ctx.strokeStyle = '#00ff8844';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, z - zoneAngle/2, z + zoneAngle/2);
      ctx.stroke();
      // Target marker
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(z) * radius, cy + Math.sin(z) * radius, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Moving indicator
    if (resultTimer <= 0) {
      const ix = cx + Math.cos(angle) * radius;
      const iy = cy + Math.sin(angle) * radius;
      ctx.fillStyle = '#ff3355';
      ctx.shadowColor = '#ff3355';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ix, iy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Center text
    ctx.fillStyle = '#e0e0ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (lastResult) {
      ctx.fillStyle = lastResult.includes('Perfect') ? '#00ff88' : lastResult.includes('Good') ? '#ffee00' : '#ff3355';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(lastResult, cx, cy);
    } else if (running) {
      ctx.fillText('Click/Tap!', cx, cy);
    }

    // Particles
    particles.forEach(p => { ctx.globalAlpha = p.life / 25; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; });

    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#00ff88'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Done!', W/2, H/2-20);
      ctx.fillStyle = '#e0e0ff'; ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, W/2, H/2+20);
    }
  }

  function handleClick() {
    if (!running || resultTimer > 0) return;
    // Check if angle is within any target zone
    let bestDist = Infinity;
    zones.forEach(z => {
      let diff = Math.abs(angle - z);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      bestDist = Math.min(bestDist, diff);
    });
    const zoneAngle = cfg.targetZone * Math.PI;
    if (bestDist < zoneAngle * 0.3) { lastResult = '🎯 Perfect!'; score += 100; for(let i=0;i<15;i++) particles.push({x:W/2,y:H/2,dx:(Math.random()-0.5)*8,dy:(Math.random()-0.5)*8,life:25,color:'#00ff88',size:4}); }
    else if (bestDist < zoneAngle) { lastResult = '✓ Good!'; score += 50; }
    else { lastResult = '✗ Miss!'; score = Math.max(0, score - 10); }
    round++;
    speedMul += 0.1;
    resultTimer = 0.8;
  }

  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleClick(); }, { passive: false });
  document.addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); handleClick(); } });

  return { init, start, pause, update, draw, isRunning: () => running, isPaused: () => paused };
}
