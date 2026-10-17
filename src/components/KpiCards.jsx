export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="card">
      <h2>2. KPIs Principales</h2>
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Tickets</h3>
          <p>{kpis.total_tickets}</p>
        </div>
        <div className="kpi-card">
          <h3>Tiempo Prom. (Hrs)</h3>
          <p>{kpis.tiempo_promedio}</p>
        </div>
        <div className="kpi-card">
          <h3>Satisfacción</h3>
          <p>{kpis.satisfaccion_promedio} / 5</p>
        </div>
        <div className="kpi-card">
          <h3>Reincidencia</h3>
          <p>{kpis.reincidencia}%</p>
        </div>
        <div className="kpi-card">
          <h3>Cumplimiento SLA</h3>
          <p>{kpis.cumplimiento_sla}%</p>
        </div>
      </div>
    </div>
  );
}