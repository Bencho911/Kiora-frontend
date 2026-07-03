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
    } catch (error: any) {
      alertService.showToast('error', error.message || 'Error al guardar el proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-md bg-surface-bright shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-outline-variant/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 bg-surface">
          <button onClick={onClose} className="p-1.5 -ml-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          </button>
          <h2 className="label-md text-on-surface">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <form onSubmit={handleSubmit} id="supplierForm" className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Nombre del Proveedor / Empresa</label>
              <input
                type="text"
                id="tour-input-nombre-proveedor"
                required
                value={supplierData.nom_prov || ''}
                onChange={(e) => setSupplierData({ ...supplierData, nom_prov: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="Ej. Distribuidora S.A."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Tipo de ID</label>
                <select
                  value={supplierData.tipoid_prov || 'NIT'}
                  onChange={(e) => setSupplierData({ ...supplierData, tipoid_prov: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                >
                  <option value="NIT">NIT</option>
                  <option value="CC">C.C.</option>
                  <option value="ID">ID Social</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Identificación</label>
                <input
                  type="text"
                  id="tour-input-id-proveedor"
                  inputMode="numeric"
                  value={supplierData.id_prov || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSupplierData({ ...supplierData, id_prov: val });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                  placeholder="9652000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Teléfono / Celular *</label>
              <input
                type="tel"
                id="tour-input-contacto-proveedor"
                required
                inputMode="numeric"
                value={supplierData.tel_prov || ''}
                onFocus={e => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setSupplierData({ ...supplierData, tel_prov: val });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="3000000000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Correo Electrónico *</label>
              <input
                type="email"
                required
                value={supplierData.correo_prov || ''}
                onChange={(e) => setSupplierData({ ...supplierData, correo_prov: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="proveedor@correo.com"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-surface border-t border-outline-variant/30 flex flex-col gap-2">
          <button
            form="supplierForm"
            type="submit"
            id="tour-btn-guardar-proveedor"
            disabled={isSaving}
            className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
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
