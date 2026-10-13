// Activity log for the Studio dashboard (content/activity.jsonl, one JSON event per line).
// From scripts:  require('./log.cjs').log('render', 'wrote out/x.png', { file: 'out/x.png' })
// From the CLI (Claude narrating its work so the dashboard shows it live):
//   node scripts/log.cjs "Planning December: shortlisted 12 ideas"
//   node scripts/log.cjs --type step "Rendering carousel round 2 (fixed footer overlap)"
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), FILE = path.join(ROOT, 'content/activity.jsonl');
function log(type, msg, data = {}) {
  try { fs.appendFileSync(FILE, JSON.stringify({ ts: new Date().toISOString(), type, msg, ...data }) + '\n'); } catch (_) {}
}
module.exports = { log, rel: p => path.relative(ROOT, path.resolve(p)) };
if (require.main === module) {
  const a = process.argv.slice(2); let type = 'note';
  const i = a.indexOf('--type'); if (i >= 0) { type = a[i + 1]; a.splice(i, 2); }
  if (!a.length) { console.error('usage: node scripts/log.cjs [--type step|note|plan|done] "message"'); process.exit(1); }
  log(type, a.join(' ')); console.log('logged');
}
