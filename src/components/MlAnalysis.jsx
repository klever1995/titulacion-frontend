import { useState } from 'react';
import axios from 'axios';

export default function MlAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      // AQUÍ ESTÁ EL CAMBIO: Ya no dice /tickets/
      const res = await axios.get('/api/analisis-factores');
      setData(res.data);
    } catch (error) {
      console.error(error);
      alert("Error al obtener el análisis. Asegúrate de haber ejecutado el ETL primero.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>6. Análisis Predictivo (Machine Learning)</h2>
      <p>Factores que más influyen en el incumplimiento del SLA.</p>
      <button onClick={fetchAnalysis} className="btn-secondary" disabled={loading}>
        {loading ? 'Analizando...' : 'Ejecutar Análisis ML'}
      </button>
      
      {data && data.factores_impacto && (
        <div className="ml-results">
          <ul>
            {Object.entries(data.factores_impacto).map(([factor, valor], index) => (
              <li key={index}>
                <strong>{factor}:</strong> {valor}
              </li>
            ))}
          </ul>
          <p className="ml-note">{data.interpretacion}</p>
        </div>
      )}
    </div>
  );
}