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

// Estado inicial seguro y acotado
const state = { centerX: -0.743643887037151, centerY: 0.13182590420533, zoom: 1, maxIter: 300, type: "mandelbrot", palette: "fuego" };

let currentWidth = 0;
let currentHeight = 0;
let renderPending = false;
let renderTimeout = null;

function translate() {
  const t = I18N[currentLang];
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
    if (currentWidth === 0 || currentHeight === 0) return;
    
    const aspect = currentWidth / currentHeight;
    const range = 3.0 / state.zoom;
    
    worker.postMessage({
      width: currentWidth,
      height: currentHeight,
      minX: state.centerX - range / 2,
      maxX: state.centerX + range / 2,
      minY: state.centerY - (range / aspect) / 2,
      maxY: state.centerY + (range / aspect) / 2,
      maxIter: Math.min(2000, Math.max(state.maxIter, Math.floor(100 + 120 * Math.log2(Math.max(1, state.zoom))))),
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

// Controles de UI
document.getElementById('langBtn').onclick = () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  translate();
};

document.getElementById('fractalType').onchange = (e) => { state.type = e.target.value; render(); };
document.getElementById('palette').onchange = (e) => { state.palette = e.target.value; render(); };

document.getElementById('maxIter').oninput = (e) => { 
  state.maxIter = parseInt(e.target.value) || 100; 
  document.getElementById('iterVal').textContent = e.target.value; 
};
document.getElementById('maxIter').onchange = () => render();

// CORRECCIÓN CRÍTICA DEL ZOOM: Sincronización y acotamiento estricto
const zoomSlider = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');

function updateZoomUI() {
  // Acotar el zoom entre 1 y 1000 para evitar saltos a infinito o cero
  state.zoom = Math.max(1, Math.min(1000, state.zoom));
  const displayZoom = Math.round(state.zoom);
  zoomSlider.value = displayZoom;
  zoomVal.textContent = displayZoom;
}

zoomSlider.oninput = (e) => {
  // Leer el valor de forma segura, evitando NaN
  let val = parseFloat(e.target.value);
  if (isNaN(val)) val = 1;
  state.zoom = val;
  updateZoomUI();
  
  // Debounce para que no se sature al deslizar el dedo
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(render, 150);
};

document.getElementById('renderBtn').onclick = () => render();

// Inicialización segura
translate();
resizeCanvas();
updateZoomUI(); // Asegura que el slider y el estado coincidan al cargar
render();

// Fix: zoom seguro (clamp + debounce)
(()=>{
  const slider = document.getElementById("zoom");
  const label = document.getElementById("zoomVal");
  let timer = null;
  const clamp = (z) => Math.max(1, Math.min(100, Number(z) || 1));
  const sync = () => {
    slider.value = clamp(state.zoom);
    label.textContent = slider.value;
  };
  slider.oninput = (e) => {
    state.zoom = clamp(e.target.value);
    sync();
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  };
  sync();
})();

// Fix: límite duro de zoom para interfaz táctil.
// Evita saltos bruscos a zonas sin detalle o interiores negros.
(function () {
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 100;

  let zoomValue = Number(state.zoom) || MIN_ZOOM;
  zoomValue = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomValue));

  Object.defineProperty(state, 'zoom', {
    configurable: true,
    enumerable: true,
    get() {
      return zoomValue;
    },
    set(value) {
      const n = Number(value);
      zoomValue = Number.isFinite(n)
        ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, n))
        : MIN_ZOOM;
    }
  });
})();

// Fix: descarta respuestas antiguas del worker.
// Si llega un fotograma viejo, se ignora visualmente.
(function () {
  let latestRid = 0;

  const originalPostMessage = worker.postMessage.bind(worker);

  worker.postMessage = function (message) {
    message = message || {};
    message.__rid = ++latestRid;
    return originalPostMessage(message);
  };

  const originalOnMessage = worker.onmessage;

  worker.onmessage = function (event) {
    const rid = event && event.data && event.data.__rid;

    // Si el worker ya devuelve id, ignoramos fotogramas obsoletos.
    if (typeof rid === 'number' && rid !== latestRid) {
      return;
    }

    if (typeof originalOnMessage === 'function') {
      return originalOnMessage.call(this, event);
    }
  };
})();
window.addEventListener('load', () => { resizeCanvas(); render(); });
