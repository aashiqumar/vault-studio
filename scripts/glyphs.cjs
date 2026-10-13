// Regenerates kit/glyphs.js (logo letter outlines) from the bundled fonts.  Usage: node scripts/glyphs.cjs
const path=require('path'); const ROOT=path.resolve(__dirname,'..');
const ot=require(ROOT+'/node_modules/opentype.js');
const F=ROOT+'/node_modules/@fontsource/';
const fs=require('fs');
function word(fontFile,text,size,track){ // returns {d, width, ascent} baseline at y=0
  const f=ot.loadSync(F+fontFile); let x=0; let d=''; const glyphs=f.stringToGlyphs(text);
  glyphs.forEach((g,i)=>{ const p=g.getPath(x,0,size); d+=p.toPathData(2); x+=g.advanceWidth*size/f.unitsPerEm + track*size;
    if(i<glyphs.length-1) x+=f.getKerningValue(g,glyphs[i+1])*size/f.unitsPerEm; });
  const P=new ot.Path(); P.commands=[]; glyphs.reduce((xx,g,i)=>{const gp=g.getPath(xx,0,size); P.commands.push(...gp.commands); return xx+g.advanceWidth*size/f.unitsPerEm+track*size+(i<glyphs.length-1?f.getKerningValue(g,glyphs[i+1])*size/f.unitsPerEm:0);},0);
  const b=P.getBoundingBox(); return {d, width:x-track*size, bb:[b.x1,b.y1,b.x2,b.y2].map(v=>+v.toFixed(2))};
}
const out={
  serif: word('gelasio/files/gelasio-latin-700-normal.woff','Vault',100,-0.04),
  serifV: word('gelasio/files/gelasio-latin-700-normal.woff','V',100,0),
  sans: word('plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff','vault',100,-0.05),
  sansV: word('plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff','v',100,0),
};
fs.writeFileSync(ROOT+'/kit/glyphs.js','const GL='+JSON.stringify(out)+';');
console.log(Object.entries(out).map(([k,v])=>k+':'+v.width.toFixed(1)).join(' '));
