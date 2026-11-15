// SPDX-FileCopyrightText: 2026 Pedro Sordo Martínez <amurlaniakea@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later
const I18N = {
  es: { title: "Motor de Fractales", type: "Tipo de Fractal", mandelbrot: "Mandelbrot", julia: "Julia", burning: "Burning Ship", tricorn: "Tricorn", celtic: "Celtic", buffalo: "Buffalo", iter: "Iteraciones", zoom: "Nivel de Zoom", palette: "Paleta", lang: "English", render: "Renderizar" },
  en: { title: "Fractal Engine", type: "Fractal Type", mandelbrot: "Mandelbrot", julia: "Julia", burning: "Burning Ship", tricorn: "Tricorn", celtic: "Celtic", buffalo: "Buffalo", iter: "Iterations", zoom: "Zoom Level", palette: "Palette", lang: "Español", render: "Render" }
};
let currentLang = 'es';
const worker = new Worker('worker.js');
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const container = document.getElementById('canvas-container');
const state = { centerX: -0.5, centerY: 0, zoom: 1, maxIter: 100, type: 'mandelbrot', palette: 'fuego' };

function translate() {
  const t = I18N[currentLang];
  document.title = t.title;
  document.querySelectorAll('[data-key]').forEach(el => {
    const k = el.getAttribute('data-key');
    if (t[k]) el.textContent = t[k];
  });
  document.getElementById('langBtn').textContent = t.lang;
}

function render() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return;
  
  canvas.width = w;
  canvas.height = h;
  
  const aspect = w / h;
  const range = 3.0 / state.zoom;
  
  worker.postMessage({
    width: w, height: h,
    minX: state.centerX - range / 2,
    maxX: state.centerX + range / 2,
    minY: state.centerY - (range / aspect) / 2,
    maxY: state.centerY + (range / aspect) / 2,
    maxIter: state.maxIter,
    type: state.type,
    palette: state.palette,
    juliaC: state.type === 'julia' ? { r: -0.8, i: 0.156 } : null
  });
}

worker.onmessage = (e) => {
  const img = new ImageData(new Uint8ClampedArray(e.data.data), canvas.width, canvas.height);
  ctx.putImageData(img, 0, 0);
};

// SOLUCIÓN DEFINITIVA: ResizeObserver detecta cambios reales en el cuadro, no en la ventana
const resizeObserver = new ResizeObserver(() => {
  requestAnimationFrame(render);
});
resizeObserver.observe(container);

document.getElementById('langBtn').onclick = () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  translate();
};
document.getElementById('fractalType').onchange = (e) => { state.type = e.target.value; render(); };
document.getElementById('palette').onchange = (e) => { state.palette = e.target.value; render(); };
document.getElementById('maxIter').oninput = (e) => { state.maxIter = parseInt(e.target.value); document.getElementById('iterVal').textContent = e.target.value; };
let zoomTimeout;
document.getElementById('zoom').oninput = (e) => { state.zoom = parseFloat(e.target.value); document.getElementById('zoomVal').textContent = e.target.value; clearTimeout(zoomTimeout); zoomTimeout = setTimeout(render, 150); };
document.getElementById('renderBtn').onclick = () => render();
canvas.onmousedown = (e) => {
  canvas.style.cursor = "grabbing";
  const startX = e.clientX;
  const startY = e.clientY;
  const startCenterX = state.centerX;
  const startCenterY = state.centerY;
  const range = 3.0 / state.zoom;
  const aspect = canvas.width / canvas.height;

  const onMove = (ev) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    state.centerX = startCenterX - (dx / canvas.width) * range;
    state.centerY = startCenterY - (dy / canvas.height) * (range / aspect);
    render();
  };

  const onUp = () => {
    canvas.style.cursor = "grab";
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

canvas.onwheel = (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const range = 3.0 / state.zoom;
  const aspect = canvas.width / canvas.height;
  const worldX = state.centerX + (mouseX / canvas.width - 0.5) * range;
  const worldY = state.centerY + (mouseY / canvas.height - 0.5) * (range / aspect);

  const zoomFactor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
  state.zoom *= zoomFactor;

  const newRange = 3.0 / state.zoom;
  state.centerX = worldX - (mouseX / canvas.width - 0.5) * newRange;
  state.centerY = worldY - (mouseY / canvas.height - 0.5) * (newRange / aspect);

  render();
};

translate();
render();
document.getElementById('renderBtn').onclick = () => render();
document.getElementById('maxIter').onchange = () => render();
document.getElementById('zoom').onchange = () => render();
