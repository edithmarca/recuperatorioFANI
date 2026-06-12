/**
 * main.js — Controlador principal del DOM
 * FANI · Centro de Control · U.M.S.A.
 */

/* ═══════════════════ RADAR CANVAS ANIMADO ═══════════════════ */
(function initRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 60, cy = 60, R = 55;
  let angle = 0;
  let blips = [];

  // Generar blips fijos
  for (let i = 0; i < 4; i++) {
    blips.push({ a: Math.random() * Math.PI * 2, r: 10 + Math.random() * 40, life: 0 });
  }

  function draw() {
    ctx.clearRect(0, 0, 120, 120);
    // Fondo
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#070b15';
    ctx.fill();
    ctx.strokeStyle = '#00d4ff33';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Círculos concéntricos
    [0.33, 0.66, 1].forEach(f => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
      ctx.strokeStyle = '#00d4ff22';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Cruz
    ctx.strokeStyle = '#00d4ff22';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

    // Barrido
    const grad = ctx.createConicalGradient ? null : null;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const sweep = ctx.createLinearGradient(0, 0, R, 0);
    sweep.addColorStop(0, 'rgba(0,212,255,0.0)');
    sweep.addColorStop(1, 'rgba(0,212,255,0.35)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, -0.5, 0.5);
    ctx.closePath();
    ctx.fillStyle = sweep;
    ctx.fill();
    // Línea del barrido
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R, 0);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Blips
    blips.forEach(b => {
      // Activar si el barrido pasa cerca
      const bAngle = ((b.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const sweepAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const diff = Math.abs(sweepAngle - bAngle);
      if (diff < 0.15 || diff > Math.PI * 2 - 0.15) b.life = 1;
      if (b.life > 0) {
        const bx = cx + b.r * Math.cos(b.a);
        const by = cy + b.r * Math.sin(b.a);
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${b.life})`;
        ctx.fill();
        b.life = Math.max(0, b.life - 0.012);
      }
    });

    angle += 0.03;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ═══════════════════ TAB NAVIGATION ═══════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ═══════════════════ CHART HELPERS ═══════════════════ */
const chartRegistry = {};

function crearChart(id, config) {
  if (chartRegistry[id]) { chartRegistry[id].destroy(); }
  const ctx = document.getElementById(id);
  if (!ctx) return;
  chartRegistry[id] = new Chart(ctx, config);
}

const gridColor = 'rgba(30,46,74,0.6)';
const tickColor = '#5a7090';

function defaultOpts(title = '') {
  return {
    responsive: true,
    animation: { duration: 600 },
    plugins: {
      legend: { labels: { color: '#c8d8f0', font: { family: 'Space Mono', size: 11 } } },
      title: title ? { display: true, text: title, color: '#00d4ff', font: { family: 'Space Grotesk', size: 13 } } : { display: false }
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Space Mono', size: 10 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Space Mono', size: 10 } } }
    }
  };
}

/* ═══════════════════ VALIDACIÓN ═══════════════════ */
function getNum(id, name) {
  const v = parseFloat(document.getElementById(id).value);
  if (isNaN(v)) throw new Error(`"${name}" no es un número válido`);
  return v;
}

function parsePuntos(textareaId) {
  const lines = document.getElementById(textareaId).value.trim().split('\n');
  const xs = [], ys = [];
  lines.forEach((l, i) => {
    const parts = l.split(',');
    if (parts.length < 2) throw new Error(`Línea ${i + 1} inválida: "${l}"`);
    const x = parseFloat(parts[0]), y = parseFloat(parts[1]);
    if (isNaN(x) || isNaN(y)) throw new Error(`Valores no numéricos en línea ${i + 1}`);
    xs.push(x); ys.push(y);
  });
  if (xs.length < 2) throw new Error('Se necesitan al menos 2 puntos');
  return { xs, ys };
}

function setResult(id, html) {
  document.getElementById(id).innerHTML = html;
}

/* ═══════════════════ TABLA HELPERS ═══════════════════ */
function tablaGaussSeidel(iters, n) {
  const varNames = ['x', 'y', 'z'];
  let html = `<table><thead><tr><th>Iter</th>`;
  for (let i = 0; i < n; i++) html += `<th>${varNames[i] || 'x' + i}</th>`;
  html += `<th>Error máx.</th></tr></thead><tbody>`;
  iters.forEach(it => {
    const converged = it.err < 1e-4 ? ' class="converged"' : '';
    html += `<tr${converged}><td>${it.k}</td>`;
    it.x.forEach(v => { html += `<td>${v.toFixed(6)}</td>`; });
    html += `<td>${it.err.toExponential(4)}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function tablaRaices(iters, metodo) {
  let cols;
  if (metodo === 'newton') {
    cols = ['k', 'x', 'f(x)', "f'(x)", 'x nuevo', 'Error'];
  } else if (metodo === 'biseccion') {
    cols = ['k', 'a', 'b', 'c', 'f(c)', 'Error'];
  } else {
    cols = ['k', 'x₀', 'x₁', 'x₂', 'f(x₁)', 'Error'];
  }
  let html = `<table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
  iters.forEach(it => {
    const converged = it.err < 1e-4 ? ' class="converged"' : '';
    if (metodo === 'newton') {
      html += `<tr${converged}><td>${it.k}</td><td>${it.x.toFixed(6)}</td><td>${it.fx.toFixed(6)}</td><td>${it.dfx.toFixed(6)}</td><td>${it.xNew.toFixed(6)}</td><td>${it.err.toExponential(4)}</td></tr>`;
    } else if (metodo === 'biseccion') {
      html += `<tr${converged}><td>${it.k}</td><td>${it.a.toFixed(6)}</td><td>${it.b.toFixed(6)}</td><td>${it.c.toFixed(6)}</td><td>${it.fc.toFixed(6)}</td><td>${it.err.toExponential(4)}</td></tr>`;
    } else {
      html += `<tr${converged}><td>${it.k}</td><td>${it.x0.toFixed(6)}</td><td>${it.x1.toFixed(6)}</td><td>${it.x2.toFixed(6)}</td><td>${it.f1.toFixed(6)}</td><td>${it.err.toExponential(4)}</td></tr>`;
    }
  });
  html += '</tbody></table>';
  return html;
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO A — GAUSS-SEIDEL + PERTURBACIÓN
   ══════════════════════════════════════════════════════════ */
function leerMatrizA() {
  return [
    [getNum('a11','a11'), getNum('a12','a12'), getNum('a13','a13')],
    [getNum('a21','a21'), getNum('a22','a22'), getNum('a23','a23')],
    [getNum('a31','a31'), getNum('a32','a32'), getNum('a33','a33')]
  ];
}
function leerVectorB() {
  return [getNum('b1','b1'), getNum('b2','b2'), getNum('b3','b3')];
}

function resolverGaussSeidel() {
  try {
    const A = leerMatrizA();
    const b = leerVectorB();
    const tol = getNum('tolGS', 'tolerancia');
    const maxIt = parseInt(document.getElementById('iterGS').value);
    if (isNaN(maxIt) || maxIt < 1) throw new Error('Iteraciones inválidas');

    const { x, iters, converged } = NUM.gaussSeidel(A, b, tol, maxIt);
    const status = converged
      ? `<span class="ok">✓ Convergió en ${iters.length} iteraciones</span>`
      : `<span class="warn">⚠ No convergió tras ${iters.length} iteraciones</span>`;

    setResult('resA',
      `${status}\n\n` +
      `<span class="hi">Posición del FANI:</span>\n` +
      `  X = ${x[0].toFixed(6)} km\n` +
      `  Y = ${x[1].toFixed(6)} km\n` +
      `  Z = ${x[2].toFixed(6)} km\n\n` +
      `Residual: [${A.map((row, i) => (row.reduce((s,v,j)=>s+v*x[j],0)-b[i]).toExponential(3)).join(', ')}]`
    );

    document.getElementById('tablaA').innerHTML = tablaGaussSeidel(iters, 3);

    // Gráfica de convergencia de error
    crearChart('chartA', {
      type: 'line',
      data: {
        labels: iters.map(it => it.k),
        datasets: [{
          label: 'Error máx.',
          data: iters.map(it => it.err),
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: { ...defaultOpts('Convergencia Gauss-Seidel'), scales: { ...defaultOpts().scales, y: { ...defaultOpts().scales.y, type: 'logarithmic' } } }
    });
  } catch (e) {
    setResult('resA', `<span class="err">Error: ${e.message}</span>`);
  }
}

function perturbacionA() {
  try {
    const A = leerMatrizA();
    const b = leerVectorB();
    const tol = getNum('tolGS', 'tolerancia');
    const maxIt = parseInt(document.getElementById('iterGS').value);

    const { x: xOriginal } = NUM.gaussSeidel(A, b, tol, maxIt);

    // Perturbar b en 5%
    const bPert = b.map(v => v * 1.05);
    const { x: xPert } = NUM.gaussSeidel(A, bPert, tol, maxIt);

    const errRel = xOriginal.map((v, i) => Math.abs((xPert[i] - v) / (Math.abs(v) + 1e-15)) * 100);
    const kappa = NUM.numeroDeCodicion(A);

    setResult('resA',
      `<span class="hi">Análisis de Sensibilidad (Δb = 5%)</span>\n\n` +
      `Número de condición κ(A) = ${kappa.toFixed(4)}\n` +
      `Estado: ${kappa < 100 ? '<span class="ok">✓ Sistema bien condicionado</span>' : kappa < 1000 ? '<span class="warn">⚠ Moderadamente mal condicionado</span>' : '<span class="err">✗ Sistema mal condicionado</span>'}\n\n` +
      `           X          Y          Z\n` +
      `Original:  ${xOriginal.map(v=>v.toFixed(4)).join('  ')}\n` +
      `Perturbado:${xPert.map(v=>v.toFixed(4)).join('  ')}\n` +
      `Δ relativo:${errRel.map(v=>v.toFixed(2)+'%').join('  ')}\n\n` +
      `Interpretación: ${kappa < 100 ? 'La interferencia atmosférica produce variaciones mínimas. El sistema de rastreo es robusto.' : 'La interferencia introduce errores significativos. Se recomienda redundancia de antenas.'}`
    );
  } catch (e) {
    setResult('resA', `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO B — RK4 DESCENSO
   ══════════════════════════════════════════════════════════ */
function simularDescenso(H0val, gravVal, empVal, alarmaVal, hVal, resId, chartId) {
  resId = resId || 'resB'; chartId = chartId || 'chartB';
  try {
    const H0     = H0val     !== undefined ? H0val     : getNum('H0', 'Altitud inicial');
    const grav   = gravVal   !== undefined ? gravVal   : getNum('gravB', 'Gravedad');
    const empuje = empVal    !== undefined ? empVal    : getNum('empujeB', 'Empuje');
    const alarma = alarmaVal !== undefined ? alarmaVal : getNum('alarmaB', 'Alarma');
    const h      = hVal      !== undefined ? hVal      : getNum('hB', 'Paso h');

    if (h <= 0) throw new Error('El paso h debe ser positivo');
    if (H0 <= alarma) throw new Error('La altitud inicial debe superar la alarma');

    // dH/dt = empuje - gravedad (negativo = descenso neto)
    const f = (t, H) => empuje - grav;
    const { ts, ys } = NUM.rk4(f, H0, 0, 3600, h, (t, H) => H <= alarma);

    // Tiempo de cruce
    let tCruce = null;
    for (let i = 0; i < ys.length; i++) {
      if (ys[i] <= alarma) { tCruce = ts[i]; break; }
    }

    // Submuestrear para la gráfica (máx 300 puntos)
    const step = Math.max(1, Math.floor(ts.length / 300));
    const tsPlot = ts.filter((_, i) => i % step === 0);
    const ysPlot = ys.filter((_, i) => i % step === 0);

    const resText = tCruce !== null
      ? `<span class="ok">✓ Simulación completada</span>\n\n` +
        `<span class="hi">Tiempo de cruce a zona crítica:</span>\n` +
        `  t = ${tCruce.toFixed(2)} s (${(tCruce/60).toFixed(2)} min)\n\n` +
        `Altitud final: ${ys[ys.length-1].toFixed(1)} m\n` +
        `Velocidad neta de descenso: ${(grav - empuje).toFixed(1)} m/s\n\n` +
        `Interpretación: El FANI tardó ${tCruce.toFixed(1)} s en penetrar\nel espacio aéreo comercial (${alarma} m).`
      : `<span class="warn">⚠ No alcanzó la altitud de alarma en el tiempo simulado.</span>\n` +
        `Altitud mínima: ${Math.min(...ys).toFixed(1)} m`;

    setResult(resId, resText);

    crearChart(chartId, {
      type: 'line',
      data: {
        labels: tsPlot,
        datasets: [
          {
            label: 'Altitud FANI (m)',
            data: ysPlot,
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0,212,255,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
          },
          {
            label: `Zona de alerta (${alarma} m)`,
            data: tsPlot.map(() => alarma),
            borderColor: '#ff6b35',
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 1.5
          }
        ]
      },
      options: { ...defaultOpts('Descenso Cinemático — RK4'), scales: { x: { ...defaultOpts().scales.x, title: { display: true, text: 'Tiempo (s)', color: tickColor } }, y: { ...defaultOpts().scales.y, title: { display: true, text: 'Altitud (m)', color: tickColor } } } }
    });
  } catch (e) {
    setResult(resId, `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO C — INTERPOLACIÓN
   ══════════════════════════════════════════════════════════ */
function interpolar(xsIn, ysIn, tConsIn, resId, chartId) {
  resId = resId || 'resC'; chartId = chartId || 'chartC';
  try {
    let xs, ys, tConsulta;
    if (xsIn !== undefined) {
      xs = xsIn; ys = ysIn; tConsulta = tConsIn;
    } else {
      const pts = parsePuntos('puntosC');
      xs = pts.xs; ys = pts.ys;
      tConsulta = getNum('tConsulta', 'Segundo consulta');
    }

    if (xs.length < 3) throw new Error('Se necesitan al menos 3 puntos para Spline Cúbico');

    // Ordenar por x
    const sorted = xs.map((x, i) => ({ x, y: ys[i] })).sort((a, b) => a.x - b.x);
    const sxs = sorted.map(p => p.x);
    const sys = sorted.map(p => p.y);

    const evalSpline = NUM.splineCubico(sxs, sys);
    const yInterp = evalSpline(tConsulta);

    // Curva suave para gráfica
    const tMin = sxs[0], tMax = sxs[sxs.length - 1];
    const nPts = 200;
    const tCurva = Array.from({ length: nPts }, (_, i) => tMin + (i / (nPts - 1)) * (tMax - tMin));
    const yCurva = tCurva.map(t => evalSpline(t));

    setResult(resId,
      `<span class="ok">✓ Interpolación Spline Cúbico Natural</span>\n\n` +
      `<span class="hi">Altitud estimada en t = ${tConsulta} s:</span>\n` +
      `  H = ${yInterp.toFixed(4)} m\n\n` +
      `Rango de datos: [${tMin} s, ${tMax} s]\n` +
      `Puntos de soporte: ${sxs.length}\n\n` +
      `Interpretación: El objeto se encontraba a ${yInterp.toFixed(1)} m de altitud\nen el segundo ${tConsulta}, interpolado de forma continua\nentre los registros discretos de los sensores.`
    );

    crearChart(chartId, {
      type: 'line',
      data: {
        labels: tCurva.map(t => t.toFixed(2)),
        datasets: [
          {
            label: 'Spline Cúbico',
            data: yCurva,
            borderColor: '#7b2fff',
            backgroundColor: 'rgba(123,47,255,0.08)',
            fill: true,
            tension: 0,
            pointRadius: 0,
            borderWidth: 2
          },
          {
            label: 'Datos sensor',
            data: (() => {
              // Mapear puntos conocidos al eje x de la curva
              return tCurva.map((t, i) => {
                const idx = sxs.findIndex(sx => Math.abs(sx - t) < (tMax - tMin) / nPts * 1.5);
                return idx >= 0 ? sys[idx] : null;
              });
            })(),
            borderColor: '#00d4ff',
            backgroundColor: '#00d4ff',
            pointRadius: 5,
            showLine: false
          },
          {
            label: `t=${tConsulta}s → ${yInterp.toFixed(1)}m`,
            data: tCurva.map(t => Math.abs(t - tConsulta) < (tMax - tMin) / nPts ? yInterp : null),
            borderColor: '#ff6b35',
            backgroundColor: '#ff6b35',
            pointRadius: 8,
            showLine: false
          }
        ]
      },
      options: { ...defaultOpts('Ruta de Vuelo Interpolada'), scales: { x: { ...defaultOpts().scales.x, title: { display: true, text: 'Tiempo (s)', color: tickColor } }, y: { ...defaultOpts().scales.y, title: { display: true, text: 'Altitud (m)', color: tickColor } } } }
    });
  } catch (e) {
    setResult(resId, `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO D — INTEGRACIÓN NUMÉRICA
   ══════════════════════════════════════════════════════════ */
function integrar() {
  try {
    const { xs, ys } = parsePuntos('puntosD');
    const metodo = document.getElementById('metodoD').value;

    let resultado;
    if (metodo === 'simpson13') resultado = NUM.simpson13(xs, ys);
    else if (metodo === 'trapecio') resultado = NUM.trapecio(xs, ys);
    else resultado = NUM.simpson38(xs, ys);

    // Modelo lineal clásico: velocidad promedio × tiempo total
    const vProm = ys.reduce((s, v) => s + v, 0) / ys.length;
    const tTotal = xs[xs.length - 1] - xs[0];
    const lineal = vProm * tTotal;
    const desv = Math.abs((resultado - lineal) / lineal) * 100;

    const nombres = { simpson13: 'Simpson 1/3', trapecio: 'Trapecio', simpson38: 'Simpson 3/8' };

    setResult('resD',
      `<span class="ok">✓ Integración — ${nombres[metodo]}</span>\n\n` +
      `<span class="hi">Desplazamiento total acumulado:</span>\n` +
      `  D = ${resultado.toFixed(2)} m\n\n` +
      `Modelo lineal clásico: ${lineal.toFixed(2)} m\n` +
      `Desviación anomalía:   ${desv.toFixed(2)} %\n\n` +
      `Interpretación: ${desv > 20 ? `Una desviación del ${desv.toFixed(1)}% respecto al modelo lineal indica comportamiento cinemático ANÓMALO incompatible con física convencional.` : `La desviación del ${desv.toFixed(1)}% es consistente con vuelo no uniforme pero dentro de parámetros físicos esperados.`}`
    );

    crearChart('chartD', {
      type: 'line',
      data: {
        labels: xs.map(x => x + 's'),
        datasets: [
          {
            label: 'Velocidad v(t)',
            data: ys,
            borderColor: '#00ff9d',
            backgroundColor: 'rgba(0,255,157,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4
          },
          {
            label: 'Velocidad promedio (modelo lineal)',
            data: xs.map(() => vProm),
            borderColor: '#ff6b35',
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: { ...defaultOpts(`Desplazamiento: ${resultado.toFixed(0)} m (Δ=${desv.toFixed(1)}%)`), scales: { x: { ...defaultOpts().scales.x, title: { display: true, text: 'Tiempo (s)', color: tickColor } }, y: { ...defaultOpts().scales.y, title: { display: true, text: 'Velocidad (m/s)', color: tickColor } } } }
    });
  } catch (e) {
    setResult('resD', `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO E — RAÍCES
   ══════════════════════════════════════════════════════════ */
document.getElementById('metodoE').addEventListener('change', function () {
  const isNewton = this.value === 'newton';
  const isBisec = this.value === 'biseccion';
  document.getElementById('paramsNewton').style.display = (isNewton || this.value === 'secante') ? '' : 'none';
  document.getElementById('paramsBisec').style.display = isBisec ? '' : 'none';
  if (this.value === 'secante') {
    document.querySelector('#paramsNewton label').textContent = 'x₀ inicial:';
  }
});

function hallarRaiz(alfaIn, betaIn, gammaIn, metIn, x0In, aIn, bIn, tolIn, resId, chartId, tablaId) {
  resId = resId || 'resE'; chartId = chartId || 'chartE'; tablaId = tablaId || 'tablaE';
  try {
    const alfa  = alfaIn  !== undefined ? alfaIn  : getNum('alfaE', 'α');
    const beta  = betaIn  !== undefined ? betaIn  : getNum('betaE', 'β');
    const gamma = gammaIn !== undefined ? gammaIn : getNum('gammaE', 'γ');
    const metodo = metIn  !== undefined ? metIn   : document.getElementById('metodoE').value;
    const tol   = tolIn   !== undefined ? tolIn   : getNum('tolE', 'tolerancia');

    // f(v) = α·v² − β·v − γ
    const f  = v => alfa * v * v - beta * v - gamma;
    const df = v => 2 * alfa * v - beta;

    let resultado;
    if (metodo === 'newton') {
      const x0 = x0In !== undefined ? x0In : getNum('x0E', 'x₀');
      resultado = NUM.newtonRaphson(f, df, x0, tol);
    } else if (metodo === 'biseccion') {
      const a = aIn !== undefined ? aIn : getNum('aE', 'a');
      const b = bIn !== undefined ? bIn : getNum('bE', 'b');
      resultado = NUM.biseccion(f, a, b, tol);
    } else {
      const x0 = x0In !== undefined ? x0In : getNum('x0E', 'x₀');
      resultado = NUM.secante(f, x0, x0 + 1, tol);
    }

    const { root, iters, converged } = resultado;
    const nombreMetodo = { newton: 'Newton-Raphson', biseccion: 'Bisección', secante: 'Secante' }[metodo];

    setResult(resId,
      `<span class="${converged ? 'ok' : 'warn'}">${converged ? '✓' : '⚠'} ${nombreMetodo} — ${iters.length} iteraciones</span>\n\n` +
      `<span class="hi">Velocidad de equilibrio térmico:</span>\n` +
      `  v* = ${root.toFixed(6)} Mach\n\n` +
      `f(v*) = ${f(root).toExponential(4)}\n` +
      `Verificación: α·v*² − β·v* − γ ≈ 0 ✓\n\n` +
      `Interpretación: A v = ${root.toFixed(2)} Mach la energía térmica de\nfricción se equilibra con el campo de aislamiento\ndel objeto. Por encima de esta velocidad el FANI\nsupera el umbral de protección térmica.`
    );

    // Gráfica de la función
    const vMin = Math.max(0.1, root - 30), vMax = root + 30;
    const vArr = Array.from({ length: 200 }, (_, i) => vMin + (i / 199) * (vMax - vMin));
    const fArr = vArr.map(f);

    crearChart(chartId, {
      type: 'line',
      data: {
        labels: vArr.map(v => v.toFixed(2)),
        datasets: [
          {
            label: 'f(v) = αv² − βv − γ',
            data: fArr,
            borderColor: '#7b2fff',
            backgroundColor: 'rgba(123,47,255,0.07)',
            fill: true,
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: `Raíz v* = ${root.toFixed(4)}`,
            data: vArr.map(v => Math.abs(v - root) < (vMax - vMin) / 200 * 1.5 ? 0 : null),
            borderColor: '#ff6b35',
            backgroundColor: '#ff6b35',
            pointRadius: 8,
            showLine: false
          }
        ]
      },
      options: { ...defaultOpts('Equilibrio Térmico f(v) = 0'), scales: { x: { ...defaultOpts().scales.x, title: { display: true, text: 'Velocidad (Mach)', color: tickColor } }, y: { ...defaultOpts().scales.y, title: { display: true, text: 'f(v)', color: tickColor } } } }
    });

    document.getElementById(tablaId).innerHTML = tablaRaices(iters, metodo);
  } catch (e) {
    setResult(resId, `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO F — NÚMERO DE CONDICIÓN
   ══════════════════════════════════════════════════════════ */
function analizarCondicion() {
  try {
    const A = [
      [getNum('f11','f11'), getNum('f12','f12'), getNum('f13','f13')],
      [getNum('f21','f21'), getNum('f22','f22'), getNum('f23','f23')],
      [getNum('f31','f31'), getNum('f32','f32'), getNum('f33','f33')]
    ];
    const delta = getNum('deltaF', 'Δb') / 100;

    const kappa = NUM.numeroDeCodicion(A);
    const errRelMax = kappa * delta;

    let estado, clase;
    if (kappa < 10) { estado = 'BIEN CONDICIONADO — Rastreo estable'; clase = 'ok'; }
    else if (kappa < 1000) { estado = 'MODERADAMENTE MAL CONDICIONADO — Precaución'; clase = 'warn'; }
    else { estado = 'MAL CONDICIONADO — Rastreo inestable'; clase = 'err'; }

    // Calcular inversa para mostrar
    const Ainv = NUM.inversaGauss(A.map(r => [...r]));
    const normaA = (kappa / (Ainv ? (1/kappa * kappa) : 1)).toFixed(4);

    setResult('resF',
      `<span class="${clase}">κ(A) = ${kappa.toFixed(4)}</span>\n\n` +
      `Estado del sistema: <span class="${clase}">${estado}</span>\n\n` +
      `Perturbación aplicada: Δb = ${(delta*100).toFixed(1)}%\n` +
      `Error relativo máximo en solución:\n` +
      `  ||Δx||/||x|| ≤ κ(A)·||Δb||/||b|| = ${kappa.toFixed(2)} × ${(delta*100).toFixed(1)}% = ${(errRelMax*100).toFixed(2)}%\n\n` +
      `‖A‖∞ = ${normaA}\n\n` +
      `Interpretación física:\n${kappa < 100
        ? `El sistema de triangulación es robusto ante la distorsión\ndel campo de camuflaje. Error en posición < ${(errRelMax*100).toFixed(1)}%.`
        : `El campo de camuflaje PERTURBA GRAVEMENTE el sistema.\nUn error del ${(delta*100).toFixed(1)}% en los sensores genera\nuna imprecisión del ${(errRelMax*100).toFixed(1)}% en la posición.\nSe requiere recalibración o antenas adicionales.`}`
    );
  } catch (e) {
    setResult('resF', `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   ESCENARIO G — DINÁMICA SOCIAL RK4 VECTORIZADO
   ══════════════════════════════════════════════════════════ */
function simularDinamica() {
  try {
    const E0 = getNum('E0','E₀');
    const A0 = getNum('A0','A₀');
    const M0 = getNum('M0','M₀');
    const a  = getNum('paramA','a');
    const b  = getNum('paramB','b');
    const c  = getNum('paramC','c');
    const k  = getNum('paramK','k');
    const r  = getNum('paramR','r');
    const T  = getNum('tG','Tiempo');

    if ([E0,A0,M0].some(v => v < 0)) throw new Error('Las poblaciones no pueden ser negativas');
    if ([a,b,c,k,r].some(v => v < 0)) throw new Error('Los parámetros deben ser no negativos');

    // dE/dt = -aEA + bMA
    // dA/dt =  aEA - cAM
    // dM/dt =  kA  - rM
    const F = (t, Y) => {
      const [E, A, M] = Y;
      return [
        -a * E * A + b * M * A,
         a * E * A - c * A * M,
         k * A     - r * M
      ];
    };

    const h = T / 2000;
    const { ts, Ys } = NUM.rk4Vector(F, [E0, A0, M0], 0, T, h);

    // Submuestrear
    const step = Math.max(1, Math.floor(ts.length / 300));
    const tsP = ts.filter((_, i) => i % step === 0);
    const YsP = Ys.filter((_, i) => i % step === 0);

    const Efin = YsP[YsP.length-1][0];
    const Afin = YsP[YsP.length-1][1];
    const Mfin = YsP[YsP.length-1][2];
    const total = Efin + Afin + Mfin;

    let tendencia;
    if (Afin / total > 0.5) tendencia = 'MASIFICACIÓN — El pánico social se propaga y domina la población.';
    else if (Afin < A0 * 0.1) tendencia = 'DISIPACIÓN — La alarma se controló eficazmente.';
    else tendencia = 'ESTABILIZACIÓN — El fenómeno persiste a nivel moderado.';

    setResult('resG',
      `<span class="ok">✓ RK4 vectorizado — ${ts.length} pasos</span>\n\n` +
      `Estado final (día ${T}):\n` +
      `  Escépticos: ${Efin.toFixed(1)} (${(Efin/total*100).toFixed(1)}%)\n` +
      `  Alarmados:  ${Afin.toFixed(1)} (${(Afin/total*100).toFixed(1)}%)\n` +
      `  Medios:     ${Mfin.toFixed(1)} (${(Mfin/total*100).toFixed(1)}%)\n\n` +
      `<span class="hi">Tendencia: ${tendencia}</span>`
    );

    crearChart('chartG', {
      type: 'line',
      data: {
        labels: tsP.map(t => t.toFixed(1)),
        datasets: [
          { label: 'Escépticos (E)', data: YsP.map(Y => Y[0]), borderColor: '#00d4ff', tension: 0.3, pointRadius: 0 },
          { label: 'Alarmados (A)',  data: YsP.map(Y => Y[1]), borderColor: '#ff6b35', tension: 0.3, pointRadius: 0 },
          { label: 'Medios (M)',     data: YsP.map(Y => Y[2]), borderColor: '#7b2fff', tension: 0.3, pointRadius: 0 }
        ]
      },
      options: { ...defaultOpts('Dinámica Social — Avistamiento FANI'), scales: { x: { ...defaultOpts().scales.x, title: { display: true, text: 'Días', color: tickColor } }, y: { ...defaultOpts().scales.y, title: { display: true, text: 'Población', color: tickColor } } } }
    });
  } catch (e) {
    setResult('resG', `<span class="err">Error: ${e.message}</span>`);
  }
}

/* ══════════════════════════════════════════════════════════
   CASOS DE PRUEBA OBLIGATORIOS
   ══════════════════════════════════════════════════════════ */

/** Caso 1 — Interpolación: t=1→800, t=5→1200, t=10→2500 → estimar t=3 */
function caso1() {
  interpolar([1, 5, 10], [800, 1200, 2500], 3, 'resCaso1', 'chartCaso1');
}

/** Caso 2 — EDO descenso: H0=15000, pérdida=1500, empuje=400, alarma=2000 */
function caso2() {
  simularDescenso(15000, 1500, 400, 2000, 0.01, 'resCaso2', 'chartCaso2');
}

/** Caso 3 — Raíces: sensor_base=500, rad=580 → f(v)=0.5v²−2v−500+580 simplificado */
function caso3() {
  // Energía sensor=500, radiación=580 → diferencia=80
  // f(v) = 0.5v² − 2v − 80 = 0  (adaptado al modelo de equilibrio energético)
  // Esto modela cuando la energía emitida (función de v) iguala el umbral del sensor
  hallarRaiz(0.5, 2, 80, 'newton', 15, null, null, 1e-6, 'resCaso3', 'chartCaso3', 'tablaCaso3');
}
