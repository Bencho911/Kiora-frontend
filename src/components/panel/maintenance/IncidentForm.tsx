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
    <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-800">Nuevo Reporte de Incidencia</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">Cancelar</button>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título del Fallo</label>
          <input
            required
            type="text"
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ej: Impresora no funciona..."
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 px-5 text-sm font-bold focus:border-kiora-red focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
          <select
            value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value as any })}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 px-5 text-sm font-bold focus:border-kiora-red focus:bg-white focus:outline-none transition-all"
          >
            <option value="tecnico">Técnico / Hardware</option>
            <option value="software">Software / App</option>
            <option value="limpieza">Limpieza / Local</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción Detallada</label>
          <textarea
            required
            rows={4}
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Explica qué sucedió y cuándo..."
            className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 px-5 text-sm font-bold focus:border-kiora-red focus:bg-white focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prioridad del Ticket</label>
          <div className="flex gap-2">
            {(['baja', 'media', 'alta'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, prioridad: p })}
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${form.prioridad === p ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
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
            className="w-full rounded-2xl bg-kiora-red text-white py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-kiora-red-hover transition-all shadow-xl shadow-kiora-red/20 disabled:opacity-50"
          >
            {isSaving ? 'Sincronizando...' : 'Enviar Reporte'}
          </button>
        </div>
      </form>
    </div>
  );
};
