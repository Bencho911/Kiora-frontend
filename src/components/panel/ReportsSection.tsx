import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';
import type { ReportFilters as Filters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import type { Category } from '@/models/Product';
import type { Incident } from '@/models/Incident';
import { ReportFilters } from './reports/ReportFilters';
import { ReportTable } from './reports/ReportTable';
import { SessionHistoryTab } from './reports/SessionHistoryTab';
import { EmailPreviewModal } from './reports/EmailPreviewModal';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useReportsManager } from '@/hooks/useReportsManager';

export function ReportsSection() {
  const {
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
  } = useReportsManager();

  const tabs = [
    { id: 'generar', label: 'Generar', icon: 'bar_chart' },
    { id: 'turnos', label: 'Cajas/Turnos', icon: 'point_of_sale' },
    { id: 'alertas', label: 'Alertas', icon: 'notifications' },
    { id: 'incidencias', label: 'Soporte', icon: 'support' },
    { id: 'inventario', label: 'Inventario', icon: 'inventory_2' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="headline-lg text-on-surface mb-1">
          Reportes de <span className="text-primary">Inteligencia</span>
        </h2>
        <p className="body-md text-on-surface-variant max-w-2xl">
          Analiza el rendimiento de tu negocio con datos reales.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-surface-container-high rounded-lg p-1 w-full flex overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2.5 label-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === t.id
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* GENERAR */}
      {activeTab === 'generar' && (
        <div className="space-y-6">
          <ReportFilters
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            onGenerate={generateReport}
            isLoading={isLoading}
            dateError={dateError}
          />
          <ReportTable
            data={reportData}
            filters={filters}
            onSave={handleSaveReport}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        </div>
      )}

      {/* HISTORIAL DE TURNOS */}
      {activeTab === 'turnos' && (
        <SessionHistoryTab />
      )}

      {/* ALERTAS */}
      {activeTab === 'alertas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={`${alert.alertType}-${alert.cod_prod}`} className="bg-surface rounded-xl border border-outline-variant/30 p-5 hover:shadow-md hover:border-primary/20 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${
                    alert.alertType === 'stock' ? 'bg-error-container/30 text-error' : 'bg-secondary-container/20 text-secondary-container'
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>warning</span>
                    {alert.alertType === 'stock' ? 'Stock Bajo' : 'Caducado'}
                  </span>
                </div>
                <h3 className="label-md text-on-surface break-words mb-1">{alert.nom_prod}</h3>
                <p className="label-sm text-on-surface-variant mb-4">
                  {alert.alertType === 'stock'
                    ? `Stock actual: ${alert.stock_actual} (Mín: ${alert.stock_minimo})`
                    : `Venció el: ${alert.fechaven_prod ? new Date(alert.fechaven_prod).toLocaleDateString() : 'Desconocido'}`}
                </p>
                <button
                  onClick={() => setPreviewData({ isOpen: true, type: alert.alertType, product: alert })}
                  className="w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface-variant label-sm hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
                  Ver Notificación
                </button>
              </div>
            ))
          ) : !isLoading ? (
            <div className="col-span-full py-16 text-center bg-surface rounded-xl border border-dashed border-outline-variant/50">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">notifications_off</span>
              <p className="label-md text-on-surface-variant">No hay alertas activas</p>
              <p className="body-md text-on-surface-variant/70 mt-1">El sistema notificará automáticamente cuando ocurra una incidencia.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* INCIDENCIAS */}
      {activeTab === 'incidencias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="label-md text-on-surface-variant">Reportes Técnicos</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportIncidents('excel')}
                className="flex items-center gap-1.5 rounded-lg bg-tertiary/10 px-3.5 py-2 label-sm text-tertiary border border-tertiary/20 hover:bg-tertiary/20 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_chart</span>
                Excel
              </button>
              <button
                onClick={() => handleExportIncidents('pdf')}
                className="flex items-center gap-1.5 rounded-lg bg-primary-fixed/30 px-3.5 py-2 label-sm text-primary-container border border-primary-fixed/50 hover:bg-primary-fixed/50 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
                PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.length > 0 ? (
              incidents.map((inc) => (
                <div key={inc.id_rep} className="bg-surface rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${
                          inc.prioridad === 'alta' ? 'bg-error-container/30 text-error' :
                          inc.prioridad === 'media' ? 'bg-secondary-container/20 text-secondary-container' :
                          'bg-tertiary/10 text-tertiary'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {inc.prioridad}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${
                          inc.estado === 'resuelto' ? 'bg-tertiary/10 text-tertiary' :
                          inc.estado === 'en_proceso' ? 'bg-surface-container-high text-on-surface-variant' :
                          'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                            {inc.estado === 'resuelto' ? 'check_circle' : 'schedule'}
                          </span>
                          {inc.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="label-md text-on-surface">{inc.titulo || 'Sin Título'}</h3>
                      <p className="label-sm text-on-surface-variant">
                        Reportado el: {new Date(inc.fecha_rep).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant/50 shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>support</span>
                    </div>
                  </div>

                  <div className="bg-surface-container rounded-lg border border-outline-variant/20 p-4 body-md text-on-surface-variant italic mb-4 min-h-[60px]">
                    "{inc.descripcion}"
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/30">
                    {inc.estado !== 'resuelto' && (
                      <button
                        onClick={() => updateIncidentStatus(inc.id_rep, 'resuelto')}
                        className="rounded-lg bg-tertiary/10 text-tertiary label-sm px-3 py-1.5 hover:bg-tertiary hover:text-on-tertiary transition-all"
                      >
                        Resolver
                      </button>
                    )}
                    {inc.estado === 'pendiente' && (
                      <button
                        onClick={() => updateIncidentStatus(inc.id_rep, 'en_proceso')}
                        className="rounded-lg bg-surface-container-high text-on-surface-variant label-sm px-3 py-1.5 hover:bg-primary hover:text-on-primary transition-all"
                      >
                        En Proceso
                      </button>
                    )}
                    {inc.estado === 'resuelto' && (
                      <span className="label-sm text-tertiary flex items-center gap-1 px-2">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                        Caso Cerrado
                      </span>
                    )}
                    <button
                      onClick={() => handleExportSingleIncident(inc)}
                      className="ml-auto p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 transition-all"
                      title="Exportar esta incidencia"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                    </button>
                  </div>
                </div>
              ))
            ) : !isLoading ? (
              <div className="col-span-full py-16 text-center bg-surface rounded-xl border border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">support</span>
                <p className="headline-sm text-on-surface mb-1">No hay incidencias técnicas reportadas</p>
                <p className="body-md text-on-surface-variant">El canal de soporte interno está despejado.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* INVENTARIO */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl border border-outline-variant/30 p-5">
              <p className="label-sm text-on-surface-variant mb-1">Total Prod.</p>
              <p className="headline-lg text-on-surface">{totalProductsCount || '---'}</p>
            </div>
            <div className="bg-surface rounded-xl border border-outline-variant/30 p-5">
              <p className="label-sm text-error mb-1">Bajo Stock</p>
              <p className="headline-lg text-error">{alerts.filter(a => a.alertType === 'stock').length}</p>
            </div>
            <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 col-span-2 sm:col-span-1">
              <p className="label-sm text-secondary-container mb-1">Por Vencer</p>
              <p className="headline-lg text-secondary-container">{alerts.filter(a => a.alertType === 'expired').length}</p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="label-md text-on-surface">Estado General del Inventario</h3>
                <p className="label-sm text-on-surface-variant">Resumen de existencias y valorización estimada</p>
              </div>
              <button
                onClick={() => useInventoryStore.getState().notifyStockChange()}
                className="rounded-lg border border-outline-variant/50 bg-surface px-3.5 py-2 label-sm text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Actualizar Datos
              </button>
            </div>
            <div className="p-6 bg-surface-container-low overflow-x-auto">
              {inventoryChartData.length > 0 ? (
                <div style={{ minWidth: '600px', height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={inventoryChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-surface border border-outline-variant/30 p-3 rounded-lg shadow-md">
                                <p className="label-md text-on-surface mb-2">{label}</p>
                                <p className="body-sm text-primary">Existencias: {payload[0].value} uds</p>
                                <p className="body-sm text-tertiary">Valorización: ${(payload[1].value as number).toLocaleString('es-CO')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar yAxisId="left" dataKey="stock" name="Existencias (uds)" fill="var(--md-sys-color-primary)" radius={[4, 4, 0, 0]} barSize={30} />
                      <Line yAxisId="right" type="monotone" dataKey="valorizacion" name="Valorización ($)" stroke="var(--md-sys-color-tertiary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 animate-spin">sync</span>
                  <p className="body-md text-on-surface-variant">Cargando datos de inventario...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
