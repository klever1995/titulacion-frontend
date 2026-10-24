import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';
import '../styles/Perfilado.css';

export default function Perfilado() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get('/perfilado');
        setPerfil(res.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el perfilado. Asegúrate de haber ejecutado el ETL primero.');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  if (loading) return <div className="perfilado-card">Cargando perfilado...</div>;
  if (error) return <div className="perfilado-alerta-error">{error}</div>;
  if (!perfil) return null;

  const renderFuente = (nombre, data) => {
    // Preparamos los datos para el gráfico de barras
    const dataGrafico = data.reglas ? [
      { name: 'Completitud', errores: data.reglas.filter(r => r.dimension === 'completitud').reduce((sum, r) => sum + r.registros_con_error, 0) },
      { name: 'Unicidad', errores: data.reglas.filter(r => r.dimension === 'unicidad').reduce((sum, r) => sum + r.registros_con_error, 0) },
      { name: 'Consistencia', errores: data.reglas.filter(r => r.dimension === 'consistencia').reduce((sum, r) => sum + r.registros_con_error, 0) },
      { name: 'Validez', errores: data.reglas.filter(r => r.dimension === 'validez').reduce((sum, r) => sum + r.registros_con_error, 0) },
    ] : [];

    return (
      <div className="perfilado-fuente-box">
        <h3>Fuente: {nombre.toUpperCase()} <span className="total-filas">({data.filas} filas)</span></h3>
        
        <div className="perfilado-columnas">
          {data.columnas && (
            <div className="perfilado-seccion">
              <h4 className="perfilado-titulo-seccion">Problemas por columna (Nulos):</h4>
              <table className="perfilado-table">
                <thead><tr><th>Columna</th><th>Nulos</th><th>% Nulos</th></tr></thead>
                <tbody>
                  {data.columnas.map((col, i) => (
                    <tr key={i}>
                      <td>{col.columna}</td>
                      <td className={col.nulos > 0 ? 'texto-error' : ''}>{col.nulos}</td>
                      <td>{col.porcentaje_nulos}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.reglas && data.reglas.length > 0 && (
            <div className="perfilado-seccion">
              <h4 className="perfilado-titulo-seccion">Reglas de Calidad Incumplidas:</h4>
              <div className="tabla-scroll-perfilado">
                <table className="perfilado-table">
                  <thead><tr><th>Dimensión</th><th>Regla</th><th>Errores</th></tr></thead>
                  <tbody>
                    {data.reglas.map((regla, i) => (
                      <tr key={i}>
                        <td className="texto-capitalize">{regla.dimension}</td>
                        <td>{regla.regla}</td>
                        <td className="texto-error-bold">{regla.registros_con_error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de resumen de errores por dimensión */}
        {dataGrafico.length > 0 && dataGrafico.some(d => d.errores > 0) && (
          <div className="perfilado-grafico">
            <h4 className="perfilado-titulo-seccion">Resumen de Errores por Dimensión de Calidad</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={15} />
                <YAxis fontSize={15} />
                <Tooltip />
                <Bar dataKey="errores" fill="#3b82f6" name="Cantidad de Errores" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="perfilado-card">
      <h2>2. Perfilado de Datos Crudos</h2>
      <p className="perfilado-descripcion">
        Análisis de los problemas de calidad encontrados en las 3 fuentes <strong>antes</strong> de aplicar el ETL.
      </p>
      
      {renderFuente('crm', perfil.crm)}
      {renderFuente('tickets', perfil.tickets)}
      {renderFuente('encuestas', perfil.encuestas)}
    </div>
  );
}