/* =========================================================
   mobile-nav.js
   Powers the off-canvas sidebar on small screens: opens on
   hamburger tap, closes on backdrop click, Escape, or
   navigating to another page via a sidebar link.
   Include on every page, near the top of the script list.
   Below the 860px breakpoint base.css shows the sidebar as a
   sliding drawer; at 860px+ CSS keeps it permanently visible
   and this script becomes a no-op.
   ========================================================= */
(function () {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.getElementById('menuToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar || !toggle) return;

  function openMenu() {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('show');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeMenu() : openMenu();
  });

  if (backdrop) backdrop.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  sidebar.querySelectorAll('a.nav-item').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
})();
