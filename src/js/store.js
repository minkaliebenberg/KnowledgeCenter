/* =============================================================================
   Store + business rules.
   In production these rules belong on the server (see docs/DATA-MODEL.md).
   The prototype keeps state in memory and mirrors it to localStorage so a demo
   survives a refresh. "Reset demo" restores the seed data.
   ========================================================================== */
(function () {
  const KEY = 'crownring-kc-demo-v3';
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
    const need = state.users.filter((u) => u.role !== 'admin' && appliesTo(d.depts, u) && u.start < v.date);
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

  S.team = (u) => (u.role === 'admin' ? state.users.filter((x) => x.role !== 'admin') : state.users.filter((x) => x.supervisor === u.id));

  S.transfer = (userId, newDept) => {
    const u = S.user(userId);
    if (u.dept === newDept) return;
    const from = u.deptHistory.length ? u.deptHistory[u.deptHistory.length - 1].to : u.start;
    u.deptHistory.push({ dept: u.dept, from, to: state.today });
    u.dept = newDept;
    save();
  };


  /* ---------- NAVIGATE: systems & how-to guides (reference only, no tracking) ---------- */
  S.systems = (u) => (state.systems || []).filter((x) => S.isAdmin(u) || appliesTo(x.depts, u));
  S.system = (id) => (state.systems || []).find((x) => x.id === id);
  S.guide = (sysId, gid) => { const x = S.system(sysId); return x && x.guides.find((g) => g.id === gid); };
  S.guideRef = (ref) => { const [sid, gid] = ref.split(':'); return { sys: S.system(sid), g: S.guide(sid, gid) }; };

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
