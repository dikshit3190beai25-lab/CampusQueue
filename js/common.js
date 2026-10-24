/* Shared across inner pages & dashboard: toast notifications, theme toggle + topbar auth state + live search filter + universal modal & audio engine. */

/* ---------------------------------------------------------------------
   CQAuth — local-storage backed auth (no backend/server required).
   'cq_users'   -> array of registered accounts: [{ name, email, password }]
   'cq_user'    -> the currently logged-in account: { name, email }
--------------------------------------------------------------------- */
window.CQAuth = (function () {
  const USERS_KEY = 'cq_users';
  const SESSION_KEY = 'cq_user';

  // Seed default demo accounts if none exist
  function seedInitialUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw || JSON.parse(raw).length === 0) {
        const defaults = [
          { name: 'Alex Morgan', email: 'alex@campus.edu', password: 'password123', id: 'CQ-2026-8841', major: 'Design & Computing', semester: '5th Semester' },
          { name: 'Nessie Chantika', email: 'nessie@campus.edu', password: 'password123', id: 'CQ-2026-9042', major: 'UI/UX Prototyping', semester: '5th Semester' },
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
        if (!localStorage.getItem(SESSION_KEY)) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(defaults[0]));
        }
      }
    } catch (e) {
      console.warn('Could not seed demo users', e);
    }
  }
  seedInitialUsers();

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
    const newUser = {
      name,
      email,
      password,
      id: 'CQ-2026-' + Math.floor(1000 + Math.random() * 9000),
      major: 'Computer Science & Design',
      semester: '5th Semester'
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    return { ok: true, user: newUser };
  }

  function login({ email, password }) {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, message: 'Incorrect email or password.' };
    }
    setCurrentUser(user);
    return { ok: true, user };
  }

  function demoLogin() {
    const users = getUsers();
    const demo = users[0] || { name: 'Alex Morgan', email: 'alex@campus.edu', password: 'password123', id: 'CQ-2026-8841', major: 'Design & Computing', semester: '5th Semester' };
    setCurrentUser(demo);
    return demo;
  }

  function updateCurrentUser(updates) {
    const current = getCurrentUser();
    if (!current) return;
    const updated = { ...current, ...updates };
    setCurrentUser(updated);

    const users = getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === current.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      saveUsers(users);
    }
    window.dispatchEvent(new CustomEvent('userupdated', { detail: { user: updated } }));
    return updated;
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

  return { signup, login, demoLogin, logout, getCurrentUser, updateCurrentUser };
})();

/* ---------------------------------------------------------------------
   Web Audio API sound synthesizers (Zero audio file dependencies!)
--------------------------------------------------------------------- */
window.cqAudio = (function () {
  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type = 'sine', duration = 0.25, gainVal = 0.15) {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playSuccess() {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => playTone(f, 'triangle', 0.3, 0.12), i * 70);
      });
    } catch (e) {}
  }

  function playChime() {
    playTone(587.33, 'sine', 0.4, 0.15);
    setTimeout(() => playTone(880.00, 'sine', 0.5, 0.15), 120);
  }

  function playPop() {
    playTone(700, 'sine', 0.08, 0.1);
  }

  function playBell() {
    [523.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.8, 0.18), i * 150);
    });
  }

  return { playTone, playSuccess, playChime, playPop, playBell };
})();

/* ---------------------------------------------------------------------
   Universal Modal Engine
--------------------------------------------------------------------- */
window.openModal = function ({ title = '', subtitle = '', contentHtml = '', size = '', onOpen, onClose }) {
  window.closeModal(); // Close any currently open modal

  const backdrop = document.createElement('div');
  backdrop.id = 'cqActiveModalBackdrop';
  backdrop.className = 'cq-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'cq-modal' + (size ? ' ' + size : '');
  modal.innerHTML = `
    <div class="cq-modal-header">
      <div class="cq-modal-title-wrap">
        <div class="cq-modal-title">${title}</div>
        ${subtitle ? `<div class="cq-modal-sub">${subtitle}</div>` : ''}
      </div>
      <button class="cq-modal-close" aria-label="Close dialog" title="Close (Esc)">✕</button>
    </div>
    <div class="cq-modal-body">
      ${contentHtml}
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Trigger smooth fade-in
  requestAnimationFrame(() => {
    backdrop.classList.add('active');
  });

  const closeBtn = modal.querySelector('.cq-modal-close');
  function doClose() {
    backdrop.classList.remove('active');
    setTimeout(() => {
      backdrop.remove();
      if (typeof onClose === 'function') onClose();
    }, 250);
    document.removeEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (e.key === 'Escape') doClose();
  }

  if (closeBtn) closeBtn.addEventListener('click', doClose);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) doClose();
  });
  document.addEventListener('keydown', handleKey);

  window._cqCurrentModalClose = doClose;

  if (typeof onOpen === 'function') {
    onOpen(modal, doClose);
  }

  return { modal, close: doClose };
};

window.closeModal = function () {
  if (typeof window._cqCurrentModalClose === 'function') {
    window._cqCurrentModalClose();
    window._cqCurrentModalClose = null;
  } else {
    const existing = document.getElementById('cqActiveModalBackdrop');
    if (existing) existing.remove();
  }
};

window.showConfirmDialog = function ({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
  const content = `
    <p style="font-size:13.5px; line-height:1.6; color:var(--text-1); margin-bottom:18px;">${message}</p>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button type="button" class="cq-btn cq-btn-secondary" id="confirmCancelBtn">${cancelText}</button>
      <button type="button" class="cq-btn cq-btn-danger" id="confirmOkBtn">${confirmText}</button>
    </div>
  `;
  window.openModal({
    title,
    contentHtml: content,
    onOpen: (modal, close) => {
      const okBtn = modal.querySelector('#confirmOkBtn');
      const cancelBtn = modal.querySelector('#confirmCancelBtn');
      if (cancelBtn) cancelBtn.addEventListener('click', close);
      if (okBtn) {
        okBtn.addEventListener('click', () => {
          close();
          if (typeof onConfirm === 'function') onConfirm();
        });
      }
    }
  });
};

/* ---------------------------------------------------------------------
   Toast Popups
--------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------
   Universal Command Palette / Quick Search (Cmd + K or Search Bar click)
--------------------------------------------------------------------- */
window.openCommandPalette = function (initialQuery = '') {
  const existing = document.getElementById('cqCommandPaletteBackdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'cqCommandPaletteBackdrop';
  backdrop.className = 'cq-palette-backdrop';

  backdrop.innerHTML = `
    <div class="cq-palette">
      <div class="cq-palette-header">
        <span class="cq-palette-search-icon">🔎</span>
        <input type="text" class="cq-palette-input" id="paletteSearchInput" placeholder="Search tasks, assignments, classes, sources, calendar…" autocomplete="off">
        <span class="cq-palette-shortcut">ESC</span>
      </div>
      <div class="cq-palette-results" id="paletteResults"></div>
    </div>
  `;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('active'));

  const input = backdrop.querySelector('#paletteSearchInput');
  const resultsEl = backdrop.querySelector('#paletteResults');

  function closePalette() {
    backdrop.classList.remove('active');
    setTimeout(() => backdrop.remove(), 200);
    document.removeEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (e.key === 'Escape') closePalette();
  }
  document.addEventListener('keydown', handleKey);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePalette();
  });

  function gatherAllSearchItems() {
    const items = [];

    // 1. Pages / Navigation
    items.push(
      { title: 'Overview & Dashboard', sub: 'Main academic overview, routine, GPA & timer', cat: 'Navigation', icon: '▤', url: 'home.html' },
      { title: 'Calendar & Schedule', sub: 'Monthly academic events and due dates', cat: 'Navigation', icon: '📅', url: 'calendar.html' },
      { title: 'Assignments', sub: 'Track coursework deadlines and completions', cat: 'Navigation', icon: '📝', url: 'assignment.html' },
      { title: 'Enrolled Subjects', sub: 'Course syllabus, progress and instructors', cat: 'Navigation', icon: '📘', url: 'subject.html' },
      { title: 'Live Virtual Classes', sub: 'Interactive classrooms, lectures and replays', cat: 'Navigation', icon: '🎥', url: 'live-class.html' },
      { title: 'Sources & Materials', sub: 'PDF lecture slides, books and references', cat: 'Navigation', icon: '🔗', url: 'sources.html' },
      { title: 'Messages', sub: 'Direct chats with faculty and peer study groups', cat: 'Navigation', icon: '✉', url: 'messages.html' },
      { title: 'Notifications', sub: 'Deadline reminders and system alerts', cat: 'Navigation', icon: '🔔', url: 'notifications.html' },
      { title: 'Contact Support', sub: 'CampusQueue support desk and office hours', cat: 'Navigation', icon: '📞', url: 'contact.html' }
    );

    // 2. Tasks from localStorage
    try {
      const rawTasks = localStorage.getItem('cq_tasks');
      if (rawTasks) {
        const parsed = JSON.parse(rawTasks);
        parsed.forEach(t => {
          items.push({
            title: t.label,
            sub: t.done ? 'Status: Completed' : 'Status: Pending Task',
            cat: 'Task',
            icon: t.done ? '✓' : '📌',
            url: 'home.html'
          });
        });
      }
    } catch (e) {}

    // 3. Assignments from localStorage
    try {
      const rawAssign = localStorage.getItem('cq_assignments');
      if (rawAssign) {
        const parsed = JSON.parse(rawAssign);
        parsed.forEach(a => {
          items.push({
            title: a.title,
            sub: `${a.subject} · Due ${a.due || 'Soon'} (${a.done ? 'Completed' : 'Pending'})`,
            cat: 'Assignment',
            icon: '📝',
            url: 'assignment.html'
          });
        });
      }
    } catch (e) {}

    // 4. Subjects
    items.push(
      { title: 'Introduction to Web Design', sub: 'Mr. A. Sharma · Mon & Wed 8–10 AM', cat: 'Subject', icon: '🖥', url: 'subject.html' },
      { title: 'Responsive Design', sub: 'Ms. P. Kaur · Tue & Thu 12–2 PM', cat: 'Subject', icon: '📱', url: 'subject.html' },
      { title: 'Animation & Multimedia', sub: 'Mr. R. Verma · Wed & Fri 5–7 PM', cat: 'Subject', icon: '🎬', url: 'subject.html' },
      { title: 'UI Prototyping Workshop', sub: 'Ms. N. Chantika · Thu 4–6 PM', cat: 'Subject', icon: '🧩', url: 'subject.html' },
      { title: 'Information Architecture', sub: 'Mr. S. Gill · Mon 2–4 PM', cat: 'Subject', icon: '🗂', url: 'subject.html' },
      { title: 'Data Visualization Basics', sub: 'Ms. K. Randhawa · Fri 10 AM–12 PM', cat: 'Subject', icon: '📊', url: 'subject.html' }
    );

    // 5. Sources
    items.push(
      { title: 'Week 1 – HTML Fundamentals.pdf', sub: 'PDF · 1.2 MB (Web Design)', cat: 'Resource', icon: '📄', url: 'sources.html' },
      { title: 'Layout Principles — recorded lecture', sub: 'Video · 42 min (Web Design)', cat: 'Resource', icon: '🎞', url: 'sources.html' },
      { title: 'Grid & Flexbox Cheatsheet.pdf', sub: 'PDF · 640 KB (Responsive Design)', cat: 'Resource', icon: '📄', url: 'sources.html' },
      { title: 'Storyboarding Basics — recorded lecture', sub: 'Video · 35 min', cat: 'Resource', icon: '🎞', url: 'sources.html' }
    );

    return items;
  }

  const allItems = gatherAllSearchItems();

  function renderPaletteResults(query = '') {
    const q = query.trim().toLowerCase();
    resultsEl.innerHTML = '';

    const filtered = q
      ? allItems.filter(item => item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q) || item.cat.toLowerCase().includes(q))
      : allItems.slice(0, 8);

    if (filtered.length === 0) {
      resultsEl.innerHTML = `<div style="padding:24px; text-align:center; color:var(--text-3); font-size:13px;">No results matching "${query}"</div>`;
      return;
    }

    const groups = {};
    filtered.forEach(item => {
      if (!groups[item.cat]) groups[item.cat] = [];
      groups[item.cat].push(item);
    });

    Object.entries(groups).forEach(([category, groupItems]) => {
      const catTitle = document.createElement('div');
      catTitle.className = 'cq-palette-group-title';
      catTitle.textContent = category;
      resultsEl.appendChild(catTitle);

      groupItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cq-palette-item';
        row.innerHTML = `
          <div class="cq-palette-item-icon">${item.icon}</div>
          <div class="cq-palette-item-info">
            <div class="cq-palette-item-title">${item.title}</div>
            <div class="cq-palette-item-sub">${item.sub}</div>
          </div>
          <div class="cq-palette-item-action">Jump ↵</div>
        `;
        row.addEventListener('click', () => {
          closePalette();
          if (item.url) window.location.href = item.url;
        });
        resultsEl.appendChild(row);
      });
    });
  }

  input.value = initialQuery;
  input.addEventListener('input', (e) => renderPaletteResults(e.target.value));
  renderPaletteResults(initialQuery);

  setTimeout(() => {
    input.focus();
    input.select();
  }, 50);
};

/* Keyboard shortcut: Cmd + K or Ctrl + K or / to open Command Palette */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    window.openCommandPalette();
  }
});

/* ---------------------------------------------------------------------
   Student Profile Modal Engine
--------------------------------------------------------------------- */
window.openProfileModal = function () {
  const user = window.CQAuth.getCurrentUser() || {
    name: 'Student Guest',
    email: 'guest@campus.edu',
    id: 'CQ-2026-0001',
    major: 'Computer Science & Design',
    semester: '5th Semester'
  };

  const completedTasksCount = (function () {
    try {
      const tasks = JSON.parse(localStorage.getItem('cq_tasks') || '[]');
      return tasks.filter(t => t.done).length;
    } catch (e) {
      return 2;
    }
  })();

  const modalHtml = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding-bottom:18px; border-bottom:1px solid var(--border-soft);">
      <div style="width:58px; height:58px; border-radius:16px; background:linear-gradient(135deg, var(--blue), #8a9cff); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:#fff; box-shadow:0 8px 20px -6px rgba(77,107,254,.6);">
        ${user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div>
        <div style="font-size:16px; font-weight:800; color:var(--text-1);">${user.name}</div>
        <div style="font-size:12.5px; color:var(--text-2);">${user.email}</div>
        <div style="font-size:11px; font-weight:700; color:var(--blue); margin-top:3px; background:var(--blue-dim); display:inline-block; padding:2px 8px; border-radius:6px;">
          Student ID: ${user.id || 'CQ-2026-8841'}
        </div>
      </div>
    </div>

    <div class="stats-overview-bar" style="margin-bottom:18px;">
      <div class="stat-box">
        <div class="stat-box-num blue">4.00</div>
        <div class="stat-box-label">Cumulative GPA</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-num amber">6</div>
        <div class="stat-box-label">Enrolled Courses</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-num teal">${completedTasksCount}</div>
        <div class="stat-box-label">Tasks Finished</div>
      </div>
    </div>

    <form id="profileEditForm">
      <div class="cq-form-row">
        <div class="cq-form-group">
          <label class="cq-label" for="profileName">Full Name</label>
          <input type="text" id="profileName" class="cq-input" value="${user.name}" required>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="profileEmail">Email</label>
          <input type="email" id="profileEmail" class="cq-input" value="${user.email}" required>
        </div>
      </div>
      <div class="cq-form-row">
        <div class="cq-form-group">
          <label class="cq-label" for="profileMajor">Department / Major</label>
          <input type="text" id="profileMajor" class="cq-input" value="${user.major || 'Computer Science & Design'}">
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="profileSemester">Current Semester</label>
          <select id="profileSemester" class="cq-select">
            <option ${user.semester === '1st Semester' ? 'selected' : ''}>1st Semester</option>
            <option ${user.semester === '2nd Semester' ? 'selected' : ''}>2nd Semester</option>
            <option ${user.semester === '3rd Semester' ? 'selected' : ''}>3rd Semester</option>
            <option ${user.semester === '4th Semester' ? 'selected' : ''}>4th Semester</option>
            <option ${!user.semester || user.semester === '5th Semester' ? 'selected' : ''}>5th Semester</option>
            <option ${user.semester === '6th Semester' ? 'selected' : ''}>6th Semester</option>
            <option ${user.semester === '7th Semester' ? 'selected' : ''}>7th Semester</option>
            <option ${user.semester === '8th Semester' ? 'selected' : ''}>8th Semester</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-soft);">
        <button type="button" class="cq-btn cq-btn-danger" id="profileLogoutBtn">Log Out</button>
        <button type="submit" class="cq-btn cq-btn-primary">Save Profile</button>
      </div>
    </form>
  `;

  window.openModal({
    title: 'Student Profile & Academic Settings',
    subtitle: 'Manage your personal academic record and preferences',
    contentHtml: modalHtml,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#profileEditForm');
      const logoutBtn = modal.querySelector('#profileLogoutBtn');

      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          close();
          window.CQAuth.logout();
          window.location.reload();
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = modal.querySelector('#profileName').value.trim();
          const email = modal.querySelector('#profileEmail').value.trim();
          const major = modal.querySelector('#profileMajor').value.trim();
          const semester = modal.querySelector('#profileSemester').value;

          if (!name || !email) {
            window.showToast('Please enter your name and email', '⚠️');
            return;
          }

          window.CQAuth.updateCurrentUser({ name, email, major, semester });
          window.showToast('Profile updated successfully!', '✓');
          if (window.cqAudio) window.cqAudio.playSuccess();
          close();
        });
      }
    }
  });
};

/* ---------------------------------------------------------------------
   Global Assignment Badge Syncer
--------------------------------------------------------------------- */
window.updateGlobalBadges = function () {
  const badgeEl = document.getElementById('assignBadge');
  if (!badgeEl) return;
  try {
    const raw = localStorage.getItem('cq_assignments');
    if (raw) {
      const assignments = JSON.parse(raw);
      const pending = assignments.filter(a => !a.done).length;
      badgeEl.textContent = pending;
      return;
    }
    const rawTasks = localStorage.getItem('cq_tasks');
    if (rawTasks) {
      const tasks = JSON.parse(rawTasks);
      const pendingTasks = tasks.filter(t => !t.done).length;
      badgeEl.textContent = pendingTasks;
    }
  } catch (e) {}
};

/* ---------------------------------------------------------------------
   Theme, Search & Auth Initialization
--------------------------------------------------------------------- */
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
      if (window.cqAudio) window.cqAudio.playPop();
    }

    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  /* Live Topbar Search Input Filtering + Command Palette trigger */
  const searchInput = document.querySelector('.search input');
  if (searchInput) {
    // When clicking or pressing Enter, open comprehensive command palette
    searchInput.addEventListener('click', (e) => {
      if (e.target.value.trim().length > 0) {
        window.openCommandPalette(e.target.value);
      }
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.openCommandPalette(searchInput.value);
      }
    });

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
    if (userChip) {
      userChip.style.display = 'flex';
      userChip.style.cursor = 'pointer';
      userChip.setAttribute('title', 'Click to view Student Profile & Settings');
    }
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
    // If guest, auto-populate guest state
    showGuestState();
  }

  // Allow clicking user chip to view profile
  if (userChip) {
    userChip.addEventListener('click', (e) => {
      if (e.target.closest('#logoutBtn')) return; // handled separately
      window.openProfileModal();
    });
  }

  window.addEventListener('userupdated', (e) => {
    if (e.detail && e.detail.user) {
      showUserState(e.detail.user);
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.showConfirmDialog({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out of CampusQueue?',
        confirmText: 'Sign Out',
        onConfirm: () => {
          window.CQAuth.logout();
          showGuestState();
          window.showToast('Logged out successfully', '↪');
        }
      });
    });
  }

  window.updateGlobalBadges();
})();

