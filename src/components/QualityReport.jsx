import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function QualityReport({ calidad }) {
  if (!calidad) return null;

  const data = [
    { name: 'Completitud', Antes: calidad.completitud_antes, Después: calidad.completitud_despues },
    { name: 'Unicidad', Antes: calidad.unicidad_antes, Después: calidad.unicidad_despues },
    { name: 'Consistencia', Antes: calidad.consistencia_antes, Después: calidad.consistencia_despues },
    { name: 'Total', Antes: calidad.puntaje_total_antes, Después: calidad.puntaje_total_despues },
  ];

  return (
    <div className="card">
      <h2>3. Reporte de Calidad de Datos (Antes vs Después)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Antes" fill="#ef4444" />
          <Bar dataKey="Después" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}