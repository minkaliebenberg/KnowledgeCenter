/* =============================================================================
   CrownRing Knowledge Center — prototype UI (plain JS, hash routing, no build)
   Routes:
     #/learn  #/learn/module/:id[/:step]  #/learn/update/:docId  #/learn/record
     #/refer   #/refer/f/:folderId   #/refer/doc/:id
     #/navigate   #/navigate/:systemId   #/navigate/:systemId/:guideId
     #/ask   #/ask/history
     #/team/:userId/ask   #/manage/ask
     #/team   #/team/:userId
     #/manage (register)  #/manage/doc/:id  #/manage/doc/:id/v/:ver  #/manage/edit/:id  #/manage/roadmap
   ========================================================================== */
(function () {
  const S = window.Store;
  const app = document.getElementById('app');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
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
  const docBody = (v) => v.sections.map((s, i) => `<h2 id="sec-${i}">${esc(s.h)}</h2>${md(s.body)}`).join('');

  /* ---------- word diff for "exact changes" ---------- */
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
      if (!a) return `<h3>${esc(h)} <span class="badge ok">New</span></h3><p class="diff-add">${esc(plain(b.body)).replace(/\n/g, '<br>')}</p>`;
      if (!b) return `<h3>${esc(h)} <span class="badge warn">Removed</span></h3><p class="diff-del">${esc(plain(a.body)).replace(/\n/g, '<br>')}</p>`;
      if (a.body === b.body) return '';
      return `<h3>${esc(h)}</h3><p>${wordDiff(a.body, b.body)}</p>`;
    }).join('') || '<p class="muted">No wording changes.</p>';
  }
  const prevVersion = (d, v) => d.versions.slice(0, d.versions.indexOf(v)).reverse().find((x) => x.status === 'archived');

  /* ---------- UI helpers ---------- */
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function openModal(html, onMount) {
    const m = $('#modal'); $('.modal-card', m).innerHTML = html; m.hidden = false;
    const first = $('textarea, input, select', m); if (first) first.focus();
    if (onMount) onMount($('.modal-card', m));
  }
  function closeModal() { $('#modal').hidden = true; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  const bar = (pct) => `<div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
  const typeIcon = (t) => ({ SOP: '📋', Policy: '📜', Manual: '📘', 'Quick Reference': '📎', 'Process / Workflow': '🔀', Directory: '📇', Form: '📝', Video: '🎬', 'Decision Map': '🧭', Glossary: '🔤' }[t] || '📄');

  /* ---------- chrome ---------- */
  function renderChrome(route) {
    const me = S.me();
    const items = [['learn', 'Learn', ''], ['refer', 'Refer', ''], ['navigate', 'Navigate', ''], ['ask', 'Ask', '']];
    if (S.canSeeTeam(me)) items.push(['team', 'My Team', '']);
    if (S.isAdmin(me)) items.push(['manage', 'Manage', '']);
    $('#mainnav').innerHTML = items.map(([k, label, extra]) => `<a href="#/${k}" class="${route[0] === k ? 'active' : ''}">${label}${extra}</a>`).join('');
    const roleLabel = { employee: 'Employee', supervisor: 'Supervisor', admin: 'L&D Admin' };
    $('#userSwitch').innerHTML = S.state.users.map((u) => `<option value="${u.id}" ${u.id === me.id ? 'selected' : ''}>${esc(u.name)} — ${roleLabel[u.role]}, ${esc(S.dept(u.dept))}${u.sme ? ' (SME)' : ''}</option>`).join('');
  }
  $('#userSwitch').addEventListener('change', (e) => {
    S.setMe(e.target.value);
    const me = S.me();
    if (location.hash.startsWith('#/manage') && !S.isAdmin(me)) location.hash = '#/learn';
    else if (location.hash.startsWith('#/team') && !S.canSeeTeam(me)) location.hash = '#/learn';
    else route();
    toast('Viewing as ' + me.name);
  });
  $('#resetDemo').addEventListener('click', () => { S.reset(); askLog = []; route(); toast('Demo reset'); });
  $('#suggestBtn').addEventListener('click', () => suggestModal());
  /* Favourite stars (in lists and on the document page) */
  app.addEventListener('click', (e) => {
    const b = e.target.closest('.fav-btn, .fav-toggle');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const added = S.toggleFav(S.me(), b.dataset.id);
    toast(added ? 'Added to favourites' : 'Removed from favourites');
    rerender();
  });

  function suggestModal(prefill = '', type = 'question') {
    const me = S.me();
    openModal(`
      <h2 id="modalTitle">Submit a request</h2>
      <div class="field"><label for="sType">What is it?</label>
        <select id="sType">
          <option value="question" ${type === 'question' ? 'selected' : ''}>A question</option>
          <option value="topic" ${type === 'topic' ? 'selected' : ''}>A topic idea</option>
          <option value="request" ${type === 'request' ? 'selected' : ''}>New or updated document</option>
          <option value="problem" ${type === 'problem' ? 'selected' : ''}>Report a problem</option>
          ${me.sme ? '<option value="content">Content to submit (SME)</option>' : ''}
        </select></div>
      <div class="field"><label for="sText">Details</label><textarea id="sText">${esc(prefill)}</textarea></div>
      <div class="row end"><button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn" id="sSend" type="button">Send</button></div>`, (card) => {
      $('#sSend', card).addEventListener('click', () => {
        const text = $('#sText', card).value.trim();
        if (!text) { $('#sText', card).focus(); return; }
        S.submit(me.id, $('#sType', card).value, text);
        closeModal(); toast('Sent to L&D — thank you!');
        if (location.hash.startsWith('#/manage/requests')) rerender();
      });
    });
  }

  /* =========================================================================
     LEARN
     ========================================================================= */
  const itemRow = (it) => it.kind === 'update'
    ? `<a class="list-row" href="#/learn/update/${it.x.doc.id}"><span class="row-ico warn">!</span>
        <span class="grow"><strong>${esc(it.x.doc.title)}</strong><span class="sub">Update · v${esc(it.x.version.v)} · 2 min</span></span><span class="btn btn-sm">Review</span></a>`
    : `<a class="list-row" href="#/learn/module/${it.m.id}"><span class="row-ico">${it.m.stage === 'ongoing' ? '★' : '▶'}</span>
        <span class="grow"><strong>${esc(it.m.title)}</strong><span class="sub">${S.STAGE_LABEL[it.m.stage]} · ${it.m.minutes} min</span></span><span class="btn btn-sm btn-ghost">Start</span></a>`;

  const noticeRow = (n) => `<a class="list-row" href="#/learn/answer/${n.id}"><span class="row-ico warn">?</span>
      <span class="grow"><span class="notice-title">Your question has an answer</span><span class="sub">“${esc(n.sub.text)}” · 1 min</span></span><span class="btn btn-sm">Read</span></a>`;
  function viewAnswerNotice(id) {
    const me = S.me();
    const n = (S.state.notices || []).find((x) => x.id === id && x.user === me.id);
    const sub = n && S.state.submissions.find((x) => x.id === n.subId);
    if (!sub || !sub.answer) return notFound();
    const mine = (sub.askers || [{ user: sub.user, at: sub.date }]).filter((a) => a.user === me.id);
    const askedOn = mine.length ? mine[0].at.slice(0, 10) : sub.date;
    const a = sub.answer;
    return `<div class="narrow"><a href="#/learn" class="small">← Learn</a>
      <article class="card stack">
        <div><span class="badge warn">Answer to your question</span><h1>${esc(sub.text)}</h1>
          <p class="meta">You asked on ${fmtDate(askedOn)}${sub.type === 'ask' ? ', when Ask couldn\'t find an answer' : ''}. L&amp;D added this on ${fmtDate(a.date)}.</p></div>
        <div class="answer-box">${md(a.text)}</div>
        ${a.ref ? `<p>Source: <a href="${sourceHref(a)}">${esc(a.label)}${a.v ? ' · v' + esc(a.v) : ''}</a></p>` : ''}
        ${n.read ? `<div class="result ok">✓ Read ${fmtDate(n.readOn)}</div>` : '<button class="btn tip-left" id="gotIt" type="button" data-tip="This answer will also stay in your question history under Ask, so you can find it again anytime.">Got it</button>'}
      </article></div>`;
  }
  function bindAnswerNotice(id) { const b = $('#gotIt'); if (b) b.addEventListener('click', () => { S.readNotice(id); toast('Saved to your question history'); location.hash = '#/learn'; }); }
  function viewLearn() {
    const me = S.me();
    const p = S.progress(me);
    const todo = S.todo(me);
    const doneMods = S.requiredModules(me).filter((m) => S.done(me.id, 'module', m.id));
    const doneUps = S.requiredUpdates(me).filter((x) => S.done(me.id, 'update', x.ref));
    const doneCount = doneMods.length + doneUps.length;
    const notices = S.notices(me);
    const total = todo.length + notices.length;
    return `
      <h1>Hi ${esc(firstName(me))}</h1>
      <div class="card">
        <div class="row spread"><strong>Your training</strong><span class="muted">${p.done} of ${p.total} complete</span></div>
        <div class="big-bar">${bar(p.pct)}<span class="pct">${p.pct}%</span></div>
      </div>
      <h2 class="section-title">To do ${total ? `<span class="count">${total}</span>` : ''}</h2>
      ${total ? `<div class="card list">${notices.map(noticeRow).join('')}${todo.map(itemRow).join('')}</div>` : `<div class="card empty">You're all caught up ✓</div>`}
      ${doneCount ? `<details class="card list completed">
        <summary>Completed (${doneCount})</summary>
        ${doneUps.map((x) => `<a class="list-row" href="#/learn/update/${x.doc.id}"><span class="row-ico ok">✓</span><span class="grow">${esc(x.doc.title)}<span class="sub">Update v${esc(x.version.v)} · ${fmtDate(S.done(me.id, 'update', x.ref).date)}</span></span></a>`).join('')}
        ${doneMods.map((m) => `<a class="list-row" href="#/learn/module/${m.id}"><span class="row-ico ok">✓</span><span class="grow">${esc(m.title)}<span class="sub">${fmtDate(S.done(me.id, 'module', m.id).date)}</span></span></a>`).join('')}
      </details>` : ''}
      <p class="small center"><a href="#/learn/record">My learning record</a></p>`;
  }

  /* ---------- module player ---------- */
  let quizAnswers = {};
  function viewModule(id, stepStr) {
    const me = S.me();
    const m = S.mod(id);
    if (!m) return notFound();
    const docs = m.docs.map(S.doc).filter((d) => d && d.status === 'active');
    const total = docs.length + 1;
    const step = Math.min(Math.max(parseInt(stepStr || '0', 10) || 0, 0), total - 1);
    const isQuiz = step === docs.length;
    const head = `<div class="player-head"><a href="#/learn" class="small">← Learn</a>
        <div class="row spread"><strong>${esc(m.title)}</strong><span class="muted small">${isQuiz ? 'Quiz' : 'Lesson ' + (step + 1) + ' of ' + docs.length}</span></div>
        ${bar(Math.round((step / (total - 1)) * 100))}</div>`;
    if (isQuiz) return `<div class="narrow">${head}<article class="card">${quizView(m, me)}</article></div>`;
    const d = docs[step], v = S.current(d);
    return `<div class="narrow">${head}
      <article class="card">
        <h1>${esc(d.title)}</h1>
        <p class="meta">v${esc(v.v)} · ${fmtDate(v.date)} · <a href="#/refer/doc/${d.id}">Open in Refer</a></p>
        <div class="doc-body">${docBody(v)}</div>
      </article>
      <div class="row spread nav-btns">
        ${step > 0 ? `<a class="btn btn-ghost" href="#/learn/module/${m.id}/${step - 1}">Back</a>` : '<span></span>'}
        <a class="btn" href="#/learn/module/${m.id}/${step + 1}">${step + 1 === docs.length ? 'Take the quiz' : 'Next'}</a>
      </div></div>`;
  }

  function quizView(m, me) {
    const st = quizAnswers[m.id] || (quizAnswers[m.id] = { picks: {}, submitted: false });
    const qs = m.quiz.map((q, qi) => `
      <div class="quiz-q"><p><strong>${esc(q.q)}</strong></p>
        ${q.options.map((o, oi) => {
          let cls = '';
          if (st.submitted) { if (oi === q.a) cls = 'correct'; else if (st.picks[qi] === oi) cls = 'wrong'; }
          return `<label class="opt ${cls}"><input type="radio" name="q${qi}" value="${oi}" ${st.picks[qi] === oi ? 'checked' : ''} ${st.submitted ? 'disabled' : ''}> ${esc(o)}</label>`;
        }).join('')}
        ${st.submitted && st.picks[qi] !== q.a ? `<p class="small">See <a href="#/refer/doc/${q.docRef}">${esc(S.doc(q.docRef).title)}</a></p>` : ''}
      </div>`).join('');
    let result = '';
    if (st.submitted) {
      const score = Math.round((m.quiz.filter((q, i) => st.picks[i] === q.a).length / m.quiz.length) * 100);
      result = score >= 80
        ? `<div class="result ok"><strong>Passed ✓</strong> <a class="btn btn-sm" href="#/learn">Back to Learn</a></div>`
        : `<div class="result warn"><strong>${score}% — try again</strong> <button class="btn btn-sm" id="retry" type="button">Retry</button></div>`;
    }
    return `<h1>Quiz</h1><form id="quizForm">${qs}</form>${result || '<button class="btn" id="submitQuiz" type="button">Submit</button>'}`;
  }
  function bindModule(id) {
    const me = S.me(); const m = S.mod(id); if (!m) return;
    const st = quizAnswers[m.id];
    const form = $('#quizForm');
    if (form) form.addEventListener('change', (e) => { if (e.target.name) st.picks[+e.target.name.slice(1)] = +e.target.value; });
    const sub = $('#submitQuiz');
    if (sub) sub.addEventListener('click', () => {
      if (Object.keys(st.picks).length < m.quiz.length) { toast('Answer every question'); return; }
      st.submitted = true;
      const score = Math.round((m.quiz.filter((q, i) => st.picks[i] === q.a).length / m.quiz.length) * 100);
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
    const prev = prevVersion(d, v);
    const done = S.done(me.id, 'update', d.id + '@' + v.v);
    return `<div class="narrow"><a href="#/learn" class="small">← Learn</a>
      <article class="card stack">
        <div><span class="badge warn">Update</span><h1>${esc(d.title)}</h1><p class="meta">v${esc(v.v)} · ${fmtDate(v.date)}</p></div>
        <div class="changes"><strong>What changed</strong><p>${esc(v.summary)}</p></div>
        ${prev ? `<details><summary>Show exact changes</summary><div class="doc-body diff">${sectionDiff(prev, v)}</div></details>` : ''}
        <p><a href="#/refer/doc/${d.id}">Open the full document</a></p>
        ${done ? `<div class="result ok">✓ Acknowledged ${fmtDate(done.date)}</div>`
          : `<label class="opt"><input type="checkbox" id="ackBox"> I've read and understand these changes</label>
             <button class="btn" id="ackBtn" type="button" disabled>Acknowledge</button>`}
      </article></div>`;
  }
  function bindUpdate(docId) {
    const box = $('#ackBox'), btn = $('#ackBtn');
    if (!box) return;
    box.addEventListener('change', () => { btn.disabled = !box.checked; });
    btn.addEventListener('click', () => {
      const d = S.doc(docId), v = S.current(d);
      S.complete(S.me().id, 'update', d.id + '@' + v.v);
      toast('Acknowledged ✓'); location.hash = '#/learn';
    });
  }

  /* ---------- learning record ---------- */
  function recordTable(u) {
    const rows = S.transcript(u).map((c) => {
      let title, type;
      if (c.kind === 'module') { const m = S.mod(c.ref); title = m ? m.title : c.ref; type = 'Module'; }
      else { const [docId, v] = c.ref.split('@'); const d = S.doc(docId); title = (d ? d.title : docId) + ' v' + v; type = 'Update'; }
      return `<tr><td class="nowrap">${fmtDate(c.date)}</td><td>${esc(title)}</td><td>${type}</td><td>${c.score != null ? c.score + '%' : ''}</td></tr>`;
    }).join('');
    return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Score</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="muted">Nothing yet.</td></tr>'}</tbody></table></div>`;
  }
  function viewRecord() {
    const me = S.me();
    return `<a href="#/learn" class="small">← Learn</a><h1>My learning record</h1>
      ${me.deptHistory.length ? `<p class="muted small">Previously: ${me.deptHistory.map((h) => esc(S.dept(h.dept))).join(', ')}</p>` : ''}
      <div class="card">${recordTable(me)}</div>`;
  }

  /* =========================================================================
     KNOW
     ========================================================================= */
  let knowQuery = '';
  const starBtn = (d) => { const on = S.isFav(S.me(), d.id); return `<button class="fav-btn ${on ? 'on' : ''}" data-id="${d.id}" type="button" aria-pressed="${on}" title="${on ? 'Remove from favourites' : 'Add to favourites'}" aria-label="${on ? 'Remove from favourites' : 'Add to favourites'}">${on ? '★' : '☆'}</button>`; };
  const fileRow = (d, snippet) => {
    const v = S.current(d);
    return `<a class="list-row" href="#/refer/doc/${d.id}"><span class="row-ico plain">${typeIcon(d.type)}</span>
      <span class="grow"><strong>${esc(d.title)}</strong>${S.isRecentlyUpdated(d) ? ` <span class="upd">${S.current(d).type === 'initial' ? 'New' : 'Updated'}</span>` : ''}<span class="sub">${snippet || esc(d.type)}</span></span>
      <span class="muted small nowrap">${fmtDate(v.date)}</span>${starBtn(d)}</a>`;
  };
  const miniRow = (d) => `<a class="list-row mini" href="#/refer/doc/${d.id}"><span class="row-ico plain">${typeIcon(d.type)}</span><span class="grow"><strong>${esc(d.title)}</strong></span>${starBtn(d)}</a>`;
  function viewKnow() {
    const me = S.me();
    const docs = S.visibleDocs(me);
    const favs = S.favs(me), recent = S.recent(me);
    return `
      <div class="search-big"><input type="search" id="knowSearch" placeholder="Search documents" value="${esc(knowQuery)}" aria-label="Search documents"></div>
      <div id="knowResults"></div>
      <div id="knowBrowse">
        <div class="tiles">${S.state.folders.map((f) => {
          const n = docs.filter((d) => d.folder === f.id).length;
          return n ? `<a class="tile" href="#/refer/f/${f.id}"><span class="tile-ico">${f.icon}</span><strong>${esc(f.name)}</strong><span class="muted small">${n} document${n === 1 ? '' : 's'}</span></a>` : '';
        }).join('')}</div>
        <div class="two-col">
          <section><h2 class="section-title"><span class="star-h">★</span> Favourites</h2>
            <div class="card list">${favs.map(miniRow).join('') || '<div class="empty small">Tap ☆ on any document to keep it here.</div>'}</div></section>
          <section><h2 class="section-title">Recently viewed</h2>
            <div class="card list">${recent.map(miniRow).join('') || '<div class="empty small">Documents you open will show up here.</div>'}</div></section>
        </div>
      </div>`;
  }
  function viewFolder(fid) {
    const f = S.folder(fid); if (!f) return notFound();
    const docs = S.visibleDocs(S.me()).filter((d) => d.folder === fid).sort((a, b) => a.title.localeCompare(b.title));
    return `<a href="#/refer" class="small">← Refer</a>
      <h1><span class="tile-ico h1-ico">${f.icon}</span> ${esc(f.name)}</h1>
      <div class="card list">${docs.map((d) => fileRow(d)).join('') || '<div class="empty">Nothing here for your team.</div>'}</div>`;
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
        const hay = (d.title + ' ' + d.tags.join(' ') + ' ' + d.type + ' ' + v.sections.map((s) => s.h + ' ' + s.body).join(' ')).toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const score = words.reduce((a, w) => a + 1 + (d.title.toLowerCase().includes(w) ? 3 : 0), 0);
        const sec = v.sections.find((s) => words.some((w) => (s.h + ' ' + s.body).toLowerCase().includes(w)) && !/^Placeholder/.test(s.body));
        let snippet = '';
        if (sec) {
          const p = plain(sec.body).replace(/\n/g, ' ');
          const at = Math.max(0, p.toLowerCase().indexOf(words.find((w) => p.toLowerCase().includes(w)) || '') - 30);
          snippet = esc((at ? '…' : '') + p.slice(at, at + 110) + (p.length > at + 110 ? '…' : ''));
          words.forEach((w) => { snippet = snippet.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
        }
        return { d, score, snippet };
      }).filter(Boolean).sort((a, b) => b.score - a.score);
      res.innerHTML = hits.length
        ? `<div class="card list">${hits.map((h) => fileRow(h.d, h.snippet)).join('')}</div>`
        : `<div class="card empty">No results. <button class="link-btn" id="noResSuggest" type="button">Request this document</button></div>`;
      const nr = $('#noResSuggest'); if (nr) nr.addEventListener('click', () => suggestModal('I searched for "' + knowQuery + '" and couldn\'t find anything.', 'request'));
    };
    input.addEventListener('input', run);
    if (knowQuery) run();
  }

  function viewDoc(id) {
    const me = S.me();
    const d = S.doc(id);
    if (!d || !S.visibleDocs(me).includes(d)) return `<div class="card empty">This document isn't available. <a href="#/refer">Back to Refer</a></div>`;
    const v = S.current(d);
    const f = S.folder(d.folder);
    const related = d.links.map(S.doc).filter((x) => x && S.visibleDocs(me).includes(x));
    const history = d.versions.filter((x) => x.status !== 'draft').slice().reverse();
    return `<div class="narrow"><a href="#/refer/f/${f.id}" class="small">← ${esc(f.name)}</a>
      <article class="card">
        <h1>${esc(d.title)}</h1>
        <p class="meta">${esc(d.type)} · v${esc(v.v)} · Updated ${fmtDate(v.date)}</p>
        <div class="row doc-actions">
          <button class="btn btn-sm btn-ghost fav-toggle ${S.isFav(me, d.id) ? 'on' : ''}" data-id="${d.id}" type="button" aria-pressed="${S.isFav(me, d.id)}">${S.isFav(me, d.id) ? '★ Favourite' : '☆ Favourite'}</button>
          <button class="btn btn-sm btn-ghost" type="button" onclick="window.print()">⤓ PDF</button>
          <button class="btn btn-sm btn-ghost" id="docQuestion" type="button">Question?</button>
          ${S.isAdmin(me) ? `<a class="btn btn-sm btn-ghost" href="#/manage/doc/${d.id}">Manage</a>` : ''}
        </div>
        <div class="doc-body">${docBody(v)}</div>
        ${(d.guides || []).length ? `<h3 class="related-h">How-to guides</h3><div class="pill-row">${d.guides.map(S.guideRef).filter((x) => x.g && S.systems(me).includes(x.sys)).map((x) => `<a class="chip" href="#/navigate/${x.sys.id}/${x.g.id}">↗ ${esc(x.g.title)}</a>`).join('')}</div>` : ''}
        ${related.length ? `<h3 class="related-h">Related</h3><div class="pill-row">${related.map((r) => `<a class="chip" href="#/refer/doc/${r.id}">${esc(r.title)}</a>`).join('')}</div>` : ''}
        <details class="history"><summary>Version history</summary>
          <ul>${history.map((x) => `<li><strong>v${esc(x.v)}</strong> · ${fmtDate(x.date)} — ${esc(x.summary)}</li>`).join('')}</ul></details>
      </article></div>`;
  }
  function bindDoc(id) {
    if (S.visibleDocs(S.me()).includes(S.doc(id))) S.markViewed(S.me(), id);
    const b = $('#docQuestion'); if (b) b.addEventListener('click', () => suggestModal('About "' + S.doc(id).title + '": ', 'question'));
  }


  /* =========================================================================
     NAVIGATE — how-to guides for the systems we use (reference only)
     ========================================================================= */
  function viewNavigate() {
    const list = S.systems(S.me());
    return `<div class="sys-grid">${list.map((x) => `<a class="sys-card" href="#/navigate/${x.id}">
        <span class="mono">${esc(x.mono)}</span>
        <span class="grow"><strong>${esc(x.name)}</strong><span class="sub">${esc(x.tagline)}</span><span class="sub count-line">${x.guides.length} guides</span></span>
        <span class="arrow">→</span></a>`).join('') || '<div class="card empty">No systems for your team yet.</div>'}</div>`;
  }
  const guideRow = (x, gd, n) => `<a class="list-row" href="#/navigate/${x.id}/${gd.id}">
      <span class="row-ico ${n ? 'num' : 'plain-g'}">${n || (gd.video ? '▶' : '≡')}</span>
      <span class="grow"><strong>${esc(gd.title)}</strong>${gd.video ? `<span class="sub">Video · ${gd.video}</span>` : '<span class="sub">Written guide</span>'}</span></a>`;
  function viewSystem(id) {
    const x = S.system(id);
    if (!x || !S.systems(S.me()).includes(x)) return notFound();
    const G = (gid) => x.guides.find((g) => g.id === gid);
    return `<a href="#/navigate" class="small">← Navigate</a>
      <div class="sys-head">
        <span class="mono lg">${esc(x.mono)}</span>
        <div class="grow"><h1>${esc(x.name)}</h1><p class="lead">${esc(x.tagline)}</p>
          <p class="small muted"><strong>When to use it:</strong> ${esc(x.when)}</p></div>
        <a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">Open ${esc(x.name)} ↗</a>
      </div>
      <h2 class="section-title">Start here</h2>
      <div class="card list">${x.startHere.map((gid, i) => guideRow(x, G(gid), i + 1)).join('')}</div>
      ${x.sections.map((sec) => `<h2 class="section-title">${esc(sec.title)}</h2><div class="card list">${sec.guides.map((gid) => guideRow(x, G(gid))).join('')}</div>`).join('')}
      ${x.faq.length ? `<h2 class="section-title">FAQ</h2><div class="card list faq">${x.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : ''}`;
  }
  function viewGuide(sid, gid) {
    const x = S.system(sid); const gd = S.guide(sid, gid);
    if (!x || !gd || !S.systems(S.me()).includes(x)) return notFound();
    const order = x.sections.flatMap((s) => s.guides);
    const i = order.indexOf(gid);
    const sec = x.sections.find((s) => s.guides.includes(gid));
    const next = order[i + 1] && x.guides.find((g) => g.id === order[i + 1]);
    const prev = i > 0 && x.guides.find((g) => g.id === order[i - 1]);
    const rel = gd.related.map((r) => x.guides.find((g) => g.id === r)).filter(Boolean);
    const docs = gd.docs.map(S.doc).filter((d) => d && S.visibleDocs(S.me()).includes(d));
    return `<div class="narrow"><a href="#/navigate/${x.id}" class="small">← ${esc(x.name)}</a>
      <article class="card">
        <p class="meta">${esc(x.name)} · ${esc(sec ? sec.title : '')}</p>
        <h1>${esc(gd.title)}</h1>
        ${gd.video ? `<div class="video-ph" role="img" aria-label="Video placeholder"><span class="play">▶</span><span class="small">Video · ${gd.video}</span></div>` : ''}
        <ol class="steps">${gd.steps.map((st) => `<li>${md(st).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ol>
        ${gd.tip ? `<div class="tip"><strong>Good to know</strong><p>${esc(gd.tip)}</p></div>` : ''}
        ${rel.length ? `<h3 class="related-h">Related guides</h3><div class="pill-row">${rel.map((r) => `<a class="chip" href="#/navigate/${x.id}/${r.id}">${esc(r.title)}</a>`).join('')}</div>` : ''}
        ${docs.length ? `<h3 class="related-h">In Refer</h3><div class="pill-row">${docs.map((d) => `<a class="chip" href="#/refer/doc/${d.id}">${esc(d.title)}</a>`).join('')}</div>` : ''}
      </article>
      <div class="row spread nav-btns">
        ${prev ? `<a class="btn btn-ghost" href="#/navigate/${x.id}/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="btn btn-ghost" href="#/navigate/${x.id}/${next.id}">${esc(next.title)} →</a>` : ''}
      </div></div>`;
  }

  /* =========================================================================
     ASK (simulated)
     ========================================================================= */
  let askLog = [];   // this session's chat; every question is also saved to the permanent log
  const SUGGESTED = ['What is a memo?', 'Who approves a rush order?', 'How do I merge tickets?'];
  const fmtAt = (at) => { const d = new Date(at); return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }); };
  const sourceHref = (src) => { if (src.kind === 'doc') return '#/refer/doc/' + src.ref; const [sid, gid] = src.ref.split(':'); return '#/navigate/' + sid + '/' + gid; };
  const STATUS_TAG = { answered: 'tag-ok', updated: 'tag-ok', requested: 'tag-gold', closed: 'tag-muted' };
  const STATUS_TIP = {
    answered: 'Ask found the answer in our current documents.',
    requested: 'Ask couldn\'t find an answer, so your question was sent to L&D. When an answer is added, you\'ll see it here and in your Learn to-do list.',
    updated: 'Ask couldn\'t answer this at first. L&D has since added an answer.',
    closed: 'L&D reviewed this question and closed it. Any note from L&D is shown below.',
  };
  const statusTag = (e) => { const st = S.askStatus(e); return `<span class="tag ${STATUS_TAG[st.key]}">${esc(st.label)}</span>`; };

  /* One question in a history list (employee, supervisor and L&D views share this) */
  function logRow(e, showUser) {
    const u = S.user(e.user);
    const st = S.askStatus(e), sub = S.askSub(e);
    const chips = (list) => list.length ? `<div class="pill-row">${list.map((src) => `<a class="chip chip-sm" href="${sourceHref(src)}">${src.kind === 'guide' ? '↗ ' : ''}${esc(src.label)}${src.v ? ' · v' + esc(src.v) : ''}</a>`).join('')}</div>` : '';
    let body;
    if (st.key === 'updated') {
      const a = sub.answer;
      body = `<p class="log-history">${e.found ? 'The first answer wasn\'t helpful' : 'Ask couldn\'t find an answer'} when this was asked. L&amp;D added one on ${fmtDate(a.date)}.</p>
        <p class="log-a">${esc(a.text)}</p>${a.ref ? chips([a]) : ''}`;
    } else if (e.found) {
      body = `<p class="log-a">${esc(e.answer || '')}</p>${e.note ? `<p class="log-a small"><em>“${esc(e.note)}”</em></p>` : ''}${chips(e.sources || [])}`;
    } else if (st.key === 'closed') {
      body = `<p class="log-a muted">No answer found in the documentation.</p>${sub.reply ? `<p class="log-history">L&amp;D: ${esc(sub.reply)}</p>` : ''}`;
    } else {
      body = '<p class="log-a muted">No answer found in the documentation yet. L&amp;D has been asked to add one.</p>';
    }
    return `<div class="log-row">
      <div class="row spread log-top"><strong class="log-q">${esc(e.q)}</strong><span class="tag ${STATUS_TAG[st.key]}" tabindex="0" data-tip="${esc(STATUS_TIP[st.key])}" aria-label="${esc(st.label + ': ' + STATUS_TIP[st.key])}">${esc(st.label)}</span></div>
      <div class="sub">${showUser ? esc(u.name) + ' · ' : ''}${fmtAt(e.at)}${e.helpful === true ? ' · Marked helpful' : ''}${e.helpful === false ? ' · <span class="nh">Marked not helpful</span>' : ''}</div>
      ${body}
    </div>`;
  }

  function answerHtml(x) {
    const r = x.r, e = x.entry;
    if (!r.found) return `<p>I couldn't find that in our documents, so I won't guess.</p>
      <p class="small muted">I've sent your question to L&amp;D so it can be added. You can follow it in <a href="#/ask/history">your question history</a>.</p>`;
    const t = r.top;
    const body = t.guide
      ? `<ol class="steps small-steps">${t.guide.steps.map((st) => `<li>${md(st).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ol><p class="source">Source: <a href="#/navigate/${t.sys.id}/${t.guide.id}">${esc(t.sys.name)} › ${esc(t.guide.title)}</a></p>`
      : `${md(t.s.body)}<p class="source">Source: <a href="#/refer/doc/${t.d.id}">${esc(t.d.title)} › ${esc(t.s.h)}</a></p>`;
    const fb = e.helpful === null
      ? `<div class="fb">Did this help? <button class="link-btn fb-btn" data-id="${e.id}" data-v="1" type="button">Yes</button> · <button class="link-btn fb-btn" data-id="${e.id}" data-v="0" type="button">No</button></div>`
      : e.helpful ? '<div class="fb">Thanks for the feedback.</div>' : '<div class="fb">Thanks. I\'ve sent this to L&amp;D so the answer can be improved.</div>';
    return body + fb;
  }
  function viewAsk() {
    return `<div class="narrow ask">
      <div class="chat" id="chat" aria-live="polite">
        ${askLog.length ? '' : `<div class="ask-hello"><h1>What can I help you find?</h1><p class="muted">Answers come from our current documents and guides, with a link to the source.</p></div>`}
        ${askLog.map((x) => `<div class="msg user">${esc(x.q)}</div><div class="msg bot">${answerHtml(x)}</div>`).join('')}
      </div>
      ${askLog.length ? '' : `<div class="pill-row center">${SUGGESTED.map((q) => `<button class="chip ask-chip" type="button">${esc(q)}</button>`).join('')}</div>`}
      <form class="chat-input" id="askForm"><input type="text" id="askInput" placeholder="Ask a question" aria-label="Your question" autocomplete="off"><button class="btn" type="submit">Ask</button></form>
      <p class="center small ask-links"><a href="#/ask/history">Your question history</a>${askLog.length ? ' · <button class="link-btn" id="clearChat" type="button">Clear chat</button>' : ''}</p>
    </div>`;
  }
  function bindAsk() {
    const go = (q) => {
      if (!q.trim()) return;
      const r = S.ask(S.me(), q);
      const entry = S.logAsk(S.me(), q, r);
      askLog.push({ q, r, entry });
      rerender();
      setTimeout(() => { const c = $('#chat'); if (c.lastElementChild) c.lastElementChild.scrollIntoView({ block: 'nearest' }); $('#askInput').focus(); }, 20);
    };
    $('#askForm').addEventListener('submit', (e) => { e.preventDefault(); go($('#askInput').value); });
    $$('.ask-chip').forEach((b) => b.addEventListener('click', () => go(b.textContent)));
    const clr = $('#clearChat'); if (clr) clr.addEventListener('click', () => { askLog = []; rerender(); });
    $$('.fb-btn').forEach((b) => b.addEventListener('click', () => {
      const e = S.rateAsk(b.dataset.id, b.dataset.v === '1');
      askLog.forEach((x) => { if (x.entry.id === e.id) x.entry = e; });
      rerender();
    }));
  }

  /* Employee's own history */
  let histFilter = 'all';
  const HIST_FILTERS = [['all', 'All'], ['answered', 'Answered'], ['requested', 'Requested']];
  const filterLog = (list, f) => list.filter((e) => f === 'all' || (f === 'answered' ? S.askStatus(e).answered : S.askStatus(e).key === 'requested'));
  function viewAskHistory() {
    const me = S.me();
    const list = S.askHistory(me.id);
    const shown = filterLog(list, histFilter);
    return `<div class="narrow"><a href="#/ask" class="small">← Ask</a>
      <h1>Your questions</h1>
      <p class="muted small">Everything you've asked, with the answer and its source. Questions that could not be answered by Ask are sent to L&amp;D as requests. When an answer is added, it shows up here and in your Learn to-do list.</p>
      <div class="pill-row hist-filters">${HIST_FILTERS.map(([k, l]) => `<button class="chip ${histFilter === k ? 'active' : ''}" data-f="${k}" type="button">${l} <span class="chip-n">${filterLog(list, k).length}</span></button>`).join('')}</div>
      <div class="card list log">${shown.map((e) => logRow(e, false)).join('') || '<div class="empty">No questions yet.</div>'}</div></div>`;
  }
  function bindAskHistory() { $$('.hist-filters .chip').forEach((c) => c.addEventListener('click', () => { histFilter = c.dataset.f; rerender(); })); }

  /* =========================================================================
     MY TEAM
     ========================================================================= */
  function viewTeam() {
    const me = S.me();
    const pc = (d, t) => (t ? Math.round((d / t) * 100) : 100);
    const rows = S.team(me).map((u) => {
      const p = S.progress(u);
      const last = S.transcript(u)[0];
      return `<tr>
        <td><a href="#/team/${u.id}"><strong>${esc(u.name)}</strong></a><br><span class="muted small">${esc(S.dept(u.dept))}</span></td>
        <td class="cell-pct">${pc(p.onboarding.done, p.onboarding.total)}%${bar(pc(p.onboarding.done, p.onboarding.total))}</td>
        <td class="cell-pct">${pc(p.path.done, p.path.total)}%${bar(pc(p.path.done, p.path.total))}</td>
        <td>${p.updatesPending ? `<span class="badge warn">${p.updatesPending} pending</span>` : '<span class="badge ok">Up to date</span>'}</td>
        <td><strong>${p.pct}%</strong></td>
        <td class="muted small nowrap">${last ? fmtDate(last.date) : '—'}</td></tr>`;
    }).join('');
    return `<h1>My Team</h1>
      <div class="card table-wrap"><table><thead><tr><th>Employee</th><th>Onboarding</th><th>Dept. training</th><th>Updates</th><th>Overall</th><th>Last activity</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">No team members.</td></tr>'}</tbody></table></div>`;
  }
  function viewMember(id) {
    const me = S.me();
    const u = S.user(id);
    if (!u || !S.team(me).includes(u)) return notFound();
    const p = S.progress(u);
    const todo = S.todo(u);
    return `<a href="#/team" class="small">← My Team</a>
      <div class="row spread"><div><h1>${esc(u.name)}</h1><p class="meta">${esc(u.title)} · ${esc(S.dept(u.dept))} · started ${fmtDate(u.start)}</p></div>
        ${S.isAdmin(me) ? `<div><label for="xfer" class="small">Department</label><select id="xfer">${S.state.departments.map((d) => `<option value="${d.id}" ${d.id === u.dept ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>` : ''}</div>
      <div class="card"><div class="row spread"><strong>Progress</strong><span class="muted">${p.done} of ${p.total}</span></div><div class="big-bar">${bar(p.pct)}<span class="pct">${p.pct}%</span></div></div>
      <h2 class="section-title">To do (${todo.length})</h2>
      <div class="card list">${todo.map((it) => `<div class="list-row"><span class="row-ico ${it.kind === 'update' ? 'warn' : ''}">${it.kind === 'update' ? '!' : '▶'}</span><span class="grow">${esc(it.kind === 'update' ? it.x.doc.title + ' v' + it.x.version.v : it.m.title)}<span class="sub">${it.kind === 'update' ? 'Update' : S.STAGE_LABEL[it.m.stage]}</span></span></div>`).join('') || '<div class="empty">All caught up ✓</div>'}</div>
      ${askSection(u)}
      <h2 class="section-title">Learning record</h2><div class="card">${recordTable(u)}</div>`;
  }
  function askSection(u) {
    const list = S.askHistory(u.id);
    const open = list.filter((e) => S.askStatus(e).key === 'requested').length;
    return `<div class="row spread section-title"><h2 style="margin:0">Questions asked <span class="muted small">${list.length} total${open ? ' · ' + open + ' requested' : ''}</span></h2>${list.length > 3 ? `<a class="small" href="#/team/${u.id}/ask">View all</a>` : ''}</div>
      <div class="card list log">${list.slice(0, 3).map((e) => logRow(e, false)).join('') || '<div class="empty">No questions asked yet.</div>'}</div>`;
  }
  function viewMemberAsk(id) {
    const me = S.me(); const u = S.user(id);
    if (!u || !S.team(me).includes(u)) return notFound();
    const list = S.askHistory(u.id);
    return `<div class="narrow"><a href="#/team/${u.id}" class="small">← ${esc(u.name)}</a>
      <h1>${esc(firstName(u))}'s questions</h1>
      <div class="card list log">${list.map((e) => logRow(e, false)).join('') || '<div class="empty">No questions asked yet.</div>'}</div></div>`;
  }
  function bindMember(id) {
    const x = $('#xfer'); if (!x) return;
    x.addEventListener('change', () => { S.transfer(id, x.value); toast('Moved to ' + S.dept(x.value)); rerender(); });
  }

  /* =========================================================================
     MANAGE — mirrors the Documentation Map (Register + Roadmap)
     ========================================================================= */
  const STATUS = { active: ['Active', 'ok'], draft: ['Draft', ''], review: ['Under review', 'warn'], retired: ['Archived', ''] };
  const statusBadge = (d) => `<span class="badge ${STATUS[d.status][1]}">${STATUS[d.status][0]}</span>`;
  const reviewCell = (d) => {
    const r = S.reviewState(d);
    if (d.status !== 'active') return '<span class="muted">—</span>';
    return `${fmtDate(d.nextReview)}${r === 'overdue' ? ' <span class="badge danger">Overdue</span>' : r === 'soon' ? ' <span class="badge warn">Soon</span>' : ''}`;
  };
  function manageTabs(active) {
    const reqN = S.state.submissions.filter((s) => s.status === 'new').length;
    return `<div class="row spread manage-head"><div class="tabs">
        <a href="#/manage" class="${active === 'register' ? 'active' : ''}">Register</a>
        <a href="#/manage/requests" class="${active === 'requests' ? 'active' : ''}">Requests${reqN ? `<span class="count">${reqN}</span>` : ''}</a>
        <a href="#/manage/roadmap" class="${active === 'roadmap' ? 'active' : ''}">Roadmap</a>
        <a href="#/manage/ask" class="${active === 'ask' ? 'active' : ''}">Ask log</a></div>
        <button class="btn btn-sm" id="newDocBtn" type="button">+ New document</button></div>`;
  }

  let regFilter = 'active', regQuery = '';
  function viewRegister() {
    const all = S.state.documents;
    const counts = {
      active: all.filter((d) => d.status === 'active').length,
      wip: all.filter((d) => d.status === 'draft' || d.status === 'review').length,
      due: all.filter((d) => S.reviewState(d) === 'overdue').length,
      retired: all.filter((d) => d.status === 'retired').length,
    };
    const filters = [['active', 'Active', counts.active], ['wip', 'Drafts & review', counts.wip], ['due', 'Review overdue', counts.due], ['retired', 'Archived', counts.retired], ['all', 'All', all.length]];
    return manageTabs('register') + `
      <div class="row toolbar">
        <input type="search" id="regSearch" placeholder="Search" value="${esc(regQuery)}">
        <div class="pill-row">${filters.map(([k, l, n]) => `<button class="chip ${regFilter === k ? 'active' : ''}" data-f="${k}" type="button">${l} <span class="chip-n">${n}</span></button>`).join('')}</div>
      </div>
      <div class="card table-wrap"><table id="regTable"><thead><tr><th>Document</th><th>Folder</th><th>Type</th><th>Ver.</th><th>Status</th><th>Owner</th><th>Next review</th></tr></thead><tbody></tbody></table></div>`;
  }
  function bindRegister() {
    bindNewDoc();
    const draw = () => {
      const q = regQuery.toLowerCase();
      const rows = S.state.documents.filter((d) => {
        if (regFilter === 'active' && d.status !== 'active') return false;
        if (regFilter === 'wip' && !(d.status === 'draft' || d.status === 'review')) return false;
        if (regFilter === 'due' && S.reviewState(d) !== 'overdue') return false;
        if (regFilter === 'retired' && d.status !== 'retired') return false;
        return !q || (d.title + ' ' + d.type + ' ' + S.folder(d.folder).name + ' ' + (S.user(d.owner) || {}).name).toLowerCase().includes(q);
      }).sort((a, b) => a.title.localeCompare(b.title));
      $('#regTable tbody').innerHTML = rows.map((d) => {
        const v = S.current(d) || S.latest(d);
        return `<tr class="click" data-href="#/manage/doc/${d.id}">
          <td><a href="#/manage/doc/${d.id}"><strong>${esc(d.title)}</strong></a></td><td>${esc(S.folder(d.folder).name)}</td><td>${esc(d.type)}</td>
          <td>${esc(v.v)}</td><td>${statusBadge(d)}</td><td>${esc((S.user(d.owner) || {}).name || '')}</td><td class="nowrap">${reviewCell(d)}</td></tr>`;
      }).join('') || '<tr><td colspan="7" class="empty">No documents.</td></tr>';
      $$('#regTable tr.click').forEach((tr) => tr.addEventListener('click', (e) => { if (e.target.tagName !== 'A') location.hash = tr.dataset.href; }));
    };
    $('#regSearch').addEventListener('input', (e) => { regQuery = e.target.value; draw(); });
    $$('.toolbar .chip').forEach((c) => c.addEventListener('click', () => { regFilter = c.dataset.f; rerender(); }));
    draw();
  }

  function bindNewDoc() {
    const b = $('#newDocBtn'); if (!b) return;
    b.addEventListener('click', () => openModal(`
      <h2 id="modalTitle">New document</h2>
      <div class="field"><label for="ndTitle">Title</label><input type="text" id="ndTitle" placeholder="e.g. Procedure - Placing Orders"></div>
      <div class="grid-2col">
        <div class="field"><label for="ndFolder">Folder</label><select id="ndFolder">${S.state.folders.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="ndType">Type</label><select id="ndType">${S.state.types.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="ndOwner">Owner / SME</label><select id="ndOwner">${S.state.users.map((u) => `<option value="${u.id}" ${u.id === S.me().id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="row end"><button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn" id="ndCreate" type="button">Create draft</button></div>`, (card) => {
      $('#ndCreate', card).addEventListener('click', () => {
        const title = $('#ndTitle', card).value.trim(); if (!title) return $('#ndTitle', card).focus();
        const id = 'D' + Date.now().toString(36);
        S.state.documents.push({ id, title, folder: $('#ndFolder', card).value, type: $('#ndType', card).value, depts: ['NC'], owner: $('#ndOwner', card).value, status: 'draft', sourceOfTruth: false, links: [], tags: [],
          versions: [{ v: '0.1', date: S.state.today, type: 'draft', by: S.me().id, status: 'draft', summary: 'Draft created.', sections: [{ h: 'Purpose', body: '' }] }] });
        S.save(); closeModal(); location.hash = '#/manage/edit/' + id;
      });
    }));
  }

  /* ---------- document detail (archive + change log + links live here) ---------- */
  function viewManageDoc(id) {
    const d = S.doc(id); if (!d) return notFound();
    const cur = S.current(d);
    const owner = S.user(d.owner);
    const from = S.linkedFrom(d.id);
    const to = d.links.map(S.doc).filter(Boolean);
    const pushedCur = cur && cur.pushed && d.status === 'active' ? S.ackStats(d, cur) : null;
    const versions = d.versions.slice().reverse();
    const verType = (x) => x.status === 'draft' ? '<span class="badge">Draft</span>' : x.pushed ? '<span class="badge warn">Pushed</span>' : x.type === 'minor' ? '<span class="badge">Minor</span>' : x.type === 'major' ? '<span class="badge info">Major</span>' : '<span class="badge info">New</span>';
    return `<a href="#/manage" class="small">← Register</a>
      <div class="row spread"><div><h1>${esc(d.title)}</h1><p class="meta">${statusBadge(d)} ${cur ? 'v' + esc(cur.v) + ' · ' : ''}${esc(S.folder(d.folder).name)} · ${esc(d.type)}</p></div>
        <div class="row">
          ${d.status === 'active' ? `<a class="btn btn-ghost" href="#/refer/doc/${d.id}">View</a>` : ''}
          ${d.status === 'retired' ? '<button class="btn btn-ghost" id="restoreDoc" type="button">Restore</button>' : `<a class="btn" href="#/manage/edit/${d.id}">${d.status === 'active' ? 'New version' : 'Edit & publish'}</a>`}
        </div></div>
      <div class="grid-main">
        <div class="stack">
          <div class="card"><h3>Versions</h3>
            <div class="table-wrap"><table><thead><tr><th>Ver.</th><th>Date</th><th>Change</th><th>Summary</th><th></th></tr></thead><tbody>
            ${versions.map((x) => `<tr><td class="nowrap"><strong>${esc(x.v)}</strong>${x.status === 'current' ? ' <span class="badge ok">Current</span>' : ''}</td><td class="nowrap">${fmtDate(x.date)}</td><td>${verType(x)}</td><td>${esc(x.summary)}</td>
              <td>${x.status === 'archived' ? `<a class="small" href="#/manage/doc/${d.id}/v/${x.v}">Open</a>` : ''}</td></tr>`).join('')}
            </tbody></table></div></div>
          ${pushedCur ? `<div class="card"><h3>Acknowledged v${esc(cur.v)}</h3>
            <div class="big-bar">${bar(pushedCur.need.length ? Math.round((pushedCur.need.length - pushedCur.pending.length) / pushedCur.need.length * 100) : 100)}<span class="pct small-pct">${pushedCur.need.length - pushedCur.pending.length}/${pushedCur.need.length}</span></div>
            ${pushedCur.pending.length ? `<p class="small muted">Waiting on: ${pushedCur.pending.map((u) => esc(u.name)).join(', ')}</p>` : '<p class="small muted">Everyone has acknowledged.</p>'}</div>` : ''}
        </div>
        <div class="stack">
          <div class="card details"><h3>Details</h3>
            <dl><dt>Owner</dt><dd>${esc(owner ? owner.name : '—')}</dd>
              <dt>Shown to</dt><dd>${esc(S.deptNames(d.depts))}</dd>
              <dt>Next review</dt><dd>${reviewCell(d)}</dd>
              <dt>Source of truth</dt><dd>${d.sourceOfTruth ? 'Yes' : 'No'}</dd></dl>
            ${d.status === 'active' ? '<button class="link-btn small" id="retireDoc" type="button">Archive this document</button>' : ''}</div>
          <div class="card"><h3>Links</h3>
            <p class="small muted label">Linked from</p>${from.length ? from.map((x) => `<a class="link-line" href="#/manage/doc/${x.id}">${esc(x.title)}</a>`).join('') : '<p class="small muted">—</p>'}
            <p class="small muted label">Links to</p>${to.length ? to.map((x) => `<a class="link-line" href="#/manage/doc/${x.id}">${esc(x.title)}</a>`).join('') : '<p class="small muted">—</p>'}</div>
        </div>
      </div>`;
  }
  function bindManageDoc(id) {
    const r = $('#retireDoc'); if (r) r.addEventListener('click', () => { S.retire(id); toast('Archived — hidden from Refer and Ask'); rerender(); });
    const s = $('#restoreDoc'); if (s) s.addEventListener('click', () => { S.restore(id); toast('Restored'); rerender(); });
  }
  function viewArchivedVersion(id, ver) {
    const d = S.doc(id); const v = d && d.versions.find((x) => x.v === ver);
    if (!v) return notFound();
    const acks = S.state.completions.filter((c) => c.kind === 'update' && c.ref === d.id + '@' + v.v);
    return `<div class="narrow"><a href="#/manage/doc/${d.id}" class="small">← ${esc(d.title)}</a>
      <article class="card"><span class="badge">Archived · read-only</span><h1>${esc(d.title)}</h1><p class="meta">v${esc(v.v)} · ${fmtDate(v.date)} — ${esc(v.summary)}</p>
        <div class="doc-body">${docBody(v)}</div></article>
      ${v.pushed ? `<div class="card"><h3>Acknowledged by</h3>${acks.length ? acks.map((c) => `<div class="small">${esc(S.user(c.user).name)} — ${fmtDate(c.date)}</div>`).join('') : '<p class="small muted">No one.</p>'}</div>` : ''}</div>`;
  }

  /* ---------- edit / publish ---------- */
  let editDraft = null;
  function viewEdit(id) {
    const d = S.doc(id); if (!d) return notFound();
    const cur = S.current(d);
    const base = d.versions.find((v) => v.status === 'draft') || cur;
    if (!editDraft || editDraft.id !== id) editDraft = { id, sections: JSON.parse(JSON.stringify(base.sections)), depts: d.depts.slice(), ctype: 'minor', push: false, summary: '' };
    const isNew = !cur;
    const from = S.linkedFrom(d.id);
    return `<a href="#/manage/doc/${d.id}" class="small" id="cancelEdit">← ${esc(d.title)}</a>
      <h1>${isNew ? 'Publish' : 'New version'}: ${esc(d.title)}</h1>
      ${d.status === 'review' ? `<p class="meta">Submitted by ${esc(S.user(base.by).name)} · ${fmtDate(base.date)}</p>` : ''}
      <div class="grid-main">
        <div class="card">
          <div id="sections">${editDraft.sections.map((s, i) => `
            <div class="section-editor" data-i="${i}">
              <div class="row spread"><input type="text" class="sec-h" value="${esc(s.h)}" aria-label="Section heading"><button class="link-btn small rm-sec" type="button">Remove</button></div>
              <textarea class="sec-b" aria-label="Section text">${esc(s.body)}</textarea></div>`).join('')}</div>
          <button class="btn btn-ghost btn-sm" id="addSec" type="button">+ Section</button>
          <p class="muted small">In production: upload the Word master instead of typing here.</p>
        </div>
        <aside class="card stack">
          ${isNew ? '' : `<div><label>Change type</label>
            <label class="radio-card"><input type="radio" name="ctype" value="minor" ${editDraft.ctype !== 'major' ? 'checked' : ''}><span><strong>Minor</strong> · v${esc(S.nextVersion(cur.v, 'minor'))}<br><span class="muted small">Typos, formatting, clarification</span></span></label>
            <label class="radio-card"><input type="radio" name="ctype" value="major" ${editDraft.ctype === 'major' ? 'checked' : ''}><span><strong>Major</strong> · v${esc(S.nextVersion(cur.v, 'major'))}<br><span class="muted small">Process or policy change</span></span></label></div>`}
          <label class="opt"><input type="checkbox" id="pushQ" ${isNew || editDraft.ctype === 'major' ? '' : 'disabled'} ${editDraft.push ? 'checked' : ''}> Add to learning queues</label>
          <div><label for="summary">Summary of changes</label><textarea id="summary" class="short" placeholder="${isNew ? 'Initial release.' : 'Shown to employees in their queue'}">${esc(editDraft.summary)}</textarea></div>
          <div><label>Shown to</label>
            <div class="pill-row">${[{ id: 'ALL', name: 'Everyone' }, ...S.state.departments].map((x) => `<label class="chip ${editDraft.depts.includes(x.id) ? 'active' : ''}"><input type="checkbox" class="dept-cb" value="${x.id}" ${editDraft.depts.includes(x.id) ? 'checked' : ''} hidden>${esc(x.name)}</label>`).join('')}</div></div>
          ${!isNew && from.length ? `<div class="warn-box small"><strong>Linked from ${from.length} document${from.length > 1 ? 's' : ''}</strong> — check them too:<br>${from.map((x) => esc(x.title)).join('<br>')}</div>` : ''}
          ${isNew ? '' : `<details><summary class="small">Preview changes</summary><div class="doc-body diff small" id="diffPreview"></div></details>`}
          <div class="row"><button class="btn" id="publishBtn" type="button">Publish</button>
            ${d.status === 'review' ? '<button class="btn btn-ghost" id="returnBtn" type="button">Return to SME</button>' : ''}</div>
        </aside>
      </div>`;
  }
  function bindEdit(id) {
    const d = S.doc(id); const isNew = !S.current(d);
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
    $$('input[name=ctype]').forEach((r) => r.addEventListener('change', () => { const major = r.value === 'major'; $('#pushQ').disabled = !major; $('#pushQ').checked = major; }));
    $('#cancelEdit').addEventListener('click', () => { editDraft = null; });
    const ret = $('#returnBtn');
    if (ret) ret.addEventListener('click', () => { d.status = 'draft'; S.save(); editDraft = null; toast('Returned to SME'); location.hash = '#/manage/doc/' + id; });
    $('#publishBtn').addEventListener('click', () => {
      collect();
      const type = isNew ? 'initial' : editDraft.ctype;
      const summary = editDraft.summary.trim() || (isNew ? 'Initial release.' : '');
      if (!summary) { toast('Add a summary of changes'); $('#summary').focus(); return; }
      const sections = editDraft.sections.map((s) => ({ h: s.h.trim(), body: s.body.trim() }));
      if (!sections.length || sections.some((s) => !s.h || !s.body)) { toast('Every section needs a heading and text'); return; }
      const v = S.publish(id, { sections, type, summary, pushed: editDraft.push, by: S.me().id, depts: editDraft.depts });
      editDraft = null;
      toast(`Published v${v}` + (S.current(d).pushed ? ' · added to queues' : ''));
      location.hash = '#/manage/doc/' + id;
    });
  }

  /* ---------- roadmap (Documentation Map "Roadmap" tab + employee requests) ---------- */
  const COLS = [['idea', 'Idea'], ['planned', 'Planned'], ['progress', 'In progress'], ['review', 'Under review'], ['done', 'Completed']];
  const prioClass = { High: 'danger', Med: 'warn', Low: '' };
  function viewRoadmap() {
    return manageTabs('roadmap') + `
      <div class="board">
        ${COLS.map(([k, l]) => {
          const items = S.state.roadmap.filter((r) => r.status === k);
          return `<div class="col"><div class="col-head">${l} <span class="muted">${items.length}</span></div>
            ${items.map((r) => `<button class="kcard rm-item" data-id="${r.id}" type="button"><strong>${esc(r.title)}</strong>
              <span class="pill-row"><span class="badge ${prioClass[r.priority]}">${r.priority}</span><span class="badge">${esc(r.type)}</span><span class="badge eff eff-${esc(r.effort.toLowerCase())}" title="Estimated effort">${esc(r.effort)}</span></span>
              ${r.fromRequest ? '<span class="sub">From a request</span>' : ''}</button>`).join('')}
            ${k === 'idea' ? '<button class="link-btn small" id="addIdea" type="button">+ Add</button>' : ''}</div>`;
        }).join('')}
      </div>`;
  }

  /* ---------- Requests: everything people (and Ask) send to L&D ---------- */
  const REQ_TYPE = { question: 'Question', topic: 'Topic idea', request: 'Document request', problem: 'Problem', content: 'SME content', ask: 'From Ask · no answer found' };
  const REQ_STATUS = { new: ['New', 'tag-gold'], done: ['On roadmap', 'tag-ink'], answered: ['Answered', 'tag-ok'], declined: ['Closed', 'tag-muted'] };
  let reqFilter = 'new', reqQuery = '';
  function reqCard(sub) {
    const askers = S.requestAskers(sub);
    const isAsk = sub.type === 'ask';
    const label = isAsk && sub.note && /not helpful/.test(sub.note) ? 'From Ask · answer not helpful' : REQ_TYPE[sub.type] || sub.type;
    const [stL, stC] = REQ_STATUS[sub.status] || ['', ''];
    const wordings = isAsk ? sub.logIds.map((lid) => (S.state.askLog || []).find((e) => e.id === lid)).filter(Boolean) : [];
    return `<div class="req-card ${isAsk ? 'from-ask' : ''}">
      <div class="row spread"><span class="sub">${esc(label)} · ${fmtDate(sub.date)}</span><span class="tag ${stC}">${stL}</span></div>
      <strong class="req-text">${esc(sub.text)}</strong>
      <span class="sub">${isAsk ? `Asked ${sub.askers.length}× by ` : 'From '}${askers.map((id) => esc(isAsk ? firstName(S.user(id)) : S.user(id).name)).join(', ')}</span>
      ${sub.note ? `<span class="sub"><em>${esc(sub.note)}</em></span>` : ''}
      ${wordings.length > 1 ? `<details class="wordings"><summary>How it was asked</summary>${wordings.map((e) => `<div class="small">“${esc(e.q)}” · ${esc(firstName(S.user(e.user)))}, ${fmtAt(e.at)}</div>`).join('')}</details>` : ''}
      ${sub.status === 'answered' ? `<div class="req-answer"><span class="sub">Answered ${fmtDate(sub.answer.date)} · sent to ${askers.length} ${askers.length === 1 ? 'person' : 'people'}</span><p>${esc(sub.answer.text)}</p>${sub.answer.ref ? `<a class="chip chip-sm" href="${sourceHref(sub.answer)}">${esc(sub.answer.label)}</a>` : ''}</div>` : ''}
      ${sub.status === 'declined' && sub.reply ? `<div class="req-answer"><span class="sub">Closed ${fmtDate(sub.closedOn)}</span><p>${esc(sub.reply)}</p></div>` : ''}
      ${sub.status === 'new' || sub.status === 'done' ? `<div class="row req-actions">
        ${['question', 'ask'].includes(sub.type) ? `<button class="btn btn-sm req-answer-btn" data-id="${sub.id}" type="button">Answer</button>` : ''}
        ${sub.status === 'new' ? `<button class="btn btn-sm btn-ghost req-add" data-id="${sub.id}" type="button">Add to roadmap</button>` : ''}
        <button class="link-btn small req-close" data-id="${sub.id}" type="button">Close</button></div>` : ''}
    </div>`;
  }
  function viewRequests() {
    const all = S.state.submissions;
    const filters = [['new', 'New'], ['done', 'On roadmap'], ['answered', 'Answered'], ['declined', 'Closed'], ['all', 'All']];
    const q = reqQuery.toLowerCase();
    const shown = all.filter((x) => (reqFilter === 'all' || x.status === reqFilter) && (!q || x.text.toLowerCase().includes(q)))
      .sort((a, b) => ((b.askers ? b.askers.length : 1) - (a.askers ? a.askers.length : 1)) || (a.date < b.date ? 1 : -1));
    return manageTabs('requests') + `
      <div class="row toolbar">
        <input type="search" id="reqSearch" placeholder="Search requests" value="${esc(reqQuery)}">
        <div class="pill-row">${filters.map(([k, l]) => `<button class="chip ${reqFilter === k ? 'active' : ''}" data-f="${k}" type="button">${l} <span class="chip-n">${k === 'all' ? all.length : all.filter((x) => x.status === k).length}</span></button>`).join('')}</div>
      </div>
      <div class="req-grid">${shown.map(reqCard).join('') || '<div class="card empty">Nothing here.</div>'}</div>`;
  }
  function answerModal(sub) {
    const docs = S.state.documents.filter((d) => d.status === 'active').sort((a, b) => a.title.localeCompare(b.title));
    const guides = (S.state.systems || []).flatMap((x) => x.guides.map((g) => ({ ref: x.id + ':' + g.id, label: x.name + ' › ' + g.title, g })));
    const n = S.requestAskers(sub).length;
    openModal(`<h2 id="modalTitle">Answer this question</h2>
      <p class="muted small">“${esc(sub.text)}”</p>
      <div class="field"><label for="aKind">Where is the answer?</label><select id="aKind"><option value="doc">A document in Refer</option><option value="guide">A how-to guide in Navigate</option><option value="none">No document — written answer only</option></select></div>
      <div class="field" id="aDocWrap"><label for="aDoc">Document</label><select id="aDoc">${docs.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join('')}</select>
        <label for="aSec" style="margin-top:8px">Section</label><select id="aSec"></select></div>
      <div class="field" id="aGuideWrap" hidden><label for="aGuide">Guide</label><select id="aGuide">${guides.map((g) => `<option value="${g.ref}">${esc(g.label)}</option>`).join('')}</select></div>
      <div class="field"><label for="aText">Short answer</label><textarea id="aText" class="short"></textarea></div>
      <p class="small muted">The answer goes into ${n === 1 ? 'the asker\'s' : 'the ' + n + ' askers\''} Learn to-do list and their question history.</p>
      <div class="row end"><button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn" id="aSend" type="button">Send answer</button></div>`, (card) => {
      const kind = $('#aKind', card), docSel = $('#aDoc', card), secSel = $('#aSec', card), gSel = $('#aGuide', card), txt = $('#aText', card);
      const fillSecs = () => { const d = S.doc(docSel.value); secSel.innerHTML = S.current(d).sections.map((x, i) => `<option value="${i}">${esc(x.h)}</option>`).join(''); prefill(); };
      const prefill = () => {
        if (txt.dataset.edited) return;
        if (kind.value === 'doc') txt.value = plain(S.current(S.doc(docSel.value)).sections[+secSel.value || 0].body).replace(/\n/g, ' ');
        else if (kind.value === 'guide') txt.value = guides.find((g) => g.ref === gSel.value).g.steps.join(' ').replace(/\*\*/g, '');
      };
      txt.addEventListener('input', () => { txt.dataset.edited = '1'; });
      kind.addEventListener('change', () => { $('#aDocWrap', card).hidden = kind.value !== 'doc'; $('#aGuideWrap', card).hidden = kind.value !== 'guide'; delete txt.dataset.edited; prefill(); });
      docSel.addEventListener('change', () => { delete txt.dataset.edited; fillSecs(); });
      secSel.addEventListener('change', () => { delete txt.dataset.edited; prefill(); });
      gSel.addEventListener('change', () => { delete txt.dataset.edited; prefill(); });
      fillSecs();
      $('#aSend', card).addEventListener('click', () => {
        const text = txt.value.trim(); if (!text) return txt.focus();
        let ans = { text };
        if (kind.value === 'doc') { const d = S.doc(docSel.value), v = S.current(d); ans = Object.assign(ans, { kind: 'doc', ref: d.id, v: v.v, label: d.title + ' › ' + v.sections[+secSel.value].h }); }
        if (kind.value === 'guide') { const g = guides.find((x) => x.ref === gSel.value); ans = Object.assign(ans, { kind: 'guide', ref: g.ref, label: g.label }); }
        S.answerRequest(sub.id, ans); closeModal();
        toast(`Answer sent to ${n} ${n === 1 ? 'person' : 'people'}`); rerender();
      });
    });
  }
  function closeModalFor(sub) {
    openModal(`<h2 id="modalTitle">Close this request</h2><p class="muted small">“${esc(sub.text)}”</p>
      <div class="field"><label for="cReply">Note to the ${S.requestAskers(sub).length === 1 ? 'person' : 'people'} who asked <span class="muted">(optional)</span></label><textarea id="cReply" class="short" placeholder="e.g. Please check with your supervisor for this one."></textarea></div>
      <div class="row end"><button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn" id="cSend" type="button">Close request</button></div>`, (card) => {
      $('#cSend', card).addEventListener('click', () => { S.closeRequest(sub.id, $('#cReply', card).value.trim()); closeModal(); toast('Request closed'); rerender(); });
    });
  }
  function bindRequests() {
    bindNewDoc();
    const find = (id) => S.state.submissions.find((x) => x.id === id);
    const inp = $('#reqSearch');
    inp.addEventListener('keyup', (e) => { if (e.key === 'Enter') { reqQuery = inp.value; rerender(); } });
    inp.addEventListener('change', () => { reqQuery = inp.value; rerender(); });
    $$('.toolbar .chip').forEach((c) => c.addEventListener('click', () => { reqFilter = c.dataset.f; rerender(); }));
    $$('.req-answer-btn').forEach((b) => b.addEventListener('click', () => answerModal(find(b.dataset.id))));
    $$('.req-close').forEach((b) => b.addEventListener('click', () => closeModalFor(find(b.dataset.id))));
    $$('.req-add').forEach((b) => b.addEventListener('click', () => {
      const sub = find(b.dataset.id);
      sub.status = 'done';
      S.state.roadmap.push({ id: 'R' + Date.now(), title: sub.text.slice(0, 70) + (sub.text.length > 70 ? '…' : ''), status: 'idea', priority: 'Med', work: 'Create New', effort: 'Med', type: 'SOP', fromRequest: sub.id, notes: (sub.type === 'ask' ? 'Asked ' + sub.askers.length + '× via Ask: ' : 'Requested by ' + S.user(sub.user).name + ': ') + sub.text });
      S.save(); toast('Added to Roadmap → Ideas'); rerender();
    }));
  }

  function roadmapModal(r) {
    const isNew = !r;
    r = r || { id: 'R' + Date.now(), title: '', status: 'idea', priority: 'Med', work: 'Create New', effort: 'Med', type: 'SOP', notes: '' };
    const sel = (id, opts, val) => `<select id="${id}">${opts.map((o) => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    openModal(`<h2 id="modalTitle">${isNew ? 'Add to roadmap' : 'Roadmap item'}</h2>
      <div class="field"><label for="rTitle">Document</label><input type="text" id="rTitle" value="${esc(r.title)}"></div>
      <div class="grid-2col">
        <div class="field"><label for="rStatus">Status</label><select id="rStatus">${COLS.map(([k, l]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="rPrio">Priority</label>${sel('rPrio', ['High', 'Med', 'Low'], r.priority)}</div>
        <div class="field"><label for="rWork">Work</label>${sel('rWork', ['Create New', 'Update Existing', 'Format Drafted'], r.work)}</div>
        <div class="field"><label for="rEffort">Effort</label>${sel('rEffort', ['Minor', 'Small', 'Med', 'Large', 'Major'], r.effort)}</div>
      </div>
      <div class="field"><label for="rType">Type</label>${sel('rType', S.state.types, r.type)}</div>
      <div class="field"><label for="rNotes">Notes</label><textarea id="rNotes" class="short">${esc(r.notes || '')}</textarea></div>
      ${r.docId ? `<p class="small"><a href="#/manage/doc/${r.docId}" data-close>Open document →</a></p>` : ''}
      <div class="row end">${isNew ? '' : '<button class="link-btn small" id="rDelete" type="button" style="margin-right:auto">Delete</button>'}<button class="btn btn-ghost" data-close type="button">Cancel</button><button class="btn" id="rSave" type="button">Save</button></div>`, (card) => {
      $('#rSave', card).addEventListener('click', () => {
        const title = $('#rTitle', card).value.trim(); if (!title) return $('#rTitle', card).focus();
        Object.assign(r, { title, status: $('#rStatus', card).value, priority: $('#rPrio', card).value, work: $('#rWork', card).value, effort: $('#rEffort', card).value, type: $('#rType', card).value, notes: $('#rNotes', card).value });
        if (isNew) S.state.roadmap.push(r);
        S.save(); closeModal(); rerender();
      });
      const del = $('#rDelete', card); if (del) del.addEventListener('click', () => { S.state.roadmap = S.state.roadmap.filter((x) => x.id !== r.id); S.save(); closeModal(); rerender(); });
    });
  }
  function bindRoadmap() {
    bindNewDoc();
    $$('.rm-item').forEach((b) => b.addEventListener('click', () => roadmapModal(S.state.roadmap.find((r) => r.id === b.dataset.id))));
    const add = $('#addIdea'); if (add) add.addEventListener('click', () => roadmapModal(null));
  }

  /* ---------- Ask log: every question across the company ---------- */
  let logFilter = 'all', logQuery = '';
  function viewAskLog() {
    const all = S.askHistory();
    const answered = all.filter((e) => e.found).length;
    const notFoundN = all.filter((e) => !e.found).length;
    const notHelpful = all.filter((e) => e.helpful === false).length;
    const rate = all.length ? Math.round((answered / all.length) * 100) : 0;
    const filters = [['all', 'All', all.length], ['answered', 'Answered', answered], ['nf', 'No answer found', notFoundN], ['nh', 'Not helpful', notHelpful]];
    const q = logQuery.toLowerCase();
    const shown = all.filter((e) => (logFilter === 'all' || (logFilter === 'answered' && e.found) || (logFilter === 'nf' && !e.found) || (logFilter === 'nh' && e.helpful === false))
      && (!q || (e.q + ' ' + S.user(e.user).name).toLowerCase().includes(q)));
    return manageTabs('ask') + `
      <div class="stats">
        <div class="stat"><span class="stat-n">${all.length}</span><span class="stat-l">Questions</span></div>
        <div class="stat"><span class="stat-n">${rate}%</span><span class="stat-l">Answered</span></div>
        <div class="stat"><span class="stat-n">${notFoundN}</span><span class="stat-l">No answer found</span></div>
        <div class="stat"><span class="stat-n">${notHelpful}</span><span class="stat-l">Marked not helpful</span></div>
      </div>
      <div class="row toolbar">
        <input type="search" id="logSearch" placeholder="Search questions or people" value="${esc(logQuery)}">
        <div class="pill-row">${filters.map(([k, l, n]) => `<button class="chip ${logFilter === k ? 'active' : ''}" data-f="${k}" type="button">${l} <span class="chip-n">${n}</span></button>`).join('')}</div>
      </div>
      <div class="card list log">${shown.map((e) => logRow(e, true)).join('') || '<div class="empty">No questions match.</div>'}</div>`;
  }
  function bindAskLog() {
    bindNewDoc();
    const inp = $('#logSearch');
    inp.addEventListener('change', () => { logQuery = inp.value; rerender(); });
    inp.addEventListener('keyup', (e) => { if (e.key === 'Enter') { logQuery = inp.value; rerender(); } });
    $$('.toolbar .chip').forEach((c) => c.addEventListener('click', () => { logFilter = c.dataset.f; rerender(); }));
  }

  function notFound() { return `<div class="card empty">Page not found. <a href="#/learn">Go to Learn</a></div>`; }
  function rerender() { route._keepScroll = true; route(); route._keepScroll = false; }

  /* =========================================================================
     ROUTER
     ========================================================================= */
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!parts.length) parts.push('learn');
    const me = S.me();
    renderChrome(parts);
    let html = '', bind = () => {};
    const [a, b, c, d, e] = parts;
    if (a === 'learn') {
      if (b === 'module') { html = viewModule(c, d); bind = () => bindModule(c); }
      else if (b === 'update') { html = viewUpdate(c); bind = () => bindUpdate(c); }
      else if (b === 'answer') { html = viewAnswerNotice(c); bind = () => bindAnswerNotice(c); }
      else if (b === 'record') html = viewRecord();
      else html = viewLearn();
    } else if (a === 'refer') {
      if (b === 'doc') { html = viewDoc(c); bind = () => bindDoc(c); }
      else if (b === 'f') html = viewFolder(c);
      else { html = viewKnow(); bind = bindKnow; }
    } else if (a === 'navigate') {
      if (c) html = viewGuide(b, c);
      else if (b) html = viewSystem(b);
      else html = viewNavigate();
    } else if (a === 'ask') {
      if (b === 'history') { html = viewAskHistory(); bind = bindAskHistory; }
      else { html = viewAsk(); bind = bindAsk; }
    }
    else if (a === 'team') {
      if (!S.canSeeTeam(me)) html = notFound();
      else if (b && c === 'ask') html = viewMemberAsk(b);
      else if (b) { html = viewMember(b); bind = () => bindMember(b); }
      else html = viewTeam();
    } else if (a === 'manage') {
      if (!S.isAdmin(me)) html = `<div class="card empty">Manage is for Learning &amp; Development only. <a href="#/learn">Go to Learn</a></div>`;
      else if (b === 'doc' && d === 'v') html = viewArchivedVersion(c, e);
      else if (b === 'doc') { html = viewManageDoc(c); bind = () => bindManageDoc(c); }
      else if (b === 'edit') { html = viewEdit(c); bind = () => bindEdit(c); }
      else if (b === 'requests') { html = viewRequests(); bind = bindRequests; }
      else if (b === 'roadmap') { html = viewRoadmap(); bind = bindRoadmap; }
      else if (b === 'ask') { html = viewAskLog(); bind = bindAskLog; }
      else { html = viewRegister(); bind = bindRegister; }
    } else html = notFound();

    app.innerHTML = html;
    bind();
    if (!route._keepScroll) window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', () => route());
  route();
})();
