const body = document.body;
let chart;

// Re-render chart on theme change
window.addEventListener('themechange', () => {
  if (typeof renderChart === 'function') {
    try { renderChart(); } catch (err) { console.warn('Chart error:', err); }
  }
});

/* =========================================================
   1. Tasks Management with Filters, Counts & Sound Effects
   ========================================================= */
const initialTasks = [
  { id: 't_1', label: 'Create LMS Dashboard Design Exploration', done: false },
  { id: 't_2', label: 'Complete Animation and Multimedia’s Video', done: false },
  { id: 't_3', label: 'Read Atomic Habits', done: false },
  { id: 't_4', label: 'LMS Dashboard Design Research', done: false },
  { id: 't_5', label: 'Read User Research Book', done: true },
  { id: 't_6', label: 'Conduct User Research', done: true },
];

function loadTasks() {
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
let currentTaskFilter = 'all'; // 'all' | 'pending' | 'done'

function saveTasks() {
  localStorage.setItem('cq_tasks', JSON.stringify(tasks));
  if (typeof window.updateGlobalBadges === 'function') {
    window.updateGlobalBadges();
  }
}

const taskList = document.getElementById('taskList');
const assignBadge = document.getElementById('assignBadge');
const taskCountPill = document.getElementById('taskCountPill');
const clearCompletedBtn = document.getElementById('clearCompletedTasksBtn');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateTaskCounts() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  if (taskCountPill) {
    taskCountPill.textContent = `${done}/${total} done`;
  }
  if (assignBadge) {
    assignBadge.textContent = total - done;
  }
}

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = '';

  const filtered = tasks.filter(t => {
    if (currentTaskFilter === 'pending') return !t.done;
    if (currentTaskFilter === 'done') return t.done;
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-empty';
    empty.textContent = currentTaskFilter === 'done' ? 'No completed tasks yet.' : (currentTaskFilter === 'pending' ? 'All caught up on tasks!' : 'No tasks yet — add one below!');
    taskList.appendChild(empty);
    updateTaskCounts();
    return;
  }

  filtered.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'task-row' + (t.done ? ' done' : '') + (t.justAdded ? ' task-just-added' : '');
    row.dataset.taskId = t.id;
    if (t.justAdded) delete t.justAdded;

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
        if (t.done && window.cqAudio) {
          window.cqAudio.playSuccess();
        }
        if (typeof window.showToast === 'function') {
          window.showToast(t.done ? 'Task marked complete!' : 'Task active', t.done ? '✓' : '🔄');
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
        if (editingTaskId === t.id) editingTaskId = null;
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

  updateTaskCounts();
}

function addTask() {
  const input = document.getElementById('newTaskInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    if (typeof window.showToast === 'function') {
      window.showToast('Please type a task first!', '⚠️');
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

  tasks.unshift(newTask);
  saveTasks();

  if (input) {
    input.value = '';
    input.focus();
  }

  renderTasks();
  if (taskList) taskList.scrollTop = 0;

  if (window.cqAudio) window.cqAudio.playPop();
  if (typeof window.showToast === 'function') {
    window.showToast('Task added to your list!', '➕');
  }
}
window.addTask = addTask;

// Filter buttons
document.querySelectorAll('.task-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.task-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTaskFilter = btn.dataset.taskFilter;
    renderTasks();
  });
});

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener('click', () => {
    const doneCount = tasks.filter(t => t.done).length;
    if (doneCount === 0) {
      window.showToast('No completed tasks to clear', 'ℹ️');
      return;
    }
    window.showConfirmDialog({
      title: 'Clear Completed Tasks',
      message: `Are you sure you want to remove all ${doneCount} completed tasks?`,
      confirmText: 'Clear All',
      onConfirm: () => {
        tasks = tasks.filter(t => !t.done);
        saveTasks();
        renderTasks();
        window.showToast(`Cleared ${doneCount} tasks!`, '🗑️');
      }
    });
  });
}

const addTaskBtn = document.getElementById('addTaskBtn');
const newTaskInput = document.getElementById('newTaskInput');
if (addTaskBtn) {
  addTaskBtn.onclick = (e) => {
    if (e) e.preventDefault();
    addTask();
  };
}
if (newTaskInput) {
  newTaskInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  };
}
renderTasks();


/* =========================================================
   2. GPA Chart & GPA Calculator Modal
   ========================================================= */
const gpaHistories = [
  { term: '1st Semester', gpa: 2.9, credits: 18 },
  { term: '2nd Semester', gpa: 3.6, credits: 20 },
  { term: '3rd Semester', gpa: 2.4, credits: 18 },
  { term: '4th Semester', gpa: 3.3, credits: 22 },
  { term: '5th Semester', gpa: 4.0, credits: 20 },
];

function renderChart() {
  const ctx = document.getElementById('gpaChart');
  if (!ctx || typeof Chart === 'undefined') return;
  try {
    const isDark = body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const textColor = isDark ? '#68686f' : '#9a9aa4';
    const lineColor = '#4d6bfe';

    const gradientFill = ctx.getContext('2d').createLinearGradient(0, 0, 0, 150);
    gradientFill.addColorStop(0, 'rgba(77,107,254,.35)');
    gradientFill.addColorStop(1, 'rgba(77,107,254,0)');

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1st', '2nd', '3rd', '4th', '5th'],
        datasets: [{
          data: gpaHistories.map(h => h.gpa),
          borderColor: lineColor,
          backgroundColor: gradientFill,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: lineColor,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            intersect: false,
            mode: 'index',
            callbacks: {
              label: (item) => ` GPA: ${item.raw.toFixed(2)}`
            }
          }
        },
        scales: {
          y: { min: 1, max: 4, ticks: { color: textColor, font: { size: 10.5 }, stepSize: 1 }, grid: { color: gridColor } },
          x: { ticks: { color: textColor, font: { size: 10.5 } }, grid: { display: false } }
        }
      }
    });
  } catch (err) {
    console.warn('GPA Chart error:', err);
  }
}
renderChart();

const gpaBreakdownBtn = document.getElementById('gpaBreakdownBtn');
if (gpaBreakdownBtn) {
  gpaBreakdownBtn.addEventListener('click', () => {
    const currentCourses = [
      { name: 'Introduction to Web Design', code: 'CS-201', credits: 4, grade: 'A', points: 4.0 },
      { name: 'Responsive Design', code: 'CS-204', credits: 4, grade: 'A', points: 4.0 },
      { name: 'Animation & Multimedia', code: 'CS-208', credits: 3, grade: 'A-', points: 3.7 },
      { name: 'UI Prototyping Workshop', code: 'CS-210', credits: 4, grade: 'A', points: 4.0 },
      { name: 'Information Architecture', code: 'CS-215', credits: 3, grade: 'A', points: 4.0 },
      { name: 'Data Visualization Basics', code: 'CS-218', credits: 2, grade: 'B+', points: 3.3 },
    ];

    const modalHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border-soft);">
        <div>
          <div style="font-size:12px; color:var(--text-2); text-transform:uppercase; font-weight:700;">Current Standing</div>
          <div style="font-size:26px; font-weight:800; color:var(--blue);" id="modalGpaDisplay">GP 4.00</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px; color:var(--text-2); font-weight:600;">Total Earned Credits</div>
          <div style="font-size:16px; font-weight:800; color:var(--text-1);">98 / 120 hrs</div>
        </div>
      </div>

      <div style="font-size:13px; font-weight:800; margin-bottom:10px;">Semester-by-Semester GPA Trajectory</div>
      <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; margin-bottom:20px;">
        ${gpaHistories.map(h => `
          <div style="background:var(--bg-input); border:1px solid var(--border-soft); border-radius:10px; padding:10px 8px; text-align:center;">
            <div style="font-size:10.5px; color:var(--text-3); font-weight:600;">${h.term.replace(' Semester','')}</div>
            <div style="font-size:16px; font-weight:800; color:var(--text-1); margin:4px 0;">${h.gpa.toFixed(1)}</div>
            <div style="font-size:10px; color:var(--text-2);">${h.credits} cr</div>
          </div>
        `).join('')}
      </div>

      <div style="font-size:13px; font-weight:800; margin-bottom:10px;">Enrolled Courses & Current Grades</div>
      <div style="max-height:180px; overflow-y:auto; border:1px solid var(--border-soft); border-radius:12px; margin-bottom:18px;">
        <table style="width:100%; border-collapse:collapse; font-size:12.5px; text-align:left;">
          <thead style="background:var(--bg-card-alt); font-size:11px; text-transform:uppercase; color:var(--text-3); border-bottom:1px solid var(--border-soft);">
            <tr>
              <th style="padding:8px 12px;">Course</th>
              <th style="padding:8px 12px;">Code</th>
              <th style="padding:8px 12px; text-align:center;">Credits</th>
              <th style="padding:8px 12px; text-align:right;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${currentCourses.map(c => `
              <tr style="border-bottom:1px solid var(--border-soft);">
                <td style="padding:8px 12px; font-weight:600;">${c.name}</td>
                <td style="padding:8px 12px; color:var(--text-3); font-family:var(--mono);">${c.code}</td>
                <td style="padding:8px 12px; text-align:center;">${c.credits}</td>
                <td style="padding:8px 12px; text-align:right; font-weight:800; color:var(--teal);">${c.grade}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="background:var(--bg-card-alt); border-radius:12px; padding:14px; border:1px solid var(--border-soft);">
        <div style="font-size:12.5px; font-weight:800; margin-bottom:8px;">💡 GPA Simulator (Target Next Term)</div>
        <div style="display:flex; gap:10px; align-items:center;">
          <select id="simGradeSelect" class="cq-select" style="flex:1;">
            <option value="4.0">Target Grade: A (4.00)</option>
            <option value="3.7">Target Grade: A- (3.70)</option>
            <option value="3.3">Target Grade: B+ (3.30)</option>
            <option value="3.0">Target Grade: B (3.00)</option>
          </select>
          <button type="button" class="cq-btn cq-btn-primary" id="simCalculateBtn">Simulate</button>
        </div>
      </div>
    `;

    window.openModal({
      title: 'Academic Performance & GPA Details',
      subtitle: 'Complete transcript overview and interactive simulator',
      contentHtml: modalHtml,
      onOpen: (modal) => {
        const simBtn = modal.querySelector('#simCalculateBtn');
        const simSelect = modal.querySelector('#simGradeSelect');
        const display = modal.querySelector('#modalGpaDisplay');

        if (simBtn && simSelect && display) {
          simBtn.addEventListener('click', () => {
            const target = parseFloat(simSelect.value);
            const projected = ((4.0 * 98 + target * 20) / 118).toFixed(2);
            display.textContent = `GP ${projected}`;
            window.showToast(`Simulated Cumulative GPA: ${projected}`, '📈');
          });
        }
      }
    });
  });
}


/* =========================================================
   3. Routine Management & Date Sync
   ========================================================= */
const defaultRoutines = [
  { id: 'r1', tag: 'Class', time: '8 AM – 10 AM', title: 'Introduction to Web Design', color: '' },
  { id: 'r2', tag: 'Class', time: '12 AM – 2 PM', title: 'Responsive Design', color: 'pink' },
  { id: 'r3', tag: 'Assignment', time: 'Deadline: 2 PM', title: 'Build a Simple Website Design', color: 'amber' },
  { id: 'r4', tag: 'Class', time: '4 PM – 6 PM', title: 'UI Prototyping Workshop', color: 'teal' },
];

function loadRoutine() {
  try {
    const raw = localStorage.getItem('cq_routine');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [...defaultRoutines];
}

let routines = loadRoutine();

function saveRoutine() {
  localStorage.setItem('cq_routine', JSON.stringify(routines));
}

const routineListEl = document.getElementById('routineList');
const routineDateEl = document.getElementById('routineDate');

function renderRoutine() {
  if (!routineListEl) return;
  routineListEl.innerHTML = '';

  if (routines.length === 0) {
    routineListEl.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-3); font-size:13px;">No routine blocks for this date. Click "+ Add Block" to plan your day.</div>';
    return;
  }

  routines.forEach(item => {
    const row = document.createElement('div');
    row.className = `r-item ${item.color || ''}`;
    row.style.cursor = 'pointer';
    row.title = 'Click to view block options';
    row.innerHTML = `
      <div class="r-tag">${escapeHtml(item.tag)}</div>
      <div class="r-time">${escapeHtml(item.time)}</div>
      <div class="r-title">${escapeHtml(item.title)}</div>
    `;

    row.addEventListener('click', () => {
      window.openModal({
        title: item.title,
        subtitle: `${item.tag} · ${item.time}`,
        contentHtml: `
          <div style="font-size:13.5px; line-height:1.6; color:var(--text-1); margin-bottom:16px;">
            This scheduled block is part of your daily academic routine.
          </div>
          <div style="display:flex; justify-content:space-between; gap:10px;">
            <button type="button" class="cq-btn cq-btn-danger" id="delRoutineBlockBtn">Delete from Routine</button>
            <div style="display:flex; gap:8px;">
              <button type="button" class="cq-btn cq-btn-secondary" id="openRoutineTargetBtn">
                ${item.tag.toLowerCase().includes('class') ? 'Go to Live Classes' : 'Go to Assignments'}
              </button>
            </div>
          </div>
        `,
        onOpen: (modal, close) => {
          const delBtn = modal.querySelector('#delRoutineBlockBtn');
          const navBtn = modal.querySelector('#openRoutineTargetBtn');

          if (delBtn) {
            delBtn.addEventListener('click', () => {
              routines = routines.filter(r => r.id !== item.id);
              saveRoutine();
              renderRoutine();
              close();
              window.showToast('Block removed from routine', '🗑️');
            });
          }
          if (navBtn) {
            navBtn.addEventListener('click', () => {
              close();
              window.location.href = item.tag.toLowerCase().includes('class') ? 'live-class.html' : 'assignment.html';
            });
          }
        }
      });
    });

    routineListEl.appendChild(row);
  });
}
renderRoutine();

const addRoutineBtn = document.getElementById('addRoutineBtn');
if (addRoutineBtn) {
  addRoutineBtn.addEventListener('click', () => {
    window.openModal({
      title: 'Add Routine Block',
      subtitle: 'Schedule a class, assignment deadline, or study session',
      contentHtml: `
        <form id="addRoutineForm">
          <div class="cq-form-group">
            <label class="cq-label" for="routineTitle">Title</label>
            <input type="text" id="routineTitle" class="cq-input" placeholder="e.g. System Design Sync" required>
          </div>
          <div class="cq-form-row">
            <div class="cq-form-group">
              <label class="cq-label" for="routineTime">Time Range</label>
              <input type="text" id="routineTime" class="cq-input" placeholder="e.g. 10 AM – 12 PM" required>
            </div>
            <div class="cq-form-group">
              <label class="cq-label" for="routineTag">Type / Tag</label>
              <select id="routineTag" class="cq-select">
                <option value="Class">Class</option>
                <option value="Assignment">Assignment</option>
                <option value="Study">Study Session</option>
                <option value="Meeting">Team Meeting</option>
              </select>
            </div>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="routineColor">Card Color Theme</label>
            <select id="routineColor" class="cq-select">
              <option value="">Blue (Default)</option>
              <option value="pink">Pink / Coral</option>
              <option value="amber">Amber / Gold</option>
              <option value="teal">Teal / Mint</option>
            </select>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
            <button type="submit" class="cq-btn cq-btn-primary">Add to Routine</button>
          </div>
        </form>
      `,
      onOpen: (modal, close) => {
        const form = modal.querySelector('#addRoutineForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const title = modal.querySelector('#routineTitle').value.trim();
          const time = modal.querySelector('#routineTime').value.trim();
          const tag = modal.querySelector('#routineTag').value;
          const color = modal.querySelector('#routineColor').value;

          routines.push({
            id: 'r_' + Date.now(),
            title,
            time,
            tag,
            color
          });
          saveRoutine();
          renderRoutine();
          close();
          window.showToast('Block added to your routine!', '📅');
        });
      }
    });
  });
}


/* =========================================================
   4. Calendar Card with + Event Modal
   ========================================================= */
const calGrid = document.getElementById('calGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const calTodayBtn = document.getElementById('calToday');
const calDoneBtn = document.getElementById('calDoneBtn');
const calAddEventBtn = document.getElementById('calAddEventBtn');

let eventDays = [1, 6, 9, 12, 17, 24, 25, 28];
let calDate = new Date();
let selectedDate = new Date();

function updateRoutineDate(date = selectedDate) {
  if (routineDateEl) {
    routineDateEl.textContent = date.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
updateRoutineDate();

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
      if (eventDays.includes(dayNum)) el.classList.add('event');

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
        updateRoutineDate(selectedDate);
        renderCalendar();
        if (window.cqAudio) window.cqAudio.playPop();
      });
    }

    calGrid.appendChild(el);
  }
}

const prevBtn = document.getElementById('calPrev');
const nextBtn = document.getElementById('calNext');
if (prevBtn) prevBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
if (nextBtn) nextBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });

if (calTodayBtn) {
  calTodayBtn.addEventListener('click', () => {
    calDate = new Date();
    selectedDate = new Date();
    updateRoutineDate(selectedDate);
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
if (calAddEventBtn) {
  calAddEventBtn.addEventListener('click', () => {
    window.openModal({
      title: 'Schedule Calendar Event',
      subtitle: `Add an event for ${selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      contentHtml: `
        <form id="addCalEventForm">
          <div class="cq-form-group">
            <label class="cq-label" for="eventTitle">Event Title</label>
            <input type="text" id="eventTitle" class="cq-input" placeholder="e.g. Midterm Project Presentation" required>
          </div>
          <div class="cq-form-row">
            <div class="cq-form-group">
              <label class="cq-label" for="eventTime">Time</label>
              <input type="time" id="eventTime" class="cq-input" value="10:00" required>
            </div>
            <div class="cq-form-group">
              <label class="cq-label" for="eventType">Type</label>
              <select id="eventType" class="cq-select">
                <option value="urgent">Assignment Deadline</option>
                <option value="soon">Live Class / Workshop</option>
                <option value="later">Exam / Quiz</option>
                <option value="later">Study Session</option>
              </select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
            <button type="submit" class="cq-btn cq-btn-primary">Save Event</button>
          </div>
        </form>
      `,
      onOpen: (modal, close) => {
        const form = modal.querySelector('#addCalEventForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const day = selectedDate.getDate();
          if (!eventDays.includes(day)) {
            eventDays.push(day);
          }
          renderCalendar();
          close();
          window.showToast('Event added to calendar!', '📅');
        });
      }
    });
  });
}
renderCalendar();


/* =========================================================
   5. Enrolled Classes Quick View
   ========================================================= */
document.querySelectorAll('.class-card').forEach(card => {
  card.addEventListener('click', () => {
    const className = card.dataset.class || card.querySelector('.class-name').textContent;
    const meta = card.querySelector('.class-meta') ? card.querySelector('.class-meta').textContent : '';

    window.openModal({
      title: className,
      subtitle: meta,
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div style="background:var(--bg-input); padding:14px; border-radius:12px; border:1px solid var(--border-soft);">
            <div style="font-size:12px; color:var(--text-3); font-weight:700; text-transform:uppercase;">Course Syllabus Highlights</div>
            <p style="font-size:13.5px; color:var(--text-1); margin-top:4px; line-height:1.5;">
              Covers core fundamentals, real-world case studies, hands-on lab submissions, and weekly live virtual syncs.
            </p>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12.5px; font-weight:700;">Completed Modules</span>
            <span style="font-size:12.5px; font-weight:800; color:var(--blue);">8 of 12 complete</span>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <button type="button" class="cq-btn cq-btn-primary" id="joinClassQuickBtn">🎥 Join Next Session</button>
            <button type="button" class="cq-btn cq-btn-secondary" id="viewCourseSyllabusBtn">📘 Full Syllabus</button>
            <button type="button" class="cq-btn cq-btn-secondary" id="viewCourseMaterialsBtn">🔗 Study Materials</button>
          </div>
        </div>
      `,
      onOpen: (modal, close) => {
        const joinBtn = modal.querySelector('#joinClassQuickBtn');
        const sylBtn = modal.querySelector('#viewCourseSyllabusBtn');
        const matBtn = modal.querySelector('#viewCourseMaterialsBtn');

        if (joinBtn) joinBtn.addEventListener('click', () => { close(); window.location.href = 'live-class.html'; });
        if (sylBtn) sylBtn.addEventListener('click', () => { close(); window.location.href = 'subject.html'; });
        if (matBtn) matBtn.addEventListener('click', () => { close(); window.location.href = 'sources.html'; });
      }
    });
  });
});


/* =========================================================
   6. Upcoming Deadlines with + New Deadline & Click Action
   ========================================================= */
const deadlineList = document.getElementById('deadlineList');
const _now = new Date();
const deadlines = [
  { id: 'd1', title: 'Build a Simple Website Design', subject: 'Web Design', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 2) },
  { id: 'd2', title: 'Animation Storyboard Draft', subject: 'Animation & Multimedia', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 5) },
  { id: 'd3', title: 'Responsive Layout Case Study', subject: 'Responsive Design', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 8) },
  { id: 'd4', title: 'UI Prototype Handoff', subject: 'UI Prototyping', due: new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 14) },
];

function renderDeadlines() {
  if (!deadlineList) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sorted = [...deadlines].sort((a, b) => a.due - b.due);
  deadlineList.innerHTML = '';

  sorted.forEach(d => {
    const diffDays = Math.round((d.due - today) / 86400000);
    let pillClass = 'later', pillText = `${diffDays}d left`;
    if (diffDays <= 0) { pillClass = 'urgent'; pillText = diffDays === 0 ? 'Due today' : 'Overdue'; }
    else if (diffDays <= 2) { pillClass = 'urgent'; pillText = `${diffDays}d left`; }
    else if (diffDays <= 5) { pillClass = 'soon'; pillText = `${diffDays}d left`; }

    const row = document.createElement('div');
    row.className = 'deadline-item';
    row.style.cursor = 'pointer';
    row.title = 'Click to view deadline details';
    row.innerHTML = `
      <div class="deadline-info">
        <div class="deadline-title">${escapeHtml(d.title)}</div>
        <div class="deadline-sub">${escapeHtml(d.subject)} · ${d.due.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</div>
      </div>
      <div class="deadline-pill ${pillClass}">${pillText}</div>
    `;

    row.addEventListener('click', () => {
      window.openModal({
        title: d.title,
        subtitle: `${d.subject} · Due ${d.due.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        contentHtml: `
          <div style="font-size:13.5px; line-height:1.6; margin-bottom:16px;">
            This assignment is currently in your active queue. Make sure to review the requirements and submit before the cutoff time.
          </div>
          <div style="display:flex; justify-content:space-between; gap:10px;">
            <button type="button" class="cq-btn cq-btn-success" id="markDeadlineCompleteBtn">✓ Mark Completed</button>
            <button type="button" class="cq-btn cq-btn-primary" id="goToAssignmentPageBtn">Submit in Assignments</button>
          </div>
        `,
        onOpen: (modal, close) => {
          const compBtn = modal.querySelector('#markDeadlineCompleteBtn');
          const assignBtn = modal.querySelector('#goToAssignmentPageBtn');

          if (compBtn) {
            compBtn.addEventListener('click', () => {
              const idx = deadlines.findIndex(item => item.id === d.id);
              if (idx !== -1) deadlines.splice(idx, 1);
              renderDeadlines();
              close();
              if (window.cqAudio) window.cqAudio.playSuccess();
              window.showToast('Assignment marked completed!', '🎉');
            });
          }
          if (assignBtn) {
            assignBtn.addEventListener('click', () => {
              close();
              window.location.href = 'assignment.html';
            });
          }
        }
      });
    });

    deadlineList.appendChild(row);
  });
}
renderDeadlines();

const addDeadlineBtn = document.getElementById('addDeadlineBtn');
if (addDeadlineBtn) {
  addDeadlineBtn.addEventListener('click', () => {
    window.openModal({
      title: 'Add New Deadline',
      subtitle: 'Schedule a new assignment or quiz cutoff',
      contentHtml: `
        <form id="addDeadlineForm">
          <div class="cq-form-group">
            <label class="cq-label" for="dlTitle">Assignment / Task Title</label>
            <input type="text" id="dlTitle" class="cq-input" placeholder="e.g. User Journey Map" required>
          </div>
          <div class="cq-form-row">
            <div class="cq-form-group">
              <label class="cq-label" for="dlSubject">Course / Subject</label>
              <input type="text" id="dlSubject" class="cq-input" placeholder="e.g. Web Design" required>
            </div>
            <div class="cq-form-group">
              <label class="cq-label" for="dlDays">Days Left</label>
              <input type="number" id="dlDays" class="cq-input" min="1" max="90" value="3" required>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
            <button type="submit" class="cq-btn cq-btn-primary">Add Deadline</button>
          </div>
        </form>
      `,
      onOpen: (modal, close) => {
        const form = modal.querySelector('#addDeadlineForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const title = modal.querySelector('#dlTitle').value.trim();
          const subject = modal.querySelector('#dlSubject').value.trim();
          const days = parseInt(modal.querySelector('#dlDays').value, 10) || 3;

          const due = new Date();
          due.setDate(due.getDate() + days);

          deadlines.push({
            id: 'd_' + Date.now(),
            title,
            subject,
            due
          });
          renderDeadlines();
          close();
          window.showToast('Deadline added!', '⏰');
        });
      }
    });
  });
}


/* =========================================================
   7. Quick Notes Card Toolbar (Timestamp, Copy, Clear, Stats)
   ========================================================= */
const notesArea = document.getElementById('notesArea');
const notesStatus = document.getElementById('notesStatus');
const noteTimeBtn = document.getElementById('noteTimeBtn');
const noteCopyBtn = document.getElementById('noteCopyBtn');
const noteClearBtn = document.getElementById('noteClearBtn');
const notesMeta = document.getElementById('notesMeta');

function updateNotesMeta() {
  if (!notesArea || !notesMeta) return;
  const val = notesArea.value;
  const words = val.trim() ? val.trim().split(/\s+/).length : 0;
  const chars = val.length;
  notesMeta.textContent = `${words} words · ${chars} chars`;
}

if (notesArea) {
  notesArea.value = localStorage.getItem('cq_notes') || '';
  updateNotesMeta();

  let notesSaveTimeout = null;
  notesArea.addEventListener('input', () => {
    if (notesStatus) notesStatus.textContent = 'Saving…';
    updateNotesMeta();
    clearTimeout(notesSaveTimeout);
    notesSaveTimeout = setTimeout(() => {
      localStorage.setItem('cq_notes', notesArea.value);
      if (notesStatus) notesStatus.textContent = 'Saved';
    }, 500);
  });
}

if (noteTimeBtn && notesArea) {
  noteTimeBtn.addEventListener('click', () => {
    const now = new Date();
    const stamp = `\n[${now.toLocaleDateString('default', { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: `;
    notesArea.value += stamp;
    notesArea.focus();
    updateNotesMeta();
    localStorage.setItem('cq_notes', notesArea.value);
    window.showToast('Timestamp inserted', '⏰');
  });
}

if (noteCopyBtn && notesArea) {
  noteCopyBtn.addEventListener('click', () => {
    if (!notesArea.value.trim()) {
      window.showToast('Notes are empty', 'ℹ️');
      return;
    }
    navigator.clipboard.writeText(notesArea.value).then(() => {
      window.showToast('Notes copied to clipboard!', '📋');
    });
  });
}

if (noteClearBtn && notesArea) {
  noteClearBtn.addEventListener('click', () => {
    if (!notesArea.value.trim()) return;
    window.showConfirmDialog({
      title: 'Clear Notes',
      message: 'Are you sure you want to clear your scratchpad notes?',
      confirmText: 'Clear Notes',
      onConfirm: () => {
        notesArea.value = '';
        localStorage.removeItem('cq_notes');
        updateNotesMeta();
        if (notesStatus) notesStatus.textContent = 'Cleared';
        window.showToast('Notes cleared', '🗑️');
      }
    });
  });
}


/* =========================================================
   8. Focus Timer (Audio Bell on Finish & Stats)
   ========================================================= */
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
const totalFocusMinutesEl = document.getElementById('totalFocusMinutes');
const resetTimerStatsBtn = document.getElementById('resetTimerStatsBtn');

let currentModeType = localStorage.getItem('cq_timer_type') || 'default';
let customFocusMinutes = Number(localStorage.getItem('cq_custom_focus')) || 25;
let customBreakMinutes = Number(localStorage.getItem('cq_custom_break')) || 5;
let accumulatedFocusMinutes = Number(localStorage.getItem('cq_focus_today')) || 50;

function updateFocusStats() {
  if (totalFocusMinutesEl) {
    totalFocusMinutesEl.textContent = `${accumulatedFocusMinutes} min`;
  }
}
updateFocusStats();

if (resetTimerStatsBtn) {
  resetTimerStatsBtn.addEventListener('click', () => {
    accumulatedFocusMinutes = 0;
    localStorage.setItem('cq_focus_today', 0);
    updateFocusStats();
    window.showToast('Focus session count reset', '🔄');
  });
}

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

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function renderDots() {
  if (!timerDots) return;
  timerDots.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('span');
    if (i < sessionsCompleted % 4) dot.classList.add('filled');
    timerDots.appendChild(dot);
  }
}

function renderTimer() {
  if (timerDisplay) timerDisplay.textContent = formatTime(timerSecondsLeft);
  if (timerMode) timerMode.textContent = isBreak ? 'Break' : 'Focus';
  renderDots();
}

function tick() {
  timerSecondsLeft--;
  if (timerSecondsLeft <= 0) {
    if (!isBreak) {
      sessionsCompleted++;
      localStorage.setItem('cq_sessions', sessionsCompleted);
      accumulatedFocusMinutes += (currentModeType === 'custom' ? customFocusMinutes : DEFAULT_FOCUS_MINUTES);
      localStorage.setItem('cq_focus_today', accumulatedFocusMinutes);
      updateFocusStats();
      if (window.cqAudio) window.cqAudio.playBell();
      window.showToast('Focus session completed! Great job.', '🎉');
    } else {
      if (window.cqAudio) window.cqAudio.playChime();
      window.showToast('Break ended! Ready to focus again?', '⚡');
    }
    isBreak = !isBreak;
    timerSecondsLeft = isBreak ? getBreakSeconds() : getFocusSeconds();
  }
  renderTimer();
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(tick, 1000);
  if (timerToggle) timerToggle.textContent = 'Pause';
  if (window.cqAudio) window.cqAudio.playPop();
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  if (timerToggle) timerToggle.textContent = 'Start';
}

function setTimerMode(mode) {
  currentModeType = mode;
  localStorage.setItem('cq_timer_type', mode);
  pauseTimer();
  isBreak = false;

  if (mode === 'custom') {
    if (customTimerBtn) customTimerBtn.classList.add('active');
    if (defaultTimerBtn) defaultTimerBtn.classList.remove('active');
    if (timerCustomConfig) timerCustomConfig.style.display = 'flex';
    if (customFocusInput) customFocusInput.value = customFocusMinutes;
    if (customBreakInput) customBreakInput.value = customBreakMinutes;
    timerSecondsLeft = getFocusSeconds();
  } else {
    if (defaultTimerBtn) defaultTimerBtn.classList.add('active');
    if (customTimerBtn) customTimerBtn.classList.remove('active');
    if (timerCustomConfig) timerCustomConfig.style.display = 'none';
    timerSecondsLeft = DEFAULT_FOCUS_MINUTES * 60;
  }
  renderTimer();
}

function applyCustomTime() {
  let focusVal = parseInt(customFocusInput.value, 10);
  let breakVal = parseInt(customBreakInput.value, 10);

  if (isNaN(focusVal) || focusVal < 1) focusVal = 1;
  if (focusVal > 180) focusVal = 180;
  if (isNaN(breakVal) || breakVal < 1) breakVal = 1;
  if (breakVal > 60) breakVal = 60;

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
  window.showToast('Custom timer set', '⏱️');
}

if (defaultTimerBtn) defaultTimerBtn.addEventListener('click', () => setTimerMode('default'));
if (customTimerBtn) customTimerBtn.addEventListener('click', () => setTimerMode('custom'));
if (applyCustomBtn) applyCustomBtn.addEventListener('click', applyCustomTime);

if (timerToggle) {
  timerToggle.addEventListener('click', () => {
    if (timerInterval) pauseTimer(); else startTimer();
  });
}
if (timerReset) {
  timerReset.addEventListener('click', () => {
    pauseTimer();
    isBreak = false;
    timerSecondsLeft = getFocusSeconds();
    renderTimer();
    window.showToast('Timer reset', '↺');
  });
}
if (timerSkip) {
  timerSkip.addEventListener('click', () => {
    pauseTimer();
    if (!isBreak) {
      sessionsCompleted++;
      localStorage.setItem('cq_sessions', sessionsCompleted);
    }
    isBreak = !isBreak;
    timerSecondsLeft = isBreak ? getBreakSeconds() : getFocusSeconds();
    renderTimer();
    window.showToast(isBreak ? 'Switched to Break' : 'Switched to Focus', '⏭');
  });
}

if (currentModeType === 'custom') {
  setTimerMode('custom');
} else {
  setTimerMode('default');
}
