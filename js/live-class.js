const sessions = [
  { icon:'🖥', title:'Introduction to Web Design', meta:'Mr. A. Sharma · Starts in progress', status:'live' },
  { icon:'🧩', title:'UI Prototyping Workshop', meta:'Ms. N. Chantika · Today, 4:00 PM', status:'upcoming' },
  { icon:'📱', title:'Responsive Design', meta:'Ms. P. Kaur · Tomorrow, 12:00 PM', status:'upcoming' },
  { icon:'🎬', title:'Animation & Multimedia', meta:'Mr. R. Verma · Wed, 5:00 PM', status:'upcoming' },
  { icon:'🗂', title:'Information Architecture', meta:'Mr. S. Gill · Yesterday, 2:00 PM', status:'ended' },
];

const statusLabel = { live:'Live now', upcoming:'Upcoming', ended:'Ended' };
const list = document.getElementById('liveList');

sessions.forEach(s => {
  const item = document.createElement('div');
  item.className = 'live-item';
  const btn = s.status === 'live'
    ? `<button class="btn-join">Join now</button>`
    : s.status === 'upcoming'
      ? `<button class="btn-join" style="background:var(--bg-input); color:var(--text-1); box-shadow:none; border:1px solid var(--border);">Remind me</button>`
      : `<button class="btn-join" disabled>Ended</button>`;
  item.innerHTML = `
    <div class="live-thumb">${s.icon}</div>
    <div class="live-info">
      <div class="live-title">${s.title}</div>
      <div class="live-meta">${s.meta}</div>
    </div>
    <div class="live-actions">
      <span class="status-pill ${s.status}">${s.status === 'live' ? '<span class="dot"></span>' : ''}${statusLabel[s.status]}</span>
      ${btn}
    </div>`;
  list.appendChild(item);
});
