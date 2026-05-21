import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { inventoryService, alertService, productService } from '@/config/setup';
import type { Supplier, Suministra } from '@/models/Inventory';
import { SupplierDrawer } from './SupplierDrawer';

export function ProveedoresSection({ searchTerm = '' }: { searchTerm?: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'lista' | 'alertas'>('lista');
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === 'lista') {
        const res = await inventoryService.getSuppliers();
        if (res && res.data) setSuppliers(res.data);
      } else {
        const res = await productService.getLowStockProducts();
        setLowStockProducts(res);
      }
    } catch (error: any) {
      alertService.showError('Error', error.message || 'Error cargando datos de proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCurrentSupplier({});
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setCurrentSupplier(sup);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await alertService.showConfirm('¿Eliminar Proveedor?', 'Esta acción no se puede deshacer', 'Sí, eliminar', 'Cancelar');
    if (!confirmed) return;
    try {
      await inventoryService.deleteSupplier(id);
      alertService.showSuccess('Eliminado', 'Proveedor eliminado exitosamente');
      loadData();
    } catch (error: any) {
      alertService.showError('Error', error.message || 'No se pudo eliminar el proveedor');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing && currentSupplier.cod_prov) {
        await inventoryService.updateSupplier(currentSupplier.cod_prov, currentSupplier);
        alertService.showSuccess('Actualizado', 'Proveedor actualizado');
      } else {
        await inventoryService.createSupplier(currentSupplier);
        alertService.showSuccess('Creado', 'Proveedor registrado');
      }
      setIsDrawerOpen(false);
      loadData();
    } catch (error: any) {
      alertService.showError('Error', error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const fuse = new Fuse(suppliers, {
      keys: ['nom_prov', 'id_prov', 'correo_prov', 'tel_prov'],
      threshold: 0.3,
    });
    return fuse.search(searchTerm.trim()).map(r => r.item);
  }, [suppliers, searchTerm]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Tabs + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-outline-variant/30">
        <div className="flex bg-surface-container-high rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('lista')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-md label-sm transition-all ${
              activeSubTab === 'lista'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Directorio
          </button>
          <button
            onClick={() => setActiveSubTab('alertas')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-md label-sm transition-all ${
              activeSubTab === 'alertas'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Stock Bajo
          </button>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-primary text-on-primary label-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all active:scale-[0.98] w-full sm:w-auto justify-center"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Nuevo Proveedor
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeSubTab === 'lista' ? (
        /* ─── DIRECTORIO ─── */
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-24 text-center">
              <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center mx-auto mb-4 text-on-surface-variant/50">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group</span>
              </div>
              <p className="label-md text-on-surface-variant">Sin proveedores registrados</p>
            </div>
          ) : (
            filteredSuppliers.map(sup => (
              <div
                key={sup.cod_prov}
                className="group bg-surface rounded-xl border border-outline-variant/30 p-5 flex flex-col items-center text-center hover:shadow-md hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center mb-4 text-lg font-bold transition-all duration-300">
                  {(sup.nom_prov || '?').slice(0, 2).toUpperCase()}
                </div>
                <h3 className="label-md text-on-surface mb-1 leading-tight break-words">{sup.nom_prov}</h3>
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-semibold text-on-surface-variant">{sup.tipoid_prov || 'NIT'} · {sup.id_prov || '—'}</p>
                  <p className="text-[10px] text-on-surface-variant/70 break-words px-1">{sup.correo_prov || '—'}</p>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="w-9 h-9 flex items-center justify-center text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(sup.cod_prov!)}
                    className="w-9 h-9 flex items-center justify-center text-error bg-error-container/30 rounded-lg hover:bg-error hover:text-on-error transition-all active:scale-95"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ─── STOCK BAJO ─── */
        <div className="pb-24">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(p => (
                <div key={p.cod_prod} className="bg-surface rounded-xl border border-error/20 p-5 flex flex-col hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-lg bg-error-container/30 text-error flex items-center justify-center">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                    </div>
                    <span className="text-[9px] font-semibold text-error bg-error-container/30 px-2 py-0.5 rounded-md">Crítico</span>
                  </div>
                  <h4 className="label-md text-on-surface mb-3 break-words">{p.nom_prod}</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-error-container/20 border border-error/10">
                    <div>
                      <p className="text-[9px] font-semibold text-on-surface-variant">Stock</p>
                      <p className="headline-sm text-error">{p.stock_actual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-semibold text-on-surface-variant">Mínimo</p>
                      <p className="text-xs font-semibold text-on-surface bg-surface px-2 py-0.5 rounded-md">{p.stock_minimo}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="w-14 h-14 bg-tertiary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-tertiary">
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>check_circle</span>
                </div>
                <p className="headline-sm text-on-surface mb-1">Todo en orden</p>
                <p className="body-md text-on-surface-variant">No hay productos con bajo stock actualmente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <SupplierDrawer
        isOpen={isDrawerOpen}
        supplier={isEditing ? (currentSupplier as Supplier) : null}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
