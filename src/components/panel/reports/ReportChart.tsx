import React from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ReportChartProps {
  data: any[];
  type: 'ventas_detalladas' | 'mas_vendidos' | 'menos_vendidos';
}

export function ReportChart({ data, type }: ReportChartProps) {
  if (data.length === 0) return null;

  const chartData = type === 'ventas_detalladas' 
    ? data.map(d => ({
        name: d.period,
        value: d.totalSales,
      }))
    : data.map(d => ({
        name: d.productName,
        value: d.totalRevenue,
      }));

  const config = {
    value: {
      label: type === 'ventas_detalladas' ? "Ventas" : "Ingresos",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white mb-8">
      <CardHeader className="p-8 pb-0">
        <CardTitle className="font-black text-slate-900 uppercase tracking-tight">Visualización de Datos</CardTitle>
        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {type === 'ventas_detalladas' ? 'Evolución de ventas en el periodo' : 'Comparativa de ingresos por producto'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-6 h-[350px]">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]} 
                fill="#ec131e"
                maxBarSize={50}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ec131e' : '#fca5a5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
