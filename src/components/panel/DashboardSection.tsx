import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { productService, orderService } from '@/config/setup';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { Product } from '@/models/Product';
import type { Order } from '@/models/Order';
import { SystemAlerts } from './SystemAlerts';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardSectionProps {
  onNavigate: (tab: string) => void;
  isAdmin?: boolean;
}

export function DashboardSection({ onNavigate, isAdmin }: DashboardSectionProps) {
  const { lowStockItems: criticalStock, fetchLowStock } = useInventoryStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  // Datos simulados para evolución si no hay suficientes datos reales
  const evolutionData = useMemo(() => {
    if (!statsData?.evolucion_ventas) {
      return [
        { name: 'Lunes', total: 4000 },
        { name: 'Martes', total: 3000 },
        { name: 'Miércoles', total: 5000 },
        { name: 'Jueves', total: 2780 },
        { name: 'Viernes', total: 1890 },
        { name: 'Sábado', total: 2390 },
        { name: 'Domingo', total: 3490 },
      ];
    }
    return statsData.evolucion_ventas;
  }, [statsData]);

  const isPaidStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'completada' || normalized === 'pagado' || normalized === 'pagada';
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, orderRes] = await Promise.all([
        orderService.getDashboardStats().catch(() => null),
        orderService.getOrders(1, 10).catch(() => null)
      ]);
      
      void fetchLowStock();

      if (statsRes) {
        setStatsData(statsRes);
      }

      if (orderRes) {
        const ordersArr = Array.isArray(orderRes) ? orderRes : (orderRes.data || []);
        setOrders(ordersArr);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLowStock]);

  useEffect(() => {
    void loadDashboardData();

    const handleRefresh = () => void loadDashboardData();
    window.addEventListener('kiora-refresh-alerts', handleRefresh);
    const poll = setInterval(() => void loadDashboardData(), 60000);

    return () => {
      window.removeEventListener('kiora-refresh-alerts', handleRefresh);
      clearInterval(poll);
    };
  }, [loadDashboardData]);

  const stats = [
    { 
      label: 'Ventas de Hoy', 
      value: `$${Number(statsData?.monto_total || 0).toLocaleString('es-CO')}`, 
      icon: 'money', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50', 
      iconSvg: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      label: 'Pedidos Hoy', 
      value: (statsData?.ventas_hoy || 0).toString(), 
      icon: 'clipboard', 
      color: 'text-blue-500', 
      bg: 'bg-blue-50', 
      iconSvg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
    },
    { 
      label: 'Stock Bajo', 
      value: `${criticalStock.length} Items`, 
      icon: 'alert', 
      color: 'text-red-500', 
      bg: 'bg-red-50', 
      iconSvg: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' 
    },
    { 
      label: 'Ticket Promedio', 
      value: `$${Number(statsData?.ticket_promedio || 0).toLocaleString('es-CO')}`, 
      icon: 'sparkles', 
      color: 'text-purple-500', 
      bg: 'bg-purple-50', 
      growth: '+12%', 
      iconSvg: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Resumen de Hoy</h2>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {isLoading ? 'Conectando...' : 'En línea'}
        </div>
      </header>

      <SystemAlerts />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-500">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${stat.bg} ${stat.color} shadow-sm`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.iconSvg} />
                </svg>
              </div>
              {stat.growth && (
                <span className="text-xs font-bold text-emerald-500">{stat.growth}</span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{stat.value}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50 transition-all hover:shadow-xl duration-500">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Evolución de Ventas</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Rendimiento semanal</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Alza +15%</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec131e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ec131e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    hide
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{payload[0].payload.name}</p>
                            <p className="text-sm font-black">${Number(payload[0].value).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#ec131e" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Ventas Recientes</h3>
              <button onClick={() => onNavigate('ventas')} className="text-[10px] font-bold text-[#ec131e] hover:underline uppercase tracking-widest">Ver Todas</button>
            </div>
            <div className="divide-y divide-slate-50">
              {orders.slice(0, 5).map(order => (
                <div key={order.id_vent} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Orden #{order.id_vent}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{order.metodopago_usu} • {order.fecha_vent ? new Date(order.fecha_vent).toLocaleTimeString() : '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${Number(order.montofinal_vent).toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${isPaidStatus(order.estado) ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{order.estado}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold italic">No hay actividad reciente.</div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-1.516-1.555-3.497z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.586 11.05a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" /></svg>
                </div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em]">Kiora Insights AI</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-xs font-bold text-white/90 leading-relaxed italic">
                    "Hoy es un día de alta rotación. El producto <span className="text-[#ec131e] font-black">X</span> está subiendo en tendencia. Considera un descuento flash."
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[11px] font-bold text-emerald-400">Rendimiento: +18% vs semana pasada</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Alertas de Inventario</h3>
                <span className="h-5 w-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-[10px] font-black">{criticalStock.length}</span>
             </div>
             <div className="space-y-3">
                {criticalStock.slice(0, 3).map(p => (
                  <div key={p.cod_prod} className="flex items-center gap-3 p-3 rounded-2xl bg-red-50/50 border border-red-100/50">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-red-500 font-black text-[10px] shadow-sm">
                      {p.stock_actual}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{p.nom_prod}</p>
                      <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Reponer pronto</p>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => onNavigate('inventario')}
                  className="w-full mt-4 py-3 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Ver Todo el Inventario
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
