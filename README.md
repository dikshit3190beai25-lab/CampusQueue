# CampusQueue — Student Task Management System

A modern student task management system built with vanilla HTML, CSS & JavaScript.

CampusQueue provides students with a centralized platform to manage assignments, track academic activities, view schedules, access learning resources, attend live classes, and stay updated with notifications and messages.

## Pages

| Page | File | Description |
|---|---|---|
| Loading | `index.html` | CampusQueue loading screen shown before the main dashboard |
| Dashboard | `home.html` | Main dashboard with academic overview, tasks, classes and deadlines |
| Login | `login.html` | Student login and authentication interface |
| Signup | `signup.html` | Student account creation interface |
| Calendar | `calendar.html` | Academic calendar and scheduled events |
| Assignments | `assignment.html` | Manage assignments and student tasks |
| Subjects | `subject.html` | View subjects, instructors, schedules and progress |
| Sources | `sources.html` | Learning resources and study materials |
| Live Classes | `live-class.html` | Live, upcoming and completed classes |
| Messages | `messages.html` | Student messages and conversations |
| Notifications | `notifications.html` | Academic and system notifications |
| Contact | `contact.html` | Contact information and contact form |

## Tech Stack

**HTML5** — semantic markup and page structure  
**CSS3** — custom properties, Flexbox, Grid, animations and responsive design  
**JavaScript (ES6)** — vanilla JavaScript with no frameworks  
**Chart.js** — dashboard data visualization  
**Local Storage** — client-side data persistence  

## Project Structure

```text
CampusQueue/
├── index.html
├── home.html
├── login.html
├── signup.html
├── calendar.html
├── assignment.html
├── subject.html
├── sources.html
├── live-class.html
├── messages.html
├── notifications.html
├── contact.html
│
├── css/
│   ├── assignment.css
│   ├── auth-shared.css
│   ├── base.css
│   ├── calendar.css
│   ├── contact.css
│   ├── full-list.css
│   ├── home.css
│   ├── index.css
│   ├── landing.css
│   ├── live-class.css
│   ├── login.css
│   ├── signup.css
│   ├── sources.css
│   ├── subject.css
│   └── topbar-panels.css
│
├── js/
│   ├── assignment.js
│   ├── auth.js
│   ├── calendar.js
│   ├── common.js
│   ├── contact.js
│   ├── dashboard.js
│   ├── effects.js
│   ├── full-list.js
│   ├── live-class.js
│   ├── login.js
│   ├── mobile-nav.js
│   ├── notifications-data.js
│   ├── signup.js
│   ├── sources.js
│   ├── subject.js
│   └── topbar-panels.js
│
└── README.md
```

## Features & Interactive Capabilities

📚 **Student Dashboard** — Centralized overview of academic activities, daily routine, GPA chart, enrolled classes, and countdown deadlines.

📝 **Full Assignment Management Suite** — Complete CRUD for coursework assignments, priority flags (`High`, `Medium`, `Low`), submission simulation with file uploads and grading status, plus live completion rate metrics.

📅 **Interactive Academic Calendar** — View and schedule classes, quizzes, exams, and study groups. Filter by category, view daily agendas, and export the entire schedule as an **`.ics` iCalendar file** for Google Calendar, Apple Calendar, or Outlook.

📘 **Course & Syllabus Module Tracker** — Subject management with interactive syllabus module checklists (checking off modules updates course progress percentage live) and an institutional attendance tracking record.

🎥 **Virtual Live Classroom Suite** — Live classroom simulation featuring instructor slides, microphone/camera toggles, screen share, raise hand (✋) indicator, real-time in-class chat stream, and an interactive **Collaborative Whiteboard** canvas.

🔗 **Learning Sources & Study Materials** — View, preview, and download course slide decks (PDFs), video lecture captures, and reference links. Bookmark materials and export a compiled **Course Study Bundle**.

💬 **Message Threads & Direct Messaging** — Message inbox with threaded conversation modal, quick reply composer, and new message composer.

🔔 **Notifications & Reminders** — Academic alerts, deadline warnings, and class reminders with direct action links.

📊 **GPA Calculator & Transcript Simulator** — View semester-by-semester GPA trends and simulate target grades to calculate projected cumulative GPA.

⚡ **Command Palette / Universal Quick Search** — Press `Cmd+K` or `Ctrl+K` from any page to instantly search tasks, assignments, subjects, classes, sources, and calendar events.

🔊 **Synthesized Web Audio Effects** — Zero-dependency native Web Audio API chimes for task completions, timer bells, and interactive button clicks.

👤 **Student Profile & Settings** — Manage student avatar, name, email, major, semester, and personal preferences with instant cross-page sync.

❓ **Contact & Help Center** — Message submission, office hours guide, and an expandable interactive FAQ accordion.

🔐 **Secure Client Auth & Demo Helper** — LocalStorage-backed authentication with interactive distorted canvas CAPTCHA, password toggles, password reset modal, and 1-click **Quick Demo Login**.

🌙 **Dynamic Theme Engine** — Smooth dark mode and light mode switching with ambient visual lighting effects.

## Deployment

Deployed using **Vercel** as a static website.

## Team

**CampusQueue — Student Task Management System**

Developed collaboratively by:

- **Dikshit Hasija**
- **Krishna Sareen**
- **Arnav Goel**

## License

© 2026 CampusQueue. All rights reserved.
