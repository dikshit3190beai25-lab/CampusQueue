/* Shared across inner pages & dashboard: toast notifications, theme toggle + topbar auth state + live search filter. */

/* ---------------------------------------------------------------------
   CQAuth — local-storage backed auth (no backend/server required).
   'cq_users'   -> array of registered accounts: [{ name, email, password }]
   'cq_user'    -> the currently logged-in account: { name, email }
--------------------------------------------------------------------- */
window.CQAuth = (function () {
  const USERS_KEY = 'cq_users';
  const SESSION_KEY = 'cq_user';

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function findUserByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    return getUsers().find(u => u.email.toLowerCase() === normalized);
  }

  function signup({ name, email, password }) {
    if (findUserByEmail(email)) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    const users = getUsers();
    users.push({ name, email, password });
    saveUsers(users);
    setCurrentUser({ name, email });
    return { ok: true };
  }

  function login({ email, password }) {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, message: 'Incorrect email or password.' };
    }
    setCurrentUser({ name: user.name, email: user.email });
    return { ok: true };
  }

  function setCurrentUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  return { signup, login, logout, getCurrentUser };
})();

window.showToast = function (msg, icon = '✨') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-popup';
  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2600);
};

(function () {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');

  function applyTheme(theme, save = true) {
    body.setAttribute('data-theme', theme);
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    if (themeToggle) {
      themeToggle.setAttribute('aria-checked', String(theme === 'dark'));
      themeToggle.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
    if (save) localStorage.setItem('cq_theme', theme);
    if (typeof window.onThemeChange === 'function') window.onThemeChange(theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  const savedTheme = localStorage.getItem('cq_theme') || body.getAttribute('data-theme') || 'dark';
  applyTheme(savedTheme, false);

  if (themeToggle) {
    themeToggle.setAttribute('role', 'switch');
    themeToggle.setAttribute('tabindex', '0');
    themeToggle.setAttribute('aria-label', 'Toggle theme mode');

    function toggleTheme() {
      const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      window.showToast(`Theme changed to ${next} mode`, next === 'dark' ? '🌙' : '☀️');
    }

    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  /* Live Topbar Search Input Filtering */
  const searchInput = document.querySelector('.search input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const searchableCards = document.querySelectorAll(
        '.card, .task-row, .deadline-item, .class-card, .r-item, .subject-card, .live-item, .assignment-card'
      );
      if (!q) {
        searchableCards.forEach(card => card.style.display = '');
        return;
      }
      searchableCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(q)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  const guestActions = document.getElementById('guestActions');
  const userChip = document.getElementById('userChip');
  const logoutBtn = document.getElementById('logoutBtn');

  function showGuestState() {
    if (guestActions) guestActions.style.display = 'flex';
    if (userChip) userChip.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
  function showUserState(user) {
    if (guestActions) guestActions.style.display = 'none';
    if (userChip) userChip.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = user.name;
    if (avatarEl) avatarEl.textContent = initials(user.name);
  }

  const currentUser = window.CQAuth.getCurrentUser();
  if (currentUser) {
    showUserState(currentUser);
  } else {
    showGuestState();
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (!confirmed) return;
      window.CQAuth.logout();
      showGuestState();
      window.showToast('Logged out successfully', '↪');
    });
  }
})();
