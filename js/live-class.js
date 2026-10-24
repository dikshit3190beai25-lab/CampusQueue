/* =========================================================
   live-class.js
   Full virtual classroom and live lecture suite:
   - Live Virtual Classroom modal with audio/video controls,
     raise hand, and real-time in-class chat stream
   - Reminder scheduling with system notifications
   - Lecture Replay video player modal
   - Collaborative Whiteboard canvas
   - Host new study room modal
   ========================================================= */

const defaultSessions = [
  { id: 'c1', icon: '🖥', title: 'Introduction to Web Design', instructor: 'Mr. A. Sharma', meta: 'Mr. A. Sharma · Started 15m ago', status: 'live', attendees: 28, hasReminder: false },
  { id: 'c2', icon: '🧩', title: 'UI Prototyping Workshop', instructor: 'Ms. N. Chantika', meta: 'Ms. N. Chantika · Today, 4:00 PM', status: 'upcoming', attendees: 34, hasReminder: false },
  { id: 'c3', icon: '📱', title: 'Responsive Design', instructor: 'Ms. P. Kaur', meta: 'Ms. P. Kaur · Tomorrow, 12:00 PM', status: 'upcoming', attendees: 22, hasReminder: false },
  { id: 'c4', icon: '🎬', title: 'Animation & Multimedia', instructor: 'Mr. R. Verma', meta: 'Mr. R. Verma · Wed, 5:00 PM', status: 'upcoming', attendees: 19, hasReminder: false },
  { id: 'c5', icon: '🗂', title: 'Information Architecture', instructor: 'Mr. S. Gill', meta: 'Mr. S. Gill · Yesterday, 2:00 PM', status: 'ended', attendees: 31, hasReminder: false },
];

function loadSessions() {
  try {
    const raw = localStorage.getItem('cq_live_classes');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultSessions));
}

let sessions = loadSessions();
let activeFilter = 'all';

function saveSessions() {
  localStorage.setItem('cq_live_classes', JSON.stringify(sessions));
}

const statusLabel = { live: 'Live now', upcoming: 'Upcoming', ended: 'Ended' };
const list = document.getElementById('liveList');
const scheduleSessionBtn = document.getElementById('scheduleSessionBtn');
const virtualWhiteboardBtn = document.getElementById('virtualWhiteboardBtn');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  if (!list) return;
  list.innerHTML = '';

  const filtered = sessions.filter(s => {
    if (activeFilter === 'all') return true;
    return s.status === activeFilter;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="card" style="padding:32px; text-align:center; color:var(--text-3); font-size:13px;">No sessions found for this category.</div>`;
    return;
  }

  filtered.forEach(s => {
    const item = document.createElement('div');
    item.className = 'live-item';

    let actionBtn = '';
    if (s.status === 'live') {
      actionBtn = `<button type="button" class="btn-join btn-join-now" style="box-shadow:0 10px 18px -10px rgba(77,107,254,.8);">Join Class ➔</button>`;
    } else if (s.status === 'upcoming') {
      actionBtn = `<button type="button" class="btn-join btn-remind" style="background:${s.hasReminder ? 'var(--teal-dim)' : 'var(--bg-input)'}; color:${s.hasReminder ? 'var(--teal)' : 'var(--text-1)'}; box-shadow:none; border:1px solid ${s.hasReminder ? 'var(--teal)' : 'var(--border)'};">
        ${s.hasReminder ? '✓ Reminder Set' : '🔔 Remind me'}
      </button>`;
    } else {
      actionBtn = `<button type="button" class="btn-join btn-replay" style="background:var(--bg-input); color:var(--text-1); box-shadow:none; border:1px solid var(--border);">
        ▶ Watch Recording
      </button>`;
    }

    item.innerHTML = `
      <div class="live-thumb">${s.icon || '🎥'}</div>
      <div class="live-info">
        <div class="live-title">${escapeHtml(s.title)}</div>
        <div class="live-meta">${escapeHtml(s.meta)} · <strong>${s.attendees || 25} enrolled</strong></div>
      </div>
      <div class="live-actions">
        <span class="status-pill ${s.status}">${s.status === 'live' ? '<span class="dot"></span>' : ''}${statusLabel[s.status]}</span>
        ${actionBtn}
      </div>
    `;

    // Action button clicks
    const joinBtn = item.querySelector('.btn-join-now');
    const remindBtn = item.querySelector('.btn-remind');
    const replayBtn = item.querySelector('.btn-replay');

    if (joinBtn) {
      joinBtn.addEventListener('click', () => openVirtualClassroom(s));
    }
    if (remindBtn) {
      remindBtn.addEventListener('click', () => {
        s.hasReminder = !s.hasReminder;
        saveSessions();
        render();

        if (s.hasReminder) {
          if (window.CQPanels && window.CQPanels.state && window.CQPanels.state.notifications) {
            window.CQPanels.state.notifications.unshift({
              id: 'n_live_' + Date.now(),
              title: `Class Reminder: ${s.title}`,
              text: `${s.title} with ${s.instructor} will begin as scheduled.`,
              time: 'Just now',
              type: 'class',
              unread: true
            });
            window.CQPanels.save();
          }
          if (window.cqAudio) window.cqAudio.playSuccess();
          window.showToast(`Reminder set for ${s.title}!`, '🔔');
        } else {
          window.showToast(`Reminder cancelled`, '✓');
        }
      });
    }
    if (replayBtn) {
      replayBtn.addEventListener('click', () => openReplayModal(s));
    }

    list.appendChild(item);
  });
}

/* Modal: Full Virtual Classroom Simulation */
function openVirtualClassroom(session) {
  let isMuted = false;
  let isVideoOff = false;
  let isHandRaised = false;

  const initialChat = [
    { sender: session.instructor || 'Instructor', text: 'Welcome everyone! Today we are discussing practical architecture and handoffs.' },
    { sender: 'Nessie C.', text: 'Good morning professor! Screen is crystal clear.' },
    { sender: 'Arnav G.', text: 'Will these slides be uploaded to the Sources tab afterwards?' },
    { sender: session.instructor || 'Instructor', text: 'Yes, right after today’s demo.' },
  ];

  const classroomHtml = `
    <div class="classroom-container">
      <div class="classroom-main">
        <div class="classroom-screen">
          <div class="classroom-video-mock">
            <span style="font-size:42px; margin-bottom:8px;">${session.icon || '🖥'}</span>
            <div style="font-size:18px; font-weight:800; color:#fff;">${session.title}</div>
            <div style="font-size:12px; color:rgba(255,255,255,0.7); margin-top:4px;">Presentation Mode · Sharing Screen: "Week 4 System Architecture.pdf"</div>
          </div>
          <div class="classroom-instructor-badge">
            <span class="classroom-live-tag">LIVE</span>
            <span>${session.instructor || 'Instructor'}</span>
          </div>
        </div>

        <div class="classroom-controls">
          <button type="button" class="classroom-btn" id="ctrlMic" title="Toggle Microphone">🎤</button>
          <button type="button" class="classroom-btn" id="ctrlCam" title="Toggle Camera">📹</button>
          <button type="button" class="classroom-btn" id="ctrlHand" title="Raise Hand">✋</button>
          <button type="button" class="classroom-btn" id="ctrlShare" title="Share Screen">🖥</button>
          <button type="button" class="classroom-btn danger" id="ctrlLeave" title="Leave Class" style="margin-left:12px;">📞 Leave</button>
        </div>
      </div>

      <div class="classroom-chat-panel">
        <div class="classroom-chat-header">
          <span>Live Session Chat</span>
          <span style="font-size:11px; color:var(--text-3); font-weight:600;">28 Students</span>
        </div>
        <div class="classroom-chat-messages" id="classroomChatMessages">
          ${initialChat.map(c => `
            <div class="chat-msg">
              <span class="chat-msg-sender">${escapeHtml(c.sender)}</span>
              <span class="chat-msg-text">${escapeHtml(c.text)}</span>
            </div>
          `).join('')}
        </div>
        <form id="classroomChatForm" class="classroom-chat-input-row">
          <input type="text" id="chatInput" placeholder="Message the class…" autocomplete="off" required>
          <button type="submit" class="cq-btn cq-btn-sm cq-btn-primary" style="padding:4px 10px;">Send</button>
        </form>
      </div>
    </div>
  `;

  window.openModal({
    title: `Virtual Classroom — ${session.title}`,
    subtitle: `${session.instructor} · Live Room ST-402`,
    contentHtml: classroomHtml,
    size: 'cq-modal-xl',
    onOpen: (modal, close) => {
      const micBtn = modal.querySelector('#ctrlMic');
      const camBtn = modal.querySelector('#ctrlCam');
      const handBtn = modal.querySelector('#ctrlHand');
      const shareBtn = modal.querySelector('#ctrlShare');
      const leaveBtn = modal.querySelector('#ctrlLeave');
      const chatForm = modal.querySelector('#classroomChatForm');
      const chatInput = modal.querySelector('#chatInput');
      const chatBox = modal.querySelector('#classroomChatMessages');

      if (micBtn) {
        micBtn.addEventListener('click', () => {
          isMuted = !isMuted;
          micBtn.classList.toggle('active', isMuted);
          micBtn.innerHTML = isMuted ? '🔇' : '🎤';
          window.showToast(isMuted ? 'Microphone muted' : 'Microphone unmuted', isMuted ? '🔇' : '🎤');
        });
      }

      if (camBtn) {
        camBtn.addEventListener('click', () => {
          isVideoOff = !isVideoOff;
          camBtn.classList.toggle('active', isVideoOff);
          camBtn.innerHTML = isVideoOff ? '🚫' : '📹';
          window.showToast(isVideoOff ? 'Camera turned off' : 'Camera turned on', '📹');
        });
      }

      if (handBtn) {
        handBtn.addEventListener('click', () => {
          isHandRaised = !isHandRaised;
          handBtn.classList.toggle('active', isHandRaised);
          window.showToast(isHandRaised ? 'Hand raised to speak! ✋' : 'Hand lowered', '✋');
        });
      }

      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          window.showToast('Screen sharing permissions requested', '🖥');
        });
      }

      if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
          close();
          window.showToast('You left the classroom. Attendance logged.', '✓');
        });
      }

      if (chatForm && chatInput && chatBox) {
        chatForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = chatInput.value.trim();
          if (!val) return;

          const currentUser = (window.CQAuth && window.CQAuth.getCurrentUser()) ? window.CQAuth.getCurrentUser().name : 'You';
          const msgEl = document.createElement('div');
          msgEl.className = 'chat-msg';
          msgEl.innerHTML = `
            <span class="chat-msg-sender" style="color:var(--teal);">${escapeHtml(currentUser)} (You)</span>
            <span class="chat-msg-text">${escapeHtml(val)}</span>
          `;
          chatBox.appendChild(msgEl);
          chatBox.scrollTop = chatBox.scrollHeight;
          chatInput.value = '';
          if (window.cqAudio) window.cqAudio.playPop();
        });
      }
    }
  });
}

/* Modal: Lecture Replay */
function openReplayModal(session) {
  window.openModal({
    title: `Lecture Recording: ${session.title}`,
    subtitle: `${session.instructor} · Duration: 58 mins`,
    size: 'cq-modal-lg',
    contentHtml: `
      <div style="background:#000; border-radius:14px; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; color:#fff; position:relative; overflow:hidden; border:1px solid var(--border);">
        <div style="text-align:center; padding:20px;">
          <div style="font-size:38px; margin-bottom:8px;">▶️</div>
          <div style="font-size:16px; font-weight:800;">${escapeHtml(session.title)}</div>
          <div style="font-size:12px; color:rgba(255,255,255,0.7); margin-top:4px;">Archived Class Stream · HD 1080p</div>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:10px;">
        <div style="font-size:12.5px; color:var(--text-2);">
          Recorded: Yesterday · <strong style="color:var(--text-1);">31 classmates attended</strong>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="cq-btn cq-btn-secondary" id="downloadSlidesBtn">📄 Download Slides</button>
          <button type="button" class="cq-btn cq-btn-primary" id="startReplayBtn">▶ Start Playback</button>
        </div>
      </div>
    `,
    onOpen: (modal, close) => {
      const playBtn = modal.querySelector('#startReplayBtn');
      const slidesBtn = modal.querySelector('#downloadSlidesBtn');

      if (playBtn) {
        playBtn.addEventListener('click', () => {
          window.showToast('Streaming recorded lecture video…', '▶');
        });
      }
      if (slidesBtn) {
        slidesBtn.addEventListener('click', () => {
          close();
          window.location.href = 'sources.html';
        });
      }
    }
  });
}

/* Modal: Collaborative Whiteboard Canvas */
function openWhiteboardModal() {
  window.openModal({
    title: 'Collaborative Quick Whiteboard',
    subtitle: 'Freeform sketching, diagrams, and brainstorming canvas',
    size: 'cq-modal-xl',
    contentHtml: `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
        <label style="font-size:12px; font-weight:700;">Brush Color:</label>
        <button type="button" class="color-picker-btn" data-color="#4d6bfe" style="width:24px; height:24px; border-radius:50%; background:#4d6bfe; border:2px solid #fff; cursor:pointer;"></button>
        <button type="button" class="color-picker-btn" data-color="#ff6b7a" style="width:24px; height:24px; border-radius:50%; background:#ff6b7a; border:2px solid transparent; cursor:pointer;"></button>
        <button type="button" class="color-picker-btn" data-color="#2fd4a5" style="width:24px; height:24px; border-radius:50%; background:#2fd4a5; border:2px solid transparent; cursor:pointer;"></button>
        <button type="button" class="color-picker-btn" data-color="#ffffff" style="width:24px; height:24px; border-radius:50%; background:#ffffff; border:2px solid transparent; cursor:pointer;"></button>
        <div style="margin-left:auto; display:flex; gap:8px;">
          <button type="button" class="cq-btn cq-btn-sm cq-btn-secondary" id="wbClearBtn">Clear Board</button>
          <button type="button" class="cq-btn cq-btn-sm cq-btn-primary" id="wbSaveBtn">Save Diagram</button>
        </div>
      </div>
      <canvas id="wbCanvas" width="900" height="480" style="width:100%; height:400px; background:#111116; border-radius:12px; border:1px solid var(--border); cursor:crosshair; display:block;"></canvas>
    `,
    onOpen: (modal) => {
      const canvas = modal.querySelector('#wbCanvas');
      const clearBtn = modal.querySelector('#wbClearBtn');
      const saveBtn = modal.querySelector('#wbSaveBtn');
      const colorBtns = modal.querySelectorAll('.color-picker-btn');

      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4d6bfe';

      let drawing = false;

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        };
      }

      canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      });
      canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      });
      window.addEventListener('mouseup', () => { drawing = false; });

      colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          colorBtns.forEach(b => b.style.borderColor = 'transparent');
          btn.style.borderColor = '#fff';
          ctx.strokeStyle = btn.dataset.color;
        });
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          window.showToast('Whiteboard cleared', '🗑️');
        });
      }

      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          window.showToast('Diagram sketch saved to session notes!', '🎨');
        });
      }
    }
  });
}

/* Modal: Host New Study Room */
function openScheduleRoomModal() {
  window.openModal({
    title: 'Host a Virtual Study Room',
    subtitle: 'Create a live peer meeting or study session for your classmates',
    contentHtml: `
      <form id="hostRoomForm">
        <div class="cq-form-group">
          <label class="cq-label" for="roomTitle">Session Topic</label>
          <input type="text" id="roomTitle" class="cq-input" placeholder="e.g. Design Systems Capstone Sync" required>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="roomHost">Host Name</label>
            <input type="text" id="roomHost" class="cq-input" value="Alex Morgan (You)" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="roomStatus">Session Time</label>
            <select id="roomStatus" class="cq-select">
              <option value="live">Start Now (Instant Room)</option>
              <option value="upcoming">Schedule for Later Today</option>
            </select>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Create Study Room</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#hostRoomForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = modal.querySelector('#roomTitle').value.trim();
        const host = modal.querySelector('#roomHost').value.trim();
        const status = modal.querySelector('#roomStatus').value;

        const newSession = {
          id: 'c_' + Date.now(),
          icon: '👥',
          title,
          instructor: host,
          meta: `${host} · ${status === 'live' ? 'Started just now' : 'Scheduled for today'}`,
          status,
          attendees: 1,
          hasReminder: false
        };

        sessions.unshift(newSession);
        saveSessions();
        render();
        close();
        if (window.cqAudio) window.cqAudio.playSuccess();
        window.showToast('Study Room opened!', '👥');
      });
    }
  });
}

// Filter tabs
document.querySelectorAll('.live-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.live-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

if (scheduleSessionBtn) scheduleSessionBtn.addEventListener('click', openScheduleRoomModal);
if (virtualWhiteboardBtn) virtualWhiteboardBtn.addEventListener('click', openWhiteboardModal);

render();
