// SPDX-FileCopyrightText: 2026 Pedro Sordo Martínez <amurlaniakea@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

const I18N = {
  es: { title: "Motor de Fractales", type: "Tipo de Fractal", mandelbrot: "Mandelbrot", julia: "Julia", burning: "Burning Ship", tricorn: "Tricorn", celtic: "Celtic", buffalo: "Buffalo", multibrot3: "Multibrot z^3", multibrot4: "Multibrot z^4", phoenix: "Phoenix", multibrot5: "Multibrot z^5", multibrot6: "Multibrot z^6", iter: "Iteraciones", zoom: "Nivel de Zoom", palette: "Paleta", lang: "English", render: "Renderizar" },
  en: { title: "Fractal Engine", type: "Fractal Type", mandelbrot: "Mandelbrot", julia: "Julia", burning: "Burning Ship", tricorn: "Tricorn", celtic: "Celtic", buffalo: "Buffalo", multibrot3: "Multibrot z^3", multibrot4: "Multibrot z^4", phoenix: "Phoenix", multibrot5: "Multibrot z^5", multibrot6: "Multibrot z^6", iter: "Iterations", zoom: "Zoom Level", palette: "Palette", lang: "Español", render: "Render" }
};

let currentLang = 'es';
const worker = new Worker('worker.js');
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const container = document.getElementById('canvas-container');

// Estado inicial seguro y acotado
const state = { centerX: -0.743643887037151, centerY: 0.13182590420533, zoom: 1, maxIter: 300, type: "mandelbrot", palette: "fuego", juliaRe: -0.8, juliaIm: 0.156, phoenixP: 0.5 };

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
      juliaC: (state.type === 'julia' || state.type === 'phoenix') ? { r: state.juliaRe, i: state.juliaIm } : null,
    phoenixP: state.type === 'phoenix' ? state.phoenixP : 0.5
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
  if (!slider || !label) return;
  let timer = null;
  const clamp = (z) => Math.max(1, Math.min(100, Number(z) || 1));
  const sync = () => {
    slider.value = clamp(state.zoom);
    if (label) label.textContent = slider.value;
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

// Fix: vistas por defecto según tipo de fractal
(function () {
  const DEFAULT_VIEWS = {
    mandelbrot: { centerX: -0.743643887037151, centerY: 0.13182590420533, zoom: 1, maxIter: 300 },
    julia: { centerX: 0, centerY: 0, zoom: 1, maxIter: 300 },
    burningship: { centerX: -0.5, centerY: -0.5, zoom: 1, maxIter: 300 },
    tricorn: { centerX: 0, centerY: 0, zoom: 1, maxIter: 300 },
    celtic: { centerX: 0, centerY: 0, zoom: 1, maxIter: 300 },
    buffalo: { centerX: 0, centerY: 0, zoom: 1, maxIter: 300 },
    multibrot3: { centerX: 0, centerY: 0, zoom: 2, maxIter: 350 },
    multibrot4: { centerX: 0, centerY: 0, zoom: 2, maxIter: 350 },
    multibrot5: { centerX: 0, centerY: 0, zoom: 2, maxIter: 300 },
    multibrot6: { centerX: 0, centerY: 0, zoom: 2, maxIter: 300 },
    phoenix: { centerX: 0, centerY: 0, zoom: 1, maxIter: 350 }
  };

  function syncControls() {
    const zoomSlider = document.getElementById('zoom');
    const zoomVal = document.getElementById('zoomVal');
    const iterSlider = document.getElementById('maxIter');
    const iterVal = document.getElementById('iterVal');

    if (zoomSlider) {
      zoomSlider.value = Math.max(1, Math.min(100, Math.round(state.zoom)));
    }

    if (zoomVal) {
      zoomVal.textContent = zoomSlider ? zoomSlider.value : Math.round(state.zoom);
    }

    if (iterSlider) {
      iterSlider.value = state.maxIter;
    }

    if (iterVal) {
      iterVal.textContent = state.maxIter;
    }
  }

  window.resetViewForType = function (type) {
    const v = DEFAULT_VIEWS[type] || { centerX: 0, centerY: 0, zoom: 1, maxIter: 300 };

    state.centerX = v.centerX;
    state.centerY = v.centerY;
    state.zoom = v.zoom;
    state.maxIter = v.maxIter;

    syncControls();
  };

  const typeSelect = document.getElementById('fractalType');

  if (typeSelect) {
    typeSelect.onchange = function (e) {
      state.type = e.target.value;
      resetViewForType(state.type);
      render();
    };
  }

  // Aplicar vista correcta desde la primera carga
  resetViewForType(state.type);
})();

// Fix: repaint after default view reset
render();
// Fix: Julia c and Phoenix P controls
(function () {
  const juliaParams = document.getElementById('juliaParams');
  const phoenixParams = document.getElementById('phoenixParams');
  const juliaRe = document.getElementById('juliaRe');
  const juliaIm = document.getElementById('juliaIm');
  const phoenixP = document.getElementById('phoenixP');
  const juliaReVal = document.getElementById('juliaReVal');
  const juliaImVal = document.getElementById('juliaImVal');
  const phoenixPVal = document.getElementById('phoenixPVal');

  function syncParamLabels() {
    if (juliaReVal) juliaReVal.textContent = state.juliaRe;
    if (juliaImVal) juliaImVal.textContent = state.juliaIm;
    if (phoenixPVal) phoenixPVal.textContent = state.phoenixP;
  }

  function showParamsForType() {
    if (juliaParams) juliaParams.hidden = !(state.type === 'julia' || state.type === 'phoenix');
    if (phoenixParams) phoenixParams.hidden = state.type !== 'phoenix';
  }

  function bindNumber(input, key) {
    if (!input) return;

    input.oninput = () => {
      const v = parseFloat(input.value);
      if (Number.isFinite(v)) {
        state[key] = v;
      }
      syncParamLabels();
    };

    input.onchange = () => render();
  }

  bindNumber(juliaRe, 'juliaRe');
  bindNumber(juliaIm, 'juliaIm');
  bindNumber(phoenixP, 'phoenixP');

  const typeSelect = document.getElementById('fractalType');

  if (typeSelect) {
    const originalOnchange = typeSelect.onchange;

    typeSelect.onchange = function (e) {
      if (typeof originalOnchange === 'function') {
        originalOnchange.call(this, e);
      }

      showParamsForType();
      syncParamLabels();
    };
  }

  if (juliaRe) juliaRe.value = state.juliaRe;
  if (juliaIm) juliaIm.value = state.juliaIm;
  if (phoenixP) phoenixP.value = state.phoenixP;

  showParamsForType();
  syncParamLabels();
})();
// Fix: remove zoom accessor hack and install one final zoom handler
try {
  const currentZoom = Number(state.zoom) || 1;
  delete state.zoom;
  state.zoom = Math.max(1, Math.min(100, currentZoom));
} catch (e) {
  console.warn('zoom cleanup failed', e);
}

(function () {
  const slider = document.getElementById('zoom');
  const label = document.getElementById('zoomVal');
  if (!slider) return;

  let timer = null;

  const clamp = (z) => Math.max(1, Math.min(100, Number(z) || 1));

  const sync = () => {
    state.zoom = clamp(state.zoom);
    slider.value = Math.round(state.zoom);
    if (label) label.textContent = slider.value;
  };

  slider.oninput = (e) => {
    state.zoom = clamp(e.target.value);
    sync();
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  };

  sync();
})();
// Fix final: normalizar zoom, evitar cola del worker y asegurar Renderizar
try {
  const currentZoom = Number(state.zoom) || 1;
  delete state.zoom;
  state.zoom = Math.max(1, Math.min(100, currentZoom));
} catch (e) {
  console.warn('No se pudo normalizar state.zoom', e);
}

(function () {
  const slider = document.getElementById('zoom');
  const label = document.getElementById('zoomVal');
  if (!slider) return;

  let timer = null;
  const clamp = (z) => Math.max(1, Math.min(100, Number(z) || 1));

  const sync = () => {
    state.zoom = clamp(state.zoom);
    slider.value = Math.round(state.zoom);
    if (label) label.textContent = slider.value;
  };

  slider.oninput = (e) => {
    state.zoom = clamp(e.target.value);
    sync();
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  };

  sync();
})();

(function () {
  let workerBusy = false;
  let pendingRender = false;

  const originalPostMessage = worker.postMessage.bind(worker);

  worker.postMessage = function (message) {
    workerBusy = true;
    try {
      return originalPostMessage(message);
    } catch (e) {
      workerBusy = false;
      throw e;
    }
  };

  const previousOnMessage = worker.onmessage;

  worker.onmessage = function (event) {
    try {
      if (typeof previousOnMessage === 'function') {
        previousOnMessage.call(this, event);
      }
    } finally {
      workerBusy = false;

      if (pendingRender) {
        pendingRender = false;
        render();
      }
    }
  };

  worker.onerror = function (event) {
    workerBusy = false;
    pendingRender = false;
    console.error('Worker error:', event && event.message ? event.message : event);
  };

  const originalRender = render;

  render = function () {
    if (workerBusy) {
      pendingRender = true;
      return;
    }

    originalRender();
  };

  const btn = document.getElementById('renderBtn');

  if (btn) {
    btn.onclick = function () {
      console.log('Renderizar pulsado:', state.type, 'zoom', state.zoom, 'iter', state.maxIter);
      render();
    };
  }
})();
