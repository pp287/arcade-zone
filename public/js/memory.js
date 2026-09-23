// ===== MEMORY MATCH GAME =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const COLS = 4, ROWS = 4, TOTAL = COLS * ROWS;
const SYMBOLS = ['🎮', '🎲', '🎯', '🏆', '⭐', '🔥', '💎', '🚀'];

let cards, flipped, matched, moves, score, running, locked, timer, startTime;

function init() {
  const pairs = [...SYMBOLS, ...SYMBOLS];
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  const cardW = 80, cardH = 80, gap = 10;
  const offsetX = (canvas.width - (COLS * cardW + (COLS - 1) * gap)) / 2;
  const offsetY = (canvas.height - (ROWS * cardH + (ROWS - 1) * gap)) / 2;

  cards = pairs.map((symbol, i) => ({
    symbol,
    col: i % COLS,
    row: Math.floor(i / COLS),
    x: offsetX + (i % COLS) * (cardW + gap),
    y: offsetY + Math.floor(i / COLS) * (cardH + gap),
    w: cardW,
    h: cardH,
    faceUp: false,
    matched: false
  }));

  flipped = [];
  matched = 0;
  moves = 0;
  score = 0;
  running = false;
  locked = false;
  updateScore(0);
  document.getElementById('extraInfo').innerHTML = 'Moves: <span id="movesDisplay">0</span>';
  draw();
}

function startGame() {
  init();
  running = true;
  startTime = Date.now();
  document.getElementById('startBtn').textContent = 'Restart';
  draw();
}

function draw() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  cards.forEach((card, i) => {
    if (card.matched) {
      // Matched card - green glow
      ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      roundRect(ctx, card.x, card.y, card.w, card.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(card.symbol, card.x + card.w / 2, card.y + card.h / 2);
    } else if (card.faceUp) {
      // Face up
      ctx.fillStyle = '#1a1a4a';
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      roundRect(ctx, card.x, card.y, card.w, card.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(card.symbol, card.x + card.w / 2, card.y + card.h / 2);
    } else {
      // Face down
      ctx.fillStyle = '#12122a';
      ctx.strokeStyle = '#2a2a5a';
      ctx.lineWidth = 2;
      roundRect(ctx, card.x, card.y, card.w, card.h, 8);
      ctx.fill();
      ctx.stroke();
      // Question mark
      ctx.fillStyle = '#4a4a6a';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', card.x + card.w / 2, card.y + card.h / 2);
    }
  });

  // Win overlay
  if (running && matched === TOTAL) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#e0e0ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${score}  Moves: ${moves}`, canvas.width / 2, canvas.height / 2 + 20);
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

canvas.addEventListener('click', (e) => {
  if (!running || locked) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const clicked = cards.findIndex(c =>
    !c.matched && !c.faceUp &&
    mx >= c.x && mx <= c.x + c.w &&
    my >= c.y && my <= c.y + c.h
  );

  if (clicked === -1) return;

  cards[clicked].faceUp = true;
  flipped.push(clicked);

  if (flipped.length === 2) {
    moves++;
    document.getElementById('movesDisplay').textContent = moves;
    locked = true;

    const [a, b] = flipped;
    if (cards[a].symbol === cards[b].symbol) {
      // Match!
      cards[a].matched = true;
      cards[b].matched = true;
      matched += 2;
      score += Math.max(10, 50 - moves * 2);
      updateScore(score);
      flipped = [];
      locked = false;
      draw();

      if (matched === TOTAL) {
        running = false;
        draw();
        submitScore(score);
      }
    } else {
      // No match - flip back after delay
      setTimeout(() => {
        cards[a].faceUp = false;
        cards[b].faceUp = false;
        flipped = [];
        locked = false;
        draw();
      }, 800);
    }
    draw();
  }
});

function pauseGame() {
  // Memory game doesn't need pause
}

init();
