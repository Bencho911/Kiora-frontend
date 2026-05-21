import React, { useState } from 'react';
import type { CreateIncidentDto } from '@/models/Incident';

interface IncidentFormProps {
  onSave: (incident: CreateIncidentDto) => Promise<void>;
  isSaving: boolean;
  onCancel: () => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({ onSave, isSaving, onCancel }) => {
  const [form, setForm] = useState<Partial<CreateIncidentDto>>({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    categoria: 'tecnico'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form as CreateIncidentDto);
  };

  return (
    <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-5">
        <h3 className="headline-sm text-on-surface">Nuevo Reporte de Incidencia</h3>
        <button onClick={onCancel} className="label-sm text-on-surface-variant hover:text-primary transition-colors">Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="label-sm text-on-surface-variant">Título del Fallo</label>
          <input
            required
            type="text"
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ej: Impresora no funciona..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="label-sm text-on-surface-variant">Categoría</label>
          <select
            value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value as any })}
            className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            <option value="tecnico">Técnico / Hardware</option>
            <option value="software">Software / App</option>
            <option value="limpieza">Limpieza / Local</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="label-sm text-on-surface-variant">Descripción Detallada</label>
          <textarea
            required
            rows={4}
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Explica qué sucedió y cuándo..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 px-4 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="label-sm text-on-surface-variant">Prioridad del Ticket</label>
          <div className="flex gap-2">
            {(['baja', 'media', 'alta'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, prioridad: p })}
                className={`flex-1 py-2.5 rounded-lg label-sm transition-all border ${
                  form.prioridad === p
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary text-on-primary py-2.5 rounded-lg label-sm shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? 'Sincronizando...' : 'Enviar Reporte'}
          </button>
        </div>
      </form>
    </div>
  );
};
