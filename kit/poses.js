// Dot pose kit — depends on dot.js. pose(name, width, {dark}) -> svg string sized to width.
FACES.focusR = () => eyeOpen(85,117,3,0)+eyeOpen(115,117,3,0)+cheeks()+stroke('M93 132 Q101 139 109 131');
FACES.lookL  = () => eyeOpen(85,118,-3,2)+eyeOpen(115,118,-3,2)+cheeks()+stroke('M91 133 Q99 140 107 132');
FACES.lookR  = () => eyeOpen(85,117,3.5,-1)+eyeOpen(115,117,3.5,-1)+cheeks(.65)+stroke('M92 131 Q101 140 109 130');
FACES.lookUp = () => eyeOpen(85,117,0,-3)+eyeOpen(115,117,0,-3)+cheeks()+stroke('M92 132 Q100 140 108 132');

function pose(name, w, opt={}){
  const lc = opt.dark ? '#FFFFFF' : '#14151F';
  const waveLines = `<path d="M190 86 q8 8 6 20 M199 78 q12 12 9 30" stroke="${lc}" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const hand = (x,y) => `<circle cx="${x}" cy="${y}" r="10.6" fill="#CC1A55"/><circle cx="${x-2.5}" cy="${y-3}" r="3" fill="#fff" opacity=".18"/>`;
  const P = {
    wave:     { face:'wink', vb:'-10 0 230 240', arms:{r:{a:155,front:true}}, front: waveLines },
    waveSpark:{ face:'wink', vb:'-20 -10 240 250', arms:{r:{a:155,front:true}}, front: waveLines+star(18,40,9,'#1F8A70')+star(205,30,6,'#F2B33D')+star(0,120,5,'#7B6FF0') },
    receipt:  { face:'balanced', vb:'-15 0 265 245', arms:{r:{a:128,front:true},l:{a:34}}, extras:['sparkles'], front: receipt(168,40,62,84,12)+hand(177.5,134) },
    scan:     { face:'focusR', vb:'-10 0 300 245', arms:{r:{a:92,front:true}},
                front:`<path d="M206 112 L238 98 L238 146 L206 122Z" fill="#1F8A70" opacity=".25"/>`+qr(242,100,40,6)+
                `<rect x="172" y="104" width="38" height="24" rx="6" fill="#5446D0"/><rect x="204" y="108" width="6" height="16" rx="2" fill="#7FE3C4"/><rect x="178" y="125" width="12" height="20" rx="4" fill="#3F33A8"/>`+hand(181,121) },
    clipboard:{ face:'lookL', vb:'-40 0 260 245', arms:{l:{to:[30,152],front:true},r:{a:62,front:true}},
                behind:`<g transform="rotate(-8 6 154)"><rect x="-24" y="112" width="58" height="80" rx="6" fill="#5446D0"/><rect x="-18" y="122" width="46" height="64" rx="3" fill="#fff"/><rect x="-4" y="106" width="18" height="10" rx="3" fill="#3F33A8"/>${[0,1,2].map(i=>`<path d="M-13 ${136+i*16} l4 4 l7 -8" stroke="#1F8A70" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="${135+i*16}" width="20" height="4" rx="2" fill="#CFC8BC"/>`).join('')}</g>`,
                front:`<g transform="rotate(-35 186 120)"><rect x="181" y="96" width="10" height="40" rx="2" fill="#F2B33D"/><path d="M181 136 L186 146 L191 136Z" fill="#F1D9B0"/><rect x="181" y="92" width="10" height="7" rx="2" fill="#F38BAE"/></g>`+hand(178.8,131) },
    worried:  { face:'worried', extras:['sweat','flyReceipt'] },
    thinking: { face:'thinking', extras:['glow','thought','spin'] },
    proud:    { face:'proud', extras:['badge'] },
    party:    { face:'party', vb:'0 0 200 240', extras:['hat','confetti'], arms:{l:{a:150,front:true},r:{a:150,front:true}} },
    balanced: { face:'balanced', extras:['tick','sparkles'] },
    happy:    { face:'happy' },
    point:    { face:'lookR', arms:{r:{a:100,front:true}} },
    peek:     { face:'lookUp', noShadow:true },
  };
  const o = Object.assign({}, P[name], opt.over||{});
  if (opt.noShadow) o.noShadow = true;
  const vb = (o.vb||'0 0 200 240').split(' ').map(Number);
  return dot(Object.assign(o, { w, h: Math.round(w*vb[3]/vb[2]), style: opt.style||'' }));
}
