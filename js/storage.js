/* storage.js — the ONLY place that touches localStorage.
   Store = raw read/write. Db = the shared data layer every page uses,
   so statuses, saves, notifications and messages never go out of sync. */
const Store = (() => {
  const PREFIX = 'osfi:';
  const read = (k, fallback) => { try { const v = localStorage.getItem(PREFIX + k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch { return false; } };
  const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const init = () => {
    if (read('version') === DATA.VERSION) return;
    Object.entries(DATA.seed).forEach(([k, v]) => write(k, v));
    write('version', DATA.VERSION);
  };
  const resetDemo = () => {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
    init();
  };
  return { read, write, uid, init, resetDemo };
})();

const Db = (() => {
  const list = k => Store.read(k, []);
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const now = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  const user = id => list('users').find(u => u.id === id);
  const company = id => list('companies').find(c => c.id === id);
  const internship = id => {
    const i = list('internships').find(x => x.id === id);
    return i ? { ...i, company: company(i.companyId) || { name:'Unknown company', initials:'?', color:'#777' } } : null;
  };
  const internships = () => list('internships').filter(i => !i.removed).map(i => internship(i.id));
  const companyUsers = cid => list('users').filter(u => u.companyId === cid);

  const notify = (userId, type, text) => {
    const n = list('notifications'); n.unshift({ id: Store.uid('n'), userId, type, text, at: now(), read: false });
    Store.write('notifications', n);
  };

  /* Applications — single source of truth for status */
  const apply = (iid, sid) => {
    const apps = list('applications'), i = internship(iid);
    if (!i || apps.some(a => a.internshipId === iid && a.studentId === sid && a.status !== 'withdrawn')) return null;
    const a = { id: Store.uid('a'), internshipId: iid, studentId: sid, status: 'applied', appliedAt: today(), updatedAt: today(), interviewAt: null };
    apps.push(a); Store.write('applications', apps);
    notify(sid, 'received', `Application received: ${i.title} at ${i.company.name}.`);
    companyUsers(i.companyId).forEach(u => notify(u.id, 'received', `New applicant: ${user(sid).name} for ${i.title}.`));
    return a;
  };
  const setStatus = (id, status, interviewAt = null) => {
    const apps = list('applications'), a = apps.find(x => x.id === id); if (!a) return;
    a.status = status; a.updatedAt = today();
    if (status === 'interview') a.interviewAt = interviewAt;
    Store.write('applications', apps);
    const i = internship(a.internshipId);
    const when = status === 'interview' && interviewAt ? ` on ${new Date(interviewAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })}` : '';
    notify(a.studentId, status === 'interview' ? 'interview' : 'status',
      status === 'interview' ? `Interview invitation: ${i.title} at ${i.company.name}${when}.` : `Your ${i.title} application is now ${DATA.STATUS_LABELS[status]}.`);
  };
  const withdraw = id => {
    const apps = list('applications'), a = apps.find(x => x.id === id); if (!a) return;
    a.status = 'withdrawn'; a.updatedAt = today(); a.interviewAt = null; Store.write('applications', apps);
  };

  /* Saved + recently viewed, per user */
  const keyed = k => ({
    get: uid => (Store.read(k, {})[uid] || []),
    set: (uid, v) => { const o = Store.read(k, {}); o[uid] = v; Store.write(k, o); }
  });
  const savedStore = keyed('saved'), viewedStore = keyed('viewed');
  const savedIds = uid => savedStore.get(uid);
  const isSaved = (uid, id) => savedStore.get(uid).includes(id);
  const toggleSave = (uid, id) => {
    let s = savedStore.get(uid), on = !s.includes(id);
    s = on ? [...s, id] : s.filter(x => x !== id); savedStore.set(uid, s); return on;
  };
  const viewedIds = uid => viewedStore.get(uid);
  const addViewed = (uid, id) => viewedStore.set(uid, [id, ...viewedStore.get(uid).filter(x => x !== id)].slice(0, 5));

  const profile = uid => Store.read('profiles', {})[uid] || { university:'', degree:'', gradYear:'', skills:[], projects:[], certifications:[], portfolio:'', linkedin:'', bio:'', resume:null };
  const setProfile = (uid, p) => { const o = Store.read('profiles', {}); o[uid] = p; Store.write('profiles', o); };

  /* Messaging */
  const convFor = (studentId, companyId) => {
    const c = list('conversations'); let x = c.find(v => v.studentId === studentId && v.companyId === companyId);
    if (!x) { x = { id: Store.uid('m'), studentId, companyId, messages: [], unread: { student: 0, recruiter: 0 } }; c.push(x); Store.write('conversations', c); }
    return x;
  };
  const send = (convId, role, text) => {
    const c = list('conversations'), x = c.find(v => v.id === convId); if (!x) return;
    x.messages.push({ from: role, text, at: now() });
    x.unread[role === 'student' ? 'recruiter' : 'student']++; Store.write('conversations', c);
  };
  const markRead = (convId, role) => {
    const c = list('conversations'), x = c.find(v => v.id === convId);
    if (x && x.unread[role]) { x.unread[role] = 0; Store.write('conversations', c); }
  };
  return { list, today, now, user, company, internship, internships, companyUsers, notify, apply, setStatus, withdraw,
    savedIds, isSaved, toggleSave, viewedIds, addViewed, profile, setProfile, convFor, send, markRead };
})();
