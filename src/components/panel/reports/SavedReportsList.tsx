import React from 'react';

interface SavedReport {
  id: number;
  filters: any;
  date: string;
  name: string;
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
      <div className="col-span-full py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center text-center px-8 w-full">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
        </div>
        <h4 className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin Reportes Marcados</h4>
        <p className="text-slate-300 text-sm font-medium mt-2 max-w-xs">Genera un reporte y haz clic en el icono de marcador para guardarlo aquí y consultarlo después.</p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-kiora-red/5 group-hover:text-kiora-red transition-all duration-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <button 
              onClick={() => onDelete(report.id)} 
              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              title="Eliminar de guardados"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="space-y-1 mb-8">
            <h4 className="font-black text-slate-900 text-base leading-tight">{report.name}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizado: {report.date}</p>
          </div>
          
          <button 
            onClick={() => onLoad(report)}
            className="w-full py-4 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95"
          >
            Restaurar Filtros
          </button>
          
          {/* Subtle background decoration */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </section>
  );
};
