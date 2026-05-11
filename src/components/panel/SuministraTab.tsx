import React, { useState, useEffect } from 'react';
import { inventoryService, productService, alertService } from '@/config/setup';
import type { Suministra } from '@/models/Inventory';
import type { Product } from '@/models/Product';
import type { Supplier } from '@/models/Inventory';
import { getErrorMessage } from '@/utils/getErrorMessage';

export function SuministraTab() {
  const [suministros, setSuministros] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formState, setFormState] = useState<Partial<Suministra>>({
    fk_cod_prov: undefined,
    cod_prod: undefined,
    stock: 0,
    stock_minimo: 5
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, prodRes, supRes] = await Promise.all([
        inventoryService.getSuministra(1, 1000),
        productService.getProducts(1, 1000),
        inventoryService.getSuppliers(1, 1000)
      ]);
      setSuministros(sumRes.data || []);
      setProducts(Array.isArray(prodRes) ? prodRes : (prodRes?.data || []));
      setSuppliers(supRes.data || []);
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error cargando datos'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.fk_cod_prov || !formState.cod_prod) {
      return alertService.showToast('warning', 'Selecciona proveedor y producto');
    }
    
    setIsSaving(true);
    try {
      const existing = suministros.find(s => s.fk_cod_prov === formState.fk_cod_prov && s.cod_prod === formState.cod_prod);
      
      // 1. Asegurar la relación Suministra y establecer el stock_minimo.
      // Upsert sobrescribe, así que usamos el stock que ya tenía (o 0 si es nuevo).
      const result = await inventoryService.upsertSuministra({
        fk_cod_prov: formState.fk_cod_prov,
        cod_prod: formState.cod_prod,
        stock_minimo: formState.stock_minimo,
        stock: existing ? existing.stock : 0
      });
      
      // 2. Registrar el movimiento real (lo que afectará el stock del Producto y el Suministra)
      if (formState.stock && formState.stock > 0) {
        await inventoryService.createMovement({
          tipo_mov: 'entrada',
          cantidad: formState.stock,
          cod_prod: formState.cod_prod,
          fk_cod_prov: formState.fk_cod_prov,
          desc_mov: 'Abastecimiento de mercancía'
        });
      }

      alertService.showToast('success', 'Abastecimiento registrado exitosamente en inventario');
      
      // Si el backend retorna alerta de stock mínimo
      if (result && (result as any).alerta_stock_minimo) {
         alertService.showToast('warning', 'El stock ingresado está por debajo del mínimo configurado');
      }
      
      setFormState({ fk_cod_prov: undefined, cod_prod: undefined, stock: 0, stock_minimo: 5 });
      void loadData();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error registrando abastecimiento'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-1 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <h3 className="font-black text-lg text-slate-900 mb-6">Registrar Abastecimiento</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Proveedor</label>
              <select 
                required
                value={formState.fk_cod_prov || ''} 
                onChange={e => setFormState(f => ({ ...f, fk_cod_prov: Number(e.target.value) }))}
                className="w-full mt-1 rounded-2xl border-none bg-white py-3.5 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#ec131e]/20"
              >
                <option value="">Seleccione proveedor...</option>
                {suppliers.map(s => (
                  <option key={s.cod_prov} value={s.cod_prov}>{s.nom_prov}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Producto</label>
              <select 
                required
                value={formState.cod_prod || ''} 
                onChange={e => setFormState(f => ({ ...f, cod_prod: Number(e.target.value) }))}
                className="w-full mt-1 rounded-2xl border-none bg-white py-3.5 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#ec131e]/20"
              >
                <option value="">Seleccione producto...</option>
                {products.map(p => (
                  <option key={p.cod_prod} value={p.cod_prod}>{p.nom_prod}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Stock Recibido</label>
                <input 
                  type="number" required min="0"
                  value={formState.stock === undefined ? '' : formState.stock} 
                  onChange={e => setFormState(f => ({ ...f, stock: Number(e.target.value) }))}
                  className="w-full mt-1 rounded-2xl border-none bg-white py-3.5 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#ec131e]/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Stock Mínimo</label>
                <input 
                  type="number" required min="0"
                  value={formState.stock_minimo === undefined ? '' : formState.stock_minimo} 
                  onChange={e => setFormState(f => ({ ...f, stock_minimo: Number(e.target.value) }))}
                  className="w-full mt-1 rounded-2xl border-none bg-white py-3.5 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#ec131e]/20"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full rounded-2xl bg-[#ec131e] py-4 text-sm font-black text-white shadow-lg shadow-[#ec131e]/30 hover:bg-[#d01019] transition-all disabled:opacity-50 mt-4"
            >
              {isSaving ? 'Guardando...' : 'Registrar Stock'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <h3 className="font-black text-lg text-slate-900 mb-6">Historial de Relaciones (Suministra)</h3>
          
          {isLoading ? (
            <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-red-100 border-t-[#ec131e] rounded-full animate-spin"></div></div>
          ) : suministros.length === 0 ? (
            <div className="py-20 text-center rounded-[2rem] border border-dashed border-slate-200">
              <p className="font-bold text-slate-400">No hay registros de abastecimiento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-4">Proveedor</th>
                    <th className="py-4 px-4">Producto</th>
                    <th className="py-4 px-4 text-center">Stock Registrado</th>
                    <th className="py-4 px-4 text-center">Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {suministros.map((s, idx) => {
                    const prov = suppliers.find(sup => sup.cod_prov === s.fk_cod_prov);
                    const prod = products.find(p => p.cod_prod === s.cod_prod);
                    const isLow = s.stock <= s.stock_minimo;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-700">{prov?.nom_prov || `Prov #${s.fk_cod_prov}`}</td>
                        <td className="py-4 px-4 font-bold text-slate-900">{prod?.nom_prod || `Prod #${s.cod_prod}`}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {s.stock}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-500">{s.stock_minimo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
