// ===== MINI GAMES LOADER =====
// Loads game config from URL params and runs the appropriate engine

(function() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('id');
  if (!gameId) { document.querySelector('.game-page').innerHTML = '<h1>Game not found</h1><p><a href="/mini/">Back to Games</a></p>'; return; }

  const game = GAMES_DATA.find(g => g.id === gameId);
  if (!game) { document.querySelector('.game-page').innerHTML = '<h1>Game not found</h1><p><a href="/mini/">Back to Games</a></p>'; return; }

  // Set game info
  document.title = game.name + ' — ArcadeZone Mini';
  document.getElementById('gameTitle').textContent = game.icon + ' ' + game.name;
  document.getElementById('gameControls').textContent = game.description;

  const canvas = document.getElementById('gameCanvas');
  canvas.width = game.canvasW || 400;
  canvas.height = game.canvasH || 400;

  // Create game instance
  let gameInstance;
  const engineMap = {
    clicker: createClickerGame, dodge: createDodgeGame, catch: createCatchGame,
    runner: createRunnerGame, memory: createMemoryGame, timing: createTimingGame, puzzle: createPuzzleGame
  };

  const factory = engineMap[game.engine];
  if (!factory) { document.querySelector('.game-page').innerHTML = '<h1>Engine error</h1>'; return; }
  gameInstance = factory(canvas, game.config || {});

  // Setup controls
  window.startGame = () => gameInstance.start();
  window.pauseGame = () => gameInstance.pause();
  window.togglePause = () => gameInstance.pause();
  window.submitScore = window.submitScore || function(){};

  // Load player
  const player = JSON.parse(localStorage.getItem('arcade_player') || 'null');
  if (player) document.getElementById('playerName').textContent = player.nickname;
  window.submitScore = async function(score) {
    if (!player) return;
    try { await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: player.id, game: 'mini_' + gameId, score }) }); } catch(e){}
  };

  // Game loop
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (gameInstance.handleInput) gameInstance.handleInput();
    gameInstance.update(dt);
    gameInstance.draw();
    requestAnimationFrame(loop);
  }
  gameInstance.init();
  gameInstance.draw();
  requestAnimationFrame(loop);
})();
