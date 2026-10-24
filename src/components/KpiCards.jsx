import '../styles/KpiCards.css';

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="kpi-dash-container">
      <h2>2. Indicadores Clave (KPIs)</h2>
      <div className="kpi-dash-grid">
        <div className="kpi-dash-card"><h3>Total Tickets</h3><p>{kpis.total_tickets}</p></div>
        <div className="kpi-dash-card"><h3>Tiempo Prom. (Hrs)</h3><p>{kpis.tiempo_promedio}</p></div>
        <div className="kpi-dash-card"><h3>Satisfacción</h3><p>{kpis.satisfaccion_promedio} / 5</p></div>
        <div className="kpi-dash-card"><h3>Reincidencia</h3><p>{kpis.reincidencia}%</p></div>
        <div className="kpi-dash-card"><h3>Cumplimiento SLA</h3><p>{kpis.cumplimiento_sla}%</p></div>
        <div className="kpi-dash-card"><h3>Tasa Escalamiento</h3><p>{kpis.tasa_escalamiento || 0}%</p></div>
        <div className="kpi-dash-card"><h3>Backlog (Abiertos)</h3><p>{kpis.backlog || 0}</p></div>
      </div>
    </div>
  );
}