/* =========================================================
   topbar-panels.js
   Powers the Messages (✉) and Notifications (🔔) dropdowns
   in the topbar. Requires notifications-data.js to be loaded
   first. Include on every page, after the topbar markup.
   Self-contained — safe to load alongside common.js or
   dashboard.js on any page.
   ========================================================= */
(function () {
  if (!window.CQPanels) return; // notifications-data.js must load first
  const { state, save } = window.CQPanels;

  const icons = { deadline: '⏰', class: '🎥', msg: '✉', default: '🔔' };
  const iconFor = item => icons[item.type] || icons.default;

  function renderList(items, listEl, typeClass) {
    listEl.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'dropdown-empty';
      empty.textContent = "You're all caught up.";
      listEl.appendChild(empty);
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'dropdown-item ' + typeClass + (item.unread ? '' : ' read');
      row.dataset.id = item.id;
      row.innerHTML = `
        <div class="dropdown-item-icon">${iconFor(item)}</div>
        <div class="dropdown-item-body">
          <div class="dropdown-item-title">${item.title}</div>
          <div class="dropdown-item-text">${item.text}</div>
          <div class="dropdown-item-time">${item.time}</div>
        </div>
        <div class="dropdown-item-unread"></div>
      `;
      row.addEventListener('click', () => {
        item.unread = false;
        save();
        closeAll();
        if (typeClass === 'type-msg') {
          window.location.href = 'messages.html';
        } else {
          window.location.href = 'notifications.html';
        }
      });
      listEl.appendChild(row);
    });
  }

  function unreadCount(items) { return items.filter(i => i.unread).length; }

  function updateDot(dotEl, count) {
    if (!dotEl) return;
    if (count > 0) {
      dotEl.textContent = count > 9 ? '9+' : String(count);
      dotEl.classList.add('show');
    } else {
      dotEl.textContent = '';
      dotEl.classList.remove('show');
    }
  }

  const notifList = document.getElementById('notifList');
  const msgList = document.getElementById('msgList');
  const notifDot = document.getElementById('notifDot');
  const msgDot = document.getElementById('msgDot');
  const notifMarkRead = document.querySelector('[data-mark="notifications"]');
  const msgMarkRead = document.querySelector('[data-mark="messages"]');

  function refresh() {
    if (notifList) renderList(state.notifications, notifList, 'type-deadline');
    if (msgList) renderList(state.messages, msgList, 'type-msg');
    updateDot(notifDot, unreadCount(state.notifications));
    updateDot(msgDot, unreadCount(state.messages));
    if (notifMarkRead) notifMarkRead.disabled = unreadCount(state.notifications) === 0;
    if (msgMarkRead) msgMarkRead.disabled = unreadCount(state.messages) === 0;
  }

  function wirePanel(btnId, panelId) {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return null;
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !panel.classList.contains('open');
      closeAll();
      if (willOpen) openPanel(btn, panel);
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
    return { btn, panel };
  }

  function openPanel(btn, panel) {
    panel.classList.add('open');
    btn.classList.add('is-active');
    btn.setAttribute('aria-expanded', 'true');
  }
  function closePanel(pair) {
    if (!pair) return;
    pair.panel.classList.remove('open');
    pair.btn.classList.remove('is-active');
    pair.btn.setAttribute('aria-expanded', 'false');
  }
  function closeAll() { panels.forEach(closePanel); }

  const panels = [
    wirePanel('notifBtn', 'notifPanel'),
    wirePanel('msgBtn', 'msgPanel'),
  ].filter(Boolean);

  if (panels.length) {
    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

    if (notifMarkRead) {
      notifMarkRead.addEventListener('click', (e) => {
        e.stopPropagation();
        state.notifications.forEach(n => n.unread = false);
        save();
      });
    }
    if (msgMarkRead) {
      msgMarkRead.addEventListener('click', (e) => {
        e.stopPropagation();
        state.messages.forEach(m => m.unread = false);
        save();
      });
    }
  }

  window.CQPanels.onChange(refresh);
  refresh();
})();
