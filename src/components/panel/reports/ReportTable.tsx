import React, { useMemo } from 'react';
import type { ReportFilters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportChart } from './ReportChart';

interface ReportTableProps {
  data: any[];
  filters: ReportFilters;
  onSave: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  data,
  filters,
  onSave,
  onExportExcel,
  onExportPdf
}) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    if (filters.reportType === 'ventas_detalladas') {
      const totalSales = data.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
      const totalOrders = data.reduce((acc, curr) => acc + (curr.orderCount || 0), 0);
      return { totalSales, totalOrders, avgTicket: totalSales / (totalOrders || 1) };
    } else {
      const totalQty = data.reduce((acc, curr) => acc + (curr.quantitySold || 0), 0);
      const totalRev = data.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
      return { totalQty, totalRev, topProduct: data[0]?.productName || '—' };
    }
  }, [data, filters.reportType]);

  if (data.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center text-center bg-surface rounded-xl border border-dashed border-outline-variant/50 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-surface-container-high rounded-xl flex items-center justify-center text-on-surface-variant/50 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>bar_chart</span>
        </div>
        <h4 className="headline-sm text-on-surface mb-1">Análisis de Datos Pendiente</h4>
        <p className="body-md text-on-surface-variant max-w-sm">
          Configura los filtros y presiona <span className="font-semibold text-on-surface">Generar Reporte</span> para descubrir insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ReportChart data={data} type={filters.reportType} />

      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/30 bg-surface-container-low/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="label-md text-on-surface">Análisis de Resultados</h3>
              <p className="label-sm text-on-surface-variant">Visualización de métricas y datos tabulados</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSave}
                className="rounded-lg bg-primary-fixed/30 text-primary-container p-2.5 border border-primary-fixed/50 hover:bg-primary-fixed/50 transition-all"
                title="Guardar reporte"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bookmark</span>
              </button>
              <button
                onClick={onExportExcel}
                className="rounded-lg bg-tertiary/10 text-tertiary p-2.5 border border-tertiary/20 hover:bg-tertiary/20 transition-all"
                title="Exportar a Excel"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_chart</span>
              </button>
              <button
                onClick={onExportPdf}
                className="rounded-lg bg-primary-fixed/30 text-primary-container p-2.5 border border-primary-fixed/50 hover:bg-primary-fixed/50 transition-all"
                title="Exportar a PDF"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
          {filters.reportType === 'ventas_detalladas' && stats ? (
            <>
              <div className="p-5">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Ingresos Totales
                </p>
                <p className="headline-md text-on-surface">${stats.totalSales?.toLocaleString('es-CO')}</p>
              </div>
              <div className="p-5">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> {filters.grouping === 'unidad' ? 'Total Unidades' : 'Total Pedidos'}
                </p>
                <p className="headline-md text-on-surface">{stats.totalOrders}</p>
              </div>
              <div className="p-5">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full text-primary" /> {filters.grouping === 'unidad' ? 'Precio Promedio' : 'Ticket Promedio'}
                </p>
                <p className="headline-md text-primary">${stats.avgTicket?.toLocaleString('es-CO')}</p>
              </div>
              <div className="p-5">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-surface" /> Items / Periodos
                </p>
                <p className="headline-md text-on-surface">{data.length}</p>
              </div>
            </>
          ) : stats && (
            <>
              <div className="p-5">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Unidades
                </p>
                <p className="headline-md text-on-surface">{stats.totalQty}</p>
              </div>
              <div className="p-5">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Facturación
                </p>
                <p className="headline-md text-on-surface">${stats.totalRev?.toLocaleString('es-CO')}</p>
              </div>
              <div className="p-5 col-span-1 sm:col-span-2">
                <p className="label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full text-primary" /> Máximo Impacto
                </p>
                <p className="headline-sm text-primary truncate">{stats.topProduct}</p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20">
          <Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                {filters.reportType === 'ventas_detalladas' ? (
                  <>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">
                      {filters.grouping === 'unidad' ? 'Producto / Pedido' : 'Periodo'}
                    </TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">
                      {filters.grouping === 'unidad' ? 'Subtotal' : 'Ventas Netas'}
                    </TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">
                      {filters.grouping === 'unidad' ? 'Unidades' : 'Volumen'}
                    </TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">
                      {filters.grouping === 'unidad' ? 'Precio Unit.' : 'Ticket'}
                    </TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12 w-16">Pos.</TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">Producto</TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">SKU</TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12">Rotación</TableHead>
                    <TableHead className="label-sm text-on-surface-variant font-semibold px-4 h-12 text-right">Recaudación</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filters.reportType === 'ventas_detalladas' ? (
                (data as DetailedSalesReport[]).map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-surface-container-low transition-colors">
                    <TableCell className="px-4 py-4 label-md text-on-surface">{row.period}</TableCell>
                    <TableCell className="px-4 py-4 body-md text-on-surface-variant">${row.totalSales.toLocaleString('es-CO')}</TableCell>
                    <TableCell className="px-4 py-4 body-md text-on-surface-variant">{row.orderCount} {filters.grouping === 'unidad' ? 'uds' : 'ops'}</TableCell>
                    <TableCell className="px-4 py-4 label-md text-primary">${row.averageTicket.toLocaleString('es-CO')}</TableCell>
                  </TableRow>
                ))
              ) : (
                (data as ProductRankingReport[]).map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-surface-container-low transition-colors">
                    <TableCell className="px-4 py-4">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold ${
                        idx < 3 ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {row.position}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 label-md text-on-surface">{row.productName}</TableCell>
                    <TableCell className="px-4 py-4 label-sm text-on-surface-variant font-mono">#{row.productCode}</TableCell>
                    <TableCell className="px-4 py-4 body-md text-on-surface-variant">{row.quantitySold} uds</TableCell>
                    <TableCell className="px-4 py-4 label-md text-on-surface text-right">${row.totalRevenue.toLocaleString('es-CO')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-surface-container rounded-lg border border-outline-variant/20">
        <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center text-on-surface-variant/50 border border-outline-variant/30">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
        </div>
        <div>
          <p className="label-sm text-on-surface-variant">Nota de Auditoría</p>
          <p className="body-md text-on-surface-variant">Los datos presentados corresponden a transacciones liquidadas y conciliadas en el sistema.</p>
        </div>
      </div>
    </div>
  );
};
