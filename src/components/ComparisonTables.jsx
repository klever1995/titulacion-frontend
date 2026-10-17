import { useState } from 'react';

export default function ComparisonTables({ sucios, limpios }) {
  const [pageSucios, setPageSucios] = useState(0);
  const [pageLimpios, setPageLimpios] = useState(0);
  const filasPorPagina = 5;

  if (!sucios || sucios.length === 0 || !limpios || limpios.length === 0) return null;

  const totalPaginasSucios = Math.ceil(sucios.length / filasPorPagina);
  const totalPaginasLimpios = Math.ceil(limpios.length / filasPorPagina);

  const suciosPaginados = sucios.slice(pageSucios * filasPorPagina, (pageSucios + 1) * filasPorPagina);
  const limpiosPaginados = limpios.slice(pageLimpios * filasPorPagina, (pageLimpios + 1) * filasPorPagina);

  // Función auxiliar para pintar los nulos de forma uniforme
  const formatNulo = (valor) => {
    if (valor === null || valor === undefined || valor === 'None' || valor === 'NaN' || valor === '') {
      return <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Sin dato</span>;
    }
    return valor;
  };

  return (
    <div className="card">
      <h2>4. Comparación de Registros (Auditoría de Datos)</h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
        Total procesados: <strong>{limpios.length} registros</strong>. Navega usando los botones inferiores.
      </p>
      
      <div className="tables-wrapper">
        {/* TABLA DE SUCIOS */}
        <div className="table-box">
          <h3>❌ Antes (Datos Crudos)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Apertura</th><th>Cierre</th><th>Categoría</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {suciosPaginados.map((s, i) => (
                  <tr key={i}>
                    <td>{s.id_ticket}</td>
                    <td style={{color: s.id_cliente ? 'inherit' : 'red', fontWeight: s.id_cliente ? 'normal' : 'bold'}}>
                      {s.id_cliente || 'NULO'}
                    </td>
                    <td>{formatNulo(s.fecha_apertura)}</td>
                    <td>{formatNulo(s.fecha_cierre)}</td>
                    <td style={{textTransform: 'uppercase'}}>{s.categoria}</td>
                    <td>{s.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button disabled={pageSucios === 0} onClick={() => setPageSucios(pageSucios - 1)}>Anterior</button>
            <span>Pág {pageSucios + 1} de {totalPaginasSucios}</span>
            <button disabled={pageSucios >= totalPaginasSucios - 1} onClick={() => setPageSucios(pageSucios + 1)}>Siguiente</button>
          </div>
        </div>
        
        {/* TABLA DE LIMPIOS */}
        <div className="table-box">
          <h3>✅ Después (Datos Procesados)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Apertura</th><th>Cierre</th><th>Categoría</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {limpiosPaginados.map((l, i) => (
                  <tr key={i}>
                    <td>{l.id_ticket}</td>
                    <td>{formatNulo(l.id_cliente)}</td>
                    <td>{formatNulo(l.fecha_apertura)}</td>
                    <td>{formatNulo(l.fecha_cierre)}</td>
                    <td>{l.categoria}</td>
                    <td>{l.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button disabled={pageLimpios === 0} onClick={() => setPageLimpios(pageLimpios - 1)}>Anterior</button>
            <span>Pág {pageLimpios + 1} de {totalPaginasLimpios}</span>
            <button disabled={pageLimpios >= totalPaginasLimpios - 1} onClick={() => setPageLimpios(pageLimpios + 1)}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}