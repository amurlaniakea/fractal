# Fractal / Núcleo Matemático

> *"Tecnósfera al servicio de la Biósfera."* — *La Paz Es El Camino.*

A professional, zero-dependency fractal rendering engine designed for students, educators, and mathematicians. Features non-blocking Web Worker architecture, secure mathematical parser for custom equations, and bilingual support (ES/EN).

**Live Demo:** [amurlaniakea.github.io/fractal](https://amurlaniakea.github.io/fractal)

## 🧠 Architecture
- **Async Core:** Calculations run in a dedicated Web Worker to ensure 60 FPS UI responsiveness.
- **Secure Custom Equations:** Students can define $z_{n+1} = f(z_n, c)$ using a safe sandbox (`mul(z,z) + c`) without risking code injection.
- **Float64 Precision:** Explicit limits documented in the source code.

## 📚 Supported Fractals
1. **Mandelbrot Set:** The classic $z^2 + c$.
2. **Julia Set:** Interactive exploration with fixed $c$.
3. **Burning Ship:** Absolute value variant.
4. **Custom Engine:** Write your own iterative complex functions.

<details>
<summary><strong>Resumen en Español</strong></summary>

Motor profesional de renderizado de fractales de **cero dependencias**, diseñado para estudiantes, profesores y matemáticos. Utiliza una arquitectura de *Web Workers* para no bloquear la interfaz, un parser matemático seguro para que los alumnos creen sus propias ecuaciones iterativas, y soporte bilingüe nativo.
</details>

## ⚖️ License
AGPL-3.0-or-later. © 2026 Pedro Sordo Martínez (@amurlaniakea).
