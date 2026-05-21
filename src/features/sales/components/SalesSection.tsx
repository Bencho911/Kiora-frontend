import { useEffect, useMemo, useRef } from 'react';
import { authService, orderService } from '@/config/setup';
import type { Order, Invoice } from '@/models/Order';
import type { Movement } from '@/models/Inventory';
import type { Incident } from '@/models/Incident';
import { OrderDetailModal } from './OrderDetailModal';
import { MovementDetailModal } from '@/features/inventory/components/MovementDetailModal';

type SalesSubTab = 'ventas' | 'facturas' | 'movimientos' | 'incidencias';

const ESTADO_COLORS: Record<string, string> = {
  completada: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  pagada: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  pagado: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  pendiente: 'bg-secondary-container/20 text-secondary-container border-secondary-container/30',
  cancelada: 'bg-error-container/30 text-error border-error/20',
  reembolsada: 'bg-primary-fixed/30 text-on-primary-fixed-variant border-primary-fixed/50',
  en_proceso: 'bg-surface-container-high text-on-surface-variant border-outline-variant/50',
  resuelto: 'bg-tertiary/10 text-tertiary border-tertiary/20',
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
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: SalesSubTab; label: string }[] = [
    { id: 'ventas', label: 'Ventas' },
    { id: 'facturas', label: 'Facturas' },
    { id: 'movimientos', label: 'Movimientos' },
  ];
  if (isAdmin) tabs.push({ id: 'incidencias', label: 'Incidencias' });

  const todayOrders = filteredOrders.filter(o => {
    const d = o.fecha_vent ? new Date(o.fecha_vent) : new Date();
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const todayRevenue = todayOrders.reduce((acc, o) => acc + safePrice(o.montofinal_vent), 0);
  const todayCount = todayOrders.length;
  const avgTicket = todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">
            Ventas <span className="text-primary">&</span> Historial
          </h2>
          <p className="body-md text-on-surface-variant">Registro de ventas, facturación y exportaciones.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void handleExport('excel')}
            title="Exportar a Excel"
            className="flex items-center justify-center rounded-lg bg-tertiary/10 p-2.5 text-tertiary border border-tertiary/20 hover:bg-tertiary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
          </button>
          <button
            onClick={() => void handleExport('pdf')}
            title="Exportar a PDF"
            className="flex items-center justify-center rounded-lg bg-primary-fixed/30 p-2.5 text-primary-container border border-primary-fixed/50 hover:bg-primary-fixed/50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>picture_as_pdf</span>
          </button>
          <button
            onClick={subTab === 'incidencias' ? () => setIsIncidentOpen(true) : onOpenPOS}
            className="inline-flex items-center gap-1.5 bg-primary text-on-primary label-sm px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            {subTab === 'incidencias' ? 'Incidencia' : 'Nueva Venta'}
          </button>
        </div>
      </div>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
            </div>
            <span className="label-sm text-on-surface-variant">Ingresos Hoy</span>
          </div>
          <p className="headline-sm text-on-surface">${todayRevenue.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>receipt_long</span>
            </div>
            <span className="label-sm text-on-surface-variant">Órdenes Hoy</span>
          </div>
          <p className="headline-sm text-on-surface">{todayCount}</p>
        </div>
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-primary-fixed/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sell</span>
            </div>
            <span className="label-sm text-on-surface-variant">Ticket Promedio</span>
          </div>
          <p className="headline-sm text-on-surface">${avgTicket.toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-surface-container-high rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 label-sm transition-all ${
                subTab === t.id
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center w-full sm:w-auto gap-3">
          {subTab === 'facturas' ? (
            <>
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Buscar Factura #ID..."
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 pl-9 pr-3 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={searchInvoiceId}
                  onChange={(e) => setSearchInvoiceId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button
                onClick={() => void orderService.exportInvoicesExcel()}
                className="flex items-center gap-1.5 rounded-lg bg-tertiary/10 px-3.5 py-2.5 label-sm text-tertiary border border-tertiary/20 hover:bg-tertiary/20 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
                Exportar
              </button>
            </>
          ) : (
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
              <input
                type="text"
                placeholder="Buscar registros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 pl-9 pr-3 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── MOBILE: Cards ─── */}
          {subTab === 'ventas' && (
            <div className="sm:hidden space-y-3 pb-24">
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center bg-surface rounded-xl border border-dashed border-outline-variant/50">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">receipt_long</span>
                  <p className="label-md text-on-surface-variant">Sin ventas aún</p>
                  <p className="body-md text-on-surface-variant/70 mt-1">Registra tu primera venta.</p>
                </div>
              ) : (
                filteredOrders.map(o => (
                  <div key={o.id_vent} className="bg-surface rounded-xl border border-outline-variant/30 p-4 flex items-stretch gap-3 hover:shadow-md transition-all">
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="label-sm text-on-surface-variant">#{o.id_vent}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold border ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}>{o.estado}</span>
                      </div>
                      <p className="text-sm font-medium text-on-surface break-words">{o.productos_resumen || 'Venta Directa'}</p>
                      <p className="label-sm text-on-surface-variant mt-1">
                        {o.fecha_vent ? new Date(o.fecha_vent).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        <span className="mx-1.5 text-outline">•</span>
                        <span className="capitalize">{o.metodopago_usu}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col justify-center border-l border-outline-variant/30 pl-3 w-24">
                      <p className="text-base font-bold text-tertiary">${safePrice(o.montofinal_vent).toLocaleString('es-CO')}</p>
                      <button
                        onClick={() => o.id_vent && void handleViewDetails(o.id_vent)}
                        className="label-sm text-primary hover:underline mt-1"
                      >Ver</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'movimientos' && (
            <div className="sm:hidden space-y-3 pb-24">
              {movements.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant/30 label-md">No hay movimientos registrados</div>
              ) : (
                movements.map(m => (
                  <div key={m.id_mov} className="bg-surface rounded-xl border border-outline-variant/30 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="label-sm text-on-surface-variant">#{m.id_mov} · {new Date(m.fecha_mov!).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${m.tipo_mov === 'entrada' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary-container/20 text-secondary-container'}`}>{m.tipo_mov}</span>
                    </div>
                    <p className="label-md text-on-surface break-words">{productMap[String(m.cod_prod)] || 'Producto Desconocido'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`label-md ${m.tipo_mov === 'entrada' ? 'text-tertiary' : 'text-secondary-container'}`}>
                        {m.tipo_mov === 'entrada' ? '+' : '-'}{m.cantidad} uds
                      </span>
                      <button onClick={() => setDetailMovement(m)} className="label-sm text-primary hover:underline">Ver Detalle</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'facturas' && (
            <div className="sm:hidden space-y-3 pb-24">
              {invoices.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant/30 label-md">No hay facturas registradas</div>
              ) : (
                invoices.filter(i => searchInvoiceId ? String(i.id_fact).includes(searchInvoiceId) : true).map(invoice => (
                  <div key={invoice.id_fact} className="bg-surface rounded-xl border border-outline-variant/30 p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="label-md text-on-surface">FAC-{invoice.id_fact}</p>
                      <p className="label-sm text-on-surface-variant">Pedido #{invoice.id_pedido} · {new Date(invoice.fecha_fact).toLocaleDateString('es-CO')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-tertiary">${safePrice(invoice.total_fact).toLocaleString('es-CO')}</p>
                      <button onClick={() => downloadInvoicePDF(invoice)} className="label-sm text-primary hover:underline mt-1 block">↓ PDF</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── DESKTOP: Table ─── */}
          <div className="hidden sm:block bg-surface rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <tr>
                    <th className="px-5 py-4 text-left label-sm text-on-surface-variant font-semibold">
                      {subTab === 'facturas' ? 'Factura' : '#'}
                    </th>
                    <th className="px-5 py-4 text-left label-sm text-on-surface-variant font-semibold">
                      {subTab === 'facturas' ? 'ID Pedido' : 'Fecha'}
                    </th>
                    <th className="px-5 py-4 text-left label-sm text-on-surface-variant font-semibold">
                      {subTab === 'facturas' ? 'Fecha Emisión' : 'Ref'}
                    </th>
                    {subTab === 'incidencias' && isAdmin && <th className="px-5 py-4 text-left label-sm text-on-surface-variant font-semibold">Prioridad</th>}
                    <th className="px-5 py-4 text-right label-sm text-on-surface-variant font-semibold">
                      {subTab === 'facturas' ? 'Total' : 'Importe'}
                    </th>
                    {subTab !== 'facturas' && <th className="px-5 py-4 text-center label-sm text-on-surface-variant font-semibold">Estado</th>}
                    <th className="px-5 py-4 text-center label-sm text-on-surface-variant font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {subTab === 'ventas' && (
                    filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center body-md text-on-surface-variant">No hay ventas registradas</td></tr>
                    ) : (
                      filteredOrders.map(o => (
                        <tr key={o.id_vent} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-5 py-4 label-md text-on-surface-variant">#{o.id_vent}</td>
                          <td className="px-5 py-4 label-md text-on-surface">
                            {o.fecha_vent ? new Date(o.fecha_vent).toLocaleString('es-CO') : '—'}
                          </td>
                          <td className="px-5 py-4 body-md text-on-surface-variant max-w-[200px] truncate" title={o.productos_resumen || ''}>
                            {o.productos_resumen || (o.metodopago_usu === 'tarjeta' ? 'Pago con Tarjeta' : 'Venta Directa')}
                          </td>
                          <td className="px-5 py-4 text-right label-md text-tertiary">
                            ${safePrice(o.montofinal_vent).toLocaleString('es-CO')}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {isAdmin ? (
                              <select
                                value={o.estado || 'pendiente'}
                                disabled={o.estado === 'cancelada' || isPaidStatus(o.estado)}
                                onChange={(e) => handleStatusChange(o.id_vent!, e.target.value)}
                                className={`rounded-full px-3 py-1 text-[10px] font-semibold border outline-none cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Anular (devuelve stock)</option>
                                {o.estado === 'completada' && (
                                  <option value="reembolsada">Reembolsada</option>
                                )}
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold border ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}>
                                {o.estado}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => o.id_vent && void handleViewDetails(o.id_vent)} className="label-sm text-primary hover:underline">Ver</button>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {subTab === 'facturas' && (
                    invoices.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center body-md text-on-surface-variant">No hay facturas registradas</td></tr>
                    ) : (
                      invoices.filter(i => searchInvoiceId ? String(i.id_fact).includes(searchInvoiceId) : true).map(invoice => (
                        <tr key={invoice.id_fact} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-5 py-4 label-md text-on-surface">FAC-{invoice.id_fact}</td>
                          <td className="px-5 py-4 body-md text-on-surface-variant">#{invoice.id_pedido}</td>
                          <td className="px-5 py-4 label-md text-on-surface">{new Date(invoice.fecha_fact).toLocaleString('es-CO')}</td>
                          <td className="px-5 py-4 text-right label-md text-tertiary">
                            ${safePrice(invoice.total_fact).toLocaleString('es-CO')}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => downloadInvoicePDF(invoice)}
                              className="label-sm text-on-surface-variant hover:text-primary bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/30 transition-all inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
                              Descargar
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {subTab === 'movimientos' && (
                    movements.length === 0 ? (
                      <tr><td colSpan={7} className="py-10 text-center body-md text-on-surface-variant">No hay movimientos registrados</td></tr>
                    ) : (
                      movements.map(m => (
                        <tr key={m.id_mov} className="hover:bg-surface-container-low">
                          <td className="px-5 py-4 label-md text-on-surface-variant">#{m.id_mov}</td>
                          <td className="px-5 py-4 label-md text-on-surface">{new Date(m.fecha_mov!).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <p className="label-md text-on-surface">
                              <span className="text-primary mr-1">[{m.cod_prod}]</span>
                              {productMap[String(m.cod_prod)] || 'Producto Desconocido'}
                            </p>
                            <p className="label-sm text-on-surface-variant italic truncate max-w-[150px]">{(m as any).desc_mov || 'Venta automatizada'}</p>
                          </td>
                          <td className={`px-5 py-4 text-right label-md ${m.tipo_mov === 'entrada' ? 'text-tertiary' : 'text-secondary-container'}`}>
                            {m.tipo_mov === 'entrada' ? '+' : '-'}{m.cantidad} uds
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${m.tipo_mov === 'entrada' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary-container/20 text-secondary-container'}`}>
                              {m.tipo_mov}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => setDetailMovement(m)}
                              className="label-sm text-primary hover:underline"
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
                      <tr><td colSpan={isAdmin ? 7 : 6} className="py-10 text-center body-md text-on-surface-variant">No hay incidencias reportadas</td></tr>
                    ) : (
                      reports.map(r => (
                        <tr key={r.id_rep} className="hover:bg-surface-container-low">
                          <td className="px-5 py-4 label-md text-on-surface-variant">#{r.id_rep}</td>
                          <td className="px-5 py-4 label-md text-on-surface">{r.fecha_rep ? new Date(r.fecha_rep).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-4 label-md truncate max-w-[150px]">
                            <div className="flex flex-col">
                              <span>{r.titulo || r.observaciones_tecnicas || 'Sin título'}</span>
                              {r.cod_prod && (
                                <span className="label-sm text-on-surface-variant">
                                  Prod: <span className="text-primary">[{r.cod_prod}]</span> {productMap[String(r.cod_prod)] || ''}
                                </span>
                              )}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                r.prioridad === 'alta' ? 'bg-error-container/30 text-error' :
                                r.prioridad === 'media' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-tertiary/10 text-tertiary'
                              }`}>
                                {r.prioridad}
                              </span>
                            </td>
                          )}
                          <td className="px-5 py-4 text-right body-md text-on-surface-variant max-w-[200px] truncate">
                            {isAdmin ? (r.descripcion || '—') : '*** Restringido ***'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold border ${ESTADO_COLORS[r.estado ?? 'pendiente']}`}>
                              {r.estado.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setManagingIncident(r)}
                                className="label-sm text-primary hover:underline disabled:opacity-30"
                                disabled={!isAdmin}
                              >
                                Gestionar
                              </button>
                              <button
                                onClick={() => handleExportSingleIncident(r)}
                                className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 transition-all"
                                title="Exportar PDF"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
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

      {/* Incident Drawer */}
      {isIncidentOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsIncidentOpen(false)} />
          <div className="relative w-full max-w-md bg-surface-bright shadow-2xl animate-in slide-in-from-right duration-500 border-l border-outline-variant/30">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="headline-sm text-on-surface">Nueva Incidencia</h2>
                  <p className="label-sm text-on-surface-variant mt-0.5">Reporte de Mantenimiento</p>
                </div>
                <button onClick={() => setIsIncidentOpen(false)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); void handleSaveIncident(); }} className="flex-1 space-y-5 overflow-y-auto pr-2">
                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">Título / Resumen</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Falla en impresora térmica"
                    value={incidentForm.titulo}
                    onChange={e => setIncidentForm(f => ({ ...f, titulo: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">Prioridad</label>
                  <div className="flex gap-2">
                    {(['baja', 'media', 'alta'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setIncidentForm(f => ({ ...f, prioridad: p }))}
                        className={`flex-1 py-2.5 rounded-lg label-sm transition-all border ${
                          incidentForm.prioridad === p
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">Descripción</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe detalladamente lo ocurrido..."
                    value={incidentForm.descripcion}
                    onChange={e => setIncidentForm(f => ({ ...f, descripcion: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">ID Producto (opcional)</label>
                  <input
                    type="number"
                    placeholder="Código del producto afectado"
                    value={incidentForm.cod_prod || ''}
                    onChange={e => setIncidentForm(f => ({ ...f, cod_prod: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSavingIncident}
                    className="flex w-full items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg label-md shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingIncident ? (
                      <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
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

      {/* Managing Incident Drawer */}
      {managingIncident && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setManagingIncident(null)} />
          <div className="relative w-full max-w-md bg-surface-bright shadow-2xl animate-in slide-in-from-right duration-500 border-l border-outline-variant/30 flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/30">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                  managingIncident.prioridad === 'alta' ? 'bg-error-container/30 text-error' :
                  managingIncident.prioridad === 'media' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-tertiary/10 text-tertiary'
                }`}>
                  Prioridad {managingIncident.prioridad}
                </span>
                <button onClick={() => setManagingIncident(null)} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
                </button>
              </div>
              <h2 className="headline-sm text-on-surface">{managingIncident.titulo || 'Detalle de Incidencia'}</h2>
              <p className="label-sm text-on-surface-variant mt-0.5">ID Reporte: #{managingIncident.id_rep}</p>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Descripción</label>
                <div className="bg-surface-container rounded-lg border border-outline-variant/30 p-4 body-md text-on-surface italic leading-relaxed">
                  "{managingIncident.descripcion}"
                </div>
              </div>

              <div className="space-y-3">
                <label className="label-sm text-on-surface-variant">Actualizar Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pendiente', 'en_proceso', 'resuelto', 'cancelado'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => void handleUpdateIncidentStatus(managingIncident.id_rep, s)}
                      className={`px-4 py-3 rounded-lg label-sm transition-all border ${
                        managingIncident.estado === s
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-low flex gap-3">
              <button
                onClick={() => handleExportSingleIncident(managingIncident)}
                className="flex-1 py-2.5 rounded-lg bg-primary-fixed/30 label-sm text-primary-container border border-primary-fixed/50 hover:bg-primary-fixed/50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                PDF
              </button>
              <button
                onClick={() => setManagingIncident(null)}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant/50 bg-surface label-sm text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {reasonModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setReasonModal(prev => ({ ...prev, isOpen: false })); }}
          />
          <div className="relative w-full max-w-sm bg-surface rounded-xl shadow-lg border border-outline-variant/30 p-6 animate-in zoom-in-95 duration-300">
            <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              reasonModal.type === 'refund' ? 'bg-primary-fixed/30 text-primary-container' : 'bg-error-container/30 text-error'
            }`}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {reasonModal.type === 'refund' ? 'currency_exchange' : 'block'}
              </span>
            </div>

            <h2 className="headline-sm text-on-surface text-center mb-1">
              {reasonModal.type === 'refund' ? 'Procesar Reembolso' : 'Anular Venta'}
            </h2>
            <p className="label-sm text-on-surface-variant text-center mb-5">
              Venta <span className="font-semibold text-on-surface">#{reasonModal.orderId}</span> · El stock se devolverá
            </p>

            <div className="space-y-1.5 mb-4">
              <label className="label-sm text-on-surface-variant flex items-center gap-1">
                Motivo <span className="text-error">*</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                placeholder={reasonModal.type === 'refund'
                  ? 'Ej: Producto defectuoso, cliente insatisfecho...'
                  : 'Ej: Error en el pedido, solicitud del cliente...'}
                value={reasonModal.reason}
                onChange={e => setReasonModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
              {!reasonModal.reason.trim() && (
                <p className="label-sm text-secondary-container flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                  Debes escribir un motivo
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReasonModal(prev => ({ ...prev, isOpen: false })); }}
                className="flex-1 rounded-lg border border-outline-variant/50 py-2.5 label-sm text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleConfirmReason()}
                disabled={!reasonModal.reason.trim()}
                className={`flex-1 rounded-lg py-2.5 label-sm text-on-primary shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  reasonModal.type === 'refund' ? 'bg-primary-container' : 'bg-error'
                }`}
              >
                {reasonModal.type === 'refund' ? 'Confirmar Reembolso' : 'Sí, Anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
