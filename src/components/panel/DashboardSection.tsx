import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { productService, orderService, aiService } from '@/config/setup';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useSalesStore } from '@/store/useSalesStore';
import type { Product } from '@/models/Product';
import type { Order } from '@/models/Order';
import type { DashboardInsights } from '@/services/AiService';
import { SystemAlerts } from './SystemAlerts';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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
  const [chartReady, setChartReady] = useState(false);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState(false);

  const { stockSyncVersion } = useInventoryStore();
  const { salesSyncVersion } = useSalesStore();

  const evolutionData = useMemo(() => {
    if (!statsData?.evolucion_ventas) {
      return [
        { name: 'Lun', total: 4000 }, { name: 'Mar', total: 3000 },
        { name: 'Mié', total: 5000 }, { name: 'Jue', total: 2780 },
        { name: 'Vie', total: 1890 }, { name: 'Sáb', total: 2390 },
        { name: 'Dom', total: 3490 },
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
      if (statsRes) setStatsData(statsRes);
      if (orderRes) {
        setOrders(Array.isArray(orderRes) ? orderRes : (orderRes.data || []));
      }

      // Cargar insights del AI service
      setInsightsLoading(true);
      setInsightsError(false);
      try {
        const insightsData = await aiService.getInsights();
        setInsights(insightsData);
      } catch {
        setInsightsError(true);
      } finally {
        setInsightsLoading(false);
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

  useEffect(() => {
    const raf = requestAnimationFrame(() => setChartReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Sin ventas hoy';
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Última hace ${diffMins} min`;
    const diffHrs = Math.floor(diffMins / 60);
    return `Última hace ${diffHrs} hr${diffHrs > 1 ? 's' : ''}`;
  };

  const formatTrend = (trendValue: number | undefined) => {
    if (trendValue === undefined || trendValue === null) return null;
    const isUp = trendValue >= 0;
    const sign = isUp ? '+' : '';
    return { text: `${sign}${trendValue.toFixed(1)}% vs ayer`, isUp };
  };

  const montoTrend = formatTrend(statsData?.trend_monto);
  const ticketTrend = formatTrend(statsData?.trend_ticket);

  const stats = [
    {
      label: 'Ventas de Hoy',
      value: `$${Number(statsData?.monto_total || 0).toLocaleString('es-CO')}`,
      trend: montoTrend?.text || null,
      trendUp: montoTrend?.isUp ?? true,
      icon: 'payments',
      navigateTo: 'ventas',
    },
    {
      label: 'Órdenes',
      value: (statsData?.ventas_hoy || 0).toString(),
      meta: formatTimeAgo(statsData?.ultima_venta?.fecha_vent),
      icon: 'receipt_long',
      navigateTo: 'ventas',
    },
    {
      label: 'Ticket Promedio',
      value: `$${Number(statsData?.ticket_promedio || 0).toLocaleString('es-CO')}`,
      trend: ticketTrend?.text || null,
      trendUp: ticketTrend?.isUp ?? true,
      icon: 'sell',
      navigateTo: 'reportes',
    },
    {
      label: 'Alertas Stock',
      value: `${criticalStock.length}`,
      alert: true,
      icon: 'warning',
      cta: 'Requiere atención',
      navigateTo: 'inventario',
    },
  ];

  // Donut data
  const totalPagos = (statsData?.pagos_efectivo || 0) + (statsData?.pagos_tarjeta || 0);
  const cashPercentage = totalPagos > 0 ? Math.round(((statsData?.pagos_efectivo || 0) / totalPagos) * 100) : 0;
  const cardPercentage = totalPagos > 0 ? Math.round(((statsData?.pagos_tarjeta || 0) / totalPagos) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">Dashboard</h2>
          <p className="body-md text-on-surface-variant">Resumen general de tu negocio hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('inventario')}
            className="flex items-center gap-2 border border-outline-variant bg-surface text-on-surface-variant rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-surface-container-high transition-all active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Inventario
          </button>
          <button
            type="button"
            onClick={() => useSalesStore.getState().setIsOrderDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-all active:scale-[0.97]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Venta
          </button>
        </div>
      </div>

      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            role="button"
            tabIndex={0}
            onClick={() => onNavigate(stat.navigateTo)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate(stat.navigateTo)}
            className={`relative overflow-hidden rounded-xl p-3.5 sm:p-5 border transition-all hover:shadow-md cursor-pointer select-none active:scale-[0.98] flex flex-col justify-between ${
              stat.alert
                ? 'bg-surface border-error hover:border-error/80'
                : 'bg-surface border-outline-variant/40 hover:border-primary/40'
            }`}
          >
            {/* Background icon */}
            <div className="absolute top-2 right-2 opacity-[0.06] pointer-events-none">
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d={
                  stat.icon === 'payments' ? 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' :
                  stat.icon === 'receipt_long' ? 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' :
                  stat.icon === 'sell' ? 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M8.25 8.625l4.125 4.125 4.125-4.125' :
                  'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
                } />
              </svg>
            </div>

            <div className={`text-[11px] sm:text-xs font-medium mb-1.5 truncate ${stat.alert ? 'text-error' : 'text-on-surface-variant'}`}>
              {stat.label}
            </div>
            <div className={`text-base sm:text-2xl font-bold tracking-tight mb-1 truncate ${
              stat.alert ? 'text-error' : 'text-on-surface'
            }`}>
              {stat.value}
            </div>
            {stat.trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-error'}`}>
                {stat.trendUp ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
                  </svg>
                )}
                <span>{stat.trend}</span>
              </div>
            )}
            {stat.meta && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-on-surface-variant">{stat.meta}</span>
              </div>
            )}
            {stat.cta && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-xs font-medium text-error">{stat.cta}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Chart + Recent Sales */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Chart */}
          <div id="section-tendencia" className="bg-surface rounded-xl border border-outline-variant/40 p-5 scroll-mt-20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="headline-sm text-on-surface">Tendencia de Ventas</h3>
              <select className="bg-surface-container-high border-none rounded-lg text-sm text-on-surface-variant px-3 py-1.5 focus:ring-2 focus:ring-primary/30">
                <option>Últimos 7 días</option>
                <option>Este mes</option>
              </select>
            </div>
            <div className="h-[260px]">
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebe0de" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#84746f' }} dy={8} />
                    <YAxis hide />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="bg-surface text-on-surface rounded-lg px-3 py-2 shadow-lg border border-outline-variant/30 text-sm font-semibold">
                            <p className="text-xs text-on-surface-variant">{payload[0].payload.name}</p>
                            <p>${Number(payload[0].value).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {evolutionData.map((entry: any, index: number, arr: any[]) => {
                        const maxVal = Math.max(...arr.map(d => d.total)) || 1;
                        const opacity = 0.2 + (entry.total / maxVal) * 0.8;
                        return <Cell key={`cell-${index}`} fill={`rgba(236, 19, 30, ${opacity})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Recent Sales Table */}
          <div id="section-ventas-recientes" className="bg-surface rounded-xl border border-outline-variant/40 p-5 scroll-mt-20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="headline-sm text-on-surface">Ventas Recientes</h3>
              <button onClick={() => onNavigate('ventas')} className="text-sm font-semibold text-primary hover:underline">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="pb-3 label-sm text-on-surface-variant font-medium">Orden #</th>
                    <th className="pb-3 label-sm text-on-surface-variant font-medium">Hora</th>
                    <th className="pb-3 label-sm text-on-surface-variant font-medium">Total</th>
                    <th className="pb-3 label-sm text-on-surface-variant font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id_vent} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                      <td className="py-3 label-md text-on-surface">#{order.id_vent}</td>
                      <td className="py-3 body-md text-on-surface-variant">
                        {order.fecha_vent ? new Date(order.fecha_vent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 label-md text-on-surface">${Number(order.montofinal_vent).toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPaidStatus(order.estado)
                            ? 'bg-emerald-100 text-emerald-700'
                            : String(order.estado).toLowerCase() === 'cancelada' || String(order.estado).toLowerCase() === 'cancelado'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-sm text-on-surface-variant italic">No hay actividad reciente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Donut + Stock Alerts + AI */}
        <div className="flex flex-col gap-4">

          {/* Payment Methods Donut */}
          <div className="bg-surface rounded-xl border border-outline-variant/40 p-5">
            <h3 className="headline-sm text-on-surface mb-4">Métodos de Pago</h3>
            <div className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#ec131e 0% ${cardPercentage}%, #ccfbf1 ${cardPercentage}% 100%)` }}>
              <div className="absolute inset-0 m-6 bg-surface rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-2xl font-bold text-on-surface">{(statsData?.ventas_hoy || 42)}</span>
                <span className="label-sm text-on-surface-variant">Transacc.</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="body-md text-on-surface">Tarjeta</span>
                </div>
                <span className="label-sm text-on-surface">{cardPercentage}%</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></div>
                  <span className="body-md text-on-surface">Efectivo</span>
                </div>
                <span className="label-sm text-on-surface">{cashPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div id="section-alertas-stock" className="bg-surface rounded-xl border border-outline-variant/40 flex flex-col overflow-hidden scroll-mt-20">
            <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center gap-2">
              <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="headline-sm text-on-surface">Alertas de Stock</h3>
            </div>
            <div className="flex-1 max-h-[300px] overflow-y-auto p-2">
              {criticalStock.slice(0, 5).map(p => (
                <div key={p.cod_prod} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0 border border-outline-variant/20">
                      <svg className="w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{p.nom_prod}</p>
                      <p className="text-xs text-on-surface-variant">Quedan {p.stock_actual} uds</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-error bg-error-container/30 px-2 py-1 rounded-md shrink-0 ml-2">
                    {p.stock_actual <= (p.stock_minimo || 0) ? 'Crítico' : 'Bajo'}
                  </span>
                </div>
              ))}
              {criticalStock.length === 0 && (
                <div className="py-8 text-center text-sm text-on-surface-variant italic">Sin alertas de stock.</div>
              )}
            </div>
          </div>

          {/* ─── Kiora Insights AI ─── */}
          <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-5 relative overflow-hidden">
            {/* Mesh background */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Kiora Insights</h3>
                  <p className="text-[10px] font-medium text-on-surface-variant">Analítica predictiva</p>
                </div>
                <span className="ml-auto text-[9px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">AI</span>
              </div>

              <div className="space-y-3">
                {insightsLoading ? (
                  <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm text-on-surface-variant">Analizando datos del negocio...</span>
                  </div>
                ) : insightsError || !insights ? (
                  <div className="p-4 rounded-xl bg-surface border border-outline-variant/30">
                    <p className="text-sm text-on-surface-variant italic">
                      No hay suficientes datos para generar insights en este momento.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
                      <p className="text-sm font-medium text-on-surface leading-relaxed pl-3">
                        {insights.insight}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-container-high border border-outline-variant/20">
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 ${insights.trend_direction === 'up' ? 'text-tertiary' : 'text-error'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                        <span className={`text-xs font-semibold ${insights.trend_direction === 'up' ? 'text-tertiary' : 'text-error'}`}>Rendimiento</span>
                      </div>
                      <span className={`text-xs font-bold ${insights.trend_direction === 'up' ? 'text-tertiary' : 'text-error'}`}>
                        {insights.trend_direction === 'up' ? '+' : ''}{insights.trend_percentage}% <span className="font-normal opacity-70">{insights.trend_comparison}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
