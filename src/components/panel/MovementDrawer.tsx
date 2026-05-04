import React, { useState, useEffect } from 'react';
import { inventoryService, productService, alertService } from '@/config/setup';
import type { Product } from '@/models/Product';
import type { Supplier } from '@/models/Inventory';
import { useStockSync } from '@/context/StockContext';

interface MovementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MovementDrawer: React.FC<MovementDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
  const { notifyStockChange } = useStockSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    tipo_mov: 'entrada' as 'entrada' | 'salida',
    cod_prod: '',
    fk_cod_prov: '',
    cantidad: '',
    desc_mov: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [resProd, resSup] = await Promise.all([
        productService.getProducts(1, 100),
        inventoryService.getSuppliers()
      ]);
      const prodList = Array.isArray(resProd) ? resProd : (resProd?.data || []);
      setProducts(prodList);
      if (resSup?.data) setSuppliers(resSup.data);
    } catch (error) {
      console.error('Error cargando catálogos', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cod_prod || !formData.cantidad) {
      alertService.showToast('warning', 'Producto y cantidad son obligatorios');
      return;
    }
    if (!formData.desc_mov.trim()) {
      alertService.showToast('warning', 'La justificación es obligatoria');
      return;
    }

    setIsSaving(true);
    try {
      await inventoryService.createMovement({
        tipo_mov: formData.tipo_mov,
        cod_prod: Number(formData.cod_prod),
        cantidad: Number(formData.cantidad),
        desc_mov: formData.desc_mov,
        fecha_mov: new Date().toISOString()
      });

      alertService.showSuccess('Operación Exitosa', `Se registró la ${formData.tipo_mov} correctamente`);

      onSuccess();
      notifyStockChange();
      onClose();
      setFormData({ tipo_mov: 'entrada', cod_prod: '', fk_cod_prov: '', cantidad: '', desc_mov: '' });
    } catch (error: any) {
      alertService.showError('Error', error.message || 'No se pudo registrar el movimiento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-9999 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`absolute top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-8 border-b border-slate-50">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Nuevo Movimiento</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="movementForm" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naturaleza de la Operación</label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tipo_mov: 'entrada'})}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.tipo_mov === 'entrada' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tipo_mov: 'salida'})}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.tipo_mov === 'salida' ? 'bg-white text-red-500 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Salida
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto a Afectar</label>
              <select
                required
                value={formData.cod_prod}
                onChange={(e) => setFormData({...formData, cod_prod: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all text-sm bg-slate-50 font-bold"
              >
                <option value="">Seleccionar Producto...</option>
                {products.map(p => (
                  <option key={p.cod_prod} value={p.cod_prod}>{p.nom_prod} (Actual: {p.stock_actual})</option>
                ))}
              </select>
            </div>

            {formData.tipo_mov === 'entrada' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor de Origen</label>
                <select
                  value={formData.fk_cod_prov}
                  onChange={(e) => setFormData({...formData, fk_cod_prov: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all text-sm bg-slate-50 font-bold"
                >
                  <option value="">Desconocido / Otros</option>
                  {suppliers.map(s => (
                    <option key={s.cod_prov} value={s.cod_prov}>{s.nom_prov}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades a {formData.tipo_mov === 'entrada' ? 'Sumar' : 'Restar'}</label>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="Ej. 10"
                value={formData.cantidad}
                onChange={(e) => setFormData({...formData, cantidad: e.target.value.replace(/\D/g, '')})}
                className="w-full px-5 py-5 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all text-3xl font-black text-slate-900 placeholder:text-slate-200 bg-slate-50/50"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Justificación del Cambio</label>
              <textarea
                required
                rows={3}
                placeholder="Indica el motivo (ej. Reposición semanal, producto dañado, ajuste anual...)"
                value={formData.desc_mov}
                onChange={(e) => setFormData({...formData, desc_mov: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all text-sm font-medium bg-slate-50/50"
              />
            </div>
          </form>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
          <button
            form="movementForm"
            type="submit"
            disabled={isSaving}
            className={`w-full py-5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
              formData.tipo_mov === 'entrada' 
                ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' 
                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-black'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              `Confirmar ${formData.tipo_mov === 'entrada' ? 'Ingreso' : 'Salida'}`
            )}
          </button>
          <button type="button" onClick={onClose} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar Operación</button>
        </div>
      </div>
    </div>
  );
};
