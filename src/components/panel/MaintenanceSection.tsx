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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20 px-4 sm:px-0">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ec131e] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ec131e] bg-red-50 px-3 py-1 rounded-lg">Módulo de Infraestructura</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Mantenimiento <span className="text-kiora-red">&</span> Soporte</h2>
          <p className="mt-1 text-slate-500 font-medium max-w-xl">Central de reportes técnicos y asistencia operativa para la plataforma.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[#ec131e] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#ec131e]/20 hover:shadow-[#ec131e]/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
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
