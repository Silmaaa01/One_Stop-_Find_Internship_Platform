/* messaging.js — SIMULATED in-app messages and notifications (frontend demo only) */
Pages.messages = () => {
  const u = App.requireRole(); if (!u) return;
  if (u.role === 'admin') { $('#main').innerHTML = empty('Messages are for students and companies', 'Switch to a student or recruiter demo to try the chat.', 'login.html', 'Switch demo user'); return; }
  const role = u.role === 'student' ? 'student' : 'recruiter';
  let active = qs.get('c') || null;
  $('#main').innerHTML = pageHead('Communication center', '', role) +
    `<p class="notice" style="margin-bottom:1rem">Frontend demonstration: messages stay in this browser and are not sent to any real company or student.</p>
     <form id="nf" class="row-between card" style="margin-bottom:1rem" novalidate><div class="field" style="flex:1;min-width:220px;margin:0"><label for="target">Start a conversation</label><select id="target"></select></div><button class="btn btn-sm" type="submit">Open chat</button></form>
     <div id="chat" class="card chat"></div>`;
  const mine = () => Db.list('conversations').filter(c => role === 'student' ? c.studentId === u.id : c.companyId === u.companyId);
  const otherName = c => role === 'student' ? (Db.company(c.companyId) || {}).name : (Db.user(c.studentId) || {}).name;
  const targets = () => {
    const apps = Db.list('applications');
    if (role === 'student') { const ids = [...new Set(apps.filter(a => a.studentId === u.id).map(a => Db.internship(a.internshipId).companyId))]; return ids.map(id => ({ k: `${u.id}|${id}`, label: Db.company(id).name })); }
    const mineI = Db.list('internships').filter(i => i.companyId === u.companyId).map(i => i.id);
    return [...new Set(apps.filter(a => mineI.includes(a.internshipId)).map(a => a.studentId))].map(id => ({ k: `${id}|${u.companyId}`, label: Db.user(id).name }));
  };
  const draw = () => {
    const cs = mine(); const cur = cs.find(c => c.id === active);
    if (cur) Db.markRead(cur.id, role);
    const list = cs.length ? cs.map(c => { const last = c.messages[c.messages.length - 1], un = Db.list('conversations').find(x => x.id === c.id).unread[role];
      return `<button class="conv" data-c="${c.id}" aria-current="${c.id === active}"><b>${esc(otherName(c))}</b> ${un ? `<span class="nav-count">${un} new</span>` : ''}<br><span class="mono">${last ? esc(last.text.slice(0, 40)) : 'No messages yet'}</span></button>`; }).join('')
      : '<div style="padding:1rem">No conversations yet. Use "Start a conversation" above.</div>';
    const thread = !cur ? `<div class="empty" style="margin:1rem">Select a conversation to read it.</div>` :
      `<div class="msgs" aria-live="polite">${cur.messages.length ? cur.messages.map(m => `<div class="msg ${m.from === role ? 'me' : ''}">${esc(m.text)}<time>${esc(m.from === 'student' ? (Db.user(cur.studentId) || {}).name : (Db.company(cur.companyId) || {}).name)} | ${fmtTime(m.at)}</time></div>`).join('') : '<p class="mono">Say hello to start the chat.</p>'}</div>
       <form class="composer" id="cf"><label class="sr-only" for="txt">Message</label><input id="txt" autocomplete="off" placeholder="Write a message"><button class="btn btn-primary btn-sm" type="submit">Send</button></form>`;
    $('#chat').innerHTML = `<div class="conv-list">${list}</div><div class="thread">${thread}</div>`;
    const box = $('.msgs'); if (box) box.scrollTop = box.scrollHeight;
    App.renderNav();
  };
  $('#chat').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { active = b.dataset.c; draw(); } });
  $('#chat').addEventListener('submit', e => {
    e.preventDefault(); const t = $('#txt').value.trim(); if (!t) return;
    Db.send(active, role, t); const id = active;
    if (role === 'student') setTimeout(() => { Db.send(id, 'recruiter', 'Thanks for your message! (automatic demo reply)'); draw(); }, 1500);
    draw(); $('#txt').focus();
  });
  const tg = targets(); $('#target').innerHTML = tg.length ? tg.map(t => `<option value="${t.k}">${esc(t.label)}</option>`).join('') : '<option value="">No contacts yet (apply to an internship first)</option>';
  $('#nf').addEventListener('submit', e => { e.preventDefault(); const v = $('#target').value; if (!v) return App.toast('No one to message yet.', 'error'); const [s, c] = v.split('|'); active = Db.convFor(s, c).id; draw(); });
  draw();
};

Pages.notifications = () => {
  const u = App.requireRole(); if (!u) return;
  const role = u.role;
  const label = { received:'Application received', status:'Status updated', interview:'Interview invitation', deadline:'Upcoming deadline', match:'New match' };
  $('#main').innerHTML = pageHead('Notifications', 'Demo notifications saved in your browser.', role) +
    `<div class="actions" style="margin-bottom:1rem"><button class="btn btn-sm" id="all">Mark all as read</button><button class="btn btn-sm btn-ghost" id="clear">Clear notifications</button></div><div id="out"></div>`;
  const mineN = () => Db.list('notifications').filter(n => n.userId === u.id);
  const save = fn => { const all = Db.list('notifications'); fn(all); Store.write('notifications', all); draw(); App.renderNav(); };
  const draw = () => {
    const n = mineN();
    $('#out').innerHTML = n.length ? `<ul class="list-plain">${n.map(x => `<li class="card card-flat note-item ${x.read ? '' : 'unread'}"><div><span class="badge">${label[x.type] || 'Update'}</span>${x.read ? '' : ' <b class="mono">NEW</b>'}<p style="margin:.4rem 0 0">${esc(x.text)}</p><span class="mono">${fmtTime(x.at)}</span></div>${x.read ? '' : `<button class="btn btn-sm btn-ghost" data-read="${x.id}">Mark read</button>`}</li>`).join('')}</ul>` : empty('You are all caught up', 'New updates will show up here.');
  };
  $('#out').addEventListener('click', e => { const b = e.target.closest('[data-read]'); if (b) save(all => { all.find(x => x.id === b.dataset.read).read = true; }); });
  $('#all').addEventListener('click', () => { save(all => all.forEach(x => { if (x.userId === u.id) x.read = true; })); App.toast('All marked as read.'); });
  $('#clear').addEventListener('click', async () => {
    if (!mineN().length) return;
    if (await App.confirmDialog('Clear all notifications?', 'This removes them from this demo.', 'Clear')) { Store.write('notifications', Db.list('notifications').filter(x => x.userId !== u.id)); draw(); App.renderNav(); App.toast('Notifications cleared.', 'info'); }
  });
  draw();
};
