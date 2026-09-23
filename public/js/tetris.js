// ===== TETRIS GAME =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10, ROWS = 20, BLOCK = 30;
canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

const COLORS = ['#00d4ff', '#ff00aa', '#00ff88', '#ffee00', '#aa00ff', '#ff6600', '#ff3355'];

const SHAPES = [
  [[1,1,1,1]],           // I
  [[1,1],[1,1]],         // O
  [[0,1,0],[1,1,1]],     // T
  [[1,0,0],[1,1,1]],     // L
  [[0,0,1],[1,1,1]],     // J
  [[0,1,1],[1,1,0]],     // S
  [[1,1,0],[0,1,1]]      // Z
];

let board, piece, score, lines, gameLoop, running, paused, dropInterval;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function newPiece() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[idx].map(r => [...r]);
  return {
    shape, color: COLORS[idx],
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  };
}

function rotate(shape) {
  const rows = shape.length, cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      rotated[c][rows - 1 - r] = shape[r][c];
  return rotated;
}

function collides(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nx = ox + c, ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
  return false;
}

function lock() {
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) {
        const y = piece.y + r;
        if (y < 0) { gameOver(); return; }
        board[y][piece.x + c] = piece.color;
      }
  clearLines();
  piece = newPiece();
  if (collides(piece.shape, piece.x, piece.y)) gameOver();
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(c => c !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      r++; // recheck row
    }
  }
  if (cleared > 0) {
    const pts = [0, 100, 300, 500, 800];
    score += pts[cleared];
    lines += cleared;
    updateScore(score);
    document.getElementById('extraInfo').innerHTML = `Lines: <span>${lines}</span>`;
    // Speed up
    if (dropInterval > 50) {
      dropInterval = Math.max(50, 500 - lines * 10);
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, dropInterval);
    }
  }
}

function tick() {
  if (!collides(piece.shape, piece.x, piece.y + 1)) {
    piece.y++;
  } else {
    lock();
  }
  draw();
}

function hardDrop() {
  while (!collides(piece.shape, piece.x, piece.y + 1)) {
    piece.y++;
    score += 2;
  }
  updateScore(score);
  lock();
  draw();
}

function draw() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, canvas.height); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(canvas.width, r * BLOCK); ctx.stroke();
  }

  // Board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) drawBlock(c, r, board[r][c]);

  // Current piece
  if (piece) {
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        if (piece.shape[r][c])
          drawBlock(piece.x + c, piece.y + r, piece.color);

    // Ghost piece
    let ghostY = piece.y;
    while (!collides(piece.shape, piece.x, ghostY + 1)) ghostY++;
    if (ghostY !== piece.y) {
      for (let r = 0; r < piece.shape.length; r++)
        for (let c = 0; c < piece.shape[r].length; c++)
          if (piece.shape[r][c]) {
            ctx.strokeStyle = piece.color;
            ctx.globalAlpha = 0.3;
            ctx.strokeRect((piece.x + c) * BLOCK + 1, (ghostY + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
            ctx.globalAlpha = 1;
          }
    }
  }

  if (!running && score > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#e0e0ff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}  Lines: ${lines}`, canvas.width / 2, canvas.height / 2 + 20);
  }
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
  ctx.shadowBlur = 0;
}

function startGame() {
  if (running && !paused) return;
  if (paused) { pauseGame(); return; }
  board = createBoard();
  score = 0; lines = 0;
  dropInterval = 500;
  piece = newPiece();
  running = true; paused = false;
  updateScore(0);
  document.getElementById('extraInfo').innerHTML = 'Lines: <span>0</span>';
  document.getElementById('startBtn').textContent = 'Restart';
  document.getElementById('pauseBtn').style.display = 'inline-block';
  document.getElementById('pauseBtn').textContent = 'Pause';
  clearInterval(gameLoop);
  gameLoop = setInterval(tick, dropInterval);
  draw();
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
  if (paused) {
    clearInterval(gameLoop);
  } else {
    gameLoop = setInterval(tick, dropInterval);
  }
}

function gameOver() {
  running = false;
  clearInterval(gameLoop);
  document.getElementById('pauseBtn').style.display = 'none';
  draw();
  submitScore(score);
}

document.addEventListener('keydown', (e) => {
  if (!running || paused) return;
  switch (e.key) {
    case 'ArrowLeft':
      if (!collides(piece.shape, piece.x - 1, piece.y)) piece.x--;
      break;
    case 'ArrowRight':
      if (!collides(piece.shape, piece.x + 1, piece.y)) piece.x++;
      break;
    case 'ArrowDown':
      if (!collides(piece.shape, piece.x, piece.y + 1)) { piece.y++; score += 1; updateScore(score); }
      break;
    case 'ArrowUp':
      const rotated = rotate(piece.shape);
      if (!collides(rotated, piece.x, piece.y)) piece.shape = rotated;
      break;
    case ' ':
      hardDrop();
      break;
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  draw();
});

// Initial draw
board = createBoard();
piece = null;
score = 0; lines = 0;
running = false;
draw();
