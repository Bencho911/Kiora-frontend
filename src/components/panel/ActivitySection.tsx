import React, { useState, useEffect, useCallback } from 'react';
import { authService, API_URL } from '@/config/setup';

interface Activity {
  id: number;
  user_email: string;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'hace unos segundos';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function actionLabel(action: string): { label: string; color: string } {
  switch (action) {
    case 'created': return { label: 'Creación', color: 'bg-tertiary/10 text-tertiary' };
    case 'updated': return { label: 'Modificación', color: 'bg-surface-container-high text-on-surface-variant' };
    case 'deleted': return { label: 'Eliminación', color: 'bg-error-container/30 text-error' };
    case 'blocked': return { label: 'Bloqueo', color: 'bg-error-container/30 text-error' };
    case 'login': return { label: 'Acceso', color: 'bg-primary-fixed/30 text-primary-container' };
    case 'completed': return { label: 'Completada', color: 'bg-tertiary/10 text-tertiary' };
    default: return { label: action, color: 'bg-surface-container-high text-on-surface-variant' };
  }
}

function entityIcon(type: string): string {
  switch (type) {
    case 'product': return 'inventory_2';
    case 'order': return 'receipt_long';
    case 'user': return 'person';
    case 'movement': return 'warehouse';
    default: return 'circle';
  }
}

export function ActivitySection() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/activity-logs?page=${p}&limit=30`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Error al cargar historial');
      const data = await res.json();
      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Error al cargar');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLogs(page); }, [page, fetchLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="headline-lg text-on-surface mb-1">Historial de Actividad</h2>
        <p className="body-md text-on-surface-variant">Registro cronológico de acciones en el sistema.</p>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '20px' }}>warning</span>
          <p className="label-sm text-error">{error}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-1">
        {isLoading && logs.length === 0 ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center bg-surface rounded-xl border border-dashed border-outline-variant/50">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">history</span>
            <p className="label-md text-on-surface-variant">Sin actividad registrada aún</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-outline-variant/50" />

            {logs.map((log) => {
              const action = actionLabel(log.action);
              return (
                <div key={log.id} className="relative flex gap-4 py-2.5 pl-0">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${action.color}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{entityIcon(log.entity_type)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-surface rounded-xl border border-outline-variant/30 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="label-md text-on-surface">
                          <span className="font-semibold">{log.user_name || log.user_email}</span>
                        </p>
                        <p className="label-sm text-on-surface-variant mt-0.5">
                          {log.details || `${action.label} de ${log.entity_type}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`label-sm px-2 py-0.5 rounded-md ${action.color}`}>{action.label}</span>
                        <span className="label-sm text-on-surface-variant/60">{timeAgo(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="label-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="label-sm text-on-surface-variant">Página {page} de {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="label-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
