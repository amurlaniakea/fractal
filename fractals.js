// SPDX-FileCopyrightText: 2026 Pedro Sordo Martínez <amurlaniakea@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

const I1xN = {
  es: { title: "Motor de Fractales", type: "Tipo de Fractal", mandelbrot: "Mandelbrot", julia: "Julia", burning: "Burning Ship", tricorn: "Tricorn", celtic: "Celtic", buffalo: "Buffalo", iter: "Iteraciones", zoom: "Nivel de Zoom", palette: "Paleta", lang: "English", render: "Renderizar" },
  en: { title: "Fractal Engine", type: "Fractal Type", mandelbrot: "Mandelbrot", julia: "Julia", burning: "Burning Ship", tricorn: "Tricorn", celtic: "Celtic", buffalo: "Buffalo", iter: "Iterations", zoom: "Zoom Level", palette: "Palette", lang: "Español", render: "Render" }
};

let currentLang = 'es';
const worker = new Worker('worker.js');
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const container = document.getElementById('canvas-container');

const state = { centerX: -0.5, centerY: 0, zoom: 1, maxIter: 100, type: 'mandelbrot', palette: 'fuego' };
let currentWidth = 0;
let currentHeight = 0;
let renderPending = false;
let renderTimeout = null;

function translate() {
  const t = I1xN[currentLang];
  document.title = t.title;
  document.querySelectorAll('[data-key]').forEach(el => {
    const k = el.getAttribute('data-key');
    if (t[k]) el.textContent = t[k];
  });
  document.getElementById('langBtn').textContent = t.lang;
}

function resizeCanvas() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return false;
  if (w !== currentWidth || h !== currentHeight) {
    currentWidth = w;
    currentHeight = h;
    canvas.width = w;
    canvas.height = h;
    return true;
  }
  return false;
}

function render() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    const w = currentWidth;
    const h = currentHeight;
    if (w === 0 || h === 0) return;
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
  });
}

worker.onmessage = (e) => {
  const img = new ImageData(new Uint8ClampedArray(e.data.data), canvas.width, canvas.height);
  ctx.putImageData(img, 0, 0);
};

const resizeObserver = new ResizeObserver(() => {
  if (resizeCanvas()) render();
});
resizeObserver.observe(container);

document.getElementById('langBtn').onclick = () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  translate();
};

document.getElementById('fractalType').onchange = (e) => { state.type = e.target.value; render(); };
document.getElementById('palette').onchange = (e) => { state.palette = e.target.value; render(); };

document.getElementById('maxIter').oninput = (e) => { 
  state.maxIter = parseInt(e.target.value); 
  document.getElementById('iterVal').textContent = e.target.value; 
};
document.getElementById('maxIter').onchange = () => render();

const zoomSlider = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');

function updateZoomUI() {
  const displayZoom = Math.min(1000, Math.round(state.zoom));
  zoomSlider.value = displayZoom;
  zoomVal.textContent = displayZoom;
}

zoomSlider.oninput = (e) => {
  state.zoom = parseFloat(e.target.value);
  updateZoomUI();
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(render, 150);
};

let touchStartDist = 0;
let touchStartZoom = 1;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    touchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    touchStartZoom = state.zoom;
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    state.zoom = Math.max(1, Math.min(10000, touchStartZoom * (dist / touchStartDist)));
    updateZoomUI();
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(render, 50);
  }
}, { passive: false });

document.getElementById('renderBtn').onclick = () => render();

translate();
resizeCanvas();
render();