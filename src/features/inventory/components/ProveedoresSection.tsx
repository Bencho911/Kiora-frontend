import React, { useState, useEffect } from 'react';
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

  const filteredSuppliers = suppliers.filter(sup =>
    !searchTerm ||
    (sup.nom_prov || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.id_prov || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex p-1 bg-slate-100 rounded-2xl ring-1 ring-slate-200/50 shadow-inner w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('lista')}
              className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${activeSubTab === 'lista' ? 'bg-white text-gray-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Directorio
            </button>
            <button
              onClick={() => setActiveSubTab('alertas')}
              className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${activeSubTab === 'alertas' ? 'bg-white text-gray-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Stock Bajo
            </button>
          </div>
          
          <button
            onClick={handleOpenCreate}
            className="bg-[#ec131e] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-[#ec131e]/20 hover:shadow-[#ec131e]/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Nuevo Proveedor
          </button>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-red-100 border-t-[#ec131e] rounded-full animate-spin" />
          </div>
        ) : activeSubTab === 'lista' ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pb-24">
              {filteredSuppliers.length === 0 ? (
                <div className="col-span-full py-24 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   </div>
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sin proveedores registrados</p>
                </div>
              ) : (
                filteredSuppliers.map(sup => (
                  <div key={sup.cod_prov} className="group bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:shadow-[#ec131e]/10 hover:border-[#ec131e]/30 transition-all duration-500 relative flex flex-col items-center text-center ring-1 ring-slate-100">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-slate-100 text-slate-500 group-hover:bg-[#ec131e] group-hover:text-white rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mb-4 sm:mb-6 text-xl sm:text-2xl font-black transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:rotate-6">
                      {(sup.nom_prov || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-sm sm:text-lg font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight group-hover:text-[#ec131e] transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem] flex items-center justify-center">{sup.nom_prov}</h3>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6 h-12 sm:h-14 overflow-hidden">
                      <p className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-widest truncate">{sup.tipoid_prov || 'NIT'} · {sup.id_prov || '—'}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-bold lowercase tracking-normal truncate px-1">{sup.correo_prov || '—'}</p>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={() => handleOpenEdit(sup)} 
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl sm:rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(sup.cod_prov!)} 
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#ec131e] bg-red-50 rounded-xl sm:rounded-2xl hover:bg-[#ec131e] hover:text-white transition-all shadow-md active:scale-95"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    
                    {sup.tel_prov && (
                       <div className="absolute top-4 right-4 sm:top-6 sm:right-6 group-hover:opacity-0 transition-opacity hidden sm:block">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                             <svg className="w-3 h-3 text-[#ec131e]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                             {sup.tel_prov}
                          </div>
                       </div>
                    )}
                  </div>
                ))
              )}
            </div>
        ) : (
          <div className="pb-24 sm:pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {lowStockProducts.map(p => (
                <div key={p.cod_prod} className="group bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-red-500/5 hover:border-red-500/20 transition-all duration-500 relative flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center text-[#ec131e] group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <span className="bg-red-50 text-[#ec131e] px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-sm">Crítico</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm line-clamp-1 leading-tight uppercase tracking-tight group-hover:text-red-600 transition-colors">{p.nom_prod}</h4>
                  <div className="mt-4 flex items-center justify-between p-3 bg-red-50/50 rounded-2xl border border-red-100/50">
                    <div>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Stock</p>
                      <p className="text-xl font-black text-[#ec131e]">{p.stock_actual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Mínimo</p>
                      <p className="text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg shadow-sm">{p.stock_minimo}</p>
                    </div>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg mb-1">Todo en Orden</h3>
                  <p className="text-gray-500 font-medium text-sm">No hay productos con bajo stock actualmente.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SupplierDrawer
        isOpen={isDrawerOpen}
        supplier={isEditing ? (currentSupplier as Supplier) : null}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={loadData}
      />
    </>
  );
}
