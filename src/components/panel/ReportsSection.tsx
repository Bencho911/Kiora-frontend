import React, { useState, useEffect } from 'react';
import { reportService, productService, alertService } from '@/config/setup';
import type { ReportFilters as Filters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import type { Category } from '@/models/Product';
import { ReportFilters } from './reports/ReportFilters';
import { ReportTable } from './reports/ReportTable';
import { SavedReportsList } from './reports/SavedReportsList';

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
  const [activeTab, setActiveTab] = useState<'generar' | 'guardados'>('generar');

  useEffect(() => {
    localStorage.setItem('kiora_saved_reports', JSON.stringify(savedReports));
  }, [savedReports]);

  useEffect(() => {
    void loadCategories();
  }, []);

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
      head = [['Periodo', 'Total Ventas', 'Cant. Pedidos', 'Ticket Promedio']];
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
      ) : (
        <SavedReportsList 
          reports={savedReports}
          onDelete={deleteSavedReport}
          onLoad={loadSavedReport}
        />
      )}
    </div>
  );
}
