const body = document.body;
let chart; 

// Re-render chart on theme change
window.addEventListener('themechange', () => {
  if (typeof renderChart === 'function') {
    try { renderChart(); } catch (err) { console.warn('Chart error:', err); }
  }
});

const initialTasks = [
  { id: 't_1', label: 'Create LMS Dashboard Design Exploration', done: false },
  { id: 't_2', label: 'Complete Animation and Multimedia’s Video', done: false },
  { id: 't_3', label: 'Read Atomic Habits', done: false },
  { id: 't_4', label: 'LMS Dashboard Design Research', done: false },
  { id: 't_5', label: 'Read User Research Book', done: true },
  { id: 't_6', label: 'Conduct User Research', done: true },
];

function loadTasks(){
  try {
    const raw = localStorage.getItem('cq_tasks');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t, idx) => ({
          id: t.id || 't_' + idx + '_' + Date.now(),
          label: t.label || '',
          done: !!t.done
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse tasks from localStorage', e);
  }
  return [...initialTasks];
}

let tasks = loadTasks();
let editingTaskId = null;

function saveTasks(){
  localStorage.setItem('cq_tasks', JSON.stringify(tasks));
}

const taskList = document.getElementById('taskList');
const assignBadge = document.getElementById('assignBadge');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTasks(){
  if (!taskList) return;
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-empty';
    empty.textContent = 'No tasks yet — add one below!';
    taskList.appendChild(empty);
    if (assignBadge) assignBadge.textContent = 0;
    return;
  }

  tasks.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'task-row' + (t.done ? ' done' : '') + (t.justAdded ? ' task-just-added' : '');
    row.dataset.taskId = t.id;
    if (t.justAdded) {
      delete t.justAdded;
    }

    if (editingTaskId === t.id) {
      // Inline edit mode
      row.innerHTML = `
        <div class="task-edit-form">
          <input type="text" class="task-edit-input" value="${escapeHtml(t.label)}" aria-label="Edit task title">
          <button type="button" class="task-edit-btn-save" title="Save changes">Save</button>
          <button type="button" class="task-edit-btn-cancel" title="Cancel edit">Cancel</button>
        </div>
      `;

      const input = row.querySelector('.task-edit-input');
      const saveBtn = row.querySelector('.task-edit-btn-save');
      const cancelBtn = row.querySelector('.task-edit-btn-cancel');

      const doSave = () => {
        const newVal = input.value.trim();
        if (newVal) {
          t.label = newVal;
          saveTasks();
          if (typeof window.showToast === 'function') window.showToast('Task updated!', '✏️');
        }
        editingTaskId = null;
        renderTasks();
      };

      const doCancel = () => {
        editingTaskId = null;
        renderTasks();
      };

      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        doSave();
      });

      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        doCancel();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSave();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          doCancel();
        }
      });

      setTimeout(() => {
        if (input) {
          input.focus();
          input.select();
        }
      }, 10);
    } else {
      // Normal display mode
      row.innerHTML = `
        <div class="task-check" role="checkbox" aria-checked="${t.done}" title="Mark as ${t.done ? 'pending' : 'completed'}">${t.done ? '✓' : ''}</div>
        <div class="task-label" title="Click to toggle, double-click to edit">${escapeHtml(t.label)}</div>
        <div class="task-actions">
          <button type="button" class="task-btn task-edit-btn" title="Edit task" aria-label="Edit task">✏️</button>
          <button type="button" class="task-btn task-del-btn" title="Delete task" aria-label="Delete task">🗑️</button>
        </div>
      `;

      const checkEl = row.querySelector('.task-check');
      const labelEl = row.querySelector('.task-label');
      const editBtn = row.querySelector('.task-edit-btn');
      const delBtn = row.querySelector('.task-del-btn');

      const toggleDone = () => {
        t.done = !t.done;
        saveTasks();
        renderTasks();
        if (typeof window.showToast === 'function') {
          window.showToast(t.done ? 'Task marked as completed' : 'Task marked active', t.done ? '✓' : '🔄');
        }
      };

      checkEl.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDone();
      });

      labelEl.addEventListener('click', () => {
        toggleDone();
      });

      labelEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        editingTaskId = t.id;
        renderTasks();
      });

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingTaskId = t.id;
        renderTasks();
      });

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const removedLabel = t.label;
        if (editingTaskId === t.id) {
          editingTaskId = null;
        }
        tasks = tasks.filter(item => item.id !== t.id);
        saveTasks();
        renderTasks();
        if (typeof window.showToast === 'function') {
          window.showToast(`Deleted: "${removedLabel.slice(0, 20)}…"`, '🗑️');
        }
      });
    }

    taskList.appendChild(row);
  });

  if (assignBadge) {
    assignBadge.textContent = tasks.filter(t => !t.done).length;
  }
}
renderTasks();

function addTask(){
  const input = document.getElementById('newTaskInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please type a task first!', '⚠️');
    } else {
      alert('Please type a task first!');
    }
    if (input) input.focus();
    return;
  }
  
  const newTask = {
    id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    label: val,
    done: false,
    justAdded: true
  };

  // Prepend to top so it appears above all existing tasks
  tasks.unshift(newTask);
  saveTasks();

  if (input) {
    input.value = '';
    input.focus();
  }

  renderTasks();
  
  const listEl = document.getElementById('taskList');
  if (listEl) {
    listEl.scrollTop = 0;
  }

  if (typeof window.showToast === 'function') {
    window.showToast('Task added to top of your list!', '➕');
  }
}
window.addTask = addTask;

function setupTaskListeners() {
  const btn = document.getElementById('addTaskBtn');
  const inp = document.getElementById('newTaskInput');
  if (btn) {
    btn.onclick = function(e) {
      if (e) e.preventDefault();
      addTask();
    };
  }
  if (inp) {
    inp.onkeydown = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTask();
      }
    };
  }
}

setupTaskListeners();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTaskListeners);
}

function renderChart(){
  const ctx = document.getElementById('gpaChart');
  if (!ctx || typeof Chart === 'undefined') return;
  try {
    const isDark = body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const textColor = isDark ? '#68686f' : '#9a9aa4';
    const lineColor = '#4d6bfe';

    const gradientFill = ctx.getContext('2d').createLinearGradient(0,0,0,150);
    gradientFill.addColorStop(0, 'rgba(77,107,254,.35)');
    gradientFill.addColorStop(1, 'rgba(77,107,254,0)');

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1st','2nd','3rd','4th','5th'],
        datasets: [{
          data: [2.9, 3.6, 2.4, 3.3, 4.0],
          borderColor: lineColor,
          backgroundColor: gradientFill,
          borderWidth: 2.5,
          fill: true,
          tension: .4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: lineColor,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display:false }, tooltip: { intersect:false, mode:'index' } },
        scales: {
          y: { min:1, max:4, ticks:{ color:textColor, font:{size:10.5}, stepSize:1 }, grid:{ color:gridColor } },
          x: { ticks:{ color:textColor, font:{size:10.5} }, grid:{ display:false } }
        }
      }
    });
  } catch(err) {
    console.warn('GPA Chart error:', err);
  }
}
renderChart();

const calGrid = document.getElementById('calGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const calTodayBtn = document.getElementById('calToday');
const calDoneBtn = document.getElementById('calDoneBtn');
const routineDateEl = document.getElementById('routineDate');
const eventDays = [1,6,9,12,17,24,25,28];
let calDate = new Date();
let selectedDate = new Date();

function updateRoutineDate(date = selectedDate){
  if (routineDateEl) {
    routineDateEl.textContent = date.toLocaleDateString('default', { day:'numeric', month:'long', year:'numeric' });
  }
}
updateRoutineDate();

function renderCalendar(){
  if (!calGrid || !calMonthLabel) return;
  calGrid.innerHTML = '';
  const dows = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  dows.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow'; el.textContent = d;
    calGrid.appendChild(el);
  });

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  calMonthLabel.textContent = calDate.toLocaleString('default',{month:'long', year:'numeric'});

  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1;
  if(startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  const totalCells = 42; /* always 6 rows for consistent height */
  for(let i=0; i<totalCells; i++){
    const dayNum = i - startOffset + 1;
    const el = document.createElement('div');
    el.className = 'cal-day';
    let label, cellDate, isCurrentMonth = true;
    if(dayNum < 1){
      label = daysInPrevMonth + dayNum;
      isCurrentMonth = false;
      cellDate = new Date(year, month - 1, label);
    } else if(dayNum > daysInMonth){
      label = dayNum - daysInMonth;
      isCurrentMonth = false;
      cellDate = new Date(year, month + 1, label);
    } else {
      label = dayNum;
      cellDate = new Date(year, month, label);
    }
    el.textContent = label;

    if(!isCurrentMonth) {
      el.classList.add('muted');
    } else {
      if(eventDays.includes(dayNum)) el.classList.add('event');

      // Outline for today's date (like day 7 in reference photo)
      if(year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate()){
        el.classList.add('today');
      }

      // Filled active style for selected date (like day 10 in reference photo)
      if(selectedDate &&
         year === selectedDate.getFullYear() &&
         month === selectedDate.getMonth() &&
         dayNum === selectedDate.getDate()){
        el.classList.add('selected');
      }

      // Clickable date interaction
      el.addEventListener('click', () => {
        selectedDate = new Date(year, month, dayNum);
        updateRoutineDate(selectedDate);
        renderCalendar();
      });
    }

    calGrid.appendChild(el);
  }
}

const prevBtn = document.getElementById('calPrev');
const nextBtn = document.getElementById('calNext');
if(prevBtn) prevBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth()-1); renderCalendar(); });
if(nextBtn) nextBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth()+1); renderCalendar(); });
if(calTodayBtn) calTodayBtn.addEventListener('click', () => {
  calDate = new Date();
  selectedDate = new Date();
  updateRoutineDate(selectedDate);
  renderCalendar();
  if (typeof window.showToast === 'function') window.showToast('Jumped to Today', '📅');
});
if(calDoneBtn) calDoneBtn.addEventListener('click', () => {
  const formatted = selectedDate.toLocaleDateString('default', { month:'short', day:'numeric', year:'numeric' });
  if (typeof window.showToast === 'function') window.showToast(`Selected date: ${formatted}`, '✓');
});
renderCalendar();

// Theme + guest/user topbar state + logout are handled globally in common.js

/* ---------- Upcoming Deadlines ---------- */
const deadlineList = document.getElementById('deadlineList');
const _now = new Date();
const deadlines = [
  { title: 'Build a Simple Website Design', subject: 'Web Design', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 2) },
  { title: 'Animation Storyboard Draft', subject: 'Animation & Multimedia', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 5) },
  { title: 'Responsive Layout Case Study', subject: 'Responsive Design', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 8) },
  { title: 'UI Prototype Handoff', subject: 'UI Prototyping', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 14) },
];

function renderDeadlines(){
  const today = new Date(); today.setHours(0,0,0,0);
  const sorted = [...deadlines].sort((a,b) => a.due - b.due);
  deadlineList.innerHTML = '';
  sorted.forEach(d => {
    const diffDays = Math.round((d.due - today) / 86400000);
    let pillClass = 'later', pillText = `${diffDays}d left`;
    if(diffDays <= 0){ pillClass = 'urgent'; pillText = diffDays === 0 ? 'Due today' : 'Overdue'; }
    else if(diffDays <= 2){ pillClass = 'urgent'; pillText = `${diffDays}d left`; }
    else if(diffDays <= 5){ pillClass = 'soon'; pillText = `${diffDays}d left`; }

    const row = document.createElement('div');
    row.className = 'deadline-item';
    row.innerHTML = `
      <div class="deadline-info">
        <div class="deadline-title">${d.title}</div>
        <div class="deadline-sub">${d.subject} · ${d.due.toLocaleDateString('default',{month:'short', day:'numeric'})}</div>
      </div>
      <div class="deadline-pill ${pillClass}">${pillText}</div>`;
    deadlineList.appendChild(row);
  });
}
renderDeadlines();

/* ---------- Focus Timer (Default + Custom) ---------- */
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

const timerDisplay = document.getElementById('timerDisplay');
const timerMode = document.getElementById('timerMode');
const timerDots = document.getElementById('timerDots');
const timerToggle = document.getElementById('timerToggle');
const timerReset = document.getElementById('timerReset');
const timerSkip = document.getElementById('timerSkip');

const defaultTimerBtn = document.getElementById('defaultTimerBtn');
const customTimerBtn = document.getElementById('customTimerBtn');
const timerCustomConfig = document.getElementById('timerCustomConfig');
const customFocusInput = document.getElementById('customFocusInput');
const customBreakInput = document.getElementById('customBreakInput');
const applyCustomBtn = document.getElementById('applyCustomBtn');

let currentModeType = localStorage.getItem('cq_timer_type') || 'default'; // 'default' or 'custom'
let customFocusMinutes = Number(localStorage.getItem('cq_custom_focus')) || 25;
let customBreakMinutes = Number(localStorage.getItem('cq_custom_break')) || 5;

function getFocusSeconds() {
  return (currentModeType === 'custom' ? customFocusMinutes : DEFAULT_FOCUS_MINUTES) * 60;
}

function getBreakSeconds() {
  return (currentModeType === 'custom' ? customBreakMinutes : DEFAULT_BREAK_MINUTES) * 60;
}

let isBreak = false;
let timerSecondsLeft = getFocusSeconds();
let timerInterval = null;
let sessionsCompleted = Number(localStorage.getItem('cq_sessions') || 0);

function formatTime(s){
  const m = Math.floor(s / 60).toString().padStart(2,'0');
  const sec = (s % 60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}
function renderDots(){
  if(!timerDots) return;
  timerDots.innerHTML = '';
  for(let i=0; i<4; i++){
    const dot = document.createElement('span');
    if(i < sessionsCompleted % 4) dot.classList.add('filled');
    timerDots.appendChild(dot);
  }
}
function renderTimer(){
  if(timerDisplay) timerDisplay.textContent = formatTime(timerSecondsLeft);
  if(timerMode) timerMode.textContent = isBreak ? 'Break' : 'Focus';
  renderDots();
}
function tick(){
  timerSecondsLeft--;
  if(timerSecondsLeft <= 0){
    if(!isBreak){
      sessionsCompleted++;
      localStorage.setItem('cq_sessions', sessionsCompleted);
    }
    isBreak = !isBreak;
    timerSecondsLeft = isBreak ? getBreakSeconds() : getFocusSeconds();
  }
  renderTimer();
}
function startTimer(){
  if(timerInterval) return;
  timerInterval = setInterval(tick, 1000);
  if(timerToggle) timerToggle.textContent = 'Pause';
}
function pauseTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
  if(timerToggle) timerToggle.textContent = 'Start';
}

function setTimerMode(mode){
  currentModeType = mode;
  localStorage.setItem('cq_timer_type', mode);
  pauseTimer();
  isBreak = false;

  if(mode === 'custom'){
    if(customTimerBtn) customTimerBtn.classList.add('active');
    if(defaultTimerBtn) defaultTimerBtn.classList.remove('active');
    if(timerCustomConfig) timerCustomConfig.style.display = 'flex';
    if(customFocusInput) customFocusInput.value = customFocusMinutes;
    if(customBreakInput) customBreakInput.value = customBreakMinutes;
    timerSecondsLeft = getFocusSeconds();
  } else {
    if(defaultTimerBtn) defaultTimerBtn.classList.add('active');
    if(customTimerBtn) customTimerBtn.classList.remove('active');
    if(timerCustomConfig) timerCustomConfig.style.display = 'none';
    timerSecondsLeft = DEFAULT_FOCUS_MINUTES * 60;
  }
  renderTimer();
}

function applyCustomTime(){
  let focusVal = parseInt(customFocusInput.value, 10);
  let breakVal = parseInt(customBreakInput.value, 10);

  if(isNaN(focusVal) || focusVal < 1) focusVal = 1;
  if(focusVal > 180) focusVal = 180;
  if(isNaN(breakVal) || breakVal < 1) breakVal = 1;
  if(breakVal > 60) breakVal = 60;

  customFocusMinutes = focusVal;
  customBreakMinutes = breakVal;
  customFocusInput.value = focusVal;
  customBreakInput.value = breakVal;

  localStorage.setItem('cq_custom_focus', customFocusMinutes);
  localStorage.setItem('cq_custom_break', customBreakMinutes);

  pauseTimer();
  isBreak = false;
  timerSecondsLeft = getFocusSeconds();
  renderTimer();
}

if(defaultTimerBtn) {
  defaultTimerBtn.addEventListener('click', () => setTimerMode('default'));
}
if(customTimerBtn) {
  customTimerBtn.addEventListener('click', () => setTimerMode('custom'));
}
if(applyCustomBtn) {
  applyCustomBtn.addEventListener('click', applyCustomTime);
}
if(customFocusInput) {
  customFocusInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') applyCustomTime();
  });
}
if(customBreakInput) {
  customBreakInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') applyCustomTime();
  });
}

if(timerToggle) {
  timerToggle.addEventListener('click', () => {
    if(timerInterval) pauseTimer(); else startTimer();
  });
}
if(timerReset) {
  timerReset.addEventListener('click', () => {
    pauseTimer();
    isBreak = false;
    timerSecondsLeft = getFocusSeconds();
    renderTimer();
  });
}
if(timerSkip) {
  timerSkip.addEventListener('click', () => {
    pauseTimer();
    if(!isBreak){ sessionsCompleted++; localStorage.setItem('cq_sessions', sessionsCompleted); }
    isBreak = !isBreak;
    timerSecondsLeft = isBreak ? getBreakSeconds() : getFocusSeconds();
    renderTimer();
  });
}

// Initial setup from saved state
if(currentModeType === 'custom'){
  setTimerMode('custom');
} else {
  setTimerMode('default');
}

/* ---------- Quick Notes ---------- */
const notesArea = document.getElementById('notesArea');
const notesStatus = document.getElementById('notesStatus');
if (notesArea) {
  notesArea.value = localStorage.getItem('cq_notes') || '';
  let notesSaveTimeout = null;
  notesArea.addEventListener('input', () => {
    if (notesStatus) notesStatus.textContent = 'Saving…';
    clearTimeout(notesSaveTimeout);
    notesSaveTimeout = setTimeout(() => {
      localStorage.setItem('cq_notes', notesArea.value);
      if (notesStatus) notesStatus.textContent = 'Saved';
    }, 500);
  });
}
