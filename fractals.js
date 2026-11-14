// Mandelbrot Core - Zero Dependency, Float64 Precision, Smooth Coloring
// License: AGPL-3.0-or-later | Author: Pedro Sordo Martínez (@amurlaniakea)

const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Optimización: sin canal alpha

let width, height, imageData, data;
let centerX = -0.5, centerY = 0;
let zoom = 1;
let maxIter = 100;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  imageData = ctx.createImageData(width, height);
  data = imageData.data;
  draw();
}

function draw() {
  const aspectRatio = width / height;
  const rangeX = 3.0 / zoom;
  const rangeY = rangeX / aspectRatio;
  const minX = centerX - rangeX / 2;
  const minY = centerY - rangeY / 2;

  for (let py = 0; py < height; py++) {
    const cy = minY + (py / height) * rangeY;
    for (let px = 0; px < width; px++) {
      const cx = minX + (px / width) * rangeX;
      
      let zx = 0, zy = 0, iter = 0;
      // Núcleo matemático de escape
      while (zx * zx + zy * zy <= 4 && iter < maxIter) {
        const xtemp = zx * zx - zy * zy + cx;
        zy = 2 * zx * zy + cy;
        zx = xtemp;
        iter++;
      }

      const pixelIndex = (py * width + px) * 4;
      if (iter === maxIter) {
        data[pixelIndex] = 0;     // R
        data[pixelIndex + 1] = 0; // G
        data[pixelIndex + 2] = 0; // B
        data[pixelIndex + 3] = 255; // Alpha
      } else {
        // Smooth coloring (coloración suave) para evitar bandas de color
        const logZn = Math.log(zx * zx + zy * zy) / 2;
        const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
        const smoothIter = iter + 1 - nu;
        
        // Paleta de colores basada en el iteración suave
        const r = Math.floor(9 * (15 - smoothIter % 15));
        const g = Math.floor(9 * (15 - (smoothIter * 0.7) % 15));
        const b = Math.floor(9 * (15 - (smoothIter * 0.3) % 15));
        
        data[pixelIndex] = r;
        data[pixelIndex + 1] = g;
        data[pixelIndex + 2] = b;
        data[pixelIndex + 3] = 255;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// Controles
document.getElementById('maxIter').addEventListener('input', (e) => {
  maxIter = parseInt(e.target.value);
  document.getElementById('iterVal').textContent = maxIter;
  draw();
});

document.getElementById('zoom').addEventListener('input', (e) => {
  zoom = parseInt(e.target.value);
  document.getElementById('zoomVal').textContent = zoom;
  draw();
});

window.addEventListener('resize', resize);
resize(); // Inicio