/* app.js — shared UI: navbar, footer, toast, confirm dialog, role guard.
   Include on every page AFTER data.js and storage.js. */
const Pages = {};                       // page renderers register here: Pages.name = () => {...}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const App = (() => {
  const LINKS = [
    ['index.html','Home'], ['internships.html','Find Internships'],
    ['index.html#how','How It Works'], ['register.html?role=company','For Companies']
  ];
  const logoSvg = `<svg viewBox="0 0 40 40" aria-hidden="true"><polygon points="20,2 25,14 38,15 28,24 31,37 20,30 9,37 12,24 2,15 15,14" fill="#f6d55c" stroke="#2a1a12" stroke-width="3" stroke-linejoin="round"/><circle cx="15" cy="19" r="2" fill="#2a1a12"/><circle cx="25" cy="19" r="2" fill="#2a1a12"/><path d="M14 25q6 5 12 0" fill="none" stroke="#2a1a12" stroke-width="2.5" stroke-linecap="round"/></svg>`;

  const session = () => {
    const s = Store.read('session');
    return s ? Store.read('users', []).find(u => u.id === s.userId) || null : null;
  };
  const unreadCount = u => u ? Store.read('notifications', []).filter(n => n.userId === u.id && !n.read).length : 0;

  function renderNav() {
    const el = document.getElementById('site-nav'); if (!el) return;
    const u = session(), here = location.pathname.split('/').pop() || 'index.html';
    const dash = u ? { student:'student-dashboard.html', recruiter:'recruiter-dashboard.html', admin:'admin-dashboard.html' }[u.role] : null;
    const items = LINKS.map(([h,t]) => `<li><a href="${h}" ${h === here ? 'aria-current="page"' : ''}>${t}</a></li>`).join('');
    const n = unreadCount(u);
    const auth = u
      ? `<li><a href="${dash}">Dashboard</a></li>
         <li><a href="notifications.html">Alerts${n ? `<span class="nav-count" aria-label="${n} unread">${n}</span>` : ''}</a></li>
         <li><button class="btn btn-sm btn-ghost" id="logout-btn">Log out</button></li>`
      : `<li><a class="btn btn-sm btn-primary" href="login.html">Login</a></li>`;
    el.innerHTML = `<div class="demo-banner">DEMO MODE: front-end only, no real accounts or servers</div>
      <nav class="navbar" aria-label="Main"><div class="container nav-inner">
        <a class="logo" href="index.html">${logoSvg}<span>One Stop Find<small>Internship</small></span></a>
        <button class="btn btn-sm btn-ghost nav-toggle" aria-expanded="false" aria-controls="nav-list">Menu</button>
        <ul class="nav-links" id="nav-list">${items}${auth}</ul></div></nav>`;
    const t = el.querySelector('.nav-toggle'), l = el.querySelector('#nav-list');
    t.addEventListener('click', () => t.setAttribute('aria-expanded', l.classList.toggle('open')));
    el.querySelector('#logout-btn')?.addEventListener('click', () => {
      Store.write('session', null); toast('Logged out of demo.', 'info');
      setTimeout(() => location.href = 'index.html', 600);
    });
  }

  function renderFooter() {
    const el = document.getElementById('site-footer'); if (!el) return;
    el.innerHTML = `<footer class="footer"><div class="container"><div class="footer-grid">
      <div><div class="logo">${logoSvg}<span>One Stop Find Internship</span></div><p>Your next big thing starts here.</p></div>
      <div><h4>Students</h4><ul><li><a href="internships.html">Browse</a></li><li><a href="saved-internships.html">Saved</a></li></ul></div>
      <div><h4>Companies</h4><ul><li><a href="post-internship.html">Post an internship</a></li></ul></div></div>
      <p class="legal">University project demo. All companies, people and stats are fictional. Data lives only in your browser (localStorage). <a href="#" id="reset-demo">Reset demo data</a></p></div></footer>`;
    document.getElementById('reset-demo').addEventListener('click', async e => {
      e.preventDefault();
      if (await confirmDialog('Reset all demo data?', 'This clears saved items, applications and messages in this browser.', 'Reset')) {
        Store.resetDemo(); toast('Demo data reset.'); setTimeout(() => location.href = 'index.html', 600);
      }
    });
  }

  function toast(msg, type = '') {
    let w = document.querySelector('.toast-wrap');
    if (!w) {
      w = document.createElement('div'); w.className = 'toast-wrap';
      w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite'); document.body.appendChild(w);
    }
    const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; w.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  /* Accessible confirm via native <dialog>. Returns Promise<boolean>. */
  function confirmDialog(title, text, okLabel = 'Confirm') {
    return new Promise(res => {
      const d = document.createElement('dialog'); d.className = 'modal';
      d.innerHTML = `<h3>${title}</h3><p>${text}</p><div class="modal-actions">
        <button class="btn btn-ghost" value="no">Cancel</button><button class="btn btn-danger" value="yes">${okLabel}</button></div>`;
      d.addEventListener('click', e => { if (e.target.value) d.close(e.target.value); });
      d.addEventListener('close', () => { res(d.returnValue === 'yes'); d.remove(); });
      document.body.appendChild(d); d.showModal();
    });
  }

  /* Route guard. UI-only demo check, NOT real security. */
  function requireRole(role) {
    const u = session();
    if (!u || (role && u.role !== role)) {
      location.href = `login.html?next=${encodeURIComponent(location.pathname.split('/').pop())}`; return null;
    }
    return u;
  }

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '-';

  document.addEventListener('DOMContentLoaded', () => {
    Store.init(); renderNav(); renderFooter();
    const fn = Pages[document.body.dataset.page]; if (fn) fn();
  });
  return { session, toast, confirmDialog, requireRole, escapeHtml, fmtDate, renderNav };
})();
