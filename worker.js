// SPDX-FileCopyrightText: 2026 Pedro Sordo Martínez <amurlaniakea@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later
// Mandelbrot Core - Worker Thread (Zero Dependencies)
const C = {
  add: (a, b) => ({ r: a.r + b.r, i: a.i + b.i }),
  sub: (a, b) => ({ r: a.r - b.r, i: a.i - b.i }),
  mul: (a, b) => ({ r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r }),
  div: (a, b) => { const d = b.r*b.r + b.i*b.i; return { r:(a.r*b.r+a.i*b.i)/d, i:(a.i*b.r-a.r*b.i)/d }; },
  pow: (z, n) => { if (n===0) return {r:1,i:0}; let r=z; for(let i=1;i<n;i++) r=C.mul(r,z); return r; },
  mag: (z) => Math.sqrt(z.r*z.r + z.i*z.i),
  exp: (z) => { const e=Math.exp(z.r); return {r:e*Math.cos(z.i), i:e*Math.sin(z.i)}; },
  sin: (z) => ({r:Math.sin(z.r)*Math.cosh(z.i), i:Math.cos(z.r)*Math.sinh(z.i)}),
  cos: (z) => ({r:Math.cos(z.r)*Math.cosh(z.i), i:-Math.sin(z.r)*Math.sinh(z.i)})
};
let customFn = null;
function compileCustom(expr) {
  try {
    if (/\b(window|document|eval|Function|fetch|import|require|process)\b/.test(expr)) throw new Error("Blocked");
    customFn = null; // SECURITY: dynamic evaluation disabled
    return false;
  } catch(e){ return false; }
}
function iterate(zr,zi,cr,ci,maxIter,type,juliaC){
  let z={r:zr,i:zi}, c=(type==='julia')?juliaC:{r:cr,i:ci}, iter=0;
  while(z.r*z.r+z.i*z.i<=4 && iter<maxIter){
    if(type==='mandelbrot') z={r:z.r*z.r-z.i*z.i+c.r, i:2*z.r*z.i+c.i};
    else if(type==='julia') z={r:z.r*z.r-z.i*z.i+c.r, i:2*z.r*z.i+c.i};
    else if(type==='burningship') z={r:z.r*z.r-z.i*z.i+c.r, i:Math.abs(2*z.r*z.i)+c.i};
    else if(type==='tricorn') z={r:z.r*z.r-z.i*z.i+c.r, i:-2*z.r*z.i+c.i};
    else if(type==='celtic') z={r:Math.abs(z.r*z.r-z.i*z.i)+c.r, i:2*z.r*z.i+c.i};
    else if(type==='buffalo') z={r:Math.abs(z.r*z.r-z.i*z.i)+c.r, i:Math.abs(2*z.r*z.i)+c.i};
    else if(type==='custom' && customFn){ try{z=customFn(z,c,C);}catch(e){break;} }
    iter++;
  }
  if(iter<maxIter){ const ln=Math.log(z.r*z.r+z.i*z.i)/2, nu=Math.log(ln/Math.log(2))/Math.log(2); return iter+1-nu; }
  return maxIter;
}
function getColor(val,maxIter,palette){
  if(val>=maxIter) return [0,0,0];
  const t=val/maxIter;
  const p={
    fuego:(t)=>[Math.min(255,255*t*3),Math.min(255,255*Math.max(0,t*3-1)),Math.min(255,255*Math.max(0,t*3-2))],
    hielo:(t)=>[Math.sin(t*5)*127+128,Math.sin(t*5+2)*127+128,255],
    neon:(t)=>[Math.sin(t*10)*255,Math.sin(t*10+2)*255,Math.sin(t*10+4)*255],
    oceano:(t)=>[0,Math.min(255,100+155*t),Math.min(255,200+55*t)],
    bosque:(t)=>[Math.min(255,100*t),Math.min(255,150+105*t),Math.min(255,50*t)],
    academico:(t)=>[Math.sin(t*3.14)*255,100,255-Math.sin(t*3.14)*255]
  };
  return p[palette](t).map(v=>Math.max(0,Math.min(255,v)));
}
self.onmessage=(e)=>{
  const {width,height,minX,maxX,minY,maxY,maxIter,type,juliaC,palette,customExpr}=e.data;
  if(type==='custom' && customExpr) compileCustom(customExpr);
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      const cr=minX+(x/width)*(maxX-minX), ci=maxY-(y/height)*(maxY-minY);
      const zr=(type==='julia')?cr:0, zi=(type==='julia')?ci:0;
      const val=iterate(zr,zi,cr,ci,maxIter,type,juliaC);
      const [r,g,b]=getColor(val,maxIter,palette);
      const idx=(y*width+x)*4;
      data[idx]=r; data[idx+1]=g; data[idx+2]=b; data[idx+3]=255;
    }
  }
  self.postMessage({data:data.buffer,width,height,__rid:e.data.__rid},[data.buffer]);
};
