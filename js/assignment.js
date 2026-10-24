/* =========================================================
   assignment.js
   Full task & assignment management suite:
   - Complete CRUD (Add, Edit, Delete, Toggle Complete)
   - Filter by status (All / Pending / Completed) & Subject
   - Assignment Submission simulation with file upload & grading status
   - LocalStorage persistence & global badge syncing
   - Interactive stats metrics bar
   ========================================================= */

const defaultAssignments = [
  { id: 'a1', title: 'Build a Simple Website Design', subject: 'Web Design', due: 'Aug 10', priority: 'high', done: false, submission: null, desc: 'Design and code a semantic 3-page responsive portfolio website.' },
  { id: 'a2', title: 'Animation Storyboard Draft', subject: 'Animation & Multimedia', due: 'Aug 13', priority: 'medium', done: false, submission: null, desc: 'Submit initial keyframe sketches and audio timing sync.' },
  { id: 'a3', title: 'Responsive Layout Case Study', subject: 'Responsive Design', due: 'Aug 18', priority: 'medium', done: false, submission: null, desc: 'Audit mobile viewport breakpoints and submit documentation.' },
  { id: 'a4', title: 'UI Prototype Handoff', subject: 'UI Prototyping', due: 'Aug 25', priority: 'high', done: false, submission: null, desc: 'Prepare component specs, design tokens, and clickable flow for developer review.' },
  { id: 'a5', title: 'Read User Research Book', subject: 'UI Prototyping', due: 'Aug 2', priority: 'low', done: true, submission: { file: 'notes_ch1_4.pdf', date: 'Aug 1', grade: '96/100 (A)' }, desc: 'Chapters 1 through 4 summary notes.' },
  { id: 'a6', title: 'Conduct User Research', subject: 'UI Prototyping', due: 'Jul 30', priority: 'medium', done: true, submission: { file: 'interview_recordings.zip', date: 'Jul 29', grade: '92/100 (A)' }, desc: 'Interview 5 students on current task workflows.' },
];

function loadAssignments() {
  try {
    const raw = localStorage.getItem('cq_assignments');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not parse assignments from localStorage', e);
  }
  return JSON.parse(JSON.stringify(defaultAssignments));
}

let assignments = loadAssignments();
let statusFilter = 'all';
let subjectFilter = 'all';

function saveAssignments() {
  localStorage.setItem('cq_assignments', JSON.stringify(assignments));
  if (typeof window.updateGlobalBadges === 'function') {
    window.updateGlobalBadges();
  }
}

const list = document.getElementById('assignmentList');
const assignBadge = document.getElementById('assignBadge');
const statTotal = document.getElementById('statTotalAssign');
const statPending = document.getElementById('statPendingAssign');
const statCompleted = document.getElementById('statCompletedAssign');
const statRate = document.getElementById('statRateAssign');
const subjectFilterSelect = document.getElementById('subjectFilterSelect');
const addAssignmentBtn = document.getElementById('addAssignmentBtn');
const clearCompletedBtn = document.getElementById('clearCompletedAssignBtn');

function updateStats() {
  const total = assignments.length;
  const completed = assignments.filter(a => a.done).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statCompleted) statCompleted.textContent = completed;
  if (statRate) statRate.textContent = `${rate}%`;
  if (assignBadge) assignBadge.textContent = pending;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  if (!list) return;
  list.innerHTML = '';

  const filtered = assignments.filter(a => {
    const matchesStatus = (statusFilter === 'all') ||
      (statusFilter === 'pending' && !a.done) ||
      (statusFilter === 'done' && a.done);

    const matchesSubject = (subjectFilter === 'all') || (a.subject === subjectFilter);
    return matchesStatus && matchesSubject;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="card" style="padding:32px; text-align:center; color:var(--text-3); font-size:13.5px;">
        <span style="font-size:26px; display:block; margin-bottom:8px;">📝</span>
        ${statusFilter === 'done' ? 'No completed assignments yet.' : 'Nothing due here — you\'re all caught up!'}
      </div>
    `;
    updateStats();
    return;
  }

  filtered.forEach(a => {
    const row = document.createElement('div');
    row.className = 'assignment-card' + (a.done ? ' done' : '');
    const priorityClass = a.priority || 'medium';

    row.innerHTML = `
      <div class="assignment-check" role="checkbox" aria-checked="${a.done}" title="Mark as ${a.done ? 'pending' : 'completed'}">
        ${a.done ? '✓' : ''}
      </div>
      <div class="assignment-body">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
          <span class="assignment-title">${escapeHtml(a.title)}</span>
          <span class="priority-pill ${priorityClass}">${priorityClass}</span>
          ${a.submission ? '<span style="font-size:10px; font-weight:700; color:var(--teal); background:var(--teal-dim); padding:2px 6px; border-radius:4px;">Submitted</span>' : ''}
        </div>
        <div class="assignment-sub">${escapeHtml(a.subject)} · Due ${escapeHtml(a.due || 'TBA')}</div>
      </div>
      <div class="assignment-right">
        <button type="button" class="cq-btn cq-btn-sm cq-btn-secondary view-submit-btn" title="Submit or review assignment">
          ${a.submission ? '📄 Submission' : '📤 Submit'}
        </button>
        <button type="button" class="task-btn edit-assign-btn" title="Edit assignment" aria-label="Edit assignment">✏️</button>
        <button type="button" class="task-btn del-assign-btn" title="Delete assignment" aria-label="Delete assignment">🗑️</button>
      </div>
    `;

    // Toggle complete
    const checkBtn = row.querySelector('.assignment-check');
    const toggleDone = () => {
      a.done = !a.done;
      saveAssignments();
      render();
      if (a.done && window.cqAudio) {
        window.cqAudio.playSuccess();
      }
      window.showToast(a.done ? 'Assignment marked complete!' : 'Assignment set to pending', a.done ? '✓' : '🔄');
    };
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDone();
    });

    // View / Submit button
    const submitBtn = row.querySelector('.view-submit-btn');
    submitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSubmissionModal(a);
    });

    // Edit button
    const editBtn = row.querySelector('.edit-assign-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditAssignmentModal(a);
    });

    // Delete button
    const delBtn = row.querySelector('.del-assign-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.showConfirmDialog({
        title: 'Delete Assignment',
        message: `Are you sure you want to delete "${a.title}"?`,
        confirmText: 'Delete',
        onConfirm: () => {
          assignments = assignments.filter(item => item.id !== a.id);
          saveAssignments();
          render();
          window.showToast('Assignment deleted', '🗑️');
        }
      });
    });

    list.appendChild(row);
  });

  updateStats();
}

/* Modal: Submit Assignment / View Submission */
function openSubmissionModal(a) {
  const isSubmitted = !!a.submission;

  const modalHtml = `
    <div style="font-size:13.5px; line-height:1.6; margin-bottom:16px;">
      <div style="font-weight:700; color:var(--text-1); margin-bottom:4px;">Assignment Instructions:</div>
      <p style="color:var(--text-2); background:var(--bg-card-alt); padding:10px 14px; border-radius:10px; border:1px solid var(--border-soft);">
        ${escapeHtml(a.desc || 'Complete the assignment guidelines specified in the course syllabus and upload your project files.')}
      </p>
    </div>

    ${isSubmitted ? `
      <div style="background:var(--teal-dim); border:1px solid rgba(47,212,165,.3); border-radius:12px; padding:14px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:800; color:var(--teal); font-size:13px;">✓ Submitted Work</span>
          <span style="font-size:11.5px; color:var(--text-2);">Submitted on ${a.submission.date || 'Recent'}</span>
        </div>
        <div style="font-size:13px; font-weight:700; margin-top:6px; color:var(--text-1);">
          📁 ${escapeHtml(a.submission.file || 'assignment_submission.zip')}
        </div>
        ${a.submission.grade ? `<div style="font-size:12px; font-weight:700; color:var(--blue); margin-top:4px;">Grade Received: ${a.submission.grade}</div>` : '<div style="font-size:11.5px; color:var(--text-3); margin-top:4px;">Status: In Grading Queue</div>'}
      </div>
    ` : ''}

    <form id="submissionUploadForm">
      <div class="cq-form-group">
        <label class="cq-label" for="submitFileSelect">Upload Project File / Archive</label>
        <input type="file" id="submitFileSelect" class="cq-input" style="padding:8px 12px;">
      </div>
      <div class="cq-form-group">
        <label class="cq-label" for="submitNotes">Student Submission Notes (Optional)</label>
        <textarea id="submitNotes" class="cq-textarea" placeholder="Add any notes or repository links for your instructor…">${a.submission && a.submission.notes ? escapeHtml(a.submission.notes) : ''}</textarea>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px;">
        <button type="button" class="cq-btn cq-btn-secondary" id="closeSubModalBtn">Cancel</button>
        <button type="submit" class="cq-btn cq-btn-primary">${isSubmitted ? 'Resubmit Work' : 'Submit Assignment'}</button>
      </div>
    </form>
  `;

  window.openModal({
    title: `${a.title}`,
    subtitle: `${a.subject} · Due ${a.due}`,
    contentHtml: modalHtml,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#submissionUploadForm');
      const cancelBtn = modal.querySelector('#closeSubModalBtn');
      if (cancelBtn) cancelBtn.addEventListener('click', close);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = modal.querySelector('#submitFileSelect');
        const notes = modal.querySelector('#submitNotes').value.trim();
        const fileName = (fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : (a.title.toLowerCase().replace(/\s+/g, '_') + '_final.zip');

        a.submission = {
          file: fileName,
          notes: notes,
          date: new Date().toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }),
          grade: null
        };
        a.done = true; // Auto-mark completed upon submission

        saveAssignments();
        render();
        close();
        if (window.cqAudio) window.cqAudio.playSuccess();
        window.showToast('Assignment submitted successfully!', '🎉');
      });
    }
  });
}

/* Modal: Add New Assignment */
function openAddAssignmentModal() {
  window.openModal({
    title: 'Add New Assignment',
    subtitle: 'Track an assignment deadline, lab work, or coursework',
    contentHtml: `
      <form id="addAssignmentForm">
        <div class="cq-form-group">
          <label class="cq-label" for="newAssignTitle">Assignment Title</label>
          <input type="text" id="newAssignTitle" class="cq-input" placeholder="e.g. Design System Style Guide" required>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="newAssignSubject">Course / Subject</label>
            <select id="newAssignSubject" class="cq-select">
              <option>Web Design</option>
              <option>Responsive Design</option>
              <option>Animation & Multimedia</option>
              <option>UI Prototyping</option>
              <option>Information Architecture</option>
              <option>Data Visualization Basics</option>
            </select>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="newAssignDue">Due Date</label>
            <input type="text" id="newAssignDue" class="cq-input" placeholder="e.g. Aug 28" required>
          </div>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="newAssignPriority">Priority Level</label>
          <select id="newAssignPriority" class="cq-select">
            <option value="high">High Priority</option>
            <option value="medium" selected>Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="newAssignDesc">Instructions / Details</label>
          <textarea id="newAssignDesc" class="cq-textarea" placeholder="Requirements, deliverables, and rubric details…"></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Create Assignment</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#addAssignmentForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = modal.querySelector('#newAssignTitle').value.trim();
        const subject = modal.querySelector('#newAssignSubject').value;
        const due = modal.querySelector('#newAssignDue').value.trim();
        const priority = modal.querySelector('#newAssignPriority').value;
        const desc = modal.querySelector('#newAssignDesc').value.trim();

        assignments.unshift({
          id: 'a_' + Date.now(),
          title,
          subject,
          due,
          priority,
          desc,
          done: false,
          submission: null
        });

        saveAssignments();
        render();
        close();
        if (window.cqAudio) window.cqAudio.playPop();
        window.showToast('Assignment added to your queue!', '📝');
      });
    }
  });
}

/* Modal: Edit Assignment */
function openEditAssignmentModal(a) {
  window.openModal({
    title: 'Edit Assignment',
    subtitle: `Update details for "${a.title}"`,
    contentHtml: `
      <form id="editAssignmentForm">
        <div class="cq-form-group">
          <label class="cq-label" for="editAssignTitle">Assignment Title</label>
          <input type="text" id="editAssignTitle" class="cq-input" value="${escapeHtml(a.title)}" required>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="editAssignSubject">Course / Subject</label>
            <input type="text" id="editAssignSubject" class="cq-input" value="${escapeHtml(a.subject)}" required>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="editAssignDue">Due Date</label>
            <input type="text" id="editAssignDue" class="cq-input" value="${escapeHtml(a.due || '')}" required>
          </div>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="editAssignPriority">Priority</label>
          <select id="editAssignPriority" class="cq-select">
            <option value="high" ${a.priority === 'high' ? 'selected' : ''}>High Priority</option>
            <option value="medium" ${a.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
            <option value="low" ${a.priority === 'low' ? 'selected' : ''}>Low Priority</option>
          </select>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="editAssignDesc">Instructions / Details</label>
          <textarea id="editAssignDesc" class="cq-textarea">${escapeHtml(a.desc || '')}</textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Save Changes</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#editAssignmentForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        a.title = modal.querySelector('#editAssignTitle').value.trim();
        a.subject = modal.querySelector('#editAssignSubject').value.trim();
        a.due = modal.querySelector('#editAssignDue').value.trim();
        a.priority = modal.querySelector('#editAssignPriority').value;
        a.desc = modal.querySelector('#editAssignDesc').value.trim();

        saveAssignments();
        render();
        close();
        window.showToast('Assignment updated', '✏️');
      });
    }
  });
}

// Tab filtering
document.getElementById('tabRow').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('#tabRow .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  statusFilter = btn.dataset.filter;
  render();
});

// Subject filtering
if (subjectFilterSelect) {
  subjectFilterSelect.addEventListener('change', (e) => {
    subjectFilter = e.target.value;
    render();
  });
}

// Add assignment button
if (addAssignmentBtn) {
  addAssignmentBtn.addEventListener('click', openAddAssignmentModal);
}

// Clear completed button
if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener('click', () => {
    const doneItems = assignments.filter(a => a.done);
    if (doneItems.length === 0) {
      window.showToast('No completed assignments to clear', 'ℹ️');
      return;
    }
    window.showConfirmDialog({
      title: 'Clear Completed Assignments',
      message: `Are you sure you want to remove all ${doneItems.length} completed assignments?`,
      confirmText: 'Clear All',
      onConfirm: () => {
        assignments = assignments.filter(a => !a.done);
        saveAssignments();
        render();
        window.showToast(`Cleared ${doneItems.length} assignments`, '🗑️');
      }
    });
  });
}

render();
