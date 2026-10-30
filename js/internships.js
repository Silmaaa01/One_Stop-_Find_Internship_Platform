/* internships.js — shared UI helpers + landing, listing, details, saved pages */
const esc = App.escapeHtml;
const qs = new URLSearchParams(location.search);
const money = n => n > 0 ? `৳${Number(n).toLocaleString('en-US')}/mo` : 'Unpaid';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const modeBadge = m => `<span class="badge badge-${m}">${cap(m)}</span>`;
const mark = (c, lg = '') => `<span class="mark ${lg}" style="background:${c.color}" aria-hidden="true">${esc(c.initials)}</span>`;
const statusTag = s => `<span class="status status-${s}">${DATA.STATUS_LABELS[s] || s}</span>`;
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 864e5);
const fmtTime = t => t ? new Date(t).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }) : '-';
const dashFor = u => ({ student:'student-dashboard.html', recruiter:'recruiter-dashboard.html', admin:'admin-dashboard.html' })[u.role];
const empty = (title, text, href, label) => `<div class="empty"><h3>${title}</h3><p style="margin-inline:auto">${text}</p>${href ? `<a class="btn" href="${href}">${label}</a>` : ''}</div>`;

/* Section header with role sub-navigation */
function pageHead(title, sub, role) {
  const nav = {
    student:[['student-dashboard.html','Dashboard'],['student-profile.html','Profile'],['applications.html','Applications'],['saved-internships.html','Saved'],['messages.html','Messages'],['notifications.html','Notifications']],
    recruiter:[['recruiter-dashboard.html','Dashboard'],['post-internship.html','Post internship'],['manage-applicants.html','Applicants'],['messages.html','Messages'],['notifications.html','Notifications']],
    admin:[['admin-dashboard.html','Admin']]
  }[role] || [];
  const here = location.pathname.split('/').pop();
  return `<ul class="subnav" aria-label="Section">${nav.map(([h,t]) => `<li><a href="${h}" ${h === here ? 'aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul>
    ${title ? `<h1 class="h1-sm">${title}</h1>` : ''}${sub ? `<p>${sub}</p>` : ''}`;
}

/* Form helpers */
function fld(name, label, o = {}) {
  const { type = 'text', value = '', options = null, hint = '', req = true, attrs = '' } = o;
  const common = `id="${name}" name="${name}" aria-describedby="${name}-err" ${attrs}`;
  let ctl;
  if (type === 'textarea') ctl = `<textarea ${common}>${esc(value)}</textarea>`;
  else if (options) ctl = `<select ${common}>${o.placeholder ? `<option value="">${o.placeholder}</option>` : ''}${options.map(x => `<option ${x === value ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
  else if (type === 'password') ctl = `<div class="pw"><input type="password" ${common}><button type="button" class="btn btn-sm btn-ghost" data-toggle-pw="${name}" aria-pressed="false">Show</button></div>`;
  else ctl = `<input type="${type}" ${common} value="${esc(value)}">`;
  return `<div class="field"><label for="${name}">${label}${req ? '' : ' (optional)'}</label>${ctl}${hint ? `<div class="hint">${hint}</div>` : ''}<div class="error-msg" id="${name}-err" role="alert"></div></div>`;
}
function setErr(f, n, m) {
  const el = f.elements[n]; if (!el) return;
  el.setAttribute('aria-invalid', m ? 'true' : 'false');
  const e = f.querySelector(`#${n}-err`); if (e) e.textContent = m || '';
}
function clearErrs(f) { [...f.elements].forEach(el => el.name && setErr(f, el.name, '')); }
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* Internship card */
function card(i, o = {}) {
  const u = App.session(), saved = u && Db.isSaved(u.id, i.id), d = daysLeft(i.deadline);
  return `<article class="card job">
    <div class="job-head">${mark(i.company)}<div><h3><a href="internship-details.html?id=${i.id}">${esc(i.title)}</a></h3>
      <p class="co">${esc(i.company.name)}${i.company.verified === true ? ' (verified)' : ''}</p></div></div>
    <p>${modeBadge(i.mode)} <span class="badge">${esc(i.category)}</span> <span class="badge ${i.stipend ? 'badge-paid' : 'badge-unpaid'}">${money(i.stipend)}</span></p>
    <p class="meta">${esc(i.location)} | ${esc(i.duration)}<br>Deadline: ${App.fmtDate(i.deadline)}${d < 0 ? ' (closed)' : d <= 7 ? ` (${d} days left)` : ''}</p>
    <p>${i.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</p>
    <div class="actions"><a class="btn btn-sm" href="internship-details.html?id=${i.id}">View details</a>
      <button class="btn btn-sm btn-ghost" data-save="${i.id}" aria-pressed="${!!saved}">${saved ? '★ Saved' : '☆ Save'}</button>
      ${o.apply ? `<button class="btn btn-sm btn-primary" data-apply="${i.id}">Apply</button>` : ''}</div></article>`;
}

/* Global save / apply handlers */
async function applyTo(id) {
  const u = App.session();
  if (!u || u.role !== 'student') { App.toast('Log in as a student (demo) to apply.', 'error'); return; }
  const i = Db.internship(id);
  if (!await App.confirmDialog(`Apply to ${esc(i.title)}?`, `Your demo profile will be sent to ${esc(i.company.name)}. Nothing leaves this browser.`, 'Apply')) return;
  if (!Db.apply(id, u.id)) { App.toast('You already applied to this internship.', 'error'); return; }
  App.toast('Application submitted (demo).'); App.renderNav();
  document.dispatchEvent(new CustomEvent('apps-changed'));
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-save]');
  if (s) {
    const u = App.session();
    if (!u || u.role !== 'student') { App.toast('Log in as a student (demo) to save internships.', 'error'); return; }
    const on = Db.toggleSave(u.id, s.dataset.save);
    s.textContent = on ? '★ Saved' : '☆ Save'; s.setAttribute('aria-pressed', on);
    App.toast(on ? 'Saved to your list.' : 'Removed from saved.');
    document.dispatchEvent(new CustomEvent('saved-changed')); return;
  }
  const a = e.target.closest('[data-apply]'); if (a) applyTo(a.dataset.apply);
  const t = e.target.closest('[data-toggle-pw]');
  if (t) { const inp = document.getElementById(t.dataset.togglePw), show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; t.textContent = show ? 'Hide' : 'Show'; t.setAttribute('aria-pressed', show); }
});

/* ---------- Landing: featured ---------- */
Pages.home = () => {
  $('#featured').innerHTML = Db.internships().sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3).map(i => card(i)).join('');
};

/* ---------- Listing ---------- */
Pages.internships = () => {
  const m = $('#main'), all = Db.internships(), PAGE = 6; let shown = PAGE;
  m.innerHTML = `<h1 class="h1-sm">Find internships</h1>
  <div class="layout">
    <form id="f" class="card filters" aria-label="Filter internships" novalidate>
      ${fld('q','Title, company or skill',{req:false,value:qs.get('q') || ''})}
      ${fld('cat','Category',{req:false,options:DATA.CATEGORIES,placeholder:'All categories',value:qs.get('cat') || ''})}
      ${fld('loc','Location',{req:false,value:qs.get('loc') || ''})}
      ${fld('mode','Work mode',{req:false,options:['remote','hybrid','onsite'],placeholder:'Any mode'})}
      ${fld('pay','Pay',{req:false,options:['Paid','Unpaid'],placeholder:'Paid or unpaid'})}
      ${fld('dur','Duration',{req:false,options:['Up to 2 months','3 months','4 months or more'],placeholder:'Any duration'})}
      ${fld('sort','Sort by',{req:false,options:['Newest','Deadline','Stipend']})}
      <button type="button" id="reset" class="btn btn-ghost btn-sm">Clear filters</button>
    </form>
    <section aria-live="polite"><p id="count" class="mono"></p><div id="list" class="grid grid-auto"></div>
      <div class="center"><button id="more" class="btn">Load more</button></div></section></div>`;
  const f = $('#f');
  const months = s => parseInt(s, 10) || 0;
  const run = () => {
    const v = Object.fromEntries(new FormData(f)), q = (v.q || '').toLowerCase().trim(), loc = (v.loc || '').toLowerCase().trim();
    let r = all.filter(i =>
      (!q || [i.title, i.company.name, ...i.skills].join(' ').toLowerCase().includes(q)) &&
      (!v.cat || i.category === v.cat) && (!loc || i.location.toLowerCase().includes(loc)) &&
      (!v.mode || i.mode === v.mode) && (!v.pay || (v.pay === 'Paid') === i.stipend > 0) &&
      (!v.dur || (v.dur === 'Up to 2 months' ? months(i.duration) <= 2 : v.dur === '3 months' ? months(i.duration) === 3 : months(i.duration) >= 4)));
    r.sort(v.sort === 'Deadline' ? (a, b) => a.deadline.localeCompare(b.deadline) : v.sort === 'Stipend' ? (a, b) => b.stipend - a.stipend : (a, b) => b.posted.localeCompare(a.posted));
    $('#count').textContent = `${r.length} internship${r.length === 1 ? '' : 's'} found`;
    $('#list').innerHTML = r.length ? r.slice(0, shown).map(i => card(i)).join('') : `<div style="grid-column:1/-1">${empty('No matches yet','Try fewer filters or a different keyword.')}</div>`;
    $('#more').hidden = shown >= r.length;
  };
  f.addEventListener('input', () => { shown = PAGE; run(); });
  f.addEventListener('submit', e => e.preventDefault());
  $('#more').addEventListener('click', () => { shown += PAGE; run(); });
  $('#reset').addEventListener('click', () => { f.reset(); shown = PAGE; run(); });
  run();
};

/* ---------- Details ---------- */
Pages.details = () => {
  const m = $('#main'), i = Db.internship(qs.get('id'));
  if (!i || i.removed) { m.innerHTML = empty('Internship not found', 'It may have been removed.', 'internships.html', 'Browse internships'); return; }
  const u = App.session(); if (u && u.role === 'student') Db.addViewed(u.id, i.id);
  const li = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const similar = Db.internships().filter(x => x.id !== i.id).sort((a, b) => (b.category === i.category) - (a.category === i.category)).slice(0, 2);
  const draw = () => {
    const u2 = App.session(), ex = u2 && Db.list('applications').find(a => a.internshipId === i.id && a.studentId === u2.id && a.status !== 'withdrawn');
    $('#cta').innerHTML = ex ? `<p>You applied on ${App.fmtDate(ex.appliedAt)}. ${statusTag(ex.status)}</p><a class="btn btn-sm" href="applications.html">Track application</a>`
      : (u2 && u2.role !== 'student') ? `<p class="notice">Switch to the student demo to apply.</p>`
      : `<button class="btn btn-primary" data-apply="${i.id}">Apply now</button>`;
    const sv = u2 && Db.isSaved(u2.id, i.id);
    $('#save').textContent = sv ? '★ Saved' : '☆ Save internship'; $('#save').setAttribute('aria-pressed', !!sv);
  };
  m.innerHTML = `<p><a href="internships.html">Back to all internships</a></p>
  <div class="two-col"><div>
    <div class="job-head" style="margin-bottom:1rem">${mark(i.company, 'lg')}<div><h1 class="h1-sm" style="margin:0">${esc(i.title)}</h1><p style="margin:0">${esc(i.company.name)}</p></div></div>
    <p>${modeBadge(i.mode)} <span class="badge">${esc(i.category)}</span> <span class="badge ${i.stipend ? 'badge-paid' : 'badge-unpaid'}">${money(i.stipend)}</span></p>
    <h2>About the role</h2><p>${esc(i.description)}</p>
    <h3>Responsibilities</h3>${li(i.responsibilities)}
    <h3>Required qualifications and skills</h3>${li([...i.qualifications, ...i.skills.map(s => 'Skill: ' + s)])}
    <h3>Preferred</h3>${li(i.preferred || [])}
    <h3>About ${esc(i.company.name)}</h3><p>${esc(i.company.about || '')}</p></div>
  <aside class="card"><h2 style="font-size:1.4rem">At a glance</h2>
    <ul class="list-plain mono"><li>Duration: ${esc(i.duration)}</li><li>Stipend: ${money(i.stipend)}</li><li>Location: ${esc(i.location)} (${cap(i.mode)})</li><li>Openings: ${i.openings || 1}</li><li>Deadline: ${App.fmtDate(i.deadline)}</li></ul>
    <div id="cta" style="margin:1rem 0"></div><button id="save" class="btn btn-ghost btn-sm" data-save="${i.id}"></button></aside></div>
  <h2 style="margin-top:2rem">Similar internships</h2><div class="grid grid-auto">${similar.map(x => card(x)).join('')}</div>`;
  draw(); document.addEventListener('apps-changed', draw); document.addEventListener('saved-changed', draw);
};

/* ---------- Saved ---------- */
Pages.saved = () => {
  const u = App.requireRole('student'); if (!u) return;
  $('#main').innerHTML = pageHead('Saved internships', 'Your bookmarks stay in this browser, even after a refresh.', 'student') +
    `<form id="f" class="grid grid-2" style="margin-bottom:1rem" novalidate>${fld('q','Search saved',{req:false})}${fld('cat','Category',{req:false,options:DATA.CATEGORIES,placeholder:'All categories'})}</form><div id="list" class="grid grid-auto"></div>`;
  const draw = () => {
    const v = Object.fromEntries(new FormData($('#f'))), q = (v.q || '').toLowerCase();
    const r = Db.savedIds(u.id).map(Db.internship).filter(i => i && !i.removed && (!v.cat || i.category === v.cat) && (!q || (i.title + i.company.name + i.skills.join(' ')).toLowerCase().includes(q)));
    $('#list').innerHTML = r.length ? r.map(i => card(i, { apply:true })).join('') : `<div style="grid-column:1/-1">${empty('Nothing saved here','Tap Save on any internship to keep it for later.','internships.html','Browse internships')}</div>`;
  };
  $('#f').addEventListener('input', draw); $('#f').addEventListener('submit', e => e.preventDefault());
  document.addEventListener('saved-changed', draw); draw();
};
