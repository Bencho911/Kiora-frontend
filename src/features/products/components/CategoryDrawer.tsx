import React from 'react';
import type { Category } from '@/models/Product';

interface CategoryDrawerProps {
  isOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  categoryData: Partial<Category>;
  onDataChange: (data: Partial<Category>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  isOpen,
  isEditing,
  isSaving,
  categoryData,
  onDataChange,
  onSubmit,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-md bg-surface-bright shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-outline-variant/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 bg-surface">
          <button onClick={onClose} className="p-1.5 -ml-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          </button>
          <h2 className="label-md text-on-surface">{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <form onSubmit={onSubmit} id="categoryForm" className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Nombre de la Categoría</label>
              <input
                type="text"
                required
                value={categoryData.nom_cat || ''}
                onChange={(e) => onDataChange({ ...categoryData, nom_cat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="Ej. Snacks"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Descripción (Opcional)</label>
              <textarea
                value={categoryData.descrip_cat || ''}
                onChange={(e) => onDataChange({ ...categoryData, descrip_cat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all resize-none min-h-[100px]"
                placeholder="Detalles sobre los productos de esta categoría..."
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-surface border-t border-outline-variant/30 flex flex-col gap-2">
          <button
            form="categoryForm"
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Categoría'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors rounded-xl hover:bg-surface-container-low"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
