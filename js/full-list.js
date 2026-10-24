/* =========================================================
   full-list.js
   Renders and manages notifications.html and messages.html:
   - Full message threading & compose message modal
   - Notification detail actions & clear all
   - Filter tabs (All / Unread)
   - Real-time updates with CQPanels
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
  const clearAllBtn = document.getElementById('clearAllNotifsBtn');
  const composeBtn = document.getElementById('composeMessageBtn');
  const tabBtns = document.querySelectorAll('.tab-btn[data-filter]');
  let filter = 'all';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function currentItems() {
    const items = state[key];
    return filter === 'unread' ? items.filter(i => i.unread) : items;
  }

  function render() {
    if (!listEl) return;
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
        row.style.cursor = 'pointer';

        row.innerHTML = `
          <div class="full-list-icon">${iconFor(item)}</div>
          <div class="full-list-body">
            <div class="full-list-title">${escapeHtml(item.title)}</div>
            <div class="full-list-text">${escapeHtml(item.text)}</div>
            <div class="full-list-time">${escapeHtml(item.time)}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="full-list-unread-dot"></div>
            <button type="button" class="task-btn item-del-btn" title="Delete" style="opacity:0.6;">🗑️</button>
          </div>
        `;

        // Click row opens details / thread
        row.addEventListener('click', (e) => {
          if (e.target.closest('.item-del-btn')) return;
          item.unread = false;
          save();

          if (key === 'messages') {
            openMessageThreadModal(item);
          } else {
            openNotificationDetailModal(item);
          }
        });

        // Delete button
        const delBtn = row.querySelector('.item-del-btn');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state[key] = state[key].filter(i => i.id !== item.id);
          save();
          window.showToast('Item deleted', '🗑️');
        });

        listEl.appendChild(row);
      });
    }

    const unread = state[key].filter(i => i.unread).length;
    if (markAllBtn) markAllBtn.disabled = unread === 0;
  }

  /* Modal: Message Conversation Thread */
  function openMessageThreadModal(msg) {
    if (!msg.replies) {
      msg.replies = [];
    }

    function getRepliesHtml() {
      if (!msg.replies || msg.replies.length === 0) return '';
      return msg.replies.map(r => `
        <div style="margin-top:10px; background:var(--bg-card); padding:10px 14px; border-radius:10px; border-left:3px solid var(--blue);">
          <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:3px;">
            <strong style="color:var(--text-1);">${escapeHtml(r.sender)}</strong>
            <span style="color:var(--text-3);">${escapeHtml(r.time)}</span>
          </div>
          <div style="font-size:13px; color:var(--text-2);">${escapeHtml(r.text)}</div>
        </div>
      `).join('');
    }

    const modalHtml = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid var(--border-soft);">
        <div style="width:44px; height:44px; border-radius:12px; background:var(--blue-dim); color:var(--blue); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800;">
          ✉
        </div>
        <div>
          <div style="font-size:15px; font-weight:800; color:var(--text-1);">${escapeHtml(msg.title)}</div>
          <div style="font-size:11.5px; color:var(--text-3);">${escapeHtml(msg.time)}</div>
        </div>
      </div>

      <div style="background:var(--bg-card-alt); padding:14px 16px; border-radius:12px; font-size:13.5px; line-height:1.6; color:var(--text-1); margin-bottom:14px; border:1px solid var(--border-soft);">
        ${escapeHtml(msg.text)}
      </div>

      <div id="threadRepliesList">
        ${getRepliesHtml()}
      </div>

      <form id="replyMessageForm" style="margin-top:16px;">
        <div class="cq-form-group">
          <label class="cq-label" for="replyText">Write Reply</label>
          <textarea id="replyText" class="cq-textarea" placeholder="Type your reply to ${escapeHtml(msg.title)}…" style="min-height:75px;" required></textarea>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          <button type="button" class="cq-btn cq-btn-danger" id="delMsgThreadBtn">Delete Conversation</button>
          <button type="submit" class="cq-btn cq-btn-primary">Send Reply</button>
        </div>
      </form>
    `;

    window.openModal({
      title: 'Message Conversation',
      subtitle: `Thread with ${msg.title}`,
      size: 'cq-modal-lg',
      contentHtml: modalHtml,
      onOpen: (modal, close) => {
        const replyForm = modal.querySelector('#replyMessageForm');
        const delBtn = modal.querySelector('#delMsgThreadBtn');
        const repliesContainer = modal.querySelector('#threadRepliesList');

        if (delBtn) {
          delBtn.addEventListener('click', () => {
            state.messages = state.messages.filter(m => m.id !== msg.id);
            save();
            close();
            window.showToast('Conversation deleted', '🗑️');
          });
        }

        if (replyForm) {
          replyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = modal.querySelector('#replyText').value.trim();
            if (!text) return;

            const user = (window.CQAuth && window.CQAuth.getCurrentUser()) ? window.CQAuth.getCurrentUser().name : 'You';
            msg.replies.push({
              sender: user,
              text: text,
              time: 'Just now'
            });
            save();

            repliesContainer.innerHTML = getRepliesHtml();
            modal.querySelector('#replyText').value = '';

            if (window.cqAudio) window.cqAudio.playSuccess();
            window.showToast('Reply sent!', '✉');
          });
        }
      }
    });
  }

  /* Modal: Notification Detail & Quick Actions */
  function openNotificationDetailModal(notif) {
    let actionBtnHtml = '';
    if (notif.type === 'deadline') {
      actionBtnHtml = `<button type="button" class="cq-btn cq-btn-primary" id="notifActionBtn">Go to Assignments ➔</button>`;
    } else if (notif.type === 'class') {
      actionBtnHtml = `<button type="button" class="cq-btn cq-btn-primary" id="notifActionBtn">Join Live Class ➔</button>`;
    } else {
      actionBtnHtml = `<button type="button" class="cq-btn cq-btn-primary" id="notifActionBtn">View in Dashboard ➔</button>`;
    }

    const modalHtml = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid var(--border-soft);">
        <div style="width:44px; height:44px; border-radius:12px; background:var(--blue-dim); color:var(--blue); display:flex; align-items:center; justify-content:center; font-size:20px;">
          ${iconFor(notif)}
        </div>
        <div>
          <div style="font-size:15px; font-weight:800; color:var(--text-1);">${escapeHtml(notif.title)}</div>
          <div style="font-size:11.5px; color:var(--text-3);">${escapeHtml(notif.time)}</div>
        </div>
      </div>

      <p style="font-size:14px; line-height:1.6; color:var(--text-1); background:var(--bg-card-alt); padding:16px; border-radius:12px; border:1px solid var(--border-soft); margin-bottom:18px;">
        ${escapeHtml(notif.text)}
      </p>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="cq-btn cq-btn-danger" id="notifDelBtn">Dismiss</button>
        <div style="display:flex; gap:8px;">
          <button type="button" class="cq-btn cq-btn-secondary" id="notifCloseBtn">Close</button>
          ${actionBtnHtml}
        </div>
      </div>
    `;

    window.openModal({
      title: 'Notification Details',
      subtitle: `${notif.title} · ${notif.time}`,
      contentHtml: modalHtml,
      onOpen: (modal, close) => {
        const closeBtn = modal.querySelector('#notifCloseBtn');
        const delBtn = modal.querySelector('#notifDelBtn');
        const actionBtn = modal.querySelector('#notifActionBtn');

        if (closeBtn) closeBtn.addEventListener('click', close);

        if (delBtn) {
          delBtn.addEventListener('click', () => {
            state.notifications = state.notifications.filter(n => n.id !== notif.id);
            save();
            close();
            window.showToast('Notification dismissed', '🗑️');
          });
        }

        if (actionBtn) {
          actionBtn.addEventListener('click', () => {
            close();
            if (notif.type === 'deadline') window.location.href = 'assignment.html';
            else if (notif.type === 'class') window.location.href = 'live-class.html';
            else window.location.href = 'home.html';
          });
        }
      }
    });
  }

  /* Modal: Compose New Message */
  function openComposeModal() {
    window.openModal({
      title: 'Compose Message',
      subtitle: 'Send a message to an instructor, student advisor, or study group',
      contentHtml: `
        <form id="composeMsgForm">
          <div class="cq-form-group">
            <label class="cq-label" for="composeRecipient">Recipient</label>
            <select id="composeRecipient" class="cq-select">
              <option value="Prof. Aisha Rahman">Prof. Aisha Rahman (Web Design)</option>
              <option value="Ms. P. Kaur">Ms. P. Kaur (Responsive Design)</option>
              <option value="Mr. R. Verma">Mr. R. Verma (Animation & Multimedia)</option>
              <option value="Study Group · UI/UX">Study Group · UI/UX</option>
              <option value="CampusQueue Support">CampusQueue Support Desk</option>
            </select>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="composeSubject">Subject</label>
            <input type="text" id="composeSubject" class="cq-input" placeholder="e.g. Question regarding Capstone Submission" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="composeBody">Message</label>
            <textarea id="composeBody" class="cq-textarea" placeholder="Write your message here…" required></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
            <button type="submit" class="cq-btn cq-btn-primary">Send Message</button>
          </div>
        </form>
      `,
      onOpen: (modal, close) => {
        const form = modal.querySelector('#composeMsgForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const recipient = modal.querySelector('#composeRecipient').value;
          const subject = modal.querySelector('#composeSubject').value.trim();
          const body = modal.querySelector('#composeBody').value.trim();

          state.messages.unshift({
            id: 'm_' + Date.now(),
            title: recipient,
            text: `${subject}: ${body}`,
            time: 'Just now',
            type: 'msg',
            unread: false,
            replies: []
          });
          save();
          close();
          if (window.cqAudio) window.cqAudio.playSuccess();
          window.showToast(`Message sent to ${recipient}!`, '✉');
        });
      }
    });
  }

  // Filter tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    });
  });

  // Mark all read
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      state[key].forEach(i => i.unread = false);
      save();
      window.showToast('All marked as read', '✓');
    });
  }

  // Clear all notifications
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (state.notifications.length === 0) return;
      window.showConfirmDialog({
        title: 'Clear Notifications',
        message: 'Are you sure you want to clear all notifications?',
        confirmText: 'Clear All',
        onConfirm: () => {
          state.notifications = [];
          save();
          window.showToast('All notifications cleared', '🗑️');
        }
      });
    });
  }

  if (composeBtn) {
    composeBtn.addEventListener('click', openComposeModal);
  }

  window.CQPanels.onChange(render);
  render();
})();
