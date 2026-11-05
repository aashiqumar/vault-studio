// Club member characters — simple flat vector kit, matching Dot's drawing language.
// Load after dot.js (reuses eyeOpen/eyeHappy/cheeks/stroke/C from it).
// member(opts) -> svg string, 140x210 body space, feet at (70,206) like dot()'s 100,206.

const MEMBER_SKINS = ['#E8B589', '#C68B5D', '#F2CBA0'];
const MEMBER_HAIR = ['#2B2420', '#14151F', '#4A3426'];

function memberArm(px, py, a, color, to) {
  let hx, hy;
  if (to) { [hx, hy] = to; } else { const r = a * Math.PI / 180; hx = px + 16 * Math.sin(r); hy = py + 16 * Math.cos(r); }
  return `<line x1="${px}" y1="${py}" x2="${hx}" y2="${hy}" stroke="${color}" stroke-width="15" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="8.2" fill="${color}"/>`;
}

function memberFace(mood, cx) {
  const lx = cx - 13, rx = cx + 13, y = 86;
  if (mood === 'worried') {
    return eyeOpen(lx, y, 0, 0) + eyeOpen(rx, y, 0, 0) +
      stroke(`M${lx - 9} ${y - 12} L${lx + 2} ${y - 16}`) + stroke(`M${rx - 2} ${y - 16} L${rx + 9} ${y - 12}`) +
      stroke(`M${cx - 10} ${y + 20} Q${cx} ${y + 13} ${cx + 10} ${y + 20}`);
  }
  if (mood === 'hopeful') {
    return eyeOpen(lx, y, 0, -1) + eyeOpen(rx, y, 0, -1) +
      `<path d="M${cx - 9} ${y + 18} Q${cx} ${y + 24} ${cx + 9} ${y + 18}" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  // happy
  return eyeHappy(lx, y) + eyeHappy(rx, y) +
    `<ellipse cx="${lx}" cy="${y + 14}" rx="6.5" ry="3.6" fill="${C.cheek}" opacity=".55"/><ellipse cx="${rx}" cy="${y + 14}" rx="6.5" ry="3.6" fill="${C.cheek}" opacity=".55"/>` +
    `<path d="M${cx - 13} ${y + 15} Q${cx} ${y + 29} ${cx + 13} ${y + 15}" stroke="${C.ink}" stroke-width="4.2" fill="none" stroke-linecap="round"/>`;
}

// opts: { mood:'worried'|'hopeful'|'happy', cloth, skin, hair, armL:{a|to}, armR:{a|to}, raised:'l'|'r'|'both'|null }
function member(opts = {}) {
  const cloth = opts.cloth || C.plum;
  const skin = opts.skin || MEMBER_SKINS[0];
  const hair = opts.hair || MEMBER_HAIR[0];
  const mood = opts.mood || 'happy';
  const cx = 70;
  const armL = opts.armL || { a: -26 };
  const armR = opts.armR || { a: 26 };

  const body = `
    <ellipse cx="${cx}" cy="202" rx="34" ry="7" fill="${C.ink}" opacity=".10"/>
    <path d="M${cx - 30} 198 Q${cx - 36} 140 ${cx - 24} 108 Q${cx - 14} 96 ${cx} 96 Q${cx + 14} 96 ${cx + 24} 108 Q${cx + 36} 140 ${cx + 30} 198 Z" fill="${cloth}"/>
    <rect x="${cx - 28}" y="186" width="56" height="16" rx="8" fill="${cloth}" opacity=".9"/>
    <circle cx="${cx}" cy="60" r="30" fill="${skin}"/>
    <path d="M${cx - 30} 54 Q${cx - 32} 24 ${cx} 20 Q${cx + 32} 24 ${cx + 30} 54 Q${cx + 22} 36 ${cx} 34 Q${cx - 22} 36 ${cx - 30} 54Z" fill="${hair}"/>
  `;
  const face = memberFace(mood, cx);
  const armL_ = memberArm(cx - 24, 118, armL.a, cloth, armL.to);
  const armR_ = memberArm(cx + 24, 118, armR.a, cloth, armR.to);

  return `<svg viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg">${body}${face}${armL_}${armR_}</svg>`;
}

// Place a member by feet position, matching placeDot's signature.
function placeMember(container, opts, w, fx, fy, z) {
  const host = typeof container === 'string' ? document.getElementById(container) : container;
  const s = member(opts);
  const k = w / 140, h = w * 210 / 140;
  const d = document.createElement('div');
  d.className = 'memberm'; d.innerHTML = s;
  Object.assign(d.style, { position: 'absolute', zIndex: z || 4, lineHeight: 0, width: w + 'px', height: h + 'px',
    left: (fx - 70 * k) + 'px', top: (fy - 206 * k) + 'px' });
  host.appendChild(d); return d;
}
