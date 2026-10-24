import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import '../styles/DynamicCharts.css';

export default function DynamicCharts({ desgloseMes }) {
  const [dataCanal, setDataCanal] = useState([]);
  const [dataCategoria, setDataCategoria] = useState([]);
  const [dataAgente, setDataAgente] = useState([]);
  const [dataSegmento, setDataSegmento] = useState([]);
  
  useEffect(() => {
    Promise.all([
      api.get('/kpis/desglose?por=canal'),
      api.get('/kpis/desglose?por=categoria'),
      api.get('/kpis/desglose?por=agente'),
      api.get('/kpis/desglose?por=segmento')
    ]).then(([resCanal, resCat, resAgente, resSeg]) => {
      setDataCanal(resCanal.data.map(d => ({ name: d.canal, cantidad: d.total_tickets })));
      setDataCategoria(resCat.data.map(d => ({ name: d.categoria, cantidad: d.total_tickets })));
      setDataAgente(resAgente.data.map(d => ({ name: d.agente, cantidad: d.tiempo_promedio }))); 
      
      const segmentosAgrupados = resSeg.data.reduce((acc, d) => {
        let nombre = d.segmento;
        if (!nombre || nombre.toLowerCase() === 'nan' || nombre === 'Sin clasificar') {
          nombre = 'Sin clasificar';
        }
        acc[nombre] = (acc[nombre] || 0) + d.total_tickets;
        return acc;
      }, {});
      
      setDataSegmento(Object.keys(segmentosAgrupados).map(k => ({ name: k, value: segmentosAgrupados[k] })));
    }).catch(console.error);
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const chartPeriodo = desgloseMes.map(d => ({ name: d.mes, cantidad: d.total_tickets }));

  return (
    <div className="charts-main-container">
      <h2>3. Análisis Visual (Requerimientos PDF)</h2>
      
      <div className="charts-grid-layout">
        {/* Gráfico 1: Categoría */}
        <div className="chart-box-item">
          <h3>Volumen por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataCategoria}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="cantidad" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 2: Canal */}
        <div className="chart-box-item">
          <h3>Volumen por Canal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataCanal}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="cantidad" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 3: Agente */}
        <div className="chart-box-item">
          <h3>Tiempo Promedio por Agente</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataAgente}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="cantidad" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 4: Segmento */}
        <div className="chart-box-item">
          <h3>Distribución por Segmento</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dataSegmento} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {dataSegmento.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 5: Periodo (Ocupa las dos columnas) */}
        <div className="chart-box-item chart-full-width">
          <h3>Evolución por Periodo (Meses)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartPeriodo} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="cantidad" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}