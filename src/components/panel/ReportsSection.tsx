import React, { useState, useEffect } from 'react';
import { reportService, productService, alertService, incidentService } from '@/config/setup';
import type { ReportFilters as Filters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import type { Category } from '@/models/Product';
import { ReportFilters } from './reports/ReportFilters';
import { ReportTable } from './reports/ReportTable';
import { SavedReportsList } from './reports/SavedReportsList';
import { EmailPreviewModal } from './reports/EmailPreviewModal';
import type { Product } from '@/models/Product';
import type { Incident } from '@/services/IncidentService';

export function ReportsSection() {
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
  const [activeTab, setActiveTab] = useState<'generar' | 'guardados' | 'alertas' | 'incidencias'>('generar');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [previewData, setPreviewData] = useState<{ isOpen: boolean; type: 'stock' | 'expired'; product: any }>({
    isOpen: false,
    type: 'stock',
    product: null
  });

  useEffect(() => {
    localStorage.setItem('kiora_saved_reports', JSON.stringify(savedReports));
  }, [savedReports]);

  useEffect(() => {
    void loadCategories();
    if (activeTab === 'alertas') {
      void loadAlerts();
    }
    if (activeTab === 'incidencias') {
      void loadIncidents();
    }
  }, [activeTab]);

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
    setIsLoading(true);
    try {
      const [lowRes, expRes] = await Promise.all([
        productService.getLowStock(),
        productService.getExpiredProducts()
      ]);
      const lowStock = (lowRes?.data || []).map((p: any) => ({ ...p, alertType: 'stock' }));
      const expired = (expRes || []).map((p: any) => ({ ...p, alertType: 'expired' }));
      setAlerts([...lowStock, ...expired]);
    } catch (e) {
      console.error('Error loading alerts:', e);
    } finally {
      setIsLoading(false);
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

  const loadSavedReport = (report: any) => {
    setFilters(report.filters);
    setActiveTab('generar');
  };

  const generateReport = async () => {
    setIsLoading(true);
    setReportData([]);
    try {
      if (filters.reportType === 'ventas_detalladas') {
        const data = await reportService.getDetailedSales(filters);
        setReportData(data);
      } else {
        const data = await reportService.getProductRanking(filters);
        setReportData(data);
      }
    } catch (error: any) {
      alertService.showError('Error', error.message || 'No se pudo generar el reporte');
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
    const doc = new (require('jspdf').jsPDF)() as any;
    
    // Header
    doc.setFillColor(236, 19, 30);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('KIORA - SOPORTE TÉCNICO', 20, 20);

    // Metadata grid
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
    
    // Split text to fit width
    const splitDesc = doc.splitTextToSize(inc.descripcion, 170);
    doc.text(splitDesc, 20, y);
    
    doc.save(`${fileName}.pdf`);
    alertService.showSuccess('Éxito', 'Incidencia exportada a PDF');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Reportes de <span className="text-kiora-red">Inteligencia</span>
          </h1>
          <p className="mt-3 text-slate-500 font-medium max-w-2xl leading-relaxed">Análisis estratégico de rendimiento comercial, rotación de inventario y auditoría de ventas por periodos.</p>
        </div>
        
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit shadow-inner">
          <button 
            onClick={() => setActiveTab('generar')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'generar' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Generar
          </button>
          <button 
            onClick={() => setActiveTab('guardados')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'guardados' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Guardados ({savedReports.length})
          </button>
          <button 
            onClick={() => setActiveTab('alertas')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'alertas' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Alertas ({alerts.length})
          </button>
          <button 
            onClick={() => setActiveTab('incidencias')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'incidencias' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Incidencias ({incidents.length})
          </button>
        </div>
      </header>

      {activeTab === 'generar' ? (
        <div className="space-y-12">
          <ReportFilters 
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            onGenerate={generateReport}
            isLoading={isLoading}
          />

          <ReportTable 
            data={reportData}
            filters={filters}
            onSave={handleSaveReport}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        </div>
      ) : activeTab === 'guardados' ? (
        <SavedReportsList 
          reports={savedReports}
          onDelete={deleteSavedReport}
          onLoad={loadSavedReport}
        />
      ) : activeTab === 'alertas' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <div key={`${alert.alertType}-${alert.cod_prod}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-kiora-red/20 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${alert.alertType === 'stock' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                      {alert.alertType === 'stock' ? 'Stock Bajo' : 'Caducado'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-2 mb-2">{alert.nom_prod}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {alert.alertType === 'stock' 
                      ? `Stock actual: ${alert.stock_actual} (Mín: ${alert.stock_minimo})`
                      : `Venció el: ${alert.fechaven_prod ? new Date(alert.fechaven_prod).toLocaleDateString() : 'Desconocido'}`}
                  </p>
                </div>
                
                <button 
                  onClick={() => setPreviewData({ isOpen: true, type: alert.alertType, product: alert })}
                  className="mt-6 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-kiora-red hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Ver Correo Enviado
                </button>
              </div>
            ))}
            {alerts.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">No hay alertas activas en este momento.</p>
                <p className="text-xs text-slate-400 mt-1">El sistema notificará automáticamente cuando ocurra una incidencia.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end gap-3 mb-6">
            <button 
              onClick={() => handleExportIncidents('excel')}
              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
            >
              Exportar Excel
            </button>
            <button 
              onClick={() => handleExportIncidents('pdf')}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
            >
              Exportar PDF
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {incidents.map((inc) => (
              <div key={inc.id_rep} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6 group hover:border-kiora-red/20 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                        inc.prioridad === 'alta' ? 'bg-red-100 text-red-600' : 
                        inc.prioridad === 'media' ? 'bg-amber-100 text-amber-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        Prioridad {inc.prioridad}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                        inc.estado === 'resuelto' ? 'bg-emerald-100 text-emerald-600' : 
                        inc.estado === 'en_proceso' ? 'bg-indigo-100 text-indigo-600' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {inc.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900">{inc.titulo || 'Sin Título'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Reportado el: {new Date(inc.fecha_rep).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl italic border border-slate-50">
                  "{inc.descripcion}"
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Acciones:</span>
                  {inc.estado !== 'resuelto' && (
                    <button 
                      onClick={() => updateIncidentStatus(inc.id_rep, 'resuelto')}
                      className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      Marcar Resuelto
                    </button>
                  )}
                  {inc.estado === 'pendiente' && (
                    <button 
                      onClick={() => updateIncidentStatus(inc.id_rep, 'en_proceso')}
                      className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      En Proceso
                    </button>
                  )}
                  {inc.estado === 'resuelto' && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      Caso Cerrado
                    </span>
                  )}
                  <button 
                    onClick={() => handleExportSingleIncident(inc)}
                    className="ml-auto p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-100"
                    title="Exportar esta incidencia"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {incidents.length === 0 && !isLoading && (
              <div className="col-span-full py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-lg font-black text-slate-300">No hay incidencias técnicas reportadas.</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">El canal de soporte interno está despejado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {previewData.isOpen && (
        <EmailPreviewModal 
          isOpen={previewData.isOpen}
          type={previewData.type}
          product={previewData.product}
          onClose={() => setPreviewData(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
