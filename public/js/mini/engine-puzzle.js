// ===== PUZZLE ENGINE =====
// Sliding tiles, color matching, pipe connect, match-3
// Config: { mode: 'slide'|'match3'|'colorMatch'|'pipes', size, colors, bgColor }

function createPuzzleGame(canvas, config) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cfg = Object.assign({ mode: 'slide', size: 4, colors: ['#ff3355','#00d4ff','#00ff88','#ffee00','#aa00ff','#ff6600'], bgColor: '#0a0a1a', targetMoves: 50 }, config);
  let grid, moves, score, running, paused, selected, cellSize, offsetX, offsetY, animTimer, matches;

  function init() {
    cellSize = Math.min((W - 40) / cfg.size, (H - 60) / cfg.size);
    offsetX = (W - cfg.size * cellSize) / 2;
    offsetY = (H - cfg.size * cellSize) / 2;
    moves = 0; score = 0; selected = null; animTimer = 0; matches = 0; paused = false;

    if (cfg.mode === 'slide') {
      // Sliding puzzle - generate solved state then shuffle
      grid = [];
      for (let i = 0; i < cfg.size * cfg.size; i++) grid.push(i);
      grid[cfg.size * cfg.size - 1] = -1; // empty
      // Shuffle by making random valid moves
      let emptyIdx = cfg.size * cfg.size - 1;
      for (let i = 0; i < 200; i++) {
        const er = Math.floor(emptyIdx / cfg.size), ec = emptyIdx % cfg.size;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]].filter(([dr,dc]) => er+dr>=0 && er+dr<cfg.size && ec+dc>=0 && ec+dc<cfg.size);
        const [dr,dc] = dirs[Math.floor(Math.random()*dirs.length)];
        const ni = (er+dr)*cfg.size + (ec+dc);
        [grid[emptyIdx], grid[ni]] = [grid[ni], grid[emptyIdx]];
        emptyIdx = ni;
      }
    } else if (cfg.mode === 'match3') {
      grid = [];
      for (let r = 0; r < cfg.size; r++) {
        grid[r] = [];
        for (let c = 0; c < cfg.size; c++) grid[r][c] = Math.floor(Math.random() * cfg.colors.length);
      }
      removeMatches(); // clear initial matches
    } else {
      // colorMatch - match all cells to one color
      grid = [];
      for (let r = 0; r < cfg.size; r++) { grid[r] = []; for (let c = 0; c < cfg.size; c++) grid[r][c] = Math.floor(Math.random() * cfg.colors.length); }
    }
    running = false;
    updateScore(0);
  }

  function start() { init(); running = true; document.getElementById('startBtn').textContent = 'Restart'; document.getElementById('pauseBtn').style.display = 'none'; }
  function pause() {}

  function removeMatches() {
    if (cfg.mode !== 'match3') return 0;
    let cleared = 0;
    // Check horizontal
    for (let r = 0; r < cfg.size; r++) {
      for (let c = 0; c < cfg.size - 2; c++) {
        if (grid[r][c] >= 0 && grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) {
          let end = c + 2;
          while (end + 1 < cfg.size && grid[r][end+1] === grid[r][c]) end++;
          for (let i = c; i <= end; i++) grid[r][i] = -1;
          cleared += end - c + 1;
          c = end;
        }
      }
    }
    // Check vertical
    for (let c = 0; c < cfg.size; c++) {
      for (let r = 0; r < cfg.size - 2; r++) {
        if (grid[r][c] >= 0 && grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) {
          let end = r + 2;
          while (end + 1 < cfg.size && grid[end+1][c] === grid[r][c]) end++;
          for (let i = r; i <= end; i++) grid[i][c] = -1;
          cleared += end - r + 1;
          r = end;
        }
      }
    }
    // Drop tiles down
    for (let c = 0; c < cfg.size; c++) {
      let write = cfg.size - 1;
      for (let r = cfg.size - 1; r >= 0; r--) {
        if (grid[r][c] >= 0) { grid[write][c] = grid[r][c]; if (write !== r) grid[r][c] = -1; write--; }
      }
      for (let r = write; r >= 0; r--) grid[r][c] = Math.floor(Math.random() * cfg.colors.length);
    }
    return cleared;
  }

  function floodFill(sr, sc, fromColor, toColor) {
    if (sr < 0 || sr >= cfg.size || sc < 0 || sc >= cfg.size) return;
    if (grid[sr][sc] !== fromColor) return;
    grid[sr][sc] = toColor;
    floodFill(sr-1, sc, fromColor, toColor);
    floodFill(sr+1, sc, fromColor, toColor);
    floodFill(sr, sc-1, fromColor, toColor);
    floodFill(sr, sc+1, fromColor, toColor);
  }

  function isSolved() {
    if (cfg.mode === 'slide') {
      for (let i = 0; i < grid.length - 1; i++) if (grid[i] !== i) return false;
      return true;
    } else if (cfg.mode === 'colorMatch') {
      const first = grid[0][0];
      for (let r = 0; r < cfg.size; r++) for (let c = 0; c < cfg.size; c++) if (grid[r][c] !== first) return false;
      return true;
    }
    return false;
  }

  function update(dt) {
    if (!running || paused) return;
    if (isSolved()) {
      score += Math.max(0, (cfg.targetMoves - moves) * 10);
      running = false; submitScore(score);
    }
    document.getElementById('extraInfo').innerHTML = `Moves: <span>${moves}</span> | ${cfg.mode === 'slide' ? 'Arrange in order!' : cfg.mode === 'colorMatch' ? 'Make all one color!' : 'Match 3+ to score!'}`;
    updateScore(score);
  }

  function draw() {
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);

    if (cfg.mode === 'slide') {
      for (let i = 0; i < grid.length; i++) {
        const r = Math.floor(i / cfg.size), c = i % cfg.size;
        const val = grid[i];
        if (val === -1) continue;
        const x = offsetX + c * cellSize + 2, y = offsetY + r * cellSize + 2;
        const correct = val === i;
        ctx.fillStyle = correct ? '#00ff8844' : '#1a1a4a';
        ctx.strokeStyle = correct ? '#00ff88' : '#2a2a5a';
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, cellSize - 4, cellSize - 4, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = correct ? '#00ff88' : '#e0e0ff';
        ctx.font = `bold ${cellSize * 0.4}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(val + 1, x + (cellSize-4)/2, y + (cellSize-4)/2);
      }
    } else if (cfg.mode === 'match3') {
      for (let r = 0; r < cfg.size; r++) {
        for (let c = 0; c < cfg.size; c++) {
          if (grid[r][c] < 0) continue;
          const x = offsetX + c * cellSize + 2, y = offsetY + r * cellSize + 2;
          ctx.fillStyle = cfg.colors[grid[r][c]];
          ctx.shadowColor = cfg.colors[grid[r][c]];
          ctx.shadowBlur = 5;
          roundRect(ctx, x, y, cellSize - 4, cellSize - 4, 6);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    } else {
      for (let r = 0; r < cfg.size; r++) {
        for (let c = 0; c < cfg.size; c++) {
          const x = offsetX + c * cellSize + 2, y = offsetY + r * cellSize + 2;
          ctx.fillStyle = cfg.colors[grid[r][c]];
          ctx.shadowColor = cfg.colors[grid[r][c]];
          ctx.shadowBlur = 5;
          roundRect(ctx, x, y, cellSize - 4, cellSize - 4, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#00ff88'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Solved!', W/2, H/2-20);
      ctx.fillStyle = '#e0e0ff'; ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score} | Moves: ${moves}`, W/2, H/2+20);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function handleClick(mx, my) {
    if (!running) return;
    const c = Math.floor((mx - offsetX) / cellSize);
    const r = Math.floor((my - offsetY) / cellSize);
    if (r < 0 || r >= cfg.size || c < 0 || c >= cfg.size) return;

    if (cfg.mode === 'slide') {
      const idx = r * cfg.size + c;
      const emptyIdx = grid.indexOf(-1);
      const er = Math.floor(emptyIdx / cfg.size), ec = emptyIdx % cfg.size;
      if (Math.abs(er - r) + Math.abs(ec - c) === 1) {
        [grid[idx], grid[emptyIdx]] = [grid[emptyIdx], grid[idx]];
        moves++;
      }
    } else if (cfg.mode === 'match3') {
      if (!selected) { selected = { r, c }; return; }
      if (Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1) {
        [grid[selected.r][selected.c], grid[r][c]] = [grid[r][c], grid[selected.r][selected.c]];
        const cleared = removeMatches();
        if (cleared === 0) [grid[selected.r][selected.c], grid[r][c]] = [grid[r][c], grid[selected.r][selected.c]];
        else { score += cleared * 15; moves++; }
        // Chain reactions
        let chain = removeMatches();
        while (chain > 0) { score += chain * 20; chain = removeMatches(); }
      }
      selected = null;
    } else {
      // colorMatch - flood fill from clicked cell
      const fromColor = grid[r][c];
      const clickColor = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
      if (fromColor !== clickColor) { floodFill(r, c, fromColor, clickColor); moves++; }
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
