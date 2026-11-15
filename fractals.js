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
const state = { centerX: -0.5, centerY: 0, zoom: 1, maxIter: 100, type: 'mandelbrot', palette: 'fuego' };

function translate() {
  const t = I18N[currentLang];
  document.title = t.title;
  document.querySelectorAll('option, label, h2, button').forEach(el => {
    const key = el.getAttribute('data-key') || el.textContent.toLowerCase(); // Simplificado para el HTML nuevo
  });
  document.getElementById('langBtn').textContent = t.lang;
}

function render() {
  const container = document.getElementById('canvas-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) return; // Evitar renderizado si el contenedor no tiene tamaño
  
  canvas.width = w;
  canvas.height = h;
  
  const aspect = w / h;
  const range = 3.0 / state.zoom;
  
  worker.postMessage({
    width: w,
    height: h,
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

document.getElementById('langBtn').onclick = () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  translate();
};

document.getElementById('fractalType').onchange = (e) => {
  state.type = e.target.value;
  render();
};

document.getElementById('palette').onchange = (e) => {
  state.palette = e.target.value;
  render();
};

document.getElementById('maxIter').oninput = (e) => {
  state.maxIter = parseInt(e.target.value);
  document.getElementById('iterVal').textContent = e.target.value;
};

document.getElementById('zoom').oninput = (e) => {
  state.zoom = parseFloat(e.target.value);
  document.getElementById('zoomVal').textContent = e.target.value;
};

canvas.onclick = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const range = 3.0 / state.zoom;
  state.centerX += (x - 0.5) * range;
  state.centerY += (y - 0.5) * (range / (canvas.width / canvas.height));
  state.zoom *= 1.5;
  document.getElementById('zoom').value = Math.min(1000, state.zoom);
  document.getElementById('zoomVal').textContent = Math.min(1000, state.zoom);
  render();
};

window.addEventListener('resize', () => {
  // Pequeño delay para asegurar que el layout CSS ya se actualizó
  setTimeout(render, 100);
});

translate();
render();
