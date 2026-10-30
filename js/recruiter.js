/* recruiter.js — recruiter dashboard, post internship, manage applicants, admin.
   Role checks are UI-only demo guards, NOT real security. */
const bars = (rows, max) => rows.map(([l, n]) => `<div class="bar-row"><span>${esc(l)}</span><div class="bar"><i style="width:${max ? Math.round(n / max * 100) : 0}%"></i></div><b>${n}</b></div>`).join('');
const myListings = u => Db.list('internships').filter(i => i.companyId === u.companyId && !i.removed);
const companyApps = u => { const ids = myListings(u).map(i => i.id); return Db.list('applications').filter(a => ids.includes(a.internshipId)); };

function modal(html) {
  const d = document.createElement('dialog'); d.className = 'modal'; d.innerHTML = html;
  d.addEventListener('click', e => { if (e.target.closest('[data-close]')) d.close(); });
  d.addEventListener('close', () => d.remove()); document.body.appendChild(d); d.showModal(); return d;
}
function candidateModal(a) {
  const s = Db.user(a.studentId), p = Db.profile(a.studentId), i = Db.internship(a.internshipId);
  modal(`<h3>${esc(s.name)}</h3><p class="mono">Applied for ${esc(i.title)} | ${statusTag(a.status)}</p>
    <ul class="list-plain"><li>${esc(p.degree || 'Degree not set')}, ${esc(p.university || 'University not set')} (${esc(p.gradYear || '-')})</li>
    <li>Skills: ${p.skills.map(x => `<span class="chip">${esc(x)}</span>`).join('') || '-'}</li><li>Projects: ${esc(p.projects.join('; ') || '-')}</li>
    <li>Certifications: ${esc(p.certifications.join('; ') || '-')}</li><li>Bio: ${esc(p.bio || '-')}</li>
    <li>Resume: ${p.resume ? `${esc(p.resume.name)} (demo file info only)` : 'Not provided'}</li></ul>
    <div class="modal-actions"><button class="btn" data-close>Close</button></div>`);
}

Pages.rdash = () => {
  const u = App.requireRole('recruiter'); if (!u) return;
  const co = Db.company(u.companyId), ls = myListings(u), apps = companyApps(u), today = Db.today();
  const n = s => apps.filter(a => a.status === s).length, upcoming = apps.filter(a => a.status === 'interview' && a.interviewAt && a.interviewAt >= Db.now());
  const recent = [...apps].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 5);
  $('#main').innerHTML = pageHead('', '', 'recruiter') +
  `<div class="row-between" style="margin-bottom:1.5rem"><div class="job-head">${mark(co, 'lg')}<div><h1 class="h1-sm" style="margin:0">${esc(co.name)}</h1>
    <p style="margin:0">${co.verified === true ? '<span class="badge badge-paid">Verified</span>' : co.verified === 'rejected' ? '<span class="badge">Verification declined</span>' : '<span class="badge badge-hybrid">Verification pending</span>'} <span class="mono">(set by the demo admin)</span></p></div></div>
    <div class="actions"><a class="btn btn-primary" href="post-internship.html">Post a new internship</a><a class="btn btn-ghost" href="manage-applicants.html">Review applicants</a></div></div>
  <p class="notice" style="margin-bottom:1rem">Demo metrics: calculated from sample data in your browser.</p>
  <div class="stat-row"><div class="stat"><b>${ls.length}</b><span>Total listings</span></div><div class="stat"><b>${ls.filter(i => i.deadline >= today).length}</b><span>Active listings</span></div>
    <div class="stat"><b>${apps.length}</b><span>Applications</span></div><div class="stat"><b>${n('shortlisted')}</b><span>Shortlisted</span></div><div class="stat"><b>${upcoming.length}</b><span>Upcoming interviews</span></div></div>
  <div class="grid grid-2"><div class="card"><h2 style="font-size:1.3rem">Recent applications</h2>${recent.length ? `<ul class="list-plain">${recent.map(a => `<li><b>${esc(Db.user(a.studentId).name)}</b> for ${esc(Db.internship(a.internshipId).title)} ${statusTag(a.status)}</li>`).join('')}</ul>` : '<p class="mono">No applications yet.</p>'}</div>
    <div class="card"><h2 style="font-size:1.3rem">Application statistics</h2>${bars(DATA.STATUSES.map(s => [DATA.STATUS_LABELS[s], n(s)]), Math.max(1, ...DATA.STATUSES.map(n)))}</div></div>`;
};

Pages.post = () => {
  const u = App.requireRole('recruiter'); if (!u) return;
  const co = Db.company(u.companyId);
  $('#main').innerHTML = pageHead('Post an internship', 'The listing is added to your browser and appears in the search page.', 'recruiter') +
  `<form id="f" class="card" novalidate>
    <div class="grid grid-2"><div>${fld('title','Internship title')}${fld('category','Department or category',{options:DATA.CATEGORIES,placeholder:'Choose one'})}${fld('company','Company name',{value:co.name})}
      ${fld('location','Location')}${fld('mode','Work arrangement',{options:['remote','hybrid','onsite'],placeholder:'Choose one'})}${fld('duration','Duration',{hint:'For example: 3 months'})}</div>
    <div>${fld('stipend','Monthly stipend in BDT',{type:'number',value:'0',hint:'Use 0 for unpaid'})}${fld('openings','Number of openings',{type:'number',value:'1'})}${fld('deadline','Application deadline',{type:'date'})}
      ${fld('skills','Required skills',{hint:'Separate with commas'})}${fld('contact','Contact or application instructions')}</div></div>
    ${fld('description','Description',{type:'textarea'})}${fld('responsibilities','Responsibilities',{type:'textarea',hint:'One per line'})}${fld('qualifications','Qualifications',{type:'textarea',hint:'One per line'})}
    <button class="btn btn-primary" type="submit">Publish internship</button></form>`;
  const f = $('#f');
  f.addEventListener('submit', e => {
    e.preventDefault(); clearErrs(f); let ok = true; const bad = (n, m) => { setErr(f, n, m); ok = false; };
    ['title','category','company','location','mode','duration','deadline','skills','contact','description','responsibilities','qualifications'].forEach(n => { if (!f[n].value.trim()) bad(n, 'This field is required.'); });
    if (f.title.value.trim() && f.title.value.trim().length < 4) bad('title', 'Use at least 4 characters.');
    if (!(Number(f.stipend.value) >= 0) || f.stipend.value === '') bad('stipend', 'Enter 0 or a positive number.');
    if (!(Number(f.openings.value) >= 1)) bad('openings', 'At least 1 opening.');
    if (f.deadline.value && f.deadline.value < Db.today()) bad('deadline', 'Deadline cannot be in the past.');
    if (!ok) return App.toast('Please fix the highlighted fields.', 'error');
    const split = v => v.split('\n').map(s => s.trim()).filter(Boolean);
    const list = Db.list('internships');
    const i = { id: Store.uid('i'), companyId: u.companyId, title: f.title.value.trim(), category: f.category.value, location: f.location.value.trim(), mode: f.mode.value,
      skills: f.skills.value.split(',').map(s => s.trim()).filter(Boolean), stipend: Number(f.stipend.value), duration: f.duration.value.trim(), deadline: f.deadline.value, posted: Db.today(),
      openings: Number(f.openings.value), description: f.description.value.trim(), responsibilities: split(f.responsibilities.value), qualifications: split(f.qualifications.value), preferred: [], contact: f.contact.value.trim() };
    list.push(i); Store.write('internships', list);
    const cs = Db.list('companies'); cs.find(c => c.id === u.companyId).name = f.company.value.trim(); Store.write('companies', cs);
    App.toast('Internship published (demo).'); setTimeout(() => location.href = `internship-details.html?id=${i.id}`, 700);
  });
};

Pages.applicants = () => {
  const u = App.requireRole('recruiter'); if (!u) return;
  $('#main').innerHTML = pageHead('Manage applicants', 'Changes here update the student view instantly (same browser).', 'recruiter') +
    `<form id="f" class="grid grid-2" style="margin-bottom:1rem" novalidate>${fld('q','Search name or skill',{req:false})}${fld('status','Status',{req:false,options:[...DATA.STATUSES,'withdrawn'],placeholder:'All statuses'})}</form><div id="out"></div>`;
  const draw = () => {
    const v = Object.fromEntries(new FormData($('#f'))), q = (v.q || '').toLowerCase();
    const r = companyApps(u).filter(a => { const s = Db.user(a.studentId), p = Db.profile(a.studentId); return (!v.status || a.status === v.status) && (!q || (s.name + ' ' + p.skills.join(' ')).toLowerCase().includes(q)); });
    $('#out').innerHTML = !r.length ? empty('No applicants found', 'Try another filter, or post a new internship to attract more.', 'post-internship.html', 'Post an internship') :
      `<div class="table-wrap"><table class="apps"><thead><tr><th>Candidate</th><th>Internship</th><th>Skills</th><th>Status</th><th>Interview</th><th>Actions</th></tr></thead><tbody>${r.map(a => {
        const s = Db.user(a.studentId), p = Db.profile(a.studentId), st = a.status, open = !['selected','rejected','withdrawn'].includes(st);
        const b = (act, label, cls = '') => `<button class="btn btn-sm ${cls}" data-act="${act}" data-id="${a.id}">${label}</button>`;
        return `<tr><td data-label="Candidate"><b>${esc(s.name)}</b></td><td data-label="Internship">${esc(Db.internship(a.internshipId).title)}</td><td data-label="Skills">${p.skills.slice(0, 3).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</td>
        <td data-label="Status">${statusTag(st)}</td><td data-label="Interview">${a.interviewAt ? fmtTime(a.interviewAt) : '-'}</td>
        <td data-label="Actions">${b('view', 'Profile', 'btn-ghost')} ${st === 'applied' ? b('review', 'Start review') : ''} ${['applied','review'].includes(st) ? b('shortlisted', 'Shortlist', 'btn-teal') : ''}
        ${open && st !== 'interview' ? b('interview', 'Interview', 'btn-green') : ''} ${st === 'interview' ? b('interview', 'Reschedule', 'btn-ghost') + b('selected', 'Select', 'btn-green') : ''} ${open ? b('rejected', 'Reject', 'btn-danger') : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  };
  $('#f').addEventListener('input', draw); $('#f').addEventListener('submit', e => e.preventDefault());
  $('#out').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = Db.list('applications').find(x => x.id === b.dataset.id), act = b.dataset.act;
    if (act === 'view') return candidateModal(a);
    if (act === 'rejected') { if (!await App.confirmDialog('Reject this candidate?', `${esc(Db.user(a.studentId).name)} will see the status Rejected.`, 'Reject')) return; Db.setStatus(a.id, 'rejected'); App.toast('Candidate rejected.', 'info'); return draw(); }
    if (act === 'interview') {
      const d = modal(`<h3>Schedule interview</h3><form id="idf" novalidate><div class="field"><label for="when">Date and time</label><input id="when" type="datetime-local" value="${a.interviewAt || ''}"><div class="error-msg" id="when-err" role="alert"></div></div>
        <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-green" type="submit">Save</button></div></form>`);
      d.querySelector('#idf').addEventListener('submit', ev => { ev.preventDefault(); const w = d.querySelector('#when').value;
        if (!w || w < Db.now()) return d.querySelector('#when-err').textContent = 'Pick a date and time in the future.';
        Db.setStatus(a.id, 'interview', w); d.close(); App.toast('Interview scheduled.'); draw(); });
      return;
    }
    Db.setStatus(a.id, act); App.toast(`Status updated to ${DATA.STATUS_LABELS[act]}.`); draw();
  });
  draw();
};

Pages.admin = () => {
  const u = App.requireRole('admin'); if (!u) return;
  const render = () => {
    const users = Db.list('users'), cos = Db.list('companies'), ints = Db.list('internships').filter(i => !i.removed), reps = Db.list('reports').filter(r => ints.some(i => i.id === r.internshipId));
    const pending = cos.filter(c => c.verified === false), apps = Db.list('applications');
    $('#main').innerHTML = pageHead('Admin dashboard', 'Simulated moderation tools using sample data only.', 'admin') +
    `<p class="notice" style="margin-bottom:1rem">Demo only: these controls change data in your browser, nothing else.</p>
    <div class="stat-row"><div class="stat"><b>${users.filter(x => x.role === 'student').length}</b><span>Students</span></div><div class="stat"><b>${cos.length}</b><span>Companies</span></div><div class="stat"><b>${ints.length}</b><span>Listings</span></div>
      <div class="stat"><b>${pending.length}</b><span>Pending verification</span></div><div class="stat"><b>${reps.length}</b><span>Reported listings</span></div></div>
    <div class="grid grid-2" style="margin-bottom:1.5rem"><div class="card"><h2 style="font-size:1.3rem">Company verification</h2>${pending.length ? `<ul class="list-plain">${pending.map(c => `<li class="row-between"><span>${esc(c.name)}</span><span><button class="btn btn-sm btn-green" data-v="${c.id}">Approve</button> <button class="btn btn-sm btn-danger" data-x="${c.id}">Decline</button></span></li>`).join('')}</ul>` : '<p class="mono">No pending requests.</p>'}</div>
      <div class="card"><h2 style="font-size:1.3rem">Reported listings</h2>${reps.length ? `<ul class="list-plain">${reps.map(r => `<li><b>${esc(Db.internship(r.internshipId).title)}</b><br>${esc(r.reason)}<br><button class="btn btn-sm btn-danger" data-rm="${r.id}">Remove listing</button> <button class="btn btn-sm btn-ghost" data-dis="${r.id}">Dismiss report</button></li>`).join('')}</ul>` : '<p class="mono">No reports. Nice.</p>'}</div></div>
    <div class="card" style="margin-bottom:1.5rem"><h2 style="font-size:1.3rem">User management</h2><div class="table-wrap"><table class="apps"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>${users.map(x => `<tr><td data-label="Name">${esc(x.name)}</td><td data-label="Email">${esc(x.email)}</td><td data-label="Role">${x.role}</td><td data-label="Status">${x.suspended ? 'Suspended' : 'Active'}</td><td data-label="Action">${x.role === 'admin' ? '-' : `<button class="btn btn-sm btn-ghost" data-su="${x.id}">${x.suspended ? 'Reactivate' : 'Suspend'}</button>`}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="grid grid-2"><div class="card"><h2 style="font-size:1.3rem">Listings by category</h2>${bars(DATA.CATEGORIES.map(c => [c, ints.filter(i => i.category === c).length]), Math.max(1, ...DATA.CATEGORIES.map(c => ints.filter(i => i.category === c).length)))}</div>
      <div class="card"><h2 style="font-size:1.3rem">Applications by status</h2>${bars([...DATA.STATUSES, 'withdrawn'].map(s => [DATA.STATUS_LABELS[s], apps.filter(a => a.status === s).length]), Math.max(1, apps.length))}</div></div>`;
  };
  const upd = (k, fn) => { const l = Db.list(k); fn(l); Store.write(k, l); render(); };
  $('#main').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (d.v) { upd('companies', l => { l.find(c => c.id === d.v).verified = true; }); App.toast('Company verified.'); }
    else if (d.x) { upd('companies', l => { l.find(c => c.id === d.x).verified = 'rejected'; }); App.toast('Verification declined.', 'info'); }
    else if (d.rm) { if (!await App.confirmDialog('Remove this listing?', 'It disappears from search for everyone in this demo.', 'Remove')) return;
      const r = Db.list('reports').find(x => x.id === d.rm); upd('internships', l => { l.find(i => i.id === r.internshipId).removed = true; }); App.toast('Listing removed.', 'info'); }
    else if (d.dis) { upd('reports', l => l.splice(l.findIndex(r => r.id === d.dis), 1)); App.toast('Report dismissed.', 'info'); }
    else if (d.su) { upd('users', l => { const x = l.find(y => y.id === d.su); x.suspended = !x.suspended; }); App.toast('User updated.'); }
  });
  render();
};
