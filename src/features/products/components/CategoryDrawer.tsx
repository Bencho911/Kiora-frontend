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
  return (
    <div className={`fixed inset-0 z-[99999] transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`absolute top-0 right-0 h-full w-100 max-w-[calc(100vw-1rem)] bg-[#fafafc] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-[15px] font-bold text-gray-800">{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <form onSubmit={onSubmit} id="categoryForm" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Nombre de la Categoría</label>
              <input 
                type="text" 
                required
                value={categoryData.nom_cat || ''}
                onChange={(e) => onDataChange({...categoryData, nom_cat: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300" 
                placeholder="Ej. Snacks" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Descripción (Opcional)</label>
              <textarea 
                value={categoryData.descrip_cat || ''}
                onChange={(e) => onDataChange({...categoryData, descrip_cat: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300 resize-none min-h-[100px]" 
                placeholder="Detalles sobre los productos de esta categoría..." 
              />
            </div>
          </form>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
          <button 
             form="categoryForm" 
             type="submit" 
             disabled={isSaving}
             className="w-full bg-[#ec131e] hover:bg-[#d01019] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(236,19,30,0.39)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Categoría'}</span>
              </>
            )}
          </button>
          <button 
             type="button" 
             disabled={isSaving}
             onClick={onClose} 
             className="w-full bg-white hover:bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl border border-gray-200 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
