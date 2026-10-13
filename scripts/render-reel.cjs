// Render a GSAP reel page (must define window.DURATION and window.seek(t)) to MP4, or preview stills.
// Usage:
//   node scripts/render-reel.cjs templates/reel.html out/reel.mp4 [--audio out/track.wav] [--fps 30]
//   node scripts/render-reel.cjs templates/reel.html out/preview --preview 3.4,6.2,14.8,26.5
const path = require('path'), fs = require('fs'), { spawnSync } = require('child_process');
const { chromium } = require('playwright');
const { log, rel } = require('./log.cjs');
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const audio = flag('--audio', ''), fps = +flag('--fps', 30), preview = flag('--preview', '');
const [html, out] = args;
if (!html || !out) { console.error('usage: node scripts/render-reel.cjs <reel.html> <out.mp4|previewDir> [--audio a.wav] [--preview t1,t2]'); process.exit(1); }

function ffmpegBin() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const venv = path.resolve(__dirname, '../.venv/bin/python');
  for (const py of [venv, 'python3']) {
    const r = spawnSync(py, ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']);
    if (r.status === 0) return r.stdout.toString().trim();
  }
  throw new Error('ffmpeg not found: install it, or `pip install imageio-ffmpeg`, or set FFMPEG=/path/to/ffmpeg');
}

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await p.goto('file://' + path.resolve(html), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const D = await p.evaluate(() => window.DURATION);
  console.log('duration', D);
  if (preview) {
    fs.mkdirSync(out, { recursive: true });
    for (const t of preview.split(',').map(Number)) {
      await p.evaluate(t => window.seek(t), t);
      const f = path.join(out, `t-${t.toFixed(2)}.jpg`);
      await p.screenshot({ path: f, type: 'jpeg', quality: 80 }); console.log('wrote', f); log('file', `Reel preview at ${t}s`, { file: rel(f) });
    }
    return b.close();
  }
  const frames = path.join(path.dirname(out), '.frames-' + path.basename(out, '.mp4'));
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  const n = Math.ceil(D * fps);
  log('reel', `Rendering reel ${rel(html)}: ${n} frames`, { progress: 0, total: n });
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.seek(t), i / fps);
    await p.screenshot({ path: path.join(frames, 'f' + String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % 60 === 0) { process.stdout.write(`\rframe ${i}/${n}`); log('reel', `Frame ${i}/${n}`, { progress: i, total: n }); }
  }
  await b.close(); console.log(`\rframes ${n}/${n}`);
  const ff = ffmpegBin();
  const a = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%05d.jpg')];
  if (audio) a.push('-i', audio, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest');
  a.push('-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
  const r = spawnSync(ff, a, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log('wrote', out); log('file', `Reel encoded: ${path.basename(out)}`, { file: rel(out), progress: n, total: n });
})();
