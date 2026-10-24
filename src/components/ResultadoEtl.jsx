import { useState, useEffect } from 'react';
import api from '../api';
import '../styles/ResultadoEtl.css';

// Un color por fuente, el mismo en toda la pantalla
const FUENTES = {
  tickets: { label: 'Tickets', clase: 'src-tickets' },
  crm: { label: 'CRM', clase: 'src-crm' },
  encuestas: { label: 'Encuestas', clase: 'src-encuestas' },
};

const METODOS = {
  exacto: { label: 'Exacto', color: '#16a34a' },
  normalizado: { label: 'Normalizado', color: '#2563eb' },
  aproximado: { label: 'Aproximado', color: '#d97706' },
  sin_match: { label: 'Sin match', color: '#dc2626' },
};

const fuenteInfo = (f) => FUENTES[f] || { label: f || 'N/A', clase: 'src-otro' };
const fmt = (n) => (n ?? 0).toLocaleString('es-EC');

const verValor = (v) => {
  if (v === undefined) return <span className="nx-ausente">—</span>;
  if (v === null) return <span className="nx-null">null</span>;
  return String(v);
};

const construirComparacion = (sucios, limpio, encuestasSucias) => {
  const versiones = sucios ? (Array.isArray(sucios) ? sucios : [sucios]) : [];
  const encuesta = Array.isArray(encuestasSucias) && encuestasSucias.length > 0 ? encuestasSucias[0] : null;

  const claves = [];
  const agregar = (obj) => obj && Object.keys(obj).forEach((k) => { if (!claves.includes(k)) claves.push(k); });
  versiones.forEach(agregar);
  agregar(limpio);

  const filas = claves.map((campo) => {
    let antes = versiones.map((v) => (campo in v ? v[campo] : undefined));
    let origen = '';
    if (antes.every((a) => a === undefined) && encuesta && campo in encuesta) {
      antes = [encuesta[campo], ...versiones.slice(1).map(() => undefined)];
      origen = 'encuesta';
    }
    const despues = limpio && campo in limpio ? limpio[campo] : undefined;
    const definidos = antes.filter((a) => a !== undefined).map((a) => String(a));
    const conflicto = new Set(definidos).size > 1;
    const enCrudo = definidos.length > 0;

    let estado = 'igual';
    if (conflicto) estado = 'conflicto';
    else if (!enCrudo && despues !== undefined) estado = 'calculado';
    else if (despues !== undefined && definidos.some((a) => a !== String(despues))) estado = 'cambio';

    return { campo, antes, despues, estado, origen };
  });

  return { versiones, filas, hayConflicto: filas.some((f) => f.estado === 'conflicto') };
};

const ETIQUETAS = {
  cambio: 'cambió',
  calculado: 'calculado',
  conflicto: 'versiones distintas',
};

export default function ResultadoEtl() {
  const [resumen, setResumen] = useState(null);
  const [cuarentena, setCuarentena] = useState([]);
  const [loadingTabla, setLoadingTabla] = useState(false);

  const [fuenteFiltro, setFuenteFiltro] = useState('');
  const [motivoFiltro, setMotivoFiltro] = useState('');
  const [pagina, setPagina] = useState(0);
  const limite = 50;

  const [buscarId, setBuscarId] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    api.get('/etl/resumen')
      .then(res => setResumen(res.data))
      .catch(console.error);
  }, []);

  const fetchCuarentena = async () => {
    setLoadingTabla(true);
    try {
      const offset = pagina * limite;
      let url = `/cuarentena?limit=${limite}&offset=${offset}`;
      if (fuenteFiltro) url += `&fuente=${fuenteFiltro}`;
      if (motivoFiltro) url += `&motivo=${encodeURIComponent(motivoFiltro)}`;

      const res = await api.get(url);
      setCuarentena(res.data);
    } catch (error) {
      console.error("Error cargando cuarentena", error);
    } finally {
      setLoadingTabla(false);
    }
  };

  useEffect(() => {
    fetchCuarentena();
  }, [pagina, fuenteFiltro, motivoFiltro]);

  const handleBuscar = async (e) => {
    if (e) e.preventDefault();
    if (!buscarId || !buscarId.trim()) return;

    const idLimpio = buscarId.trim().toUpperCase();
    setBuscando(true);
    setErrorBusqueda('');
    setResultadoBusqueda(null);

    try {
      const res = await api.get(`/comparar/${idLimpio}`);
      setResultadoBusqueda(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const resCuarentena = await api.get(`/cuarentena?id_registro=${encodeURIComponent(idLimpio)}&limit=10`);
          const incidencia = resCuarentena.data[0];

          if (incidencia) {
            setErrorBusqueda(`El ID ${idLimpio} no es un ticket válido, pero se encontró en la cuarentena de la fuente "${incidencia.fuente}". Motivo: ${incidencia.motivo}`);
          } else {
            setErrorBusqueda(`El ID ${idLimpio} no se encontró ni como ticket ni en la cuarentena.`);
          }
        } catch (err) {
          setErrorBusqueda('Ticket o registro no encontrado.');
        }
      } else {
        setErrorBusqueda('Error al buscar.');
      }
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscarDesdeTabla = (id) => {
    if (!id) return;
    setBuscarId(id);
    setTimeout(() => {
      const btn = document.getElementById('btn-buscar-comparar');
      if (btn) btn.click();
    }, 100);
  };

  const handleBarra = (item) => {
    const activa = motivoFiltro === item.motivo && fuenteFiltro === item.fuente;
    setFuenteFiltro(activa ? '' : item.fuente);
    setMotivoFiltro(activa ? '' : item.motivo);
    setPagina(0);
  };

  const limpiarFiltros = () => {
    setFuenteFiltro('');
    setMotivoFiltro('');
    setPagina(0);
  };

  const renderKpis = () => {
    if (!resumen) return null;
    const diferencia = (resumen.tickets_crudos ?? 0) - (resumen.tickets_limpios ?? 0);
    return (
      <div className="res-kpis">
        <div className="res-kpi">
          <span className="res-kpi-label">Tickets crudos</span>
          <strong className="res-kpi-valor">{fmt(resumen.tickets_crudos)}</strong>
          <span className="res-kpi-nota">Filas tal como llegaron</span>
        </div>
        <div className="res-kpi res-kpi-ok">
          <span className="res-kpi-label">Tickets limpios</span>
          <strong className="res-kpi-valor">{fmt(resumen.tickets_limpios)}</strong>
          <span className="res-kpi-nota">Un registro por ticket</span>
        </div>
        <div className="res-kpi res-kpi-alerta">
          <span className="res-kpi-label">Incidencias registradas</span>
          <strong className="res-kpi-valor">{fmt(resumen.total_cuarentena)}</strong>
          <span className="res-kpi-nota">Un registro puede tener varias</span>
        </div>
        <div className="res-kpi">
          <span className="res-kpi-label">Filas menos tras limpiar</span>
          <strong className="res-kpi-valor">{fmt(diferencia)}</strong>
          <span className="res-kpi-nota">Crudos menos limpios</span>
        </div>
      </div>
    );
  };

  // CAMBIO 1: Dona con nombres arriba y gráfico abajo centrado
  const renderDona = () => {
    const datos = resumen?.emparejamiento_clientes;
    if (!datos) return <p className="res-empty">Sin datos de emparejamiento.</p>;

    const entradas = Object.entries(datos);
    const total = entradas.reduce((a, [, n]) => a + n, 0);
    const R = 60; // Dona más grande
    const C = 2 * Math.PI * R;
    let acumulado = 0;

    return (
      <div className="res-dona-layout">
        {/* Nombres arriba */}
        <ul className="res-leyenda">
          {entradas.map(([metodo, n]) => (
            <li key={metodo}>
              <span className="res-punto" style={{ background: (METODOS[metodo] || {}).color || '#94a3b8' }} />
              <span className="res-leyenda-nombre">{(METODOS[metodo] || {}).label || metodo.replace('_', ' ')}</span>
              <span className="res-leyenda-valor">{fmt(n)}</span>
              <span className="res-leyenda-pct">{total ? ((n / total) * 100).toFixed(1) : '0.0'}%</span>
            </li>
          ))}
        </ul>

        {/* Gráfico abajo y centrado */}
        <div className="res-dona-wrapper">
          <svg viewBox="0 0 160 160" className="res-dona" role="img"
               aria-label="Distribución de métodos de emparejamiento de clientes">
            <circle cx="80" cy="80" r={R} fill="none" stroke="#e8edf3" strokeWidth="22" />
            {total > 0 && entradas.map(([metodo, n]) => {
              const largo = (n / total) * C;
              const seg = (
                <circle key={metodo} cx="80" cy="80" r={R} fill="none"
                        stroke={(METODOS[metodo] || {}).color || '#94a3b8'} strokeWidth="22"
                        strokeDasharray={`${largo} ${C - largo}`}
                        strokeDashoffset={-acumulado}
                        transform="rotate(-90 80 80)" />
              );
              acumulado += largo;
              return seg;
            })}
            <text x="80" y="75" textAnchor="middle" className="res-dona-total">{fmt(total)}</text>
            <text x="80" y="95" textAnchor="middle" className="res-dona-sub">tickets</text>
          </svg>
        </div>
      </div>
    );
  };

  const renderBarras = () => {
    const lista = resumen?.cuarentena;
    if (!lista || lista.length === 0) return <p className="res-empty">No hay incidencias registradas.</p>;

    const items = [...lista].sort((a, b) => b.cantidad - a.cantidad);
    const max = items[0].cantidad || 1;

    return (
      <ul className="res-barras">
        {items.map((item, i) => {
          const activa = motivoFiltro === item.motivo && fuenteFiltro === item.fuente;
          return (
            <li key={i}>
              <button type="button"
                      className={`res-barra ${activa ? 'res-barra-activa' : ''}`}
                      onClick={() => handleBarra(item)}
                      title="Filtrar la tabla por este motivo">
                <span className="res-barra-texto">
                  <span className={`res-insignia ${fuenteInfo(item.fuente).clase}`}>{fuenteInfo(item.fuente).label}</span>
                  <span className="res-barra-motivo">{item.motivo}</span>
                </span>
                <span className="res-barra-pista">
                  <span className={`res-barra-relleno ${fuenteInfo(item.fuente).clase}`}
                        style={{ width: `${Math.max((item.cantidad / max) * 100, 2)}%` }} />
                </span>
                <span className="res-barra-valor">{fmt(item.cantidad)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderComparador = () => {
    if (!resultadoBusqueda) return null;
    const { versiones, filas, hayConflicto } = construirComparacion(
      resultadoBusqueda.sucios, resultadoBusqueda.limpio, resultadoBusqueda.encuestas_sucias);
    const encuestas = resultadoBusqueda.encuestas_sucias || [];
    const incidencias = resultadoBusqueda.incidencias || [];

    return (
      <div className="nx-resultado">
        {incidencias.length > 0 && (
          <div className="nx-incidencias">
            <span className="nx-incidencias-titulo">Incidencias ({incidencias.length})</span>
            <ul>
              {incidencias.map((inc, i) => (
                <li key={i}>
                  <span className={`res-insignia ${fuenteInfo(inc.fuente).clase}`}>{fuenteInfo(inc.fuente).label}</span>
                  <span>{inc.motivo}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {versiones.length > 1 && (
          <p className={`nx-aviso ${hayConflicto ? 'nx-aviso-alerta' : ''}`}>
            Este ticket llegó {versiones.length} veces en el archivo crudo
            {hayConflicto ? ' y las versiones no coinciden: se resaltan los campos en conflicto.' : '.'}
          </p>
        )}

        <div className="nx-tabla-scroll">
          <table className="nx-tabla">
            <thead>
              <tr>
                <th className="nx-col-campo">Campo</th>
                {versiones.length === 0
                  ? <th className="nx-th-antes">Antes</th>
                  : versiones.map((_, i) => (
                      <th key={i} className="nx-th-antes">
                        {versiones.length > 1 ? `Antes · versión ${i + 1}` : 'Antes'}
                      </th>
                    ))}
                <th className="nx-th-despues">Después</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.campo} className={`nx-fila nx-fila-${f.estado}`}>
                  <td className="nx-campo">
                    {f.campo}
                    {f.origen && <span className="nx-origen">{f.origen}</span>}
                  </td>
                  {(versiones.length === 0 ? [undefined] : f.antes).map((a, i) => (
                    <td key={i} className="nx-antes">{verValor(a)}</td>
                  ))}
                  <td className="nx-despues">
                    {verValor(f.despues)}
                    {ETIQUETAS[f.estado] && <span className={`nx-tag nx-tag-${f.estado}`}>{ETIQUETAS[f.estado]}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="nx-encuesta">
          <strong className="nx-encuesta-titulo">Encuesta cruda</strong>
          {encuestas.length > 0 ? (
            <div className="nx-tabla-scroll">
              <table className="nx-tabla nx-tabla-mini">
                <thead>
                  <tr>
                    {Object.keys(encuestas[0]).map((k) => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {encuestas.map((enc, i) => (
                    <tr key={i}>
                      {Object.keys(encuestas[0]).map((k) => (
                        <td key={k} className="nx-antes">{verValor(enc[k])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="nx-vacio">Sin encuesta registrada para este ticket.</p>
          )}
        </div>

        <p className="nx-leyenda">
          <span className="nx-punto nx-punto-cambio" /> Valor modificado
          <span className="nx-punto nx-punto-calculado" /> Campo calculado
          <span className="nx-punto nx-punto-conflicto" /> Versiones en conflicto
        </p>
      </div>
    );
  };

  const hayFiltros = fuenteFiltro || motivoFiltro;
  const totalMotivos = resumen?.cuarentena?.length || 0;

  return (
    <div className="res-card">
      <header className="res-encabezado">
        <h2>Resultado del ETL y cuarentena</h2>
        <p>Qué entró, qué quedó limpio y qué incidencias encontró el proceso.</p>
      </header>

      {renderKpis()}

      {resumen && (
        <div className="res-fila-graficos">
          <section className="res-panel">
            <h3>Emparejamiento de clientes</h3>
            <p className="res-panel-ayuda">Cómo se asignó cada ticket a un cliente del CRM.</p>
            {renderDona()}
          </section>

          <section className="res-panel">
            <h3>Incidencias por motivo</h3>
            <p className="res-panel-ayuda">
              {totalMotivos} {totalMotivos === 1 ? 'motivo' : 'motivos'}. Toca una barra para filtrar la tabla de abajo.
            </p>
            {renderBarras()}
          </section>
        </div>
      )}

      <section className="nx">
        <div className="nx-cabecera">
          <div>
            <h3>Comparador de tickets</h3>
            <p className="nx-descripcion">Busca un ID (ej. T00001 o C0394) y mira qué cambió el ETL.</p>
          </div>
          <form onSubmit={handleBuscar} className="nx-form">
            <input
              type="text" placeholder="Ej: T00001 o C0394" value={buscarId}
              onChange={(e) => setBuscarId(e.target.value)} className="nx-input"
              aria-label="ID de ticket o cliente"
            />
            <button type="submit" id="btn-buscar-comparar" className="nx-btn" disabled={buscando}>
              {buscando ? 'Buscando...' : 'Comparar'}
            </button>
          </form>
        </div>

        {errorBusqueda && (
          <div className="nx-error" role="status">
            <p>{errorBusqueda}</p>
          </div>
        )}

        {renderComparador()}
      </section>

      <section className="res-detalle">
        <div className="cuarentena-header">
          <div>
            <h3>Detalle de la cuarentena</h3>
            <p className="cuarentena-descripcion">Haz clic en un ID para compararlo arriba.</p>
          </div>

          <div className="filtro-fuente-container">
            <div className="res-chips" role="group" aria-label="Filtrar por fuente">
              <button type="button" className={`res-chip ${fuenteFiltro === '' ? 'res-chip-activo' : ''}`}
                      onClick={() => { setFuenteFiltro(''); setPagina(0); }}>Todas</button>
              {Object.entries(FUENTES).map(([clave, info]) => (
                <button key={clave} type="button"
                        className={`res-chip ${info.clase} ${fuenteFiltro === clave ? 'res-chip-activo' : ''}`}
                        onClick={() => { setFuenteFiltro(clave); setPagina(0); }}>
                  {info.label}
                </button>
              ))}
            </div>
            <select value={motivoFiltro} onChange={(e) => { setMotivoFiltro(e.target.value); setPagina(0); }}
                    className="res-select-input" aria-label="Filtrar por motivo">
              <option value="">Todos los motivos</option>
              {[...new Set(resumen?.cuarentena?.map(c => c.motivo) || [])].map((m, i) => (
                <option key={i} value={m}>{m}</option>
              ))}
            </select>
            {hayFiltros && (
              <button type="button" className="res-btn-texto" onClick={limpiarFiltros}>Quitar filtros</button>
            )}
          </div>
        </div>

        <div className="tabla-scroll-container">
          <table className="res-table">
            <thead>
              <tr><th>Fuente</th><th>ID registro</th><th>Valor original</th><th>Motivo</th><th>Candidato</th></tr>
            </thead>
            <tbody>
              {loadingTabla ? (
                <tr><td colSpan="5" className="celda-centrada">Cargando...</td></tr>
              ) : cuarentena.length > 0 ? cuarentena.map((q, i) => (
                <tr key={i}>
                  <td><span className={`res-insignia ${fuenteInfo(q.fuente).clase}`}>{fuenteInfo(q.fuente).label}</span></td>
                  <td>
                    {q.id_registro
                      ? <button type="button" className="res-id-clicable" onClick={() => handleBuscarDesdeTabla(q.id_registro)}>{q.id_registro}</button>
                      : <span className="res-null">N/A</span>}
                  </td>
                  <td>{q.valor_original || <span className="res-null">N/A</span>}</td>
                  <td className="celda-motivo">{q.motivo}</td>
                  <td>{q.candidato || <span className="res-null">-</span>}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="celda-centrada">No hay registros en cuarentena con estos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="res-pagination">
          <button disabled={pagina === 0 || loadingTabla} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina + 1}</span>
          <button disabled={cuarentena.length < limite || loadingTabla} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
        </div>
      </section>
    </div>
  );
}