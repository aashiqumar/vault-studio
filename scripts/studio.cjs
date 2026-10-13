// Vault Studio dashboard server. No dependencies. Usage: node scripts/studio.cjs [--port 4747]  → http://localhost:4747
// Serves dashboard/, streams live updates (new renders, activity, library edits) over Server-Sent Events,
// and lets the dashboard update status / date / metrics of library items.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = +(process.argv[process.argv.indexOf('--port') + 1] || 0) || 4747;
const LIB = path.join(ROOT, 'content/library.json'), ACT = path.join(ROOT, 'content/activity.jsonl');
const SERVE = ['dashboard', 'brand', 'kit', 'assets', 'out', 'examples', 'templates'];
const MEDIA = /\.(png|jpe?g|mp4|webp)$/i;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8', '.webp': 'image/webp' };
const read = (f, d = '') => { try { return fs.readFileSync(f, 'utf8'); } catch { return d; } };
const { log } = require('./log.cjs');

function scanMedia() {
  const out = [];
  const walk = (dir, depth = 0) => { let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) { if (e.name.startsWith('.')) continue; const f = path.join(dir, e.name);
      if (e.isDirectory() && depth < 4) walk(f, depth + 1);
      else if (MEDIA.test(e.name)) { const st = fs.statSync(f); out.push({ file: path.relative(ROOT, f).split(path.sep).join('/'), mtime: st.mtimeMs, size: st.size }); } } };
  walk(path.join(ROOT, 'out')); walk(path.join(ROOT, 'assets'));
  return out.sort((a, b) => b.mtime - a.mtime);
}
function activity(n = 300) { return read(ACT).trim().split('\n').filter(Boolean).slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
function state() {
  return { library: JSON.parse(read(LIB, '{"items":[]}')), media: scanMedia().slice(0, 400), activity: activity(),
    docs: { calendar: read(path.join(ROOT, 'content/calendar.md')), ideas: read(path.join(ROOT, 'content/ideas.md')), performance: read(path.join(ROOT, 'content/performance.md')), strategy: read(path.join(ROOT, 'content/strategy.md')) },
    today: new Date().toISOString().slice(0, 10) };
}

// ---- live: poll files (portable), push changes to every open dashboard
const clients = new Set();
const push = (event, data) => { const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) c.write(msg); };
let seen = new Map(scanMedia().map(m => [m.file, m.mtime])), libM = 0, actSize = 0;
try { libM = fs.statSync(LIB).mtimeMs; } catch {} try { actSize = fs.statSync(ACT).size; } catch {}
setInterval(() => {
  for (const m of scanMedia()) if (seen.get(m.file) !== m.mtime) { seen.set(m.file, m.mtime); push('media', m); }
  try { const m = fs.statSync(LIB).mtimeMs; if (m !== libM) { libM = m; push('library', JSON.parse(read(LIB))); } } catch {}
  try { const s = fs.statSync(ACT).size; if (s > actSize) { const fd = fs.openSync(ACT, 'r'); const buf = Buffer.alloc(s - actSize); fs.readSync(fd, buf, 0, buf.length, actSize); fs.closeSync(fd); actSize = s;
    buf.toString().trim().split('\n').forEach(l => { try { push('activity', JSON.parse(l)); } catch {} }); } else if (s < actSize) actSize = s; } catch {}
}, 1000);
setInterval(() => push('ping', Date.now()), 20000);

function sendFile(res, rel) {
  const f = path.resolve(ROOT, rel);
  if (!f.startsWith(ROOT + path.sep) || !SERVE.includes(path.relative(ROOT, f).split(path.sep)[0])) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(f, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
    const range = res.req.headers.range;
    if (range && type === 'video/mp4') { const [s, e] = range.replace('bytes=', '').split('-'); const start = +s, end = e ? +e : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return fs.createReadStream(f, { start, end }).pipe(res); }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(res);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); const p = decodeURIComponent(url.pathname);
  if (p === '/') return sendFile(res, 'dashboard/index.html');
  if (p === '/api/state') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(state())); }
  if (p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  const m = p.match(/^\/api\/item\/([\w-]+)$/);
  if (m && req.method === 'POST') {
    let body = ''; req.on('data', c => body += c); req.on('end', () => {
      try {
        const patch = JSON.parse(body || '{}'), lib = JSON.parse(read(LIB)), it = lib.items.find(i => i.id === m[1]);
        if (!it) { res.writeHead(404); return res.end('{"error":"not found"}'); }
        for (const k of ['status', 'post_date', 'caption', 'notes', 'hashtag_set']) if (k in patch) it[k] = patch[k];
        if (patch.metrics) { it.metrics = it.metrics || {}; for (const [k, v] of Object.entries(patch.metrics)) if (v !== '' && v != null) it.metrics[k] = +v; }
        fs.writeFileSync(LIB, JSON.stringify(lib, null, 2) + '\n');
        log('library', `Dashboard updated ${it.id}: ${Object.keys(patch).join(', ')}`, { id: it.id });
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(it));
      } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })); }
    }); return;
  }
  sendFile(res, p.slice(1));
}).listen(PORT, '127.0.0.1', () => console.log(`Vault Studio dashboard → http://localhost:${PORT}`));
