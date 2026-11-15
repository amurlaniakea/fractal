// SPDX-FileCopyrightText: 2026 Pedro Sordo Martínez <amurlaniakea@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later
// Mandelbrot Core - UI & I18N (Zero Dependencies)
const I18N={
  es:{title:"Motor de Fractales | Núcleo Matemático",type:"Tipo de Fractal",mandelbrot:"Mandelbrot",julia:"Julia",burning:"Burning Ship",tricorn:"Tricorn",celtic:"Celtic",buffalo:"Buffalo",custom:"Ecuación Propia",iter:"Iteraciones",zoom:"Nivel de Zoom",palette:"Paleta",eq:"Ecuación z = f(z, c)",eq_help:"Usa: add(z,c), mul(z,z), pow(z,2), sin(z), exp(z)",source:"Código Fuente (AGPL-3.0)",lang:"English",render:"Renderizar"},
  en:{title:"Fractal Engine | Mathematical Core",type:"Fractal Type",mandelbrot:"Mandelbrot",julia:"Julia Set",burning:"Burning Ship",tricorn:"Tricorn",celtic:"Celtic",buffalo:"Buffalo",custom:"Custom Equation",iter:"Iterations",zoom:"Zoom Level",palette:"Palette",eq:"Equation z = f(z, c)",eq_help:"Use: add(z,c), mul(z,z), pow(z,2), sin(z), exp(z)",source:"Source Code (AGPL-3.0)",lang:"Español",render:"Render"}
};
let currentLang='es';
const worker=new Worker('worker.js'), canvas=document.getElementById('fractalCanvas'), ctx=canvas.getContext('2d',{alpha:false});
const state={centerX:-0.5,centerY:0,zoom:1,maxIter:100,type:'mandelbrot',palette:'fuego',customExpr:'mul(z,z)+c'};
function translate(){
  const t=I18N[currentLang]; document.title=t.title;
  document.querySelectorAll('[data-key]').forEach(el=>{const k=el.getAttribute('data-key'); if(t[k]) el.textContent=t[k];});
  document.getElementById('langBtn').textContent=t.lang;
}
function render(){
  const rect=canvas.getBoundingClientRect(), w=rect.width, h=rect.height;
  canvas.width=w; canvas.height=h;
  const aspect=w/h, range=3.0/state.zoom;
  const msg={width:w,height:h,minX:state.centerX-range/2,maxX:state.centerX+range/2,minY:state.centerY-(range/aspect)/2,maxY:state.centerY+(range/aspect)/2,...state};
  if(state.type==='julia') msg.juliaC={r:-0.8,i:0.156};
  worker.postMessage(msg);
}
worker.onmessage=(e)=>{
  const img=new ImageData(new Uint8ClampedArray(e.data.data),canvas.width,canvas.height);
  ctx.putImageData(img,0,0);
};
document.getElementById('langBtn').onclick=(e)=>{e.stopPropagation();currentLang=currentLang==='es'?'en':'es';translate();};
document.getElementById('fractalType').onchange=(e)=>{state.type=e.target.value;document.getElementById('customBox').style.display=state.type==='custom'?'block':'none';render();};
document.getElementById('palette').onchange=(e)=>{state.palette=e.target.value;render();};
document.getElementById('maxIter').oninput=(e)=>{state.maxIter=+e.target.value;document.getElementById('iterVal').textContent=e.target.value;};
document.getElementById('zoom').oninput=(e)=>{state.zoom=+e.target.value;document.getElementById('zoomVal').textContent=e.target.value;};
document.getElementById('renderBtn').onclick=()=>{state.customExpr=document.getElementById('customExpr').value;render();};
canvas.onclick=(e)=>{
  const rect=canvas.getBoundingClientRect(), x=(e.clientX-rect.left)/rect.width, y=(e.clientY-rect.top)/rect.height;
  const range=3.0/state.zoom;
  state.centerX+=(x-0.5)*range; state.centerY+=(y-0.5)*(range/(canvas.width/canvas.height));
  state.zoom*=1.5; render();
};
window.addEventListener('resize',render);
translate(); render();
