import { useState } from 'react';

export default function UploadForm({ onUpload, loading }) {
  const [files, setFiles] = useState({ crm: null, tickets: null, encuestas: null });

  const handleChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.crm && files.tickets && files.encuestas) {
      onUpload(files);
    } else {
      alert("Por favor, selecciona los 3 archivos CSV.");
    }
  };

  return (
    <div className="card">
      <h2>1. Cargar Datos y Ejecutar ETL</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input">
          <label>CRM:</label>
          <input type="file" name="crm" accept=".csv" onChange={handleChange} />
        </div>
        <div className="file-input">
          <label>Tickets:</label>
          <input type="file" name="tickets" accept=".csv" onChange={handleChange} />
        </div>
        <div className="file-input">
          <label>Encuestas:</label>
          <input type="file" name="encuestas" accept=".csv" onChange={handleChange} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Procesando...' : 'Ejecutar Limpieza'}
        </button>
      </form>
    </div>
  );
}