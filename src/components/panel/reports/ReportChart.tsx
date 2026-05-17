import React from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ReportChartProps {
  data: any[];
  type: 'ventas_detalladas' | 'mas_vendidos' | 'menos_vendidos';
}

const COLORS = ['#ec131e', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export function ReportChart({ data, type }: ReportChartProps) {
  if (data.length === 0) return null;

  if (type === 'ventas_detalladas') {
    const chartData = data.map(d => ({
      name: d.period,
      Ventas: d.totalSales,
      Pedidos: d.orderCount,
      TicketPromedio: d.averageTicket
    }));

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Líneas - Tendencia de Ventas */}
        <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="font-black text-slate-900 uppercase tracking-tight">Evolución de Ingresos</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Tendencia lineal del monto de ventas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`$${value.toLocaleString('es-CO')}`, 'Ingresos']} />
                <Line yAxisId="left" type="monotone" dataKey="Ventas" stroke="#ec131e" strokeWidth={4} dot={{ r: 4, fill: '#ec131e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Cantidad de Pedidos */}
        <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="font-black text-slate-900 uppercase tracking-tight">Volumen de Pedidos</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Cantidad de transacciones por periodo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`${value} pedidos`, 'Pedidos']} />
                <Bar dataKey="Pedidos" radius={[6, 6, 0, 0]} fill="#0f172a" maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Área/Barras - Ticket Promedio */}
        <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white xl:col-span-2">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="font-black text-slate-900 uppercase tracking-tight">Ticket Promedio</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Valor promedio por venta
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, 'Ticket Promedio']} />
                <Bar dataKey="TicketPromedio" radius={[6, 6, 0, 0]} fill="#cbd5e1" maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    // mas_vendidos o menos_vendidos
    const chartData = data.map(d => ({
      name: d.productName,
      Ingresos: d.totalRevenue,
      Cantidad: d.quantitySold
    }));

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Barras Horizontal - Ingresos por Producto */}
        <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="font-black text-slate-900 uppercase tracking-tight">Ingresos por Producto</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Comparativa de facturación (Top {chartData.length})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} width={90} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`$${value.toLocaleString('es-CO')}`, 'Ingresos']} />
                <Bar dataKey="Ingresos" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Circular - Proporción de Cantidades */}
        <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="font-black text-slate-900 uppercase tracking-tight">Distribución de Unidades</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Participación por cantidad vendida
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  dataKey="Cantidad" 
                  nameKey="name" 
                  cx="50%" 
                  cy="45%" 
                  outerRadius={100} 
                  innerRadius={60}
                  paddingAngle={5}
                  labelLine={false} 
                  label={({ percent }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`${value} unidades`, 'Cantidad']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b', paddingBottom: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }
}
