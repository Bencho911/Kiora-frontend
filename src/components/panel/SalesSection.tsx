import { useState, useEffect, useMemo, useCallback } from 'react';
import { orderService, alertService, authService, inventoryService, maintenanceService } from '@/config/setup';
import type { Order, Invoice } from '@/models/Order';
import type { Movement } from '@/models/Inventory';
import type { MaintenanceReport } from '@/models/Maintenance';
import type { Product } from '@/models/Product';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { OrderDetailModal } from './OrderDetailModal';
import { MovementDetailModal } from './MovementDetailModal';

// @ts-ignore
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type SalesSubTab = 'ventas' | 'facturas' | 'movimientos' | 'incidencias';

const ESTADO_COLORS: Record<string, string> = {
  completada: 'bg-[#bbf7f2] text-[#008b8b] border-[#e0fbf9]',
  pagada: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelada: 'bg-[#ffdce5] text-[#ec131e] border-[#ffecf1]',
  reembolsada: 'bg-purple-100 text-purple-700 border-purple-200',
};

export function SalesSection({ onOpenPOS }: { onOpenPOS: () => void; isAdmin?: boolean }) {
  const [subTab, setSubTab] = useState<SalesSubTab>('ventas');
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [productMap, setProductMap] = useState<Record<string | number, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInvoiceId, setSearchInvoiceId] = useState('');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    observaciones_tecnicas: '',
    descripcion: '',
    cod_prod: null as number | null
  });

  const isAdmin = authService.isAdmin();

  // Load products map once on mount
  useEffect(() => {
    const loadMap = async () => {
      try {
        const pRes = await productService.getProducts(1, 1000).catch(() => null);
        if (pRes) {
          const list = Array.isArray(pRes) ? pRes : (pRes.data || []);
          const map: Record<string | number, string> = {};
          list.forEach((p: Product) => { map[p.cod_prod] = p.nom_prod; });
          setProductMap(map);
        }
      } catch (e) {
        console.error('Error loading product map:', e);
      }
    };
    void loadMap();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'ventas') {
        const res = await orderService.getOrders();
        setOrders(Array.isArray(res) ? res : (res.data || []));
      } else if (subTab === 'facturas') {
        const data = await orderService.getInvoices();
        setInvoices(data?.data || []);
      } else if (subTab === 'movimientos') {
        const data = await inventoryService.getMovements();
        setMovements(Array.isArray(data) ? data : (data?.data || []));
      } else if (subTab === 'incidencias') {
        const data = await maintenanceService.getReports();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    void loadData();
    const handleReload = () => void loadData();
    window.addEventListener('kiora_reload_orders', handleReload);
    return () => window.removeEventListener('kiora_reload_orders', handleReload);
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.id_vent?.toString().includes(q) ||
      o.metodopago_usu?.toLowerCase().includes(q) ||
      o.estado?.toLowerCase().includes(q) ||
      (o.productos_resumen || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    if (!isAdmin) {
      alertService.showToast('error', 'No tienes permisos para exportar');
      return;
    }
    try {
      if (type === 'excel') await orderService.exportExcel();
      else await orderService.exportPdf();
      alertService.showToast('success', `Reporte ${type.toUpperCase()} generado`);
    } catch (e) {
      alertService.showToast('error', 'Error al exportar reporte');
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const fullOrder = await orderService.getOrderById(id);
      setDetailOrder(fullOrder);
    } catch (e) {
      alertService.showToast('error', 'Error al obtener el detalle de la venta');
    }
  };

  const handleStatusChange = async (id: number, newStatus: any) => {
    const currentOrder = orders.find(o => o.id_vent === id);
    if (currentOrder?.estado === 'cancelada') {
      alertService.showToast('warning', 'No se puede modificar una venta ya cancelada');
      return;
    }

    if (newStatus === 'cancelada') {
      const ok = await alertService.showConfirm(
        '¿Cancelar Pedido?',
        'Esta acción no se puede deshacer y la venta quedará bloqueada.',
        'Sí, cancelar',
        'Volver'
      );
      if (!ok) {
        void loadData();
        return;
      }
    }

    try {
      await orderService.updateOrderStatus(id, newStatus);
      alertService.showToast('success', `Venta #${id} ahora está ${newStatus}`);
      void loadData();
    } catch (e: any) {
      if (e.message?.includes('409') || e.error?.includes('Stock') || e.status === 409) {
        alertService.showToast('error', 'Stock insuficiente para completar esta operación');
      } else {
        alertService.showToast('error', getErrorMessage(e, 'Error al actualizar estado'));
      }
      void loadData();
    }
  };

  const handleRefund = async (id: number) => {
    const ok = await alertService.showConfirm(
      '¿Solicitar Reembolso?',
      'Esta acción devolverá los productos al inventario y marcará la venta como reembolsada.',
      'Confirmar Reembolso',
      'Cancelar'
    );
    if (!ok) return;
    try {
      await orderService.updateOrderStatus(id, 'reembolsada');
      alertService.showToast('success', 'Reembolso procesado correctamente');
      setDetailOrder(null);
      void loadData();
    } catch (e: any) {
      if (e.message?.includes('409') || e.status === 409) {
        alertService.showToast('error', 'Error de conflicto de stock al reembolsar');
      } else {
        alertService.showToast('error', getErrorMessage(e, 'Error al procesar reembolso'));
      }
    }
  };

  const handleDeleteOrder = async (id: number) => {
    const ok = await alertService.showConfirm(
      'Cancelar Venta',
      `¿Deseas cambiar el estado de la venta #${id} a "cancelada"?`,
      'Confirmar', 'Cerrar'
    );
    if (!ok) return;
    try {
      await orderService.updateOrderStatus(id, 'cancelada');
      alertService.showToast('success', 'Venta cancelada exitosamente');
      void loadData();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cancelar venta'));
    }
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      alertService.showToast('info', 'Generando factura detallada...');
      
      // Obtener el pedido completo para tener el detalle de productos
      const order = await orderService.getOrderById(invoice.id_pedido);
      const doc = new jsPDF() as any;
      
      // Colores corporativos
      const PRIMARY_RED = [236, 19, 30];
      const DARK_GREY = [40, 40, 40];
      const LIGHT_GREY = [120, 120, 120];

      // --- CABECERA ---
      doc.setFillColor(...PRIMARY_RED);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('KIORA', 20, 28);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('TECNOLOGÍA Y SERVICIOS', 60, 28);

      // --- INFORMACIÓN DE LA EMPRESA (Derecha) ---
      doc.setFontSize(8);
      doc.text('NIT: 900.123.456-7', 150, 15);
      doc.text('Dirección: Calle 123 #45-67', 150, 20);
      doc.text('Contacto: KiosKiora@gmail.com', 150, 25);
      doc.text('Teléfono: +57 300 000 0000', 150, 30);

      // --- TÍTULO Y DATOS DE FACTURA ---
      doc.setTextColor(...DARK_GREY);
      doc.setFontSize(18);
      doc.text('FACTURA DE VENTA', 20, 55);
      
      doc.setDrawColor(...PRIMARY_RED);
      doc.setLineWidth(0.5);
      doc.line(20, 58, 80, 58);

      doc.setFontSize(10);
      doc.setTextColor(...LIGHT_GREY);
      doc.text(`NÚMERO DE FACTURA:`, 140, 55);
      doc.setTextColor(...PRIMARY_RED);
      doc.setFont('helvetica', 'bold');
      doc.text(`FAC-${invoice.id_fact}`, 185, 55, { align: 'right' });
      
      doc.setTextColor(...LIGHT_GREY);
      doc.setFont('helvetica', 'normal');
      doc.text(`FECHA DE EMISIÓN:`, 140, 60);
      doc.setTextColor(...DARK_GREY);
      doc.text(`${new Date(invoice.fecha_fact).toLocaleDateString()}`, 185, 60, { align: 'right' });

      doc.setTextColor(...LIGHT_GREY);
      doc.text(`ID PEDIDO:`, 140, 65);
      doc.setTextColor(...DARK_GREY);
      doc.text(`#${invoice.id_pedido}`, 185, 65, { align: 'right' });

      // --- DETALLES DEL CLIENTE ---
      doc.setFontSize(12);
      doc.setTextColor(...DARK_GREY);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL CLIENTE', 20, 75);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...LIGHT_GREY);
      doc.text('Identificador / CC:', 20, 82);
      doc.setTextColor(...DARK_GREY);
      doc.text(`${invoice.id_usu || 'Cliente General'}`, 55, 82);
      
      doc.setTextColor(...LIGHT_GREY);
      doc.text('Método de Pago:', 20, 87);
      doc.setTextColor(...DARK_GREY);
      doc.text(`${order.metodopago_usu || 'Efectivo'}`, 55, 87);

      doc.setTextColor(...LIGHT_GREY);
      doc.text('Responsable:', 20, 92);
      doc.setTextColor(...DARK_GREY);
      const currentUser = authService.getUser();
      doc.text(`${currentUser?.nom_usu || 'Cajero Kiora'}`, 55, 92);

      // --- TABLA DE PRODUCTOS ---
      const tableHead = [['CÓDIGO', 'DESCRIPCIÓN', 'CANT.', 'PRECIO UNIT.', 'SUBTOTAL']];
      const tableData = (order.items || []).map(item => [
        item.cod_prod,
        item.nom_prod || 'Producto Kiora',
        item.cantidad,
        `$${Number(item.precio_unit).toLocaleString('es-CO')}`,
        `$${(item.cantidad * (item.precio_unit || 0)).toLocaleString('es-CO')}`
      ]);

      doc.autoTable({
        startY: 100,
        head: tableHead,
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: PRIMARY_RED,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          1: { halign: 'left' },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 35 },
          4: { halign: 'right', cellWidth: 35 }
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });

      // --- TOTALES ---
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFillColor(250, 250, 250);
      doc.rect(130, finalY - 5, 65, 15, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(...PRIMARY_RED);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL A PAGAR:', 135, finalY + 5);
      doc.text(`$${Number(invoice.total_fact).toLocaleString('es-CO')}`, 190, finalY + 5, { align: 'right' });

      // --- PIE DE PÁGINA ---
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setDrawColor(230, 230, 230);
      doc.line(20, pageHeight - 30, 190, pageHeight - 30);
      
      doc.setFontSize(8);
      doc.setTextColor(...LIGHT_GREY);
      doc.setFont('helvetica', 'italic');
      doc.text('Esta factura es un soporte legal de su compra realizada en Kiora.', 20, pageHeight - 22);
      doc.text('Para soporte técnico o reclamaciones, escriba a KiosKiora@gmail.com', 20, pageHeight - 18);
      
      doc.setFont('helvetica', 'bold');
      doc.text('¡GRACIAS POR SU COMPRA!', 105, pageHeight - 10, { align: 'center' });

      doc.save(`Factura_Kiora_FAC-${invoice.id_fact}.pdf`);
      alertService.showToast('success', 'Factura generada exitosamente');
    } catch (e) {
      console.error('Error generating invoice PDF:', e);
      alertService.showToast('error', 'No se pudo generar la factura detallada');
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.observaciones_tecnicas || !incidentForm.descripcion) {
      alertService.showToast('warning', 'Título y descripción son obligatorios');
      return;
    }
    setIsSavingIncident(true);
    try {
      await maintenanceService.createReport({
        observaciones_tecnicas: incidentForm.observaciones_tecnicas,
        descripcion: incidentForm.descripcion,
        cod_prod: incidentForm.cod_prod || undefined,
        estado: 'pendiente',
        prioridad: 'media'
      });
      alertService.showToast('success', 'Incidencia reportada correctamente');
      setIsIncidentOpen(false);
      setIncidentForm({ observaciones_tecnicas: '', descripcion: '', cod_prod: null });
      void loadData();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al crear la incidencia'));
    } finally {
      setIsSavingIncident(false);
    }
  };

  const safePrice = (v: unknown) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const handleDownloadReceipt = async (id: number) => {
    try {
      await orderService.downloadReceipt(id);
      alertService.showToast('success', 'Factura descargada');
    } catch (e) {
      alertService.showToast('error', 'Error al descargar factura');
    }
  };

  return (
    <div className="space-y-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1a1a]">Ventas <span className="text-[#ec131e]">&</span> Historial</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Registro de ventas, facturación contable y exportaciones del historial de tu negocio.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void handleExport('excel')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ecfdf3] px-5 py-2.5 text-sm font-bold text-[#10b981] border border-[#d1fae5] hover:bg-[#d1fae5] transition-all active:scale-95"
          >
            Excel
          </button>
          <button
            onClick={() => void handleExport('pdf')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#fff5f5] px-5 py-2.5 text-sm font-bold text-[#ec131e] border border-[#ffe3e3] hover:bg-[#ffe3e3] transition-all active:scale-95"
          >
            PDF
          </button>
          <button
            onClick={subTab === 'incidencias' ? () => setIsIncidentOpen(true) : onOpenPOS}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ec131e] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#ec131e]/20 hover:bg-[#d01019] active:scale-95 transition-all"
          >
            {subTab === 'incidencias' ? '+ Nueva Incidencia' : '+ Nueva Venta'}
          </button>
        </div>
      </header>

      <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1.5 w-fit shadow-sm mb-4">
        {[
          { id: 'ventas', label: 'Ventas' },
          { id: 'facturas', label: 'Facturas' },
          { id: 'movimientos', label: 'Movimientos' },
          { id: 'incidencias', label: 'Incidencias' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as SalesSubTab)}
            className={`rounded-xl px-6 py-2.5 text-sm font-black transition-all ${subTab === t.id ? 'bg-[#ec131e]/5 text-[#ec131e] border border-[#ec131e]/10' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {subTab === 'facturas' ? (
          <div className="flex items-center gap-3 w-full max-w-md">
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#ecfdf3] px-5 py-3 text-sm font-bold text-[#10b981] border border-[#d1fae5] hover:bg-[#d1fae5] transition-all whitespace-nowrap"
            >
              Exportar
            </button>
          </div>
        ) : (
          <div className="relative group w-full max-w-md">
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

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#ec131e]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
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
                          {o.fecha_vent ? new Date(o.fecha_vent).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-bold capitalize max-w-[200px] truncate" title={o.productos_resumen || ''}>
                          {o.productos_resumen || (o.metodopago_usu === 'tarjeta' ? 'Pago con Tarjeta' : 'Venta Directa')}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-[#ec131e] text-base">
                          <span className="text-[10px] mr-0.5">$</span>{safePrice(o.montofinal_vent).toLocaleString('es-CO')}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isAdmin ? (
                            <select
                              value={o.estado || 'pendiente'}
                              disabled={o.estado === 'cancelada'}
                              onChange={(e) => handleStatusChange(o.id_vent!, e.target.value)}
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed ${ESTADO_COLORS[o.estado ?? 'pendiente']}`}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="completada">Completada</option>
                              <option value="cancelada">Cancelada</option>
                              <option value="reembolsada">Reembolsada</option>
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
                        <td className="px-5 py-4 text-right font-black text-[#ec131e] text-base">
                          <span className="text-[10px] mr-0.5">$</span>{safePrice(invoice.total_fact).toLocaleString('es-CO')}
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
                            {productMap[m.cod_prod] || productMap[String(m.cod_prod)] || 'Producto Desconocido'}
                          </p>
                          <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">{(m as any).desc_mov || 'Venta automatizada'}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-slate-600">{m.cantidad} uds</td>
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
                            <span>{r.observaciones_tecnicas || 'Sin título'}</span>
                            {r.cod_prod && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Prod: <span className="text-[#ec131e]">[{r.cod_prod}]</span> {productMap[r.cod_prod] || productMap[String(r.cod_prod)] || ''}
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
                            {r.estado}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button className="text-[#2563eb] text-xs font-black hover:underline disabled:opacity-30" disabled={!isAdmin}>Gestionar</button>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
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

              <form onSubmit={handleCreateIncident} className="flex-1 space-y-6 overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Título / Resumen</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Falla en impresora térmica"
                    value={incidentForm.observaciones_tecnicas}
                    onChange={e => setIncidentForm(f => ({ ...f, observaciones_tecnicas: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-[#ec131e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all"
                  />
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
    </div>
  );
}
