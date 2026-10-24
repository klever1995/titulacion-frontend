import { useState } from 'react';
import logo from './assets/logo3.png';
import CargaEtl from './components/CargaEtl';
import Perfilado from './components/Perfilado';
import ResultadoEtl from './components/ResultadoEtl';
import QualityReport from './components/QualityReport';
import Dashboard from './components/Dashboard';
import MlAnalysis from './components/MlAnalysis';
import './App.css';

function App() {
  const [etlEjecutado, setEtlEjecutado] = useState(false);
  const [activeTab, setActiveTab] = useState('carga');
  // Estado global del análisis ML: sobrevive al cambiar de ventana
  const [mlData, setMlData] = useState(null);

  // Al completar un ETL nuevo, se invalida el análisis ML anterior
  const handleEtlCompletado = () => {
    setEtlEjecutado(true);
    setMlData(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <img src={logo} alt="Logo UCE" className="header-logo" />
        <div className="header-content">
          <div className="header-text">
            <h1>Plataforma Analítica para Calidad del Servicio y Satisfacción</h1>
            <p className="header-subtitle">Facultad de Ingeniería y Ciencias Aplicadas - Carrera de Sistemas de Información</p>
            <p className="header-student">Estudiante: Robalino Guamán Klever Sandro</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'carga' ? 'active' : ''}`} onClick={() => setActiveTab('carga')}>1. Carga ETL</button>
          <button className={`tab-btn ${activeTab === 'perfilado' ? 'active' : ''}`} onClick={() => setActiveTab('perfilado')} disabled={!etlEjecutado}>2. Perfilado</button>
          <button className={`tab-btn ${activeTab === 'resultado' ? 'active' : ''}`} onClick={() => setActiveTab('resultado')} disabled={!etlEjecutado}>3. Resultado ETL</button>
          <button className={`tab-btn ${activeTab === 'calidad' ? 'active' : ''}`} onClick={() => setActiveTab('calidad')} disabled={!etlEjecutado}>4. Calidad</button>
          <button className={`tab-btn ${activeTab === 'kpis' ? 'active' : ''}`} onClick={() => setActiveTab('kpis')} disabled={!etlEjecutado}>5. KPIs</button>
          <button className={`tab-btn ${activeTab === 'factores' ? 'active' : ''}`} onClick={() => setActiveTab('factores')} disabled={!etlEjecutado}>6. Factores ML</button>
        </div>

        {activeTab === 'carga' && <CargaEtl onEtlCompletado={handleEtlCompletado} />}
        {activeTab === 'perfilado' && etlEjecutado && <Perfilado />}
        {activeTab === 'resultado' && etlEjecutado && <ResultadoEtl />}
        {activeTab === 'calidad' && etlEjecutado && <QualityReport />}
        {activeTab === 'kpis' && etlEjecutado && <Dashboard />}
        {activeTab === 'factores' && etlEjecutado && (
          <MlAnalysis data={mlData} setData={setMlData} />
        )}
      </main>
    </div>
  );
}

export default App;