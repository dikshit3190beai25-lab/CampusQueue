/* =========================================================
   subject.js
   Full subject management and progress tracking suite:
   - Dynamic course cards with live progress bars
   - Interactive Syllabus Modules tracker (checking modules updates progress!)
   - Attendance tracking & attendance report modal
   - Add, Edit, Delete subjects
   - LocalStorage persistence
   ========================================================= */

const defaultSubjects = [
  {
    id: 's1',
    icon: '🖥',
    name: 'Introduction to Web Design',
    code: 'CS-201',
    instructor: 'Mr. A. Sharma',
    email: 'sharma@campus.edu',
    meta: 'Mon · Wed · 8–10 AM',
    progress: 72,
    attended: 14,
    totalClasses: 16,
    modules: [
      { title: 'HTML5 Semantic Structure & DOM', done: true },
      { title: 'CSS3 Selectors, Cascade & Typography', done: true },
      { title: 'Responsive Grid & Flexbox Systems', done: true },
      { title: 'CSS Animations, Transitions & Transforms', done: true },
      { title: 'Accessibility (a11y) & ARIA Guidelines', done: false },
      { title: 'Final Capstone Project & Deployment', done: false },
    ]
  },
  {
    id: 's2',
    icon: '📱',
    name: 'Responsive Design',
    code: 'CS-204',
    instructor: 'Ms. P. Kaur',
    email: 'kaur@campus.edu',
    meta: 'Tue · Thu · 12–2 PM',
    progress: 54,
    attended: 12,
    totalClasses: 14,
    modules: [
      { title: 'Mobile-First Design Paradigms', done: true },
      { title: 'Fluid Typography & Clamping Units', done: true },
      { title: 'Media Queries & Container Queries', done: true },
      { title: 'Responsive Images & Performance Budget', done: false },
      { title: 'Touch Gestures & Viewport Audits', done: false },
    ]
  },
  {
    id: 's3',
    icon: '🎬',
    name: 'Animation & Multimedia',
    code: 'CS-208',
    instructor: 'Mr. R. Verma',
    email: 'verma@campus.edu',
    meta: 'Wed · Fri · 5–7 PM',
    progress: 38,
    attended: 9,
    totalClasses: 14,
    modules: [
      { title: '12 Principles of Classic Animation', done: true },
      { title: 'Digital Storyboarding & Keyframing', done: true },
      { title: 'Audio Synchronization & Foley Tracks', done: false },
      { title: 'Motion Graphics with Canvas & SVG', done: false },
      { title: 'Rendering & Compression Optimization', done: false },
    ]
  },
  {
    id: 's4',
    icon: '🧩',
    name: 'UI Prototyping Workshop',
    code: 'CS-210',
    instructor: 'Ms. N. Chantika',
    email: 'chantika@campus.edu',
    meta: 'Thu · 4–6 PM',
    progress: 88,
    attended: 15,
    totalClasses: 16,
    modules: [
      { title: 'Figma Component Systems & Auto Layout', done: true },
      { title: 'Interactive State Variants & Micro-Interactions', done: true },
      { title: 'Design Token Documentation & Hand-off', done: true },
      { title: 'Usability Testing & Heuristic Audits', done: true },
      { title: 'Design System Governance & Release', done: false },
    ]
  },
  {
    id: 's5',
    icon: '🗂',
    name: 'Information Architecture',
    code: 'CS-215',
    instructor: 'Mr. S. Gill',
    email: 'gill@campus.edu',
    meta: 'Mon · 2–4 PM',
    progress: 61,
    attended: 11,
    totalClasses: 14,
    modules: [
      { title: 'User Mental Models & Card Sorting', done: true },
      { title: 'Sitemap Hierarchy & Taxonomy Design', done: true },
      { title: 'Faceted Navigation & Search Ergonomics', done: true },
      { title: 'Wireframing Content Models', done: false },
      { title: 'Evaluation with Tree Testing', done: false },
    ]
  },
  {
    id: 's6',
    icon: '📊',
    name: 'Data Visualization Basics',
    code: 'CS-218',
    instructor: 'Ms. K. Randhawa',
    email: 'randhawa@campus.edu',
    meta: 'Fri · 10 AM–12 PM',
    progress: 23,
    attended: 8,
    totalClasses: 12,
    modules: [
      { title: 'Visual Encoding & Gestalt Principles', done: true },
      { title: 'Choosing Chart Archetypes for Audiences', done: false },
      { title: 'Chart.js & D3.js Fundamentals', done: false },
      { title: 'Interactive Dashboards & Drill-Downs', done: false },
    ]
  },
];

function loadSubjects() {
  try {
    const raw = localStorage.getItem('cq_subjects');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not parse subjects from localStorage', e);
  }
  return JSON.parse(JSON.stringify(defaultSubjects));
}

let subjects = loadSubjects();
let currentFilter = 'all';

function saveSubjects() {
  localStorage.setItem('cq_subjects', JSON.stringify(subjects));
}

const grid = document.getElementById('subjectGrid');
const countDisplay = document.getElementById('subjectCountDisplay');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const attendanceSummaryBtn = document.getElementById('attendanceSummaryBtn');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = subjects.filter(s => {
    if (currentFilter === 'active') return s.progress < 100;
    if (currentFilter === 'completed') return s.progress >= 100;
    return true;
  });

  if (countDisplay) {
    countDisplay.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="card" style="grid-column:1/-1; padding:32px; text-align:center; color:var(--text-3);">No courses found for this filter.</div>';
    return;
  }

  filtered.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.cursor = 'pointer';
    card.title = 'Click to view syllabus, modules, and attendance';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div class="subject-thumb">${s.icon || '📘'}</div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="task-btn edit-subject-btn" title="Edit course" aria-label="Edit course">✏️</button>
          <button type="button" class="task-btn del-subject-btn" title="Drop course" aria-label="Drop course">🗑️</button>
        </div>
      </div>
      <div class="subject-name">${escapeHtml(s.name)}</div>
      <div class="subject-instructor">${escapeHtml(s.instructor)} · <span style="font-family:var(--mono); color:var(--blue);">${escapeHtml(s.code || 'CS')}</span></div>
      <div class="subject-meta">${escapeHtml(s.meta)}</div>
      <div class="subject-progress-row"><span>Course Progress</span><span class="subject-progress-num">${s.progress}%</span></div>
      <div class="subject-progress"><b style="width:${s.progress}%"></b></div>
    `;

    // Click card to open syllabus modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.edit-subject-btn') || e.target.closest('.del-subject-btn')) return;
      openSubjectModal(s);
    });

    // Edit button
    const editBtn = card.querySelector('.edit-subject-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditSubjectModal(s);
    });

    // Delete button
    const delBtn = card.querySelector('.del-subject-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.showConfirmDialog({
        title: 'Drop Subject',
        message: `Are you sure you want to drop "${s.name}"?`,
        confirmText: 'Drop Course',
        onConfirm: () => {
          subjects = subjects.filter(item => item.id !== s.id);
          saveSubjects();
          render();
          window.showToast('Course dropped', '🗑️');
        }
      });
    });

    grid.appendChild(card);
  });
}

/* Modal: Subject Detail with Interactive Modules Checklist */
function openSubjectModal(s) {
  const attendanceRate = Math.round((s.attended / (s.totalClasses || 1)) * 100);

  function getModuleListHtml() {
    return s.modules.map((m, idx) => `
      <div class="cq-module-row" style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; background:var(--bg-card); margin-bottom:6px; border:1px solid var(--border-soft);">
        <input type="checkbox" id="mod_${idx}" data-idx="${idx}" class="module-check" ${m.done ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px; accent-color:var(--blue);">
        <label for="mod_${idx}" style="flex:1; font-size:13px; cursor:pointer; color:var(--text-1); ${m.done ? 'text-decoration:line-through; opacity:0.75;' : ''}">${escapeHtml(m.title)}</label>
        <span style="font-size:10.5px; font-weight:700; color:${m.done ? 'var(--teal)' : 'var(--text-3)'};">${m.done ? 'Done ✓' : 'Pending'}</span>
      </div>
    `).join('');
  }

  const modalHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border-soft); flex-wrap:wrap; gap:10px;">
      <div>
        <div style="font-size:15px; font-weight:800; color:var(--text-1);">${escapeHtml(s.name)}</div>
        <div style="font-size:12px; color:var(--text-2); margin-top:2px;">Instructor: <strong>${escapeHtml(s.instructor)}</strong> (${s.email})</div>
        <div style="font-size:11.5px; color:var(--text-3); margin-top:2px;">Schedule: ${escapeHtml(s.meta)}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end;">
        <span style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase;">Attendance</span>
        <span style="font-size:16px; font-weight:800; color:${attendanceRate >= 75 ? 'var(--teal)' : 'var(--coral)'};">${attendanceRate}% (${s.attended}/${s.totalClasses})</span>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700; margin-bottom:6px;">
        <span>Syllabus Modules (${s.modules.filter(m=>m.done).length}/${s.modules.length} Completed)</span>
        <span id="modalProgressNumber" style="color:var(--blue);">${s.progress}%</span>
      </div>
      <div class="subject-progress" style="height:8px; margin-bottom:14px;"><b id="modalProgressBar" style="width:${s.progress}%"></b></div>
      <div id="moduleListWrap" style="max-height:220px; overflow-y:auto; padding-right:4px;">
        ${getModuleListHtml()}
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-top:14px; border-top:1px solid var(--border-soft);">
      <button type="button" class="cq-btn cq-btn-sm cq-btn-secondary" id="markAttendancePlusBtn">✓ Mark Present Today</button>
      <div style="display:flex; gap:8px;">
        <button type="button" class="cq-btn cq-btn-sm cq-btn-secondary" id="openSourcesBtn">🔗 Course Materials</button>
        <button type="button" class="cq-btn cq-btn-sm cq-btn-primary" id="openLiveClassBtn">🎥 Join Class</button>
      </div>
    </div>
  `;

  window.openModal({
    title: `Course Syllabus & Progress`,
    subtitle: `${s.code || 'CS'} · ${s.name}`,
    contentHtml: modalHtml,
    size: 'cq-modal-lg',
    onOpen: (modal, close) => {
      const moduleWrap = modal.querySelector('#moduleListWrap');
      const progressNum = modal.querySelector('#modalProgressNumber');
      const progressBar = modal.querySelector('#modalProgressBar');
      const attendBtn = modal.querySelector('#markAttendancePlusBtn');
      const sourcesBtn = modal.querySelector('#openSourcesBtn');
      const liveBtn = modal.querySelector('#openLiveClassBtn');

      function updateModuleStates() {
        const checks = moduleWrap.querySelectorAll('.module-check');
        checks.forEach(chk => {
          const idx = parseInt(chk.dataset.idx, 10);
          s.modules[idx].done = chk.checked;
        });

        const doneCount = s.modules.filter(m => m.done).length;
        s.progress = Math.round((doneCount / s.modules.length) * 100);
        progressNum.textContent = `${s.progress}%`;
        progressBar.style.width = `${s.progress}%`;

        saveSubjects();
        render();
      }

      moduleWrap.addEventListener('change', (e) => {
        if (e.target.classList.contains('module-check')) {
          updateModuleStates();
          if (e.target.checked && window.cqAudio) {
            window.cqAudio.playSuccess();
          }
          window.showToast('Module progress updated!', '✓');
        }
      });

      if (attendBtn) {
        attendBtn.addEventListener('click', () => {
          s.attended = Math.min((s.totalClasses || 16), s.attended + 1);
          saveSubjects();
          render();
          close();
          window.showToast('Attendance logged for today!', '📅');
        });
      }

      if (sourcesBtn) sourcesBtn.addEventListener('click', () => { close(); window.location.href = 'sources.html'; });
      if (liveBtn) liveBtn.addEventListener('click', () => { close(); window.location.href = 'live-class.html'; });
    }
  });
}

/* Modal: Add New Subject */
function openAddSubjectModal() {
  window.openModal({
    title: 'Add New Subject',
    subtitle: 'Enroll in a new course for the current academic semester',
    contentHtml: `
      <form id="addSubjectForm">
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="subjName">Subject Name</label>
            <input type="text" id="subjName" class="cq-input" placeholder="e.g. Cloud Computing Systems" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="subjCode">Course Code</label>
            <input type="text" id="subjCode" class="cq-input" placeholder="e.g. CS-301" required>
          </div>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="subjInstructor">Instructor Name</label>
            <input type="text" id="subjInstructor" class="cq-input" placeholder="e.g. Dr. H. Vance" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="subjEmail">Instructor Email</label>
            <input type="email" id="subjEmail" class="cq-input" placeholder="vance@campus.edu" required>
          </div>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="subjMeta">Class Schedule</label>
            <input type="text" id="subjMeta" class="cq-input" placeholder="e.g. Tue · Thu · 10–12 AM" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="subjIcon">Icon Emoji</label>
            <select id="subjIcon" class="cq-select">
              <option value="💻">💻 Computer</option>
              <option value="📘">📘 Book</option>
              <option value="🌐">🌐 Web / Cloud</option>
              <option value="🤖">🤖 AI / Robotics</option>
              <option value="🎨">🎨 Design / Art</option>
            </select>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Enroll Course</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#addSubjectForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = modal.querySelector('#subjName').value.trim();
        const code = modal.querySelector('#subjCode').value.trim();
        const instructor = modal.querySelector('#subjInstructor').value.trim();
        const email = modal.querySelector('#subjEmail').value.trim();
        const meta = modal.querySelector('#subjMeta').value.trim();
        const icon = modal.querySelector('#subjIcon').value;

        subjects.push({
          id: 's_' + Date.now(),
          name,
          code,
          instructor,
          email,
          meta,
          icon,
          progress: 0,
          attended: 0,
          totalClasses: 14,
          modules: [
            { title: 'Module 1: Course Fundamentals & Setup', done: false },
            { title: 'Module 2: Practical Lab Application', done: false },
            { title: 'Module 3: Midterm Evaluation Project', done: false },
            { title: 'Module 4: Advanced Topics & Capstone', done: false },
          ]
        });

        saveSubjects();
        render();
        close();
        if (window.cqAudio) window.cqAudio.playPop();
        window.showToast(`Enrolled in ${name}!`, '📘');
      });
    }
  });
}

/* Modal: Edit Subject */
function openEditSubjectModal(s) {
  window.openModal({
    title: 'Edit Course Details',
    subtitle: `Update information for ${s.name}`,
    contentHtml: `
      <form id="editSubjectForm">
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="editSubjName">Subject Name</label>
            <input type="text" id="editSubjName" class="cq-input" value="${escapeHtml(s.name)}" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="editSubjCode">Course Code</label>
            <input type="text" id="editSubjCode" class="cq-input" value="${escapeHtml(s.code || '')}" required>
          </div>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="editSubjInstructor">Instructor</label>
            <input type="text" id="editSubjInstructor" class="cq-input" value="${escapeHtml(s.instructor)}" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="editSubjMeta">Schedule</label>
            <input type="text" id="editSubjMeta" class="cq-input" value="${escapeHtml(s.meta)}" required>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Save Changes</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#editSubjectForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        s.name = modal.querySelector('#editSubjName').value.trim();
        s.code = modal.querySelector('#editSubjCode').value.trim();
        s.instructor = modal.querySelector('#editSubjInstructor').value.trim();
        s.meta = modal.querySelector('#editSubjMeta').value.trim();

        saveSubjects();
        render();
        close();
        window.showToast('Course details saved', '✏️');
      });
    }
  });
}

/* Modal: Overall Attendance Report */
function openAttendanceModal() {
  const modalHtml = `
    <div style="font-size:13.5px; line-height:1.6; color:var(--text-1); margin-bottom:14px;">
      Campus policy requires at least <strong>75% attendance</strong> across all enrolled subjects to remain in good academic standing.
    </div>
    <div style="max-height:280px; overflow-y:auto; border:1px solid var(--border-soft); border-radius:12px; margin-bottom:16px;">
      <table style="width:100%; border-collapse:collapse; font-size:12.5px; text-align:left;">
        <thead style="background:var(--bg-card-alt); font-size:11px; text-transform:uppercase; color:var(--text-3); border-bottom:1px solid var(--border-soft);">
          <tr>
            <th style="padding:10px 14px;">Course</th>
            <th style="padding:10px 14px; text-align:center;">Attended / Total</th>
            <th style="padding:10px 14px; text-align:right;">Rate</th>
            <th style="padding:10px 14px; text-align:right;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map(s => {
            const pct = Math.round((s.attended / (s.totalClasses || 1)) * 100);
            const isGood = pct >= 75;
            return `
              <tr style="border-bottom:1px solid var(--border-soft);">
                <td style="padding:10px 14px; font-weight:700;">${escapeHtml(s.name)}</td>
                <td style="padding:10px 14px; text-align:center;">${s.attended} / ${s.totalClasses || 14}</td>
                <td style="padding:10px 14px; text-align:right; font-weight:800; color:${isGood ? 'var(--teal)' : 'var(--coral)'};">${pct}%</td>
                <td style="padding:10px 14px; text-align:right;">
                  <span class="status-pill ${isGood ? 'done' : 'urgent'}">${isGood ? 'Good Standing' : 'Warning'}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex; justify-content:flex-end;">
      <button type="button" class="cq-btn cq-btn-primary" id="closeAttendanceModalBtn">Close Report</button>
    </div>
  `;

  window.openModal({
    title: 'Semester Attendance Report',
    subtitle: 'Official institutional attendance record',
    contentHtml: modalHtml,
    size: 'cq-modal-lg',
    onOpen: (modal, close) => {
      const btn = modal.querySelector('#closeAttendanceModalBtn');
      if (btn) btn.addEventListener('click', close);
    }
  });
}

// Filter tabs
document.querySelectorAll('.subject-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.subject-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

if (addSubjectBtn) addSubjectBtn.addEventListener('click', openAddSubjectModal);
if (attendanceSummaryBtn) attendanceSummaryBtn.addEventListener('click', openAttendanceModal);

render();
