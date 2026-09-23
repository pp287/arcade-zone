// ===== Player Management =====
let currentPlayer = null;

function loadPlayer() {
  const saved = localStorage.getItem('arcade_player');
  if (saved) {
    currentPlayer = JSON.parse(saved);
    document.getElementById('playerName').textContent = currentPlayer.nickname;
    document.querySelector('.btn-sm').style.display = 'none';
  }
}

function showLoginModal() {
  document.getElementById('loginModal').classList.add('active');
  document.getElementById('nicknameInput').focus();
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
}

async function submitLogin() {
  const nickname = document.getElementById('nicknameInput').value.trim();
  if (!nickname) return;
  try {
    const res = await fetch('/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname })
    });
    const data = await res.json();
    currentPlayer = data;
    localStorage.setItem('arcade_player', JSON.stringify(data));
    document.getElementById('playerName').textContent = data.nickname;
    document.querySelector('.btn-sm').style.display = 'none';
    closeLoginModal();
  } catch (e) {
    alert('Failed to login. Try again.');
  }
}

document.getElementById('nicknameInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitLogin();
});

// ===== Load Stats =====
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('totalPlayers').textContent = data.totalPlayers;
    const totalGames = data.games.reduce((sum, g) => sum + g.totalPlays, 0);
    document.getElementById('totalGames').textContent = totalGames;
    data.games.forEach(g => {
      const el = document.getElementById(`stats-${g.game}`);
      if (el) {
        el.innerHTML = `🏆 Top: <strong>${g.topScore}</strong> &nbsp;|&nbsp; 👥 ${g.uniquePlayers} players &nbsp;|&nbsp; 🎮 ${g.totalPlays} plays`;
      }
    });
  } catch (e) { /* silent */ }
}

// ===== Load Announcements =====
async function loadAnnouncements() {
  try {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    const bar = document.getElementById('announcementBar');
    if (data.length > 0) {
      bar.textContent = `📢 ${data[0].title}: ${data[0].content}`;
      bar.style.display = 'inline-block';
    } else {
      bar.style.display = 'none';
    }
  } catch (e) { /* silent */ }
}

// Init
loadPlayer();
loadStats();
loadAnnouncements();
