import React, { useMemo } from 'react';
import type { ReportFilters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, Bookmark, BarChart, Info } from 'lucide-react';
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
      <div className="py-32 flex flex-col items-center text-center px-8">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
          <BarChart className="w-10 h-10" />
        </div>
        <h4 className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin Datos Generados</h4>
        <p className="text-slate-300 text-sm font-medium mt-2 max-w-xs">Selecciona los filtros y haz clic en "Generar Reporte" para visualizar los resultados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ReportChart data={data} type={filters.reportType} />

      <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="font-black text-slate-900 text-lg uppercase tracking-tight">Análisis de Resultados</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Visualización de métricas y datos tabulados</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onSave} 
                className="rounded-xl border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 h-11 w-11 shadow-sm"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onExportExcel} 
                className="rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 h-11 w-11 shadow-sm"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onExportPdf} 
                className="rounded-xl border-red-100 bg-red-50 text-kiora-red hover:bg-red-100 hover:text-red-700 h-11 w-11 shadow-sm"
              >
                <FileDown className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
            {filters.reportType === 'ventas_detalladas' && stats ? (
              <>
                <div className="p-8 bg-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Ingresos Totales
                  </p>
                  <p className="text-2xl font-black text-slate-900">$ {stats.totalSales?.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                    {filters.grouping === 'unidad' ? 'Total Unidades' : 'Total Pedidos'}
                  </p>
                  <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kiora-red" /> 
                    {filters.grouping === 'unidad' ? 'Precio Promedio' : 'Ticket Promedio'}
                  </p>
                  <p className="text-2xl font-black text-kiora-red">$ {stats.avgTicket?.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> 
                    Items / Periodos
                  </p>
                  <p className="text-2xl font-black text-slate-900">{data.length}</p>
                </div>
              </>
            ) : stats && (
              <>
                <div className="p-8 bg-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Unidades
                  </p>
                  <p className="text-2xl font-black text-slate-900">{stats.totalQty}</p>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Facturación
                  </p>
                  <p className="text-2xl font-black text-slate-900">$ {stats.totalRev?.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-8 bg-white col-span-1 sm:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kiora-red" /> Máximo Impacto
                  </p>
                  <p className="text-xl font-black text-kiora-red truncate">{stats.topProduct}</p>
                </div>
              </>
            )}
          </div>

          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  {filters.reportType === 'ventas_detalladas' ? (
                    <>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">
                        {filters.grouping === 'unidad' ? 'Producto / Pedido' : 'Periodo Temporal'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">
                        {filters.grouping === 'unidad' ? 'Subtotal' : 'Ventas Netas'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">
                        {filters.grouping === 'unidad' ? 'Unidades' : 'Volumen'}
                      </TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">
                        {filters.grouping === 'unidad' ? 'Precio Unit.' : 'Ticket'}
                      </TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14 w-20">Pos.</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">Producto</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">SKU</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14">Rotación</TableHead>
                      <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 h-14 text-right">Recaudación</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filters.reportType === 'ventas_detalladas' ? (
                  (data as DetailedSalesReport[]).map((row, idx) => (
                    <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-6 py-5 text-sm font-black text-slate-900 uppercase">{row.period}</TableCell>
                      <TableCell className="px-6 py-5 text-sm font-bold text-slate-600">$ {row.totalSales.toLocaleString('es-CO')}</TableCell>
                      <TableCell className="px-6 py-5 text-sm font-bold text-slate-600">{row.orderCount} {filters.grouping === 'unidad' ? 'uds' : 'ops'}</TableCell>
                      <TableCell className="px-6 py-5 text-sm font-black text-kiora-red">$ {row.averageTicket.toLocaleString('es-CO')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  (data as ProductRankingReport[]).map((row, idx) => (
                    <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-6 py-5">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-[10px] font-black ${idx < 3 ? 'bg-red-50 text-kiora-red shadow-sm ring-1 ring-red-100' : 'bg-slate-100 text-slate-400'}`}>
                          {row.position}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-sm font-bold text-slate-900">{row.productName}</TableCell>
                      <TableCell className="px-6 py-5 text-xs font-mono font-bold text-slate-400">#{row.productCode}</TableCell>
                      <TableCell className="px-6 py-5 text-sm font-black text-slate-600">{row.quantitySold} uds</TableCell>
                      <TableCell className="px-6 py-5 text-sm font-black text-slate-900 text-right">$ {row.totalRevenue.toLocaleString('es-CO')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-50">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nota de Auditoría</p>
          <p className="text-xs font-medium text-slate-500">Los datos presentados corresponden a transacciones liquidadas y conciliadas en el sistema hasta la fecha actual.</p>
        </div>
      </div>
    </div>
  );
};
