const groups = [
  {
    subject: 'Introduction to Web Design',
    items: [
      { icon:'📄', name:'Week 1 – HTML Fundamentals.pdf', meta:'PDF · 1.2 MB' },
      { icon:'🎞', name:'Layout Principles — recorded lecture', meta:'Video · 42 min' },
    ]
  },
  {
    subject: 'Responsive Design',
    items: [
      { icon:'📄', name:'Grid & Flexbox Cheatsheet.pdf', meta:'PDF · 640 KB' },
      { icon:'🔗', name:'Breakpoints reference (external site)', meta:'Link' },
    ]
  },
  {
    subject: 'Animation & Multimedia',
    items: [
      { icon:'🎞', name:'Storyboarding Basics — recorded lecture', meta:'Video · 35 min' },
      { icon:'📄', name:'Animation Principles Handout.pdf', meta:'PDF · 980 KB' },
    ]
  },
  {
    subject: 'UI Prototyping Workshop',
    items: [
      { icon:'📄', name:'Prototyping Workflow Guide.pdf', meta:'PDF · 1.5 MB' },
      { icon:'🔗', name:'Component library (external site)', meta:'Link' },
    ]
  },
];

const wrap = document.getElementById('sourcesWrap');
groups.forEach(g => {
  const section = document.createElement('div');
  section.className = 'sources-group';
  const itemsHtml = g.items.map(i => `
    <div class="source-item">
      <div class="source-icon">${i.icon}</div>
      <div class="source-body">
        <div class="source-name">${i.name}</div>
        <div class="source-meta">${i.meta}</div>
      </div>
      <button class="source-open">Open</button>
    </div>`).join('');
  section.innerHTML = `<div class="sources-group-title">${g.subject}</div>${itemsHtml}`;
  wrap.appendChild(section);
});
