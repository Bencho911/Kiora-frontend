import { useState, useEffect, useMemo, useCallback } from 'react';
import { orderService, alertService, authService, inventoryService, incidentService, reportService } from '@/config/setup';
import type { Order, Invoice } from '@/models/Order';
import type { Movement } from '@/models/Inventory';
import type { Incident } from '@/models/Incident';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { useSalesStore } from '@/store/useSalesStore';

export type SalesSubTab = 'ventas' | 'facturas' | 'movimientos' | 'incidencias';

export function useSalesManager(isAdmin: boolean) {
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
  
  // Incident Form State
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

  const { salesSyncVersion } = useSalesStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'ventas') {
        const res = await orderService.getOrders();
        setOrders(res.data || []);
      } else if (subTab === 'facturas') {
        const data = await orderService.getInvoices();
        setInvoices(data?.data || []);
      } else if (subTab === 'movimientos') {
        const res = await inventoryService.getMovements();
        setMovements(Array.isArray(res) ? res : (res?.data || []));
      } else if (subTab === 'incidencias') {
        const data = await incidentService.getAll();
        setReports(data || []);
      }
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    void loadData();
  }, [loadData, salesSyncVersion]);

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

  // Redirigir PDFs locales al Backend
  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      alertService.showToast('info', 'Obteniendo factura del servidor...');
      await orderService.downloadReceipt(invoice.id_pedido);
      alertService.showToast('success', 'Factura descargada');
    } catch (e) {
      alertService.showToast('error', 'Error al generar la factura');
    }
  };

  const handleDownloadReceipt = async (id: number) => {
    try {
      alertService.showToast('info', 'Generando recibo...');
      await orderService.downloadReceipt(id);
      alertService.showToast('success', 'Recibo descargado');
    } catch (e) {
      alertService.showToast('error', 'Error al descargar recibo');
    }
  };

  const handleSaveIncident = async () => {
    if (!incidentForm.descripcion.trim()) {
      alertService.showToast('warning', 'La descripción es obligatoria');
      return;
    }
    setIsSavingIncident(true);
    try {
      const payload: Partial<Incident> = {
        titulo: incidentForm.titulo.trim() || undefined,
        descripcion: incidentForm.descripcion,
        prioridad: incidentForm.prioridad,
        cod_prod: incidentForm.cod_prod || undefined,
        estado: 'pendiente',
      };

      if (managingIncident) {
        await incidentService.update(managingIncident.id_rep, payload);
        alertService.showToast('success', 'Incidencia actualizada');
      } else {
        await incidentService.create(payload);
        alertService.showToast('success', 'Incidencia reportada correctamente');
      }
      setIsIncidentOpen(false);
      setManagingIncident(null);
      setIncidentForm({ titulo: '', descripcion: '', prioridad: 'media', cod_prod: null });
      void loadData();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al guardar incidencia'));
    } finally {
      setIsSavingIncident(false);
    }
  };

  const handleDeleteIncident = async (id: number) => {
    try {
      await incidentService.delete(id);
      alertService.showToast('success', 'Incidencia eliminada');
      void loadData();
    } catch (e) {
      alertService.showToast('error', 'Error al eliminar incidencia');
    }
  };

  const handleUpdateIncidentStatus = async (id: number, newStatus: string) => {
    try {
      await incidentService.updateStatus(id, newStatus as any);
      alertService.showToast('success', 'Estado actualizado');
      void loadData();
    } catch (e) {
      alertService.showToast('error', 'Error al actualizar estado');
    }
  };

  return {
    subTab, setSubTab,
    orders, invoices, movements, reports,
    loading, search, setSearch, searchInvoiceId, setSearchInvoiceId,
    detailOrder, setDetailOrder, detailMovement, setDetailMovement,
    isIncidentOpen, setIsIncidentOpen, isSavingIncident, incidentForm, setIncidentForm, managingIncident, setManagingIncident,
    reasonModal, setReasonModal,
    filteredOrders,
    handleExport, handleExportIncidents,
    handleViewDetails, handleStatusChange, handleConfirmReason, handleRefund, handleDeleteOrder,
    downloadInvoicePDF, handleDownloadReceipt,
    handleSaveIncident, handleDeleteIncident, handleUpdateIncidentStatus
  };
}
