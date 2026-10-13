// Tile images into one preview sheet so you can check a whole set at a glance.
// Usage: node scripts/contact-sheet.cjs out/posts out/posts-preview.jpg [cols=6] [thumbWidth=360]
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const { log, rel } = require('./log.cjs');
const [dir, out, cols = 6, tw = 360] = process.argv.slice(2);
if (!dir || !out) { console.error('usage: node scripts/contact-sheet.cjs <dir> <out.jpg> [cols] [thumbWidth]'); process.exit(1); }
const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g)$/i.test(f)).sort();
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: cols * (+tw + 10) + 10, height: 800 } });
  const imgs = files.map(f => `<figure><img src="${encodeURI(f)}"><figcaption>${f}</figcaption></figure>`).join('');
  const tmp = path.join(dir, '.contact-sheet.html');   // a file page, so it may load the local images
  fs.writeFileSync(tmp, `<html><body style="margin:0;background:#888;font:12px sans-serif">
    <div id="g" style="display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:10px;padding:10px">${imgs}</div>
    <style>figure{margin:0}img{width:100%;display:block}figcaption{color:#fff;padding:4px 0}</style></body></html>`);
  await p.goto('file://' + path.resolve(tmp), { waitUntil: 'load' });
  await p.locator('#g').screenshot({ path: out, type: 'jpeg', quality: 85 });
  fs.rmSync(tmp); await b.close(); log('file', `Contact sheet (${files.length} images)`, { file: rel(out) }); console.log('wrote', out, `(${files.length} images)`);
})();
