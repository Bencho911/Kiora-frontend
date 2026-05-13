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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Reportes de <span className="text-kiora-red">Inteligencia</span>
          </h1>
          <p className="mt-3 text-slate-500 font-medium max-w-2xl leading-relaxed italic">
            "Lo que no se mide, no se puede mejorar." Analiza el rendimiento de tu negocio con datos reales.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto shrink-0">
            <TabsTrigger value="generar" className="px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all gap-2 text-[10px] font-black uppercase tracking-widest">
              <BarChart3 className="w-3.5 h-3.5" /> Generar
            </TabsTrigger>
            <TabsTrigger value="guardados" className="px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all gap-2 text-[10px] font-black uppercase tracking-widest">
              <History className="w-3.5 h-3.5" /> Guardados ({savedReports.length})
            </TabsTrigger>
            <TabsTrigger value="alertas" className="px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all gap-2 text-[10px] font-black uppercase tracking-widest">
              <Bell className="w-3.5 h-3.5" /> Alertas ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="incidencias" className="px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all gap-2 text-[10px] font-black uppercase tracking-widest">
              <LifeBuoy className="w-3.5 h-3.5" /> Incidencias ({incidents.length})
            </TabsTrigger>
            <TabsTrigger value="inventario" className="px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all gap-2 text-[10px] font-black uppercase tracking-widest">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Inventario
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generar" className="space-y-12 mt-0 focus-visible:outline-none">
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
          <div className="flex justify-end gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => handleExportIncidents('excel')}
              className="rounded-xl bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportIncidents('pdf')}
              className="rounded-xl bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <FileText className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <TabsContent value="inventario" className="space-y-8 mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Total Productos</CardTitle>
                <div className="text-4xl font-black text-slate-900">{reportData.length || '---'}</div>
              </CardHeader>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-red-400">Bajo Stock</CardTitle>
                <div className="text-4xl font-black text-red-600">{alerts.filter(a => a.alertType === 'stock').length}</div>
              </CardHeader>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-400">Próximos a Vencer</CardTitle>
                <div className="text-4xl font-black text-amber-600">{alerts.filter(a => a.alertType === 'expired').length}</div>
              </CardHeader>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Estado General del Inventario</CardTitle>
                <CardDescription>Resumen de existencias y valorización estimada</CardDescription>
              </div>
              <Button onClick={() => useInventoryStore.getState().notifyStockChange()} size="sm" variant="outline" className="rounded-xl font-bold">
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
