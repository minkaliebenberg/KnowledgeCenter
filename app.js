/* =============================================================================
   CrownRing Knowledge Center — prototype UI
   Plain JavaScript, hash-based routing, no build step.
   Routes:
     #/learn                         Learning queue & progress
     #/learn/module/:id[/:step]      Module player (lessons pulled from Know + quiz)
     #/learn/update/:docId           Acknowledge a pushed document update
     #/learn/record                  My learning record
     #/know[/cat/:id]                Knowledge base
     #/know/doc/:id[/:section]       Document reader
     #/ask                           AI assistant (simulated)
     #/team[/:userId]                Supervisor view
     #/manage/...                    L&D admin (library, edit, review, archive, paths, requests)
   ========================================================================== */
(function () {
  const S = window.Store;
  const app = document.getElementById('app');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const firstName = (u) => u.name.split(' ')[0];

  /* ---------- tiny markdown: paragraphs, "- " bullets, **bold** ---------- */
  function md(text) {
    const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return String(text).split(/\n{2,}/).map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => l.trim().startsWith('- '))) return '<ul>' + lines.map((l) => '<li>' + inline(l.trim().slice(2)) + '</li>').join('') + '</ul>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }
  const plain = (text) => String(text).replace(/\*\*/g, '').replace(/^- /gm, '• ');

  /* ---------- word diff (for "what changed" views) ---------- */
  function wordDiff(a, b) {
    const A = plain(a).split(/(\s+)/), B = plain(b).split(/(\s+)/);
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0, out = '';
    while (i < n && j < m) {
      if (A[i] === B[j]) { out += esc(A[i]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out += '<span class="diff-del">' + esc(A[i]) + '</span>'; i++; }
      else { out += '<span class="diff-add">' + esc(B[j]) + '</span>'; j++; }
    }
    while (i < n) out += '<span class="diff-del">' + esc(A[i++]) + '</span>';
    while (j < m) out += '<span class="diff-add">' + esc(B[j++]) + '</span>';
    return out.replace(/\n/g, '<br>');
  }
  function sectionDiff(oldV, newV) {
    if (!oldV) return '<p class="muted">No previous version.</p>';
    const heads = [...new Set([...oldV.sections.map((s) => s.h), ...newV.sections.map((s) => s.h)])];
    return heads.map((h) => {
      const a = oldV.sections.find((s) => s.h === h), b = newV.sections.find((s) => s.h === h);
      if (!a) return `<h3>${esc(h)} <span class="badge ok">New section</span></h3><p class="diff-add">${esc(plain(b.body)).replace(/\n/g, '<br>')}</p>`;
      if (!b) return `<h3>${esc(h)} <span class="badge warn">Removed</span></h3><p class="diff-del">${esc(plain(a.body)).replace(/\n/g, '<br>')}</p>`;
      if (a.body === b.body) return `<h3>${esc(h)} <span class="badge">Unchanged</span></h3>`;
      return `<h3>${esc(h)} <span class="badge info">Changed</span></h3><p>${wordDiff(a.body, b.body)}</p>`;
    }).join('');
  }

  /* ---------- UI helpers ---------- */
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function openModal(html, onMount) {
    const m = $('#modal'); $('.modal-card', m).innerHTML = html; m.hidden = false;
    const first = $('textarea, input, select, button', m); if (first) first.focus();
    if (onMount) onMount($('.modal-card', m));
  }
  function closeModal() { $('#modal').hidden = true; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.matches('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  const progressBar = (pct) => `<div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
  const deptBadges = (list) => list.includes('ALL') ? '<span class="badge gold">All departments</span>' : list.map((d) => `<span class="badge">${esc(S.dept(d))}</span>`).join(' ');

  /* ---------- chrome: nav + user switcher ---------- */
  function renderChrome(route) {
    const me = S.me();
    const out = S.outstanding(me).length;
    const items = [
      ['learn', 'Learn', out ? `<span class="badge warn">${out}</span>` : ''],
      ['know', 'Know', ''],
      ['ask', 'Ask', ''],
    ];
    if (S.canSeeTeam(me)) items.push(['team', 'My Team', '']);
    if (S.isAdmin(me)) items.push(['manage', 'Manage', '<span class="lock" aria-label="restricted">🔒</span>']);
    $('#mainnav').innerHTML = items.map(([k, label, extra]) => `<a href="#/${k}" class="${route[0] === k ? 'active' : ''}">${label}${extra ? ' ' + extra : ''}</a>`).join('');

    const sel = $('#userSwitch');
    const roleLabel = { employee: 'Employee', supervisor: 'Supervisor', admin: 'L&D Admin' };
    sel.innerHTML = S.state.users.map((u) => `<option value="${u.id}" ${u.id === me.id ? 'selected' : ''}>${esc(u.name)} — ${roleLabel[u.role]}, ${esc(S.dept(u.dept))}${u.sme ? ' (SME)' : ''}</option>`).join('');
  }
  $('#userSwitch').addEventListener('change', (e) => {
    S.setMe(e.target.value);
    const me = S.me();
    // Bounce out of restricted areas when switching to a lower-access user.
    if (location.hash.startsWith('#/manage') && !S.isAdmin(me)) location.hash = '#/learn';
    else if (location.hash.startsWith('#/team') && !S.canSeeTeam(me)) location.hash = '#/learn';
    else route();
    toast('Now viewing as ' + me.name);
  });
  $('#resetDemo').addEventListener('click', () => { S.reset(); askLog = []; route(); toast('Demo data reset'); });
  $('#suggestBtn').addEventListener('click', () => suggestModal());

  function suggestModal(prefill = '', type = 'question') {
    const me = S.me();
    openModal(`
      <h2 id="modalTitle">Ask L&amp;D or suggest a topic</h2>
      <p class="muted small">Questions, requests for new documentation, or topics you'd like covered in training. ${me.sme ? 'As a subject-matter expert you can also submit content for a document.' : ''}</p>
      <div class="field"><label for="sType">Type</label>
        <select id="sType">
          <option value="question" ${type === 'question' ? 'selected' : ''}>Question about existing documentation</option>
          <option value="topic" ${type === 'topic' ? 'selected' : ''}>Suggest a topic or module</option>
          <option value="request">Request new / updated documentation</option>
          ${me.sme ? '<option value="content">Submit content as SME</option>' : ''}
        </select></div>
      <div class="field"><label for="sText">Details</label><textarea id="sText" placeholder="What do you need?">${esc(prefill)}</textarea></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" data-close type="button">Cancel</button>
        <button class="btn" id="sSend" type="button">Send to L&amp;D</button>
      </div>`, (card) => {
      $('#sSend', card).addEventListener('click', () => {
        const text = $('#sText', card).value.trim();
        if (!text) { $('#sText', card).focus(); return; }
        S.submit(me.id, $('#sType', card).value, text);
        closeModal(); toast('Sent to Learning & Development — thank you!');
        if (location.hash.startsWith('#/manage/requests')) rerender();
      });
    });
  }

  /* =========================================================================
     LEARN
     ========================================================================= */
  function viewLearn() {
    const me = S.me();
    const p = S.progress(me);
    const current = p.stages.find((s) => s.unlocked && !s.complete && s.id !== 'ongoing') || p.stages[3];
    const outstanding = S.outstanding(me);
    const next = outstanding[0];
    const ups = S.requiredUpdates(me);

    const stageCards = p.stages.map((st) => {
      const isOngoing = st.id === 'ongoing';
      const modCards = st.items.map((m) => moduleCard(me, m, st.unlocked)).join('');
      const upCards = isOngoing ? ups.map((x) => updateCard(me, x)).join('') : '';
      const empty = !modCards && !upCards ? '<p class="muted small">Nothing here right now. New updates for your department will appear here.</p>' : '';
      return `
        <section class="stage" id="stage-${st.id}">
          <div class="stage-head">
            <div><span class="scope">Stage ${st.index + 1} · ${esc(st.scope)}${st.id === 'path' || st.id === 'ongoing' ? ' — ' + esc(S.dept(me.dept)) : ''}</span>
              <h2>${esc(st.label)} ${st.complete && !isOngoing ? '<span class="badge ok">Complete</span>' : ''}${!st.unlocked ? ` <span class="badge">🔒 ${isOngoing ? 'Modules unlock after your learning path — updates always apply' : 'Unlocks after previous stage'}</span>` : ''}</h2>
              <p class="muted small" style="margin:0">${esc(st.blurb)}</p></div>
            <span class="muted small">${st.done} of ${st.total} done</span>
          </div>
          <div class="grid grid-3">${upCards}${modCards}</div>${empty}
        </section>`;
    }).join('');

    return `
      <div class="page-head">
        <h1>Welcome back, ${esc(firstName(me))}</h1>
        <p>Your training queue is ongoing — when processes change or new products launch, the update lands here so you never miss it. Everything you've completed stays open for review.</p>
      </div>
      <div class="card hero">
        <div>
          <div class="row spread"><h2 style="margin:0">Your progress</h2><a class="small" href="#/learn/record">View my learning record →</a></div>
          <p class="muted small" style="margin:4px 0 12px">${esc(me.title)} · ${esc(S.dept(me.dept))}</p>
          ${progressBar(p.pct)}
          <div class="stage-track">${p.stages.map((st) => `
            <a href="#/learn" data-jump="stage-${st.id}" class="stage-pill ${st.complete ? 'done' : st === current ? 'current' : !st.unlocked ? 'locked' : ''}" style="text-decoration:none">
              <strong>${st.complete ? '✓ ' : ''}${esc(st.label)}</strong>${st.done}/${st.total}</a>`).join('')}</div>
        </div>
        <div style="text-align:center"><div class="pct">${p.pct}%</div><div class="muted small">${p.done} of ${p.total} items</div></div>
      </div>
      ${next ? `<div class="card" style="margin-top:16px;border-color:var(--accent)">
          <div class="row spread"><div><span class="badge gold">Up next</span>
            <h2 style="margin:8px 0 2px">${next.kind === 'update' ? 'Update: ' + esc(next.x.doc.title) + ' (v' + next.x.version.v + ')' : esc(next.m.title)}</h2>
            <span class="muted small">${next.kind === 'update' ? 'A change to a procedure that applies to you' : esc(next.stage.label) + ' · ' + next.m.minutes + ' min'}</span></div>
            <a class="btn" href="${next.kind === 'update' ? '#/learn/update/' + next.x.doc.id : '#/learn/module/' + next.m.id}">${next.kind === 'update' ? 'Review update' : 'Start'}</a></div></div>`
        : `<div class="note" style="margin-top:16px">🎉 You're all caught up. New updates for your department will appear in <strong>Ongoing Learning</strong>.</div>`}
      ${stageCards}`;
  }

  function moduleCard(me, m, unlocked) {
    const done = S.done(me.id, 'module', m.id);
    return `<a class="card module-card ${unlocked || done ? '' : 'locked'}" href="#/learn/module/${m.id}">
      <div class="row spread"><span class="badge ${done ? 'ok' : 'gold'}">${done ? '✓ Completed' : m.stage === 'ongoing' ? 'Ongoing' : 'Module'}</span>${m.depts.length > 1 && !m.depts.includes('ALL') ? '<span class="badge info" title="Shared across departments — completing it once counts everywhere">Shared</span>' : ''}</div>
      <h3>${esc(m.title)}</h3>
      <p class="muted small" style="margin:0">${esc(m.intro)}</p>
      <div class="meta"><span>⏱ ${m.minutes} min</span><span>· ${m.docs.length} lesson${m.docs.length > 1 ? 's' : ''}</span><span>· ${m.quiz.length}-question check</span></div>
      ${done ? `<span class="muted small">Completed ${fmtDate(done.date)}${done.score != null ? ' · score ' + done.score + '%' : ''}</span>` : ''}
    </a>`;
  }
  function updateCard(me, x) {
    const done = S.done(me.id, 'update', x.ref);
    return `<a class="card module-card update-card" href="#/learn/update/${x.doc.id}">
      <div class="row spread"><span class="badge ${done ? 'ok' : 'warn'}">${done ? '✓ Acknowledged' : 'Update · action needed'}</span><span class="muted small">${fmtDate(x.version.date)}</span></div>
      <h3>${esc(x.doc.title)} — v${esc(x.version.v)}</h3>
      <p class="muted small" style="margin:0">${esc(x.version.summary.slice(0, 120))}${x.version.summary.length > 120 ? '…' : ''}</p>
      <div class="meta"><span>⏱ 3 min</span><span>· Read the changes and acknowledge</span></div>
    </a>`;
  }

  /* ---------- module player ---------- */
  let quizAnswers = {};
  function viewModule(id, stepStr) {
    const me = S.me();
    const m = S.mod(id);
    if (!m) return notFound();
    const stage = S.stageStatus(me).find((s) => s.id === m.stage);
    if (stage && !stage.unlocked && !S.done(me.id, 'module', m.id)) return `<div class="card empty"><h2>This module is locked</h2><p>Complete the previous stage first.</p><a class="btn" href="#/learn">Back to Learn</a></div>`;
    const docs = m.docs.map(S.doc).filter((d) => d && d.status === 'published');
    const steps = ['intro', ...docs.map((d) => d.id), 'quiz'];
    const step = Math.min(Math.max(parseInt(stepStr || '0', 10) || 0, 0), steps.length - 1);
    const done = S.done(me.id, 'module', m.id);
    const nav = `<nav aria-label="Module steps"><p class="muted small" style="margin:0 0 8px"><a href="#/learn">← Learn</a></p><ol>${steps.map((s, i) => {
      const label = s === 'intro' ? 'Overview' : s === 'quiz' ? 'Knowledge check' : S.doc(s).title;
      return `<li><a href="#/learn/module/${m.id}/${i}" class="${i === step ? 'active' : ''} ${i < step || done ? 'done' : ''}">${esc(label)}</a></li>`;
    }).join('')}</ol>
      <div style="margin-top:14px">${progressBar(Math.round((step / (steps.length - 1)) * 100))}</div></nav>`;

    let body = '';
    const s = steps[step];
    if (s === 'intro') {
      body = `<span class="badge gold">${esc(S.STAGES.find((x) => x.id === m.stage).label)}</span>
        <h1 style="margin-top:8px">${esc(m.title)}</h1><p>${esc(m.intro)}</p>
        <p class="muted">${docs.length} lesson${docs.length > 1 ? 's' : ''} · about ${m.minutes} minutes · a short knowledge check at the end (80% to pass).</p>
        ${done ? `<div class="note">You completed this module on ${fmtDate(done.date)}. It stays open for review any time.</div>` : ''}
        <div class="note info" style="margin-top:12px"><strong>Single source of truth:</strong> lessons are pulled live from the current version of each document in <em>Know</em>. When L&amp;D publishes a new version, this module updates automatically.</div>
        <div style="margin-top:20px"><a class="btn" href="#/learn/module/${m.id}/1">Begin →</a></div>`;
    } else if (s === 'quiz') {
      body = quizView(m, me, done);
    } else {
      const d = S.doc(s), v = S.current(d);
      body = `<div class="row spread"><span class="source-tag">📄 From Know: <a href="#/know/doc/${d.id}">${esc(d.title)}</a> · v${esc(v.v)} · updated ${fmtDate(v.date)}</span></div>
        <h1 style="margin-top:12px">${esc(d.title)}</h1>
        <div class="doc-body">${v.sections.map((x) => `<h2>${esc(x.h)}</h2>${md(x.body)}`).join('')}</div>
        <div class="row spread" style="margin-top:28px">
          <a class="btn btn-ghost" href="#/learn/module/${m.id}/${step - 1}">← Back</a>
          <a class="btn" href="#/learn/module/${m.id}/${step + 1}">${steps[step + 1] === 'quiz' ? 'Go to knowledge check →' : 'Next lesson →'}</a></div>`;
    }
    return `<div class="reader">${nav}<article class="card">${body}</article></div>`;
  }

  function quizView(m, me, done) {
    const key = m.id;
    const st = quizAnswers[key] || (quizAnswers[key] = { picks: {}, submitted: false });
    const qs = m.quiz.map((q, qi) => `
      <div class="quiz-q"><p><strong>${qi + 1}. ${esc(q.q)}</strong></p>
        ${q.options.map((o, oi) => {
          let cls = '';
          if (st.submitted) { if (oi === q.a) cls = 'correct'; else if (st.picks[qi] === oi) cls = 'wrong'; }
          return `<label class="opt ${cls}"><input type="radio" name="q${qi}" value="${oi}" ${st.picks[qi] === oi ? 'checked' : ''} ${st.submitted ? 'disabled' : ''}> ${esc(o)}</label>`;
        }).join('')}
        ${st.submitted && st.picks[qi] !== q.a ? `<p class="small" style="margin-top:8px">Review: <a href="#/know/doc/${q.docRef}">${esc(S.doc(q.docRef).title)}</a></p>` : ''}
      </div>`).join('');
    let result = '';
    if (st.submitted) {
      const right = m.quiz.filter((q, i) => st.picks[i] === q.a).length;
      const score = Math.round((right / m.quiz.length) * 100);
      result = score >= 80
        ? `<div class="note" style="border-color:var(--ok);background:var(--ok-soft)"><strong>Passed — ${score}%.</strong> This module is recorded as complete${S.done(me.id, 'module', m.id) ? '' : ''}. <a href="#/learn">Back to your queue →</a></div>`
        : `<div class="note" style="border-color:var(--warn);background:var(--warn-soft)"><strong>${score}% — not quite.</strong> Review the highlighted sources and try again. <button class="btn btn-sm" id="retry" type="button" style="margin-left:8px">Try again</button></div>`;
    }
    return `<h1>Knowledge check</h1><p class="muted">${m.quiz.length} question${m.quiz.length > 1 ? 's' : ''} · 80% to pass${done ? ` · you passed on ${fmtDate(done.date)} — retake any time` : ''}</p>
      <form id="quizForm">${qs}</form>
      ${result || `<button class="btn" id="submitQuiz" type="button" style="margin-top:16px">Submit answers</button>`}`;
  }

  function bindModule(id) {
    const me = S.me(); const m = S.mod(id); if (!m) return;
    const st = quizAnswers[m.id];
    const form = $('#quizForm');
    if (form) form.addEventListener('change', (e) => { if (e.target.name) st.picks[+e.target.name.slice(1)] = +e.target.value; });
    const sub = $('#submitQuiz');
    if (sub) sub.addEventListener('click', () => {
      if (Object.keys(st.picks).length < m.quiz.length) { toast('Please answer every question'); return; }
      st.submitted = true;
      const right = m.quiz.filter((q, i) => st.picks[i] === q.a).length;
      const score = Math.round((right / m.quiz.length) * 100);
      if (score >= 80) { S.complete(me.id, 'module', m.id, score); toast('Module complete ✓'); }
      rerender();
    });
    const retry = $('#retry');
    if (retry) retry.addEventListener('click', () => { quizAnswers[m.id] = { picks: {}, submitted: false }; rerender(); });
  }

  /* ---------- update acknowledgement ---------- */
  function viewUpdate(docId) {
    const me = S.me();
    const d = S.doc(docId); if (!d) return notFound();
    const v = S.current(d);
    const idx = d.versions.indexOf(v);
    const prev = d.versions.slice(0, idx).reverse().find((x) => x.status === 'archived');
    const ref = d.id + '@' + v.v;
    const done = S.done(me.id, 'update', ref);
    return `<p class="small"><a href="#/learn">← Learn</a></p>
      <div class="card stack">
        <div><span class="badge warn">Process update</span> <span class="muted small">Published ${fmtDate(v.date)} · applies to ${esc(S.deptNames(d.depts))}</span>
        <h1 style="margin-top:8px">${esc(d.title)} — v${esc(v.v)}</h1></div>
        <div class="changes"><h3>What changed</h3><p style="margin:0">${esc(v.summary)}</p></div>
        <details><summary style="cursor:pointer;font-weight:500">See the exact wording changes${prev ? ' (v' + esc(prev.v) + ' → v' + esc(v.v) + ')' : ''}</summary>
          <div class="doc-body" style="margin-top:12px">${sectionDiff(prev, v)}</div></details>
        <p>The full, current document is always in Know: <a href="#/know/doc/${d.id}">${esc(d.title)} →</a></p>
        ${done ? `<div class="note" style="border-color:var(--ok);background:var(--ok-soft)">✓ You acknowledged this update on ${fmtDate(done.date)}. This is kept on your learning record.</div>`
          : `<label class="opt"><input type="checkbox" id="ackBox"> I have read and understand these changes.</label>
             <button class="btn" id="ackBtn" type="button" disabled>Acknowledge update</button>`}
      </div>`;
  }
  function bindUpdate(docId) {
    const box = $('#ackBox'), btn = $('#ackBtn');
    if (!box) return;
    box.addEventListener('change', () => { btn.disabled = !box.checked; });
    btn.addEventListener('click', () => {
      const d = S.doc(docId), v = S.current(d);
      S.complete(S.me().id, 'update', d.id + '@' + v.v);
      toast('Update acknowledged ✓'); location.hash = '#/learn';
    });
  }

  /* ---------- learning record ---------- */
  function recordTable(u) {
    const rows = S.transcript(u).map((c) => {
      let title, type;
      if (c.kind === 'module') { const m = S.mod(c.ref); title = m ? m.title : c.ref; type = m ? S.STAGES.find((s) => s.id === m.stage).label : 'Module'; }
      else { const [docId, v] = c.ref.split('@'); const d = S.doc(docId); title = (d ? d.title : docId) + ' — v' + v; type = 'Update acknowledged'; }
      return `<tr><td>${fmtDate(c.date)}</td><td>${esc(title)}</td><td>${esc(type)}</td><td>${c.score != null ? c.score + '%' : '—'}</td></tr>`;
    }).join('');
    return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Score</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="muted">No completions yet.</td></tr>'}</tbody></table></div>`;
  }
  function viewRecord() {
    const me = S.me();
    return `<p class="small"><a href="#/learn">← Learn</a></p>
      <div class="page-head"><h1>My learning record</h1><p>A permanent record of every module and update you've completed — including acknowledgements of document versions that have since been archived.</p></div>
      ${me.deptHistory.length ? `<div class="note info" style="margin-bottom:16px">Department history: ${me.deptHistory.map((h) => esc(S.dept(h.dept)) + ' (until ' + fmtDate(h.to) + ')').join(', ')} → <strong>${esc(S.dept(me.dept))}</strong>. Company-wide and shared modules carried over; only new departmental units were added to your queue.</div>` : ''}
      <div class="card">${recordTable(me)}</div>`;
  }

  /* =========================================================================
     KNOW
     ========================================================================= */
  let knowQuery = '';
  function viewKnow(catId) {
    const me = S.me();
    const docs = S.visibleDocs(me);
    const cats = S.state.categories;
    const recent = docs.map((d) => ({ d, v: S.current(d) })).sort((a, b) => (a.v.date < b.v.date ? 1 : -1)).slice(0, 4);
    const list = catId ? docs.filter((d) => d.category === catId) : docs;
    return `
      <div class="page-head"><h1>Know</h1>
        <p>Searchable reference for day-to-day work. You're seeing documents for <strong>${S.isAdmin(me) ? 'all departments (admin view)' : esc(S.dept(me.dept)) + '</strong> plus company-wide documents<strong>'}</strong>.</p></div>
      <div class="search-big"><input type="search" id="knowSearch" placeholder="Search documents, e.g. “rush order”, “14K”, “RMA”" value="${esc(knowQuery)}" aria-label="Search the knowledge base"></div>
      <div id="knowResults" style="margin-top:20px"></div>
      <div id="knowBrowse">
        <div class="pill-row" style="margin:20px 0 16px">
          <a class="chip ${!catId ? 'active' : ''}" href="#/know" style="text-decoration:none">All</a>
          ${cats.map((c) => `<a class="chip ${catId === c.id ? 'active' : ''}" href="#/know/cat/${c.id}" style="text-decoration:none">${esc(c.name)}</a>`).join('')}
        </div>
        ${!catId ? `<div class="grid grid-3">${cats.map((c) => {
          const n = docs.filter((d) => d.category === c.id).length;
          return `<a class="card cat-card" href="#/know/cat/${c.id}"><span class="cat-icon" aria-hidden="true">${c.icon}</span><span><strong>${esc(c.name)}</strong><br><span class="muted small">${n} document${n === 1 ? '' : 's'}</span></span></a>`;
        }).join('')}</div>
        <h2 style="margin-top:28px">Recently updated</h2>` : `<h2>${esc(S.cat(catId).name)}</h2>`}
        <div class="card" style="padding:4px 16px">${(catId ? list.map((d) => ({ d, v: S.current(d) })) : recent).map(({ d, v }) => docRow(d, v)).join('') || '<p class="empty">No documents in this category for your department.</p>'}</div>
      </div>`;
  }
  function docRow(d, v, snippet) {
    return `<a class="doc-row" href="#/know/doc/${d.id}"><span><span class="doc-title">${esc(d.title)}</span><br>
      <span class="muted small">${esc(S.cat(d.category).name)}${snippet ? ' · ' + snippet : ''}</span></span>
      <span class="muted small" style="text-align:right;white-space:nowrap">v${esc(v.v)}<br>${fmtDate(v.date)}</span></a>`;
  }
  function bindKnow() {
    const input = $('#knowSearch');
    const run = () => {
      knowQuery = input.value;
      const q = knowQuery.trim().toLowerCase();
      const res = $('#knowResults'), browse = $('#knowBrowse');
      if (!q) { res.innerHTML = ''; browse.hidden = false; return; }
      browse.hidden = true;
      const words = q.split(/\s+/).filter(Boolean);
      const hits = S.visibleDocs(S.me()).map((d) => {
        const v = S.current(d);
        const hay = (d.title + ' ' + d.tags.join(' ') + ' ' + v.sections.map((s) => s.h + ' ' + s.body).join(' ')).toLowerCase();
        const score = words.reduce((a, w) => a + (hay.includes(w) ? 1 : 0) + (d.title.toLowerCase().includes(w) ? 2 : 0), 0);
        const sec = v.sections.find((s) => words.some((w) => (s.h + ' ' + s.body).toLowerCase().includes(w)));
        let snippet = '';
        if (sec) {
          const p = plain(sec.body).replace(/\n/g, ' ');
          const at = Math.max(0, p.toLowerCase().indexOf(words.find((w) => p.toLowerCase().includes(w)) || '') - 40);
          snippet = esc((at ? '…' : '') + p.slice(at, at + 130) + '…');
          words.forEach((w) => { snippet = snippet.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
        }
        return { d, v, score, snippet, allMatch: words.every((w) => hay.includes(w)) };
      }).filter((h) => h.score > 0 && h.allMatch).sort((a, b) => b.score - a.score);
      res.innerHTML = `<p class="muted small">${hits.length} result${hits.length === 1 ? '' : 's'} for “${esc(knowQuery)}” · current versions only</p>
        <div class="card" style="padding:4px 16px">${hits.map((h) => docRow(h.d, h.v, h.snippet)).join('') || `<div class="empty">No matching documents. <button class="link-btn" id="noResSuggest" type="button">Ask L&amp;D to cover this →</button></div>`}</div>`;
      const nr = $('#noResSuggest'); if (nr) nr.addEventListener('click', () => suggestModal('I searched the Knowledge Center for "' + knowQuery + '" and couldn\'t find anything.', 'request'));
    };
    input.addEventListener('input', run);
    if (knowQuery) run();
  }

  function viewDoc(id, section) {
    const me = S.me();
    const d = S.doc(id);
    if (!d || (d.status !== 'published' && !S.isAdmin(me))) return notFound();
    if (!S.isAdmin(me) && !(d.depts.includes('ALL') || d.depts.includes(me.dept))) return `<div class="card empty"><h2>Not available for your department</h2><p>This document is filtered to ${esc(S.deptNames(d.depts))}.</p><a class="btn" href="#/know">Back to Know</a></div>`;
    const v = S.current(d);
    if (!v) return notFound();
    const owner = S.user(d.owner);
    const history = d.versions.filter((x) => x.status === 'current' || x.status === 'archived').slice().reverse();
    const usedIn = S.state.modules.filter((m) => m.docs.includes(d.id));
    return `<p class="small"><a href="#/know">← Know</a> / <a href="#/know/cat/${d.category}">${esc(S.cat(d.category).name)}</a></p>
      <div class="reader">
        <nav aria-label="Sections"><ol>${v.sections.map((s, i) => `<li><a href="#/know/doc/${d.id}/${i}" class="${String(i) === section ? 'active' : ''}">${esc(s.h)}</a></li>`).join('')}</ol>
          <div class="card small" style="margin-top:16px;padding:14px">
            <div><strong>Version</strong> ${esc(v.v)} <span class="badge ok">Current</span></div>
            <div class="muted">Updated ${fmtDate(v.date)}</div>
            <div style="margin-top:8px"><strong>Applies to</strong><br>${deptBadges(d.depts)}</div>
            <div style="margin-top:8px"><strong>Subject-matter expert</strong><br>${esc(owner ? owner.name : '—')}</div>
            ${usedIn.length ? `<div style="margin-top:8px"><strong>Taught in</strong><br>${usedIn.map((m) => `<a href="#/learn/module/${m.id}">${esc(m.title)}</a>`).join('<br>')}</div>` : ''}
          </div></nav>
        <article class="card">
          <h1>${esc(d.title)}</h1>
          <div class="doc-body">${v.sections.map((s, i) => `<h2 id="sec-${i}">${esc(s.h)}</h2>${md(s.body)}`).join('')}</div>
          <hr style="border:0;border-top:1px solid var(--border);margin:28px 0 16px">
          <h3>Change log</h3>
          <ul class="small" style="padding-left:1.2em">${history.map((x) => `<li><strong>v${esc(x.v)}</strong> · ${fmtDate(x.date)} — ${esc(x.summary)}${x.status === 'archived' ? ' <span class="muted">(archived)</span>' : ''}</li>`).join('')}</ul>
          <div class="row" style="margin-top:16px">
            <button class="btn btn-ghost btn-sm" id="docQuestion" type="button">Question about this document?</button>
            <button class="btn btn-ghost btn-sm" type="button" onclick="window.print()">Print / save as PDF</button>
            ${S.isAdmin(me) ? `<a class="btn btn-sm" href="#/manage/edit/${d.id}">Edit in Manage</a>` : ''}
          </div>
        </article>
      </div>`;
  }
  function bindDoc(id, section) {
    const b = $('#docQuestion'); if (b) b.addEventListener('click', () => suggestModal('About "' + S.doc(id).title + '": ', 'question'));
    if (section != null) { const el = $('#sec-' + section); if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); }
  }

  /* =========================================================================
     ASK (simulated)
     ========================================================================= */
  let askLog = [];
  const SUGGESTED = ['Who approves a rush order?', 'How long is an RMA valid?', 'What should I check if an order is stuck in pending production?', 'How much gold is in 14K?', 'What is the parental leave policy?'];
  function answerHtml(r) {
    if (!r.found) return `<p>I couldn't find a reliable answer to that in the approved documentation available to you, so I won't guess.</p>
      <p class="small muted">You could ask your supervisor, or send the question to L&amp;D so it can be documented.</p>
      <button class="btn btn-sm send-ld" type="button">Send this question to L&amp;D</button>`;
    const t = r.top;
    const text = plain(t.s.body).replace(/\n+/g, ' ').trim();
    const short = text.length > 320 ? text.slice(0, 320).replace(/\s\S*$/, '') + '…' : text;
    const idx = t.v.sections.indexOf(t.s);
    const answer = t.s.body.length <= 600 ? md(t.s.body) : '<p>' + esc(short) + '</p>';
    return `<p style="margin-bottom:6px"><strong>${esc(t.s.h)}</strong></p>${answer}
      <div class="sources"><strong>Source</strong> — <a href="#/know/doc/${t.d.id}/${idx}">${esc(t.d.title)} › ${esc(t.s.h)}</a> <span class="muted">(v${esc(t.v.v)}, ${fmtDate(t.v.date)})</span>
      ${r.related.length ? `<br><strong>Related</strong> — ${r.related.map((h) => `<a href="#/know/doc/${h.d.id}/${h.v.sections.indexOf(h.s)}">${esc(h.d.title)} › ${esc(h.s.h)}</a>`).join(' · ')}` : ''}
      <br><span class="muted">Please check the source before acting.</span></div>`;
  }
  function viewAsk() {
    const me = S.me();
    return `<div class="page-head"><h1>Ask</h1>
        <p>Ask a question in plain language. Answers come only from <strong>current, approved</strong> documents for your department (never archived versions), always with a link to the source.</p></div>
      <div class="note info" style="margin-bottom:16px"><strong>Prototype:</strong> this demo uses simple keyword matching to show the intended behaviour. The production version would use an AI model restricted to the same approved documents — see <code>docs/REQUIREMENTS.md</code>.</div>
      <div class="card">
        <div class="chat" id="chat" aria-live="polite">
          <div class="msg bot">Hi ${esc(firstName(me))} — I can help you find answers in the ${esc(S.isAdmin(me) ? 'company' : S.dept(me.dept))} documentation. What do you need?</div>
          ${askLog.map((x) => `<div class="msg user">${esc(x.q)}</div><div class="msg bot" data-q="${esc(x.q)}">${answerHtml(x.r)}</div>`).join('')}
        </div>
        <div class="pill-row" style="margin-top:16px">${SUGGESTED.map((q) => `<button class="chip ask-chip" type="button">${esc(q)}</button>`).join('')}</div>
        <form class="chat-input" id="askForm"><input type="text" id="askInput" placeholder="e.g. Do I need photos before approving a return?" aria-label="Your question" autocomplete="off"><button class="btn" type="submit">Ask</button></form>
      </div>`;
  }
  function bindAsk() {
    const go = (q) => { if (!q.trim()) return; askLog.push({ q, r: S.ask(S.me(), q) }); rerender(); setTimeout(() => { const c = $('#chat'); c.lastElementChild.scrollIntoView({ block: 'nearest' }); $('#askInput').focus(); }, 20); };
    $('#askForm').addEventListener('submit', (e) => { e.preventDefault(); go($('#askInput').value); });
    $$('.ask-chip').forEach((b) => b.addEventListener('click', () => go(b.textContent)));
    $$('.send-ld').forEach((b) => b.addEventListener('click', () => {
      const q = b.closest('.msg').dataset.q;
      S.submit(S.me().id, 'question', q + '  (asked via the Ask assistant — no answer found)');
      b.replaceWith(Object.assign(document.createElement('span'), { className: 'badge ok', textContent: '✓ Sent to L&D' }));
    }));
  }

  /* =========================================================================
     MY TEAM (supervisors see their reports; admin sees everyone)
     ========================================================================= */
  function viewTeam() {
    const me = S.me();
    const team = S.team(me);
    const rows = team.map((u) => {
      const p = S.progress(u);
      const st = (id) => p.stages.find((s) => s.id === id);
      const onb = ['foundation', 'products'].map(st).reduce((a, s) => [a[0] + s.done, a[1] + s.total], [0, 0]);
      const path = st('path');
      const pendingUpd = S.requiredUpdates(u).filter((x) => !S.done(u.id, 'update', x.ref)).length;
      const last = S.transcript(u)[0];
      const pc = (d, t) => t ? Math.round((d / t) * 100) : 100;
      return `<tr>
        <td><a href="#/team/${u.id}"><strong>${esc(u.name)}</strong></a><br><span class="muted small">${esc(u.title)}</span></td>
        <td>${esc(S.dept(u.dept))}</td>
        <td class="cell-pct">${pc(onb[0], onb[1])}%${progressBar(pc(onb[0], onb[1]))}</td>
        <td class="cell-pct">${pc(path.done, path.total)}%${progressBar(pc(path.done, path.total))}</td>
        <td>${pendingUpd ? `<span class="badge warn">${pendingUpd} pending</span>` : '<span class="badge ok">Up to date</span>'}</td>
        <td><strong>${p.pct}%</strong></td>
        <td class="muted small">${last ? fmtDate(last.date) : '—'}</td></tr>`;
    }).join('');
    return `<div class="page-head"><h1>My Team</h1><p>${me.role === 'admin' ? 'All employees (L&D view).' : 'Your direct reports.'} See onboarding progress and whether everyone has acknowledged the latest process updates.</p></div>
      <div class="card table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Onboarding</th><th>Dept. path</th><th>Updates</th><th>Overall</th><th>Last activity</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty">No team members.</td></tr>'}</tbody></table></div>`;
  }
  function viewMember(id) {
    const me = S.me();
    const u = S.user(id);
    if (!u || !S.team(me).includes(u)) return notFound();
    const p = S.progress(u);
    const out = S.outstanding(u);
    return `<p class="small"><a href="#/team">← My Team</a></p>
      <div class="page-head row spread"><div><h1>${esc(u.name)}</h1><p>${esc(u.title)} · ${esc(S.dept(u.dept))} · started ${fmtDate(u.start)}</p></div>
        ${S.isAdmin(me) ? `<div style="min-width:240px"><label for="xfer">Department (demo a transfer)</label><select id="xfer">${S.state.departments.map((d) => `<option value="${d.id}" ${d.id === u.dept ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>` : ''}</div>
      <div class="grid grid-2">
        <div class="card"><h2>Progress — ${p.pct}%</h2>${progressBar(p.pct)}
          <table style="margin-top:12px"><tbody>${p.stages.map((s) => `<tr><td>${esc(s.label)}</td><td style="text-align:right">${s.done}/${s.total} ${s.complete ? '<span class="badge ok">✓</span>' : ''}</td></tr>`).join('')}</tbody></table></div>
        <div class="card"><h2>Outstanding (${out.length})</h2>${out.length ? '<ul class="small" style="padding-left:1.2em">' + out.map((o) => `<li>${o.kind === 'update' ? '<span class="badge warn">Update</span> ' + esc(o.x.doc.title) + ' v' + esc(o.x.version.v) : esc(o.m.title)}</li>`).join('') + '</ul>' : '<p class="muted">All caught up.</p>'}</div>
      </div>
      <h2 style="margin-top:24px">Learning record</h2><div class="card">${recordTable(u)}</div>`;
  }
  function bindMember(id) {
    const x = $('#xfer'); if (!x) return;
    x.addEventListener('change', () => { S.transfer(id, x.value); toast('Moved to ' + S.dept(x.value) + ' — only new departmental units were added'); rerender(); });
  }

  /* =========================================================================
     MANAGE (L&D admin only)
     ========================================================================= */
  const statusBadge = (d) => ({ published: '<span class="badge ok">Published</span>', in_review: '<span class="badge warn">In review</span>', draft: '<span class="badge">Draft</span>' }[d.status] || '');
  function manageTabs(active) {
    const reviewN = S.state.documents.filter((d) => d.status === 'in_review').length;
    const reqN = S.state.submissions.filter((s) => s.status === 'new').length;
    const t = [['overview', 'Overview'], ['library', 'Document library'], ['review', 'Review queue' + (reviewN ? ` <span class="badge warn">${reviewN}</span>` : '')], ['archive', 'Archive'], ['paths', 'Learning paths'], ['requests', 'Requests' + (reqN ? ` <span class="badge warn">${reqN}</span>` : '')]];
    return `<div class="page-head"><h1>Manage <span class="lock">🔒 L&amp;D only</span></h1><p>Organize, review, version and publish documentation. Employees never see this area.</p></div>
      <div class="tabs">${t.map(([k, l]) => `<a href="#/manage/${k}" class="${k === active ? 'active' : ''}">${l}</a>`).join('')}</div>`;
  }

  function viewManageOverview() {
    const docs = S.state.documents;
    const pub = docs.filter((d) => d.status === 'published').length;
    const arch = S.archivedVersions().length;
    const recentPublishes = [];
    docs.forEach((d) => d.versions.forEach((v) => { if (v.status === 'current' || v.status === 'archived') recentPublishes.push({ d, v }); }));
    recentPublishes.sort((a, b) => (a.v.date < b.v.date ? 1 : -1));
    const employees = S.state.users.filter((u) => u.role !== 'admin');
    const pendingAcks = employees.reduce((a, u) => a + S.requiredUpdates(u).filter((x) => !S.done(u.id, 'update', x.ref)).length, 0);
    return manageTabs('overview') + `
      <p class="muted small">Same mental model as today's SharePoint setup — three “folders”, but with automatic version history and learning records.</p>
      <div class="grid grid-3">
        <a class="card folder" href="#/manage/library" style="text-decoration:none;color:inherit"><span class="ico">📁</span><div><div class="count">${docs.length}</div><strong>Master documents</strong><div class="lock">🔒 Restricted · editable source of every doc</div></div></a>
        <a class="card folder" href="#/manage/archive" style="text-decoration:none;color:inherit"><span class="ico">🗄️</span><div><div class="count">${arch}</div><strong>Archived versions</strong><div class="lock">🔒 Restricted · kept with completion records</div></div></a>
        <a class="card folder" href="#/know" style="text-decoration:none;color:inherit"><span class="ico">📂</span><div><div class="count">${pub}</div><strong>Published (current)</strong><div class="lock">Visible in Know, filtered by department</div></div></a>
      </div>
      <div class="grid grid-2" style="margin-top:16px">
        <div class="card"><h2>Recent publishing activity</h2><ul class="small" style="padding-left:1.2em">${recentPublishes.slice(0, 6).map(({ d, v }) => `<li><strong>${esc(d.title)}</strong> v${esc(v.v)} · ${fmtDate(v.date)} · ${v.type === 'major' ? (v.pushed ? '<span class="badge warn">Pushed to queues</span>' : '<span class="badge">Major</span>') : v.type === 'minor' ? '<span class="badge">Silent (minor)</span>' : '<span class="badge info">New</span>'}</li>`).join('')}</ul></div>
        <div class="card"><h2>Needs attention</h2>
          <p><a href="#/manage/review">${docs.filter((d) => d.status === 'in_review').length} SME submission(s) awaiting review →</a></p>
          <p><a href="#/manage/requests">${S.state.submissions.filter((s) => s.status === 'new').length} new employee request(s) →</a></p>
          <p><a href="#/team">${pendingAcks} outstanding update acknowledgement(s) across employees →</a></p>
          <button class="btn btn-sm" id="newDocBtn" type="button">+ New document</button></div>
      </div>`;
  }

  function viewLibrary() {
    const docs = S.state.documents;
    return manageTabs('library') + `
      <div class="row spread" style="margin-bottom:12px"><input type="search" id="libFilter" placeholder="Filter by title, category, department or SME" style="max-width:380px"><button class="btn" id="newDocBtn" type="button">+ New document</button></div>
      <div class="card table-wrap"><table id="libTable"><thead><tr><th>Document</th><th>Category</th><th>Shown to</th><th>SME</th><th>Version</th><th>Status</th><th></th></tr></thead><tbody>
      ${docs.map((d) => { const v = S.current(d) || d.versions[d.versions.length - 1]; return `<tr data-search="${esc((d.title + ' ' + S.cat(d.category).name + ' ' + S.deptNames(d.depts) + ' ' + (S.user(d.owner) || {}).name).toLowerCase())}">
        <td><strong>${esc(d.title)}</strong><br><span class="muted small">Master: ${esc(d.title.replace(/[^A-Za-z0-9]+/g, '-'))}_v${esc(v.v)}.docx</span></td>
        <td>${esc(S.cat(d.category).name)}</td><td>${deptBadges(d.depts)}</td><td>${esc((S.user(d.owner) || {}).name || '')}</td>
        <td>v${esc(v.v)}<br><span class="muted small">${fmtDate(v.date)}</span></td><td>${statusBadge(d)}</td>
        <td style="white-space:nowrap">${d.status === 'published' ? `<a class="btn btn-ghost btn-sm" href="#/know/doc/${d.id}">View</a> ` : ''}<a class="btn btn-sm" href="#/manage/edit/${d.id}">${d.status === 'in_review' ? 'Review' : 'New version'}</a></td></tr>`; }).join('')}
      </tbody></table></div>`;
  }
  function bindNewDoc() {
    const b = $('#newDocBtn'); if (!b) return;
    b.addEventListener('click', () => openModal(`
      <h2 id="modalTitle">New document</h2>
      <div class="field"><label for="ndTitle">Title</label><input type="text" id="ndTitle"></div>
      <div class="field"><label for="ndCat">Category</label><select id="ndCat">${S.state.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="ndOwner">Subject-matter expert</label><select id="ndOwner">${S.state.users.map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn" id="ndCreate" type="button">Create draft</button></div>`, (card) => {
      $('#ndCreate', card).addEventListener('click', () => {
        const title = $('#ndTitle', card).value.trim(); if (!title) return $('#ndTitle', card).focus();
        const id = 'D' + (S.state.documents.length + 1) + 'x' + Date.now().toString(36).slice(-3);
        S.state.documents.push({ id, title, category: $('#ndCat', card).value, depts: ['ALL'], owner: $('#ndOwner', card).value, status: 'draft', tags: [],
          versions: [{ v: '0.1', date: S.state.today, type: 'draft', by: S.me().id, status: 'draft', summary: 'Draft created.', sections: [{ h: 'Purpose', body: '' }] }] });
        S.save(); closeModal(); location.hash = '#/manage/edit/' + id;
      });
    }));
  }
  function bindLibrary() {
    bindNewDoc();
    $('#libFilter').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('#libTable tbody tr').forEach((tr) => { tr.hidden = !tr.dataset.search.includes(q); }); });
  }

  /* ---------- edit / publish ---------- */
  let editDraft = null;
  function viewEdit(id) {
    const d = S.doc(id); if (!d) return notFound();
    const base = d.versions.find((v) => v.status === 'draft') || S.current(d);
    if (!editDraft || editDraft.id !== id) editDraft = { id, sections: JSON.parse(JSON.stringify(base.sections)), depts: d.depts.slice() };
    const isNew = !S.current(d);
    const audience = S.state.users.filter((u) => u.role !== 'admin' && (editDraft.depts.includes('ALL') || editDraft.depts.includes(u.dept))).length;
    return manageTabs(d.status === 'in_review' ? 'review' : 'library') + `
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,340px);align-items:start" id="editGrid">
        <div class="card">
          <div class="row spread"><div><span class="muted small">${isNew ? 'New document' : 'Editing master · based on v' + esc(base.v)}</span><h2 style="margin:4px 0 0">${esc(d.title)}</h2></div>${statusBadge(d)}</div>
          ${d.status === 'in_review' ? `<div class="note" style="margin-top:12px">Submitted by <strong>${esc(S.user(base.by).name)}</strong> (SME) on ${fmtDate(base.date)}. L&amp;D reviews structure, writing standards and formatting; the SME is accountable for technical accuracy.</div>` : ''}
          <p class="muted small" style="margin-top:12px">Master file: <strong>${esc(d.title.replace(/[^A-Za-z0-9]+/g, '-'))}.docx</strong> · 🔒 restricted. <span title="In production: upload the Word master; the site converts it to web content + PDF">(In production: upload/replace Word master here.)</span></p>
          <div id="sections" style="margin-top:12px">${editDraft.sections.map((s, i) => `
            <div class="section-editor" data-i="${i}">
              <div class="row spread"><label for="h${i}" style="margin:0">Section ${i + 1} heading</label><button class="link-btn small rm-sec" type="button">Remove</button></div>
              <input type="text" id="h${i}" class="sec-h" value="${esc(s.h)}" style="margin:4px 0 8px">
              <textarea class="sec-b" aria-label="Section ${i + 1} body" style="min-height:100px">${esc(s.body)}</textarea></div>`).join('')}</div>
          <button class="btn btn-ghost btn-sm" id="addSec" type="button">+ Add section</button>
          <p class="muted small" style="margin-top:8px">Formatting: blank line = new paragraph, “- ” = bullet, **bold**.</p>
        </div>
        <aside class="card stack">
          <h2 style="margin:0">Publish</h2>
          <div><label>Shown to (display filter)</label>
            <div class="pill-row">${[{ id: 'ALL', name: 'All departments' }, ...S.state.departments].map((x) => `<label class="chip ${editDraft.depts.includes(x.id) ? 'active' : ''}" style="font-weight:400;margin:0"><input type="checkbox" class="dept-cb" value="${x.id}" ${editDraft.depts.includes(x.id) ? 'checked' : ''} hidden>${esc(x.name)}</label>`).join('')}</div>
            <p class="muted small" style="margin:6px 0 0">${audience} employee(s) will see this document.</p></div>
          ${isNew ? '' : `<div><label>Type of change</label>
            <label class="radio-card"><input type="radio" name="ctype" value="minor" ${editDraft.ctype !== 'major' ? 'checked' : ''}><span><strong>Minor</strong> — formatting, typos, clarification<br><span class="muted small">Publishes silently as v${esc(S.nextVersion(S.current(d).v, 'minor'))}. Not added to learning queues.</span></span></label>
            <label class="radio-card" style="margin-top:8px"><input type="radio" name="ctype" value="major" ${editDraft.ctype === 'major' ? 'checked' : ''}><span><strong>Major</strong> — process or policy change<br><span class="muted small">Publishes as v${esc(S.nextVersion(S.current(d).v, 'major'))}.</span></span></label></div>`}
          <label class="opt" style="margin:0"><input type="checkbox" id="pushQ" ${isNew || editDraft.ctype === 'major' ? '' : 'disabled'} ${editDraft.push ? 'checked' : ''}> <span>Push to learning queues${isNew ? ' (e.g. a product launch everyone must read)' : ''}</span></label>
          <div><label for="summary">Summary of changes <span class="muted small">(employees see this in their queue)</span></label>
            <textarea id="summary" style="min-height:90px" placeholder="${isNew ? 'Initial release.' : 'e.g. Retailers must now send photos before an RMA is approved.'}">${esc(editDraft.summary || '')}</textarea></div>
          ${isNew ? '' : `<details><summary style="cursor:pointer;font-weight:500">Preview changes vs. v${esc(S.current(d).v)}</summary><div class="doc-body small" id="diffPreview" style="margin-top:8px"></div></details>`}
          <p class="muted small" style="margin:0">On publish, v${esc(isNew ? '1.0' : S.current(d).v)}${isNew ? ' becomes current' : ' moves to the Archive (restricted) with its completion records'}.</p>
          <div class="row"><button class="btn" id="publishBtn" type="button">Publish</button>
            ${d.status === 'in_review' ? '<button class="btn btn-ghost" id="returnBtn" type="button">Return to SME</button>' : ''}
            <a class="btn btn-ghost" href="#/manage/library" id="cancelEdit">Cancel</a></div>
        </aside>
      </div>`;
  }
  function bindEdit(id) {
    const d = S.doc(id); const isNew = !S.current(d);
    const grid = $('#editGrid'); if (window.innerWidth < 760) grid.style.gridTemplateColumns = '1fr';
    const collect = () => {
      editDraft.sections = $$('.section-editor').map((el) => ({ h: $('.sec-h', el).value, body: $('.sec-b', el).value }));
      editDraft.summary = $('#summary').value; editDraft.push = $('#pushQ').checked;
      const ct = $('input[name=ctype]:checked'); if (ct) editDraft.ctype = ct.value;
    };
    const refreshDiff = () => { const p = $('#diffPreview'); if (p) { collect(); p.innerHTML = sectionDiff(S.current(d), { sections: editDraft.sections }); } };
    $$('.sec-h, .sec-b').forEach((el) => el.addEventListener('input', refreshDiff));
    refreshDiff();
    $('#addSec').addEventListener('click', () => { collect(); editDraft.sections.push({ h: 'New section', body: '' }); rerender(); });
    $$('.rm-sec').forEach((b) => b.addEventListener('click', () => { collect(); editDraft.sections.splice(+b.closest('.section-editor').dataset.i, 1); rerender(); }));
    $$('.dept-cb').forEach((cb) => cb.addEventListener('change', () => {
      collect();
      if (cb.value === 'ALL' && cb.checked) editDraft.depts = ['ALL'];
      else { editDraft.depts = $$('.dept-cb').filter((x) => x.checked && x.value !== 'ALL').map((x) => x.value); if (!editDraft.depts.length) editDraft.depts = ['ALL']; }
      rerender();
    }));
    $$('input[name=ctype]').forEach((r) => r.addEventListener('change', () => { const major = r.value === 'major' && r.checked; $('#pushQ').disabled = !major; $('#pushQ').checked = major; }));
    $('#cancelEdit').addEventListener('click', () => { editDraft = null; });
    const ret = $('#returnBtn');
    if (ret) ret.addEventListener('click', () => { d.status = 'draft'; S.save(); editDraft = null; toast('Returned to SME with comments'); location.hash = '#/manage/review'; });
    $('#publishBtn').addEventListener('click', () => {
      collect();
      const type = isNew ? 'initial' : ($('input[name=ctype]:checked') || {}).value;
      const pushed = $('#pushQ').checked;
      const summary = $('#summary').value.trim() || (isNew ? 'Initial release.' : '');
      if (!summary) { toast('Add a summary of changes'); $('#summary').focus(); return; }
      editDraft.sections = editDraft.sections.map((s) => ({ h: s.h.trim(), body: s.body.trim() }));
      if (editDraft.sections.some((s) => !s.h || !s.body)) { toast('Every section needs a heading and content'); return; }
      const v = S.publish(id, { sections: editDraft.sections, type: type === 'initial' ? 'major' : type, summary, pushed, by: S.me().id, depts: editDraft.depts });
      const sub = S.state.submissions.find((s) => s.docId === id); if (sub) { sub.status = 'done'; S.save(); }
      editDraft = null;
      toast(`Published v${v}` + (pushed ? ' — added to learning queues' : ' — no queue item created'));
      location.hash = '#/manage/library';
    });
  }

  function viewReview() {
    const docs = S.state.documents.filter((d) => d.status === 'in_review' || d.status === 'draft');
    return manageTabs('review') + `<p class="muted">SMEs submit content; L&amp;D shapes it to the writing standard and publishes. Drafts are never visible to employees or the Ask assistant.</p>
      <div class="card" style="padding:4px 16px">${docs.map((d) => { const v = d.versions[d.versions.length - 1]; return `<div class="doc-row"><span><span class="doc-title">${esc(d.title)}</span> ${statusBadge(d)}<br><span class="muted small">From ${esc(S.user(v.by).name)} · ${fmtDate(v.date)} · ${esc(v.summary)}</span></span><a class="btn btn-sm" href="#/manage/edit/${d.id}">Review →</a></div>`; }).join('') || '<p class="empty">Nothing waiting for review.</p>'}</div>`;
  }

  function viewArchive() {
    const rows = S.archivedVersions();
    return manageTabs('archive') + `<p class="muted">Every superseded version is kept here, read-only, together with who acknowledged it. Archived versions are excluded from Know search and from the Ask assistant.</p>
      <div class="card table-wrap"><table><thead><tr><th>Document</th><th>Version</th><th>In effect</th><th>Change type</th><th>Acknowledged by</th><th></th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.doc.title)}</td><td>v${esc(r.v.v)}</td><td class="small">${fmtDate(r.v.date)} → ${fmtDate(r.supersededOn)}</td><td>${r.v.pushed ? '<span class="badge warn">Pushed</span>' : r.v.type === 'minor' ? '<span class="badge">Minor</span>' : '<span class="badge info">' + esc(r.v.type) + '</span>'}</td>
        <td>${r.v.pushed ? r.acks + ' employee(s)' : '<span class="muted">n/a</span>'}</td><td><a class="btn btn-ghost btn-sm" href="#/manage/archive/${r.doc.id}/${r.v.v}">Open</a></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No archived versions.</td></tr>'}
      </tbody></table></div>`;
  }
  function viewArchived(docId, ver) {
    const d = S.doc(docId); const v = d && d.versions.find((x) => x.v === ver);
    if (!v) return notFound();
    const acks = S.state.completions.filter((c) => c.kind === 'update' && c.ref === d.id + '@' + v.v);
    return manageTabs('archive') + `<p class="small"><a href="#/manage/archive">← Archive</a></p>
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(240px,300px);align-items:start">
        <article class="card"><span class="badge">🗄️ Archived · read-only</span><h1 style="margin-top:8px">${esc(d.title)} — v${esc(v.v)}</h1><p class="muted small">${esc(v.summary)}</p>
          <div class="doc-body">${v.sections.map((s) => `<h2>${esc(s.h)}</h2>${md(s.body)}`).join('')}</div></article>
        <aside class="card"><h3>Acknowledgement record</h3>${acks.length ? '<ul class="small" style="padding-left:1.2em">' + acks.map((c) => `<li>${esc(S.user(c.user).name)} — ${fmtDate(c.date)}</li>`).join('') + '</ul>' : '<p class="muted small">This version was not pushed to learning queues, so no acknowledgements were required.</p>'}</aside>
      </div>`;
  }

  function viewPaths() {
    const depts = S.state.departments;
    const stageBlock = (st, mods) => `<div class="card"><h3>${esc(st.label)}</h3>${mods.map((m) => `<div style="padding:8px 0;border-top:1px solid var(--border)"><strong>${esc(m.title)}</strong> ${m.depts.includes('ALL') ? '' : m.depts.length > 1 ? '<span class="badge info">Shared</span>' : ''}<br>
      <span class="small muted">Lessons from Know: </span>${m.docs.map((id) => `<a class="small" href="#/know/doc/${id}">${esc(S.doc(id).title)}</a>`).join(', ')}<span class="small muted"> · ${m.quiz.length} quiz Q</span></div>`).join('') || '<p class="muted small">None yet.</p>'}</div>`;
    return manageTabs('paths') + `<p class="muted">Modules are lightweight wrappers: an intro, an ordered list of Know documents, and a short quiz. No content is duplicated.</p>
      <h2>All employees</h2><div class="grid grid-2">${S.STAGES.slice(0, 2).map((st) => stageBlock(st, S.state.modules.filter((m) => m.stage === st.id))).join('')}</div>
      ${depts.map((dp) => `<h2 style="margin-top:24px">${esc(dp.name)}</h2><div class="grid grid-2">${S.STAGES.slice(2).map((st) => stageBlock(st, S.state.modules.filter((m) => m.stage === st.id && (m.depts.includes(dp.id) || m.depts.includes('ALL'))))).join('')}</div>`).join('')}`;
  }

  function viewRequests() {
    const label = { question: 'Question', topic: 'Topic idea', request: 'Doc request', content: 'SME content' };
    return manageTabs('requests') + `<p class="muted">Everything employees send through “Suggest a topic”, from a document page, or when the Ask assistant can't find an answer.</p>
      <div class="card table-wrap"><table><thead><tr><th>Date</th><th>From</th><th>Type</th><th>Details</th><th>Status</th></tr></thead><tbody>
      ${S.state.submissions.map((s) => `<tr><td class="small">${fmtDate(s.date)}</td><td>${esc(S.user(s.user).name)}<br><span class="muted small">${esc(S.dept(S.user(s.user).dept))}</span></td><td><span class="badge">${label[s.type] || s.type}</span></td><td>${esc(s.text)}</td>
        <td><select class="req-status" data-id="${s.id}" aria-label="Status">${['new', 'in_progress', 'planned', 'done', 'declined'].map((x) => `<option value="${x}" ${s.status === x ? 'selected' : ''}>${x.replace('_', ' ')}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div>`;
  }
  function bindRequests() { $$('.req-status').forEach((sel) => sel.addEventListener('change', () => { S.state.submissions.find((s) => s.id === sel.dataset.id).status = sel.value; S.save(); toast('Status updated'); })); }

  function rerender() { route._keepScroll = true; route(); route._keepScroll = false; }
  function notFound() { return `<div class="card empty"><h2>Page not found</h2><a class="btn" href="#/learn">Go to Learn</a></div>`; }

  /* =========================================================================
     ROUTER
     ========================================================================= */
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!parts.length) parts.push('learn');
    const me = S.me();
    renderChrome(parts);
    let html = '', bind = () => {};
    const [a, b, c, d] = parts;
    if (a === 'learn') {
      if (b === 'module') { html = viewModule(c, d); bind = () => bindModule(c); }
      else if (b === 'update') { html = viewUpdate(c); bind = () => bindUpdate(c); }
      else if (b === 'record') html = viewRecord();
      else { html = viewLearn(); bind = () => $$('[data-jump]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); const t = document.getElementById(el.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth' }); })); }
    } else if (a === 'know') {
      if (b === 'doc') { html = viewDoc(c, d); bind = () => bindDoc(c, d); }
      else { html = viewKnow(b === 'cat' ? c : null); bind = bindKnow; }
    } else if (a === 'ask') { html = viewAsk(); bind = bindAsk; }
    else if (a === 'team') {
      if (!S.canSeeTeam(me)) html = notFound();
      else if (b) { html = viewMember(b); bind = () => bindMember(b); }
      else html = viewTeam();
    } else if (a === 'manage') {
      if (!S.isAdmin(me)) html = `<div class="card empty"><h2>Restricted</h2><p>Manage is available to Learning &amp; Development only.</p><a class="btn" href="#/learn">Go to Learn</a></div>`;
      else if (b === 'library') { html = viewLibrary(); bind = bindLibrary; }
      else if (b === 'edit') { html = viewEdit(c); bind = () => bindEdit(c); }
      else if (b === 'review') html = viewReview();
      else if (b === 'archive') html = c ? viewArchived(c, d) : viewArchive();
      else if (b === 'paths') html = viewPaths();
      else if (b === 'requests') { html = viewRequests(); bind = bindRequests; }
      else { html = viewManageOverview(); bind = bindNewDoc; }
    } else html = notFound();

    app.innerHTML = html;
    bind();
    if (!route._keepScroll) window.scrollTo(0, 0);
  }

  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    // Re-rendering the same page (e.g. after a quiz submit) shouldn't jump to top; navigation should.
    if (!location.hash.startsWith('#/know/doc/') || lastHash.split('/').slice(0, 4).join('/') !== location.hash.split('/').slice(0, 4).join('/')) route._keepScroll = false;
    else route._keepScroll = true;
    lastHash = location.hash;
    route();
    route._keepScroll = false;
  });
  route();
})();
