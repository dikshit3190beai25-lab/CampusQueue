/* =========================================================
   sources.js
   Full study resources and learning materials suite:
   - Interactive Resource Viewer modal (PDF reader simulation,
     video lecture player, link launcher)
   - Bookmark / favorite toggle (⭐)
   - File download simulation
   - Add new study material modal
   - Course study bundle export
   - LocalStorage persistence
   ========================================================= */

const defaultGroups = [
  {
    subject: 'Introduction to Web Design',
    items: [
      { id: 'src_1', icon: '📄', type: 'pdf', name: 'Week 1 – HTML Fundamentals.pdf', meta: 'PDF · 1.2 MB', bookmarked: true, desc: 'Covers semantic tags, DOM document structure, accessibility standards, and document outlines.' },
      { id: 'src_2', icon: '🎞', type: 'video', name: 'Layout Principles — recorded lecture', meta: 'Video · 42 min', bookmarked: false, desc: 'Full classroom walkthrough of visual hierarchy, z-index stacking contexts, and responsive layout rules.' },
    ]
  },
  {
    subject: 'Responsive Design',
    items: [
      { id: 'src_3', icon: '📄', type: 'pdf', name: 'Grid & Flexbox Cheatsheet.pdf', meta: 'PDF · 640 KB', bookmarked: true, desc: 'Visual reference guide for auto-fit, auto-fill, flex-grow ratios, and container query syntax.' },
      { id: 'src_4', icon: '🔗', type: 'link', name: 'Breakpoints reference (external site)', meta: 'Link · MDN Web Docs', bookmarked: false, desc: 'Official modern viewport references and fluid typography clamping formulas.' },
    ]
  },
  {
    subject: 'Animation & Multimedia',
    items: [
      { id: 'src_5', icon: '🎞', type: 'video', name: 'Storyboarding Basics — recorded lecture', meta: 'Video · 35 min', bookmarked: false, desc: 'Step-by-step breakdown of camera motion, easing functions, and keyframing.' },
      { id: 'src_6', icon: '📄', type: 'pdf', name: 'Animation Principles Handout.pdf', meta: 'PDF · 980 KB', bookmarked: false, desc: 'The 12 foundational Disney animation principles adapted for digital interactive interfaces.' },
    ]
  },
  {
    subject: 'UI Prototyping Workshop',
    items: [
      { id: 'src_7', icon: '📄', type: 'pdf', name: 'Prototyping Workflow Guide.pdf', meta: 'PDF · 1.5 MB', bookmarked: true, desc: 'Figma component tokens, interactive component variables, and developer handoff best practices.' },
      { id: 'src_8', icon: '🔗', type: 'link', name: 'Component library (external site)', meta: 'Link · Design Tokens CDN', bookmarked: false, desc: 'Public UI kit repository with pre-built accessible components.' },
    ]
  },
];

function loadGroups() {
  try {
    const raw = localStorage.getItem('cq_sources');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultGroups));
}

let groups = loadGroups();
let activeFilter = 'all';

function saveGroups() {
  localStorage.setItem('cq_sources', JSON.stringify(groups));
}

const wrap = document.getElementById('sourcesWrap');
const addSourceBtn = document.getElementById('addSourceBtn');
const downloadAllNotesBtn = document.getElementById('downloadAllNotesBtn');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  if (!wrap) return;
  wrap.innerHTML = '';

  let totalItemsCount = 0;

  groups.forEach(g => {
    const filteredItems = g.items.filter(i => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'bookmarked') return i.bookmarked;
      return i.type === activeFilter;
    });

    if (filteredItems.length === 0) return;
    totalItemsCount += filteredItems.length;

    const section = document.createElement('div');
    section.className = 'sources-group';

    const itemsHtml = filteredItems.map(i => `
      <div class="source-item" data-id="${i.id}">
        <button type="button" class="bookmark-btn" data-id="${i.id}" title="${i.bookmarked ? 'Remove bookmark' : 'Bookmark this material'}" style="background:transparent; border:none; font-size:16px; cursor:pointer; padding:0 4px; color:${i.bookmarked ? '#f5b84e' : 'var(--text-3)'};">
          ${i.bookmarked ? '★' : '☆'}
        </button>
        <div class="source-icon">${i.icon}</div>
        <div class="source-body">
          <div class="source-name">${escapeHtml(i.name)}</div>
          <div class="source-meta">${escapeHtml(i.meta)}</div>
        </div>
        <button type="button" class="source-open open-btn" data-id="${i.id}">Open</button>
        <button type="button" class="task-btn del-src-btn" data-id="${i.id}" title="Remove file" style="margin-left:4px;">🗑️</button>
      </div>
    `).join('');

    section.innerHTML = `<div class="sources-group-title">${escapeHtml(g.subject)}</div>${itemsHtml}`;
    wrap.appendChild(section);
  });

  if (totalItemsCount === 0) {
    wrap.innerHTML = `<div style="padding:32px; text-align:center; color:var(--text-3); font-size:13.5px;">No study materials matching this filter.</div>`;
  }

  // Wire up event listeners
  wrap.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      groups.forEach(g => {
        const item = g.items.find(i => i.id === id);
        if (item) {
          item.bookmarked = !item.bookmarked;
          window.showToast(item.bookmarked ? 'Added to Bookmarks (★)' : 'Removed bookmark', item.bookmarked ? '★' : '☆');
        }
      });
      saveGroups();
      render();
    });
  });

  wrap.querySelectorAll('.open-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      let targetItem = null;
      let targetSubject = '';
      groups.forEach(g => {
        const found = g.items.find(i => i.id === id);
        if (found) {
          targetItem = found;
          targetSubject = g.subject;
        }
      });
      if (targetItem) {
        openResourceModal(targetItem, targetSubject);
      }
    });
  });

  wrap.querySelectorAll('.del-src-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      window.showConfirmDialog({
        title: 'Delete Resource',
        message: 'Are you sure you want to remove this study resource?',
        confirmText: 'Remove',
        onConfirm: () => {
          groups.forEach(g => {
            g.items = g.items.filter(i => i.id !== id);
          });
          saveGroups();
          render();
          window.showToast('Resource removed', '🗑️');
        }
      });
    });
  });
}

/* Modal: Resource Viewer */
function openResourceModal(item, subject) {
  let viewerContent = '';

  if (item.type === 'pdf') {
    viewerContent = `
      <div style="background:var(--bg-card-alt); border:1px solid var(--border-soft); border-radius:12px; padding:18px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-weight:800; font-size:14px; color:var(--text-1);">📄 Document Preview: 24 Pages</span>
          <span style="font-size:11.5px; color:var(--text-3); font-family:var(--mono);">PDF / Acrobat Reader</span>
        </div>
        <p style="font-size:13.5px; line-height:1.6; color:var(--text-2); margin-bottom:12px;">
          ${escapeHtml(item.desc || 'Comprehensive course slide deck covering fundamental principles, code patterns, and practical implementation blueprints.')}
        </p>
        <div style="background:var(--bg-input); padding:10px 14px; border-radius:8px; font-size:12px; color:var(--text-1);">
          <strong>Index of Sections:</strong><br>
          • Chapter 1: Foundations & Architecture<br>
          • Chapter 2: Live Code Samples & Best Practices<br>
          • Chapter 3: Practice Exercises & Reference Links
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="cq-btn cq-btn-secondary" id="savePdfToNotesBtn">📝 Add to Notes</button>
        <button type="button" class="cq-btn cq-btn-primary" id="downloadPdfDocBtn">⬇ Download PDF File</button>
      </div>
    `;
  } else if (item.type === 'video') {
    viewerContent = `
      <div style="background:#000; border-radius:12px; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; color:#fff; border:1px solid var(--border); margin-bottom:16px; overflow:hidden;">
        <div style="text-align:center; padding:20px;">
          <div style="font-size:42px; margin-bottom:8px;">🎬</div>
          <div style="font-size:16px; font-weight:800;">${escapeHtml(item.name)}</div>
          <div style="font-size:12px; color:rgba(255,255,255,0.7); margin-top:4px;">1080p Full HD Lecture Capture</div>
        </div>
      </div>
      <div style="font-size:13px; color:var(--text-2); line-height:1.5; margin-bottom:14px;">
        ${escapeHtml(item.desc || 'Watch the full recorded classroom lecture with timestamps and synchronized screen recording.')}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="cq-btn cq-btn-secondary" id="openLiveClassTabBtn">🎥 Go to Live Classroom</button>
        <button type="button" class="cq-btn cq-btn-primary" id="playVideoLectureBtn">▶ Stream Video</button>
      </div>
    `;
  } else {
    viewerContent = `
      <div style="background:var(--bg-card-alt); border:1px solid var(--border-soft); border-radius:12px; padding:18px; margin-bottom:16px;">
        <div style="font-weight:800; font-size:14px; color:var(--text-1); margin-bottom:6px;">🔗 External Documentation Resource</div>
        <p style="font-size:13px; color:var(--text-2); line-height:1.6; margin-bottom:12px;">
          ${escapeHtml(item.desc || 'Verified external documentation, design token libraries, and official browser reference specifications.')}
        </p>
        <div style="font-size:11.5px; color:var(--blue); font-family:var(--mono);">
          https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="cq-btn cq-btn-primary" id="openExternalLinkBtn">Open Link in New Tab ↗</button>
      </div>
    `;
  }

  window.openModal({
    title: item.name,
    subtitle: `${subject} · ${item.meta}`,
    size: 'cq-modal-lg',
    contentHtml: viewerContent,
    onOpen: (modal, close) => {
      const dlBtn = modal.querySelector('#downloadPdfDocBtn');
      const notesBtn = modal.querySelector('#savePdfToNotesBtn');
      const playBtn = modal.querySelector('#playVideoLectureBtn');
      const liveBtn = modal.querySelector('#openLiveClassTabBtn');
      const linkBtn = modal.querySelector('#openExternalLinkBtn');

      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          triggerFileDownload(`${item.name.replace(/\.pdf$/i, '')}_notes.txt`, `CampusQueue Study Resource\nCourse: ${subject}\nMaterial: ${item.name}\n\nKey Concepts:\n1. Follow official layout specifications.\n2. Maintain semantic tag structures.\n3. Verify responsive breakpoints.\n\n(c) 2026 CampusQueue`);
          window.showToast('PDF summary downloaded!', '⬇');
        });
      }

      if (notesBtn) {
        notesBtn.addEventListener('click', () => {
          const existing = localStorage.getItem('cq_notes') || '';
          localStorage.setItem('cq_notes', existing + `\n[Study Note: ${item.name} (${subject})]: Reviewed fundamentals.`);
          window.showToast('Added bookmark note to Scratchpad!', '📝');
        });
      }

      if (playBtn) {
        playBtn.addEventListener('click', () => {
          window.showToast('Streaming video lecture…', '▶');
        });
      }

      if (liveBtn) {
        liveBtn.addEventListener('click', () => {
          close();
          window.location.href = 'live-class.html';
        });
      }

      if (linkBtn) {
        linkBtn.addEventListener('click', () => {
          window.open('https://developer.mozilla.org', '_blank');
          window.showToast('Opened external learning resource', '🔗');
        });
      }
    }
  });
}

function triggerFileDownload(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* Modal: Add New Study Material */
function openAddResourceModal() {
  window.openModal({
    title: 'Add Learning Resource',
    subtitle: 'Upload lecture slides, reading material, or bookmark a link',
    contentHtml: `
      <form id="addResourceForm">
        <div class="cq-form-group">
          <label class="cq-label" for="resTitle">Resource Title</label>
          <input type="text" id="resTitle" class="cq-input" placeholder="e.g. Week 5 Typography System.pdf" required>
        </div>
        <div class="cq-form-row">
          <div class="cq-form-group">
            <label class="cq-label" for="resSubject">Subject Group</label>
            <select id="resSubject" class="cq-select">
              ${groups.map(g => `<option value="${escapeHtml(g.subject)}">${escapeHtml(g.subject)}</option>`).join('')}
            </select>
          </div>
          <div class="cq-form-group">
            <label class="cq-label" for="resType">Material Type</label>
            <select id="resType" class="cq-select">
              <option value="pdf">📄 PDF Document</option>
              <option value="video">🎞 Video Lecture</option>
              <option value="link">🔗 Reference Link</option>
            </select>
          </div>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="resMeta">Meta Info / File Size</label>
          <input type="text" id="resMeta" class="cq-input" placeholder="e.g. PDF · 1.4 MB" required>
        </div>
        <div class="cq-form-group">
          <label class="cq-label" for="resDesc">Overview & Notes</label>
          <textarea id="resDesc" class="cq-textarea" placeholder="Key topics covered in this material…"></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="submit" class="cq-btn cq-btn-primary">Add Resource</button>
        </div>
      </form>
    `,
    onOpen: (modal, close) => {
      const form = modal.querySelector('#addResourceForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = modal.querySelector('#resTitle').value.trim();
        const subject = modal.querySelector('#resSubject').value;
        const type = modal.querySelector('#resType').value;
        const meta = modal.querySelector('#resMeta').value.trim();
        const desc = modal.querySelector('#resDesc').value.trim();

        const iconMap = { pdf: '📄', video: '🎞', link: '🔗' };
        const newItem = {
          id: 'src_' + Date.now(),
          name: title,
          type,
          icon: iconMap[type] || '📄',
          meta,
          desc,
          bookmarked: false
        };

        const targetGroup = groups.find(g => g.subject === subject);
        if (targetGroup) {
          targetGroup.items.unshift(newItem);
        } else {
          groups.push({ subject, items: [newItem] });
        }

        saveGroups();
        render();
        close();
        if (window.cqAudio) window.cqAudio.playPop();
        window.showToast('Resource added to library!', '📚');
      });
    }
  });
}

// Download Compiled Course Bundle
if (downloadAllNotesBtn) {
  downloadAllNotesBtn.addEventListener('click', () => {
    let bundleText = `========================================\nCAMPUSQUEUE ACADEMIC STUDY BUNDLE\nCompiled for: Alex Morgan\nDate: ${new Date().toLocaleDateString()}\n========================================\n\n`;

    groups.forEach(g => {
      bundleText += `\n----------------------------------------\nCOURSE: ${g.subject.toUpperCase()}\n----------------------------------------\n`;
      g.items.forEach((item, idx) => {
        bundleText += `${idx + 1}. [${item.type.toUpperCase()}] ${item.name} (${item.meta})\n   Overview: ${item.desc || 'No overview provided'}\n\n`;
      });
    });

    triggerFileDownload('CampusQueue_Study_Bundle.txt', bundleText);
    window.showToast('Compiled course bundle downloaded!', '📦');
  });
}

// Filter tabs
document.querySelectorAll('.source-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.source-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

if (addSourceBtn) addSourceBtn.addEventListener('click', openAddResourceModal);

render();
