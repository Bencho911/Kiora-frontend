import { useState, useEffect } from 'react';
import { reportService, productService, alertService, incidentService } from '@/config/setup';
import type { ReportFilters as Filters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import type { Category, Product } from '@/models/Product';
import { jsPDF } from 'jspdf';
import type { Incident } from '@/models/Incident';

export function useReportsManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    grouping: 'dia',
    reportType: 'ventas_detalladas',
    topN: 10,
    category: undefined
  });

  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kiora_saved_reports');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState('generar');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [inventoryChartData, setInventoryChartData] = useState<any[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [previewData, setPreviewData] = useState<{ isOpen: boolean; type: 'stock' | 'expired'; product: Product | null }>({
    isOpen: false,
    type: 'stock',
    product: null
  });
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('kiora_saved_reports', JSON.stringify(savedReports));
  }, [savedReports]);

  useEffect(() => {
    void loadCategories();
    void loadAlerts();
    void loadIncidents();
    void loadInventoryChartData();
  }, []);

  const loadInventoryChartData = async () => {
    try {
      const res = await productService.getProducts(1, 1000);
      const list = Array.isArray(res) ? res : (res.data || []);
      
      // Update total products count
      setTotalProductsCount(res.pagination?.total || list.length);
      
      // Map to chart format, calculate valuation, sort by stock
      const chartData = list
        .map(p => ({
          name: p.nom_prod,
          stock: p.stock_actual || 0,
          valorizacion: (p.stock_actual || 0) * (p.precio_prod || 0)
        }))
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 10); // Top 10 for better visualization
        
      setInventoryChartData(chartData);
    } catch (e) {
      console.error('Error loading inventory chart data:', e);
    }
  };

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await incidentService.getAll();
      setIncidents(data);
    } catch (e) {
      console.error('Error loading incidents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncidentStatus = async (id: number, status: Incident['estado']) => {
    try {
      await incidentService.updateStatus(id, status);
      alertService.showSuccess('Estado Actualizado', `El incidente ha sido marcado como ${status}`);
      void loadIncidents();
    } catch (e) {
      alertService.showError('Error', 'No se pudo actualizar el estado del incidente');
    }
  };

  const loadAlerts = async () => {
    try {
      const [lowRes, expRes] = await Promise.all([
        productService.getLowStock(),
        productService.getExpiredProducts()
      ]);
      const lowStock = (lowRes?.data || []).map((p: Product) => ({ ...p, alertType: 'stock' }));
      const expired = (expRes || []).map((p: Product) => ({ ...p, alertType: 'expired' }));
      setAlerts([...lowStock, ...expired]);
    } catch (e) {
      console.error('Error loading alerts:', e);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await productService.getCategories();
      setCategories(res.data || []);
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  const handleSaveReport = () => {
    if (reportData.length === 0) return;
    const newReport = {
      id: Date.now(),
      filters: { ...filters },
      date: new Date().toLocaleString(),
      name: `Reporte ${filters.reportType === 'ventas_detalladas' ? 'Ventas' : 'Ranking'} (${filters.startDate} a ${filters.endDate})`
    };
    setSavedReports([newReport, ...savedReports]);
    alertService.showSuccess('Guardado', 'El reporte ha sido marcado para consulta posterior');
  };

  const deleteSavedReport = (id: number) => {
    setSavedReports(savedReports.filter(r => r.id !== id));
  };

  const loadSavedReport = (report: { filters: Record<string, unknown>; [key: string]: unknown }) => {
    setFilters(report.filters as unknown as Filters);
    setActiveTab('generar');
  };

  const generateReport = async () => {
    // Clear any previous date errors
    setDateError(null);

    // Validate date range
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      alertService.showError('Rango de fechas inválido', 'La fecha de inicio no puede ser posterior a la fecha de fin. Por favor, selecciona un rango válido.');
      return;
    }

    setIsLoading(true);
    setReportData([]);
    try {
      let data: any[];
      if (filters.reportType === 'ventas_detalladas') {
        data = await reportService.getDetailedSales(filters);
      } else {
        data = await reportService.getProductRanking(filters);
      }

      if (data.length === 0) {
        setDateError('No hay reportes para generar en el rango de fechas seleccionado. Por favor, elige otras fechas.');
        alertService.showToast('warning', 'No hay datos de ventas en el rango de fechas seleccionado.');
      }

      setReportData(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'No se pudo generar el reporte';
      alertService.showError('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return;
    const fileName = `kiora_reporte_${filters.reportType}_${new Date().toISOString().slice(0, 10)}`;

    let dataToExport = [...reportData];
    if (filters.reportType === 'ventas_detalladas') {
      const totalSales = reportData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
      const totalOrders = reportData.reduce((acc, curr) => acc + (curr.orderCount || 0), 0);
      dataToExport.push({
        period: 'TOTAL',
        totalSales,
        orderCount: totalOrders,
        averageTicket: totalSales / (totalOrders || 1)
      });
    } else {
      const totalQty = reportData.reduce((acc, curr) => acc + (curr.quantitySold || 0), 0);
      const totalRev = reportData.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
      dataToExport.push({
        position: '',
        productName: 'TOTAL',
        productCode: '',
        quantitySold: totalQty,
        totalRevenue: totalRev
      });
    }

    reportService.exportToExcel(dataToExport, fileName);
    alertService.showSuccess('Éxito', 'Reporte exportado a Excel con totales');
  };

  const handleExportPdf = () => {
    if (reportData.length === 0) return;
    const fileName = `kiora_reporte_${filters.reportType}_${new Date().toISOString().slice(0, 10)}`;

    let title = '';
    let head: string[][] = [];
    let body: any[][] = [];
    let foot: string[][] = [];

    if (filters.reportType === 'ventas_detalladas') {
      title = 'Reporte de Ventas Detalladas';
      head = [
        filters.grouping === 'unidad'
          ? ['Producto / Pedido', 'Subtotal', 'Unidades', 'Precio Unitario']
          : ['Periodo', 'Total Ventas', 'Cant. Pedidos', 'Ticket Promedio']
      ];
      body = (reportData as DetailedSalesReport[]).map(d => [
        d.period,
        `$${Number(d.totalSales).toLocaleString('es-CO')}`,
        d.orderCount,
        `$${Number(d.averageTicket).toLocaleString('es-CO')}`
      ]);

      const totalSales = reportData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
      const totalOrders = reportData.reduce((acc, curr) => acc + (curr.orderCount || 0), 0);
      foot = [['TOTAL', `$${totalSales.toLocaleString('es-CO')}`, totalOrders.toString(), `$${(totalSales / (totalOrders || 1)).toLocaleString('es-CO')}`]];
    } else {
      title = filters.reportType === 'mas_vendidos' ? 'Ranking: Productos Más Vendidos' : 'Ranking: Productos Menos Vendidos';
      head = [['Pos.', 'Producto', 'Código', 'Cantidad', 'Ingresos Totales']];
      body = (reportData as ProductRankingReport[]).map(d => [
        d.position,
        d.productName,
        d.productCode,
        d.quantitySold,
        `$${Number(d.totalRevenue).toLocaleString('es-CO')}`
      ]);

      const totalQty = reportData.reduce((acc, curr) => acc + (curr.quantitySold || 0), 0);
      const totalRev = reportData.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
      foot = [['', 'TOTAL', '', totalQty.toString(), `$${totalRev.toLocaleString('es-CO')}`]];
    }

    reportService.exportToPdf(title, head, body, fileName, foot);
    alertService.showSuccess('Éxito', 'Reporte exportado a PDF con totales');
  };

  const handleExportIncidents = (type: 'excel' | 'pdf') => {
    if (incidents.length === 0) {
      alertService.showError('Error', 'No hay incidencias para exportar');
      return;
    }
    const fileName = `kiora_incidencias_${new Date().toISOString().slice(0, 10)}`;

    if (type === 'excel') {
      const data = incidents.map(r => ({
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
      const body = incidents.map(r => [
        r.id_rep,
        new Date(r.fecha_rep).toLocaleDateString(),
        r.titulo || r.observaciones_tecnicas || 'Sin título',
        r.prioridad.toUpperCase(),
        r.estado.toUpperCase().replace('_', ' ')
      ]);
      reportService.exportToPdf(title, head, body, fileName);
    }
    alertService.showSuccess('Éxito', `Incidencias exportadas a ${type.toUpperCase()}`);
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
    alertService.showSuccess('Éxito', 'Incidencia exportada a PDF');
  };

  return {
    categories, filters, setFilters,
    isLoading, reportData, savedReports,
    activeTab, setActiveTab, alerts,
    incidents, previewData, setPreviewData,
    inventoryChartData, totalProductsCount,
    updateIncidentStatus, handleSaveReport,
    deleteSavedReport, loadSavedReport,
    generateReport, handleExportExcel,
    handleExportPdf, handleExportIncidents,
    handleExportSingleIncident, dateError
  };
}
