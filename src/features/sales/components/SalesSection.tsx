import { useEffect, useMemo, useRef } from 'react';
import { authService, orderService } from '@/config/setup';
import type { Order, Invoice } from '@/models/Order';
import type { Movement } from '@/models/Inventory';
import type { Incident } from '@/models/Incident';
import { OrderDetailModal } from './OrderDetailModal';
import { MovementDetailModal } from '@/features/inventory/components/MovementDetailModal';

type SalesSubTab = 'ventas' | 'facturas' | 'movimientos' | 'incidencias';

const ESTADO_COLORS: Record<string, string> = {
  completada: 'bg-[#bbf7f2] text-[#008b8b] border-[#e0fbf9]',
  pagada: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  pagado: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelada: 'bg-[#ffdce5] text-[#ec131e] border-[#ffecf1]',
  reembolsada: 'bg-purple-100 text-purple-700 border-purple-200',
  en_proceso: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  resuelto: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

import { useInventoryStore } from '@/store/useInventoryStore';
import { useSalesManager } from '@/hooks/useSalesManager';

export function SalesSection({
  onOpenPOS,
  isAdmin,
  initialOpenOrderId,
  onInitialOrderOpened,
}: {
  onOpenPOS: () => void;
  isAdmin?: boolean;
  initialOpenOrderId?: number;
  onInitialOrderOpened?: () => void;
}) {
  const { productMap, fetchProducts } = useInventoryStore();

  // Asegurar que el mapa de productos esté cargado para mostrar nombres
  useEffect(() => {
    if (Object.keys(productMap).length === 0) {
      fetchProducts();
    }
  }, []);

  const isPaidStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'completada' || normalized === 'pagado' || normalized === 'pagada';
  };

  const safePrice = (v: unknown) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const {
    subTab, setSubTab,
    orders, invoices, movements, reports,
    loading, search, setSearch, searchInvoiceId, setSearchInvoiceId,
    detailOrder, setDetailOrder, detailMovement, setDetailMovement,
    isIncidentOpen, setIsIncidentOpen, isSavingIncident, incidentForm, setIncidentForm, managingIncident, setManagingIncident,
    reasonModal, setReasonModal,
    filteredOrders,
    handleExport, handleExportIncidents,
    handleViewDetails, handleStatusChange, handleConfirmReason, handleRefund, handleDeleteOrder,
    downloadInvoicePDF, handleDownloadReceipt, handleEmitElectronicInvoice,
    handleSaveIncident, handleDeleteIncident, handleUpdateIncidentStatus
  } = useSalesManager(isAdmin || false);

  const deepLinkHandled = useRef<number | null>(null);
  useEffect(() => {
    if (initialOpenOrderId == null || !Number.isFinite(initialOpenOrderId)) {
      deepLinkHandled.current = null;
      return;
    }
    if (deepLinkHandled.current === initialOpenOrderId) return;
    deepLinkHandled.current = initialOpenOrderId;
    void handleViewDetails(initialOpenOrderId).finally(() => {
      onInitialOrderOpened?.();
    });
  }, [initialOpenOrderId, handleViewDetails, onInitialOrderOpened]);

  const handleExportSingleIncident = (inc: any) => {
    handleExportIncidents('pdf');
  };

  if (loading && filteredOrders.length === 0 && invoices.length === 0 && movements.length === 0 && reports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-[#ec131e]/20 border-t-[#ec131e] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">Ventas <span className="text-[#ec131e]">&</span> Historial</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Registro de ventas, facturación y exportaciones.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => void handleExport('excel')}
            title="Exportar a Excel"
            className="flex items-center justify-center rounded-xl bg-[#ecfdf3] p-3 text-[#10b981] border border-[#d1fae5] hover:bg-[#d1fae5] transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={() => void handleExport('pdf')}
            title="Exportar a PDF"
            className="flex items-center justify-center rounded-xl bg-[#fff5f5] p-3 text-[#ec131e] border border-[#ffe3e3] hover:bg-[#ffe3e3] transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={subTab === 'incidencias' ? () => setIsIncidentOpen(true) : onOpenPOS}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ec131e] to-[#c91019] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#ec131e]/30 hover:from-[#d01019] hover:to-[#a00c14] hover:shadow-[#ec131e]/40 active:scale-95 transition-all"
          >
            {subTab === 'incidencias' ? '+ Incidencia' : '+ Nueva Venta'}
          </button>
        </div>
      </header>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Ingresos Hoy</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#111827] truncate">
            <span className="text-[10px] sm:text-sm text-slate-400 mr-1">$</span>
            {filteredOrders.filter(o => {
              const d = o.fecha_vent ? new Date(o.fecha_vent) : new Date();
              const today = new Date();
              return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            }).reduce((acc, o) => acc + safePrice(o.montofinal_vent), 0).toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Órdenes Hoy</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#111827]">
            {filteredOrders.filter(o => {
              const d = o.fecha_vent ? new Date(o.fecha_vent) : new Date();
              const today = new Date();
              return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-[#ec131e]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket Promedio</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#111827] truncate">
            <span className="text-[10px] sm:text-sm text-slate-400 mr-1">$</span>
            {(() => {
              const todayOrders = filteredOrders.filter(o => {
                const d = o.fecha_vent ? new Date(o.fecha_vent) : new Date();
                const today = new Date();
                return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
              });
              if(todayOrders.length === 0) return 0;
              const total = todayOrders.reduce((acc, o) => acc + safePrice(o.montofinal_vent), 0);
              return Math.round(total / todayOrders.length).toLocaleString('es-CO');
            })()}
          </p>
        </div>
      </div>

      {/* Controls: Sub-tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Sub-tabs */}
        <div className="flex overflow-x-auto gap-2 rounded-2xl bg-white border border-slate-100 p-1.5 w-full sm:w-fit shadow-sm hide-scrollbar">
          {[
            { id: 'ventas', label: 'Ventas' },
            { id: 'facturas', label: 'Facturas' },
            { id: 'movimientos', label: 'Movimientos' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as SalesSubTab)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all ${subTab === t.id ? 'bg-[#ec131e]/5 text-[#ec131e] border border-[#ec131e]/10 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center w-full sm:w-auto">
          {subTab === 'facturas' ? (
            <div className="flex items-center gap-3 w-full sm:w-80">
              <div className="relative w-full">
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Buscar Factura #ID..." 
                  className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:border-[#ec131e] focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all shadow-sm"
                  value={searchInvoiceId}
                  onChange={(e) => setSearchInvoiceId(e.target.value.replace(/\D/g, ''))}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <button 
                onClick={() => void orderService.exportInvoicesExcel()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ecfdf3] px-4 py-3 text-sm font-bold text-[#10b981] border border-[#d1fae5] hover:bg-[#d1fae5] transition-all whitespace-nowrap"
              >
                Exportar
              </button>
            </div>
          ) : (
            <div className="relative group w-full sm:w-80">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#ec131e] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar registros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:border-[#ec131e] focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#ec131e]" />
        </div>
      ) : (
        <>
          {/* ─── MOBILE: Card list (ventas only) ─── */}
          {subTab === 'ventas' && (
            <div className="sm:hidden space-y-4 pb-24">
              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center bg-white rounded-3xl border border-slate-100 shadow-sm mx-1">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 text-slate-300">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Sin Ventas Aún</h3>
                  <p className="text-sm text-slate-400 font-medium">Registra tu primera venta para verla aquí.</p>
                </div>
              ) : (
                (Array.isArray(filteredOrders) ? filteredOrders : []).map(o => (
                  <div key={o.id_vent} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 flex items-stretch gap-4 hover:shadow-md hover:border-slate-200 transition-all">
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">#{o.id_vent}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}>{o.estado}</span>
                      </div>
                      <p className="text-[15px] leading-tight font-semibold text-slate-800 line-clamp-2">{o.productos_resumen || 'Venta Directa'}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center">
                        {o.fecha_vent ? new Date(o.fecha_vent).toLocaleString('es-CO', {dateStyle:'short', timeStyle:'short'}) : '—'}
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span className="capitalize">{o.metodopago_usu}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col justify-center border-l border-slate-100 pl-4 w-28">
                      <p className="text-[17px] font-bold text-emerald-600 tracking-tight">${safePrice(o.montofinal_vent).toLocaleString('es-CO')}</p>
                      <button
                        onClick={() => o.id_vent && void handleViewDetails(o.id_vent)}
                        className="text-[10px] font-bold text-[#ec131e] hover:text-white mt-2 block uppercase tracking-widest bg-red-50 hover:bg-[#ec131e] px-3 py-2 rounded-xl w-full text-center transition-all"
                      >Ver</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── MOBILE: Card list (movimientos) ─── */}
          {subTab === 'movimientos' && (
            <div className="sm:hidden space-y-3">
              {movements.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm font-medium bg-white rounded-2xl border border-slate-100">No hay movimientos registrados</div>
              ) : (
                movements.map(m => (
                  <div key={m.id_mov} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-400">#{m.id_mov} · {new Date(m.fecha_mov!).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${m.tipo_mov === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{m.tipo_mov}</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 truncate">{productMap[String(m.cod_prod)] || 'Producto Desconocido'}</p>
                    <div className="flex items-center justify-between mt-2">
                       <span className={`text-sm font-black ${m.tipo_mov === 'entrada' ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {m.tipo_mov === 'entrada' ? '+' : '-'}{m.cantidad} uds
                        </span>
                       <button onClick={() => setDetailMovement(m)} className="text-[10px] font-black text-indigo-600 uppercase">Ver Detalle →</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── MOBILE: Card list (facturas) ─── */}
          {subTab === 'facturas' && (
            <div className="sm:hidden space-y-3">
              {invoices.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm font-medium bg-white rounded-2xl border border-slate-100">No hay facturas registradas</div>
              ) : (
                invoices.filter(i => searchInvoiceId ? String(i.id_fact).includes(searchInvoiceId) : true).map(invoice => (
                  <div key={invoice.id_fact} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800">FAC-{invoice.id_fact}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Pedido #{invoice.id_pedido} · {new Date(invoice.fecha_fact).toLocaleDateString('es-CO')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-emerald-600">${safePrice(invoice.total_fact).toLocaleString('es-CO')}</p>
                      <button onClick={() => downloadInvoicePDF(invoice)} className="text-[10px] font-black text-slate-500 hover:text-[#ec131e] mt-1 block">↓ PDF</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── DESKTOP: Full table ─── */}
          <div className="hidden sm:block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fcfdfe] border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {subTab === 'facturas' ? 'Factura' : '#'}
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {subTab === 'facturas' ? 'ID Pedido' : 'Fecha'}
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {subTab === 'facturas' ? 'Fecha Emisión' : 'Título / Ref'}
                    </th>
                    {subTab === 'incidencias' && isAdmin && <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">Prioridad</th>}
                    <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {subTab === 'facturas' ? 'Total Facturado' : 'Importe / Detalle'}
                    </th>
                    {subTab !== 'facturas' && <th className="px-5 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Estado</th>}
                    <th className="px-5 py-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subTab === 'ventas' && (
                    filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center text-slate-400 font-medium">No hay ventas registradas</td></tr>
                    ) : (
                      (Array.isArray(filteredOrders) ? filteredOrders : []).map(o => (
                        <tr key={o.id_vent} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-slate-400 text-xs">#{o.id_vent}</td>
                          <td className="px-5 py-4 text-[#111827] text-xs font-bold">
                            {o.fecha_vent ? new Date(o.fecha_vent).toLocaleString('es-CO') : '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs font-bold capitalize max-w-[200px] truncate" title={o.productos_resumen || ''}>
                            {o.productos_resumen || (o.metodopago_usu === 'tarjeta' ? 'Pago con Tarjeta' : 'Venta Directa')}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-emerald-600 text-base">
                            <span className="text-[10px] mr-0.5 text-emerald-500">$</span>{safePrice(o.montofinal_vent).toLocaleString('es-CO')}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {isAdmin ? (
                              <select
                                value={o.estado || 'pendiente'}
                                disabled={o.estado === 'cancelada' || isPaidStatus(o.estado)}
                                onChange={(e) => handleStatusChange(o.id_vent!, e.target.value)}
                                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Anular (devuelve stock)</option>
                                {o.estado === 'completada' && (
                                  <option value="reembolsada">Reembolsada</option>
                                )}
                              </select>
                            ) : (
                              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}>
                                {o.estado}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => o.id_vent && void handleViewDetails(o.id_vent)} className="text-[#2563eb] text-xs font-black hover:underline">Ver</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {subTab === 'facturas' && (
                    invoices.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-slate-400 font-medium">No hay facturas registradas</td></tr>
                    ) : (
                      invoices.filter(i => searchInvoiceId ? String(i.id_fact).includes(searchInvoiceId) : true).map(invoice => (
                        <tr key={invoice.id_fact} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 font-black text-slate-900 text-sm">FAC-{invoice.id_fact}</td>
                          <td className="px-5 py-4 text-slate-500 text-sm">#{invoice.id_pedido}</td>
                          <td className="px-5 py-4 text-[#111827] text-xs font-bold">{new Date(invoice.fecha_fact).toLocaleString('es-CO')}</td>
                          <td className="px-5 py-4 text-right font-black text-emerald-600 text-base">
                            <span className="text-[10px] mr-0.5 text-emerald-500">$</span>{safePrice(invoice.total_fact).toLocaleString('es-CO')}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button 
                              onClick={() => downloadInvoicePDF(invoice)}
                              className="text-[10px] font-black uppercase text-gray-400 hover:text-[#ec131e] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1 mx-auto"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              Descargar
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {subTab === 'movimientos' && (
                    movements.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center text-slate-400">No hay movimientos registrados</td></tr>
                    ) : (
                      movements.map(m => (
                        <tr key={m.id_mov} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-black text-slate-400 text-xs">#{m.id_mov}</td>
                          <td className="px-5 py-4 text-xs font-bold">{new Date(m.fecha_mov!).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-black text-[#111827]">
                              <span className="text-[#ec131e] mr-1">[{m.cod_prod}]</span>
                              {productMap[String(m.cod_prod)] || 'Producto Desconocido'}
                            </p>
                            <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">{(m as any).desc_mov || 'Venta automatizada'}</p>
                          </td>
                          <td className={`px-5 py-4 text-right font-black text-base ${m.tipo_mov === 'entrada' ? 'text-emerald-600' : 'text-orange-500'}`}>
                            {m.tipo_mov === 'entrada' ? '+' : '-'}{m.cantidad} uds</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${m.tipo_mov === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                              {m.tipo_mov}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => setDetailMovement(m)}
                              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 transition-all active:scale-95"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {subTab === 'incidencias' && (
                    reports.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="py-10 text-center text-slate-400">No hay incidencias reportadas</td></tr>
                    ) : (
                      reports.map(r => (
                        <tr key={r.id_rep} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-black text-slate-400 text-xs">#{r.id_rep}</td>
                          <td className="px-5 py-4 text-xs font-bold">{r.fecha_rep ? new Date(r.fecha_rep).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-4 text-xs font-bold truncate max-w-[150px]">
                            <div className="flex flex-col">
                              <span>{r.titulo || r.observaciones_tecnicas || 'Sin título'}</span>
                              {r.cod_prod && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Prod: <span className="text-[#ec131e]">[{r.cod_prod}]</span> {productMap[String(r.cod_prod)] || ''}
                                </span>
                              )}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${r.prioridad === 'alta' ? 'bg-red-50 text-red-600' : r.prioridad === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                {r.prioridad}
                              </span>
                            </td>
                          )}
                          <td className="px-5 py-4 text-right text-xs font-medium max-w-[200px] truncate">
                            {isAdmin ? (r.descripcion || '—') : '*** Restringido ***'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${ESTADO_COLORS[r.estado ?? 'pendiente']}`}>
                              {r.estado.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setManagingIncident(r)}
                                className="text-[#2563eb] text-xs font-black hover:underline disabled:opacity-30" 
                                disabled={!isAdmin}
                              >
                                Gestionar
                              </button>
                              <button 
                                onClick={() => handleExportSingleIncident(r)}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Exportar PDF"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {detailOrder && (
        <OrderDetailModal
          detailOrder={detailOrder}
          onClose={() => setDetailOrder(null)}
          safePrice={safePrice}
          estadoColors={ESTADO_COLORS}
          productMap={productMap}
          onRefund={isAdmin ? handleRefund : undefined}
          onDownloadReceipt={handleDownloadReceipt}
          onEmitElectronicInvoice={handleEmitElectronicInvoice}
        />
      )}

      {detailMovement && (
        <MovementDetailModal
          movement={detailMovement}
          productName={productMap[detailMovement.cod_prod]}
          onClose={() => setDetailMovement(null)}
        />
      )}

      {isIncidentOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsIncidentOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-500 ease-out">
            <div className="flex h-full flex-col p-8">
              <header className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Incidencia</h2>
                  <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">Reporte de Mantenimiento</p>
                </div>
                <button onClick={() => setIsIncidentOpen(false)} className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <form onSubmit={(e) => { e.preventDefault(); void handleSaveIncident(); }} className="flex-1 space-y-6 overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Título / Resumen</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Falla en impresora térmica"
                    value={incidentForm.titulo}
                    onChange={e => setIncidentForm(f => ({ ...f, titulo: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-[#ec131e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Prioridad del Reporte</label>
                  <div className="flex gap-2">
                    {(['baja', 'media', 'alta'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setIncidentForm(f => ({ ...f, prioridad: p }))}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incidentForm.prioridad === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Descripción completa del problema</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe detalladamente lo ocurrido..."
                    value={incidentForm.descripcion}
                    onChange={e => setIncidentForm(f => ({ ...f, descripcion: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-[#ec131e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">ID Producto (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Código del producto afectado"
                    value={incidentForm.cod_prod || ''}
                    onChange={e => setIncidentForm(f => ({ ...f, cod_prod: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-[#ec131e] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isSavingIncident}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ec131e] py-4 text-sm font-black text-white shadow-xl shadow-[#ec131e]/20 transition-all hover:bg-[#d01019] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSavingIncident ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Reportar Incidencia'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Gestión de Incidencia (Drawer para Admin) */}
      {managingIncident && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setManagingIncident(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-500 ease-out flex flex-col">
            <div className="p-8 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  managingIncident.prioridad === 'alta' ? 'bg-red-50 text-red-600' : 
                  managingIncident.prioridad === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  Prioridad {managingIncident.prioridad}
                </span>
                <button onClick={() => setManagingIncident(null)} className="text-slate-400 hover:text-slate-600 p-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{managingIncident.titulo || 'Detalle de Incidencia'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">ID Reporte: #{managingIncident.id_rep}</p>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción del Problema</label>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm font-medium text-slate-700 italic leading-relaxed">
                  "{managingIncident.descripcion}"
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizar Estado</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['pendiente', 'en_proceso', 'resuelto', 'cancelado'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => void handleUpdateIncidentStatus(managingIncident.id_rep, s)}
                      className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${managingIncident.estado === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => handleExportSingleIncident(managingIncident)}
                className="flex-1 py-4 rounded-2xl bg-red-50 text-[10px] font-black uppercase tracking-[0.2em] text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                PDF Individual
              </button>
              <button 
                onClick={() => setManagingIncident(null)}
                className="flex-1 py-4 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Motivo — Cancelación / Reembolso */}
      {reasonModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setReasonModal(prev => ({ ...prev, isOpen: false })); }}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            {/* Icon */}
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${reasonModal.type === 'refund' ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-[#ec131e]'}`}>
              {reasonModal.type === 'refund' ? (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-800 text-center tracking-tight mb-1">
              {reasonModal.type === 'refund' ? 'Procesar Reembolso' : 'Anular Venta'}
            </h2>
            <p className="text-xs text-slate-400 font-medium text-center mb-6">
              Venta <span className="font-black text-slate-600">#{reasonModal.orderId}</span> · El stock será devuelto al inventario
            </p>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                Motivo
                <span className="text-[#ec131e]">*</span>
                <span className="text-slate-300 normal-case font-medium tracking-normal">(requerido)</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                placeholder={reasonModal.type === 'refund'
                  ? 'Ej: Producto defectuoso, cliente insatisfecho...'
                  : 'Ej: Error en el pedido, solicitud del cliente...'}
                value={reasonModal.reason}
                onChange={e => setReasonModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:border-[#ec131e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all resize-none"
              />
              {!reasonModal.reason.trim() && (
                <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Debes escribir un motivo para continuar
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReasonModal(prev => ({ ...prev, isOpen: false })); }}
                className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleConfirmReason()}
                disabled={!reasonModal.reason.trim()}
                className={`flex-1 rounded-2xl py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${reasonModal.type === 'refund' ? 'bg-purple-600 shadow-purple-500/20 hover:bg-purple-700' : 'bg-[#ec131e] shadow-red-500/20 hover:bg-[#d01019]'}`}
              >
                {reasonModal.type === 'refund' ? 'Confirmar Reembolso' : 'Sí, Anular Venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
