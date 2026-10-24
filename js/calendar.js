/* =========================================================
   calendar.js
   Full interactive calendar suite:
   - Dynamic monthly grid & date navigation
   - LocalStorage event persistence & CRUD
   - Filtering by event category (All, Deadlines, Classes, Events)
   - iCalendar (.ics) schedule export
   - Day selection agenda filter
   ========================================================= */

const defaultEvents = [
  { id: 'ev_1', day: 1, title: 'Semester check-in & Orientation', type: 'later', time: '10:00 AM', location: 'Hall A' },
  { id: 'ev_2', day: 6, title: 'Intro to Web Design class', type: 'soon', time: '8:00 AM', location: 'Room 204' },
  { id: 'ev_3', day: 9, title: 'Responsive Design class', type: 'soon', time: '12:00 PM', location: 'Lab 3' },
  { id: 'ev_4', day: 10, title: 'Build a Simple Website Design due', type: 'urgent', time: '2:00 PM', location: 'CampusQueue Portal' },
  { id: 'ev_5', day: 12, title: 'UI Prototyping Workshop', type: 'soon', time: '4:00 PM', location: 'Studio 1' },
  { id: 'ev_6', day: 13, title: 'Animation Storyboard Draft due', type: 'urgent', time: '11:59 PM', location: 'Portal' },
  { id: 'ev_7', day: 17, title: 'Guest lecture: UX Research Insights', type: 'later', time: '3:00 PM', location: 'Auditorium' },
  { id: 'ev_8', day: 18, title: 'Responsive Layout Case Study due', type: 'urgent', time: '5:00 PM', location: 'Portal' },
  { id: 'ev_9', day: 24, title: 'Midterm review session', type: 'later', time: '2:00 PM', location: 'Room 102' },
  { id: 'ev_10', day: 25, title: 'UI Prototype Handoff due', type: 'urgent', time: '2:00 PM', location: 'Portal' },
  { id: 'ev_11', day: 28, title: 'Study group: Animation & Multimedia', type: 'later', time: '6:00 PM', location: 'Library 2F' },
];

function loadEvents() {
  try {
    const raw = localStorage.getItem('cq_calendar_events');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not parse calendar events', e);
  }
  return JSON.parse(JSON.stringify(defaultEvents));
}

let events = loadEvents();
let calDate = new Date();
let selectedDate = new Date();
let activeCategoryFilter = 'all';
let isDayFilterActive = false;

function saveEvents() {
  localStorage.setItem('cq_calendar_events', JSON.stringify(events));
}

const calGrid = document.getElementById('calGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const calTodayBtn = document.getElementById('calToday');
const calDoneBtn = document.getElementById('calDoneBtn');
const eventsPanel = document.getElementById('eventsPanel');
const eventsPanelTitle = document.getElementById('eventsPanelTitle');
const showAllEventsBtn = document.getElementById('showAllEventsBtn');
const addCalendarEventBtn = document.getElementById('addCalendarEventBtn');
const exportCalendarBtn = document.getElementById('exportCalendarBtn');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderCalendar() {
  if (!calGrid || !calMonthLabel) return;
  calGrid.innerHTML = '';
  const dows = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  dows.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  calMonthLabel.textContent = calDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  // Create set of event days for this month
  const currentEventDays = new Set(events.map(e => Number(e.day)));

  const totalCells = 42;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    const el = document.createElement('div');
    el.className = 'cal-day';
    let label, isCurrentMonth = true;

    if (dayNum < 1) {
      label = daysInPrevMonth + dayNum;
      isCurrentMonth = false;
    } else if (dayNum > daysInMonth) {
      label = dayNum - daysInMonth;
      isCurrentMonth = false;
    } else {
      label = dayNum;
    }
    el.textContent = label;

    if (!isCurrentMonth) {
      el.classList.add('muted');
    } else {
      if (currentEventDays.has(dayNum)) el.classList.add('event');

      if (year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate()) {
        el.classList.add('today');
      }

      if (selectedDate &&
        year === selectedDate.getFullYear() &&
        month === selectedDate.getMonth() &&
        dayNum === selectedDate.getDate()) {
        el.classList.add('selected');
      }

      el.addEventListener('click', () => {
        selectedDate = new Date(year, month, dayNum);
        isDayFilterActive = true;
        renderCalendar();
        renderEventsPanel();
        if (window.cqAudio) window.cqAudio.playPop();
      });
    }

    calGrid.appendChild(el);
  }

  renderEventsPanel();
}

function renderEventsPanel() {
  if (!eventsPanel) return;
  eventsPanel.innerHTML = '';

  let list = [...events].sort((a, b) => Number(a.day) - Number(b.day));

  if (isDayFilterActive && selectedDate) {
    const targetDay = selectedDate.getDate();
    list = list.filter(e => Number(e.day) === targetDay);
    if (eventsPanelTitle) {
      eventsPanelTitle.textContent = `Events for ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
    }
    if (showAllEventsBtn) showAllEventsBtn.style.display = 'inline-flex';
  } else {
    if (eventsPanelTitle) {
      eventsPanelTitle.textContent = 'Upcoming Events';
    }
    if (showAllEventsBtn) showAllEventsBtn.style.display = 'none';
  }

  if (activeCategoryFilter !== 'all') {
    list = list.filter(e => e.type === activeCategoryFilter);
  }

  if (list.length === 0) {
    eventsPanel.innerHTML = `
      <div style="padding:28px 12px; text-align:center; color:var(--text-3); font-size:13px;">
        <span style="font-size:24px; display:block; margin-bottom:6px;">📅</span>
        No events found for this selection.
        <div style="margin-top:10px;">
          <button type="button" class="cq-btn cq-btn-sm cq-btn-secondary" id="emptyAddEventBtn">+ Add Event</button>
        </div>
      </div>
    `;
    const btn = eventsPanel.querySelector('#emptyAddEventBtn');
    if (btn) btn.addEventListener('click', openAddEventModal);
    return;
  }

  list.forEach(ev => {
    const isSelected = selectedDate && Number(ev.day) === selectedDate.getDate() && calDate.getMonth() === selectedDate.getMonth();
    const row = document.createElement('div');
    row.className = 'deadline-item' + (isSelected ? ' active-event' : '');
    row.style.cursor = 'pointer';

    const pillLabel = ev.type === 'urgent' ? 'Due' : (ev.type === 'soon' ? 'Class' : 'Event');

    row.innerHTML = `
      <div class="deadline-info">
        <div class="deadline-title">${escapeHtml(ev.title)}</div>
        <div class="deadline-sub">${calDate.toLocaleString('default', { month: 'short' })} ${ev.day} · ${escapeHtml(ev.time || 'All Day')} ${ev.location ? '· ' + escapeHtml(ev.location) : ''}</div>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <div class="deadline-pill ${ev.type}">${pillLabel}</div>
        <button type="button" class="task-btn cal-item-del" title="Delete event">🗑️</button>
      </div>
    `;

    // Row click opens event modal
    row.addEventListener('click', (e) => {
      if (e.target.closest('.cal-item-del')) return;
      openEventDetailModal(ev);
    });

    // Delete event
    const delBtn = row.querySelector('.cal-item-del');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.showConfirmDialog({
        title: 'Delete Event',
        message: `Remove "${ev.title}" from your calendar?`,
        confirmText: 'Delete',
        onConfirm: () => {
          events = events.filter(item => item.id !== ev.id);
          saveEvents();
          renderCalendar();
          window.showToast('Event removed', '🗑️');
        }
      });
    });

    eventsPanel.appendChild(row);
  });
}

function openEventDetailModal(ev) {
  window.openModal({
    title: ev.title,
    subtitle: `${calDate.toLocaleString('default', { month: 'long' })} ${ev.day}, ${calDate.getFullYear()} · ${ev.time || 'Scheduled'}`,
    contentHtml: `
      <div style="display:flex; flex-direction:column; gap:12px; font-size:13.5px; line-height:1.5;">
        <div style="background:var(--bg-input); padding:12px; border-radius:10px; border:1px solid var(--border-soft);">
          <div><strong>Location / Room:</strong> ${escapeHtml(ev.location || 'Online Campus Portal')}</div>
          <div style="margin-top:4px;"><strong>Category:</strong> ${ev.type === 'urgent' ? 'Assignment Deadline' : (ev.type === 'soon' ? 'Class / Lecture' : 'Academic Event')}</div>
        </div>
        <div style="display:flex; justify-content:space-between; gap:10px; margin-top:10px;">
          <button type="button" class="cq-btn cq-btn-danger" id="modalDelEventBtn">Delete Event</button>
          <div style="display:flex; gap:8px;">
            <button type="button" class="cq-btn cq-btn-secondary" id="modalEditEventBtn">Edit Details</button>
            <button type="button" class="cq-btn cq-btn-primary" id="modalCloseDetailBtn">Done</button>
          </div>
        </div>
      </div>
    `,
    onOpen: (modal, close) => {
      const delBtn = modal.querySelector('#modalDelEventBtn');
      const editBtn = modal.querySelector('#modalEditEventBtn');
      const doneBtn = modal.querySelector('#modalCloseDetailBtn');

      if (doneBtn) doneBtn.addEventListener('click', close);
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          events = events.filter(item => item.id !== ev.id);
          saveEvents();
          renderCalendar();
          close();
          window.showToast('Event deleted', '🗑️');
        });
      }
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          close();
          openEditEventModal(ev);
        });
      }
    }
  });
}

function openAddEventModal() {
  const defaultDay = selectedDate ? selectedDate.getDate() : 15;

  window.openModal({
    title: 'Schedule Calendar Event',
    subtitle: 'Add an academic deadline, live class, or study session',
    contentHtml: `
      <form id="calNewEventForm">
        <div class="cq-form-group">
          <label class="cq-label" for="newEventTitle">Event Title</label>
          <input type="text" id="newEventTitle" class="cq-input" placeholder="e.g. Interaction Design Workshop" required>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="newEventDay">Day of Month</label>
            <input type="number" id="newEventDay" class="cq-input" min="1" max="31" value="${defaultDay}" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="newEventTime">Time</label>
            <input type="text" id="newEventTime" class="cq-input" placeholder="e.g. 2:00 PM" required>
          </div>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="newEventType">Category</label>
            <select id="newEventType" class="cq-select">
              <option value="urgent">Assignment Deadline (Due)</option>
              <option value="soon" selected>Class / Workshop</option>
              <option value="later">Exam / Campus Event</option>
            </select>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="newEventLocation">Location / Room</label>
            <input type="text" id="newEventLocation" class="cq-input" placeholder="e.g. Room 304 or Zoom">
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Add Event</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#calNewEventForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = modal.querySelector('#newEventTitle').value.trim();
        const day = parseInt(modal.querySelector('#newEventDay').value, 10);
        const time = modal.querySelector('#newEventTime').value.trim();
        const type = modal.querySelector('#newEventType').value;
        const location = modal.querySelector('#newEventLocation').value.trim();

        events.push({
          id: 'ev_' + Date.now(),
          title,
          day,
          time,
          type,
          location
        });

        saveEvents();
        renderCalendar();
        close();
        if (window.cqAudio) window.cqAudio.playPop();
        window.showToast('Event scheduled on calendar!', '📅');
      });
    }
  });
}

function openEditEventModal(ev) {
  window.openModal({
    title: 'Edit Event',
    subtitle: `Update details for "${ev.title}"`,
    contentHtml: `
      <form id="calEditEventForm">
        <div class="cq-form-group">
          <label class="cq-label" for="editEventTitle">Event Title</label>
          <input type="text" id="editEventTitle" class="cq-input" value="${escapeHtml(ev.title)}" required>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="editEventDay">Day of Month</label>
            <input type="number" id="editEventDay" class="cq-input" min="1" max="31" value="${ev.day}" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="editEventTime">Time</label>
            <input type="text" id="editEventTime" class="cq-input" value="${escapeHtml(ev.time || '')}" required>
          </div>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="editEventType">Category</label>
            <select id="editEventType" class="cq-select">
              <option value="urgent" ${ev.type === 'urgent' ? 'selected' : ''}>Assignment Deadline (Due)</option>
              <option value="soon" ${ev.type === 'soon' ? 'selected' : ''}>Class / Workshop</option>
              <option value="later" ${ev.type === 'later' ? 'selected' : ''}>Exam / Campus Event</option>
            </select>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="editEventLocation">Location / Room</label>
            <input type="text" id="editEventLocation" class="cq-input" value="${escapeHtml(ev.location || '')}">
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Save Changes</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#calEditEventForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        ev.title = modal.querySelector('#editEventTitle').value.trim();
        ev.day = parseInt(modal.querySelector('#editEventDay').value, 10);
        ev.time = modal.querySelector('#editEventTime').value.trim();
        ev.type = modal.querySelector('#editEventType').value;
        ev.location = modal.querySelector('#editEventLocation').value.trim();

        saveEvents();
        renderCalendar();
        close();
        window.showToast('Event updated', '✏️');
      });
    }
  });
}

// Generate & Download standard .ics calendar file
function exportICalendar() {
  const year = calDate.getFullYear();
  const month = String(calDate.getMonth() + 1).padStart(2, '0');

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusQueue//Student Task Management System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CampusQueue Academic Schedule',
  ];

  events.forEach(ev => {
    const dayStr = String(ev.day).padStart(2, '0');
    const dtstart = `${year}${month}${dayStr}T090000Z`;
    const dtend = `${year}${month}${dayStr}T103000Z`;
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${ev.id || Date.now()}@campusqueue.app`,
      `DTSTAMP:${dtstart}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${ev.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:CampusQueue academic scheduled activity.`,
      `LOCATION:${(ev.location || 'Campus').replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CampusQueue_Schedule_${calDate.toLocaleString('default', { month: 'short' })}_${year}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.showToast('Calendar schedule exported (.ics)!', '📅');
}

// Controls wiring
const prevBtn = document.getElementById('calPrev');
const nextBtn = document.getElementById('calNext');
if (prevBtn) prevBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
if (nextBtn) nextBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });

if (calTodayBtn) {
  calTodayBtn.addEventListener('click', () => {
    calDate = new Date();
    selectedDate = new Date();
    isDayFilterActive = false;
    renderCalendar();
    window.showToast('Jumped to Today', '📅');
  });
}
if (calDoneBtn) {
  calDoneBtn.addEventListener('click', () => {
    const formatted = selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    window.showToast(`Selected date: ${formatted}`, '✓');
  });
}

if (showAllEventsBtn) {
  showAllEventsBtn.addEventListener('click', () => {
    isDayFilterActive = false;
    renderCalendar();
  });
}

// Category filter tabs
document.querySelectorAll('.cal-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cal-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategoryFilter = btn.dataset.calFilter;
    renderEventsPanel();
  });
});

if (addCalendarEventBtn) {
  addCalendarEventBtn.addEventListener('click', openAddEventModal);
}
if (exportCalendarBtn) {
  exportCalendarBtn.addEventListener('click', exportICalendar);
}

renderCalendar();
