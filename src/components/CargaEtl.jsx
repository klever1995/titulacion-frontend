import { useState } from 'react';
import api from '../api';
import '../styles/CargaEtl.css';

// Arma el texto con el número de tickets si el back lo envía; si no, usa su mensaje
const textoResultado = (data) => {
  const n = data?.total_tickets ?? data?.tickets_limpios;
  if (n != null) return `${n} tickets procesados.`;
  return data?.message || data?.mensaje || 'Proceso terminado.';
};

export default function CargaEtl({ onEtlCompletado }) {
  const [files, setFiles] = useState({ crm: null, tickets: null, encuestas: null });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubir = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!files.crm || !files.tickets || !files.encuestas) {
      setError('Por favor, selecciona los 3 archivos CSV.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('crm', files.crm);
    formData.append('tickets', files.tickets);
    formData.append('encuestas', files.encuestas);

    try {
      // ?ejecutar=true hace que el backend corra el ETL tras guardar los CSV
      const res = await api.post('/etl/subir?ejecutar=true', formData);
      setMensaje(`ETL ejecutado exitosamente. ${textoResultado(res.data)}`);
      onEtlCompletado();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          'Error al procesar los archivos. Revisa la consola.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEjemplo = async () => {
    setLoading(true);
    setError('');
    setMensaje('');
    try {
      const res = await api.post('/etl/ejecutar');
      setMensaje(`ETL con datos de ejemplo ejecutado. ${textoResultado(res.data)}`);
      onEtlCompletado();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          'Error al ejecutar con datos de ejemplo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="carga-container">
      <h2>1. Carga de Datos y Ejecución del ETL</h2>
      <p>
        Sube los 3 archivos CSV (CRM, Tickets, Encuestas) o usa los datos de
        ejemplo que ya están en el servidor.
      </p>

      <form onSubmit={handleSubir} className="carga-form">
        <div className="carga-file-input">
          <label>Archivo CRM:</label>
          <input type="file" name="crm" accept=".csv" onChange={handleChange} />
        </div>
        <div className="carga-file-input">
          <label>Archivo Tickets:</label>
          <input
            type="file"
            name="tickets"
            accept=".csv"
            onChange={handleChange}
          />
        </div>
        <div className="carga-file-input">
          <label>Archivo Encuestas:</label>
          <input
            type="file"
            name="encuestas"
            accept=".csv"
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="carga-btn-primary" disabled={loading}>
          {loading ? 'Procesando...' : 'Subir y Ejecutar ETL'}
        </button>
      </form>

      <div className="carga-ejemplo-section">
        <p>¿No tienes los archivos a mano?</p>
        <button
          onClick={handleEjemplo}
          className="carga-btn-secondary"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Usar Datos de Ejemplo'}
        </button>
      </div>

      {mensaje && <div className="carga-alert-success">{mensaje}</div>}
      {error && <div className="carga-alert-error">{error}</div>}
    </div>
  );
}