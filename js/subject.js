const subjects = [
  { icon:'🖥', name:'Introduction to Web Design', instructor:'Mr. A. Sharma', meta:'Mon · Wed · 8–10 AM', progress:72 },
  { icon:'📱', name:'Responsive Design', instructor:'Ms. P. Kaur', meta:'Tue · Thu · 12–2 PM', progress:54 },
  { icon:'🎬', name:'Animation & Multimedia', instructor:'Mr. R. Verma', meta:'Wed · Fri · 5–7 PM', progress:38 },
  { icon:'🧩', name:'UI Prototyping Workshop', instructor:'Ms. N. Chantika', meta:'Thu · 4–6 PM', progress:88 },
  { icon:'🗂', name:'Information Architecture', instructor:'Mr. S. Gill', meta:'Mon · 2–4 PM', progress:61 },
  { icon:'📊', name:'Data Visualization Basics', instructor:'Ms. K. Randhawa', meta:'Fri · 10 AM–12 PM', progress:23 },
];

const grid = document.getElementById('subjectGrid');
subjects.forEach(s => {
  const card = document.createElement('div');
  card.className = 'subject-card';
  card.innerHTML = `
    <div class="subject-thumb">${s.icon}</div>
    <div class="subject-name">${s.name}</div>
    <div class="subject-instructor">${s.instructor}</div>
    <div class="subject-meta">${s.meta}</div>
    <div class="subject-progress-row"><span>Progress</span><span>${s.progress}%</span></div>
    <div class="subject-progress"><b style="width:${s.progress}%"></b></div>
  `;
  grid.appendChild(card);
});
