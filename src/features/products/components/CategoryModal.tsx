import React, { useState, useEffect, useCallback } from 'react';
import { productService, alertService } from '@/config/setup';
import type { Category } from '@/models/Product';
import { getErrorMessage } from '@/utils/getErrorMessage';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryModal({ isOpen, onClose, onSuccess }: CategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [nomCat, setNomCat] = useState('');
  const [descCat, setDescCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getCategories();
      setCategories(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) {
      alertService.showToast('error', 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setView('list');
      setEditingCat(null);
      setNomCat('');
      setDescCat('');
    }
  }, [isOpen, loadCategories]);

  const handleEditClick = (cat: Category) => {
    setEditingCat(cat);
    setNomCat(cat.nom_cat);
    setDescCat(cat.descrip_cat || '');
    setView('form');
  };

  const handleCreateClick = () => {
    setEditingCat(null);
    setNomCat('');
    setDescCat('');
    setView('form');
  };

  const handleDelete = async (id: number) => {
    const ok = await alertService.showConfirm(
      '¿Eliminar Categoría?',
      'Esta acción no se puede deshacer. Los productos asociados no se eliminarán pero perderán esta etiqueta.',
      'Eliminar',
      'Cancelar'
    );
    if (!ok) return;

    try {
      await productService.deleteCategory(id);
      alertService.showToast('success', 'Categoría eliminada');
      loadCategories();
      onSuccess();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al eliminar'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomCat.trim()) return alertService.showToast('warning', 'El nombre es obligatorio');

    setIsSaving(true);
    try {
      if (editingCat) {
        await productService.updateCategory(editingCat.cod_cat!, { nom_cat: nomCat, descrip_cat: descCat });
        alertService.showToast('success', 'Categoría actualizada');
      } else {
        await productService.createCategory({ nom_cat: nomCat, descrip_cat: descCat });
        alertService.showToast('success', 'Categoría creada');
      }
      setView('list');
      loadCategories();
      onSuccess();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al guardar'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {view === 'list' ? 'Categorías' : (editingCat ? 'Editar Categoría' : 'Nueva Categoría')}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestión de Catálogo</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl shadow-sm transition-all">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {view === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Existentes ({categories.length})</span>
                <button 
                  onClick={handleCreateClick}
                  className="text-xs font-black text-[#ec131e] hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                  Añadir Nueva
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-[#ec131e]" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">No hay categorías registradas</div>
                ) : (
                  categories.map(c => (
                    <div key={c.cod_cat} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-[#ec131e]/20 hover:bg-white transition-all shadow-sm">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate capitalize">{c.nom_cat}</h4>
                        <p className="text-[10px] text-slate-400 truncate pr-4">{c.descrip_cat || 'Sin descripción'}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(c)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(c.cod_cat!)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre de Categoría *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nomCat}
                  onChange={(e) => setNomCat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold focus:border-[#ec131e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all"
                  placeholder="Ej: Snacks, Bebidas..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción (Opcional)</label>
                <textarea
                  rows={3}
                  value={descCat}
                  onChange={(e) => setDescCat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold focus:border-[#ec131e] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ec131e]/5 transition-all resize-none"
                  placeholder="Describe qué productos pertenecen a esta categoría..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex-1 rounded-2xl border border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-2xl bg-[#ec131e] py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-[#ec131e]/20 hover:bg-[#d01019] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : (editingCat ? 'Guardar Cambios' : 'Crear')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
