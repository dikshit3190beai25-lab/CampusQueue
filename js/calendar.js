const calGrid = document.getElementById('calGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const calTodayBtn = document.getElementById('calToday');
const calDoneBtn = document.getElementById('calDoneBtn');
const eventsPanel = document.getElementById('eventsPanel');

// day-of-month -> { title, type } for the currently rendered month
const events = {
  1:  { title: 'Semester check-in', type: 'later' },
  6:  { title: 'Intro to Web Design class', type: 'later' },
  9:  { title: 'Responsive Design class', type: 'later' },
  10: { title: 'Build a Simple Website Design due', type: 'urgent' },
  12: { title: 'UI Prototyping Workshop', type: 'later' },
  13: { title: 'Animation Storyboard Draft due', type: 'soon' },
  17: { title: 'Guest lecture: UX Research', type: 'later' },
  18: { title: 'Responsive Layout Case Study due', type: 'soon' },
  24: { title: 'Midterm review session', type: 'later' },
  25: { title: 'UI Prototype Handoff due', type: 'urgent' },
  28: { title: 'Study group: Animation & Multimedia', type: 'later' },
};

let calDate = new Date();
let selectedDate = new Date();

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

  const totalCells = 42; /* always 6 rows for consistent full-month view */
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
      if(events[dayNum]) el.classList.add('event');

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
        renderCalendar();
      });
    }

    calGrid.appendChild(el);
  }

  renderEventsPanel();
}

function renderEventsPanel(){
  if (!eventsPanel) return;
  eventsPanel.innerHTML = '';
  const entries = Object.entries(events).sort((a,b) => Number(a[0]) - Number(b[0]));
  if(entries.length === 0){
    eventsPanel.innerHTML = '<div class="page-sub">No events this month.</div>';
    return;
  }
  entries.forEach(([day, ev]) => {
    const isSelected = selectedDate && Number(day) === selectedDate.getDate() && calDate.getMonth() === selectedDate.getMonth();
    const row = document.createElement('div');
    row.className = 'deadline-item' + (isSelected ? ' active-event' : '');
    row.innerHTML = `
      <div class="deadline-info">
        <div class="deadline-title">${ev.title}</div>
        <div class="deadline-sub">${calDate.toLocaleString('default',{month:'short'})} ${day}</div>
      </div>
      <div class="deadline-pill ${ev.type}">${ev.type === 'urgent' ? 'Due' : ev.type === 'soon' ? 'Soon' : 'Event'}</div>`;
    eventsPanel.appendChild(row);
  });
}

const prevBtn = document.getElementById('calPrev');
const nextBtn = document.getElementById('calNext');
if(prevBtn) prevBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth()-1); renderCalendar(); });
if(nextBtn) nextBtn.addEventListener('click', () => { calDate.setMonth(calDate.getMonth()+1); renderCalendar(); });
if(calTodayBtn) calTodayBtn.addEventListener('click', () => {
  calDate = new Date();
  selectedDate = new Date();
  renderCalendar();
  if (typeof window.showToast === 'function') window.showToast('Jumped to Today', '📅');
});
if(calDoneBtn) calDoneBtn.addEventListener('click', () => {
  const formatted = selectedDate.toLocaleDateString('default', { month:'short', day:'numeric', year:'numeric' });
  if (typeof window.showToast === 'function') window.showToast(`Selected date: ${formatted}`, '✓');
});

renderCalendar();
