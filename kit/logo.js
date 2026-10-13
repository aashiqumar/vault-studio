// Vault logo kit. Requires glyphs.js (GL). wordmark({dot:null}) draws the letters without the full stop (for the Dot lockup).
// All marks returned as SVG strings; fitAll() tightens viewBoxes in-browser.
const K = { rose:'#D91E5C', roseD:'#A3123F', ink:'#14151F', paper:'#F7F6F2', white:'#FFFFFF', tint:'#FCE7EE' };

// --- wordmark: Gelasio outlines + a true-circle full stop
function wordmark({ color=K.ink, dot=K.rose, style='serif', h=80, extra='' }={}){
  const g = style==='serif' ? GL.serif : GL.sans;
  const D = style==='serif' ? 17.5 : 19;            // dot diameter at 100u
  const gap = style==='serif' ? 3.5 : 4;
  const cx = g.width + gap + D/2, cy = -D/2;
  return `<svg class="fit" data-pad="0" height="${h}" xmlns="http://www.w3.org/2000/svg" viewBox="0 -80 300 84"><g><path d="${g.d}" fill="${color}"/>${dot ? `<circle cx="${cx}" cy="${cy}" r="${D/2}" fill="${dot}"/>` : ''}${extra}</g></svg>`;
}

// --- the "V." monogram, fit to a box (in 1024 tile units)
function vdot(color, dot, x=0, y=0, s=1){
  const g = GL.serifV; const D = 21;
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${g.d}" fill="${color}"/><circle cx="${g.width+2.5+D/2}" cy="${-D/2}" r="${D/2}" fill="${dot}"/></g>`;
}
const TILE = (fill, inner, sz, opts={}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 1024 1024">${opts.defs||''}
  ${opts.circle ? `<circle cx="512" cy="512" r="512" fill="${fill}"/>` : opts.bare ? '' : `<rect width="1024" height="1024" rx="${opts.rx??230}" fill="${fill}"/>`}${inner}</svg>`;

// Symbol A — "V." monogram. V cap height ~70u → scale so V ≈ 500px tall.
function iconV({ bg=K.rose, v=K.white, dot=K.ink, sz=256, circle=false, bare=false }={}){
  const s = 7.1, b = GL.serifV.bb, D = 21;           // centre the V + dot bounding box in the tile
  const x0 = b[0], x1 = GL.serifV.width + 2.5 + D, y0 = b[1], y1 = b[3];
  const x = 512 - s*(x0+x1)/2, y = 512 - s*(y0+y1)/2 + 6;
  return TILE(bg, vdot(v, dot, x, y, s), sz, { circle, bare });
}
// Symbol B — "The Door": vault door ring + dial ticks + centre dot
function iconDoor({ bg=K.rose, ring=K.roseD, face=K.paper, dot=K.rose, sz=256, circle=false }={}){
  let ticks=''; for(let i=0;i<16;i++){ const t=i/16*Math.PI*2; ticks+=`<line x1="${512+300*Math.cos(t)}" y1="${512+300*Math.sin(t)}" x2="${512+326*Math.cos(t)}" y2="${512+326*Math.sin(t)}" stroke="${face}" stroke-opacity=".55" stroke-width="14" stroke-linecap="round"/>`; }
  return TILE(bg, `<circle cx="512" cy="512" r="352" fill="${ring}"/>${ticks}<circle cx="512" cy="512" r="268" fill="${face}"/><circle cx="512" cy="512" r="92" fill="${dot}"/>`, sz, { circle });
}
// Symbol C — "Dial V": ring with a V-notch at the top, dot as the knob
function iconDial({ bg=K.ink, ring=K.white, dot=K.rose, sz=256, circle=false }={}){
  return TILE(bg, `<circle cx="512" cy="540" r="290" fill="none" stroke="${ring}" stroke-width="78"/>
   <path d="M402 160 L622 160 L512 330 Z" fill="${bg}"/><path d="M452 196 L572 196 L512 290 Z" fill="${dot}"/>
   <circle cx="512" cy="540" r="96" fill="${dot}"/>`, sz, { circle });
}

// tighten every svg.fit to its content bbox (keeps declared height)
function fitAll(root=document){
  root.querySelectorAll('svg.fit').forEach(svg=>{
    const b = svg.querySelector('g').getBBox(); const p = +(svg.dataset.pad||0);
    svg.setAttribute('viewBox', `${b.x-p} ${b.y-p} ${b.width+2*p} ${b.height+2*p}`);
    const h = +svg.getAttribute('height'); svg.setAttribute('width', (h*(b.width+2*p)/(b.height+2*p)).toFixed(1));
  });
}

// Symbol D — modern "v." (pairs with the sans wordmark)
function iconVsans({ bg=K.rose, v=K.white, dot=K.ink, sz=256, circle=false }={}){
  const g=GL.sansV, s=9.4, D=19, b=g.bb, x1=g.width+4+D, x=512-s*(b[0]+x1)/2, y=512-s*(b[1]+b[3])/2;
  return TILE(bg, `<g transform="translate(${x} ${y}) scale(${s})"><path d="${g.d}" fill="${v}"/><circle cx="${g.width+4+D/2}" cy="${-D/2}" r="${D/2}" fill="${dot}"/></g>`, sz, { circle });
}
