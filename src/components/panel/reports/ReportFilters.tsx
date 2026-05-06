import React from 'react';
import type { ReportFilters as Filters } from '@/services/ReportService';
import type { Category } from '@/models/Product';

interface ReportFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  categories: Category[];
  onGenerate: () => void;
  isLoading: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  setFilters,
  categories,
  onGenerate,
  isLoading
}) => {
  return (
    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Range */}
        <div className="space-y-3 relative z-30">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Rango de Fechas</label>
          <div className="flex flex-col sm:flex-row items-center gap-3 report-date-range">
            <input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-100 transition-all"
            />
            <span className="text-slate-300 font-bold px-1">→</span>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        </div>

        {/* Grouping / Type */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Reporte y Agrupación</label>
          <div className="flex gap-3">
            <select 
              value={filters.reportType}
              onChange={e => setFilters({...filters, reportType: e.target.value as any})}
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
            >
              <option value="ventas_detalladas">Ventas Detalladas</option>
              <option value="mas_vendidos">Más Vendidos</option>
              <option value="menos_vendidos">Menos Vendidos</option>
            </select>
            {filters.reportType === 'ventas_detalladas' && (
              <select 
                value={filters.grouping}
                onChange={e => setFilters({...filters, grouping: e.target.value as any})}
                className="w-32 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
              >
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
                <option value="unidad">Unidad</option>
              </select>
            )}
          </div>
        </div>

        {/* Additional Params */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Parámetros Adicionales</label>
          <div className="flex gap-3">
            {(filters.reportType === 'mas_vendidos' || filters.reportType === 'menos_vendidos') && (
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-[10px] font-black text-slate-400 uppercase mr-2">TOP</span>
                <input 
                  type="number" 
                  value={filters.topN}
                  onChange={e => setFilters({...filters, topN: Number(e.target.value)})}
                  className="w-full bg-transparent border-none p-0 text-sm font-black text-kiora-red focus:ring-0"
                />
              </div>
            )}
            <select 
              value={filters.category || ''}
              onChange={e => setFilters({...filters, category: e.target.value ? Number(e.target.value) : undefined})}
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
            >
              <option value="">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c.cod_cat} value={c.cod_cat}>{c.nom_cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end gap-4 border-t border-slate-50 pt-8">
        <button 
          onClick={onGenerate}
          disabled={isLoading}
          className="bg-kiora-red text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-kiora-red/20 hover:bg-kiora-red-hover hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 disabled:translate-y-0"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          )}
          Generar Reporte
        </button>
      </div>
    </section>
  );
};
