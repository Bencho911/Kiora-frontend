import React, { useEffect, useState } from 'react';
import { inventoryService, alertService, productService } from '@/config/setup';

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<any>(null);
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [alertsData, productsData] = await Promise.all([
        inventoryService.getAlerts(),
        productService.getAll()
      ]);
      
      const map: Record<number, string> = {};
      productsData.forEach(p => {
        map[p.cod_prod] = p.nom_prod;
      });
      setProductsMap(map);
      setAlerts(alertsData);
    } catch (error: any) {
      alertService.showToast('error', error.message || 'Error al cargar alertas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!alerts) return null;

  const { lowStock = [], expiringBatches = [], expiredBatches = [] } = alerts;
  const hasAlerts = lowStock.length > 0 || expiringBatches.length > 0 || expiredBatches.length > 0;

  if (!hasAlerts) {
    return (
      <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-tertiary-fixed/30 text-tertiary flex items-center justify-center">
          <span className="material-symbols-outlined">check_circle</span>
        </div>
        <div>
          <h4 className="label-md font-semibold text-on-surface">Inventario Saludable</h4>
          <p className="body-sm text-on-surface-variant">No hay alertas de stock bajo ni vencimientos próximos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden mb-6">
      <div className="bg-error/10 border-b border-error/20 px-4 py-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-error">warning</span>
        <h3 className="label-lg font-bold text-error">Alertas de Inventario</h3>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {expiredBatches.length > 0 && (
          <div className="space-y-2">
            <h4 className="label-sm font-semibold text-error uppercase tracking-wider">Lotes Vencidos ({expiredBatches.length})</h4>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
              {expiredBatches.map((b: any) => (
                <div key={b.id} className="bg-surface-container-lowest p-2 rounded-lg border border-error/30">
                  <p className="label-md text-on-surface truncate">{b.Producto?.nom_prod || productsMap[b.cod_prod] || `Prod #${b.cod_prod}`}</p>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="font-medium text-error">Venció: {new Date(b.fecha_vencimiento).toLocaleDateString()}</span>
                    <span className="text-on-surface-variant">Stock: {b.cantidad_actual}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expiringBatches.length > 0 && (
          <div className="space-y-2">
            <h4 className="label-sm font-semibold text-secondary uppercase tracking-wider">Por Vencer ({expiringBatches.length})</h4>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
              {expiringBatches.map((b: any) => (
                <div key={b.id} className="bg-surface-container-lowest p-2 rounded-lg border border-secondary/30">
                  <p className="label-md text-on-surface truncate">{b.Producto?.nom_prod || productsMap[b.cod_prod] || `Prod #${b.cod_prod}`}</p>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="font-medium text-secondary">Vence: {new Date(b.fecha_vencimiento).toLocaleDateString()}</span>
                    <span className="text-on-surface-variant">Stock: {b.cantidad_actual}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStock.length > 0 && (
          <div className="space-y-2">
            <h4 className="label-sm font-semibold text-warning uppercase tracking-wider">Stock Bajo ({lowStock.length})</h4>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
              {lowStock.map((item: any) => (
                <div key={item.cod_prod} className="bg-surface-container-lowest p-2 rounded-lg border border-warning/30">
                  <p className="label-md text-on-surface truncate">{item.nom_prod || productsMap[item.cod_prod] || `Prod #${item.cod_prod}`}</p>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="font-medium text-warning">Actual: {item.stock_actual !== undefined ? item.stock_actual : item.stock}</span>
                    <span className="text-on-surface-variant">Mín: {item.stock_minimo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
