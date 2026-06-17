import React, { useEffect, useState } from 'react';
import type { Product } from '@/models/Product';
import { alertService, inventoryService } from '@/config/setup';

interface Lote {
  id: number;
  cod_prod: number;
  numero_lote: string;
  fecha_vencimiento: string | null;
  cantidad_inicial: string;
  cantidad_actual: string;
  fecha_ingreso: string;
  estado: string;
}

interface ProductLotesTabProps {
  product: Product;
}

export const ProductLotesTab: React.FC<ProductLotesTabProps> = ({ product }) => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (product?.cod_prod) {
      loadLotes(product.cod_prod);
    }
  }, [product?.cod_prod]);

  const loadLotes = async (cod_prod: number) => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getLotesByProduct(cod_prod);
      setLotes(data);
    } catch (error) {
      alertService.showToast('error', 'Error al cargar los lotes del producto');
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'bg-tertiary-container/50 text-on-tertiary-container border-tertiary/20';
      case 'AGOTADO': return 'bg-surface-container-highest text-on-surface-variant border-outline-variant';
      case 'VENCIDO': return 'bg-error-container text-error border-error/20';
      default: return 'bg-surface-container-high text-on-surface-variant border-outline-variant/50';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 bg-surface-container-low">
      <div className="flex items-center justify-between mb-4">
        <h3 className="label-md text-on-surface">Lotes Registrados</h3>
        <span className="label-sm text-on-surface-variant font-medium">{lotes.length} lotes</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : lotes.length === 0 ? (
        <div className="text-center p-5 bg-surface border border-outline-variant/30 rounded-xl shadow-sm">
          <p className="label-sm text-on-surface-variant">No hay lotes registrados para este producto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lotes.map(lote => (
            <div key={lote.id} className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-2 transition-all hover:border-outline-variant/60">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getBadgeClass(lote.estado)}`}>
                      {lote.estado}
                    </span>
                    <span className="label-md text-on-surface font-semibold">
                      {lote.numero_lote}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Ingreso: {new Date(lote.fecha_ingreso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  {lote.fecha_vencimiento && (
                    <p className="text-xs text-on-surface-variant">
                      Vencimiento: {new Date(lote.fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant mb-0.5">Stock Actual</p>
                  <p className={`text-lg font-black ${lote.estado === 'ACTIVO' ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {Number(lote.cantidad_actual)}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    de {Number(lote.cantidad_inicial)}
                  </p>
                </div>
              </div>
              
              {/* Progress bar visual for stock */}
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full ${lote.estado === 'ACTIVO' ? 'bg-primary' : 'bg-outline-variant'}`} 
                  style={{ width: `${Math.max(0, Math.min(100, (Number(lote.cantidad_actual) / Number(lote.cantidad_inicial)) * 100))}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
