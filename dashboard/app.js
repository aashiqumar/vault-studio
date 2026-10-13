// Vault Studio dashboard — vanilla JS, talks to scripts/studio.cjs
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUSES = ['idea', 'draft', 'ready', 'scheduled', 'posted', 'retired'];
const BOARD = ['idea', 'draft', 'ready', 'scheduled', 'posted'];
const FEED = ['post', 'carousel', 'reel', 'graphic'];
const TYPES = ['post', 'carousel', 'reel', 'graphic', 'story', 'task'];
const PILLARS = ['tips', 'product', 'problem', 'community', 'brand', 'conversion'];
const METRICS = ['reach', 'likes', 'saves', 'shares', 'comments', 'profile_visits', 'link_clicks', 'demo_requests'];
const TICON = { post: '▣', carousel: '❐', reel: '▶', graphic: '◩', story: '○', task: '☐' };
let S = { library: { items: [] }, warnings: [], media: [], activity: [], docs: {}, today: '' };
let view = 'overview', calMonth = null, fil = { status: 'all', pillar: 'all', type: 'all', q: '' }, boardFil = 'all', unseen = 0, reel = null, dragId = null;

const items = () => (S.library.items || []);
const isFeed = i => FEED.includes(i.type);
const feed = () => items().filter(isFeed);
const calItems = () => items().filter(i => i.type !== 'brand-asset' && i.status !== 'retired');
const key = i => (i.post_date || '9999') + (i.post_time || '99:99');
const dated = () => calItems().filter(i => i.post_date).sort((a, b) => key(a).localeCompare(key(b)));
const fmtDate = d => { const x = new Date(d + 'T00:00:00'); return `${DOW[(x.getDay() + 6) % 7]} ${x.getDate()} ${x.toLocaleString('en', { month: 'short' })}`; };
const days = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const firstMedia = i => (i.files || []).find(f => /\.(png|jpe?g|webp|mp4)$/i.test(f));
const isVid = f => /\.mp4$/i.test(f || '');
const url = f => '/' + f.split('/').map(encodeURIComponent).join('/');
const poster = f => url(f.replace(/\.mp4$/i, '-poster.jpg'));   // optional <name>-poster.jpg next to a video
const openFb = i => (i.feedback || []).filter(f => !f.resolved).length;
const thumbHTML = (i, cls = 'thumb') => { const f = firstMedia(i);
  if (!f) return `<div class="${cls} ph">${TICON[i.type] || ''}</div>`;
  return isVid(f) ? `<div class="${cls}"><video src="${url(f)}#t=6" poster="${poster(f)}" muted preload="metadata"></video></div>` : `<div class="${cls}" style="background-image:url('${url(f)}')"></div>`; };
const chip = (s, cls) => `<span class="chip ${cls || 'st-' + s}">${esc(s)}</span>`;
const hh = t => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const badges = i => `${i.date_locked ? '<span class="bdg" title="You set this date. Claude asks before moving it">🔒</span>' : ''}${openFb(i) ? `<span class="bdg fb" title="Open feedback">💬${openFb(i)}</span>` : ''}`;

// ---------- brand chrome
$('#wm').innerHTML = wordmark({ h: 26, color: '#FFFFFF' }); fitAll($('#wm'));
$('#sideDot').innerHTML = pose('happy', 54, { noShadow: true });
document.head.insertAdjacentHTML('beforeend', `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(iconV({ sz: 64 }))}">`);

// ---------- data + live
async function load() { S = await (await fetch('/api/state')).json(); render(); }
async function api(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j;
}
function upsert(it) { const a = S.library.items, k = a.findIndex(x => x.id === it.id); if (k >= 0) a[k] = it; else a.push(it); }
function connect() {
  const es = new EventSource('/api/events');
  es.onopen = () => { $('#conn').className = 'conn on'; $('#conn').textContent = 'live'; };
  es.onerror = () => { $('#conn').className = 'conn off'; $('#conn').textContent = 'reconnecting…'; };
  es.addEventListener('library', e => { if (dragId) return; const d = JSON.parse(e.data); S.library = d.library; S.warnings = d.warnings; if (view !== 'live') render(true); refreshDrawer(); });
  es.addEventListener('activity', e => { const a = JSON.parse(e.data); S.activity.push(a);
    if (a.type === 'reel') reel = a; if (a.type === 'file' && a.total && a.progress >= a.total) reel = null;
    if (view === 'live') { addActivityRow(a, true); renderNow(); }
    else { unseen++; $('#liveBadge').hidden = false; $('#liveBadge').textContent = unseen; if (view === 'overview' && !dragId) render(true); } });
  es.addEventListener('media', e => { const m = JSON.parse(e.data); S.media = [m, ...S.media.filter(x => x.file !== m.file)];
    toast(`${isVid(m.file) ? '🎬' : `<img src="${url(m.file)}?v=${m.mtime}">`}<div>New render<br><small>${esc(m.file.split('/').pop())}</small></div>`); if (view === 'live') addTile(m, true); });
}
function toast(html, opts = {}) {
  const t = document.createElement('div'); t.className = 'toast' + (opts.warn ? ' warn' : '');
  t.innerHTML = html + (opts.undo ? '<button class="tbtn">Undo</button>' : '');
  if (opts.undo) t.querySelector('.tbtn').onclick = () => { t.remove(); opts.undo(); };
  const box = $('#toasts'); box.appendChild(t); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), opts.ms || 5000);
}

// ---------- write actions
async function moveItem(id, date, opts = {}) {
  const it = items().find(i => i.id === id); if (!it) return;
  const from = it.post_date || '', fromLocked = !!it.date_locked;
  if (from === date) return;
  try {
    const body = { date }; if (opts.lock !== undefined) body.lock = opts.lock;
    const r = await api(`/api/item/${id}/move`, body); upsert(r.item); render(true);
    if (opts.silent) return;
    toast(`<div><b>${esc(id)}</b> moved to ${date ? fmtDate(date) : 'Unscheduled'}${r.warnings.length ? `<small class="w">${r.warnings.map(w => '⚠ ' + esc(w.msg)).join('<br>')}</small>` : ''}</div>`,
      { undo: () => moveItem(id, from, { silent: true, lock: fromLocked }), warn: r.warnings.length, ms: r.warnings.length ? 9000 : 5000 });
  } catch (e) { toast(`<div>Couldn't move ${esc(id)}: ${esc(e.message)}</div>`, { warn: true }); }
}
async function setStatus(id, status) {
  const it = items().find(i => i.id === id); if (!it || it.status === status) return; const prev = it.status;
  try { const r = await api(`/api/item/${id}`, { status }); upsert(r.item); render(true);
    toast(`<div><b>${esc(id)}</b> → ${esc(status)}</div>`, { undo: () => api(`/api/item/${id}`, { status: prev }).then(r2 => { upsert(r2.item); render(true); }) });
  } catch (e) { toast(`<div>${esc(e.message)}</div>`, { warn: true }); }
}

// ---------- drag & drop plumbing (HTML5 DnD; works with mouse and trackpad)
function bindDrag(root = document) {
  root.querySelectorAll('[draggable="true"][data-id]').forEach(el => {
    el.addEventListener('dragstart', e => { dragId = el.dataset.id; e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); document.body.classList.add('is-dragging'); });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); document.body.classList.remove('is-dragging'); $$('.drop-hover').forEach(x => x.classList.remove('drop-hover')); setTimeout(() => dragId = null, 50); });
  });
  root.querySelectorAll('[data-drop]').forEach(z => {
    z.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; z.classList.add('drop-hover'); });
    z.addEventListener('dragleave', e => { if (!z.contains(e.relatedTarget)) z.classList.remove('drop-hover'); });
    z.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); z.classList.remove('drop-hover');
      const id = e.dataTransfer.getData('text/plain') || dragId; if (!id) return;
      const [kind, val] = z.dataset.drop.split(':');
      if (kind === 'date') moveItem(id, val); else if (kind === 'unsched') moveItem(id, ''); else if (kind === 'status') setStatus(id, val); });
  });
}

// ---------- router
window.addEventListener('hashchange', () => render());
function render(soft) {
  view = location.hash.slice(1) || 'overview';
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === view));
  if (view === 'live') { unseen = 0; $('#liveBadge').hidden = true; }
  const y = soft ? window.scrollY : 0;
  ({ overview, timeline, board, library, grid, live, ideas }[view] || overview)();
  if (soft) window.scrollTo(0, y);
}

// ---------- overview
function overview() {
  const f = feed(), c = s => f.filter(i => i.status === s).length, up = dated().filter(i => i.post_date >= S.today);
  const nextFeed = up.find(isFeed), tgt = S.library.pillar_targets || {};
  const last12 = f.filter(i => i.post_date && ['ready', 'scheduled', 'posted'].includes(i.status)).sort((a, b) => key(a).localeCompare(key(b))).slice(-12), n = last12.length || 1;
  const bars = Object.keys(tgt).map(p => { const v = last12.filter(i => i.pillar === p).length / n;
    return `<div class="bar" title="${p}: ${Math.round(v * 100)}% of the last ${n} (target ${Math.round(tgt[p] * 100)}%)"><span>${p}</span><div class="track"><div class="fill" style="width:${v * 100}%"></div><div class="tgt" style="left:calc(${tgt[p] * 100}% - 1px)"></div></div><span class="v">${Math.round(v * 100)}% / ${Math.round(tgt[p] * 100)}%</span></div>`; }).join('');
  const fbs = items().filter(openFb);
  const perf = f.filter(i => i.metrics && (i.metrics.saves || i.metrics.shares || i.metrics.reach)).sort((a, b) => ((b.metrics.saves || 0) + (b.metrics.shares || 0)) - ((a.metrics.saves || 0) + (a.metrics.shares || 0))).slice(0, 5);
  const hr = new Date().getHours();
  $('#main').innerHTML = `
  <div class="top"><div><h1>Good ${hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'}<em>.</em></h1><div class="sub">${fmtDate(S.today)} · ${f.length} feed pieces · ${calItems().length - f.length} stories & tasks</div></div>
    <div style="display:flex;gap:8px"><button class="btn" data-new>+ New</button><a class="btn" href="#live">Watch live →</a></div></div>
  <div class="row r4">
    <div class="card tile"><div class="n">${nextFeed ? Math.max(0, days(S.today, nextFeed.post_date)) : '–'}</div><div class="l">days to next post</div><div class="s">${nextFeed ? esc(nextFeed.id + ' · ' + fmtDate(nextFeed.post_date)) : 'Nothing scheduled'}</div></div>
    <div class="card tile"><div class="n">${c('ready') + c('scheduled')}</div><div class="l">ready to post</div><div class="s">${c('scheduled')} scheduled · ${c('ready')} ready</div></div>
    <div class="card tile"><div class="n">${c('posted')}</div><div class="l">posted</div><div class="s">${f.filter(i => i.metrics && i.metrics.reach).length} with metrics</div></div>
    <div class="card tile"><div class="n">${fbs.length}</div><div class="l">waiting on Claude</div><div class="s">${fbs.reduce((a, i) => a + openFb(i), 0)} open change requests</div></div>
  </div>
  <div class="row r2">
    <div class="card"><h3>Up next</h3>${up.slice(0, 6).map(i => `<div class="item" data-id="${i.id}"><span class="date">${fmtDate(i.post_date)}<br><small>${esc(i.post_time || '')}</small></span>${thumbHTML(i)}<div><div class="t">${esc(i.topic)} ${badges(i)}</div><div class="m">${chip(i.status)}${i.pillar ? chip(i.pillar, 'pl') : ''}<span>${TICON[i.type] || ''} ${esc(i.type)}</span></div></div></div>`).join('') || '<div class="idle">Nothing upcoming. Ask Claude to plan the next month.</div>'}</div>
    <div class="card"><h3>Pillar mix · last ${n} feed posts</h3>${bars}<div class="legend"><span><b></b>actual</span><span><b class="tk"></b>target</span></div></div>
  </div>
  <div class="row r2">
    <div class="card"><h3>Needs attention</h3>${S.warnings.map(w => `<div class="warn" data-id="${esc(w.ids[0])}"><i>${w.kind === 'feedback' ? '💬' : '!'}</i><div>${esc(w.msg)}</div></div>`).join('') || '<div class="idle">All clear.</div>'}</div>
    <div class="card"><h3>Recent activity</h3>${S.activity.slice(-8).reverse().map(a => actRow(a)).join('') || '<div class="idle">No activity yet.</div>'}</div>
  </div>
  ${perf.length ? `<div class="card"><h3>Top performers · saves + shares</h3>${perf.map(i => `<div class="item" data-id="${i.id}">${thumbHTML(i)}<div style="flex:1"><div class="t">${esc(i.topic)}</div><div class="m">${chip(i.pillar, 'pl')} reach ${i.metrics.reach || 0} · saves ${i.metrics.saves || 0} · shares ${i.metrics.shares || 0}</div></div></div>`).join('')}</div>` : ''}`;
  bindItems();
}
const ICON = { file: '▣', render: '◐', reel: '▶', library: '✎', check: '✓', step: '→', note: '•', plan: '✦', done: '★' };
const actRow = (a, fresh) => `<div class="act${fresh ? ' fresh' : ''}"><time>${hh(a.ts)}</time><span class="ic ${esc(a.type)}${a.by === 'user' ? ' you' : ''}">${ICON[a.type] || '•'}</span><div>${esc(a.msg)}${a.file && /\.(png|jpe?g)$/i.test(a.file) ? ` <a href="${url(a.file)}" target="_blank" style="color:var(--rose);font-weight:700">view</a>` : ''}</div></div>`;

// ---------- timeline: month calendar with drag-to-reschedule + unscheduled tray
const evHTML = i => `<div class="ev ${i.status} t-${i.type}" data-id="${i.id}" draggable="${i.status !== 'posted'}" title="${esc(i.topic)}${i.status === 'posted' ? ' (posted, locked)' : ' · drag to reschedule'}">
  ${i.type === 'task' ? '' : thumbHTML(i)}<span class="evt"><b>${esc(i.id)}</b>${i.post_time ? ` <small>${esc(i.post_time)}</small>` : ''} ${badges(i)}<br><span>${TICON[i.type] || ''} ${esc(i.type === 'task' ? i.topic.slice(0, 34) : i.type)}</span></span></div>`;
function timeline() {
  if (!calMonth) { const nx = dated().find(i => i.post_date >= S.today); const base = nx ? nx.post_date : S.today; calMonth = new Date(base.slice(0, 7) + '-01T00:00:00'); }
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, k) => new Date(y, m, 1 - off + k));
  const by = {}; dated().forEach(i => (by[i.post_date] = by[i.post_date] || []).push(i));
  const rows = cells.slice(35).some(d => d.getMonth() === m) ? 42 : 35;
  const mk = `${y}-${String(m + 1).padStart(2, '0')}`, month = dated().filter(i => i.post_date.startsWith(mk));
  const unsched = calItems().filter(i => !i.post_date && i.status !== 'posted').sort((a, b) => a.id.localeCompare(b.id));
  const clash = d => (by[d] || []).filter(isFeed).length > 1;
  $('#main').innerHTML = `
  <div class="top"><div><h1>${calMonth.toLocaleString('en', { month: 'long' })} ${y}<em>.</em></h1><div class="sub">${month.filter(isFeed).length} feed posts · ${month.length - month.filter(isFeed).length} stories & tasks · <b>drag any card to reschedule</b></div></div>
    <div style="display:flex;gap:8px"><button class="btn" data-new>+ New</button><button class="btn" id="pm">←</button><button class="btn" id="tm">Today</button><button class="btn" id="nm">→</button></div></div>
  <div class="tl">
    <div>
      <div class="cal">${DOW.map(d => `<div class="dow">${d}</div>`).join('')}
      ${cells.slice(0, rows).map(d => { const k = iso(d); return `<div class="day${d.getMonth() !== m ? ' out' : ''}${k === S.today ? ' today' : ''}${k < S.today ? ' past' : ''}${clash(k) ? ' clash' : ''}" data-drop="date:${k}">
        <div class="dh"><span class="d">${d.getDate()}</span><button class="add" data-new="${k}" title="Add on ${fmtDate(k)}">+</button></div>${(by[k] || []).map(evHTML).join('')}</div>`; }).join('')}</div>
      <div class="legend" style="margin-top:12px"><span><b class="lg ready"></b>ready</span><span><b class="lg scheduled"></b>scheduled</span><span><b class="lg posted"></b>posted (locked)</span><span><b class="lg idea"></b>idea / draft</span><span>🔒 date you set</span><span>💬 open feedback</span><span style="color:#B26A00">▮ two feed posts on one day</span></div>
    </div>
    <aside class="tray card" data-drop="unsched"><h3>Unscheduled <span class="cnt">${unsched.length}</span></h3>
      <div class="idle" style="font-size:12px;margin:-4px 0 10px">Drag ideas onto a day to schedule them. Drag a card here to unschedule it.</div>
      ${unsched.map(evHTML).join('') || '<div class="idle" style="font-size:12px">Nothing waiting.</div>'}</aside>
  </div>
  <div class="card" style="margin-top:16px"><h3>Agenda · ${calMonth.toLocaleString('en', { month: 'long' })}</h3>${month.map(i => `<div class="item" data-id="${i.id}"><span class="date">${fmtDate(i.post_date)}<br><small>${esc(i.post_time || '')}</small></span>${thumbHTML(i)}<div style="flex:1"><div class="t">${esc(i.topic)} ${badges(i)}</div><div class="m">${chip(i.status)}${i.pillar ? chip(i.pillar, 'pl') : ''}<span>${TICON[i.type] || ''} ${esc(i.type)}${isFeed(i) ? ` · Dot: ${esc(String(i.dot_pose || '–').split(/[ ,(]/)[0])} · ${esc((i.background || '–').split(/[ ,+]/)[0])}` : ''}</span></div></div></div>`).join('') || '<div class="idle">Nothing this month yet.</div>'}</div>`;
  $('#pm').onclick = () => { calMonth = new Date(y, m - 1, 1); timeline(); };
  $('#nm').onclick = () => { calMonth = new Date(y, m + 1, 1); timeline(); };
  $('#tm').onclick = () => { calMonth = null; timeline(); };
  bindItems(); bindDrag();
}

// ---------- board: drag between status columns
function board() {
  const pick = i => boardFil === 'all' || (boardFil === 'feed' ? isFeed(i) : i.type === boardFil);
  const list = calItems().filter(pick);
  const fc = v => `<button class="fchip${boardFil === v ? ' on' : ''}" data-bf="${v}">${v}</button>`;
  $('#main').innerHTML = `
  <div class="top"><div><h1>Board<em>.</em></h1><div class="sub">Drag cards between columns to change status. Claude sees every change.</div></div>
    <div style="display:flex;gap:8px;align-items:center">${['all', 'feed', 'story', 'task'].map(fc).join('')}<button class="btn" data-new>+ New</button></div></div>
  <div class="kanban">${BOARD.map(s => { const col = list.filter(i => i.status === s).sort((a, b) => key(a).localeCompare(key(b)));
    return `<div class="col" data-drop="status:${s}"><div class="colh">${chip(s)}<span class="cnt">${col.length}</span></div>
      ${col.map(i => `<div class="kc" data-id="${i.id}" draggable="true">${thumbHTML(i, 'kthumb')}<div class="kb"><div class="m"><b>${esc(i.id)}</b> · ${TICON[i.type] || ''} ${esc(i.type)} ${badges(i)}</div><div class="t">${esc(i.topic)}</div><div class="m">${i.post_date ? fmtDate(i.post_date) + (i.post_time ? ' · ' + esc(i.post_time) : '') : '<i>unscheduled</i>'}</div></div></div>`).join('')}</div>`; }).join('')}</div>`;
  $$('[data-bf]').forEach(b => b.onclick = () => { boardFil = b.dataset.bf; board(); });
  bindItems(); bindDrag();
}

// ---------- library
function library() {
  const list = items().filter(i => (fil.status === 'all' || i.status === fil.status) && (fil.pillar === 'all' || i.pillar === fil.pillar) && (fil.type === 'all' || i.type === fil.type) &&
    (!fil.q || JSON.stringify([i.id, i.topic, i.hook, i.angle, i.keywords, i.caption]).toLowerCase().includes(fil.q.toLowerCase())))
    .sort((a, b) => (b.post_date || '').localeCompare(a.post_date || ''));
  const fc = (k, v) => `<button class="fchip${fil[k] === v ? ' on' : ''}" data-k="${k}" data-v="${v}">${v}</button>`;
  $('#main').innerHTML = `
  <div class="top"><div><h1>Library<em>.</em></h1><div class="sub">Everything made so far. Claude reads this before creating anything, so nothing repeats.</div></div>
    <div style="display:flex;gap:8px"><input class="search" id="q" placeholder="Search topic, hook, caption…" value="${esc(fil.q)}"><button class="btn" data-new>+ New</button></div></div>
  <div class="filters">${['all', ...STATUSES].map(s => fc('status', s)).join('')}</div>
  <div class="filters">${['all', ...TYPES, 'brand-asset'].map(s => fc('type', s)).join('')}<span style="width:12px"></span>${['all', ...PILLARS].map(p => fc('pillar', p)).join('')}</div>
  <div class="cards">${list.map(i => { const f = firstMedia(i);
    return `<div class="lc" data-id="${i.id}"><div class="img" style="${f && !isVid(f) ? `background-image:url('${url(f)}')` : ''}">${isVid(f) ? `<video src="${url(f)}#t=6" poster="${poster(f)}" muted preload="metadata"></video>` : ''}${!f ? `<div class="empty">${TICON[i.type] || ''}<br>not made yet</div>` : ''}<span class="kind">${esc(i.type)}${(i.files || []).length > 1 ? ' · ' + i.files.length : ''}</span></div>
      <div class="b"><div style="display:flex;gap:6px;flex-wrap:wrap">${chip(i.status)}${i.pillar ? chip(i.pillar, 'pl') : ''}${badges(i)}</div><div class="t">${esc(i.topic)}</div><div class="h">${esc(i.hook || i.angle || i.notes)}</div>
      <div class="m" style="font-size:11px;color:var(--mute);margin-top:8px;font-family:'JetBrains Mono'">${esc(i.id)} · ${i.post_date ? fmtDate(i.post_date) : 'no date'}</div></div></div>`; }).join('')}</div>`;
  $$('.fchip').forEach(b => b.onclick = () => { fil[b.dataset.k] = b.dataset.v; library(); });
  $('#q').oninput = e => { fil.q = e.target.value; const pos = e.target.selectionStart; library(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); };
  bindItems();
}

// ---------- grid preview (feed only)
function grid() {
  const g = dated().filter(i => isFeed(i) && firstMedia(i)).reverse();
  $('#main').innerHTML = `
  <div class="top"><div><h1>Grid preview<em>.</em></h1><div class="sub">How the profile grid will look, newest first, with planned posts included. Reschedule on the Timeline and this updates. Profile grids crop posts to 3:4.</div></div></div>
  <div class="phonebox"><div class="ig">
    <div class="hd"><div style="width:76px;height:76px;border-radius:50%;overflow:hidden;flex:none">${iconV({ sz: 76, circle: true })}</div>
      <div><div class="nm">vaultpro.cloud</div><div class="bio"><b>Vault</b><br>Club management for Rotaract clubs 🇱🇰<br>Treasury · Events · Members · Reports<br>Meet Dot, our tiny vault-bot 🤖</div></div></div>
    <div class="igg">${g.map(i => { const f = firstMedia(i); return `<div data-id="${i.id}" style="${isVid(f) ? '' : `background-image:url('${url(f)}')`}">${isVid(f) ? `<video src="${url(f)}#t=6" poster="${poster(f)}" muted preload="metadata"></video>` : ''}${i.status !== 'posted' ? `<span class="pl8">${esc(fmtDate(i.post_date))}</span>` : ''}</div>`; }).join('')}</div>
  </div>
  <div class="card" style="max-width:360px"><h3>Grid rules</h3><div style="line-height:1.7">• Never three of the same background in a row<br>• Rose backgrounds for covers only<br>• Mix Dot poses; don't repeat within 3 posts<br>• Pin: Meet Dot → Carousel → Demo CTA</div></div></div>`;
  bindItems();
}

// ---------- live
function live() {
  $('#main').innerHTML = `
  <div class="top"><div><h1>Live studio<em>.</em></h1><div class="sub">Watch Claude work: every step, render and library change appears here as it happens.</div></div></div>
  <div class="card" id="now" style="margin-bottom:16px"></div>
  <div class="live">
    <div class="card stream"><h3>Activity</h3><div id="acts">${S.activity.slice(-150).reverse().map(a => actRow(a)).join('') || '<div class="idle">Waiting for activity…</div>'}</div></div>
    <div class="card"><h3>Latest renders</h3><div class="mosaic" id="mosaic">${S.media.slice(0, 60).map(m => tile(m)).join('')}</div></div>
  </div>`;
  renderNow(); bindTiles();
}
function renderNow() {
  const box = $('#now'); if (!box) return;
  const last = S.activity[S.activity.length - 1], working = last && last.by !== 'user' && (Date.now() - new Date(last.ts)) < 90000;
  box.innerHTML = `<div class="nowbox"><div style="width:64px;flex:none">${pose(working ? 'thinking' : 'happy', 64, { noShadow: true })}</div><div style="flex:1">
    <div style="font-weight:800;font-size:16px">${working ? 'Claude is working…' : 'Idle'}</div><div class="idle" style="margin-top:2px">${last ? esc(last.msg) + ' · ' + hh(last.ts) : 'No activity yet. Start a Claude session in this folder.'}</div>
    ${reel && reel.total ? `<div class="prog"><div style="width:${Math.round(reel.progress / reel.total * 100)}%"></div></div><div class="idle" style="font-size:12px;margin-top:4px">Reel frames ${reel.progress}/${reel.total}</div>` : ''}</div></div>`;
}
const tile = (m, fresh) => `<div class="mz${fresh ? ' new' : ''}" data-f="${esc(m.file)}">${isVid(m.file) ? `<video src="${url(m.file)}" poster="${poster(m.file)}" muted preload="metadata"></video>` : `<img loading="lazy" src="${url(m.file)}?v=${m.mtime}">`}<span>${esc(m.file.replace(/^(out|assets)\//, ''))}</span></div>`;
function addTile(m, fresh) { const mz = $('#mosaic'); if (!mz) return; mz.querySelector(`[data-f="${CSS.escape(m.file)}"]`)?.remove(); mz.insertAdjacentHTML('afterbegin', tile(m, fresh)); bindTiles(); }
function addActivityRow(a, fresh) { const el = $('#acts'); if (!el) return; if (el.querySelector('.idle')) el.innerHTML = ''; el.insertAdjacentHTML('afterbegin', actRow(a, fresh)); }
function bindTiles() { $$('.mz').forEach(t => t.onclick = () => lightbox(t.dataset.f)); }
function lightbox(f) { const d = document.createElement('div'); d.className = 'lightbox'; d.innerHTML = isVid(f) ? `<video src="${url(f)}" controls autoplay></video>` : `<img src="${url(f)}">`; d.onclick = e => { if (e.target === d || e.target.tagName === 'IMG') d.remove(); }; document.body.appendChild(d); }

// ---------- ideas
function ideas() {
  const md = S.docs.ideas || ''; const secs = []; let cur = null;
  md.split('\n').forEach(l => { const h = l.match(/^##\s+(.*)/); if (h) { cur = { t: h[1], items: [] }; secs.push(cur); return; }
    const it = l.match(/^- \[( |x[^\]]*)\]\s+(.*)/); if (it && cur) cur.items.push({ done: it[1] !== ' ', ref: it[1].replace(/^x\s*→?\s*/, ''), text: it[2] }); });
  const open = secs.reduce((a, s) => a + s.items.filter(i => !i.done).length, 0);
  $('#main').innerHTML = `<div class="top"><div><h1>Idea bank<em>.</em></h1><div class="sub">${open} unused ideas · click one to turn it into an unscheduled card, then drag it onto the calendar. Claude ticks ideas off when it uses them.</div></div></div>
  <div class="ideas">${secs.map(s => `<div class="card"><h3>${esc(s.t)}</h3>${s.items.map(i => `<div class="idea${i.done ? ' done' : ''}" ${i.done ? '' : `data-idea="${esc(i.text.replace(/\*\*/g, ''))}" data-sec="${esc(s.t)}" title="Click to add to Unscheduled"`}><span class="bx"></span><span>${esc(i.text.replace(/\*\*/g, ''))}${i.ref ? ` <b style="color:var(--teal)">${esc(i.ref)}</b>` : ''}</span></div>`).join('')}</div>`).join('')}</div>`;
  $$('[data-idea]').forEach(el => el.onclick = () => {
    const text = el.dataset.idea, sec = el.dataset.sec.toLowerCase(), t = text.split(/\.\s/)[0].replace(/⚑/g, '').trim();
    const type = /carousel/i.test(text) ? 'carousel' : /\breel\b/i.test(text) ? 'reel' : /\bstor(y|ies)\b/i.test(text) ? 'story' : 'post';
    const pillar = sec.includes('tips') ? 'tips' : sec.includes('product') ? 'product' : sec.includes('problem') ? 'problem' : sec.includes('community') ? 'community' : '';
    newModal({ topic: t.slice(0, 120), type, pillar, notes: 'From idea bank: ' + text });
  });
}

// ---------- new item modal
function newModal(pre = {}) {
  const d = document.createElement('div'); d.className = 'modal-bg';
  d.innerHTML = `<form class="modal card"><h2 style="margin:0 0 4px">New ${pre.post_date ? 'item on ' + fmtDate(pre.post_date) : 'item'}</h2><div class="idle" style="margin-bottom:14px">Creates a card in the library. Ask Claude to make it, or drag it onto the calendar.</div>
    <label class="fld">Topic<input name="topic" required value="${esc(pre.topic || '')}" placeholder="e.g. Dot's Tip: keep every receipt"></label>
    <div class="grid2"><label class="fld">Type<select name="type">${TYPES.map(t => `<option${t === (pre.type || 'post') ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="fld">Pillar<select name="pillar"><option value="">–</option>${PILLARS.map(p => `<option${p === pre.pillar ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
    <label class="fld">Date<input type="date" name="post_date" value="${esc(pre.post_date || '')}"></label>
    <label class="fld">Time<input type="time" name="post_time" value="${esc(pre.post_time || '19:30')}"></label></div>
    <label class="fld">Notes for Claude<textarea name="notes" style="min-height:80px" placeholder="Angle, must-haves, deadline…">${esc(pre.notes || '')}</textarea></label>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn pri" type="submit">Create</button><button class="btn" type="button" data-x>Cancel</button></div></form>`;
  document.body.appendChild(d); d.querySelector('[name=topic]').focus();
  d.onclick = e => { if (e.target === d || e.target.hasAttribute('data-x')) d.remove(); };
  d.querySelector('form').onsubmit = async e => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target));
    try { const r = await api('/api/item', fd); upsert(r.item); d.remove(); render(true); openItem(r.item.id); toast(`<div><b>${esc(r.item.id)}</b> created</div>`); }
    catch (err) { alert(err.message); } };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-new]'); if (b) { e.stopPropagation(); newModal(b.dataset.new ? { post_date: b.dataset.new } : {}); } }, true);

// ---------- item drawer: details, reschedule, status, feedback to Claude, caption, metrics
function bindItems() { $$('[data-id]').forEach(el => el.addEventListener('click', () => openItem(el.dataset.id))); }
let drawerId = null;
function refreshDrawer() { if (drawerId && !$('#drawer').hidden && !$('#drawer').contains(document.activeElement)) openItem(drawerId); }
function openItem(id) {
  const i = items().find(x => x.id === id); if (!i) return; drawerId = id;
  const tags = (S.library.hashtag_sets || {})[i.hashtag_set] || '';
  const dr = $('#drawer'); dr.hidden = false;
  const fbs = (i.feedback || []).map((f, n) => `<div class="fbm ${f.by === 'user' ? 'you' : 'cl'}${f.resolved ? ' done' : ''}"><div class="fbh">${f.by === 'user' ? 'You' : 'Claude'} · ${new Date(f.ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${f.resolved ? ' · ✓ resolved' : ` · <a href="#" data-res="${n}">mark resolved</a>`}</div><div>${esc(f.text)}</div>${f.reply ? `<div class="fbr">↳ ${esc(f.reply)}</div>` : ''}</div>`).join('');
  dr.innerHTML = `<button class="btn x" id="dx">✕</button>
  <div style="display:flex;gap:6px;flex-wrap:wrap">${chip(i.status)}${i.pillar ? chip(i.pillar, 'pl') : ''}<span class="chip">${TICON[i.type] || ''} ${esc(i.type)}</span><span class="chip">${esc(i.id)}</span>${badges(i)}</div>
  <h2>${esc(i.topic)}</h2><div class="idle">${i.post_date ? fmtDate(i.post_date) + (i.post_time ? ' · ' + esc(i.post_time) : '') : 'Unscheduled'}${i.date_locked ? ' · 🔒 you set this date' : ''}</div>
  <div class="media">${(i.files || []).filter(f => /\.(png|jpe?g|webp|mp4)$/i.test(f)).map(f => isVid(f) ? `<video src="${url(f)}" poster="${poster(f)}" controls preload="metadata"></video>` : `<img src="${url(f)}" data-f="${esc(f)}" style="cursor:zoom-in">`).join('') || '<div class="idle">No files yet. Ask Claude to make it.</div>'}</div>
  ${isFeed(i) ? `<dl class="kv"><dt>Hook</dt><dd>${esc(i.hook)}</dd><dt>Angle</dt><dd>${esc(i.angle)}</dd><dt>Dot</dt><dd>${esc(i.dot_pose)}</dd><dt>Background</dt><dd>${esc(i.background)}</dd><dt>Layout</dt><dd>${esc(i.layout)}</dd></dl>` : ''}
  ${i.notes ? `<div class="note">${esc(i.notes)}</div>` : ''}
  <div class="sec"><div class="fld" style="margin-bottom:8px">Feedback for Claude ${openFb(i) ? `<span class="bdg fb">💬${openFb(i)} open</span>` : ''}</div>${fbs}
    <textarea id="fbt" style="min-height:70px" placeholder="e.g. Make the headline shorter, use the coin pose, move Dot left…"></textarea>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="btn pri" id="fbs">Send to Claude</button><span class="idle" style="font-size:12px">Claude picks this up at the start of its next task.</span></div></div>
  <div class="sec" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
    <label class="fld">Status<select id="st">${STATUSES.map(s => `<option${s === i.status ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
    <label class="fld">Date<input type="date" id="pd" value="${esc(i.post_date)}"></label>
    <label class="fld">Time<input type="time" id="pt" value="${esc(i.post_time)}"></label></div>
  ${i.type !== 'task' ? `<div class="sec"><label class="fld">Caption<textarea id="cap">${esc(i.caption)}</textarea></label>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="btn" id="cp">Copy caption + hashtags</button><span class="idle" style="font-size:12px">Set ${esc(i.hashtag_set || '–')}: ${esc(tags)}</span></div></div>` : ''}
  ${isFeed(i) ? `<div class="sec"><div class="fld" style="margin-bottom:6px">Metrics (enter 3–7 days after posting)</div><div class="metrics">${METRICS.map(k => `<label class="fld" style="font-weight:600">${k.replace('_', ' ')}<input type="number" min="0" data-m="${k}" value="${(i.metrics || {})[k] ?? ''}"></label>`).join('')}</div></div>` : ''}
  <div class="sec" style="display:flex;gap:8px"><button class="btn pri" id="sv">Save changes</button><button class="btn" id="dc">Close</button></div>`;
  const close = () => { dr.hidden = true; drawerId = null; };
  $('#dx').onclick = $('#dc').onclick = close;
  dr.querySelectorAll('.media img').forEach(im => im.onclick = () => lightbox(im.dataset.f));
  if ($('#cp')) $('#cp').onclick = async () => { await navigator.clipboard.writeText($('#cap').value + (tags ? '\n.\n' + tags : '')); $('#cp').textContent = 'Copied ✓'; setTimeout(() => $('#cp') && ($('#cp').textContent = 'Copy caption + hashtags'), 1500); };
  $('#fbs').onclick = async () => { const text = $('#fbt').value.trim(); if (!text) return;
    try { const r = await api(`/api/item/${id}/feedback`, { text }); upsert(r.item); openItem(id); render(true); toast(`<div>Sent to Claude: <b>${esc(id)}</b></div>`); } catch (e) { alert(e.message); } };
  dr.querySelectorAll('[data-res]').forEach(a => a.onclick = async e => { e.preventDefault(); const r = await api(`/api/item/${id}`, { resolve: +a.dataset.res }); upsert(r.item); openItem(id); render(true); });
  $('#sv').onclick = async () => {
    const body = { status: $('#st').value, post_time: $('#pt').value };
    if ($('#pd').value !== (i.post_date || '')) body.post_date = $('#pd').value;
    if ($('#cap')) body.caption = $('#cap').value;
    const metrics = {}; dr.querySelectorAll('[data-m]').forEach(x => { if (x.value !== '') metrics[x.dataset.m] = x.value; }); if (Object.keys(metrics).length) body.metrics = metrics;
    try { const r = await api('/api/item/' + id, body); upsert(r.item); render(true); openItem(id); $('#sv').textContent = 'Saved ✓';
      if (r.warnings.length) toast(`<div>${r.warnings.map(w => '⚠ ' + esc(w.msg)).join('<br>')}</div>`, { warn: true, ms: 9000 }); }
    catch (e) { alert('Save failed: ' + e.message); }
  };
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#drawer').hidden = true; drawerId = null; document.querySelector('.lightbox')?.remove(); document.querySelector('.modal-bg')?.remove(); } });

load().then(connect);
