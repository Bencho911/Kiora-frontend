import { useState, useEffect, useCallback } from 'react';
import { authService, alertService, incidentService } from '@/config/setup';
import type { Incident, CreateIncidentDto } from '@/models/Incident';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { IncidentForm } from './maintenance/IncidentForm';
import { IncidentList } from './maintenance/IncidentList';

export function MaintenanceSection() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const user = authService.getUser();
  const isAdmin = authService.isAdmin();

  const loadIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await incidentService.getAll();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Error loading incidents:', e);
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadIncidents(); }, [loadIncidents]);

  const handleSaveIncident = async (dto: CreateIncidentDto) => {
    if (!user?.id_usu) return alertService.showToast('error', 'Sesión inválida');
    
    setIsSaving(true);
    try {
      await incidentService.create({
        ...dto,
        fk_id_usu: Number(user.id_usu)
      });
      alertService.showToast('success', 'Reporte enviado correctamente');
      setShowForm(false);
      void loadIncidents();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al enviar reporte'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: number, status: Incident['estado']) => {
    try {
      await incidentService.updateStatus(id, status);
      alertService.showToast('success', 'Estado actualizado');
      void loadIncidents();
    } catch (e) {
      alertService.showToast('error', 'No se pudo actualizar el estado');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <div className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Módulo de Infraestructura</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Mantenimiento <span className="text-kiora-red">&</span> Soporte</h2>
          <p className="text-sm text-slate-500 font-medium max-w-md">Reporta incidencias técnicas o solicita asistencia para el mantenimiento del establecimiento.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="rounded-[1.5rem] bg-kiora-red px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-kiora-red/30 transition-all hover:bg-kiora-red-hover hover:-translate-y-1 active:scale-95 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Nuevo Ticket
          </button>
        )}
      </header>

      {showForm && (
        <IncidentForm 
          onSave={handleSaveIncident}
          isSaving={isSaving}
          onCancel={() => setShowForm(false)}
        />
      )}

      <IncidentList 
        incidents={incidents}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onUpdateStatus={updateStatus}
      />
    </div>
  );
}
