import { useState } from 'react';
import axios from 'axios';
import UploadForm from './components/UploadForm';
import KpiCards from './components/KpiCards';
import QualityReport from './components/QualityReport';
import ComparisonTables from './components/ComparisonTables';
import DynamicCharts from './components/DynamicCharts';
import MlAnalysis from './components/MlAnalysis';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [kpis, setKpis] = useState(null);
  const [calidad, setCalidad] = useState(null);
  const [sucios, setSucios] = useState([]);
  const [limpios, setLimpios] = useState([]);
  
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('rubrica'); 

  const handleUpload = async (files) => {
    setLoading(true);
    setMensaje('');

    const formData = new FormData();
    formData.append('crm', files.crm);
    formData.append('tickets', files.tickets);
    formData.append('encuestas', files.encuestas);

    try {
      const res = await axios.post('/api/upload-etl', formData);
      setMensaje(res.data.message);
      
      const [resSucios, resLimpios, resKpis, resCalidad] = await Promise.all([
        axios.get('/api/sucios'),
        axios.get('/api/limpios'),
        axios.get('/api/kpis'),
        axios.get('/api/calidad')
      ]);

      setSucios(resSucios.data);
      setLimpios(resLimpios.data);
      setKpis(resKpis.data);
      setCalidad(resCalidad.data);
    } catch (error) {
      console.error(error);
      setMensaje('Error al procesar los archivos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Plataforma BI - Calidad de Servicio</h1>
        <p>Proyecto de Titulación - Complexivo</p>
      </header>

      <main className="app-main">
        <UploadForm onUpload={handleUpload} loading={loading} />
        
        {mensaje && <div className="alert-success">{mensaje}</div>}

        {/* Sistema de Pestañas */}
        {kpis && (
          <>
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'rubrica' ? 'active' : ''}`}
                onClick={() => setActiveTab('rubrica')}
              >
                Dashboard Principal (Rúbrica)
              </button>
              <button 
                className={`tab-btn ${activeTab === 'mejoras' ? 'active' : ''}`}
                onClick={() => setActiveTab('mejoras')}
              >
                Análisis Avanzado y Calidad
              </button>
            </div>

            {/* Contenido de la Pestaña 1: Lo que pide el PDF */}
            {activeTab === 'rubrica' && (
              <div className="tab-content">
                <KpiCards kpis={kpis} />
                <ComparisonTables sucios={sucios} limpios={limpios} />
                <DynamicCharts limpios={limpios} />
              </div>
            )}

            {/* Contenido de la Pestaña 2: Las mejoras de la IA */}
            {activeTab === 'mejoras' && (
              <div className="tab-content">
                <QualityReport calidad={calidad} />
                <MlAnalysis />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;