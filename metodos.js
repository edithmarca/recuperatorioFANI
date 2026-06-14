/**
 * metodos.js — Biblioteca de Métodos Numéricos
 * FANI · Centro de Control · U.M.S.A.
 *
 * Contiene implementaciones puras (sin DOM) de:
 *  - Gauss-Seidel
 *  - RK4 (escalar y vectorizado)
 *  - Interpolación Lagrange / Spline Cúbico Natural
 *  - Integración: Trapecio, Simpson 1/3, Simpson 3/8
 *  - Raíces: Newton-Raphson, Bisección, Secante
 *  - Número de condición (norma infinito)
 */

/* ═══════════════════════════════════════════════
   ÁLGEBRA LINEAL — GAUSS-SEIDEL
   ═══════════════════════════════════════════════ */

/**
 * Resuelve Ax = b con Gauss-Seidel.
 * @param {number[][]} A  - Matriz n×n
 * @param {number[]}   b  - Vector de términos independientes
 * @param {number}     tol - Tolerancia de convergencia
 * @param {number}     maxIter
 * @returns {{ x: number[], iters: object[], converged: boolean }}
 */
function gaussSeidel(A, b, tol = 1e-6, maxIter = 100) {
  const n = A.length;
  let x = new Array(n).fill(0);
  const iters = [];

  for (let k = 0; k < maxIter; k++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < n; j++) {
        if (j !== i) sum -= A[i][j] * x[j];
      }
      if (Math.abs(A[i][i]) < 1e-15) throw new Error(`División por cero en fila ${i}`);
      x[i] = sum / A[i][i];
    }
    const err = Math.max(...x.map((v, i) => Math.abs(v - xOld[i])));
    iters.push({ k: k + 1, x: [...x], err });
    if (err < tol) return { x, iters, converged: true };
  }
  return { x, iters, converged: false };
}

/* ═══════════════════════════════════════════════
   NÚMERO DE CONDICIÓN (norma ∞)
   ═══════════════════════════════════════════════ */

function normaInf(A) {
  return Math.max(...A.map(row => row.reduce((s, v) => s + Math.abs(v), 0)));
}

function inversaGauss(A) {
  const n = A.length;
  // Construye [A|I] y reduce
  const aug = A.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });
  for (let col = 0; col < n; col++) {
    // Pivoteo parcial
    let maxRow = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-14) return null; // Singular
    const piv = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n));
}

function numeroDeCodicion(A) {
  const Ainv = inversaGauss(A.map(r => [...r]));
  if (!Ainv) return Infinity;
  return normaInf(A) * normaInf(Ainv);
}

/* ═══════════════════════════════════════════════
   EDO — EULER (escalar)
   ═══════════════════════════════════════════════ */

/**
 * Método de Euler explícito (orden 1).
 * @param {Function} f        - f(t, y)
 * @param {number}   y0
 * @param {number}   t0
 * @param {number}   tEnd
 * @param {number}   h
 * @param {Function} [stopCond]
 */
function euler(f, y0, t0, tEnd, h, stopCond = null) {
  const ts = [t0], ys = [y0];
  let t = t0, y = y0;
  while (t < tEnd) {
    y = y + h * f(t, y);
    t = +(t + h).toFixed(10);
    ts.push(+t.toFixed(4));
    ys.push(+y.toFixed(4));
    if (stopCond && stopCond(t, y)) break;
  }
  return { ts, ys };
}

/* ═══════════════════════════════════════════════
   EDO — HEUN (escalar)
   ═══════════════════════════════════════════════ */

/**
 * Método de Heun (Euler mejorado / Runge-Kutta orden 2).
 * Predice con Euler, corrige con trapecio → error O(h³).
 */
function heun(f, y0, t0, tEnd, h, stopCond = null) {
  const ts = [t0], ys = [y0];
  let t = t0, y = y0;
  while (t < tEnd) {
    const k1 = f(t, y);
    const yPred = y + h * k1;           // predictor (Euler)
    const k2   = f(t + h, yPred);
    y = y + (h / 2) * (k1 + k2);       // corrector (promedio)
    t = +(t + h).toFixed(10);
    ts.push(+t.toFixed(4));
    ys.push(+y.toFixed(4));
    if (stopCond && stopCond(t, y)) break;
  }
  return { ts, ys };
}

/* ═══════════════════════════════════════════════
   EDO — RUNGE-KUTTA 4 (escalar)
   ═══════════════════════════════════════════════ */

/**
 * @param {Function} f  - f(t, y)
 * @param {number}   y0
 * @param {number}   t0
 * @param {number}   tEnd
 * @param {number}   h
 * @param {Function} [stopCond] - (t, y) => bool para detener
 * @returns {{ ts: number[], ys: number[] }}
 */
function rk4(f, y0, t0, tEnd, h, stopCond = null) {
  const ts = [t0], ys = [y0];
  let t = t0, y = y0;
  while (t < tEnd) {
    const k1 = f(t, y);
    const k2 = f(t + h / 2, y + (h / 2) * k1);
    const k3 = f(t + h / 2, y + (h / 2) * k2);
    const k4 = f(t + h, y + h * k3);
    y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t = +(t + h).toFixed(10);
    ts.push(+t.toFixed(4));
    ys.push(+y.toFixed(4));
    if (stopCond && stopCond(t, y)) break;
  }
  return { ts, ys };
}

/* ═══════════════════════════════════════════════
   EDO VECTORIZADO — EULER, HEUN, RK4 (Escenario G)
   ═══════════════════════════════════════════════ */

// Helpers vectoriales compartidos
const _addV  = (a, b) => a.map((v, i) => v + b[i]);
const _scaleV = (s, v) => v.map(x => x * s);

/**
 * Euler vectorizado — orden 1.
 * @param {Function} F  - F(t, Y) => dY/dt como array
 */
function eulerVector(F, Y0, t0, tEnd, h) {
  let t = t0, Y = [...Y0];
  const ts = [t0], Ys = [Y0.map(v => +v.toFixed(4))];
  while (t < tEnd) {
    const K1 = F(t, Y);
    Y = _addV(Y, _scaleV(h, K1));
    t = +(t + h).toFixed(10);
    ts.push(+t.toFixed(4));
    Ys.push(Y.map(v => +v.toFixed(4)));
  }
  return { ts, Ys };
}

/**
 * Heun vectorizado — orden 2.
 */
function heunVector(F, Y0, t0, tEnd, h) {
  let t = t0, Y = [...Y0];
  const ts = [t0], Ys = [Y0.map(v => +v.toFixed(4))];
  while (t < tEnd) {
    const K1   = F(t, Y);
    const Ypred = _addV(Y, _scaleV(h, K1));
    const K2   = F(t + h, Ypred);
    Y = Y.map((v, i) => v + (h / 2) * (K1[i] + K2[i]));
    t = +(t + h).toFixed(10);
    ts.push(+t.toFixed(4));
    Ys.push(Y.map(v => +v.toFixed(4)));
  }
  return { ts, Ys };
}

/**
 * RK4 vectorizado — orden 4.
 */
function rk4Vector(F, Y0, t0, tEnd, h) {
  let t = t0, Y = [...Y0];
  const ts = [t0], Ys = [Y0.map(v => +v.toFixed(4))];
  while (t < tEnd) {
    const K1 = F(t, Y);
    const K2 = F(t + h / 2, _addV(Y, _scaleV(h / 2, K1)));
    const K3 = F(t + h / 2, _addV(Y, _scaleV(h / 2, K2)));
    const K4 = F(t + h,     _addV(Y, _scaleV(h, K3)));
    Y = Y.map((v, i) => v + (h / 6) * (K1[i] + 2 * K2[i] + 2 * K3[i] + K4[i]));
    t = +(t + h).toFixed(10);
    ts.push(+t.toFixed(4));
    Ys.push(Y.map(v => +v.toFixed(4)));
  }
  return { ts, Ys };
}

/* ═══════════════════════════════════════════════
   INTERPOLACIÓN — LAGRANGE
   ═══════════════════════════════════════════════ */

/**
 * @param {number[]} xs
 * @param {number[]} ys
 * @param {number}   t  - Punto a evaluar
 */
function lagrange(xs, ys, t) {
  let result = 0;
  const n = xs.length;
  for (let i = 0; i < n; i++) {
    let Li = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) Li *= (t - xs[j]) / (xs[i] - xs[j]);
    }
    result += ys[i] * Li;
  }
  return result;
}

/**
 * Interpolación de Newton — Diferencias Divididas.
 * Construye la tabla de diferencias divididas y evalúa en t.
 * @param {number[]} xs
 * @param {number[]} ys
 * @param {number}   t
 * @returns {{ value: number, tabla: number[][] }}
 */
function newtonDivDiff(xs, ys, t) {
  const n = xs.length;
  // Construir tabla de diferencias divididas
  const dd = Array.from({ length: n }, (_, i) => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dd[i][0] = ys[i];
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / (xs[i + j] - xs[i]);
    }
  }
  // Evaluar con el esquema de Horner
  let value = dd[0][n - 1];
  for (let i = n - 2; i >= 0; i--) {
    value = dd[0][i] + (t - xs[i]) * value;
  }
  return { value, tabla: dd };
}

/**
 * Spline Cúbico Natural
 * Devuelve función evaluable en cualquier t dentro del rango.
 */
function splineCubico(xs, ys) {
  const n = xs.length;
  const h = xs.slice(1).map((v, i) => v - xs[i]);

  // Construir sistema tridiagonal para los momentos M
  const alpha = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  }
  const l = new Array(n).fill(1);
  const mu = new Array(n).fill(0);
  const z = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  const c = new Array(n).fill(0);
  const b = new Array(n - 1).fill(0);
  const d = new Array(n - 1).fill(0);
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  return (t) => {
    // Buscar intervalo
    let i = 0;
    for (let k = 0; k < n - 1; k++) {
      if (t >= xs[k] && t <= xs[k + 1]) { i = k; break; }
      if (t < xs[0]) { i = 0; break; }
      if (t > xs[n - 1]) { i = n - 2; break; }
    }
    const dt = t - xs[i];
    return ys[i] + b[i] * dt + c[i] * dt ** 2 + d[i] * dt ** 3;
  };
}

/* ═══════════════════════════════════════════════
   INTEGRACIÓN NUMÉRICA
   ═══════════════════════════════════════════════ */

/** Trapecio compuesto */
function trapecio(xs, ys) {
  let sum = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    sum += (xs[i + 1] - xs[i]) * (ys[i] + ys[i + 1]) / 2;
  }
  return sum;
}

/** Simpson 1/3 compuesto (n debe ser par) */
function simpson13(xs, ys) {
  const n = xs.length - 1;
  if (n % 2 !== 0) return trapecio(xs, ys); // fallback
  let sum = ys[0] + ys[n];
  for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * ys[i];
  const h = (xs[n] - xs[0]) / n;
  return (h / 3) * sum;
}

/** Simpson 3/8 compuesto (n debe ser múltiplo de 3) */
function simpson38(xs, ys) {
  const n = xs.length - 1;
  if (n % 3 !== 0) return trapecio(xs, ys);
  let sum = ys[0] + ys[n];
  for (let i = 1; i < n; i++) sum += (i % 3 === 0 ? 2 : 3) * ys[i];
  const h = (xs[n] - xs[0]) / n;
  return (3 * h / 8) * sum;
}

/* ═══════════════════════════════════════════════
   RAÍCES — NEWTON-RAPHSON
   ═══════════════════════════════════════════════ */

/**
 * @param {Function} f
 * @param {Function} df - Derivada
 * @param {number}   x0
 * @param {number}   tol
 * @param {number}   maxIter
 */
function newtonRaphson(f, df, x0, tol = 1e-6, maxIter = 100) {
  const iters = [];
  let x = x0;
  for (let k = 0; k < maxIter; k++) {
    const fx = f(x);
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-15) throw new Error('Derivada nula — Newton falla');
    const xNew = x - fx / dfx;
    const err = Math.abs(xNew - x);
    iters.push({ k: k + 1, x, fx, dfx, xNew, err });
    x = xNew;
    if (err < tol) return { root: x, iters, converged: true };
  }
  return { root: x, iters, converged: false };
}

/** Bisección */
function biseccion(f, a, b, tol = 1e-6, maxIter = 100) {
  if (f(a) * f(b) > 0) throw new Error('f(a) y f(b) deben tener signos opuestos');
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const c = (a + b) / 2;
    const fc = f(c);
    const err = (b - a) / 2;
    iters.push({ k: k + 1, a, b, c, fc, err });
    if (err < tol || Math.abs(fc) < 1e-15) return { root: c, iters, converged: true };
    if (f(a) * fc < 0) b = c; else a = c;
  }
  return { root: (a + b) / 2, iters, converged: false };
}

/** Secante */
function secante(f, x0, x1, tol = 1e-6, maxIter = 100) {
  const iters = [];
  for (let k = 0; k < maxIter; k++) {
    const f0 = f(x0), f1 = f(x1);
    if (Math.abs(f1 - f0) < 1e-15) throw new Error('División por cero en Secante');
    const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
    const err = Math.abs(x2 - x1);
    iters.push({ k: k + 1, x0, x1, x2, f1, err });
    x0 = x1; x1 = x2;
    if (err < tol) return { root: x2, iters, converged: true };
  }
  return { root: x1, iters, converged: false };
}

/* Exportar al scope global (sin módulos para compatibilidad CDN) */
window.NUM = {
  // Álgebra lineal
  gaussSeidel,
  numeroDeCodicion,
  inversaGauss,
  // EDO escalares
  euler,
  heun,
  rk4,
  // EDO vectorizados
  eulerVector,
  heunVector,
  rk4Vector,
  // Interpolación
  lagrange,
  newtonDivDiff,
  splineCubico,
  // Integración
  trapecio,
  simpson13,
  simpson38,
  // Raíces
  newtonRaphson,
  biseccion,
  secante
};
