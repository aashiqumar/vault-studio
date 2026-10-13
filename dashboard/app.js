// Vault Studio dashboard — vanilla JS, talks to scripts/studio.cjs
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUSES = ['idea', 'draft', 'ready', 'scheduled', 'posted', 'retired'];
const METRICS = ['reach', 'likes', 'saves', 'shares', 'comments', 'profile_visits', 'link_clicks', 'demo_requests'];
let S = { library: { items: [] }, media: [], activity: [], docs: {}, today: '' };
let view = 'overview', calMonth = null, fil = { status: 'all', pillar: 'all', q: '' }, unseen = 0, reel = null;

const items = () => (S.library.items || []);
const feed = () => items().filter(i => i.type !== 'brand-asset');
const dated = () => feed().filter(i => i.post_date).sort((a, b) => a.post_date.localeCompare(b.post_date));
const fmtDate = d => { const x = new Date(d + 'T00:00:00'); return `${DOW[(x.getDay() + 6) % 7]} ${x.getDate()} ${x.toLocaleString('en', { month: 'short' })}`; };
const days = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const firstMedia = i => (i.files || []).find(f => /\.(png|jpe?g|webp|mp4)$/i.test(f));
const isVid = f => /\.mp4$/i.test(f || '');
const url = f => '/' + f.split('/').map(encodeURIComponent).join('/');
const poster = f => url(f.replace(/\.mp4$/i, '-poster.jpg'));   // optional <name>-poster.jpg next to a video
const thumbHTML = (i, cls = 'thumb') => { const f = firstMedia(i); if (!f) return `<div class="${cls}"></div>`;
  return isVid(f) ? `<div class="${cls}"><video src="${url(f)}#t=6" muted preload="metadata"></video></div>` : `<div class="${cls}" style="background-image:url('${url(f)}')"></div>`; };
const chip = (s, cls) => `<span class="chip ${cls || 'st-' + s}">${esc(s)}</span>`;
const hh = t => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// ---------- brand chrome
$('#wm').innerHTML = wordmark({ h: 26, color: '#FFFFFF' }); fitAll($('#wm'));
$('#sideDot').innerHTML = pose('happy', 54, { noShadow: true });
document.head.insertAdjacentHTML('beforeend', `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(iconV({ sz: 64 }))}">`);

// ---------- data + live
async function load() { S = await (await fetch('/api/state')).json(); render(); }
function connect() {
  const es = new EventSource('/api/events');
  es.onopen = () => { $('#conn').className = 'conn on'; $('#conn').textContent = 'live'; };
  es.onerror = () => { $('#conn').className = 'conn off'; $('#conn').textContent = 'reconnecting…'; };
  es.addEventListener('library', e => { S.library = JSON.parse(e.data); if (!$('#drawer').hidden && view !== 'live') {} render(true); });
  es.addEventListener('activity', e => { const a = JSON.parse(e.data); S.activity.push(a);
    if (a.type === 'reel') reel = a; if (a.type === 'file' && a.total && a.progress >= a.total) reel = null;
    if (view === 'live') addActivityRow(a, true); else if (view === 'overview') render(true);
    if (view !== 'live') { unseen++; $('#liveBadge').hidden = false; $('#liveBadge').textContent = unseen; }
    if (view === 'live') renderReel(); });
  es.addEventListener('media', e => { const m = JSON.parse(e.data); S.media = [m, ...S.media.filter(x => x.file !== m.file)];
    toast(m); if (view === 'live') addTile(m, true); });
}
function toast(m) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `${isVid(m.file) ? '🎬' : `<img src="${url(m.file)}?v=${m.mtime}">`}<div>New render<br><span style="color:#9A9CAB;font-weight:500;font-size:12px">${esc(m.file.split('/').pop())}</span></div>`;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4500);
}

// ---------- router
window.addEventListener('hashchange', () => { view = location.hash.slice(1) || 'overview'; render(); });
function render(soft) {
  view = location.hash.slice(1) || 'overview';
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === view));
  if (view === 'live') { unseen = 0; $('#liveBadge').hidden = true; }
  const y = soft ? window.scrollY : 0;
  ({ overview, timeline, library, grid, live, ideas }[view] || overview)();
  if (soft) window.scrollTo(0, y);
}

// ---------- overview
function warnings() {
  const w = [], d = dated().filter(i => ['ready', 'scheduled', 'posted'].includes(i.status));
  const STOP = new Set('the a an and or of to for in on your you is are with how why what vault club clubs dot tip'.split(' '));
  const words = i => new Set([i.topic, i.angle, ...(i.keywords || [])].join(' ').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length > 2 && !STOP.has(x)));
  for (let a = 0; a < d.length; a++) for (let b = a + 1; b < d.length; b++) {
    if (d[a].type === 'reel' || d[b].type === 'reel' || days(d[a].post_date, d[b].post_date) > 42) continue;
    const A = words(d[a]), B = words(d[b]), inter = [...A].filter(x => B.has(x)).length;
    if (inter / Math.max(1, Math.min(A.size, B.size)) >= .4) w.push(`<b>${d[a].id}</b> and <b>${d[b].id}</b> cover similar ground ${days(d[a].post_date, d[b].post_date)} days apart.`);
  }
  for (let k = 2; k < d.length; k++) { const bg = d.slice(k - 2, k + 1).map(i => (i.background || '').split(/[ ,+]/)[0]); if (bg[0] && bg.every(x => x === bg[0])) w.push(`Grid: three <b>${bg[0]}</b> backgrounds in a row ending <b>${d[k].id}</b>.`); }
  feed().filter(i => i.status === 'idea' && i.post_date && days(S.today, i.post_date) <= 10 && days(S.today, i.post_date) >= 0).forEach(i => w.push(`<b>${i.id}</b> is due ${fmtDate(i.post_date)} but not made yet.`));
  feed().filter(i => /CLAIMS/i.test(i.notes || '')).forEach(i => w.push(`<b>${i.id}</b>: check product claims before posting.`));
  return w;
}
function overview() {
  const f = feed(), c = s => f.filter(i => i.status === s).length, up = dated().filter(i => i.post_date >= S.today);
  const next = up[0], tgt = S.library.pillar_targets || {};
  const last12 = dated().filter(i => i.status !== 'idea').slice(-12), n = last12.length || 1;
  const bars = Object.keys(tgt).map(p => { const v = last12.filter(i => i.pillar === p).length / n;
    return `<div class="bar" title="${p}: ${Math.round(v * 100)}% of the last ${n} (target ${Math.round(tgt[p] * 100)}%)"><span>${p}</span><div class="track"><div class="fill" style="width:${v * 100}%"></div><div class="tgt" style="left:calc(${tgt[p] * 100}% - 1px)"></div></div><span class="v">${Math.round(v * 100)}% / ${Math.round(tgt[p] * 100)}%</span></div>`; }).join('');
  const w = warnings(), acts = S.activity.slice(-8).reverse();
  const perf = f.filter(i => i.metrics && (i.metrics.saves || i.metrics.shares || i.metrics.reach)).sort((a, b) => ((b.metrics.saves || 0) + (b.metrics.shares || 0)) - ((a.metrics.saves || 0) + (a.metrics.shares || 0))).slice(0, 5);
  const hr = new Date().getHours();
  $('#main').innerHTML = `
  <div class="top"><div><h1>Good ${hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'}<em>.</em></h1><div class="sub">${fmtDate(S.today)} · ${f.length} pieces in the library</div></div>
    <a class="btn" href="#live">Watch live →</a></div>
  <div class="row r4">
    <div class="card tile"><div class="n">${next ? Math.max(0, days(S.today, next.post_date)) : '–'}</div><div class="l">days to next post</div><div class="s">${next ? esc(next.id + ' · ' + fmtDate(next.post_date)) : 'Nothing scheduled'}</div></div>
    <div class="card tile"><div class="n">${c('ready') + c('scheduled')}</div><div class="l">ready to post</div><div class="s">${c('scheduled')} scheduled · ${c('ready')} ready</div></div>
    <div class="card tile"><div class="n">${c('posted')}</div><div class="l">posted</div><div class="s">${f.filter(i => i.metrics && i.metrics.reach).length} with metrics</div></div>
    <div class="card tile"><div class="n">${c('idea') + c('draft')}</div><div class="l">in the pipeline</div><div class="s">${c('idea')} ideas · ${c('draft')} drafts</div></div>
  </div>
  <div class="row r2">
    <div class="card"><h3>Up next</h3>${up.slice(0, 5).map(i => `<div class="item" data-id="${i.id}"><span class="date">${fmtDate(i.post_date)}</span>${thumbHTML(i)}<div><div class="t">${esc(i.topic)}</div><div class="m">${chip(i.status)}${chip(i.pillar, 'pl')}<span>${esc(i.type)}</span></div></div></div>`).join('') || '<div class="idle">Nothing upcoming. Ask Claude to plan the next month.</div>'}</div>
    <div class="card"><h3>Pillar mix · last ${n} posts</h3>${bars}<div class="legend"><span><b></b>actual</span><span><b class="tk"></b>target</span></div></div>
  </div>
  <div class="row r2">
    <div class="card"><h3>Needs attention</h3>${w.map(x => `<div class="warn"><i>!</i><div>${x}</div></div>`).join('') || '<div class="idle">All clear.</div>'}</div>
    <div class="card"><h3>Recent activity</h3>${acts.map(actRow).join('') || '<div class="idle">No activity yet.</div>'}</div>
  </div>
  ${perf.length ? `<div class="card"><h3>Top performers · saves + shares</h3>${perf.map(i => `<div class="item" data-id="${i.id}">${thumbHTML(i)}<div style="flex:1"><div class="t">${esc(i.topic)}</div><div class="m">${chip(i.pillar, 'pl')} reach ${i.metrics.reach || 0} · saves ${i.metrics.saves || 0} · shares ${i.metrics.shares || 0}</div></div></div>`).join('')}</div>` : ''}`;
  bindItems();
}
const ICON = { file: '▣', render: '◐', reel: '▶', library: '✎', check: '✓', step: '→', note: '•', plan: '✦', done: '★' };
const actRow = (a, fresh) => `<div class="act${fresh ? ' fresh' : ''}"><time>${hh(a.ts)}</time><span class="ic ${esc(a.type)}">${ICON[a.type] || '•'}</span><div>${esc(a.msg)}${a.file && !isVid(a.file) && /\.(png|jpe?g)$/i.test(a.file) ? ` <a href="${url(a.file)}" target="_blank" style="color:var(--rose);font-weight:700">view</a>` : ''}</div></div>`;

// ---------- timeline (month calendar + agenda)
function timeline() {
  if (!calMonth) { const d = new Date(S.today + 'T00:00:00'); const nx = dated().find(i => i.post_date >= S.today); calMonth = nx ? new Date(nx.post_date.slice(0, 7) + '-01T00:00:00') : new Date(d.getFullYear(), d.getMonth(), 1); }
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), start = new Date(y, m, 1), off = (start.getDay() + 6) % 7;
  const cells = []; for (let k = 0; k < 42; k++) { const d = new Date(y, m, 1 - off + k); cells.push(d); }
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const by = {}; dated().forEach(i => (by[i.post_date] = by[i.post_date] || []).push(i));
  const lastRow = cells.slice(35).some(d => d.getMonth() === m) ? 42 : 35;
  const month = dated().filter(i => i.post_date.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`));
  $('#main').innerHTML = `
  <div class="top"><div><h1>${calMonth.toLocaleString('en', { month: 'long' })} ${y}<em>.</em></h1><div class="sub">${month.length} feed items this month</div></div>
    <div style="display:flex;gap:8px"><button class="btn" id="pm">←</button><button class="btn" id="tm">Today</button><button class="btn" id="nm">→</button></div></div>
  <div class="cal">${DOW.map(d => `<div class="dow">${d}</div>`).join('')}
  ${cells.slice(0, lastRow).map(d => { const k = iso(d); return `<div class="day${d.getMonth() !== m ? ' out' : ''}${k === S.today ? ' today' : ''}"><span class="d">${d.getDate()}</span>${(by[k] || []).map(i => `<div class="ev ${i.status}" data-id="${i.id}" title="${esc(i.topic)}">${thumbHTML(i)}<span>${esc(i.id)}<br><span style="font-weight:600;color:var(--mute)">${esc(i.type)}</span></span></div>`).join('')}</div>`; }).join('')}</div>
  <div class="card" style="margin-top:16px"><h3>Agenda</h3>${month.map(i => `<div class="item" data-id="${i.id}"><span class="date">${fmtDate(i.post_date)}</span>${thumbHTML(i)}<div style="flex:1"><div class="t">${esc(i.topic)}</div><div class="m">${chip(i.status)}${chip(i.pillar, 'pl')}<span>${esc(i.type)} · Dot: ${esc(String(i.dot_pose || '–').split(/[ ,(]/)[0])} · ${esc((i.background || '–').split(/[ ,+]/)[0])}</span></div></div></div>`).join('') || '<div class="idle">Nothing this month yet.</div>'}</div>`;
  $('#pm').onclick = () => { calMonth = new Date(y, m - 1, 1); timeline(); };
  $('#nm').onclick = () => { calMonth = new Date(y, m + 1, 1); timeline(); };
  $('#tm').onclick = () => { calMonth = null; timeline(); };
  bindItems();
}

// ---------- library
function library() {
  const pillars = [...new Set(feed().map(i => i.pillar))];
  const list = items().filter(i => (fil.status === 'all' || i.status === fil.status) && (fil.pillar === 'all' || i.pillar === fil.pillar) &&
    (!fil.q || JSON.stringify([i.id, i.topic, i.hook, i.angle, i.keywords, i.caption]).toLowerCase().includes(fil.q.toLowerCase())))
    .sort((a, b) => (b.post_date || '').localeCompare(a.post_date || ''));
  const fc = (k, v) => `<button class="fchip${fil[k] === v ? ' on' : ''}" data-k="${k}" data-v="${v}">${v}</button>`;
  $('#main').innerHTML = `
  <div class="top"><div><h1>Library<em>.</em></h1><div class="sub">Everything made so far. Claude reads this before creating anything, so nothing repeats.</div></div>
    <input class="search" id="q" placeholder="Search topic, hook, caption…" value="${esc(fil.q)}"></div>
  <div class="filters">${['all', ...STATUSES].map(s => fc('status', s)).join('')}<span style="width:12px"></span>${['all', ...pillars].map(p => fc('pillar', p)).join('')}</div>
  <div class="cards">${list.map(i => { const f = firstMedia(i);
    return `<div class="lc" data-id="${i.id}"><div class="img" style="${f && !isVid(f) ? `background-image:url('${url(f)}')` : ''}">${isVid(f) ? `<video src="${url(f)}#t=6" muted preload="metadata"></video>` : ''}${!f ? '<div class="empty">not made yet</div>' : ''}<span class="kind">${esc(i.type)}${(i.files || []).length > 1 ? ' · ' + i.files.length : ''}</span></div>
      <div class="b"><div style="display:flex;gap:6px;flex-wrap:wrap">${chip(i.status)}${chip(i.pillar, 'pl')}</div><div class="t">${esc(i.topic)}</div><div class="h">${esc(i.hook || i.angle)}</div>
      <div class="m" style="font-size:11px;color:var(--mute);margin-top:8px;font-family:'JetBrains Mono'">${esc(i.id)} · ${i.post_date ? fmtDate(i.post_date) : 'no date'}</div></div></div>`; }).join('')}</div>`;
  document.querySelectorAll('.fchip').forEach(b => b.onclick = () => { fil[b.dataset.k] = b.dataset.v; library(); });
  $('#q').oninput = e => { fil.q = e.target.value; const pos = e.target.selectionStart; library(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); };
  bindItems();
}

// ---------- grid preview
function grid() {
  const g = dated().filter(i => i.type !== 'story' && firstMedia(i)).reverse();
  $('#main').innerHTML = `
  <div class="top"><div><h1>Grid preview<em>.</em></h1><div class="sub">How the profile grid will look, newest first, with planned posts included. Profile grids crop posts to 3:4.</div></div></div>
  <div class="phonebox"><div class="ig">
    <div class="hd"><div style="width:76px;height:76px;border-radius:50%;overflow:hidden;flex:none">${iconV({ sz: 76, circle: true })}</div>
      <div><div class="nm">vaultpro.cloud</div><div class="bio"><b>Vault</b><br>Club management for Rotaract clubs 🇱🇰<br>Treasury · Events · Members · Reports<br>Meet Dot, our tiny vault-bot 🤖</div></div></div>
    <div class="igg">${g.map(i => { const f = firstMedia(i); return `<div data-id="${i.id}" style="${isVid(f) ? '' : `background-image:url('${url(f)}')`}">${isVid(f) ? `<video src="${url(f)}#t=6" muted preload="metadata"></video>` : ''}${i.status !== 'posted' ? `<span class="pl8">${esc(fmtDate(i.post_date))}</span>` : ''}</div>`; }).join('')}</div>
  </div>
  <div class="card" style="max-width:360px"><h3>Grid rules</h3><div style="line-height:1.7">• Never three of the same background in a row<br>• Rose backgrounds for covers only<br>• Mix Dot poses; don't repeat within 3 posts<br>• Pin: Meet Dot → Carousel → Demo CTA</div></div></div>`;
  bindItems();
}

// ---------- live
function live() {
  const files = S.media.slice(0, 60);
  $('#main').innerHTML = `
  <div class="top"><div><h1>Live studio<em>.</em></h1><div class="sub">Watch Claude work: every step, render and library change appears here as it happens.</div></div></div>
  <div class="card" id="now" style="margin-bottom:16px"></div>
  <div class="live">
    <div class="card stream" id="stream"><h3>Activity</h3><div id="acts">${S.activity.slice(-150).reverse().map(a => actRow(a)).join('') || '<div class="idle">Waiting for activity…</div>'}</div></div>
    <div class="card"><h3>Latest renders</h3><div class="mosaic" id="mosaic">${files.map(m => tile(m)).join('')}</div></div>
  </div>`;
  renderReel(); bindTiles();
}
function renderReel() {
  const box = $('#now'); if (!box) return;
  const last = S.activity[S.activity.length - 1];
  const working = last && (Date.now() - new Date(last.ts)) < 90000;
  box.innerHTML = `<div class="nowbox"><div style="width:64px;flex:none">${pose(working ? 'thinking' : 'happy', 64, { noShadow: true })}</div><div style="flex:1">
    <div style="font-weight:800;font-size:16px">${working ? 'Working…' : 'Idle'}</div><div class="idle" style="margin-top:2px">${last ? esc(last.msg) + ' · ' + hh(last.ts) : 'No activity yet. Start a Claude session in this folder.'}</div>
    ${reel && reel.total ? `<div class="prog"><div style="width:${Math.round(reel.progress / reel.total * 100)}%"></div></div><div class="idle" style="font-size:12px;margin-top:4px">Reel frames ${reel.progress}/${reel.total}</div>` : ''}</div></div>`;
}
const tile = (m, fresh) => `<div class="mz${fresh ? ' new' : ''}" data-f="${esc(m.file)}">${isVid(m.file) ? `<video src="${url(m.file)}" poster="${poster(m.file)}" muted preload="metadata"></video>` : `<img loading="lazy" src="${url(m.file)}?v=${m.mtime}">`}<span>${esc(m.file.replace(/^(out|assets)\//, ''))}</span></div>`;
function addTile(m, fresh) { const mz = $('#mosaic'); if (!mz) return; mz.querySelector(`[data-f="${CSS.escape(m.file)}"]`)?.remove(); mz.insertAdjacentHTML('afterbegin', tile(m, fresh)); bindTiles(); }
function addActivityRow(a, fresh) { const el = $('#acts'); if (!el) return; if (el.querySelector('.idle')) el.innerHTML = ''; el.insertAdjacentHTML('afterbegin', actRow(a, fresh)); }
function bindTiles() { document.querySelectorAll('.mz').forEach(t => t.onclick = () => lightbox(t.dataset.f)); }
function lightbox(f) { const d = document.createElement('div'); d.className = 'lightbox'; d.innerHTML = isVid(f) ? `<video src="${url(f)}" controls autoplay></video>` : `<img src="${url(f)}">`; d.onclick = e => { if (e.target === d || e.target.tagName === 'IMG') d.remove(); }; document.body.appendChild(d); }

// ---------- ideas
function ideas() {
  const md = S.docs.ideas || ''; const secs = []; let cur = null;
  md.split('\n').forEach(l => { const h = l.match(/^##\s+(.*)/); if (h) { cur = { t: h[1], items: [] }; secs.push(cur); return; }
    const it = l.match(/^- \[( |x[^\]]*)\]\s+(.*)/); if (it && cur) cur.items.push({ done: it[1] !== ' ', ref: it[1].replace(/^x\s*→?\s*/, ''), text: it[2] }); });
  const open = secs.reduce((a, s) => a + s.items.filter(i => !i.done).length, 0);
  $('#main').innerHTML = `<div class="top"><div><h1>Idea bank<em>.</em></h1><div class="sub">${open} unused ideas · Claude picks from here when planning and ticks them off when used. Edit content/ideas.md to add your own.</div></div></div>
  <div class="ideas">${secs.map(s => `<div class="card"><h3>${esc(s.t)}</h3>${s.items.map(i => `<div class="idea${i.done ? ' done' : ''}"><span class="bx"></span><span>${esc(i.text.replace(/\*\*/g, ''))}${i.ref ? ` <b style="color:var(--teal)">${esc(i.ref)}</b>` : ''}</span></div>`).join('')}</div>`).join('')}</div>`;
}

// ---------- item drawer (details + edit status/date/metrics + copy caption)
function bindItems() { document.querySelectorAll('[data-id]').forEach(el => el.onclick = () => openItem(el.dataset.id)); }
function openItem(id) {
  const i = items().find(x => x.id === id); if (!i) return;
  const tags = (S.library.hashtag_sets || {})[i.hashtag_set] || '';
  const dr = $('#drawer'); dr.hidden = false;
  dr.innerHTML = `<button class="btn x" id="dx">✕</button>
  <div style="display:flex;gap:6px">${chip(i.status)}${chip(i.pillar, 'pl')}<span class="chip">${esc(i.type)}</span><span class="chip">${esc(i.id)}</span></div>
  <h2>${esc(i.topic)}</h2><div class="idle">${i.post_date ? fmtDate(i.post_date) : 'No date yet'}</div>
  <div class="media">${(i.files || []).filter(f => /\.(png|jpe?g|webp|mp4)$/i.test(f)).map(f => isVid(f) ? `<video src="${url(f)}" poster="${poster(f)}" controls preload="metadata"></video>` : `<img src="${url(f)}" data-f="${esc(f)}" style="cursor:zoom-in">`).join('') || '<div class="idle">No files yet.</div>'}</div>
  <dl class="kv"><dt>Hook</dt><dd>${esc(i.hook)}</dd><dt>Angle</dt><dd>${esc(i.angle)}</dd><dt>Dot</dt><dd>${esc(i.dot_pose)}</dd><dt>Background</dt><dd>${esc(i.background)}</dd><dt>Layout</dt><dd>${esc(i.layout)}</dd></dl>
  ${i.notes ? `<div class="note">${esc(i.notes)}</div>` : ''}
  <div class="sec"><label class="fld">Caption<textarea id="cap">${esc(i.caption)}</textarea></label>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="btn" id="cp">Copy caption + hashtags</button><span class="idle" style="font-size:12px">Set ${esc(i.hashtag_set || '–')}: ${esc(tags)}</span></div></div>
  <div class="sec" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <label class="fld">Status<select id="st">${STATUSES.map(s => `<option${s === i.status ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
    <label class="fld">Post date<input type="date" id="pd" value="${esc(i.post_date)}"></label></div>
  <div class="sec"><div class="fld" style="margin-bottom:6px">Metrics (enter 3–7 days after posting)</div><div class="metrics">${METRICS.map(k => `<label class="fld" style="font-weight:600">${k.replace('_', ' ')}<input type="number" min="0" data-m="${k}" value="${(i.metrics || {})[k] ?? ''}"></label>`).join('')}</div></div>
  <div class="sec" style="display:flex;gap:8px"><button class="btn pri" id="sv">Save changes</button><button class="btn" id="dc">Close</button></div>`;
  $('#dx').onclick = $('#dc').onclick = () => dr.hidden = true;
  dr.querySelectorAll('.media img').forEach(im => im.onclick = () => lightbox(im.dataset.f));
  $('#cp').onclick = async () => { await navigator.clipboard.writeText($('#cap').value + (tags ? '\n.\n' + tags : '')); $('#cp').textContent = 'Copied ✓'; setTimeout(() => $('#cp') && ($('#cp').textContent = 'Copy caption + hashtags'), 1500); };
  $('#sv').onclick = async () => {
    const metrics = {}; dr.querySelectorAll('[data-m]').forEach(x => { if (x.value !== '') metrics[x.dataset.m] = x.value; });
    const r = await fetch('/api/item/' + id, { method: 'POST', body: JSON.stringify({ status: $('#st').value, post_date: $('#pd').value, caption: $('#cap').value, metrics }) });
    if (r.ok) { $('#sv').textContent = 'Saved ✓'; await load(); setTimeout(() => openItem(id), 50); } else alert('Save failed: ' + await r.text());
  };
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#drawer').hidden = true; document.querySelector('.lightbox')?.remove(); } });

load().then(connect);
