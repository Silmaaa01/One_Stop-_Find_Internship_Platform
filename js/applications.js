/* applications.js — student dashboard, profile, applications */
const initials = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const completion = p => {
  const parts = [p.university, p.degree, p.gradYear, p.skills.length, p.projects.length, p.certifications.length, p.portfolio, p.linkedin, p.bio, p.resume];
  return Math.round(parts.filter(Boolean).length / parts.length * 100);
};
const myApps = uid => Db.list('applications').filter(a => a.studentId === uid);

Pages.sdash = () => {
  const u = App.requireRole('student'); if (!u) return;
  const apps = myApps(u.id).filter(a => a.status !== 'withdrawn'), p = Db.profile(u.id), pct = completion(p), nowIso = Db.now();
  const count = s => apps.filter(a => a.status === s).length;
  const upcoming = apps.filter(a => a.status === 'interview' && a.interviewAt && a.interviewAt >= nowIso).sort((a, b) => a.interviewAt.localeCompare(b.interviewAt));
  const appliedIds = Db.list('applications').filter(a => a.studentId === u.id && a.status !== 'withdrawn').map(a => a.internshipId);
  const rec = Db.internships().filter(i => !appliedIds.includes(i.id)).map(i => ({ i, s: i.skills.filter(k => p.skills.map(x => x.toLowerCase()).includes(k.toLowerCase())).length }))
    .sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.i);
  const viewed = Db.viewedIds(u.id).map(Db.internship).filter(i => i && !i.removed).slice(0, 3);
  const saved = Db.savedIds(u.id).map(Db.internship).filter(i => i && !i.removed).slice(0, 3);
  const notes = Db.list('notifications').filter(n => n.userId === u.id).slice(0, 3);
  const mini = l => l.length ? `<ul class="list-plain">${l.map(i => `<li><a href="internship-details.html?id=${i.id}">${esc(i.title)}</a><br><span class="mono">${esc(i.company.name)}</span></li>`).join('')}</ul>` : '<p class="mono">Nothing here yet.</p>';
  $('#main').innerHTML = pageHead('', '', 'student') +
  `<div class="row-between" style="margin-bottom:1.5rem"><div class="job-head"><div class="avatar" aria-hidden="true">${initials(u.name)}</div><div><h1 class="h1-sm" style="margin:0">Hi, ${esc(u.name.split(' ')[0])}!</h1><p style="margin:0">Here is your internship hunt at a glance.</p></div></div>
    <div class="actions"><a class="btn btn-primary" href="internships.html">Browse opportunities</a><a class="btn btn-ghost" href="student-profile.html">Edit profile</a></div></div>
  <div class="stat-row"><div class="stat"><b>${apps.length}</b><span>Total applications</span></div><div class="stat"><b>${count('review')}</b><span>Under review</span></div>
    <div class="stat"><b>${count('shortlisted')}</b><span>Shortlisted</span></div><div class="stat"><b>${upcoming.length}</b><span>Upcoming interviews</span></div></div>
  <div class="card" style="margin-bottom:1.5rem"><div class="row-between"><h2 style="font-size:1.3rem;margin:0">Profile completion: ${pct}%</h2><a href="student-profile.html">Improve</a></div>
    <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Profile completion"><i style="width:${pct}%"></i></div></div>
  <div class="card" style="margin-bottom:1.5rem"><h2 style="font-size:1.3rem">Your application pipeline</h2>
    <ol class="pipeline">${DATA.STATUSES.map(s => `<li><b>${count(s)}</b>${statusTag(s)}<div style="margin-top:.4rem">${DATA.STATUS_HELP[s]}</div></li>`).join('')}</ol>
    <p class="mono" style="margin-top:.6rem">Flow: Applied, Under Review, Shortlisted, Interview, then Selected or Rejected.</p></div>
  <div class="grid grid-2">
    <div class="card"><h2 style="font-size:1.3rem">Upcoming interviews</h2>${upcoming.length ? `<ul class="list-plain">${upcoming.map(a => { const i = Db.internship(a.internshipId); return `<li><b>${esc(i.title)}</b><br><span class="mono">${esc(i.company.name)} | ${fmtTime(a.interviewAt)}</span></li>`; }).join('')}</ul>` : '<p class="mono">No interviews scheduled.</p>'}</div>
    <div class="card"><h2 style="font-size:1.3rem">Recent notifications</h2>${notes.length ? `<ul class="list-plain">${notes.map(n => `<li>${esc(n.text)}<br><span class="mono">${fmtTime(n.at)}</span></li>`).join('')}</ul><a href="notifications.html">All notifications</a>` : '<p class="mono">All quiet.</p>'}</div>
    <div class="card"><h2 style="font-size:1.3rem">Recommended for you</h2>${mini(rec)}</div>
    <div class="card"><h2 style="font-size:1.3rem">Saved internships</h2>${mini(saved)}<a href="saved-internships.html">View all saved</a></div>
    <div class="card"><h2 style="font-size:1.3rem">Recently viewed</h2>${mini(viewed)}</div></div>`;
};

Pages.profile = () => {
  const u = App.requireRole('student'); if (!u) return;
  const p = Db.profile(u.id), lines = a => a.join('\n');
  $('#main').innerHTML = pageHead('My profile', 'Everything here is saved only in this browser.', 'student') +
  `<div class="two-col"><form id="f" class="card" novalidate>
    ${fld('name','Full name',{value:u.name})}${fld('university','University',{value:p.university})}${fld('degree','Degree',{value:p.degree})}
    ${fld('gradYear','Graduation year',{type:'number',value:p.gradYear})}${fld('bio','Short bio',{type:'textarea',req:false,value:p.bio})}
    ${fld('skills','Skills',{value:p.skills.join(', '),hint:'Separate with commas'})}
    ${fld('projects','Projects',{type:'textarea',req:false,value:lines(p.projects),hint:'One per line'})}
    ${fld('certs','Certifications',{type:'textarea',req:false,value:lines(p.certifications),hint:'One per line'})}
    ${fld('portfolio','Portfolio link',{type:'url',req:false,value:p.portfolio})}${fld('linkedin','LinkedIn link',{type:'url',req:false,value:p.linkedin})}
    <div class="field"><label for="resume">Resume (PDF or DOC)</label><input id="resume" type="file" accept=".pdf,.doc,.docx">
      <div class="hint" id="resume-info">${p.resume ? `Saved: ${esc(p.resume.name)} (${Math.round(p.resume.size / 1024)} KB)` : 'No resume chosen yet.'}</div>
      <div class="hint">Demo note: files are never uploaded. Only the file name and size are saved in your browser, because localStorage is small (about 5 MB).</div></div>
    <button class="btn btn-primary" type="submit">Save profile</button></form>
    <aside class="card"><div class="avatar" style="margin-bottom:.6rem" aria-hidden="true">${initials(u.name)}</div><h2 style="font-size:1.3rem">Completion</h2>
      <div class="progress"><i id="bar" style="width:${completion(p)}%"></i></div><p id="pct" class="mono">${completion(p)}% complete</p></aside></div>`;
  const f = $('#f'); let resume = p.resume;
  $('#resume').addEventListener('change', e => { const x = e.target.files[0]; if (x) { resume = { name: x.name, size: x.size }; $('#resume-info').textContent = `Selected: ${x.name} (not saved until you press Save profile)`; } });
  f.addEventListener('submit', e => {
    e.preventDefault(); clearErrs(f); let ok = true; const bad = (n, m) => { setErr(f, n, m); ok = false; };
    const yr = Number(f.gradYear.value), url = v => !v || /^https?:\/\/.+/.test(v);
    if (f.name.value.trim().length < 2) bad('name', 'Enter your name.');
    if (!f.university.value.trim()) bad('university', 'Enter your university.');
    if (!f.degree.value.trim()) bad('degree', 'Enter your degree.');
    if (!(yr >= 2020 && yr <= 2035)) bad('gradYear', 'Enter a year between 2020 and 2035.');
    const skills = f.skills.value.split(',').map(s => s.trim()).filter(Boolean);
    if (!skills.length) bad('skills', 'Add at least one skill.');
    if (!url(f.portfolio.value.trim())) bad('portfolio', 'Links must start with http:// or https://');
    if (!url(f.linkedin.value.trim())) bad('linkedin', 'Links must start with http:// or https://');
    if (!ok) return App.toast('Please fix the highlighted fields.', 'error');
    const split = v => v.split('\n').map(s => s.trim()).filter(Boolean);
    const np = { university: f.university.value.trim(), degree: f.degree.value.trim(), gradYear: yr, bio: f.bio.value.trim(), skills, projects: split(f.projects.value), certifications: split(f.certs.value), portfolio: f.portfolio.value.trim(), linkedin: f.linkedin.value.trim(), resume };
    Db.setProfile(u.id, np);
    const us = Db.list('users'); us.find(x => x.id === u.id).name = f.name.value.trim(); Store.write('users', us);
    $('#bar').style.width = completion(np) + '%'; $('#pct').textContent = completion(np) + '% complete';
    App.toast('Profile saved.');
  });
};

Pages.applications = () => {
  const u = App.requireRole('student'); if (!u) return;
  $('#main').innerHTML = pageHead('My applications', 'Statuses here match your dashboard and the recruiter view.', 'student') +
    `<form id="f" class="grid grid-2" style="margin-bottom:1rem" novalidate>${fld('status','Filter by status',{req:false,options:[...DATA.STATUSES, 'withdrawn'],placeholder:'All statuses'})}${fld('sort','Sort by date applied',{req:false,options:['Newest first','Oldest first']})}</form>
    <div id="out"></div>`;
  const draw = () => {
    const v = Object.fromEntries(new FormData($('#f')));
    let r = myApps(u.id).filter(a => !v.status || a.status === v.status).sort((a, b) => (a.appliedAt.localeCompare(b.appliedAt)) * (v.sort === 'Oldest first' ? 1 : -1));
    $('#out').innerHTML = !r.length ? empty('No applications here', 'Find something that sparks joy and hit Apply.', 'internships.html', 'Browse internships') :
      `<div class="table-wrap"><table class="apps"><thead><tr><th>Internship</th><th>Company</th><th>Applied</th><th>Status</th><th>Last update</th><th>Interview</th><th>Actions</th></tr></thead><tbody>${r.map(a => {
        const i = Db.internship(a.internshipId), done = ['selected','rejected','withdrawn'].includes(a.status);
        return `<tr><td data-label="Internship"><b>${esc(i.title)}</b></td><td data-label="Company">${esc(i.company.name)}</td><td data-label="Applied">${App.fmtDate(a.appliedAt)}</td>
        <td data-label="Status">${statusTag(a.status)}</td><td data-label="Last update">${App.fmtDate(a.updatedAt)}</td><td data-label="Interview">${a.interviewAt ? fmtTime(a.interviewAt) : '-'}</td>
        <td data-label="Actions"><a class="btn btn-sm" href="internship-details.html?id=${i.id}">View details</a> ${done ? '' : `<button class="btn btn-sm btn-ghost" data-withdraw="${a.id}">Withdraw</button>`}</td></tr>`; }).join('')}</tbody></table></div>`;
  };
  $('#f').addEventListener('input', draw); $('#f').addEventListener('submit', e => e.preventDefault());
  $('#out').addEventListener('click', async e => {
    const b = e.target.closest('[data-withdraw]'); if (!b) return;
    if (await App.confirmDialog('Withdraw application?', 'The company will see it as withdrawn. You can apply again later.', 'Withdraw')) { Db.withdraw(b.dataset.withdraw); App.toast('Application withdrawn.', 'info'); draw(); }
  });
  draw();
};
