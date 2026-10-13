// Dot — Vault mascot. Flat vector drawing kit. All coords in a 200x240 front-view space.
const C = { rose:'#D91E5C', arm:'#CC1A55', dark:'#A3123F', deep:'#8C0F36', side:'#A9154A', paper:'#F7F6F2', tint:'#FCE7EE',
  ink:'#14151F', dot:'#C41850', teal:'#1F8A70', plum:'#5446D0', cheek:'#F38BAE', amber:'#F2B33D', amberD:'#C98A16', sky:'#7CC4EA' };
let _gid = 0;

function defs(g){ return `<defs>
<linearGradient id="b${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5397A"/><stop offset=".55" stop-color="#D91E5C"/><stop offset="1" stop-color="#BF174E"/></linearGradient>
<linearGradient id="s${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C21A55"/><stop offset="1" stop-color="#A0123F"/></linearGradient>
<radialGradient id="c${g}" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#FFD36B"/><stop offset=".7" stop-color="#F2B33D"/><stop offset="1" stop-color="#D99A22"/></radialGradient>
</defs>`; }

const star = (x,y,s,c) => `<path d="M${x} ${y-s} Q${x+s*.18} ${y-s*.18} ${x+s} ${y} Q${x+s*.18} ${y+s*.18} ${x} ${y+s} Q${x-s*.18} ${y+s*.18} ${x-s} ${y} Q${x-s*.18} ${y-s*.18} ${x} ${y-s}Z" fill="${c}"/>`;

// ---------- face parts ----------
const eyeOpen = (x,y,lx=0,ly=0) => `<ellipse cx="${x+lx}" cy="${y+ly}" rx="7" ry="9.8" fill="${C.ink}"/><circle cx="${x+lx+2.3}" cy="${y+ly-3.8}" r="2.9" fill="#fff"/><circle cx="${x+lx-2.1}" cy="${y+ly+3.6}" r="1.15" fill="#fff"/>`;
const eyeHappy = (x,y) => `<path d="M${x-6.5} ${y+3} Q${x} ${y-8} ${x+6.5} ${y+3}" stroke="${C.ink}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`;
const eyeClosed = (x,y) => `<path d="M${x-6.5} ${y-1} Q${x} ${y+6.5} ${x+6.5} ${y-1}" stroke="${C.ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
const eyeSleepy = (x,y) => `<path d="M${x-6.6} ${y+1} Q${x} ${y+9.5} ${x+6.6} ${y+1}Z" fill="${C.ink}"/><path d="M${x-7.5} ${y+1} H${x+7.5}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
const cheeks = (o=.55) => `<ellipse cx="73" cy="132" rx="7.2" ry="4.2" fill="${C.cheek}" opacity="${o}"/><ellipse cx="127" cy="132" rx="7.2" ry="4.2" fill="${C.cheek}" opacity="${o}"/>`;
const stroke = d => `<path d="${d}" stroke="${C.ink}" stroke-width="3.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const mouthBig = `<path d="M90 130 Q100 148 110 130Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="100" cy="136.6" rx="4.6" ry="2.2" fill="${C.cheek}"/>`;

const FACES = {
  happy:    () => eyeOpen(85,117)+eyeOpen(115,117)+cheeks()+stroke('M92 132 Q100 140 108 132'),
  balanced: () => eyeHappy(86,119)+eyeHappy(114,119)+cheeks(.7)+mouthBig,
  thinking: () => eyeOpen(86,118,2.5,-3)+eyeOpen(114,118,2.5,-3)+cheeks(.4)+`<circle cx="104" cy="136" r="3.2" fill="none" stroke="${C.ink}" stroke-width="3"/>`,
  worried:  () => eyeOpen(86,119)+eyeOpen(114,119)+cheeks(.35)+stroke('M78 107 L90 103')+stroke('M110 103 L122 107')+stroke('M91 137 Q95.5 132 100 136 Q104.5 140 109 135'),
  party:    () => eyeHappy(86,119)+eyeHappy(114,119)+cheeks(.75)+mouthBig,
  proud:    () => eyeClosed(86,118)+eyeClosed(114,118)+cheeks(.7)+stroke('M91 131 Q100 141 109 131'),
  sleepy:   () => `<path d="M79 121 Q86 125.5 93 121" stroke="#14151F" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M107 121 Q114 125.5 121 121" stroke="#14151F" stroke-width="3.4" fill="none" stroke-linecap="round"/>`+cheeks(.45)+`<ellipse cx="100" cy="135" rx="3" ry="3.6" fill="${C.ink}"/>`,
  oops:     () => eyeOpen(86,118)+eyeOpen(114,118)+cheeks(.35)+stroke('M92 138 Q100 131.5 108 138')+`<path d="M121 124 Q125.5 131 121 134.5 Q116.5 131 121 124Z" fill="${C.sky}"/>`,
  wink:     () => eyeOpen(86,118)+eyeHappy(114,119)+cheeks(.65)+stroke('M91 131 Q100 141 109 131'),
  effort:   () => eyeClosed(86,118)+eyeClosed(114,118)+cheeks(.7)+stroke('M93 134 H107')+`<path d="M138 92 Q144 101 138 105 Q132 101 138 92Z" fill="${C.sky}"/>`,
};

// ---------- extras (front coords) ----------
const X = {
  glow: `<circle cx="100" cy="27" r="28" fill="${C.dot}" opacity=".08"/><circle cx="100" cy="27" r="19" fill="${C.dot}" opacity=".16"/>`,
  tick: `<circle cx="160" cy="38" r="16" fill="${C.teal}"/><path d="M152.5 38.5 L158 44 L168 33" stroke="#fff" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  sparkles: star(34,40,9,C.teal)+star(178,82,6,C.amber)+star(22,98,5,C.plum)+star(140,14,5,C.amber),
  thought: `<circle cx="140" cy="50" r="3.5" fill="${C.plum}" opacity=".45"/><circle cx="151" cy="38" r="5" fill="${C.plum}" opacity=".6"/><circle cx="166" cy="24" r="7" fill="${C.plum}" opacity=".8"/>`,
  spin: `<path d="M138 82 A57 57 0 0 1 156 108" stroke="${C.ink}" stroke-opacity=".3" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M62 166 A57 57 0 0 1 44 140" stroke="${C.ink}" stroke-opacity=".3" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
  sweat: `<path d="M142 86 Q148.5 96 142 100.5 Q135.5 96 142 86Z" fill="${C.sky}"/>`,
  flyReceipt: `<g transform="rotate(18 176 54)">${'' }<path d="M164 38 H188 V66 L185 63 L182 66 L179 63 L176 66 L173 63 L170 66 L167 63 L164 66Z" fill="#fff" stroke="#E2DCD2" stroke-width="1.5"/><path d="M168 45 H184 M168 50 H180 M168 55 H183" stroke="#C9C2B6" stroke-width="2" stroke-linecap="round"/></g><path d="M150 70 q6 -4 10 -10" stroke="${C.ink}" stroke-opacity=".3" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  hat: `<g transform="rotate(-14 68 46)"><path d="M52 64 L84 64 L68 22Z" fill="${C.plum}"/><path d="M57.5 50 L78.5 50 M62.5 37 L73.5 37" stroke="${C.amber}" stroke-width="4" stroke-linecap="round"/><circle cx="68" cy="21" r="6" fill="${C.teal}"/></g>`,
  confetti: [[22,40,C.teal,20],[176,30,C.amber,-30],[186,96,C.plum,50],[16,110,C.amber,-15],[150,10,C.plum,10],[40,12,C.dot,40],[188,150,C.teal,-40],[10,160,C.plum,25]].map(([x,y,c,r])=>`<rect x="${x-4}" y="${y-2.5}" width="8" height="5" rx="1.2" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join(''),
  badge: `<path d="M140 176 L134 198 L141 194 L145 201 L149 180Z" fill="${C.teal}"/><path d="M156 176 L162 198 L155 194 L151 201 L147 180Z" fill="#17705A"/><circle cx="148" cy="170" r="14.5" fill="${C.teal}" stroke="${C.paper}" stroke-width="3"/><path d="M141.5 170.5 L146 175 L154.5 165.5" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  zzz: `<text x="122" y="46" font-family="'Plus Jakarta Sans'" font-weight="800" font-size="15" fill="${C.plum}" opacity=".55">z</text><text x="135" y="31" font-family="'Plus Jakarta Sans'" font-weight="800" font-size="20" fill="${C.plum}" opacity=".75">z</text><text x="152" y="15" font-family="'Plus Jakarta Sans'" font-weight="800" font-size="25" fill="${C.plum}">z</text>`,
  wave: `<path d="M184 52 q8 8 6 20 M192 44 q12 12 9 30" stroke="${C.ink}" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  droop: '',
};

// ---------- arms ----------
// a = degrees from straight down, positive = outward. Or pass {to:[x,y]}.
function armPath(px,py,s,a,to){
  let hx,hy;
  if (to){ [hx,hy] = to; } else { const r=a*Math.PI/180; hx=px+s*19*Math.sin(r); hy=py+19*Math.cos(r); }
  return `<line x1="${px}" y1="${py}" x2="${hx}" y2="${hy}" stroke="${C.arm}" stroke-width="19" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="10.6" fill="${C.arm}"/><circle cx="${hx-2.5}" cy="${hy-3}" r="3" fill="#fff" opacity=".18"/>`;
}

function antenna(x, droop){
  if (droop) return `<path d="M${x} 63 Q${x} 44 ${x+16} 40" stroke="${C.dark}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="${x+22}" cy="42" r="11" fill="${C.dot}"/><circle cx="${x+19}" cy="38.5" r="3.3" fill="#fff" opacity=".75"/>`;
  return `<path d="M${x} 63 V37" stroke="${C.dark}" stroke-width="6" stroke-linecap="round"/><circle cx="${x}" cy="27" r="11.5" fill="${C.dot}"/><circle cx="${x-4}" cy="23" r="3.5" fill="#fff" opacity=".78"/>`;
}

function door(g, face){
  let ticks=''; for(let i=0;i<16;i++){ const t=i/16*Math.PI*2; const c=Math.cos(t), s=Math.sin(t);
    ticks+=`<line x1="${100+45.6*c}" y1="${124+45.6*s}" x2="${100+48.6*c}" y2="${124+48.6*s}" stroke="${C.paper}" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/>`; }
  return `<rect x="43" y="101" width="10" height="14" rx="3" fill="${C.dark}"/><rect x="43" y="133" width="10" height="14" rx="3" fill="${C.dark}"/>
  <circle cx="100" cy="124" r="51.5" fill="${C.dark}"/><circle cx="100" cy="124" r="51.5" fill="none" stroke="${C.deep}" stroke-width="2"/>${ticks}
  <circle cx="100" cy="124" r="42" fill="${C.paper}"/><circle cx="100" cy="124" r="40.8" fill="none" stroke="#E7DFD4" stroke-width="2.4"/>
  <path d="M68 108 A34 34 0 0 1 106 91" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".95"/>
  ${(FACES[face]||FACES.happy)()}`;
}

function legs(xs, fill=C.dark){ return xs.map(x=>`<rect x="${x}" y="178" width="22" height="28" rx="10" fill="${fill}"/>`).join(''); }
const shadow = (cx=100, rx=54) => `<ellipse cx="${cx}" cy="208" rx="${rx}" ry="6.5" fill="${C.ink}" opacity=".09"/>`;
const hilite = (x0,y0) => `<path d="M${x0} ${y0+26} V${y0+14} Q${x0} ${y0} ${x0+14} ${y0} H${x0+24}" stroke="#fff" stroke-opacity=".38" stroke-width="5" fill="none" stroke-linecap="round"/>`;

/**
 * dot(opts) -> svg string
 * view: front | q34 | side | back ; face ; arms: {l:{a|to,front}, r:{...}} ; extras: [] ; behind/front: raw svg ; vb ; w,h
 */
function dot(o={}){
  const g = ++_gid, view=o.view||'front', face=o.face||'happy';
  const ex = (o.extras||[]).map(k=>X[k]||'').join('');
  const A = Object.assign({ l:{a:30}, r:{a:30} }, o.arms||{});
  let body='';
  if (view==='front' || view==='back'){
    const L = armPath(38,122,-1,A.l.a,A.l.to), R = armPath(162,122,1,A.r.a,A.r.to);
    body += (o.noShadow?'':shadow()) + (o.behind||'') + legs([68,110]) + (A.l.front?'':L) + (A.r.front?'':R) + antenna(100,o.droop);
    body += `<rect x="32" y="62" width="136" height="128" rx="26" fill="url(#b${g})"/>` + hilite(44,74);
    if (view==='front') body += door(g, face);
    else body += `<circle cx="100" cy="116" r="10.5" fill="${C.dark}"/><path d="M94 121 L106 121 L102.5 146 L97.5 146Z" fill="${C.dark}" stroke="${C.dark}" stroke-width="2" stroke-linejoin="round"/>`
      + [[50,80],[150,80],[50,172],[150,172]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.4" fill="${C.dark}"/>`).join('')
      + `<path d="M64 186 H136" stroke="${C.deep}" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>`;
    body += (A.l.front?L:'') + (A.r.front?R:'');
  } else if (view==='q34'){
    const L = armPath(44,122,-1,A.l.a,A.l.to), R = armPath(172,120,1,A.r.a,A.r.to);
    body += (o.noShadow?'':shadow(104,56)) + (o.behind||'') + legs([70],C.deep) + legs([116]) + (A.l.front?'':L) + (A.r.front?'':R) + antenna(110,o.droop);
    body += `<rect x="26" y="66" width="44" height="122" rx="22" fill="url(#s${g})"/>`;
    body += `<rect x="44" y="62" width="128" height="128" rx="25" fill="url(#b${g})"/>` + hilite(56,74);
    body += `<g transform="translate(110 124) scale(.9 1) translate(-100 -124)">${door(g,face)}</g>`;
    body += (A.l.front?L:'') + (A.r.front?R:'');
  } else if (view==='side'){
    const sa=A.r.a===30?22:A.r.a, sr=sa*Math.PI/180, shx=102+19*Math.sin(sr), shy=124+19*Math.cos(sr); const R = `<line x1="102" y1="124" x2="${shx}" y2="${shy}" stroke="${C.deep}" stroke-opacity=".55" stroke-width="23" stroke-linecap="round"/>`+armPath(102,124,1,sa);
    body += (o.noShadow?'':shadow(104,48)) + legs([92],C.deep) + legs([104]) + antenna(102,o.droop);
    body += `<rect x="58" y="62" width="88" height="128" rx="24" fill="url(#b${g})"/><rect x="58" y="62" width="88" height="128" rx="24" fill="#000" opacity=".07"/>` + hilite(70,74);
    body += `<rect x="141" y="72" width="13" height="104" rx="6.5" fill="${C.dark}"/><rect x="146" y="80" width="4" height="88" rx="2" fill="${C.paper}" opacity=".35"/>`;
    body += R;
  }
  const vb = o.vb || '0 0 200 240';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${o.w||200}" height="${o.h||240}" style="${o.style||''}">${defs(g)}${body}${ex}${o.front||''}</svg>`;
}

// ---------- props ----------
function receipt(x,y,w,h,rot=0,opts={}){
  const zig=[]; const n=Math.round(w/8); for(let i=0;i<=n;i++){ zig.push(`L${x+w-i*w/n} ${y+h-(i%2?4:0)}`); }
  return `<g transform="rotate(${rot} ${x+w/2} ${y+h/2})"><path d="M${x} ${y} H${x+w} V${y+h} ${zig.join(' ')} Z" fill="#fff" stroke="#E2DCD2" stroke-width="1.6"/>
  <rect x="${x+8}" y="${y+9}" width="${w*.45}" height="5" rx="2.5" fill="${C.ink}" opacity=".75"/>
  ${[0,1,2].map(i=>`<rect x="${x+8}" y="${y+22+i*9}" width="${w-16-(i%2)*14}" height="3.6" rx="1.8" fill="#CFC8BC"/>`).join('')}
  <text x="${x+8}" y="${y+58}" font-family="'JetBrains Mono'" font-weight="500" font-size="${w*.14}" fill="${C.ink}">Rs 2,450</text>
  ${opts.tick!==false?`<circle cx="${x+w-12}" cy="${y+h-16}" r="8.5" fill="${C.teal}"/><path d="M${x+w-16.5} ${y+h-16} L${x+w-13} ${y+h-12.5} L${x+w-7.5} ${y+h-19.5}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}</g>`;
}
function qr(x,y,s,rot=0){
  const cells=9, c=s/cells; let r=''; let seed=7;
  const rnd=()=>{seed=(seed*9301+49297)%233280; return seed/233280;};
  for(let i=0;i<cells;i++)for(let j=0;j<cells;j++){
    const corner=(i<3&&j<3)||(i>5&&j<3)||(i<3&&j>5); if(corner) continue;
    if(rnd()>.5) r+=`<rect x="${x+i*c}" y="${y+j*c}" width="${c}" height="${c}" fill="${C.ink}"/>`; }
  const fin=(fx,fy)=>`<rect x="${fx}" y="${fy}" width="${c*3}" height="${c*3}" fill="${C.ink}" rx="${c*.4}"/><rect x="${fx+c*.6}" y="${fy+c*.6}" width="${c*1.8}" height="${c*1.8}" fill="#fff" rx="${c*.25}"/><rect x="${fx+c}" y="${fy+c}" width="${c}" height="${c}" fill="${C.ink}"/>`;
  return `<g transform="rotate(${rot} ${x+s/2} ${y+s/2})"><rect x="${x-8}" y="${y-8}" width="${s+16}" height="${s+16}" rx="7" fill="#fff" stroke="#E2DCD2" stroke-width="1.6"/>${r}${fin(x,y)}${fin(x+6*c,y)}${fin(x,y+6*c)}</g>`;
}
function coin(cx,cy,r,g){ return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.amberD}"/><circle cx="${cx}" cy="${cy}" r="${r*.88}" fill="url(#cc)"/><circle cx="${cx}" cy="${cy}" r="${r*.72}" fill="none" stroke="${C.amberD}" stroke-width="3" opacity=".6"/><text x="${cx}" y="${cy+r*.2}" text-anchor="middle" font-family="'Plus Jakarta Sans'" font-weight="800" font-size="${r*.62}" fill="${C.amberD}">Rs</text><path d="M${cx-r*.55} ${cy-r*.35} A${r*.62} ${r*.62} 0 0 1 ${cx-r*.1} ${cy-r*.66}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`; }
const coinDefs = `<defs><radialGradient id="cc" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#FFD873"/><stop offset=".7" stop-color="#F2B33D"/><stop offset="1" stop-color="#DDA02A"/></radialGradient></defs>`;
