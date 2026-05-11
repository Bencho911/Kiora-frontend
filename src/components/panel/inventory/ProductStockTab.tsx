import React from 'react';
import type { Product } from '@/models/Product';
import type { Movement } from '@/models/Inventory';
import { alertService, inventoryService } from '@/config/setup';
import type { Supplier } from '@/models/Inventory';

interface ProductStockTabProps {
  product: Product;
  movements: Movement[];
  isLoading: boolean;
  onSaveMovement: (movement: { tipo_mov: 'entrada' | 'salida' | 'ajuste'; cantidad: number; desc_mov: string; fk_cod_prov?: number }) => Promise<void>;
  onViewMovement?: (movement: Movement) => void;
  saving: boolean;
}

export const ProductStockTab: React.FC<ProductStockTabProps> = ({
  product,
  movements,
  isLoading,
  onSaveMovement,
  onViewMovement,
  saving
}) => {
  const [movForm, setMovForm] = React.useState<{ tipo_mov: 'entrada' | 'salida' | 'ajuste'; cantidad: number; desc_mov: string; fk_cod_prov?: number; stock_minimo: number }>({
    tipo_mov: 'entrada',
    cantidad: 1,
    desc_mov: '',
    fk_cod_prov: undefined,
    stock_minimo: product.stock_minimo || 5
  });

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isAbastecimiento, setIsAbastecimiento] = React.useState(false);

  React.useEffect(() => {
    inventoryService.getSuppliers(1, 1000).then(res => {
      setSuppliers(res.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAmount = movForm.cantidad;
    let finalType = movForm.tipo_mov;

    // Si es ajuste, calculamos la diferencia con el stock actual
    if (movForm.tipo_mov === 'ajuste') {
      const currentStock = product.stock_actual || 0;
      const diff = movForm.cantidad - currentStock;
      
      if (diff === 0) {
        alertService.showToast('info', 'El stock ya es el indicado.');
        return;
      }
      
      finalAmount = Math.abs(diff);
      finalType = diff > 0 ? 'entrada' : 'salida';
    }

    if (isAbastecimiento && finalType === 'entrada') {
      if (!movForm.fk_cod_prov) {
        alertService.showToast('warning', 'Debes seleccionar un proveedor');
        return;
      }
      try {
        // Register Suministra relation first
        await inventoryService.upsertSuministra({
          fk_cod_prov: movForm.fk_cod_prov,
          cod_prod: product.cod_prod!,
          stock_minimo: movForm.stock_minimo,
          stock: product.stock_actual || 0 // Conservar el stock actual
        });
      } catch (err) {
        alertService.showToast('error', 'Error configurando relación con proveedor');
        return;
      }
    }

    await onSaveMovement({ 
      tipo_mov: finalType, 
      cantidad: finalAmount, 
      desc_mov: isAbastecimiento ? `Abastecimiento de mercancía` : movForm.desc_mov + (movForm.tipo_mov === 'ajuste' ? ' (Ajuste de inventario)' : ''),
      fk_cod_prov: isAbastecimiento ? movForm.fk_cod_prov : undefined
    });
    
    setMovForm({ tipo_mov: 'entrada', cantidad: 1, desc_mov: '', fk_cod_prov: undefined, stock_minimo: product.stock_minimo || 5 });
    setIsAbastecimiento(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
      {/* Movimientos form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800">Registrar Movimiento</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</label>
            <select
              value={movForm.tipo_mov}
              onChange={e => {
                setMovForm(f => ({ ...f, tipo_mov: e.target.value as 'entrada' | 'salida' | 'ajuste' }));
                if (e.target.value !== 'entrada') setIsAbastecimiento(false);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-kiora-red focus:outline-none"
            >
              <option value="entrada">Entrada (+)</option>
              <option value="salida">Salida (-)</option>
              <option value="ajuste">Ajuste (~)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad</label>
            <input
              type="number"
              required
              value={movForm.cantidad}
              onFocus={e => e.target.select()}
              onChange={e => setMovForm(f => ({ ...f, cantidad: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-kiora-red focus:outline-none"
            />
          </div>
        </div>
        {movForm.tipo_mov === 'entrada' && (
          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox" 
              id="isAbastecimiento" 
              checked={isAbastecimiento}
              onChange={(e) => setIsAbastecimiento(e.target.checked)}
              className="rounded border-slate-300 text-kiora-red focus:ring-kiora-red"
            />
            <label htmlFor="isAbastecimiento" className="text-[11px] font-bold text-slate-600 cursor-pointer">
              ¿Es un abastecimiento de proveedor?
            </label>
          </div>
        )}

        {isAbastecimiento && movForm.tipo_mov === 'entrada' ? (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proveedor *</label>
              <select
                required
                value={movForm.fk_cod_prov || ''}
                onChange={e => setMovForm(f => ({ ...f, fk_cod_prov: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-kiora-red focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.cod_prov} value={s.cod_prov}>{s.nom_prov}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Mínimo (Alerta)</label>
              <input
                type="number" required min="0"
                value={movForm.stock_minimo}
                onChange={e => setMovForm(f => ({ ...f, stock_minimo: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-kiora-red focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Justificación / Origen *</label>
            <input
              type="text"
              required
              placeholder="Ej. Compra a proveedor, merma, ajuste..."
              value={movForm.desc_mov}
              onChange={e => setMovForm(f => ({ ...f, desc_mov: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-kiora-red focus:outline-none"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 transition-all active:scale-95"
        >
          {saving ? 'Registrando...' : 'Registrar Movimiento'}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-800">Historial de Movimientos</h3>
        {isLoading ? (
          <div className="flex justify-center py-5">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-kiora-red" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center p-5 bg-white border border-slate-100 rounded-3xl">
            <p className="text-xs text-slate-400 font-bold">No hay movimientos registrados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div 
                key={m.id_mov} 
                onClick={() => onViewMovement?.(m)}
                className={`bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-colors ${onViewMovement ? 'cursor-pointer' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${m.tipo_mov === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {m.tipo_mov}
                    </span>
                    <span className="text-[10px] font-black text-slate-800">
                      {product.nom_prod}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      • {m.fecha_mov ? new Date(m.fecha_mov).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                    {m.desc_mov || 'Sin justificación'}
                  </p>
                </div>
                <span className={`text-base font-black ${m.tipo_mov === 'entrada' ? 'text-emerald-500' : m.tipo_mov === 'salida' ? 'text-red-500' : 'text-blue-500'}`}>
                  {m.tipo_mov === 'entrada' ? '+' : m.tipo_mov === 'salida' ? '-' : ''}{m.cantidad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
