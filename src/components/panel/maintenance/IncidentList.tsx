import React from 'react';
import type { Incident } from '@/models/Incident';
import { formatDate } from '@/utils/dateUtils';

interface IncidentListProps {
  incidents: Incident[];
  isLoading: boolean;
  isAdmin: boolean;
  onUpdateStatus: (id: number, status: Incident['estado']) => Promise<void>;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  isLoading,
  isAdmin,
  onUpdateStatus
}) => {
  const priorityColor = (p: string) => {
    switch(p) {
      case 'alta': return 'text-red-600 bg-red-50 ring-red-100';
      case 'media': return 'text-amber-600 bg-amber-50 ring-amber-100';
      case 'baja': return 'text-emerald-600 bg-emerald-50 ring-emerald-100';
      default: return 'text-slate-600 bg-slate-50 ring-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Historial de Incidencias</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{incidents.length} Registros</span>
      </div>
      
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-kiora-red rounded-full animate-spin"></div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-sm font-bold text-slate-400 italic">No hay incidencias reportadas actualmente.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {incidents.map(incident => (
            <div key={incident.id} className="p-8 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-8 group">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ring-1 ${priorityColor(incident.prioridad)}`}>
                    {incident.prioridad}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {incident.categoria} • {formatDate(incident.creado_en)}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-lg group-hover:text-kiora-red transition-colors">{incident.titulo}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">{incident.descripcion}</p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado actual</p>
                   <p className={`text-xs font-black uppercase tracking-wider ${incident.estado === 'abierto' ? 'text-amber-500' : incident.estado === 'en_progreso' ? 'text-blue-500' : 'text-emerald-500'}`}>
                      {(incident.estado || '').replace('_', ' ')}
                   </p>
                </div>
                
                {isAdmin && incident.estado !== 'cerrado' && (
                  <div className="flex gap-2">
                    {incident.estado === 'abierto' && (
                      <button 
                        onClick={() => onUpdateStatus(incident.id!, 'en_progreso')}
                        className="px-5 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                      >
                        Atender
                      </button>
                    )}
                    <button 
                      onClick={() => onUpdateStatus(incident.id!, 'cerrado')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
