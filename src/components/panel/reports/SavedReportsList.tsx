import React from 'react';

interface SavedReport {
  id: number;
  filters: Record<string, unknown>;
  date: string;
  name: string;
  [key: string]: unknown;
}

interface SavedReportsListProps {
  reports: SavedReport[];
  onDelete: (id: number) => void;
  onLoad: (report: SavedReport) => void;
}

export const SavedReportsList: React.FC<SavedReportsListProps> = ({
  reports,
  onDelete,
  onLoad
}) => {
  if (reports.length === 0) {
    return (
      <div className="py-20 bg-surface rounded-xl border border-dashed border-outline-variant/50 flex flex-col items-center text-center px-8">
        <div className="w-16 h-16 bg-surface-container-high rounded-xl flex items-center justify-center mb-4 text-on-surface-variant/50">
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>bookmark</span>
        </div>
        <h4 className="label-md text-on-surface-variant">Sin Reportes Marcados</h4>
        <p className="body-md text-on-surface-variant mt-1 max-w-xs">Genera un reporte y haz clic en el icono de marcador para guardarlo.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
      {reports.map((report) => (
        <div key={report.id} className="bg-surface rounded-xl border border-outline-variant/30 p-5 hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center transition-all duration-300">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bar_chart</span>
            </div>
            <button
              onClick={() => onDelete(report.id)}
              className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error-container/30 rounded-lg transition-all"
              title="Eliminar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>

          <div className="space-y-1 mb-5">
            <h4 className="label-md text-on-surface">{report.name}</h4>
            <p className="label-sm text-on-surface-variant">Guardado: {report.date}</p>
          </div>

          <button
            onClick={() => onLoad(report)}
            className="w-full py-2.5 rounded-lg border border-outline-variant/50 label-sm text-on-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary transition-all active:scale-[0.98]"
          >
            Restaurar Filtros
          </button>
        </div>
      ))}
    </div>
  );
};
