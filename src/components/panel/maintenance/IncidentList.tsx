import React, { useState } from 'react';
import type { Incident } from '@/models/Incident';
import { formatDate } from '@/utils/dateUtils';

interface IncidentListProps {
  incidents: Incident[];
  isLoading: boolean;
  isAdmin: boolean;
  onUpdateStatus: (id: number, status: Incident['estado']) => Promise<void>;
  onDeleteIncident: (id: number) => Promise<void>;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  isLoading,
  isAdmin,
  onUpdateStatus,
  onDeleteIncident
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const priorityStyle = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'alta': return 'bg-red-500 text-white border-transparent font-medium shadow-sm';
      case 'media': return 'bg-amber-500 text-white border-transparent font-medium shadow-sm';
      case 'baja': return 'bg-emerald-500 text-white border-transparent font-medium shadow-sm';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant/50';
    }
  };

  const statusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'pendiente': return 'bg-amber-500/20 text-amber-700 border border-amber-500/30';
      case 'en_proceso': return 'bg-blue-500/20 text-blue-700 border border-blue-500/30';
      case 'resuelto': return 'bg-emerald-500 text-white font-medium shadow-sm border border-transparent';
      case 'cerrado': return 'bg-gray-500 text-white font-medium shadow-sm border border-transparent';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant/50';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-5">
        <h3 className="label-md text-on-surface-variant font-semibold">Historial de Incidencias</h3>
        <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-label-sm text-on-surface-variant border border-outline-variant/30">
          {incidents.length} Registros
        </span>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center bg-surface rounded-xl border border-dashed border-outline-variant/50">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">check_circle</span>
          <p className="label-md text-on-surface-variant">No hay incidencias reportadas actualmente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-24">
          {incidents.map(incident => (
            <div key={incident.id_rep} className="bg-surface rounded-xl border border-outline-variant/30 hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col h-full">
              <div className="p-5 flex flex-col flex-grow gap-4">
                {/* Top row: priority/id + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className={`label-sm px-2 py-0.5 rounded-md border shrink-0 ${priorityStyle(incident.prioridad)}`}>
                      {incident.prioridad}
                    </span>
                    <span className="label-sm text-on-surface-variant truncate">
                      #{incident.id_rep} • {formatDate(incident.fecha_rep)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-md label-sm ${statusStyle(incident.estado || 'pendiente')}`}>
                      {(incident.estado || '').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Title full-width */}
                <h4 className="label-md text-on-surface leading-tight break-words">
                  {incident.titulo || 'Sin título'}
                </h4>

                <p className="body-md text-on-surface-variant leading-relaxed break-words whitespace-pre-wrap">
                  {incident.descripcion}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-semibold text-on-surface-variant">
                      US
                    </div>
                    <p className="label-sm text-on-surface-variant">Usuario #{incident.fk_id_usu}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === incident.id_rep ? null : incident.id_rep!)}
                      className="px-4 py-2 rounded-lg border border-outline-variant/50 label-sm text-on-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary transition-all active:scale-[0.98]"
                    >
                      {expandedId === incident.id_rep ? 'Cerrar' : 'Detalles'}
                    </button>

                    <button
                      onClick={() => onDeleteIncident(incident.id_rep!)}
                      className="p-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-on-error transition-all"
                      title="Eliminar incidencia"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>

                    {isAdmin && incident.estado !== 'cerrado' && incident.estado !== 'resuelto' && (
                      <div className="flex gap-1">
                        {incident.estado === 'pendiente' && (
                          <button
                            onClick={() => onUpdateStatus(incident.id_rep!, 'en_proceso')}
                            className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all"
                            title="Atender"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
                          </button>
                        )}
                        <button
                          onClick={() => onUpdateStatus(incident.id_rep!, 'resuelto')}
                          className="p-2 rounded-lg bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-on-tertiary transition-all"
                          title="Resolver"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expandedId === incident.id_rep && (
                  <div className="animate-in fade-in duration-300">
                    <div className="bg-surface-container rounded-lg p-4 space-y-4">
                      {incident.observaciones_tecnicas && (
                        <div>
                          <p className="label-sm text-on-surface-variant mb-1">Observaciones Técnicas</p>
                          <p className="body-md text-on-surface-variant leading-relaxed">{incident.observaciones_tecnicas}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="label-sm text-on-surface-variant mb-0.5">Producto</p>
                          <p className="label-md text-on-surface">#{incident.cod_prod || '—'}</p>
                        </div>
                        <div>
                          <p className="label-sm text-on-surface-variant mb-0.5">Prioridad</p>
                          <p className="label-md text-on-surface uppercase">{incident.prioridad}</p>
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
