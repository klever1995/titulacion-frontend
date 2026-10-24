import { useState, useEffect } from 'react';
import api from '../api';
import KpiCards from './KpiCards';
import DynamicCharts from './DynamicCharts';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [desglose, setDesglose] = useState([]);
  const [filtros, setFiltros] = useState({ categoria: '', canal: '', agente: '', segmento: '', desde: '', hasta: '' });
  const [opcionesFiltros, setOpcionesFiltros] = useState({ categorias: [], canales: [], agentes: [], segmentos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/filtros').then(res => setOpcionesFiltros(res.data)).catch(console.error);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => { if (value) queryParams.append(key, value); });
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const [resKpis, resDesglose] = await Promise.all([
        api.get(`/kpis${queryString}`),
        api.get(`/kpis/desglose?por=mes${queryString ? '&' + queryString.substring(1) : ''}`)
      ]);

      setKpis(resKpis.data);
      setDesglose(resDesglose.data);
    } catch (error) {
      console.error("Error cargando datos del dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filtros]);

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ categoria: '', canal: '', agente: '', segmento: '', desde: '', hasta: '' });
  };

  return (
    <div className="dashboard-container">
      {/* SECCIÓN DE FILTROS */}
      <div className="dash-card filtros-card">
        <h3 className="filtros-titulo">Filtros del Dashboard</h3>
        <div className="filtros-grid">
          <select name="categoria" value={filtros.categoria} onChange={handleFiltroChange} className="dash-select">
            <option value="">Todas las Categorías</option>
            {opcionesFiltros.categorias?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="canal" value={filtros.canal} onChange={handleFiltroChange} className="dash-select">
            <option value="">Todos los Canales</option>
            {opcionesFiltros.canales?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="agente" value={filtros.agente} onChange={handleFiltroChange} className="dash-select">
            <option value="">Todos los Agentes</option>
            {opcionesFiltros.agentes?.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select name="segmento" value={filtros.segmento} onChange={handleFiltroChange} className="dash-select">
            <option value="">Todos los Segmentos</option>
            {opcionesFiltros.segmentos?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" name="desde" value={filtros.desde} onChange={handleFiltroChange} className="dash-date" title="Desde" />
          <input type="date" name="hasta" value={filtros.hasta} onChange={handleFiltroChange} className="dash-date" title="Hasta" />
          <button onClick={limpiarFiltros} className="dash-btn-secondary">Limpiar Filtros</button>
        </div>
      </div>

      {loading ? (
        <div className="dash-card">Cargando KPIs...</div>
      ) : (
        <>
          <KpiCards kpis={kpis} />
          <DynamicCharts desgloseMes={desglose} limpios={[]} />
        </>
      )}
    </div>
  );
}