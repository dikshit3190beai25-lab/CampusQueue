let assignments = [
  { title:'Build a Simple Website Design', subject:'Web Design', due:'Aug 10', done:false },
  { title:'Animation Storyboard Draft', subject:'Animation & Multimedia', due:'Aug 13', done:false },
  { title:'Responsive Layout Case Study', subject:'Responsive Design', due:'Aug 18', done:false },
  { title:'UI Prototype Handoff', subject:'UI Prototyping', due:'Aug 25', done:false },
  { title:'Read User Research Book', subject:'UI Prototyping', due:'Aug 2', done:true },
  { title:'Conduct User Research', subject:'UI Prototyping', due:'Jul 30', done:true },
];

let filter = 'all';
const list = document.getElementById('assignmentList');
const assignBadge = document.getElementById('assignBadge');

function render(){
  list.innerHTML = '';
  const filtered = assignments.filter(a => {
    if(filter === 'pending') return !a.done;
    if(filter === 'done') return a.done;
    return true;
  });

  if(filtered.length === 0){
    list.innerHTML = '<div class="card page-sub">Nothing here — you\'re all caught up.</div>';
  }

  filtered.forEach((a) => {
    const idx = assignments.indexOf(a);
    const row = document.createElement('div');
    row.className = 'assignment-card' + (a.done ? ' done' : '');
    row.innerHTML = `
      <div class="assignment-check">${a.done ? '✓' : ''}</div>
      <div class="assignment-body">
        <div class="assignment-title">${a.title}</div>
        <div class="assignment-sub">${a.subject} · Due ${a.due}</div>
      </div>
      <div class="assignment-right">
        <span class="status-pill ${a.done ? 'done' : 'pending'}">${a.done ? 'Completed' : 'Pending'}</span>
      </div>`;
    row.querySelector('.assignment-check').addEventListener('click', () => {
      assignments[idx].done = !assignments[idx].done;
      render();
    });
    list.appendChild(row);
  });

  assignBadge.textContent = assignments.filter(a => !a.done).length;
}

document.getElementById('tabRow').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filter = btn.dataset.filter;
  render();
});

render();
