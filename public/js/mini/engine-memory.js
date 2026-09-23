// ===== MEMORY/QUIZ ENGINE =====
// Memory sequences, quiz questions, Simon says
// Config: { mode: 'sequence'|'quiz'|'pairs', items, sequenceLength, timeLimit, questionSet }

function createMemoryGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cfg = Object.assign({ mode: 'sequence', colors: ['#ff3355','#00d4ff','#00ff88','#ffee00','#aa00ff','#ff6600'], gridSize: 3, sequenceStart: 3, timeLimit: 5, bgColor: '#0a0a1a' }, config);
  let grid, sequence, playerSeq, seqIndex, level, score, running, paused, phase, timer, showIdx, showTimer, message;

  function init() {
    const size = cfg.gridSize;
    const cellW = Math.min(80, (W - 40) / size);
    const cellH = Math.min(80, (H - 80) / size);
    const offX = (W - size * cellW) / 2;
    const offY = (H - size * cellH) / 2;
    grid = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        grid.push({ r, c, x: offX + c * cellW, y: offY + r * cellH, w: cellW - 4, h: cellH - 4, color: cfg.colors[(r * size + c) % cfg.colors.length], lit: false });
    sequence = []; playerSeq = []; seqIndex = 0; level = 1; score = 0;
    phase = 'idle'; timer = 0; showIdx = 0; showTimer = 0; message = 'Press Start!';
    paused = false; running = false;
    updateScore(0);
  }

  function addToSequence() {
    sequence.push(Math.floor(Math.random() * grid.length));
  }

  function startSequence() {
    playerSeq = []; seqIndex = 0; phase = 'showing'; showIdx = 0; showTimer = 0;
    message = 'Watch!';
  }

  function start() {
    init(); running = true; level = 1; score = 0;
    for (let i = 0; i < cfg.sequenceStart; i++) addToSequence();
    startSequence();
    document.getElementById('startBtn').textContent = 'Restart';
    document.getElementById('pauseBtn').style.display = 'none';
  }
  function pause() {}

  function update(dt) {
    if (!running || paused) return;
    if (phase === 'showing') {
      showTimer += dt;
      const showInterval = Math.max(0.3, 0.7 - level * 0.03);
      if (showTimer >= showInterval) {
        showTimer = 0;
        if (showIdx < sequence.length) {
          grid.forEach(g => g.lit = false);
          grid[sequence[showIdx]].lit = true;
          showIdx++;
        } else {
          grid.forEach(g => g.lit = false);
          phase = 'input'; message = 'Your turn!';
        }
      }
    }
    if (phase === 'fail') {
      timer -= dt;
      if (timer <= 0) { running = false; submitScore(score); }
    }
    document.getElementById('extraInfo').innerHTML = `Level: <span>${level}</span> | ${message}`;
    updateScore(score);
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);
    grid.forEach(g => {
      ctx.fillStyle = g.lit ? g.color : `${g.color}44`;
      ctx.shadowColor = g.lit ? g.color : 'transparent';
      ctx.shadowBlur = g.lit ? 15 : 0;
      roundRect(ctx, g.x, g.y, g.w, g.h, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff3355'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Wrong!', W/2, H/2-20);
      ctx.fillStyle = '#e0e0ff'; ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score} | Level: ${level}`, W/2, H/2+20);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function handleClick(mx, my) {
    if (!running || phase !== 'input') return;
    const clicked = grid.findIndex(g => mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h);
    if (clicked === -1) return;
    grid[clicked].lit = true;
    setTimeout(() => { if (grid[clicked]) grid[clicked].lit = false; }, 200);

    if (clicked === sequence[seqIndex]) {
      seqIndex++;
      score += 10 * level;
      if (seqIndex >= sequence.length) {
        level++;
        addToSequence();
        message = 'Correct! ✓';
        phase = 'wait';
        setTimeout(() => { if (running) startSequence(); }, 800);
      }
    } else {
      phase = 'fail'; message = 'Wrong! ✗'; timer = 1.5;
    }
  }

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    handleClick((e.clientX-rect.left)*(W/rect.width), (e.clientY-rect.top)*(H/rect.height));
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault(); const rect = canvas.getBoundingClientRect(); const t = e.touches[0];
    handleClick((t.clientX-rect.left)*(W/rect.width), (t.clientY-rect.top)*(H/rect.height));
  }, { passive: false });

  return { init, start, pause, update, draw, isRunning: () => running, isPaused: () => paused };
}
