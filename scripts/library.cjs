// Vault content ledger CLI: memory of everything made, so new work stays fresh.
//   node scripts/library.cjs status                         # what exists, what's next, open feedback, warnings
//   node scripts/library.cjs check --topic "..." [--keywords a,b] [--pose x] [--bg y] [--pillar p] [--date YYYY-MM-DD]
//   node scripts/library.cjs add '<json>'  |  add path/to/entry.json      # append (id auto-assigned if missing)
//   node scripts/library.cjs set <id> status=ready metrics.saves=42 files=a.png,b.png
//   node scripts/library.cjs move <id> <YYYY-MM-DD|none> [HH:MM] [--force]   # reschedule (respects 🔒 user-set dates)
//   node scripts/library.cjs feedback <id> "note"           # leave a note on an item
//   node scripts/library.cjs resolve <id> <n|all> "what you changed"        # close the user's feedback with a reply
//   node scripts/library.cjs calendar                        # regenerate content/calendar.md
//   node scripts/library.cjs grid [out/grid.jpg]            # Instagram grid preview of posted + scheduled items
const fs = require('fs'), path = require('path');
const L = require('./ledger.cjs');
const { log } = require('./log.cjs');
const lib = L.load(), items = lib.items;
const TARGET = lib.pillar_targets || { tips: .35, product: .30, community: .15, problem: .10, brand: .05, conversion: .05 };
const feed = items.filter(L.isFeed), live = L.liveFeed(lib), t = L.today();
const args = process.argv.slice(2), cmd = args.shift();
const flag = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : ''; };
const force = args.includes('--force');
const find = id => { const it = items.find(i => i.id === id); if (!it) { console.error('no item ' + id); process.exit(1); } return it; };
const pose0 = i => String(i.dot_pose || '').split(/[ ,(]/)[0];

if (cmd === 'status' || !cmd) {
  const count = s => feed.filter(i => i.status === s).length;
  console.log(`VAULT CONTENT LIBRARY: ${feed.length} feed items (posted ${count('posted')}, scheduled ${count('scheduled')}, ready ${count('ready')}, draft ${count('draft')}, ideas ${count('idea')})  · today ${L.fmt(t)}`);
  const open = items.filter(i => (i.feedback || []).some(f => !f.resolved));
  if (open.length) {
    console.log('\nOPEN FEEDBACK FROM THE USER: handle these first, then `resolve`');
    open.forEach(i => i.feedback.forEach((f, n) => { if (!f.resolved) console.log(`  💬 ${i.id} #${n} (${f.ts.slice(0, 10)}): ${f.text}`); }));
  }
  console.log('\nFEED TIMELINE (date time · id · pillar · type · topic · Dot · bg · status)   🔒 = date set by the user');
  for (const i of L.datedFeed(lib)) console.log(`  ${i.post_date} ${(i.post_time || '').padEnd(5)} ${i.post_date < t ? ' ' : '›'} ${(i.id + (i.date_locked ? '🔒' : '')).padEnd(6)} ${String(i.pillar).padEnd(10)} ${i.type.padEnd(8)} ${i.topic.slice(0, 54).padEnd(54)} · ${pose0(i).padEnd(10)} · ${L.bg0(i).padEnd(5)} · ${i.status}`);
  const other = items.filter(i => L.OTHER_TYPES.includes(i.type) && i.post_date && i.status !== 'retired' && L.days(t, i.post_date) >= -1 && L.days(t, i.post_date) <= 21).sort(L.byDate);
  if (other.length) { console.log('\nSTORIES & TASKS (next 3 weeks)'); other.forEach(i => console.log(`  ${i.post_date} ${(i.post_time || '').padEnd(5)}  ${i.id.padEnd(5)} ${i.type.padEnd(6)} ${i.topic} · ${i.status}`)); }
  const todo = items.filter(i => L.onCalendar(i) && ['idea', 'draft'].includes(i.status) && i.type !== 'task');
  if (todo.length) { console.log('\nNOT MADE YET'); todo.sort(L.byDate).forEach(i => console.log(`  ${i.id} ${i.post_date || '(unscheduled)'} ${i.type} · ${i.topic}${i.notes ? ': ' + i.notes : ''}`)); }
  const last = live.slice(-6);
  console.log('\nRECENTLY USED (avoid repeating in the next 3 posts)');
  console.log('  Dot poses:   ' + last.map(pose0).join(', '));
  console.log('  Backgrounds: ' + last.map(L.bg0).join(', '));
  console.log('  Hooks:       ' + last.map(i => `"${(i.hook || '').slice(0, 40)}"`).join(' | '));
  const mix = {}; live.slice(-12).forEach(i => mix[i.pillar] = (mix[i.pillar] || 0) + 1);
  const n = Math.min(12, live.length) || 1;
  console.log('\nPILLAR MIX (last 12 vs target): ' + Object.keys(TARGET).map(p => `${p} ${Math.round((mix[p] || 0) / n * 100)}%/${Math.round(TARGET[p] * 100)}%`).join(' · '));
  const perf = feed.filter(i => i.metrics && (i.metrics.saves || i.metrics.reach));
  if (perf.length) { console.log('\nTOP BY SAVES+SHARES'); perf.sort((a, b) => ((b.metrics.saves || 0) + (b.metrics.shares || 0)) - ((a.metrics.saves || 0) + (a.metrics.shares || 0))).slice(0, 5).forEach(i => console.log(`  ${i.id} ${i.topic.slice(0, 50)} saves ${i.metrics.saves || 0} shares ${i.metrics.shares || 0} reach ${i.metrics.reach || 0}`)); }
  const w = L.warnings(lib).filter(x => x.kind !== 'feedback'); if (w.length) { console.log('\nWARNINGS'); w.forEach(x => console.log('  ! ' + x.msg)); }
  console.log('\nRules: `check` before designing; `add`/`set` after; never move a 🔒 date without asking. The user edits this library from the dashboard too, so re-run `status` before each new task.');
}
else if (cmd === 'check') {
  const cand = { topic: flag('topic'), angle: flag('angle'), keywords: (flag('keywords') || '').split(',').filter(Boolean) };
  const S = L.sig(cand), date = flag('date') || t, pose = flag('pose'), bg = flag('bg'), pillar = flag('pillar');
  let bad = 0;
  for (const i of feed) {
    const s = L.sim(S, L.sig(i)); if (s < 0.4) continue;
    const d = i.post_date ? Math.abs(L.days(i.post_date, date)) : null;
    const level = s >= 0.6 && (d === null || d <= 42) ? 'REPEAT' : 'similar';
    if (level === 'REPEAT') bad++;
    console.log(`${level.padEnd(7)} ${i.id} (${i.post_date || 'no date'}, ${d ?? '?'}d away, overlap ${Math.round(s * 100)}%): ${i.topic}`);
  }
  const near = live.filter(i => i.post_date <= date).slice(-3);
  if (pose && near.some(i => String(i.dot_pose).includes(pose))) { bad++; console.log(`POSE    "${pose}" used in the last 3 posts (${near.map(i => i.id + ':' + pose0(i)).join(', ')})`); }
  if (bg && near.length >= 2 && near.slice(-2).every(i => L.bg0(i) === bg)) { bad++; console.log(`BG      "${bg}" would make 3 in a row on the grid`); }
  const sameDay = L.datedFeed(lib).filter(i => i.post_date === date);
  if (flag('date') && sameDay.length) console.log(`DATE    ${L.fmt(date)} already has ${sameDay.map(i => i.id).join(', ')}`);
  if (pillar) { const mix = live.slice(-12).filter(i => i.pillar === pillar).length / Math.max(1, Math.min(12, live.length)); if (TARGET[pillar] && mix > TARGET[pillar] + .1) console.log(`PILLAR  ${pillar} is already ${Math.round(mix * 100)}% of the last 12 (target ${Math.round(TARGET[pillar] * 100)}%)`); }
  log('check', `Freshness check "${cand.topic}": ${bad ? bad + ' problem(s)' : 'fresh'}`);
  console.log(bad ? `\n✗ ${bad} freshness problem(s): change the angle, pose or background, or justify it in notes.` : '\n✓ Fresh: no repeats found.');
  process.exit(bad ? 2 : 0);
}
else if (cmd === 'add') {
  const src = args[0]; const e = JSON.parse(fs.existsSync(src) ? fs.readFileSync(src, 'utf8') : src);
  if (L.isFeed(e)) for (const k of ['pillar', 'status']) if (!e[k]) { console.error('missing field: ' + k); process.exit(1); }
  try { const it = L.newItem(lib, e); L.save(lib); log('library', `Added ${it.id}: ${it.topic}`, { id: it.id }); console.log('added ' + it.id); }
  catch (err) { console.error(err.message); process.exit(1); }
}
else if (cmd === 'set') {
  const it = find(args.shift());
  for (const kv of args.filter(a => a !== '--force')) {
    const [k, ...v] = kv.split('='); const raw = v.join('=');
    if (k === 'post_date' && it.date_locked && !force) { console.error(`✗ ${it.id}'s date was set by the user (🔒). Ask them first, then re-run with --force.`); process.exit(3); }
    if (k.startsWith('metrics.')) { it.metrics = it.metrics || {}; it.metrics[k.slice(8)] = isNaN(+raw) ? raw : +raw; }
    else if (k === 'files' || k === 'keywords') it[k] = raw.split(',').map(x => x.trim()).filter(Boolean);
    else it[k] = raw;
  }
  L.save(lib); log('library', `Updated ${it.id}: ${args.filter(a => a !== '--force').join(' ')}`, { id: it.id }); console.log('updated ' + it.id);
}
else if (cmd === 'move') {
  const it = find(args[0]); const date = args[1] === 'none' ? '' : args[1], time = args[2] && /^\d{2}:\d{2}$/.test(args[2]) ? args[2] : undefined;
  if (it.date_locked && !force) { console.error(`✗ ${it.id}'s date was set by the user (🔒 ${it.post_date}). Ask them first, then re-run with --force.`); process.exit(3); }
  try { const { from } = L.move(lib, it.id, date, time, 'claude'); L.save(lib);
    log('library', `Moved ${it.id} from ${from ? L.fmt(from) : 'unscheduled'} to ${date ? L.fmt(date) : 'unscheduled'}`, { id: it.id });
    console.log(`moved ${it.id}: ${from || 'unscheduled'} → ${date || 'unscheduled'}`);
    L.warnings(lib).filter(w => w.ids.includes(it.id)).forEach(w => console.log('  ! ' + w.msg));
  } catch (err) { console.error(err.message); process.exit(1); }
}
else if (cmd === 'feedback') {
  const it = find(args[0]); const text = args.slice(1).join(' '); if (!text) { console.error('usage: feedback <id> "note"'); process.exit(1); }
  (it.feedback = it.feedback || []).push({ ts: new Date().toISOString(), by: 'claude', text, resolved: false });
  L.save(lib); log('library', `Note on ${it.id}: ${text}`, { id: it.id }); console.log('noted on ' + it.id);
}
else if (cmd === 'resolve') {
  const it = find(args[0]); const which = args[1], reply = args.slice(2).join(' ');
  const fb = it.feedback || []; const idx = which === 'all' ? fb.map((_, n) => n) : [+which];
  if (!idx.length || idx.some(n => !fb[n])) { console.error('no such feedback; see `status`'); process.exit(1); }
  idx.forEach(n => Object.assign(fb[n], { resolved: true, resolved_at: new Date().toISOString(), reply }));
  L.save(lib); log('done', `Resolved feedback on ${it.id}: ${reply}`, { id: it.id }); console.log('resolved ' + idx.length + ' on ' + it.id);
}
else if (cmd === 'calendar') { L.writeCalendar(lib); console.log('wrote content/calendar.md'); }
else if (cmd === 'grid') {
  const out = args[0] || 'out/grid.jpg';
  const tiles = [...live].reverse().map(i => ({ i, f: (i.files || []).find(f => /\.(png|jpe?g)$/i.test(f)) })).filter(x => x.f && fs.existsSync(path.join(L.ROOT, x.f)));
  const { chromium } = require('playwright');
  (async () => {
    const tmp = path.join(L.ROOT, 'out', '.grid.html'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, `<html><body style="margin:0;background:#fff;font:12px sans-serif"><div id="g" style="display:grid;grid-template-columns:repeat(3,300px);gap:3px;padding:3px">${tiles.map(x => `<div style="position:relative;width:300px;height:400px;overflow:hidden"><img src="file://${path.join(L.ROOT, x.f)}" style="width:100%;height:100%;object-fit:cover"><span style="position:absolute;left:4px;top:4px;background:#000a;color:#fff;padding:2px 5px">${x.i.post_date} ${x.i.id}</span></div>`).join('')}</div></body></html>`);
    const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
    const p = await b.newPage({ viewport: { width: 915, height: 800 } });
    await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.locator('#g').screenshot({ path: out, type: 'jpeg', quality: 85 });
    fs.rmSync(tmp); await b.close(); console.log('wrote ' + out + ' (newest first, 3:4 grid crop)');
  })();
}
else { console.error('commands: status | check | add | set | move | feedback | resolve | calendar | grid'); process.exit(1); }
