// Vault content ledger CLI: memory of everything made, so new work stays fresh.
//   node scripts/library.cjs status                         # what exists, what's next, what was used recently, warnings
//   node scripts/library.cjs check --topic "..." [--keywords a,b] [--pose x] [--bg y] [--pillar p] [--date YYYY-MM-DD]
//   node scripts/library.cjs add '<json>'  |  add path/to/entry.json      # append (id auto-assigned if missing)
//   node scripts/library.cjs set <id> status=posted post_date=2026-10-19 metrics.saves=42 files=a.png,b.png
//   node scripts/library.cjs grid [out/grid.jpg]            # Instagram grid preview of posted + scheduled items
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), FILE = path.join(ROOT, 'content/library.json');
const { log } = require('./log.cjs');
const lib = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save = () => fs.writeFileSync(FILE, JSON.stringify(lib, null, 2) + '\n');
const items = lib.items;
const feed = items.filter(i => i.type !== 'brand-asset');
const live = feed.filter(i => ['ready', 'scheduled', 'posted'].includes(i.status) && i.post_date);
const byDate = [...live].sort((a, b) => a.post_date.localeCompare(b.post_date));
const today = new Date().toISOString().slice(0, 10);
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const STOP = new Set('the a an and or of to for in on your you is are with how why what vault club clubs dot tip'.split(' '));
const words = s => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
const sim = (a, b) => { const A = new Set([...a]), B = new Set([...b]); const inter = [...A].filter(x => B.has(x)).length; return inter / Math.max(1, Math.min(A.size, B.size)); };
const sig = i => new Set([...words(i.topic), ...words(i.angle), ...(i.keywords || []).flatMap(k => [...words(k)])]);
const TARGET = { tips: .35, product: .30, problem: .10, community: .15, brand: .05, conversion: .05 };
const args = process.argv.slice(2), cmd = args.shift();
const flag = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : ''; };

function warnings() {
  const w = [];
  for (let i = 0; i < byDate.length; i++) for (let j = i + 1; j < byDate.length; j++) {
    const a = byDate[i], b = byDate[j], d = days(a.post_date, b.post_date);
    if (d <= 42 && sim(sig(a), sig(b)) >= 0.4 && !(a.type === 'reel' || b.type === 'reel'))
      w.push(`Topic overlap: ${a.id} (${a.post_date}) and ${b.id} (${b.post_date}), ${d} days apart: "${a.topic}" / "${b.topic}"`);
  }
  for (let i = 2; i < byDate.length; i++) {
    const bg = byDate.slice(i - 2, i + 1).map(x => x.background.split(/[ ,+]/)[0]);
    if (bg[0] && bg.every(x => x === bg[0])) w.push(`Grid: 3 ${bg[0]} backgrounds in a row ending ${byDate[i].id}`);
  }
  return w;
}

if (cmd === 'status' || !cmd) {
  const count = s => feed.filter(i => i.status === s).length;
  console.log(`VAULT CONTENT LIBRARY: ${feed.length} feed items (posted ${count('posted')}, scheduled ${count('scheduled')}, ready ${count('ready')}, draft ${count('draft')}, ideas ${count('idea')})  · today ${today}`);
  console.log('\nTIMELINE (date · id · pillar · type · topic · Dot · bg · status)');
  for (const i of byDate) console.log(`  ${i.post_date} ${i.post_date < today ? ' ' : '›'} ${i.id.padEnd(4)} ${i.pillar.padEnd(10)} ${i.type.padEnd(8)} ${i.topic.slice(0, 58).padEnd(58)} · ${String(i.dot_pose).split(/[ ,(]/)[0].padEnd(10)} · ${i.background.split(/[ ,+]/)[0].padEnd(5)} · ${i.status}`);
  const ideas = feed.filter(i => i.status === 'idea');
  if (ideas.length) { console.log('\nNOT MADE YET'); ideas.forEach(i => console.log(`  ${i.id} ${i.post_date || '(no date)'} ${i.topic}: ${i.notes}`)); }
  const last = byDate.slice(-6);
  console.log('\nRECENTLY USED (avoid repeating in the next 3 posts)');
  console.log('  Dot poses:  ' + last.map(i => String(i.dot_pose).split(/[ ,(]/)[0]).join(', '));
  console.log('  Backgrounds: ' + last.map(i => i.background.split(/[ ,+]/)[0]).join(', '));
  console.log('  Hooks:      ' + last.map(i => `"${(i.hook || '').slice(0, 40)}"`).join(' | '));
  const mix = {}; byDate.slice(-12).forEach(i => mix[i.pillar] = (mix[i.pillar] || 0) + 1);
  const n = Math.min(12, byDate.length) || 1;
  console.log('\nPILLAR MIX (last 12 vs target): ' + Object.keys(TARGET).map(p => `${p} ${Math.round((mix[p] || 0) / n * 100)}%/${TARGET[p] * 100}%`).join(' · '));
  const posted = feed.filter(i => i.metrics && Object.keys(i.metrics).length);
  if (posted.length) { console.log('\nTOP BY SAVES+SHARES'); posted.sort((a, b) => ((b.metrics.saves || 0) + (b.metrics.shares || 0)) - ((a.metrics.saves || 0) + (a.metrics.shares || 0))).slice(0, 5).forEach(i => console.log(`  ${i.id} ${i.topic.slice(0, 50)} saves ${i.metrics.saves || 0} shares ${i.metrics.shares || 0} reach ${i.metrics.reach || 0}`)); }
  const w = warnings(); if (w.length) { console.log('\nWARNINGS'); w.forEach(x => console.log('  ! ' + x)); }
  console.log('\nRules: run `check` before designing anything new; `add`/`set` after. Ideas bank: content/ideas.md');
}
else if (cmd === 'check') {
  const cand = { topic: flag('topic'), angle: flag('angle'), keywords: (flag('keywords') || '').split(',').filter(Boolean) };
  const S = sig(cand), date = flag('date') || today, pose = flag('pose'), bg = flag('bg'), pillar = flag('pillar');
  let bad = 0;
  for (const i of feed) {
    const s = sim(S, sig(i)); if (s < 0.4) continue;
    const d = i.post_date ? Math.abs(days(i.post_date, date)) : null;
    const level = s >= 0.6 && (d === null || d <= 42) ? 'REPEAT' : 'similar';
    if (level === 'REPEAT') bad++;
    console.log(`${level.padEnd(7)} ${i.id} (${i.post_date || 'no date'}, ${d ?? '?'}d away, overlap ${Math.round(s * 100)}%): ${i.topic}`);
  }
  const near = byDate.filter(i => i.post_date <= date).slice(-3);
  if (pose && near.some(i => String(i.dot_pose).includes(pose))) { bad++; console.log(`POSE    "${pose}" used in the last 3 posts (${near.map(i => i.id + ':' + String(i.dot_pose).split(/[ ,(]/)[0]).join(', ')})`); }
  if (bg && near.slice(-2).every(i => i.background.startsWith(bg))) { bad++; console.log(`BG      "${bg}" would make 3 in a row on the grid`); }
  if (pillar) { const mix = byDate.slice(-12).filter(i => i.pillar === pillar).length / Math.max(1, Math.min(12, byDate.length)); if (TARGET[pillar] && mix > TARGET[pillar] + .1) console.log(`PILLAR  ${pillar} is already ${Math.round(mix * 100)}% of the last 12 (target ${TARGET[pillar] * 100}%)`); }
  log('check', `Freshness check "${cand.topic}": ${bad ? bad + ' problem(s)' : 'fresh'}`);
  console.log(bad ? `\n✗ ${bad} freshness problem(s): change the angle, pose or background, or justify it in notes.` : '\n✓ Fresh: no repeats found.');
  process.exit(bad ? 2 : 0);
}
else if (cmd === 'add') {
  const src = args[0]; const e = JSON.parse(fs.existsSync(src) ? fs.readFileSync(src, 'utf8') : src);
  for (const k of ['type', 'pillar', 'topic', 'status']) if (!e[k]) { console.error('missing field: ' + k); process.exit(1); }
  if (!e.id) { const n = items.filter(i => /^N\d+$/.test(i.id)).length + 1; e.id = 'N' + String(n).padStart(3, '0'); }
  if (items.some(i => i.id === e.id)) { console.error('id exists: ' + e.id); process.exit(1); }
  items.push(Object.assign({ angle: '', hook: '', keywords: [], dot_pose: '', background: '', layout: '', hashtag_set: '', post_date: '', files: [], caption: '', notes: '', metrics: {} }, e));
  save(); log('library', `Added ${e.id}: ${e.topic}`, { id: e.id }); console.log('added ' + e.id);
}
else if (cmd === 'set') {
  const id = args.shift(), it = items.find(i => i.id === id); if (!it) { console.error('no item ' + id); process.exit(1); }
  for (const kv of args) { const [k, ...v] = kv.split('='); const val = isNaN(+v.join('=')) || v.join('=') === '' ? v.join('=') : +v.join('=');
    if (k.startsWith('metrics.')) { it.metrics = it.metrics || {}; it.metrics[k.slice(8)] = val; }
    else if (k === 'files' || k === 'keywords') it[k] = v.join('=').split(',').map(x => x.trim()).filter(Boolean);
    else it[k] = String(val); }
  save(); log('library', `Updated ${id}: ${args.join(' ')}`, { id }); console.log('updated ' + id);
}
else if (cmd === 'grid') {
  const out = args[0] || 'out/grid.jpg';
  const tiles = [...byDate].reverse().map(i => ({ i, f: (i.files || []).find(f => /\.(png|jpe?g)$/i.test(f)) })).filter(t => t.f && fs.existsSync(path.join(ROOT, t.f)));
  const { chromium } = require('playwright');
  (async () => {
    const tmp = path.join(ROOT, 'out', '.grid.html'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, `<html><body style="margin:0;background:#fff;font:12px sans-serif"><div id="g" style="display:grid;grid-template-columns:repeat(3,300px);gap:3px;padding:3px">${tiles.map(t => `<div style="position:relative;width:300px;height:400px;overflow:hidden"><img src="file://${path.join(ROOT, t.f)}" style="width:100%;height:100%;object-fit:cover"><span style="position:absolute;left:4px;top:4px;background:#000a;color:#fff;padding:2px 5px">${t.i.post_date} ${t.i.id}</span></div>`).join('')}</div></body></html>`);
    const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
    const p = await b.newPage({ viewport: { width: 915, height: 800 } });
    await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.locator('#g').screenshot({ path: out, type: 'jpeg', quality: 85 });
    fs.rmSync(tmp); await b.close(); console.log('wrote ' + out + ' (newest first, 3:4 grid crop)');
  })();
}
else { console.error('commands: status | check | add | set | grid'); process.exit(1); }
