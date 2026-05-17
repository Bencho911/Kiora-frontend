import React from 'react';
import type { ReportFilters as Filters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import type { Category } from '@/models/Product';
import type { Incident } from '@/models/Incident';
import { ReportFilters } from './reports/ReportFilters';
import { ReportTable } from './reports/ReportTable';
import { SavedReportsList } from './reports/SavedReportsList';
import { EmailPreviewModal } from './reports/EmailPreviewModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInventoryStore } from '@/store/useInventoryStore';
import {
  BarChart3,
  History,
  Bell,
  LifeBuoy,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

import { useReportsManager } from '@/hooks/useReportsManager';

export function ReportsSection() {
  const {
    categories, filters, setFilters,
    isLoading, reportData, savedReports,
    activeTab, setActiveTab, alerts,
    incidents, previewData, setPreviewData,
    updateIncidentStatus, handleSaveReport,
    deleteSavedReport, loadSavedReport,
    generateReport, handleExportExcel,
    handleExportPdf, handleExportIncidents,
    handleExportSingleIncident
  } = useReportsManager();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between px-1 sm:px-2">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
            Reportes de <span className="text-kiora-red">Inteligencia</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-500 font-medium max-w-2xl leading-relaxed italic">
            "Lo que no se mide, no se puede mejorar." Analiza el rendimiento de tu negocio con datos reales.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="px-1 sm:px-0">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl sm:rounded-2xl h-auto w-full flex items-center justify-between gap-0.5 sm:gap-1">
            <TabsTrigger value="generar" className="flex-1 px-1 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 transition-all gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest overflow-hidden">
              <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Generar</span>
            </TabsTrigger>
            <TabsTrigger value="guardados" className="flex-1 px-1 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 transition-all gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest overflow-hidden">
              <History className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Hist.</span><span className="hidden sm:inline">orial</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex-1 px-1 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 transition-all gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest overflow-hidden">
              <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="incidencias" className="flex-1 px-1 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 transition-all gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest overflow-hidden">
              <LifeBuoy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Soporte</span>
            </TabsTrigger>
            <TabsTrigger value="inventario" className="flex-1 px-1 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 transition-all gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest overflow-hidden">
              <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Inv.</span><span className="hidden sm:inline">entario</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generar" className="space-y-6 mt-0 focus-visible:outline-none">
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
        </TabsContent>

        <TabsContent value="guardados" className="mt-0 focus-visible:outline-none">
          <SavedReportsList
            reports={savedReports}
            onDelete={deleteSavedReport}
            onLoad={loadSavedReport}
          />
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6 mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <Card key={`${alert.alertType}-${alert.cod_prod}`} className="border-none shadow-xl shadow-slate-100/50 rounded-[2rem] overflow-hidden bg-white hover:ring-2 hover:ring-kiora-red/20 transition-all group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${alert.alertType === 'stock' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {alert.alertType === 'stock' ? 'Stock Bajo' : 'Caducado'}
                    </div>
                  </div>
                  <CardTitle className="text-base font-black text-slate-900 line-clamp-2">{alert.nom_prod}</CardTitle>
                  <CardDescription className="font-bold text-slate-400">
                    {alert.alertType === 'stock'
                      ? `Stock actual: ${alert.stock_actual} (Mín: ${alert.stock_minimo})`
                      : `Venció el: ${alert.fechaven_prod ? new Date(alert.fechaven_prod).toLocaleDateString() : 'Desconocido'}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="secondary"
                    onClick={() => setPreviewData({ isOpen: true, type: alert.alertType, product: alert })}
                    className="w-full rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-kiora-red hover:text-white h-12 gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Ver Notificación
                  </Button>
                </CardContent>
              </Card>
            ))}
            {alerts.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">No hay alertas activas en este momento.</p>
                <p className="text-xs text-slate-400 mt-1">El sistema notificará automáticamente cuando ocurra una incidencia.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="incidencias" className="space-y-6 mt-0 focus-visible:outline-none">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Reportes Técnicos</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportIncidents('excel')}
                className="rounded-xl bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-4"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportIncidents('pdf')}
                className="rounded-xl bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest h-10 px-4"
              >
                <FileText className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {incidents.map((inc) => (
              <Card key={inc.id_rep} className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white hover:ring-2 hover:ring-kiora-red/10 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${inc.prioridad === 'alta' ? 'bg-red-100 text-red-600' :
                            inc.prioridad === 'media' ? 'bg-amber-100 text-amber-600' :
                              'bg-blue-100 text-blue-600'
                          }`}>
                          <div className="w-1 h-1 rounded-full bg-current" /> {inc.prioridad}
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${inc.estado === 'resuelto' ? 'bg-emerald-100 text-emerald-600' :
                            inc.estado === 'en_proceso' ? 'bg-indigo-100 text-indigo-600' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                          {inc.estado === 'resuelto' ? <CheckCircle2 className="w-2 h-2" /> : <Clock className="w-2 h-2" />}
                          {inc.estado.replace('_', ' ')}
                        </div>
                      </div>
                      <CardTitle className="text-lg font-black text-slate-900">{inc.titulo || 'Sin Título'}</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Reportado el: {new Date(inc.fecha_rep).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                      <LifeBuoy className="w-6 h-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl italic border border-slate-50 min-h-[80px]">
                    "{inc.descripcion}"
                  </p>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Acciones:</span>
                    {inc.estado !== 'resuelto' && (
                      <Button
                        size="sm"
                        onClick={() => updateIncidentStatus(inc.id_rep, 'resuelto')}
                        className="rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white h-9"
                      >
                        Resolver
                      </Button>
                    )}
                    {inc.estado === 'pendiente' && (
                      <Button
                        size="sm"
                        onClick={() => updateIncidentStatus(inc.id_rep, 'en_proceso')}
                        className="rounded-xl bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white h-9"
                      >
                        En Proceso
                      </Button>
                    )}
                    {inc.estado === 'resuelto' && (
                      <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 px-3">
                        <CheckCircle2 className="w-4 h-4" />
                        Caso Cerrado
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExportSingleIncident(inc)}
                      className="ml-auto rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Exportar esta incidencia"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {incidents.length === 0 && !isLoading && (
              <div className="col-span-full py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <p className="text-lg font-black text-slate-300">No hay incidencias técnicas reportadas.</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">El canal de soporte interno está despejado.</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="inventario" className="space-y-6 sm:space-y-8 mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-lg bg-white p-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-[9px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-widest text-slate-400 mb-1">Total Prod.</CardTitle>
                <div className="text-2xl sm:text-4xl font-black text-slate-900 leading-none">{reportData.length || '---'}</div>
              </CardHeader>
            </Card>
            <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-lg bg-white p-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-[9px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-widest text-red-400 mb-1">Bajo Stock</CardTitle>
                <div className="text-2xl sm:text-4xl font-black text-red-600 leading-none">{alerts.filter(a => a.alertType === 'stock').length}</div>
              </CardHeader>
            </Card>
            <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-lg bg-white p-1 col-span-2 sm:col-span-1">
              <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between sm:block">
                <div>
                   <CardTitle className="text-[9px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-widest text-amber-400 mb-1">Por Vencer</CardTitle>
                   <div className="text-2xl sm:text-4xl font-black text-amber-600 leading-none">{alerts.filter(a => a.alertType === 'expired').length}</div>
                </div>
                <div className="sm:hidden w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                   <Bell className="w-5 h-5" />
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card className="rounded-[2rem] sm:rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
              <div>
                <CardTitle className="text-lg sm:text-xl font-black text-slate-900">Estado General del Inventario</CardTitle>
                <CardDescription className="font-medium text-slate-500">Resumen de existencias y valorización estimada</CardDescription>
              </div>
              <Button onClick={() => useInventoryStore.getState().notifyStockChange()} size="sm" variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 w-full sm:w-auto">
                Actualizar Datos
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 text-center bg-slate-50/50">
                <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Gráficos de rotación de inventario próximamente disponibles.</p>
                <p className="text-xs text-slate-400 mt-1">Utiliza la pestaña "Generar" para obtener tablas detalladas de existencias.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {previewData.isOpen && previewData.product !== null && (
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
