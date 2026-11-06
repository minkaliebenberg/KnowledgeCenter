/* =============================================================================
   Store + business rules.
   In production these rules belong on the server (see docs/DATA-MODEL.md).
   The prototype keeps state in memory and mirrors it to localStorage so a demo
   survives a page refresh. "Reset demo" restores the seed data.
   ========================================================================== */
(function () {
  const KEY = 'crownring-kc-demo-v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || !state.documents) state = Object.assign(clone(window.SEED), { currentUser: 'u1' });

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: demo still works in memory */ } }
  function reset() { state = Object.assign(clone(window.SEED), { currentUser: state.currentUser || 'u1' }); save(); }

  const STAGES = [
    { id: 'foundation', label: 'Company Foundation',           scope: 'All employees', blurb: 'History, culture, organization, workplace policies and communication.' },
    { id: 'products',   label: 'Products & Industry',          scope: 'All employees', blurb: 'Business model, retailer relationships and jewellery fundamentals.' },
    { id: 'path',       label: 'Department Learning Path',     scope: 'Your department', blurb: 'The processes, systems and policies your department relies on.' },
    { id: 'ongoing',    label: 'Ongoing Learning',             scope: 'Your department', blurb: 'Updates, launches, refreshers and advanced learning. This never "finishes".' },
  ];

  /* ---------- lookups ---------- */
  const S = {
    get state() { return state; },
    save, reset, STAGES,
    user: (id) => state.users.find((u) => u.id === id),
    me: () => state.users.find((u) => u.id === state.currentUser),
    setMe: (id) => { state.currentUser = id; save(); },
    dept: (id) => (state.departments.find((d) => d.id === id) || { name: id }).name,
    cat: (id) => state.categories.find((c) => c.id === id),
    doc: (id) => state.documents.find((d) => d.id === id),
    mod: (id) => state.modules.find((m) => m.id === id),
    current: (doc) => doc.versions.find((v) => v.status === 'current'),
    deptNames: (list) => (list.includes('ALL') ? 'All departments' : list.map((d) => S.dept(d)).join(', ')),
    isAdmin: (u) => u.role === 'admin',
    canSeeTeam: (u) => u.role === 'admin' || u.role === 'supervisor',
  };

  const appliesTo = (depts, u) => depts.includes('ALL') || depts.includes(u.dept);

  /* ---------- KNOW: what a user can see ---------- */
  S.visibleDocs = (u) => state.documents.filter((d) =>
    d.status === 'published' && (S.isAdmin(u) || appliesTo(d.depts, u)));

  /* ---------- LEARN: what a user must complete ---------- */
  S.done = (userId, kind, ref) => state.completions.find((c) => c.user === userId && c.kind === kind && c.ref === ref);

  S.requiredModules = (u) => state.modules.filter((m) => appliesTo(m.depts, u));

  /* An update (a published version flagged "push to learning queue") is required when:
     1. the document applies to the user's department, and
     2. the user started before the update was published, and
     3. the user does NOT have an unfinished module that already teaches this
        document (they will learn the current version there instead).
     Superseded updates drop off the queue; their completion records are kept. */
  S.requiredUpdates = (u) => {
    const mods = S.requiredModules(u);
    const out = [];
    state.documents.forEach((d) => {
      if (d.status !== 'published' || !appliesTo(d.depts, u)) return;
      const v = S.current(d);
      if (!v || !v.pushed) return;
      if (u.start >= v.date) return;
      const pendingModuleTeachesIt = mods.some((m) => m.docs.includes(d.id) && !S.done(u.id, 'module', m.id));
      if (pendingModuleTeachesIt) return;
      out.push({ doc: d, version: v, ref: d.id + '@' + v.v });
    });
    return out;
  };

  S.stageStatus = (u) => {
    const mods = S.requiredModules(u);
    const ups = S.requiredUpdates(u);
    return STAGES.map((st, i) => {
      const items = mods.filter((m) => m.stage === st.id);
      let total = items.length, done = items.filter((m) => S.done(u.id, 'module', m.id)).length;
      if (st.id === 'ongoing') { total += ups.length; done += ups.filter((x) => S.done(u.id, 'update', x.ref)).length; }
      return Object.assign({}, st, { index: i, items, total, done, complete: total > 0 && done === total });
    }).map((st, i, arr) => {
      // Stages unlock in order. (Pushed document updates are never locked — see outstanding().)
      st.unlocked = i === 0 || arr.slice(0, i).every((p) => p.complete || p.total === 0);
      return st;
    });
  };

  S.progress = (u) => {
    const st = S.stageStatus(u);
    const total = st.reduce((a, s) => a + s.total, 0);
    const done = st.reduce((a, s) => a + s.done, 0);
    return { total, done, pct: total ? Math.round((done / total) * 100) : 100, stages: st };
  };

  S.outstanding = (u) => {
    const out = [];
    S.stageStatus(u).forEach((st) => {
      if (!st.unlocked) return;
      st.items.forEach((m) => { if (!S.done(u.id, 'module', m.id)) out.push({ kind: 'module', m, stage: st }); });
    });
    S.requiredUpdates(u).forEach((x) => { if (!S.done(u.id, 'update', x.ref)) out.push({ kind: 'update', x }); });
    return out;
  };

  S.complete = (userId, kind, ref, score) => {
    if (S.done(userId, kind, ref)) return;
    state.completions.push({ user: userId, kind, ref, date: state.today, score });
    save();
  };

  /* Credit kept from a previous department (shown on the transcript) */
  S.transcript = (u) => state.completions.filter((c) => c.user === u.id).sort((a, b) => (a.date < b.date ? 1 : -1));

  /* ---------- MANAGE: versioning & publishing ---------- */
  S.nextVersion = (cur, type) => {
    const [maj, min] = cur.split('.').map(Number);
    if (cur.startsWith('0.')) return '1.0';
    return type === 'major' ? (maj + 1) + '.0' : maj + '.' + (min + 1);
  };

  /* Publishing archives the previous current version (never deletes it). */
  S.publish = (docId, { sections, type, summary, pushed, by, depts }) => {
    const d = S.doc(docId);
    const prev = d.versions.find((v) => v.status === 'current') || d.versions[d.versions.length - 1];
    const v = S.nextVersion(prev.v, type);
    d.versions.forEach((x) => { if (x.status === 'current') x.status = 'archived'; if (x.status === 'draft') x.status = 'superseded-draft'; });
    d.versions.push({ v, date: state.today, type: prev.status === 'draft' ? 'initial' : type, by, status: 'current', pushed: !!pushed, summary, sections });
    if (depts && depts.length) d.depts = depts;
    d.status = 'published';
    save();
    return v;
  };

  S.archivedVersions = () => {
    const rows = [];
    state.documents.forEach((d) => d.versions.forEach((v) => {
      if (v.status === 'archived') {
        const next = d.versions[d.versions.indexOf(v) + 1];
        rows.push({ doc: d, v, supersededOn: next ? next.date : '', acks: state.completions.filter((c) => c.kind === 'update' && c.ref === d.id + '@' + v.v).length });
      }
    }));
    return rows.sort((a, b) => (a.supersededOn < b.supersededOn ? 1 : -1));
  };

  S.submit = (userId, type, text) => {
    state.submissions.unshift({ id: 'S' + (state.submissions.length + 1) + '-' + Date.now(), user: userId, type, text, date: state.today, status: 'new' });
    save();
  };

  S.team = (u) => {
    if (u.role === 'admin') return state.users.filter((x) => x.role !== 'admin');
    return state.users.filter((x) => x.supervisor === u.id);
  };

  S.transfer = (userId, newDept) => {
    const u = S.user(userId);
    if (u.dept === newDept) return;
    u.deptHistory.push({ dept: u.dept, from: u.deptHistory.length ? u.deptHistory[u.deptHistory.length - 1].to : u.start, to: state.today });
    u.dept = newDept;
    save();
  };

  /* ---------- ASK: simulated retrieval over APPROVED, CURRENT docs only ---------- */
  const STOP = new Set('a an the is are was were be to of and or in on for with what how do does i we our my me can when who where which should if it this that at by from any about need do you have get as there their they them your'.split(' '));
  const stem = (w) => w.replace(/(ing|ed|es|s)$/,'');
  const tokens = (t) => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w) && w.length > 1).map(stem);

  S.ask = (u, question) => {
    const q = tokens(question);
    if (!q.length) return { found: false };
    const hits = [];
    S.visibleDocs(u).forEach((d) => {
      const v = S.current(d); // archived versions are never searched
      const titleT = tokens(d.title + ' ' + d.tags.join(' '));
      v.sections.forEach((s) => {
        const body = tokens(s.h + ' ' + s.body);
        let score = 0;
        q.forEach((w) => {
          if (titleT.includes(w)) score += 2;
          const n = body.filter((b) => b === w).length;
          if (n) score += 1 + Math.min(n, 3) * 0.5;
        });
        const coverage = q.filter((w) => titleT.includes(w) || body.includes(w)).length / q.length;
        hits.push({ d, v, s, score: score * coverage, coverage });
      });
    });
    hits.sort((a, b) => b.score - a.score);
    const top = hits[0];
    if (!top || top.score < 2.5 || top.coverage < 0.5) return { found: false };
    const related = hits.slice(1).filter((h) => h.d.id !== top.d.id && h.score > top.score * 0.6).slice(0, 2);
    return { found: true, top, related };
  };

  window.Store = S;
})();
