# Mandelbrot Core

> *"Tecnósfera al servicio de la Biósfera."* — *La Paz Es El Camino.*

A zero-dependency, mathematically rigorous fractal rendering engine. It computes the Mandelbrot set using pure JavaScript and HTML5 Canvas, featuring smooth coloring algorithms and explicit Float64 precision limits. No external libraries, no CDNs, no build steps.

**Live Demo:** [amurlaniakea.github.io/mandelbrot-core](https://amurlaniakea.github.io/mandelbrot-core)

## Mathematical Foundation
The engine iterates the complex function \( z_{n+1} = z_n^2 + c \). Escape is determined when \( |z| > 2 \). Smooth coloring is applied using the normalized iteration count formula:
\[ \mu = n + 1 - \log_2(\log_2(|z|)) \]
This eliminates color banding and provides continuous gradients for verifiable visual analysis.

## Usage
1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser.
3. Use the on-screen controls to adjust `maxIterations` and `zoom`.

<details>
<summary><strong>Resumen en Español</strong></summary>

Motor de renderizado de fractales de **cero dependencias** y rigor matemático. Calcula el conjunto de Mandelbrot usando JavaScript puro y HTML5 Canvas, con algoritmos de coloración suave y límites explícitos de precisión Float64. Sin librerías externas, sin CDNs, sin procesos de compilación. Licencia: AGPL-3.0-or-later.
</details>