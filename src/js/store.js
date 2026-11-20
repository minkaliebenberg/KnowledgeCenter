/* =============================================================================
   Store + business rules.
   In production these rules belong on the server (see docs/DATA-MODEL.md).
   The prototype keeps state in memory and mirrors it to localStorage so a demo
   survives a refresh. "Reset demo" restores the seed data.
   ========================================================================== */
(function () {
  const KEY = 'crownring-kc-demo-v8';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || !state.documents) state = Object.assign(clone(window.SEED), { currentUser: 'u1' });

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* demo still works in memory */ } }
  function reset() { state = Object.assign(clone(window.SEED), { currentUser: state.currentUser || 'u1' }); save(); }

  const STAGE_ORDER = ['foundation', 'products', 'path', 'ongoing'];
  const STAGE_LABEL = { foundation: 'Onboarding', products: 'Onboarding', path: 'Department', ongoing: 'Ongoing' };

  const S = {
    get state() { return state; },
    save, reset, STAGE_LABEL,
    user: (id) => state.users.find((u) => u.id === id),
    me: () => state.users.find((u) => u.id === state.currentUser),
    setMe: (id) => { state.currentUser = id; save(); },
    dept: (id) => (state.departments.find((d) => d.id === id) || { name: id }).name,
    folder: (id) => state.folders.find((f) => f.id === id),
    doc: (id) => state.documents.find((d) => d.id === id),
    mod: (id) => state.modules.find((m) => m.id === id),
    current: (doc) => doc.versions.find((v) => v.status === 'current'),
    latest: (doc) => doc.versions[doc.versions.length - 1],
    deptNames: (list) => (list.includes('ALL') ? 'Everyone' : list.map((d) => S.dept(d)).join(', ')),
    isAdmin: (u) => u.role === 'admin',
    canSeeTeam: (u) => u.role === 'admin' || u.role === 'supervisor',
  };

  const appliesTo = (depts, u) => depts.includes('ALL') || depts.includes(u.dept);
  S.appliesTo = appliesTo;

  /* ---------- KNOW / ASK: current, active documents for the user's department ---------- */
  S.visibleDocs = (u) => state.documents.filter((d) => d.status === 'active' && S.current(d) && (S.isAdmin(u) || appliesTo(d.depts, u)));

  /* ---------- LEARN ---------- */
  S.done = (userId, kind, ref) => state.completions.find((c) => c.user === userId && c.kind === kind && c.ref === ref);

  S.requiredModules = (u) => state.modules
    .filter((m) => appliesTo(m.depts, u))
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  /* A pushed update is required when:
     1. the document applies to the user's department,
     2. the user started before it was published, and
     3. no unfinished module already teaches that document (they'll learn the new version there).
     Only the newest pushed version is required; older acknowledgements stay on record. */
  S.requiredUpdates = (u) => {
    const mods = S.requiredModules(u);
    const out = [];
    state.documents.forEach((d) => {
      if (d.status !== 'active' || !appliesTo(d.depts, u)) return;
      const v = S.current(d);
      if (!v || !v.pushed || u.start >= v.date) return;
      if (mods.some((m) => m.docs.includes(d.id) && !S.done(u.id, 'module', m.id))) return;
      out.push({ doc: d, version: v, ref: d.id + '@' + v.v });
    });
    return out;
  };

  /* Ordered to-do list: updates first (they're time-sensitive), then modules in stage order. */
  S.todo = (u) => [
    ...S.requiredUpdates(u).filter((x) => !S.done(u.id, 'update', x.ref)).map((x) => ({ kind: 'update', x })),
    ...S.requiredModules(u).filter((m) => !S.done(u.id, 'module', m.id)).map((m) => ({ kind: 'module', m })),
  ];

  S.progress = (u) => {
    const mods = S.requiredModules(u), ups = S.requiredUpdates(u);
    const total = mods.length + ups.length;
    const done = mods.filter((m) => S.done(u.id, 'module', m.id)).length + ups.filter((x) => S.done(u.id, 'update', x.ref)).length;
    const group = (stages) => { const ms = mods.filter((m) => stages.includes(m.stage)); return { done: ms.filter((m) => S.done(u.id, 'module', m.id)).length, total: ms.length }; };
    return { total, done, pct: total ? Math.round((done / total) * 100) : 100,
      onboarding: group(['foundation', 'products']), path: group(['path']),
      updatesPending: ups.filter((x) => !S.done(u.id, 'update', x.ref)).length };
  };

  S.complete = (userId, kind, ref, score) => {
    if (S.done(userId, kind, ref)) return;
    state.completions.push({ user: userId, kind, ref, date: state.today, score });
    save();
  };

  S.transcript = (u) => state.completions.filter((c) => c.user === u.id).sort((a, b) => (a.date < b.date ? 1 : -1));

  /* ---------- MANAGE ---------- */
  S.nextVersion = (cur, type) => {
    if (cur.startsWith('0.')) return '1.0';
    const [maj, min] = cur.split('.').map(Number);
    return type === 'major' ? (maj + 1) + '.0' : maj + '.' + (min + 1);
  };

  /* Publishing archives the previous current version (never deletes it). */
  S.publish = (docId, { sections, type, summary, pushed, by, depts }) => {
    const d = S.doc(docId);
    const prev = S.current(d) || S.latest(d);
    const isNew = !S.current(d);
    const v = isNew ? '1.0' : S.nextVersion(prev.v, type);
    d.versions = d.versions.filter((x) => x.status !== 'draft');
    d.versions.forEach((x) => { if (x.status === 'current') x.status = 'archived'; });
    d.versions.push({ v, date: state.today, type: isNew ? 'initial' : type, by, status: 'current', pushed: !!pushed, summary, sections });
    if (depts && depts.length) d.depts = depts;
    d.status = 'active';
    const nr = new Date(state.today + 'T12:00:00'); nr.setFullYear(nr.getFullYear() + 1);
    d.nextReview = nr.toISOString().slice(0, 10);
    state.roadmap.forEach((r) => { if (r.docId === docId && r.status !== 'done') r.status = 'done'; });
    save();
    return v;
  };

  S.retire = (docId) => { S.doc(docId).status = 'retired'; save(); };
  S.restore = (docId) => { S.doc(docId).status = 'active'; save(); };

  S.linkedFrom = (docId) => state.documents.filter((d) => d.links.includes(docId) && d.status !== 'retired');

  /* Employees who must acknowledge a pushed version, and who has. */
  S.ackStats = (d, v) => {
    const ref = d.id + '@' + v.v;
    const need = state.users.filter((u) => u.role !== 'admin' && S.active(u) && appliesTo(d.depts, u) && u.start < v.date);
    const acked = state.completions.filter((c) => c.kind === 'update' && c.ref === ref);
    return { need, acked, pending: need.filter((u) => !acked.some((c) => c.user === u.id)) };
  };

  S.reviewState = (d) => {
    if (!d.nextReview || d.status !== 'active') return null;
    if (d.nextReview < state.today) return 'overdue';
    const soon = new Date(state.today + 'T12:00:00'); soon.setDate(soon.getDate() + 60);
    return d.nextReview <= soon.toISOString().slice(0, 10) ? 'soon' : null;
  };

  S.submit = (userId, type, text) => {
    state.submissions.unshift({ id: 'S' + Date.now(), user: userId, type, text, date: state.today, status: 'new' });
    save();
  };

  /* ---------- PEOPLE ----------
     In production, people, job titles, departments and managers come from the internal website / Microsoft 365.
     L&D only sets Knowledge Center access, SME status and (if needed) a team-lead override. */
  S.active = (u) => u.active !== false;
  S.deptObj = (id) => state.departments.find((d) => d.id === id);
  S.deptLead = (id) => { const d = S.deptObj(id); return d && d.lead ? S.user(d.lead) : null; };
  S.leadOf = (u) => { if (u.supervisor) return S.user(u.supervisor); const l = S.deptLead(u.dept); return l && l.id !== u.id ? l : null; };
  S.team = (u) => state.users.filter((x) => S.active(x) && x.id !== u.id && x.role !== 'admin' && (u.role === 'admin' || (S.leadOf(x) || {}).id === u.id));
  S.leads = () => state.users.filter((x) => S.active(x) && (x.role === 'supervisor' || x.role === 'admin'));
  S.savePerson = (id, f) => {
    let u = id && S.user(id);
    if (!u) { u = { id: 'u' + Date.now().toString(36), deptHistory: [], active: true, start: state.today }; state.users.push(u); }
    if (u.dept && f.dept && f.dept !== u.dept) S.transfer(u.id, f.dept);
    Object.assign(u, f);
    if (!u.sme) delete u.sme;
    save(); return u;
  };
  S.saveDept = (id, f) => {
    let d = id && S.deptObj(id);
    if (!d) { d = { id: (f.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'D') + Date.now().toString(36).slice(-2) }; state.departments.push(d); }
    Object.assign(d, f); save(); return d;
  };

  S.transfer = (userId, newDept) => {
    const u = S.user(userId);
    if (u.dept === newDept) return;
    const from = u.deptHistory.length ? u.deptHistory[u.deptHistory.length - 1].to : u.start;
    u.deptHistory.push({ dept: u.dept, from, to: state.today });
    u.dept = newDept;
    save();
  };



  /* ---------- REFER: per-person favourites & recently viewed ---------- */
  const ensure = () => { state.favorites = state.favorites || {}; state.recent = state.recent || {}; };
  S.favs = (u) => { ensure(); return (state.favorites[u.id] || []).map(S.doc).filter((d) => d && S.visibleDocs(u).includes(d)); };
  S.isFav = (u, id) => { ensure(); return (state.favorites[u.id] || []).includes(id); };
  S.toggleFav = (u, id) => {
    ensure(); const l = state.favorites[u.id] = state.favorites[u.id] || [];
    const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.unshift(id);
    save(); return i < 0;
  };
  S.recent = (u) => { ensure(); return (state.recent[u.id] || []).map(S.doc).filter((d) => d && S.visibleDocs(u).includes(d)).slice(0, 5); };
  S.markViewed = (u, id) => {
    ensure(); const l = (state.recent[u.id] || []).filter((x) => x !== id);
    l.unshift(id); state.recent[u.id] = l.slice(0, 10); save();
  };
  /* "Updated" badge: current version published in the last 30 days */
  S.isRecentlyUpdated = (d) => { const v = S.current(d); if (!v) return false; const t = new Date(state.today + 'T12:00:00'); t.setDate(t.getDate() - 30); return v.date >= t.toISOString().slice(0, 10); };

  /* ---------- NAVIGATE: systems & how-to guides (reference only, no tracking) ---------- */
  S.systems = (u) => (state.systems || []).filter((x) => S.isAdmin(u) || appliesTo(x.depts, u));
  S.system = (id) => (state.systems || []).find((x) => x.id === id);
  S.guide = (sysId, gid) => { const x = S.system(sysId); return x && x.guides.find((g) => g.id === gid); };
  S.guideRef = (ref) => { const [sid, gid] = ref.split(':'); return { sys: S.system(sid), g: S.guide(sid, gid) }; };


  /* ---------- ASK LOG: every question, its answer and sources ----------
     Unanswered questions are sent to L&D automatically (Manage → Roadmap → Requests).
     Repeat questions are grouped onto one request so L&D sees how often it comes up. */
  const norm = (t) => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w)).map(stem).sort().join(' ');
  const nowStamp = () => { const d = new Date(); return state.today + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  S.logAsk = (u, q, r) => {
    state.askLog = state.askLog || [];
    const entry = { id: 'A' + Date.now(), user: u.id, at: nowStamp(), q, found: r.found, helpful: null };
    if (r.found) {
      const t = r.top;
      entry.sources = [t.guide
        ? { kind: 'guide', ref: t.sys.id + ':' + t.guide.id, label: t.sys.name + ' › ' + t.guide.title }
        : { kind: 'doc', ref: t.d.id, label: t.d.title + ' › ' + t.s.h, v: t.v.v }];
      entry.answer = t.guide ? t.guide.steps.join(' ').replace(/\*\*/g, '') : t.s.body.replace(/\*\*/g, '').replace(/^- /gm, '');
    } else {
      entry.requestId = S.requestFromAsk(u, q, entry.id).id;
    }
    state.askLog.push(entry); save();
    return entry;
  };
  S.requestFromAsk = (u, q, logId, note) => {
    const key = norm(q);
    let sub = state.submissions.find((x) => x.type === 'ask' && x.status === 'new' && norm(x.text) === key);
    if (!sub) { sub = { id: 'S' + Date.now(), user: u.id, type: 'ask', date: state.today, status: 'new', text: q, askers: [], logIds: [] }; state.submissions.unshift(sub); }
    sub.askers.push({ user: u.id, at: nowStamp() }); sub.logIds.push(logId);
    if (note) sub.note = (sub.note ? sub.note + ' / ' : '') + note;
    save(); return sub;
  };
  S.rateAsk = (id, helpful) => {
    const e = (state.askLog || []).find((x) => x.id === id); if (!e) return null;
    e.helpful = helpful;
    if (helpful === false && !e.requestId) e.requestId = S.requestFromAsk(S.user(e.user), e.q, e.id, 'Answer marked not helpful').id;
    save(); return e;
  };
  /* Extra detail an employee adds after marking an answer "not helpful" — saved on their log entry and the request */
  S.addAskDetail = (id, text) => {
    const e = (state.askLog || []).find((x) => x.id === id); if (!e || !text) return e;
    e.note = text;
    const sub = S.askSub(e);
    if (sub) { sub.details = sub.details || []; sub.details.push({ user: e.user, at: nowStamp(), text }); }
    save(); return e;
  };
  S.askHistory = (userId) => (state.askLog || []).filter((e) => !userId || e.user === userId).slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  /* What the employee sees. Internal steps (roadmap etc.) stay "Requested" — only L&D sees the roadmap. */
  S.askSub = (e) => e.requestId && state.submissions.find((x) => x.id === e.requestId);
  S.askStatus = (e) => {
    const sub = S.askSub(e);
    if (sub && sub.status === 'answered') return { key: 'updated', label: 'Updated', answered: true };
    if (e.found && e.helpful !== false) return { key: 'answered', label: 'Answered', answered: true };
    if (sub && sub.status === 'declined') return { key: 'closed', label: 'Closed', answered: false };
    return { key: 'requested', label: 'Requested', answered: false };
  };

  /* ---------- REQUESTS: L&D answers, adds to roadmap, or closes ---------- */
  S.requestAskers = (sub) => [...new Set(sub.askers ? sub.askers.map((a) => a.user) : [sub.user])];
  S.answerRequest = (subId, answer) => {
    const sub = state.submissions.find((x) => x.id === subId);
    sub.status = 'answered';
    sub.answer = Object.assign({ date: state.today, by: S.me().id }, answer);
    state.notices = state.notices || [];
    S.requestAskers(sub).forEach((uid) => state.notices.push({ id: 'N' + Date.now() + uid, user: uid, subId, date: state.today, read: false }));
    save(); return sub;
  };
  S.closeRequest = (subId, reply) => { const sub = state.submissions.find((x) => x.id === subId); sub.status = 'declined'; sub.reply = reply || ''; sub.closedOn = state.today; save(); };
  S.notices = (u) => (state.notices || []).filter((n) => n.user === u.id && !n.read).map((n) => Object.assign({}, n, { sub: state.submissions.find((x) => x.id === n.subId) })).filter((n) => n.sub);
  S.readNotice = (id) => { const n = (state.notices || []).find((x) => x.id === id); if (n) { n.read = true; n.readOn = state.today; save(); } };

  /* ---------- ASK: simulated retrieval over CURRENT, ACTIVE docs only ---------- */
  const STOP = new Set('a an the is are was were be to of and or in on for with what how do does i we our my me can when who where which should if it this that at by from any about need you have get as there their they them your'.split(' '));
  const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');
  const tokens = (t) => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w) && w.length > 1).map(stem);
  const isPlaceholder = (s) => /^Placeholder text/.test(s.body);

  S.ask = (u, question) => {
    const q = tokens(question);
    if (!q.length) return { found: false };
    const hits = [];
    S.visibleDocs(u).forEach((d) => {
      const v = S.current(d);
      const titleT = tokens(d.title + ' ' + d.tags.join(' '));
      v.sections.forEach((s, idx) => {
        if (isPlaceholder(s)) return;
        const body = tokens(s.h + ' ' + s.body);
        let score = 0;
        q.forEach((w) => {
          if (titleT.includes(w)) score += 2;
          const n = body.filter((b) => b === w).length;
          if (n) score += 1 + Math.min(n, 3) * 0.5;
        });
        const coverage = q.filter((w) => titleT.includes(w) || body.includes(w)).length / q.length;
        hits.push({ d, v, s, idx, score: score * coverage, coverage });
      });
    });
    // How-to guides from Navigate are searchable too
    S.systems(u).forEach((sys) => sys.guides.forEach((g) => {
      const body = g.steps.join(' ');
      if (/^Placeholder/.test(body)) return;
      const titleT = tokens(g.title + ' ' + sys.name);
      const bodyT = tokens(body + ' ' + g.tip);
      let score = 0;
      q.forEach((w) => { if (titleT.includes(w)) score += 2; if (bodyT.includes(w)) score += 1.5; });
      const coverage = q.filter((w) => titleT.includes(w) || bodyT.includes(w)).length / q.length;
      hits.push({ guide: g, sys, score: score * coverage, coverage });
    }));
    hits.sort((a, b) => b.score - a.score);
    const top = hits[0];
    if (!top || top.score < 2.5 || top.coverage < 0.5) return { found: false };
    return { found: true, top };
  };

  window.Store = S;
})();
