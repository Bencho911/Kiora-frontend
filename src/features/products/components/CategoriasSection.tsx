import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { productService, alertService } from '@/config/setup';
import type { Category } from '@/models/Product';
import { CategoryDrawer } from './CategoryDrawer';
import { useDebounce } from '@/hooks/useDebounce';

export function CategoriasSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

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
    const q = debouncedSearch.trim();
    if (!q) return categories;
    const fuse = new Fuse(categories, {
      keys: ['nom_cat', 'descrip_cat'],
      threshold: 0.4,
    });
    return fuse.search(q).map(r => r.item);
  }, [categories, debouncedSearch]);

  const categoryIcons = [
    'category', 'inventory_2', 'local_pizza', 'coffee', 'liquor',
    'bakery_dining', 'kitchen', 'set_meal', 'icecream', 'fastfood',
    'dinner_dining', 'ramen_dining', 'egg', 'nutrition', 'watering_farm',
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">
            Categorías <span className="text-primary">de Catálogo</span>
          </h2>
          <p className="body-md text-on-surface-variant">Organiza y segmenta tus productos por grupos.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar..."
              className="w-full pl-9 pr-3 py-2.5 bg-surface border border-outline-variant/50 rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <button onClick={handleOpenCreate} className="bg-primary text-on-primary label-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nueva
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-24">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((cat, idx) => {
            const iconIdx = (cat.cod_cat || idx) % categoryIcons.length;
            return (
              <div
                key={cat.cod_cat}
                className="group bg-surface rounded-xl border border-outline-variant/30 p-5 flex flex-col items-center text-center hover:shadow-md hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center mb-4 transition-all duration-300">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{categoryIcons[iconIdx]}</span>
                </div>
                <h3 className="label-md text-on-surface mb-1 leading-tight">{cat.nom_cat}</h3>
                <p className="label-sm text-on-surface-variant mb-4 leading-tight break-words">{cat.descrip_cat || 'Sin descripción'}</p>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="w-9 h-9 flex items-center justify-center text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(cat.cod_cat!)}
                    className="w-9 h-9 flex items-center justify-center text-error bg-error-container/30 rounded-lg hover:bg-error hover:text-on-error transition-all active:scale-95"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-surface rounded-xl border border-dashed border-outline-variant/50">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">category</span>
            <p className="label-md text-on-surface-variant">No hay categorías registradas</p>
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
    </div>
  );
}
