import React, { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import type { Product } from '@/models/Product';
import type { Movement } from '@/models/Inventory';
import { alertService, inventoryService } from '@/config/setup';
import type { Supplier } from '@/models/Inventory';

interface ProductStockTabProps {
  product: Product;
  movements: Movement[];
  isLoading: boolean;
  onSaveMovement: (movement: { tipo_mov: 'entrada' | 'salida' | 'ajuste'; cantidad: number; desc_mov: string; fk_cod_prov?: number; fecha_vencimiento?: string }) => Promise<void>;
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
  const [movFilter, setMovFilter] = useState<'all' | 'entrada' | 'salida' | 'ajuste'>('all');
  const [movSearch, setMovSearch] = useState('');

  const [movForm, setMovForm] = React.useState<{
    tipo_mov: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    desc_mov: string;
    fk_cod_prov?: number;
    stock_minimo: number;
    numero_lote?: string;
    fecha_vencimiento?: string;
  }>({
    tipo_mov: 'entrada',
    cantidad: 1,
    desc_mov: '',
    fk_cod_prov: undefined,
    stock_minimo: product.stock_minimo || 5,
    numero_lote: '',
    fecha_vencimiento: ''
  });

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isAbastecimiento, setIsAbastecimiento] = React.useState(false);
  const [defaultProvider, setDefaultProvider] = React.useState<number | undefined>();

  React.useEffect(() => {
    inventoryService.getSuppliers(1, 1000).then(res => {
      setSuppliers(res.data || []);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (product.cod_prod) {
      inventoryService.getSuministraByProduct(product.cod_prod).then(res => {
        if (res) {
          setDefaultProvider(res.fk_cod_prov);
          setIsAbastecimiento(true);
          setMovForm(f => ({ ...f, fk_cod_prov: res.fk_cod_prov }));
        } else {
          setDefaultProvider(undefined);
          setIsAbastecimiento(false);
          setMovForm(f => ({ ...f, fk_cod_prov: undefined }));
        }
      }).catch(() => {});
    }
  }, [product.cod_prod]);

  const filteredMovements = useMemo(() => {
    let result = movements;
    if (movFilter !== 'all') result = result.filter(m => m.tipo_mov === movFilter);
    if (!movSearch.trim()) return result;
    const fuse = new Fuse(result, {
      keys: ['desc_mov', 'id_mov'],
      threshold: 0.4,
    });
    return fuse.search(movSearch.trim()).map(r => r.item);
  }, [movements, movFilter, movSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate expiration date: must be a future date (strictly after today)
    if (movForm.fecha_vencimiento) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(movForm.fecha_vencimiento + 'T00:00:00');
      if (expDate <= today) {
        alertService.showToast('warning', 'La fecha de vencimiento debe ser una fecha futura válida.');
        return;
      }
    }

    let finalAmount = movForm.cantidad;
    let finalType = movForm.tipo_mov;

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
        await inventoryService.upsertSuministra({
          fk_cod_prov: movForm.fk_cod_prov,
          cod_prod: product.cod_prod!,
          stock_minimo: movForm.stock_minimo,
          stock: product.stock_actual || 0
        });
      } catch (err) {
        alertService.showToast('error', 'Error configurando relación con proveedor');
        return;
      }
    }

    await onSaveMovement({
      tipo_mov: finalType,
      cantidad: finalAmount,
      desc_mov: isAbastecimiento ? 'Abastecimiento de mercancía' : movForm.desc_mov + (movForm.tipo_mov === 'ajuste' ? ' (Ajuste de inventario)' : ''),
      fk_cod_prov: isAbastecimiento ? movForm.fk_cod_prov : undefined,
      fecha_vencimiento: finalType === 'entrada' && movForm.fecha_vencimiento ? movForm.fecha_vencimiento : undefined
    });

    setMovForm({ tipo_mov: 'entrada', cantidad: 1, desc_mov: '', fk_cod_prov: defaultProvider, stock_minimo: product.stock_minimo || 5, numero_lote: '', fecha_vencimiento: '' });
    setIsAbastecimiento(!!defaultProvider);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-surface-container-low">
      {/* Movement Form */}
      <form onSubmit={handleSubmit} className="bg-surface p-5 rounded-xl border border-outline-variant/30 space-y-4">
        <h3 className="label-md text-on-surface">Registrar Movimiento</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="label-sm text-on-surface-variant">Tipo</label>
            <select
              value={movForm.tipo_mov}
              onChange={e => {
                setMovForm(f => ({ ...f, tipo_mov: e.target.value as 'entrada' | 'salida' | 'ajuste' }));
                if (e.target.value !== 'entrada') setIsAbastecimiento(false);
                else setIsAbastecimiento(!!defaultProvider);
              }}
              className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              <option value="entrada">Entrada (+)</option>
              <option value="salida">Salida (-)</option>
              <option value="ajuste">Ajuste (~)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label-sm text-on-surface-variant">Cantidad</label>
            <input
              type="number"
              required
              value={movForm.cantidad}
              onFocus={e => e.target.select()}
              onChange={e => setMovForm(f => ({ ...f, cantidad: Number(e.target.value) }))}
              className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
        {movForm.tipo_mov === 'entrada' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Nro. Lote</label>
              <input type="text" value={movForm.numero_lote || ''} onChange={e => setMovForm(f => ({ ...f, numero_lote: e.target.value }))} placeholder="Lote-001" className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Fecha Vencimiento</label>
              <input type="date" value={movForm.fecha_vencimiento || ''} onChange={e => setMovForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        )}
        {movForm.tipo_mov === 'entrada' && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAbastecimiento"
              checked={isAbastecimiento}
              onChange={(e) => setIsAbastecimiento(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="isAbastecimiento" className="label-sm text-on-surface-variant cursor-pointer">
              ¿Es un abastecimiento de proveedor?
            </label>
          </div>
        )}

        {isAbastecimiento && movForm.tipo_mov === 'entrada' ? (
          <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">
                Proveedor * {defaultProvider && <span className="text-primary text-xs font-normal ml-1">(Predeterminado)</span>}
              </label>
              <select
                required
                value={movForm.fk_cod_prov || ''}
                onChange={e => setMovForm(f => ({ ...f, fk_cod_prov: Number(e.target.value) }))}
                className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Seleccionar...</option>
                {suppliers.map(s => <option key={s.cod_prov} value={s.cod_prov}>{s.nom_prov}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Stock Mínimo</label>
              <input
                type="number" required min="0"
                value={movForm.stock_minimo}
                onChange={e => setMovForm(f => ({ ...f, stock_minimo: Number(e.target.value) }))}
                className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="label-sm text-on-surface-variant">Justificación *</label>
            <input
              type="text"
              required
              placeholder="Ej. Lote L-2025-001, factura proveedor, merma…"
              value={movForm.desc_mov}
              onChange={e => setMovForm(f => ({ ...f, desc_mov: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary text-on-primary py-2.5 label-sm shadow-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Registrando...' : 'Registrar Movimiento'}
        </button>
      </form>

      {/* Trazabilidad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="label-md text-on-surface">Trazabilidad</h3>
          <button
            type="button"
            disabled={!filteredMovements.length}
            onClick={() => {
              const rows = filteredMovements.map((m) =>
                [m.id_mov, m.fecha_mov, m.tipo_mov, m.cantidad, (m.desc_mov || '').replace(/"/g, '""'), product.cod_prod, product.nom_prod].join(',')
              );
              const csv = ['id,fecha,tipo,cantidad,descripcion,cod_prod,nombre', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `trazabilidad_${product.cod_prod}_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              alertService.showToast('success', 'Archivo CSV generado');
            }}
            className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-1.5 label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-40"
          >
            Exportar CSV
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={movFilter}
            onChange={(e) => setMovFilter(e.target.value as typeof movFilter)}
            className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 label-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
          <input
            type="search"
            placeholder="Filtrar por descripción…"
            value={movSearch}
            onChange={(e) => setMovSearch(e.target.value)}
            className="flex-1 rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 label-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-5">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center p-5 bg-surface border border-outline-variant/30 rounded-xl">
            <p className="label-sm text-on-surface-variant">No hay movimientos registrados.</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="rounded-xl border border-secondary-container/30 bg-secondary-container/10 p-5 text-center">
            <p className="label-sm text-secondary-container">No hay movimientos que coincidan con los filtros.</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Prueba con otros filtros.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMovements.map((m) => {
              const isAbastecimiento = (m.desc_mov || '').toLowerCase().includes('abastecimiento');
              const badgeClass =
                isAbastecimiento                ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                m.tipo_mov === 'entrada'        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                m.tipo_mov === 'salida'         ? 'bg-red-100 text-red-700 border border-red-200' :
                m.tipo_mov === 'ajuste'         ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                  'bg-surface-container-high text-on-surface-variant';
              const qtyClass =
                isAbastecimiento                ? 'text-purple-600' :
                m.tipo_mov === 'entrada'        ? 'text-emerald-600' :
                m.tipo_mov === 'salida'         ? 'text-red-600' :
                                                  'text-amber-600';
              const qtyPrefix =
                m.tipo_mov === 'entrada' ? '+' :
                m.tipo_mov === 'salida'  ? '−' : '~';

              return (
                <div
                  key={m.id_mov}
                  onClick={() => onViewMovement?.(m)}
                  className={`bg-surface p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between group hover:border-outline transition-colors ${onViewMovement ? 'cursor-pointer' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    {/* Reference header: product name + badge + date */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                        {isAbastecimiento ? 'abastecimiento' : m.tipo_mov}
                      </span>
                      <span className="label-sm text-on-surface font-semibold truncate max-w-[160px]">
                        {product.nom_prod}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {m.fecha_mov ? new Date(m.fecha_mov).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    {/* Description / reference */}
                    <p className="text-xs text-on-surface-variant truncate max-w-[240px]">
                      {m.desc_mov || 'Sin referencia'}
                    </p>
                  </div>
                  <span className={`text-base font-black ml-3 shrink-0 ${qtyClass}`}>
                    {qtyPrefix}{m.cantidad}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
