import { useState } from 'react';
import api from '../api';
import '../styles/MlAnalysis.css';

// Convierte a número o devuelve null si no se puede
const num = (v) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== '' && Number.isFinite(n) ? n : null;
};

// Lleva un valor a porcentaje (0-100) respecto a un máximo
const aPct = (v, max = 1) => {
  const n = num(v);
  if (n === null) return 0;
  return Math.min(Math.max((n / max) * 100, 0), 100);
};

const fmtNum = (v) => {
  const n = num(v);
  return n === null ? (v ?? '-') : n.toLocaleString('es-EC');
};

// Dona SVG: el arco muestra el porcentaje y el centro el valor tal como llega del back
function Dona({ pct, color, centro, etiqueta }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const largo = (pct / 100) * C;
  return (
    <svg viewBox="0 0 100 100" className="ml-dona" role="img" aria-label={etiqueta}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="#e9edf3" strokeWidth="11" />
      <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
              strokeDasharray={`${largo} ${C - largo}`} transform="rotate(-90 50 50)" />
      <text x="50" y="55" textAnchor="middle" className="ml-dona-centro">{centro}</text>
    </svg>
  );
}

// El estado del resultado (data) vive en App.jsx y llega por props,
// así no se pierde al cambiar de ventana. Solo se regenera al pulsar el botón
// o se limpia cuando se ejecuta un ETL nuevo.
export default function MlAnalysis({ data, setData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analisis-factores');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener el análisis. Asegúrate de haber ejecutado el ETL primero.');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------ Fila 1: confiabilidad del modelo
  const renderFila1 = () => {
    const auc = data.calidad_modelo?.auc;
    const exactitud = data.calidad_modelo?.exactitud;
    const exactitudPct = num(exactitud) !== null && num(exactitud) > 1 ? aPct(exactitud, 100) : aPct(exactitud, 1);
    const rel = data.relacion_satisfaccion || {};
    const corr = num(rel.correlacion);
    const posCorr = corr === null ? 50 : ((Math.min(Math.max(corr, -1), 1) + 1) / 2) * 100;

    return (
      <div className="ml-fila-1">
        <div className="ml-tarjeta ml-tarjeta-dona">
          <h3>Tasa de incumplimiento global</h3>
          <Dona pct={aPct(data.tasa_incumplimiento_global, 100)} color="#dc2626"
                centro={`${data.tasa_incumplimiento_global}%`} etiqueta="Tasa de incumplimiento global" />
          <p className="ml-tarjeta-nota">Porcentaje de tickets que incumplen el SLA.</p>
        </div>

        <div className="ml-tarjeta ml-tarjeta-dona">
          <h3>Precisión del modelo (AUC)</h3>
          <Dona pct={aPct(auc, 1)} color="#7c3aed" centro={auc ?? '-'} etiqueta="AUC del modelo" />
          <p className="ml-tarjeta-nota">Capacidad de distinguir tickets que incumplen (0.5 = azar, 1 = perfecto).</p>
        </div>

        <div className="ml-tarjeta ml-tarjeta-dona">
          <h3>Exactitud</h3>
          <Dona pct={exactitudPct} color="#4f46e5" centro={exactitud ?? '-'} etiqueta="Exactitud del modelo" />
          <p className="ml-tarjeta-nota">Proporción de tickets clasificados correctamente.</p>
        </div>

        <div className="ml-tarjeta ml-tarjeta-sat">
          <h3>Relación con la satisfacción</h3>

          <div className="ml-sat-fila">
            <div className="ml-sat-linea">
              <span>Si cumple el SLA</span>
              <strong className="ml-texto-verde">{rel.satisfaccion_si_cumple}</strong>
            </div>
            <div className="ml-medidor" aria-hidden="true">
              <span className="ml-medidor-verde" style={{ width: `${aPct(rel.satisfaccion_si_cumple, 5)}%` }} />
            </div>
          </div>

          <div className="ml-sat-fila">
            <div className="ml-sat-linea">
              <span>Si incumple el SLA</span>
              <strong className="ml-texto-rojo">{rel.satisfaccion_si_incumple}</strong>
            </div>
            <div className="ml-medidor" aria-hidden="true">
              <span className="ml-medidor-rojo" style={{ width: `${aPct(rel.satisfaccion_si_incumple, 5)}%` }} />
            </div>
          </div>
          <span className="ml-sat-escala">Satisfacción promedio, escala de 1 a 5</span>

          <div className="ml-correlacion">
            <div className="ml-sat-linea">
              <span>Correlación</span>
              <strong>{rel.correlacion}</strong>
            </div>
            <div className="ml-escala-corr" aria-hidden="true">
              <span className="ml-escala-corr-centro" />
              <span className="ml-escala-corr-marca" style={{ left: `${posCorr}%` }} />
            </div>
            <div className="ml-escala-corr-ejes" aria-hidden="true">
              <span>-1</span><span>0</span><span>1</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ------------------------------------------- Fila 2: factores de riesgo (forest plot)
  const renderForest = () => {
    const factores = data.factores || [];
    if (factores.length === 0) return <p className="ml-vacio">Sin factores para mostrar.</p>;

    const logs = factores.map((f) => {
      const o = num(f.odds_ratio);
      return o !== null && o > 0 ? Math.log(o) : 0;
    });
    const maxLog = Math.max(...logs.map(Math.abs), 0.1);
    const extremo = Math.exp(maxLog);

    const grupos = [];
    factores.forEach((f, i) => {
      let g = grupos.find((x) => x.variable === f.variable);
      if (!g) { g = { variable: f.variable, items: [] }; grupos.push(g); }
      g.items.push({ ...f, _log: logs[i] });
    });

    return (
      <div className="ml-forest">
        <div className="ml-forest-fila ml-forest-cabecera" aria-hidden="true">
          <span>Categoría</span>
          <div className="ml-forest-ejes">
            <span className="ml-texto-verde">← {(1 / extremo).toFixed(2)} reduce</span>
            <span>1</span>
            <span className="ml-texto-rojo">aumenta {extremo.toFixed(2)} →</span>
          </div>
          <span className="ml-forest-or-cab">Odds ratio</span>
          <span>Efecto</span>
        </div>

        {grupos.map((g) => (
          <div key={g.variable} className="ml-forest-grupo">
            <h4 className="ml-variable">{g.variable}</h4>
            {g.items.map((f, i) => {
              const o = num(f.odds_ratio);
              const clase = o === null ? 'neutro' : o > 1 ? 'alto' : o < 1 ? 'bajo' : 'neutro';
              const pos = o === null ? null : 50 + (f._log / maxLog) * 45;
              return (
                <div key={i} className={`ml-forest-fila ml-forest-${clase}`}>
                  <span className="ml-forest-cat">{f.categoria}</span>
                  <div className="ml-forest-plot" aria-hidden="true">
                    <span className="ml-forest-centro" />
                    {pos !== null && (
                      <>
                        <span className="ml-forest-tallo"
                              style={{ left: `${Math.min(50, pos)}%`, width: `${Math.abs(pos - 50)}%` }} />
                        <span className="ml-forest-punto" style={{ left: `${pos}%` }} />
                      </>
                    )}
                  </div>
                  <span className="ml-forest-or">{f.odds_ratio}</span>
                  <p className="ml-forest-efecto">{f.efecto}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ------------------------------------------------ Fila 3: tasas por grupo
  const renderTasas = () => {
    const grupos = Object.entries(data.tasas_por_grupo || {});
    if (grupos.length === 0) return <p className="ml-vacio">Sin tasas para mostrar.</p>;

    const global = num(data.tasa_incumplimiento_global);
    const todas = grupos.flatMap(([, tasas]) => Object.values(tasas).map(num).filter((n) => n !== null));
    const escala = Math.max(...todas, global ?? 0, 1);
    const posGlobal = global === null ? null : (global / escala) * 100;

    return (
      <>
        <p className="ml-leyenda-tasas">
          <span className="ml-muestra ml-muestra-sobre" /> Por encima de la tasa global
          <span className="ml-muestra ml-muestra-bajo" /> Igual o por debajo
          {global !== null && <><span className="ml-muestra-linea" /> Tasa global ({global}%)</>}
        </p>
        <div className="ml-tasas-grid">
          {grupos.map(([variable, tasas]) => (
            <div key={variable} className="ml-grupo-tasas">
              <h4>{variable}</h4>
              <ul className="ml-lista-tasas">
                {Object.entries(tasas).map(([cat, tasa]) => {
                  const t = num(tasa);
                  const sobre = t !== null && global !== null && t > global;
                  return (
                    <li key={cat}>
                      <span className="ml-tasa-cat" title={cat}>{cat}</span>
                      <span className="ml-tasa-pista" aria-hidden="true">
                        <span className={`ml-tasa-relleno ${sobre ? 'ml-tasa-sobre' : ''}`}
                              style={{ width: `${aPct(t, escala)}%` }} />
                        {posGlobal !== null && <span className="ml-tasa-global" style={{ left: `${posGlobal}%` }} />}
                      </span>
                      <span className="ml-tasa-valor">{tasa}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="ml-container">
      <header className="ml-encabezado">
        <div>
          <h2>6. Análisis Predictivo (Machine Learning)</h2>
          <p className="ml-descripcion">
            Identificación de los factores que más influyen en el incumplimiento del SLA mediante regresión logística.
          </p>
        </div>
        <button onClick={fetchAnalysis} className="ml-btn" disabled={loading}>
          {loading ? 'Analizando...' : data ? 'Regenerar Análisis ML' : 'Ejecutar Análisis ML'}
        </button>
      </header>

      {error && <p className="ml-error" role="alert">{error}</p>}

      {data && (
        <div className="ml-resultados-container">
          <p className="ml-resumen-linea">
            Tickets analizados <strong>{fmtNum(data.tickets_analizados)}</strong>
          </p>

          <section className="ml-seccion">
            <h3 className="ml-seccion-titulo"><span>1</span> ¿Qué tan confiable es el modelo?</h3>
            {renderFila1()}
          </section>

          <section className="ml-seccion">
            <h3 className="ml-seccion-titulo"><span>2</span> ¿Qué factores aumentan el incumplimiento?</h3>
            <div className="ml-box">
              <h3>Factores de riesgo (Odds Ratio)</h3>
              <p className="ml-subtitulo">Mayor a 1 = aumenta el riesgo. Menor a 1 = reduce el riesgo.</p>
              {renderForest()}
            </div>
          </section>

          <section className="ml-seccion">
            <h3 className="ml-seccion-titulo"><span>3</span> ¿Dónde se concentra el problema?</h3>
            <div className="ml-box">
              <h3>Tasas de incumplimiento por grupo</h3>
              <p className="ml-subtitulo">Porcentaje de tickets que incumplen el SLA en cada categoría.</p>
              {renderTasas()}
            </div>
          </section>

          <section className="ml-seccion">
            <h3 className="ml-seccion-titulo"><span>4</span> ¿Qué concluimos?</h3>
            <div className="ml-interpretacion">
              <strong className="ml-interpretacion-titulo">Interpretación</strong>
              <p className="ml-note">{data.interpretacion}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}