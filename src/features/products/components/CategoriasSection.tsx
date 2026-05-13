import React, { useState, useEffect } from 'react';
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

  const filtered = categories.filter(c => c.nom_cat.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            Categorías <span className="text-[#ec131e]">de Catálogo</span>
          </h1>
          <p className="mt-2 text-slate-500 font-medium">Organiza tus productos por grupos.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
             <input 
              type="text" 
              className="block w-full p-3 pl-10 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-[#ec131e] focus:border-[#ec131e]" 
              placeholder="Buscar categorías..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenCreate} className="bg-[#ec131e] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#d01019] transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            Nueva
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="w-10 h-10 border-4 border-red-100 border-t-[#ec131e] rounded-full animate-spin"></div></div>
        ) : filtered.length > 0 ? (
          filtered.map(cat => (
            <div key={cat.cod_cat} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="w-12 h-12 bg-red-50 text-[#ec131e] rounded-xl flex items-center justify-center mb-4 text-xl">
                 {/* Emoji or icon based on name or default */}
                 🏷️
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{cat.nom_cat}</h3>
              <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4">{cat.descrip_cat || 'Sin descripción'}</p>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(cat)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                <button onClick={() => handleDelete(cat.cod_cat)} className="text-[#ec131e] bg-red-50 p-2 rounded-lg hover:bg-red-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400">No hay categorías registradas.</div>
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
