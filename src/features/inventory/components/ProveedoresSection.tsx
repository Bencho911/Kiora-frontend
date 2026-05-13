import React, { useState, useEffect } from 'react';
import { inventoryService, alertService, productService } from '@/config/setup';
import type { Supplier, Suministra } from '@/models/Inventory';
import { SupplierDrawer } from './SupplierDrawer';

export function ProveedoresSection({ searchTerm = '' }: { searchTerm?: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'lista' | 'alertas'>('lista');
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  // Drawer states
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

  return (
    <>
      <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
              <span className="text">Proveedores</span>
            </h1>
            <p className="mt-2 text-slate-500 font-medium">Administra tus aliados comerciales y el flujo de suministros.</p>
          </div>
          <button onClick={handleOpenCreate} className="bg-[#ec131e] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#d01019] transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Nuevo Proveedor
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('lista')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Directorio
          </button>
          <button
            onClick={() => setActiveSubTab('alertas')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'alertas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Alertas de Stock
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-red-100 border-t-[#ec131e] rounded-full animate-spin"></div></div>
        ) : activeSubTab === 'lista' ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nombre / Empresa</th>
                <th className="px-6 py-4">ID Fiscal</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.filter(sup => !searchTerm || (sup.nom_prov || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sup.id_prov || '').toLowerCase().includes(searchTerm.toLowerCase())).map(sup => (
                <tr key={sup.cod_prov} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{sup.nom_prov}</p>
                    <p className="text-xs text-gray-400 uppercase">{sup.tipoid_prov || 'NIT'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{sup.id_prov || '---'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{sup.tel_prov || '---'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{sup.correo_prov || '---'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(sup)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                      <button onClick={() => handleDelete(sup.cod_prov)} className="w-8 h-8 rounded-lg bg-red-50 text-[#ec131e] flex items-center justify-center hover:bg-red-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.filter(sup => !searchTerm || (sup.nom_prov || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sup.id_prov || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan={5} className="py-20 text-center text-slate-400">No hay proveedores registrados.</td></tr>}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lowStockProducts.map(p => (
                <div key={p.cod_prod} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm border-l-4 border-red-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-[#ec131e]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <span className="bg-red-50 text-[#ec131e] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Crítico</span>
                  </div>
                  <h4 className="font-bold text-gray-900">{p.nom_prod}</h4>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Stock Actual</p>
                      <p className="text-xl font-black text-[#ec131e]">{p.stock_actual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Stock Mínimo</p>
                      <p className="text-sm font-bold text-gray-900">{p.stock_minimo}</p>
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
