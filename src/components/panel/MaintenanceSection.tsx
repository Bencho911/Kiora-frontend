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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">
            Mantenimiento <span className="text-primary">&</span> Soporte
          </h2>
          <p className="body-md text-on-surface-variant max-w-xl">Central de reportes técnicos y asistencia operativa.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-on-primary label-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nuevo Ticket
          </button>
        )}
      </div>

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
