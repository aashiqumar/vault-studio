// Shared content-ledger logic for library.cjs (CLI) and studio.cjs (dashboard server).
// The library (content/library.json) is the single source of truth; content/calendar.md is generated from it on every save.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'content/library.json'), CAL = path.join(ROOT, 'content/calendar.md');

const FEED_TYPES = ['post', 'carousel', 'reel', 'graphic'];      // appear on the Instagram grid
const OTHER_TYPES = ['story', 'task'];                              // on the calendar, not the grid
const STATUSES = ['idea', 'draft', 'ready', 'scheduled', 'posted', 'retired'];
const isFeed = i => FEED_TYPES.includes(i.type);
const onCalendar = i => i.type !== 'brand-asset' && i.status !== 'retired';

const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };  // local date
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
const weekday = iso => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso + 'T00:00:00Z').getUTCDay()];
const fmt = iso => { const d = new Date(iso + 'T00:00:00Z'); return `${weekday(iso)} ${d.getUTCDate()} ${d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}`; };
const sortKey = i => (i.post_date || '9999-99-99') + ' ' + (i.post_time || '99:99');
const byDate = (a, b) => sortKey(a).localeCompare(sortKey(b));

const STOP = new Set('the a an and or of to for in on your you is are with how why what vault club clubs dot tip'.split(' '));
const words = s => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
const sim = (a, b) => { const inter = [...a].filter(x => b.has(x)).length; return inter / Math.max(1, Math.min(a.size, b.size)); };
const sig = i => new Set([...words(i.topic), ...words(i.angle), ...(i.keywords || []).flatMap(k => [...words(k)])]);
const bg0 = i => String(i.background || '').split(/[ ,+]/)[0];

function load() { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
function save(lib) { fs.writeFileSync(FILE, JSON.stringify(lib, null, 2) + '\n'); writeCalendar(lib); }

const liveFeed = lib => lib.items.filter(i => isFeed(i) && ['ready', 'scheduled', 'posted'].includes(i.status) && i.post_date).sort(byDate);
const datedFeed = lib => lib.items.filter(i => isFeed(i) && i.status !== 'retired' && i.post_date).sort(byDate);

// Every warning names the ids it concerns, so the dashboard can show the ones relevant to a moved item.
function warnings(lib) {
  const w = [], live = liveFeed(lib), dated = datedFeed(lib), t = today();
  for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) {
    const A = live[a], B = live[b], d = days(A.post_date, B.post_date);
    if (d <= 42 && A.type !== 'reel' && B.type !== 'reel' && sim(sig(A), sig(B)) >= 0.4)
      w.push({ ids: [A.id, B.id], kind: 'overlap', msg: `Topic overlap: ${A.id} (${fmt(A.post_date)}) and ${B.id} (${fmt(B.post_date)}) are ${d} days apart` });
  }
  for (let k = 2; k < live.length; k++) {
    const trio = live.slice(k - 2, k + 1);
    if (bg0(trio[0]) && trio.every(x => bg0(x) === bg0(trio[0]))) w.push({ ids: trio.map(x => x.id), kind: 'grid', msg: `Grid: 3 ${bg0(trio[0])} backgrounds in a row (${trio.map(x => x.id).join(', ')})` });
  }
  const perDay = {}; dated.forEach(i => (perDay[i.post_date] = perDay[i.post_date] || []).push(i));
  for (const [d, list] of Object.entries(perDay)) if (list.length > 1) w.push({ ids: list.map(x => x.id), kind: 'clash', msg: `${list.length} feed posts on ${fmt(d)} (${list.map(x => x.id).join(', ')}). Spread them out` });
  lib.items.filter(i => onCalendar(i) && ['idea', 'draft'].includes(i.status) && i.post_date && i.type !== 'task').forEach(i => {
    const d = days(t, i.post_date); if (d >= 0 && d <= 7) w.push({ ids: [i.id], kind: 'due', msg: `${i.id} is due ${fmt(i.post_date)} but is still ${i.status}` });
  });
  lib.items.filter(i => (i.feedback || []).some(f => !f.resolved)).forEach(i => w.push({ ids: [i.id], kind: 'feedback', msg: `${i.id} has open feedback: "${i.feedback.filter(f => !f.resolved).slice(-1)[0].text.slice(0, 70)}"` }));
  lib.items.filter(i => onCalendar(i) && /CLAIMS/i.test(i.notes || '') && i.status !== 'posted').forEach(i => w.push({ ids: [i.id], kind: 'claims', msg: `${i.id}: check product claims before posting` }));
  return w;
}

function nextId(lib, prefix = 'N') {
  const n = Math.max(0, ...lib.items.filter(i => i.id.startsWith(prefix)).map(i => +i.id.slice(prefix.length) || 0)) + 1;
  return prefix + String(n).padStart(3, '0');
}
function newItem(lib, e) {
  if (!e.type || !e.topic) throw new Error('type and topic are required');
  const prefix = e.type === 'story' ? 'S' : e.type === 'task' ? 'T' : 'N';
  const it = Object.assign({ id: e.id || nextId(lib, prefix), type: e.type, pillar: '', topic: '', angle: '', hook: '', keywords: [], dot_pose: '', background: '', layout: '',
    hashtag_set: '', status: 'idea', post_date: '', post_time: isFeed(e) ? '19:30' : '', files: [], caption: '', notes: '', feedback: [], metrics: {} }, e);
  if (lib.items.some(i => i.id === it.id)) throw new Error('id exists: ' + it.id);
  if (!STATUSES.includes(it.status)) throw new Error('bad status: ' + it.status);
  lib.items.push(it); return it;
}
// by = 'user' (dashboard drag) locks the date so Claude won't silently move it later.
function move(lib, id, date, time, by) {
  const it = lib.items.find(i => i.id === id); if (!it) throw new Error('no item ' + id);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');
  if (time && !/^\d{2}:\d{2}$/.test(time)) throw new Error('time must be HH:MM');
  const from = it.post_date || '';
  it.post_date = date || '';
  if (time !== undefined && time !== null) it.post_time = time;
  if (by === 'user') it.date_locked = !!date;
  if (!date && it.status === 'scheduled') it.status = 'ready';
  return { item: it, from };
}

function writeCalendar(lib) {
  const items = lib.items.filter(i => onCalendar(i));
  const dated = items.filter(i => i.post_date).sort(byDate), undated = items.filter(i => !i.post_date && i.status !== 'posted');
  const months = {}; dated.forEach(i => (months[i.post_date.slice(0, 7)] = months[i.post_date.slice(0, 7)] || []).push(i));
  let md = `# Posting calendar\n\n> **Generated from \`content/library.json\`. Don't edit this file by hand.** Reschedule by dragging items in the dashboard (\`npm run studio\` → Timeline), or run \`node scripts/library.cjs move <id> <YYYY-MM-DD> [HH:MM]\`. 🔒 = date set by the user; ask before changing it.\n`;
  for (const [m, list] of Object.entries(months)) {
    const title = new Date(m + '-01T00:00:00Z').toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    md += `\n## ${title}\n| Date | Day | Time | Item | Type | Status | ID |\n|---|---|---|---|---|---|---|\n`;
    for (const i of list) md += `| ${i.post_date.slice(8)} ${new Date(i.post_date + 'T00:00:00Z').toLocaleString('en', { month: 'short', timeZone: 'UTC' })} | ${weekday(i.post_date)} | ${i.post_time || ''} | ${String(i.topic).replace(/\|/g, '/')}${(i.feedback || []).some(f => !f.resolved) ? ' 💬' : ''} | ${i.type} | ${i.status} | ${i.id}${i.date_locked ? ' 🔒' : ''} |\n`;
  }
  if (undated.length) { md += `\n## Unscheduled\n`; undated.forEach(i => md += `- ${i.id} · ${i.type} · ${i.status} · ${i.topic}\n`); }
  fs.writeFileSync(CAL, md);
}

module.exports = { ROOT, FILE, FEED_TYPES, OTHER_TYPES, STATUSES, isFeed, onCalendar, today, days, weekday, fmt, byDate, words, sim, sig, bg0,
  load, save, liveFeed, datedFeed, warnings, nextId, newItem, move, writeCalendar };
