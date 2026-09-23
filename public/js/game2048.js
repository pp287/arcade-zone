// ===== 2048 GAME =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const SIZE = 4;
const TILE_SIZE = 85;
const GAP = 10;
const BOARD_SIZE = SIZE * TILE_SIZE + (SIZE + 1) * GAP;
canvas.width = BOARD_SIZE;
canvas.height = BOARD_SIZE;

const TILE_COLORS = {
  0: '#1a1a3a',
  2: '#2a2a5a', 4: '#3a2a6a', 8: '#ff6600', 16: '#ff4400',
  32: '#ff2200', 64: '#ff0000', 128: '#ffee00', 256: '#ffdd00',
  512: '#ffcc00', 1024: '#ffbb00', 2048: '#00ff88',
  4096: '#00d4ff', 8192: '#aa00ff'
};

let grid, score, bestScore = 0, running, won, moved;

function init() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  running = true;
  won = false;
  addRandom();
  addRandom();
  updateScore(0);
  draw();
}

function addRandom() {
  const empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push({ r, c });
  if (empty.length === 0) return;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
}

function tilePos(r, c) {
  return {
    x: GAP + c * (TILE_SIZE + GAP),
    y: GAP + r * (TILE_SIZE + GAP)
  };
}

function draw() {
  // Board background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid background
  ctx.fillStyle = '#12122a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Empty cells
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const pos = tilePos(r, c);
      ctx.fillStyle = TILE_COLORS[0];
      roundRect(ctx, pos.x, pos.y, TILE_SIZE, TILE_SIZE, 6);
      ctx.fill();
    }

  // Tiles
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      const pos = tilePos(r, c);
      ctx.fillStyle = TILE_COLORS[val] || '#ff00aa';
      ctx.shadowColor = TILE_COLORS[val] || '#ff00aa';
      ctx.shadowBlur = val >= 128 ? 10 : 4;
      roundRect(ctx, pos.x, pos.y, TILE_SIZE, TILE_SIZE, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Number text
      ctx.fillStyle = val <= 4 ? '#8888aa' : '#fff';
      ctx.font = val >= 1024 ? 'bold 20px sans-serif' : val >= 128 ? 'bold 26px sans-serif' : 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, pos.x + TILE_SIZE / 2, pos.y + TILE_SIZE / 2);
    }

  // Game over / win overlay
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    if (won) {
      ctx.fillStyle = '#00ff88';
      ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 10);
    } else {
      ctx.fillStyle = '#ff0055';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    }
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

function slide(row) {
  let arr = row.filter(v => v !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return arr;
}

function move(direction) {
  if (!running) return;
  let oldGrid = grid.map(r => [...r]);

  switch (direction) {
    case 'left':
      for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r]);
      break;
    case 'right':
      for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r].reverse()).reverse();
      break;
    case 'up':
      for (let c = 0; c < SIZE; c++) {
        let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        col = slide(col);
        for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
      }
      break;
    case 'down':
      for (let c = 0; c < SIZE; c++) {
        let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
        col = slide(col);
        for (let r = 0; r < SIZE; r++) grid[SIZE - 1 - r][c] = col[r];
      }
      break;
  }

  // Check if anything moved
  const changed = grid.some((row, r) => row.some((v, c) => v !== oldGrid[r][c]));
  if (changed) {
    addRandom();
    updateScore(score);
    // Check win
    if (!won && grid.some(row => row.some(v => v >= 2048))) {
      won = true;
    }
    // Check game over
    if (isGameOver()) {
      running = false;
      submitScore(score);
    }
  }
  draw();
}

function isGameOver() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
}

function startGame() {
  init();
  document.getElementById('startBtn').textContent = 'Restart';
}

function pauseGame() {
  // 2048 doesn't need pause
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!running) return;
  switch (e.key) {
    case 'ArrowLeft': move('left'); break;
    case 'ArrowRight': move('right'); break;
    case 'ArrowUp': move('up'); break;
    case 'ArrowDown': move('down'); break;
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});

// Touch/swipe support
let touchStartX, touchStartY;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', (e) => {
  if (!running) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  if (Math.max(absDx, absDy) < 30) return;
  if (absDx > absDy) {
    move(dx > 0 ? 'right' : 'left');
  } else {
    move(dy > 0 ? 'down' : 'up');
  }
});

init();
