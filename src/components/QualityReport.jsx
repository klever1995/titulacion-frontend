import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts';
import api from '../api';
import '../styles/QualityReport.css';

const ORDEN_DIM = ['completitud', 'unicidad', 'consistencia', 'validez'];

// Formatos: 30900 -> "30.900" y 97.06 -> "97,06"
const miles = (n) => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const pct = (n) => Number(n).toFixed(2).replace('.', ',');

export default function QualityReport() {
  const [calidad, setCalidad] = useState(null);
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fuenteFiltro, setFuenteFiltro] = useState('');
  const [dimFiltro, setDimFiltro] = useState('');

  useEffect(() => {
    const fetchCalidad = async () => {
      try {
        const [resCalidad, resReglas] = await Promise.all([
          api.get('/calidad'),
          api.get('/calidad/reglas'),
        ]);
        setCalidad(resCalidad.data);
        setReglas(resReglas.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los datos de calidad. Asegúrate de haber ejecutado el ETL.');
      } finally {
        setLoading(false);
      }
    };
    fetchCalidad();
  }, []);

  // Une cada regla con su medición "antes" y "después" en una sola fila
  const reglasAgrupadas = useMemo(() => {
    const mapa = new Map();
    reglas.forEach((r) => {
      const clave = `${r.fuente}|${r.dimension}|${r.regla}`;
      if (!mapa.has(clave)) {
        mapa.set(clave, { fuente: r.fuente, dimension: r.dimension, regla: r.regla });
      }
      mapa.get(clave)[r.etapa] = r;
    });
    return Array.from(mapa.values()).sort((a, b) =>
      a.fuente.localeCompare(b.fuente) ||
      ORDEN_DIM.indexOf(a.dimension) - ORDEN_DIM.indexOf(b.dimension) ||
      a.regla.localeCompare(b.regla)
    );
  }, [reglas]);

  const reglasVisibles = reglasAgrupadas.filter((r) =>
    (!fuenteFiltro || r.fuente === fuenteFiltro) &&
    (!dimFiltro || r.dimension === dimFiltro)
  );

  if (loading) return <div className="qr-card">Cargando reporte de calidad...</div>;
  if (error) return <div className="qr-alerta-error">{error}</div>;
  if (!calidad) return null;

  const dataGrafico = [
    { name: 'Completitud', Antes: calidad.completitud_antes, Después: calidad.completitud_despues },
    { name: 'Unicidad', Antes: calidad.unicidad_antes, Después: calidad.unicidad_despues },
    { name: 'Consistencia', Antes: calidad.consistencia_antes, Después: calidad.consistencia_despues },
    { name: 'Validez', Antes: calidad.validez_antes, Después: calidad.validez_despues },
    { name: 'Total', Antes: calidad.puntaje_total_antes, Después: calidad.puntaje_total_despues },
  ];

  const mejora = calidad.puntaje_total_despues - calidad.puntaje_total_antes;

  return (
    <div className="qr-card">
      <h2>4. Reporte de Calidad de Datos (Antes vs Después)</h2>
      <p className="qr-descripcion">
        Evaluación de las 4 dimensiones de calidad sobre las 3 fuentes, antes y después de aplicar el ETL.
      </p>

      {/* Tarjetas con el puntaje total */}
      <div className="qr-tarjetas">
        <div className="qr-tarjeta qr-tarjeta-antes">
          <h3>Puntaje total antes</h3>
          <p>{pct(calidad.puntaje_total_antes)} %</p>
        </div>
        <div className="qr-tarjeta qr-tarjeta-despues">
          <h3>Puntaje total después</h3>
          <p>{pct(calidad.puntaje_total_despues)} %</p>
        </div>
        <div className="qr-tarjeta qr-tarjeta-mejora">
          <h3>Mejora</h3>
          <p>{mejora >= 0 ? '+' : ''}{pct(mejora)} puntos</p>
        </div>
      </div>

      {/* Gráfico comparativo con el valor sobre cada barra */}
      <div className="qr-grafico-container">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={dataGrafico} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(v) => `${pct(v)} %`} />
            <Legend />
            <Bar dataKey="Antes" fill="#ef4444">
              <LabelList dataKey="Antes" position="top" formatter={(v) => pct(v)} style={{ fontSize: 12 }} />
            </Bar>
            <Bar dataKey="Después" fill="#10b981">
              <LabelList dataKey="Después" position="top" formatter={(v) => pct(v)} style={{ fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada: una fila por regla, con antes y después juntos */}
      <div className="qr-tabla-encabezado">
        <div>
          <h3>Detalle de Reglas Evaluadas</h3>
          <p className="qr-subtitulo">
            Una fila por regla, con su medición antes y después del ETL ({reglasVisibles.length} reglas).
          </p>
        </div>
        <div className="qr-filtros">
          <select className="qr-select" value={fuenteFiltro} onChange={(e) => setFuenteFiltro(e.target.value)}>
            <option value="">Todas las fuentes</option>
            <option value="tickets">Tickets</option>
            <option value="crm">CRM</option>
            <option value="encuestas">Encuestas</option>
          </select>
          <select className="qr-select" value={dimFiltro} onChange={(e) => setDimFiltro(e.target.value)}>
            <option value="">Todas las dimensiones</option>
            {ORDEN_DIM.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="qr-tabla-container">
        <table className="qr-table">
          <thead className="qr-tabla-header">
            <tr>
              <th>Fuente</th>
              <th>Dimensión</th>
              <th>Regla</th>
              <th>Evaluados (antes → después)</th>
              <th>Errores (antes → después)</th>
              <th>Puntaje antes</th>
              <th>Puntaje después</th>
              <th>Cambio</th>
            </tr>
          </thead>
          <tbody>
            {reglasVisibles.map((r) => {
              const a = r.antes;
              const d = r.despues;
              const cambio = a && d ? d.puntaje - a.puntaje : null;
              const empeora = cambio !== null && cambio < 0;
              return (
                <tr key={`${r.fuente}|${r.dimension}|${r.regla}`} className={empeora ? 'qr-fila-empeora' : ''}>
                  <td className="celda-fuente">{r.fuente}</td>
                  <td className="celda-dimension">{r.dimension}</td>
                  <td>{r.regla}</td>
                  <td>{a ? miles(a.registros_evaluados) : '-'} → {d ? miles(d.registros_evaluados) : '-'}</td>
                  <td className={a && a.registros_con_error > 0 ? 'celda-error' : ''}>
                    {a ? miles(a.registros_con_error) : '-'} → {d ? miles(d.registros_con_error) : '-'}
                  </td>
                  <td>{a ? `${pct(a.puntaje)} %` : '-'}</td>
                  <td className="celda-puntaje">{d ? `${pct(d.puntaje)} %` : '-'}</td>
                  <td className={cambio === null ? '' : empeora ? 'qr-cambio-neg' : 'qr-cambio-pos'}>
                    {cambio === null ? '-' : `${cambio >= 0 ? '+' : ''}${pct(cambio)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="qr-nota">
        Las filas resaltadas son reglas cuyo puntaje bajó después del ETL: el proceso prefiere dejar un dato
        en blanco antes que conservar uno falso, por eso esas reglas de completitud no mejoran.
      </p>
    </div>
  );
}