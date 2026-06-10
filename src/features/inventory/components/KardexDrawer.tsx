import React, { useEffect, useState } from 'react';
import { inventoryService, alertService } from '@/config/setup';
import type { Product } from '@/models/Product';

interface KardexDrawerProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const KardexDrawer: React.FC<KardexDrawerProps> = ({ isOpen, product, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchKardex();
    } else {
      setData(null);
    }
  }, [isOpen, product]);

  const fetchKardex = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const res = await inventoryService.getProductKardex(product.cod_prod);
      setData(res);
    } catch (error: any) {
      alertService.showToast('error', error.message || 'Error al cargar kardex');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-scrim/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface h-full flex flex-col shadow-elevation-4 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/30 bg-surface-container-lowest">
          <div>
            <h2 className="headline-sm text-on-surface">Kardex y Lotes</h2>
            <p className="body-md text-on-surface-variant mt-1">
              {product ? `${product.nom_prod} (Cód: ${product.cod_prod})` : 'Cargando...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f8fafc]">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : data ? (
            <>
              {/* Lotes Activos */}
              <section>
                <h3 className="label-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">inventory_2</span>
                  Lotes Activos
                </h3>
                {data.lotes && data.lotes.length > 0 ? (
                  <div className="grid gap-3">
                    {data.lotes.map((lote: any) => (
                      <div key={lote.id} className="bg-surface p-4 rounded-xl border border-outline-variant/50 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="label-md font-semibold text-on-surface">Lote: {lote.numero_lote}</p>
                          <p className="body-sm text-on-surface-variant">Ingreso: {new Date(lote.fecha_ingreso).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="label-md font-bold text-primary">{lote.cantidad_actual} uds</p>
                          <p className={`text-xs font-semibold mt-1 ${lote.fecha_vencimiento ? 'text-secondary' : 'text-on-surface-variant'}`}>
                            {lote.fecha_vencimiento ? `Vence: ${new Date(lote.fecha_vencimiento).toLocaleDateString()}` : 'Sin Vencimiento'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest p-6 rounded-xl border border-dashed border-outline-variant text-center">
                    <p className="text-sm text-on-surface-variant">No hay lotes activos para este producto.</p>
                  </div>
                )}
              </section>

              {/* Movimientos / Kardex */}
              <section>
                <h3 className="label-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">history</span>
                  Historial de Movimientos
                </h3>
                {data.movimientos && data.movimientos.length > 0 ? (
                  <div className="bg-surface rounded-xl border border-outline-variant/50 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-lowest border-b border-outline-variant/30 text-xs font-semibold text-on-surface-variant uppercase">
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Lote</th>
                          <th className="py-3 px-4 text-right">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {data.movimientos.map((mov: any) => (
                          <tr key={mov.id} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="py-3 px-4 text-sm text-on-surface">
                              {new Date(mov.fecha_mov).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                mov.tipo_mov === 'entrada' ? 'bg-tertiary-fixed/30 text-tertiary' : 'bg-error/10 text-error'
                              }`}>
                                {mov.tipo_mov.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-on-surface-variant">
                              {mov.Lote?.numero_lote || `Lote #${mov.lote_id}`}
                            </td>
                            <td className={`py-3 px-4 text-sm font-bold text-right ${
                              mov.tipo_mov === 'entrada' ? 'text-tertiary' : 'text-error'
                            }`}>
                              {mov.tipo_mov === 'entrada' ? '+' : '-'}{mov.cantidad}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest p-6 rounded-xl border border-dashed border-outline-variant text-center">
                    <p className="text-sm text-on-surface-variant">No hay movimientos registrados.</p>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
