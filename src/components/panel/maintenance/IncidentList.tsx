import React, { useState } from 'react';
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const priorityColor = (p: string) => {
    switch(p) {
      case 'alta': return 'text-red-600 bg-red-50 ring-red-100';
      case 'media': return 'text-amber-600 bg-amber-50 ring-amber-100';
      case 'baja': return 'text-emerald-600 bg-emerald-50 ring-emerald-100';
      default: return 'text-slate-600 bg-slate-50 ring-slate-100';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Historial de Incidencias</h3>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 border border-slate-200">
            {incidents.length} Registros
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-kiora-red rounded-full animate-spin"></div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay incidencias reportadas actualmente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-24">
          {incidents.map(incident => (
            <div key={incident.id_rep} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:border-[#ec131e]/20 transition-all duration-500 overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ring-1 ${priorityColor(incident.prioridad)}`}>
                        {incident.prioridad}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        #{incident.id_rep} • {formatDate(incident.fecha_rep)}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-lg sm:text-xl group-hover:text-kiora-red transition-colors leading-tight">
                      {incident.titulo || 'Sin título'}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider inline-block ${
                      incident.estado === 'pendiente' ? 'bg-amber-50 text-amber-500' : 
                      incident.estado === 'en_proceso' ? 'bg-blue-50 text-blue-500' : 
                      'bg-emerald-50 text-emerald-500'
                    }`}>
                      {(incident.estado || '').replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                  {incident.descripcion}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                      US
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Usuario #{incident.fk_id_usu}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === incident.id_rep ? null : incident.id_rep!)}
                      className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      {expandedId === incident.id_rep ? 'Cerrar' : 'Detalles'}
                    </button>

                    {isAdmin && incident.estado !== 'cerrado' && incident.estado !== 'resuelto' && (
                      <div className="flex gap-2">
                        {incident.estado === 'pendiente' && (
                          <button
                            onClick={() => onUpdateStatus(incident.id_rep!, 'en_proceso')}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Atender"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          </button>
                        )}
                        <button
                          onClick={() => onUpdateStatus(incident.id_rep!, 'resuelto')}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Resolver"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expandedId === incident.id_rep && (
                  <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-50 rounded-[2rem] p-6 space-y-6">
                      {incident.observaciones_tecnicas && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observaciones Técnicas</p>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{incident.observaciones_tecnicas}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producto</p>
                          <p className="text-xs font-bold text-slate-700">#{incident.cod_prod || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridad</p>
                          <p className="text-xs font-black uppercase text-slate-700">{incident.prioridad}</p>
                        </div>
                      </div>
                    </div>
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
