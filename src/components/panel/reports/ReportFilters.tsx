import React from 'react';
import type { ReportFilters as Filters } from '@/services/ReportService';
import type { Category } from '@/models/Product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BarChart3, Calendar, Tag, Layers } from 'lucide-react';

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
          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Rango de Fechas
          </Label>
          <div className="flex flex-col sm:flex-row items-center gap-3 report-date-range">
            <Input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700"
            />
            <span className="text-slate-300 font-bold px-1">→</span>
            <Input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700"
            />
          </div>
        </div>

        {/* Grouping / Type */}
        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Tipo y Agrupación
          </Label>
          <div className="flex gap-3">
            <Select 
              value={filters.reportType}
              onValueChange={val => setFilters({...filters, reportType: val as any})}
            >
              <SelectTrigger className="flex-1 bg-slate-50 border-none rounded-xl font-bold text-slate-700">
                <SelectValue placeholder="Tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ventas_detalladas">Ventas Detalladas</SelectItem>
                <SelectItem value="mas_vendidos">Más Vendidos</SelectItem>
                <SelectItem value="menos_vendidos">Menos Vendidos</SelectItem>
              </SelectContent>
            </Select>

            {filters.reportType === 'ventas_detalladas' && (
              <Select 
                value={filters.grouping}
                onValueChange={val => setFilters({...filters, grouping: val as any})}
              >
                <SelectTrigger className="w-32 bg-slate-50 border-none rounded-xl font-bold text-slate-700">
                  <SelectValue placeholder="Agrupar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Día</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                  <SelectItem value="unidad">Unidad</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Additional Params */}
        <div className="space-y-3">
          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
            <Tag className="w-3 h-3" /> Parámetros
          </Label>
          <div className="flex gap-3">
            {(filters.reportType === 'mas_vendidos' || filters.reportType === 'menos_vendidos') && (
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-1 border border-transparent focus-within:border-slate-200 transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase mr-2">TOP</span>
                <Input 
                  type="number" 
                  value={filters.topN}
                  onChange={e => setFilters({...filters, topN: Number(e.target.value)})}
                  className="bg-transparent border-none p-0 font-black text-kiora-red focus-visible:ring-0 shadow-none"
                />
              </div>
            )}
            <Select 
              value={filters.category?.toString() || "all"}
              onValueChange={val => setFilters({...filters, category: val === "all" ? undefined : Number(val)})}
            >
              <SelectTrigger className="flex-1 bg-slate-50 border-none rounded-xl font-bold text-slate-700">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Categorías</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.cod_cat} value={c.cod_cat.toString()}>{c.nom_cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end gap-4 border-t border-slate-50 pt-8">
        <Button 
          onClick={onGenerate}
          disabled={isLoading}
          className="bg-kiora-red text-white px-8 py-7 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-kiora-red/20 hover:bg-kiora-red-hover hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 disabled:translate-y-0 h-auto"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <BarChart3 className="w-5 h-5" />
          )}
          Generar Reporte
        </Button>
      </div>
    </section>
  );
};
