import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { productService, alertService } from '@/config/setup';
import type { Category } from '@/models/Product';
import { CategoryDrawer } from './CategoryDrawer';

export function CategoriasSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getCategories();
      if (res && res.data) setCategories(res.data);
    } catch (error: any) {
      alertService.showError('Error', error.message || 'Error cargando categorías');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCurrentCategory({});
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setCurrentCategory(cat);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await alertService.showConfirm('¿Eliminar Categoría?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar');
    if (!confirmed) return;

    try {
      await productService.deleteCategory(id);
      alertService.showSuccess('Eliminado', 'Categoría eliminada exitosamente');
      loadCategories();
    } catch (error: any) {
      alertService.showError('Error', error.message || 'No se pudo eliminar la categoría');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing && currentCategory.cod_cat) {
        await productService.updateCategory(currentCategory.cod_cat, currentCategory);
        alertService.showSuccess('Actualizado', 'Categoría actualizada');
      } else {
        await productService.createCategory(currentCategory);
        alertService.showSuccess('Creado', 'Categoría creada');
      }
      setIsDrawerOpen(false);
      loadCategories();
    } catch (error: any) {
      alertService.showError('Error', error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const fuse = new Fuse(categories, {
      keys: ['nom_cat', 'descrip_cat'],
      threshold: 0.4,
    });
    return fuse.search(searchTerm.trim()).map(r => r.item);
  }, [categories, searchTerm]);

  return (
    <>
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between animate-in fade-in slide-in-from-top-4 duration-500 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827]">
            Categorías <span className="text-[#ec131e]">de Catálogo</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500 font-medium">Organiza y segmenta tus productos por grupos lógicos.</p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 group">
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#ec131e] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              className="block w-full pl-11 pr-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#ec131e]/5 focus:border-[#ec131e]/30 transition-all placeholder:text-slate-400 font-medium" 
              placeholder="Filtrar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenCreate} className="bg-[#ec131e] text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#ec131e]/20 hover:shadow-[#ec131e]/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            Nueva
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="w-10 h-10 border-4 border-red-100 border-t-[#ec131e] rounded-full animate-spin"></div></div>
        ) : filtered.length > 0 ? (
          filtered.map(cat => (
            <div key={cat.cod_cat} className="group bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:border-[#ec131e]/20 transition-all duration-500 relative flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 group-hover:bg-[#ec131e] group-hover:text-white rounded-3xl flex items-center justify-center mb-5 text-3xl transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:rotate-6">
                 🏷️
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight group-hover:text-[#ec131e] transition-colors">{cat.nom_cat}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-clamp-2 mb-6 h-8 leading-relaxed px-2">{cat.descrip_cat || 'Sin descripción'}</p>
              
              <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={() => handleOpenEdit(cat)} 
                  className="w-10 h-10 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                  title="Editar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button 
                  onClick={() => handleDelete(cat.cod_cat!)} 
                  className="w-10 h-10 flex items-center justify-center text-[#ec131e] bg-red-50 rounded-xl hover:bg-[#ec131e] hover:text-white transition-all shadow-sm active:scale-95"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay categorías registradas</p>
          </div>
        )}
      </div>

      <CategoryDrawer 
        isOpen={isDrawerOpen}
        isEditing={isEditing}
        isSaving={isSaving}
        categoryData={currentCategory}
        onDataChange={setCurrentCategory}
        onSubmit={handleSave}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
