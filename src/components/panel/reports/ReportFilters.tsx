import React, { useMemo } from 'react';
import type { ReportFilters as Filters } from '@/services/ReportService';
import type { Category } from '@/models/Product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ReportFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  categories: Category[];
  onGenerate: () => void;
  isLoading: boolean;
  dateError?: string | null;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  setFilters,
  categories,
  onGenerate,
  isLoading,
  dateError
}) => {
  const isDateInvalid = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return false;
    return filters.startDate > filters.endDate;
  }, [filters.startDate, filters.endDate]);
  return (
    <section className="bg-surface rounded-xl border border-outline-variant/30 p-5">
      <div className="flex flex-col xl:flex-row gap-5 xl:items-end">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Range */}
          <div className="space-y-2">
            <Label className="label-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
              Rango de Fechas
            </Label>
            <div className="flex flex-col sm:flex-row items-center gap-2 report-date-range">
              <Input
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                className={`bg-surface-container-low rounded-lg label-md text-on-surface ${
                  isDateInvalid ? 'border-error ring-2 ring-error/20' : 'border-outline-variant/50'
                }`}
              />
              <span className={`label-sm px-1 ${isDateInvalid ? 'text-error' : 'text-on-surface-variant/40'}`}>→</span>
              <Input
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                className={`bg-surface-container-low rounded-lg label-md text-on-surface ${
                  isDateInvalid ? 'border-error ring-2 ring-error/20' : 'border-outline-variant/50'
                }`}
              />
            </div>
            {isDateInvalid && (
              <p className="label-sm text-error flex items-center gap-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                La fecha de inicio no puede ser posterior a la fecha fin
              </p>
            )}
            {dateError && !isDateInvalid && (
              <p className="label-sm text-secondary-container flex items-center gap-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                {dateError}
              </p>
            )}
          </div>

          {/* Type + Grouping */}
          <div className="space-y-2">
            <Label className="label-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>layers</span>
              Tipo y Agrupación
            </Label>
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.reportType}
                onValueChange={val => setFilters({ ...filters, reportType: val as any })}
              >
                <SelectTrigger className="flex-1 bg-surface-container-low border-outline-variant/50 rounded-lg font-medium text-on-surface">
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
                  onValueChange={val => setFilters({ ...filters, grouping: val as any })}
                >
                  <SelectTrigger className="w-28 bg-surface-container-low border-outline-variant/50 rounded-lg font-medium text-on-surface">
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

          {/* Parameters */}
          <div className="space-y-2">
            <Label className="label-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sell</span>
              Parámetros
            </Label>
            <div className="flex flex-wrap gap-2">
              {(filters.reportType === 'mas_vendidos' || filters.reportType === 'menos_vendidos') && (
                <div className="flex-1 flex items-center bg-surface-container-low rounded-lg px-3 border border-outline-variant/50">
                  <span className="label-sm text-on-surface-variant mr-1">TOP</span>
                  <Input
                    type="number"
                    value={filters.topN}
                    onChange={e => setFilters({ ...filters, topN: Number(e.target.value) })}
                    className="bg-transparent border-none p-0 font-semibold text-on-surface focus-visible:ring-0 shadow-none h-9"
                  />
                </div>
              )}
              <Select
                value={filters.category?.toString() || "all"}
                onValueChange={val => setFilters({ ...filters, category: val === "all" ? undefined : Number(val) })}
              >
                <SelectTrigger className="flex-1 bg-surface-container-low border-outline-variant/50 rounded-lg font-medium text-on-surface">
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

        {/* Generate Button */}
        <div className="shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
          <button
            onClick={onGenerate}
            disabled={isLoading || isDateInvalid}
            className="w-full xl:w-auto bg-primary text-on-primary label-sm px-6 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bar_chart</span>
            )}
            Generar Reporte
          </button>
        </div>
      </div>
    </section>
  );
};
