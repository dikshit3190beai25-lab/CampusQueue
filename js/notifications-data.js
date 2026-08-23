/* =========================================================
   notifications-data.js
   Single source of truth for notification & message data.
   Loaded BEFORE topbar-panels.js and before notifications.html
   / messages.html's own scripts. Exposes window.CQPanels.
   ========================================================= */
(function () {
  const STORAGE_KEY = 'cq_topbar_panels_v1';

  const defaults = {
    notifications: [
      { id: 'n1', title: 'Assignment due soon', text: 'Build a Simple Website Design is due today at 2 PM.', time: '10m ago', type: 'deadline', unread: true },
      { id: 'n2', title: 'Live class starting',  text: 'UI Prototyping Workshop begins in 30 minutes.',       time: '32m ago', type: 'class',    unread: true },
      { id: 'n3', title: 'Grade posted',          text: 'Your grade for Responsive Design quiz is now available.', time: '2h ago', type: 'default', unread: true },
      { id: 'n4', title: 'New source added',      text: 'A new reading was added to Animation & Multimedia.',  time: '1d ago',  type: 'default', unread: false },
      { id: 'n5', title: 'Calendar reminder',     text: 'Introduction to Web Design moved to 9 AM tomorrow.',  time: '2d ago',  type: 'deadline', unread: false },
    ],
    messages: [
      { id: 'm1', title: 'Prof. Aisha Rahman',  text: 'Please resubmit the wireframe file, the link expired.', time: '5m ago',  type: 'msg', unread: true },
      { id: 'm2', title: 'Study Group · UI/UX', text: 'Can we move tomorrow\u2019s sync to 4 PM instead?',      time: '48m ago', type: 'msg', unread: true },
      { id: 'm3', title: 'Marcus Webb',          text: 'Thanks for sharing your notes from today\u2019s class!', time: '3h ago',  type: 'msg', unread: false },
      { id: 'm4', title: 'CampusQueue Support',  text: 'Your account settings were updated successfully.',      time: '1d ago',  type: 'msg', unread: false },
    ],
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.notifications && saved.messages) return saved;
    } catch (e) { /* ignore bad/absent storage */ }
    return JSON.parse(JSON.stringify(defaults));
  }

  const state = loadState();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(fn => fn(state)); }

  window.CQPanels = {
    state,
    save() { save(); notify(); },
    onChange,
    unreadCount(key) { return state[key].filter(i => i.unread).length; },
  };
})();
