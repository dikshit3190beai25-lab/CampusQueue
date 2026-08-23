/* =========================================================
   full-list.js
   Renders the full list on notifications.html and
   messages.html. Requires notifications-data.js to run
   first, and a data-full-list="notifications" | "messages"
   attribute on <body>.
   ========================================================= */
(function () {
  if (!window.CQPanels) return;
  const { state, save } = window.CQPanels;

  const key = document.body.getAttribute('data-full-list'); // "notifications" | "messages"
  if (!key || !state[key]) return;

  const icons = { deadline: '⏰', class: '🎥', msg: '✉', default: '🔔' };
  const iconFor = item => icons[item.type] || icons.default;

  const listEl = document.getElementById('fullList');
  const markAllBtn = document.getElementById('markAllReadBtn');
  const tabBtns = document.querySelectorAll('.tab-btn[data-filter]');
  let filter = 'all';

  function currentItems() {
    const items = state[key];
    return filter === 'unread' ? items.filter(i => i.unread) : items;
  }

  function render() {
    const items = currentItems();
    listEl.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'full-list-empty';
      empty.textContent = filter === 'unread' ? "No unread items — you're all caught up." : 'Nothing here yet.';
      listEl.appendChild(empty);
    } else {
      items.forEach(item => {
        const typeClass = key === 'messages' ? 'type-msg' : 'type-' + (item.type === 'msg' ? 'default' : item.type);
        const row = document.createElement('div');
        row.className = 'full-list-item ' + typeClass + (item.unread ? '' : ' read');
        row.innerHTML = `
          <div class="full-list-icon">${iconFor(item)}</div>
          <div class="full-list-body">
            <div class="full-list-title">${item.title}</div>
            <div class="full-list-text">${item.text}</div>
            <div class="full-list-time">${item.time}</div>
          </div>
          <div class="full-list-unread-dot"></div>
        `;
        row.addEventListener('click', () => {
          item.unread = false;
          save();
        });
        listEl.appendChild(row);
      });
    }
    const unread = state[key].filter(i => i.unread).length;
    if (markAllBtn) markAllBtn.disabled = unread === 0;
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    });
  });

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      state[key].forEach(i => i.unread = false);
      save();
    });
  }

  window.CQPanels.onChange(render);
  render();
})();
