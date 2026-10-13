// Page helpers. Load after glyphs.js, logo.js, dot.js, poses.js.

// <span data-logo data-h="48" data-color="#FFFFFF" data-dot="#14151F"></span>  -> the real wordmark (outlines).
// data-h = letter height in px (≈ 0.77 × the old Georgia font-size). data-nodot = letters only (Dot lockup).
function mountLogos(root = document) {
  root.querySelectorAll('[data-logo]').forEach(el => {
    const h = +el.dataset.h || 48;
    const dot = el.hasAttribute('data-nodot') ? null : (el.dataset.dot || K.rose);
    el.innerHTML = wordmark({ h, color: el.dataset.color || K.ink, dot });
    el.style.display = 'inline-block'; el.style.lineHeight = 0;
  });
  fitAll(root);
}

// Place Dot so its FEET land on (fx, fy) inside a positioned container (px in the container's space).
// placeDot('p1', 'worried', 290, 915, 1090, { dark:true })  — names: see poses.js
function placeDot(container, name, w, fx, fy, opt = {}) {
  const host = typeof container === 'string' ? document.getElementById(container) : container;
  const s = pose(name, w, opt);
  const vb = s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const k = w / vb[2], cx = opt.cx || 100;
  const d = document.createElement('div');
  d.className = 'dotm'; d.innerHTML = s;
  Object.assign(d.style, { position: 'absolute', zIndex: opt.z || 5, lineHeight: 0,
    left: (fx - (cx - vb[0]) * k) + 'px', top: (fy - (206 - vb[1]) * k) + 'px' });
  host.appendChild(d); return d;
}

// Soft disc behind Dot (use on rose backgrounds, where a rose Dot would disappear).
function disc(container, cx, cy, r, color = '#FCE7EE') {
  const host = typeof container === 'string' ? document.getElementById(container) : container;
  const d = document.createElement('div');
  Object.assign(d.style, { position: 'absolute', borderRadius: '50%', left: (cx - r) + 'px', top: (cy - r) + 'px', width: 2 * r + 'px', height: 2 * r + 'px', background: color });
  host.insertBefore(d, host.querySelector('.foot')); return d;
}
