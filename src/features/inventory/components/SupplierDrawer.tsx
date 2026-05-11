import React, { useState, useEffect } from 'react';
import type { Supplier } from '@/models/Inventory';
import { inventoryService, alertService } from '@/config/setup';

interface SupplierDrawerProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export const SupplierDrawer: React.FC<SupplierDrawerProps> = ({
  isOpen,
  supplier,
  onClose,
  onSuccess
}) => {
  const isEditing = !!supplier;
  const [isSaving, setIsSaving] = useState(false);
  const [supplierData, setSupplierData] = useState<Partial<Supplier>>({
    nom_prov: '',
    tipoid_prov: 'NIT',
    id_prov: '',
    tel_prov: '',
    correo_prov: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setSupplierData(supplier);
      } else {
        setSupplierData({
          nom_prov: '',
          tipoid_prov: 'NIT',
          id_prov: '',
          tel_prov: '',
          correo_prov: ''
        });
      }
    }
  }, [isOpen, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing && supplier?.cod_prov) {
        await inventoryService.updateSupplier(supplier.cod_prov, supplierData);
        alertService.showToast('success', 'Proveedor actualizado');
      } else {
        await inventoryService.createSupplier(supplierData);
        alertService.showToast('success', 'Proveedor registrado');
      }
      onSuccess();
      onClose();
    } catch (error) {
      alertService.showToast('error', 'Error al guardar el proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[99999] transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`absolute top-0 right-0 h-full w-100 max-w-[calc(100vw-1rem)] bg-[#fafafc] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-[15px] font-bold text-gray-800">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <form onSubmit={handleSubmit} id="supplierForm" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Nombre del Proveedor / Empresa</label>
              <input 
                type="text" 
                required
                value={supplierData.nom_prov || ''}
                onChange={(e) => setSupplierData({...supplierData, nom_prov: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300" 
                placeholder="Ej. Distribuidora S.A." 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-600">Tipo de ID</label>
                <select 
                  value={supplierData.tipoid_prov || 'NIT'}
                  onChange={(e) => setSupplierData({...supplierData, tipoid_prov: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50"
                >
                  <option value="NIT">NIT</option>
                  <option value="CC">C.C.</option>
                  <option value="ID">ID Social</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-600">Identificación</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={supplierData.id_prov || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSupplierData({...supplierData, id_prov: val});
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50" 
                  placeholder="9652000" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Teléfono / Celular de Contacto *</label>
              <input 
                type="tel" 
                required
                inputMode="numeric"
                value={supplierData.tel_prov || ''}
                onFocus={e => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setSupplierData({...supplierData, tel_prov: val});
                }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300" 
                placeholder="3000000000" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Correo Electrónico *</label>
              <input 
                type="email" 
                required
                value={supplierData.correo_prov || ''}
                onChange={(e) => setSupplierData({...supplierData, correo_prov: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300" 
                placeholder="proveedor@correo.com" 
              />
            </div>
          </form>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
          <button 
             form="supplierForm" 
             type="submit" 
             disabled={isSaving}
             className="w-full bg-[#ec131e] hover:bg-[#d01019] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(236,19,30,0.39)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
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

