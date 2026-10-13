// Render every element marked data-export="<name>" in an HTML page to out/<name>.png
// Usage: node scripts/render.cjs templates/posts.html [outDir=out] [--only name1,name2] [--scale 2]
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const { log, rel } = require('./log.cjs');
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const only = flag('--only', ''), scale = +flag('--scale', 1);
const [html, outDir = 'out'] = args;
if (!html) { console.error('usage: node scripts/render.cjs <page.html> [outDir] [--only a,b] [--scale 2]'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 2000, height: 2000 }, deviceScaleFactor: scale });
  p.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await p.goto('file://' + path.resolve(html), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  log('render', `Rendering ${rel(html)}`, { page: rel(html) });
  let names = await p.$$eval('[data-export]', els => els.map(e => e.dataset.export));
  if (only) names = names.filter(n => only.split(',').includes(n));
  for (const n of names) {
    const file = path.join(outDir, n + '.png');
    await p.locator(`[data-export="${n}"]`).screenshot({ path: file, omitBackground: true });
    console.log('wrote', file); log('file', `Rendered ${n}`, { file: rel(file) });
  }
  if (!names.length) console.error('No [data-export] elements found.');
  await b.close();
})();
