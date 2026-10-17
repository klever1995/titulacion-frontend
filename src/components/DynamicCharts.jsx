import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DynamicCharts({ limpios }) {
  const [dimension, setDimension] = useState('categoria'); // Selector restaurado

  if (!limpios || limpios.length === 0) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Lógica para agrupar datos según la dimensión
  let chartData = [];
  
  if (dimension === 'agente') {
    // Para agente calculamos el tiempo promedio
    const dataAgrupada = limpios.reduce((acc, item) => {
      if (!acc[item.agente]) acc[item.agente] = { suma: 0, count: 0 };
      acc[item.agente].suma += item.tiempo_resolucion_horas;
      acc[item.agente].count += 1;
      return acc;
    }, {});
    chartData = Object.keys(dataAgrupada).map(k => ({ 
      name: k, 
      cantidad: parseFloat((dataAgrupada[k].suma / dataAgrupada[k].count).toFixed(2))
    }));
  } else if (dimension === 'periodo') {
    // Para periodo agrupamos por año-mes
    const dataAgrupada = limpios.reduce((acc, item) => {
      const mes = item.fecha_apertura ? item.fecha_apertura.substring(0, 7) : 'Sin fecha';
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});
    chartData = Object.keys(dataAgrupada).sort().map(k => ({ name: k, cantidad: dataAgrupada[k] }));
  } else {
    // Para categoria, canal y segmento (conteo simple)
    const dataAgrupada = limpios.reduce((acc, item) => {
      const val = item[dimension] || 'Sin dato';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    chartData = Object.keys(dataAgrupada).map(k => ({ name: k, cantidad: dataAgrupada[k] }));
  }

  // Función para renderizar el gráfico correcto según la dimensión
  const renderChart = () => {
    if (dimension === 'periodo') {
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" /><YAxis /><Tooltip />
          <Line type="monotone" dataKey="cantidad" stroke="#ef4444" strokeWidth={3} />
        </LineChart>
      );
    } else if (dimension === 'segmento') {
      return (
        <PieChart>
          <Pie data={chartData} dataKey="cantidad" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip /><Legend />
        </PieChart>
      );
    } else {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" /><YAxis /><Tooltip />
          <Bar dataKey="cantidad" fill={dimension === 'agente' ? '#8b5cf6' : '#3b82f6'} />
        </BarChart>
      );
    }
  };

  return (
    <div className="card">
      <h2>5. Análisis Dinámico (Selecciona la Dimensión)</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Ver análisis por:</label>
        <select value={dimension} onChange={(e) => setDimension(e.target.value)} className="select-input">
          <option value="categoria">Categoría</option>
          <option value="canal">Canal</option>
          <option value="agente">Agente (Tiempo Promedio)</option>
          <option value="segmento">Segmento</option>
          <option value="periodo">Periodo (Meses)</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}