import React, { useMemo } from 'react';
import type { ReportFilters, DetailedSalesReport, ProductRankingReport } from '@/services/ReportService';

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
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h4 className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin Datos Generados</h4>
        <p className="text-slate-300 text-sm font-medium mt-2 max-w-xs">Selecciona los filtros y haz clic en "Generar Reporte" para visualizar los resultados.</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Análisis de Resultados</h3>
          <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Visualización en tiempo real de métricas críticas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onSave} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm border border-blue-100/50" title="Marcar/Guardar Reporte">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>
          <button onClick={onExportExcel} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100/50" title="Exportar Excel">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
          <button onClick={onExportPdf} className="p-3 bg-red-50 text-kiora-red rounded-xl hover:bg-red-100 transition-colors shadow-sm border border-red-100/50" title="Exportar PDF">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-8 bg-white border-b border-slate-50">
        {filters.reportType === 'ventas_detalladas' && stats ? (
          <>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingresos Totales</p>
              <p className="text-2xl font-black text-slate-900">$ {stats.totalSales?.toLocaleString('es-CO')}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {filters.grouping === 'unidad' ? 'Total Unidades' : 'Total Pedidos'}
              </p>
              <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {filters.grouping === 'unidad' ? 'Precio Promedio' : 'Ticket Promedio'}
              </p>
              <p className="text-2xl font-black text-kiora-red">$ {stats.avgTicket?.toLocaleString('es-CO')}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {filters.grouping === 'unidad' ? 'Items Vendidos' : 'Periodos Analizados'}
              </p>
              <p className="text-2xl font-black text-slate-900">{data.length}</p>
            </div>
          </>
        ) : stats && (
          <>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidades Movilizadas</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalQty}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturación Ranking</p>
              <p className="text-2xl font-black text-slate-900">$ {stats.totalRev?.toLocaleString('es-CO')}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50 col-span-1 sm:col-span-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Individual Máximo</p>
              <p className="text-xl font-black text-kiora-red truncate">{stats.topProduct}</p>
            </div>
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
            {filters.reportType === 'ventas_detalladas' ? (
              <tr>
                <th className="px-8 py-5">{filters.grouping === 'unidad' ? 'Producto / Pedido' : 'Periodo Temporal'}</th>
                <th className="px-8 py-5">{filters.grouping === 'unidad' ? 'Subtotal' : 'Ventas Netas'}</th>
                <th className="px-8 py-5">{filters.grouping === 'unidad' ? 'Unidades' : 'Volumen de Pedidos'}</th>
                <th className="px-8 py-5">{filters.grouping === 'unidad' ? 'Precio Unitario' : 'Ticket de Venta'}</th>
              </tr>
            ) : (
              <tr>
                <th className="px-8 py-5">Pos.</th>
                <th className="px-8 py-5">Identificación de Producto</th>
                <th className="px-8 py-5">Código SKU</th>
                <th className="px-8 py-5">Rotación</th>
                <th className="px-8 py-5 text-right">Recaudación</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filters.reportType === 'ventas_detalladas' ? (
              (data as DetailedSalesReport[]).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase">{row.period}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">$ {row.totalSales.toLocaleString('es-CO')}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{row.orderCount} {filters.grouping === 'unidad' ? 'uds' : 'ops'}</td>
                  <td className="px-8 py-5 text-sm font-black text-kiora-red">$ {row.averageTicket.toLocaleString('es-CO')}</td>
                </tr>
              ))
            ) : (
              (data as ProductRankingReport[]).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-xl text-[10px] font-black ${idx < 3 ? 'bg-red-50 text-kiora-red shadow-sm ring-1 ring-red-100' : 'bg-slate-100 text-slate-400'}`}>
                      {row.position}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900">{row.productName}</td>
                  <td className="px-8 py-5 text-xs font-mono font-bold text-slate-400">#{row.productCode}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-600">{row.quantitySold} uds</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">$ {row.totalRevenue.toLocaleString('es-CO')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
