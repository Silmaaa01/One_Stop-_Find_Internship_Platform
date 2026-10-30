/* auth.js — SIMULATED login and registration. No server, no real security:
   accounts are plain records in localStorage and passwords are never stored. */
const login = (u) => {
  if (u.suspended) return false;
  Store.write('session', { userId: u.id });
  return true;
};
const goAfterLogin = u => { const n = qs.get('next'); location.href = n && /^[\w-]+\.html$/.test(n) ? n : dashFor(u); };

Pages.login = () => {
  const m = $('#main'), role0 = qs.get('role') === 'company' ? 'recruiter' : 'student';
  m.innerHTML = `<div class="auth"><div class="card"><h1 class="h1-sm">Log in</h1>
    <p class="notice">DEMO MODE: no server checks your password. Any password of 6+ characters works for a demo email.</p>
    <form id="f" novalidate style="margin-top:1rem">
      <fieldset class="seg" style="border:0;padding:0"><legend class="sr-only">Account type</legend>
        <label><input type="radio" name="role" value="student" ${role0 === 'student' ? 'checked' : ''}> Student</label>
        <label><input type="radio" name="role" value="recruiter" ${role0 === 'recruiter' ? 'checked' : ''}> Company</label></fieldset>
      ${fld('email','Email',{type:'email'})}${fld('password','Password',{type:'password'})}
      <button class="btn btn-primary" type="submit">Log in</button></form>
    <p style="margin-top:1rem">New here? <a href="register.html">Create a demo account</a></p></div>
    <div class="card" style="margin-top:1.5rem"><h2 style="font-size:1.3rem">One-click demo logins</h2>
      <div class="actions"><button class="btn btn-teal" data-demo="u_student">Student demo</button><button class="btn btn-green" data-demo="u_recruiter">Recruiter demo</button><button class="btn btn-ghost" data-demo="u_admin">Admin demo</button></div></div></div>`;
  $$('[data-demo]').forEach(b => b.addEventListener('click', () => { const u = Db.user(b.dataset.demo); login(u); App.toast(`Logged in as ${u.name} (demo).`); setTimeout(() => goAfterLogin(u), 500); }));
  const f = $('#f');
  f.addEventListener('submit', e => {
    e.preventDefault(); clearErrs(f);
    const email = f.email.value.trim().toLowerCase(), pw = f.password.value, role = f.role.value; let ok = true;
    if (!isEmail(email)) { setErr(f, 'email', 'Enter a valid email address.'); ok = false; }
    if (pw.length < 6) { setErr(f, 'password', 'Password must be at least 6 characters.'); ok = false; }
    if (!ok) return;
    const u = Db.list('users').find(x => x.email.toLowerCase() === email);
    if (!u) return setErr(f, 'email', 'No demo account with this email. Register first or use a demo login.');
    if (u.suspended) return setErr(f, 'email', 'This demo account is suspended by the admin.');
    if (u.role !== 'admin' && u.role !== role) return setErr(f, 'email', `This email belongs to a ${u.role === 'student' ? 'student' : 'company'} account. Switch the account type above.`);
    login(u); App.toast(`Welcome back, ${u.name} (demo).`); setTimeout(() => goAfterLogin(u), 500);
  });
};

Pages.register = () => {
  const m = $('#main'), role0 = qs.get('role') === 'company' ? 'recruiter' : 'student';
  m.innerHTML = `<div class="auth"><div class="card"><h1 class="h1-sm">Create account</h1>
    <p class="notice">DEMO MODE: your account is saved only in this browser. Your password is never stored.</p>
    <form id="f" novalidate style="margin-top:1rem">
      <fieldset class="seg" style="border:0;padding:0"><legend class="sr-only">Account type</legend>
        <label><input type="radio" name="role" value="student" ${role0 === 'student' ? 'checked' : ''}> Student</label>
        <label><input type="radio" name="role" value="recruiter" ${role0 === 'recruiter' ? 'checked' : ''}> Company</label></fieldset>
      ${fld('name','Full name')}<div id="co-wrap">${fld('company','Company name')}</div>
      ${fld('email','Email',{type:'email'})}${fld('password','Password',{type:'password',hint:'At least 6 characters'})}${fld('confirm','Confirm password',{type:'password'})}
      <button class="btn btn-primary" type="submit">Create account</button></form>
    <p style="margin-top:1rem">Already registered? <a href="login.html">Log in</a></p></div></div>`;
  const f = $('#f'), sync = () => { $('#co-wrap').hidden = f.role.value !== 'recruiter'; };
  $$('[name=role]', f).forEach(r => r.addEventListener('change', sync)); sync();
  f.addEventListener('submit', e => {
    e.preventDefault(); clearErrs(f); let ok = true;
    const role = f.role.value, name = f.name.value.trim(), email = f.email.value.trim().toLowerCase(), co = f.company.value.trim();
    const bad = (n, msg) => { setErr(f, n, msg); ok = false; };
    if (name.length < 2) bad('name', 'Enter your full name.');
    if (role === 'recruiter' && co.length < 2) bad('company', 'Enter your company name.');
    if (!isEmail(email)) bad('email', 'Enter a valid email address.');
    else if (Db.list('users').some(u => u.email.toLowerCase() === email)) bad('email', 'This email is already registered in the demo.');
    if (f.password.value.length < 6) bad('password', 'Use at least 6 characters.');
    if (f.confirm.value !== f.password.value) bad('confirm', 'Passwords do not match.');
    if (!ok) return;
    const users = Db.list('users'), u = { id: Store.uid('u'), role, name, email };
    if (role === 'recruiter') {
      const cs = Db.list('companies'), colors = ['#e5412d','#2f5d3a','#7c3aed','#2f7a76','#d9622b'];
      const c = { id: Store.uid('c'), name: co, initials: co.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), color: colors[cs.length % 5], verified: false, about: 'New demo company awaiting verification.' };
      cs.push(c); Store.write('companies', cs); u.companyId = c.id;
    }
    users.push(u); Store.write('users', users); login(u);
    App.toast('Demo account created.'); setTimeout(() => location.href = dashFor(u), 600);
  });
};
