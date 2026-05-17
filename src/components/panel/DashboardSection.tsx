import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { productService, orderService } from '@/config/setup';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useSalesStore } from '@/store/useSalesStore';
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
  // Delay chart render until after first paint so the container has real dimensions
  const [chartReady, setChartReady] = useState(false);
  
  const { stockSyncVersion } = useInventoryStore();
  const { salesSyncVersion } = useSalesStore();

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
  }, [loadDashboardData, salesSyncVersion, stockSyncVersion]);

  // Let the browser complete at least one layout pass before mounting the chart
  useEffect(() => {
    const raf = requestAnimationFrame(() => setChartReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-4 sm:pb-6">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-1">
            Resumen de <span className="text-kiora-red">Hoy</span>
          </h2>
          <p className="text-xs sm:text-base text-slate-500 font-medium">Panel de control y métricas en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-100">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            {isLoading ? 'Sincronizando...' : 'Sistema en Línea'}
          </div>
          <button onClick={() => void loadDashboardData()} className="p-2 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 text-slate-400 hover:text-kiora-red transition-all">
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </header>

      <SystemAlerts />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-white p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 duration-500 flex items-center gap-3 sm:gap-5">
            <div className={`flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl font-bold ${stat.bg} ${stat.color} shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3`}>
              <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.iconSvg} />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-slate-400 mb-0.5 truncate">{stat.label}</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <p className="text-sm sm:text-2xl font-black tracking-tight text-slate-900 truncate leading-none sm:leading-normal">{stat.value}</p>
                {stat.growth && (
                  <span className="text-[8px] sm:text-[10px] font-black text-emerald-500 bg-emerald-50 px-1 rounded-md w-fit mt-1 sm:mt-0">{stat.growth}</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <section className="rounded-2xl sm:rounded-[2.5rem] bg-white p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50 transition-all hover:shadow-xl duration-500">
            <div className="mb-5 sm:mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-lg font-black text-slate-800 uppercase tracking-widest">Evolución de Ventas</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Rendimiento semanal</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Alza +15%</span>
                </div>
              </div>
            </div>
            
            <div className="h-[200px] sm:h-[300px] w-full">
              {chartReady ? (
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
              ) : null}
            </div>
          </section>

          <section className="bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50">
            <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Ventas Recientes</h3>
              <button onClick={() => onNavigate('ventas')} className="text-[10px] font-bold text-[#ec131e] hover:underline uppercase tracking-widest">Ver Todas</button>
            </div>
            <div className="divide-y divide-slate-50">
              {orders.slice(0, 5).map(order => (
                <div key={order.id_vent} className="px-4 py-3 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-800 truncate">Orden #{order.id_vent}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">{order.metodopago_usu} • {order.fecha_vent ? new Date(order.fecha_vent).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-black text-slate-900">${Number(order.montofinal_vent).toLocaleString()}</p>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${isPaidStatus(order.estado) ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{order.estado}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="py-10 sm:py-12 text-center text-slate-400 text-xs font-bold italic">No hay actividad reciente.</div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section className="bg-[#111827] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-kiora-red/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-500">
                     <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.586 11.05a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" /></svg>
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-[0.25em]">Kiora Insights AI</h3>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg backdrop-blur-md">Experimental</span>
              </div>
              
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group/item">
                  <div className="absolute top-0 left-0 w-1 h-full bg-kiora-red" />
                  <p className="text-sm font-bold text-white/95 leading-relaxed">
                    "Hoy es un día de alta rotación. El producto <span className="text-kiora-red font-black underline decoration-2 underline-offset-4">X</span> está subiendo en tendencia. Considera un descuento flash."
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Rendimiento</p>
                  <p className="text-xs font-black text-emerald-400">+18% <span className="text-[9px] opacity-60 font-medium lowercase">vs semana pasada</span></p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50">
             <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Stock bajo</h3>
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
                  type="button"
                  onClick={() => onNavigate('productos')}
                  className="w-full mt-4 py-3 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Ver productos y stock
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
