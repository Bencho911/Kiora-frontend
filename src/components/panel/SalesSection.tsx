import { useState, useEffect, useMemo, useCallback } from 'react';
import { orderService, alertService, authService, inventoryService, incidentService, reportService } from '@/config/setup';
import type { Order, Invoice } from '@/models/Order';
import type { Movement } from '@/models/Inventory';
import type { Incident } from '@/services/IncidentService';
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
  pagado: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelada: 'bg-[#ffdce5] text-[#ec131e] border-[#ffecf1]',
  reembolsada: 'bg-purple-100 text-purple-700 border-purple-200',
  en_proceso: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  resuelto: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

import { useStockSync } from '@/context/StockContext';

export function SalesSection({ onOpenPOS }: { onOpenPOS: () => void; isAdmin?: boolean }) {
  const { productMap } = useStockSync();
  const [subTab, setSubTab] = useState<SalesSubTab>('ventas');
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [reports, setReports] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInvoiceId, setSearchInvoiceId] = useState('');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    cod_prod: null as number | null
  });
  const [managingIncident, setManagingIncident] = useState<Incident | null>(null);

  // Cancel / Refund reason modal state
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    type: 'cancel' | 'refund';
    orderId: number | null;
    reason: string;
  }>({ isOpen: false, type: 'cancel', orderId: null, reason: '' });

  const isAdmin = authService.isAdmin();
  const isPaidStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'completada' || normalized === 'pagado' || normalized === 'pagada';
  };

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
        const data = await incidentService.getAll();
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
      if (subTab === 'incidencias') {
        await handleExportIncidents(type);
        return;
      }
      if (type === 'excel') await orderService.exportExcel();
      else await orderService.exportPdf();
      alertService.showToast('success', `Reporte ${type.toUpperCase()} generado`);
    } catch (e) {
      alertService.showToast('error', 'Error al exportar reporte');
    }
  };

  const handleExportIncidents = async (type: 'excel' | 'pdf') => {
    if (reports.length === 0) {
      alertService.showToast('warning', 'No hay incidencias para exportar');
      return;
    }
    const fileName = `kiora_incidencias_${new Date().toISOString().slice(0, 10)}`;
    
    if (type === 'excel') {
      const data = reports.map(r => ({
        ID: r.id_rep,
        Fecha: new Date(r.fecha_rep).toLocaleString(),
        Título: r.titulo || r.observaciones_tecnicas || 'Sin título',
        Descripción: r.descripcion,
        Prioridad: r.prioridad,
        Estado: r.estado,
        Producto_Afectado: r.cod_prod || 'N/A'
      }));
      reportService.exportToExcel(data, fileName);
    } else {
      const title = 'Reporte de Incidencias Técnicas';
      const head = [['ID', 'Fecha', 'Título', 'Prioridad', 'Estado']];
      const body = reports.map(r => [
        r.id_rep,
        new Date(r.fecha_rep).toLocaleDateString(),
        r.titulo || r.observaciones_tecnicas || 'Sin título',
        r.prioridad.toUpperCase(),
        r.estado.toUpperCase().replace('_', ' ')
      ]);
      reportService.exportToPdf(title, head, body, fileName);
    }
    alertService.showToast('success', `Incidencias exportadas a ${type.toUpperCase()}`);
  };

  const handleExportSingleIncident = (inc: Incident) => {
    const fileName = `incidencia_${inc.id_rep}`;
    const doc = new jsPDF() as any;
    
    doc.setFillColor(236, 19, 30);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('KIORA - SOPORTE TÉCNICO', 20, 20);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let y = 45;
    const drawLine = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, y);
      y += 8;
    };

    drawLine('ID REPORTE', `#${inc.id_rep}`);
    drawLine('FECHA', new Date(inc.fecha_rep).toLocaleString());
    drawLine('ESTADO', inc.estado.toUpperCase().replace('_', ' '));
    drawLine('PRIORIDAD', inc.prioridad.toUpperCase());
    drawLine('PRODUCTO', inc.cod_prod ? inc.cod_prod.toString() : 'N/A');
    drawLine('TITULO', inc.titulo || 'Sin título');

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCIÓN DEL PROBLEMA:', 20, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    const splitDesc = doc.splitTextToSize(inc.descripcion, 170);
    doc.text(splitDesc, 20, y);
    
    doc.save(`${fileName}.pdf`);
    alertService.showToast('success', 'Incidencia exportada a PDF');
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
      void loadData();
      return;
    }

    if (newStatus === 'cancelada' || newStatus === 'reembolsada') {
      setReasonModal({ isOpen: true, type: newStatus === 'cancelada' ? 'cancel' : 'refund', orderId: id, reason: '' });
      return;
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

  const handleConfirmReason = async () => {
    const { orderId, type, reason } = reasonModal;
    if (!reason.trim()) {
      alertService.showToast('warning', 'Debes ingresar un motivo para continuar');
      return;
    }
    if (!orderId) return;
    const targetStatus = 'reembolsada';
    setReasonModal(prev => ({ ...prev, isOpen: false }));
    try {
      await orderService.updateOrderStatus(orderId, targetStatus);
      alertService.showToast('success', type === 'cancel' ? `Venta #${orderId} cancelada y stock devuelto` : `Reembolso de venta #${orderId} procesado`);
      setDetailOrder(null);
      void loadData();
    } catch (e: any) {
      if (e.message?.includes('409') || e.status === 409) {
        alertService.showToast('error', 'Error de conflicto de stock');
      } else {
        alertService.showToast('error', getErrorMessage(e, 'Error al procesar la operación'));
      }
    }
  };

  const handleRefund = (id: number) => {
    setReasonModal({ isOpen: true, type: 'refund', orderId: id, reason: '' });
  };

  const handleDeleteOrder = (id: number) => {
    setReasonModal({ isOpen: true, type: 'cancel', orderId: id, reason: '' });
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
    if (!incidentForm.titulo || !incidentForm.descripcion) {
      alertService.showToast('warning', 'Título y descripción son obligatorios');
      return;
    }
    setIsSavingIncident(true);
    try {
      const user = authService.getUser();
      await incidentService.create({
        titulo: incidentForm.titulo,
        descripcion: incidentForm.descripcion,
        cod_prod: incidentForm.cod_prod || undefined,
        prioridad: incidentForm.prioridad,
        estado: 'pendiente',
        fk_id_usu: user?.id_usu || 1
      });
      alertService.showToast('success', 'Incidencia reportada correctamente');
      setIsIncidentOpen(false);
      setIncidentForm({ titulo: '', descripcion: '', prioridad: 'media', cod_prod: null });
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
                            <span>{r.titulo || r.observaciones_tecnicas || 'Sin título'}</span>
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
                      onClick={async () => {
                        try {
                          await incidentService.updateStatus(managingIncident.id_rep, s);
                          alertService.showToast('success', `Estado actualizado a ${s}`);
                          setManagingIncident(null);
                          void loadData();
                        } catch (e) {
                          alertService.showToast('error', 'No se pudo actualizar el estado');
                        }
                      }}
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
      )}\n\n      {/* Modal de Motivo — Cancelación / Reembolso */}
      {reasonModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setReasonModal(prev => ({ ...prev, isOpen: false })); void loadData(); }}
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
                onClick={() => { setReasonModal(prev => ({ ...prev, isOpen: false })); void loadData(); }}
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
