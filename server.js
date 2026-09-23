const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, queryAll, queryOne, run } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== API Routes ====================

// --- Player ---
app.post('/api/player', (req, res) => {
  const { nickname } = req.body;
  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: 'Nickname is required' });
  }
  try {
    const existing = queryOne('SELECT * FROM players WHERE nickname = ?', [nickname.trim()]);
    if (existing) return res.json({ id: existing.id, nickname: existing.nickname });
    const result = run('INSERT INTO players (nickname) VALUES (?)', [nickname.trim()]);
    res.json({ id: result.lastInsertRowid, nickname: nickname.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Submit Score ---
app.post('/api/score', (req, res) => {
  const { player_id, game, score } = req.body;
  if (!player_id || !game || score === undefined) {
    return res.status(400).json({ error: 'player_id, game, and score are required' });
  }
  try {
    run('INSERT INTO scores (player_id, game, score) VALUES (?, ?, ?)',
      [player_id, game, Math.floor(score)]);
    const rankInfo = queryOne(`
      SELECT COUNT(DISTINCT s2.score) + 1 as rank
      FROM scores s1
      LEFT JOIN scores s2 ON s1.game = s2.game AND s2.score > s1.score
      WHERE s1.player_id = ? AND s1.game = ? AND s1.score = ?
    `, [player_id, game, Math.floor(score)]);
    res.json({ success: true, rank: rankInfo ? rankInfo.rank : 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Leaderboard ---
app.get('/api/leaderboard/:game', (req, res) => {
  const { game } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const rows = queryAll(`
      SELECT p.nickname, MAX(s.score) as best_score, s.created_at as last_played
      FROM scores s
      JOIN players p ON s.player_id = p.id
      WHERE s.game = ?
      GROUP BY p.id
      ORDER BY best_score DESC
      LIMIT ?
    `, [game, limit]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Game Stats ---
app.get('/api/stats/:game', (req, res) => {
  const { game } = req.params;
  try {
    const totalPlays = queryOne('SELECT COUNT(*) as cnt FROM scores WHERE game = ?', [game]).cnt;
    const topScore = queryOne('SELECT MAX(score) as top FROM scores WHERE game = ?', [game]).top || 0;
    const uniquePlayers = queryOne('SELECT COUNT(DISTINCT player_id) as cnt FROM scores WHERE game = ?', [game]).cnt;
    res.json({ game, totalPlays, topScore, uniquePlayers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- All Games Stats ---
app.get('/api/stats', (req, res) => {
  try {
    const games = ['snake', 'tetris', 'memory', '2048', 'breakout'];
    const stats = games.map(game => {
      const totalPlays = queryOne('SELECT COUNT(*) as cnt FROM scores WHERE game = ?', [game]).cnt;
      const topScore = queryOne('SELECT MAX(score) as top FROM scores WHERE game = ?', [game]).top || 0;
      const uniquePlayers = queryOne('SELECT COUNT(DISTINCT player_id) as cnt FROM scores WHERE game = ?', [game]).cnt;
      return { game, totalPlays, topScore, uniquePlayers };
    });
    const totalPlayers = queryOne('SELECT COUNT(*) as cnt FROM players').cnt;
    res.json({ games: stats, totalPlayers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Announcements ---
app.get('/api/announcements', (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== Admin Routes ====================

app.get('/admin/api/players', (req, res) => {
  try {
    const rows = queryAll(`
      SELECT p.id, p.nickname, p.created_at, COUNT(s.id) as total_plays, MAX(s.score) as best_score
      FROM players p LEFT JOIN scores s ON p.id = s.player_id
      GROUP BY p.id ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/admin/api/scores', (req, res) => {
  try {
    const rows = queryAll(`
      SELECT s.id, s.player_id, s.game, s.score, s.created_at, p.nickname
      FROM scores s JOIN players p ON s.player_id = p.id
      ORDER BY s.created_at DESC LIMIT 100
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/admin/api/announcements', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  try {
    run('INSERT INTO announcements (title, content) VALUES (?, ?)', [title, content]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/admin/api/announcements/:id', (req, res) => {
  const { title, content, active } = req.body;
  try {
    run('UPDATE announcements SET title=?, content=?, active=? WHERE id=?',
      [title, content, active ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/admin/api/announcements/:id', (req, res) => {
  try {
    run('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- SPA fallback ---
app.get('/games/:name', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'game.html'));
});
app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'leaderboard.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html'));
});

// --- Start server after DB init ---
async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');
    app.listen(PORT, () => {
      console.log(`🎮 ArcadeZone running at http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('❌ Failed to start:', e);
    process.exit(1);
  }
}

start();
