import React, { useEffect, useState } from 'react';
import { productService } from '../../config/setup';
import type { Product } from '../../models/Product';

export const SystemAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [lowRes, expRes, soonRes] = await Promise.all([
          productService.getLowStock(),
          productService.getExpiredProducts(),
          productService.getExpiringProducts(7)
        ]);

        const lowStock = (lowRes?.data || []).map((p: any) => ({ ...p, alertType: 'stock' }));
        const expired = (expRes || []).map((p: any) => ({ ...p, alertType: 'expired' }));
        const soon = (soonRes || []).map((p: any) => ({ ...p, alertType: 'expiring_soon' }));

        setAlerts([...lowStock, ...expired, ...soon]);
      } catch (err) {
        // Silently handle backend downtime
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-error animate-ping" />
        <span className="label-sm text-on-surface-variant font-semibold">Alertas ({alerts.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.slice(0, 4).map((alert) => (
          <div key={`${alert.alertType}-${alert.cod_prod}`} className={`p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4 transition-all hover:bg-opacity-80 ${
            alert.alertType === 'expiring_soon'
              ? 'bg-secondary-container/20 border border-secondary-container/30'
              : 'bg-error-container/20 border border-error-container/50'
          }`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface border shrink-0 flex items-center justify-center ${
              alert.alertType === 'expiring_soon' ? 'border-secondary-container/30 text-secondary-container' : 'border-error-container/50 text-error'
            }`}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {alert.alertType === 'expiring_soon' ? 'schedule' : 'warning'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">
                {alert.alertType === 'expiring_soon' ? `Próximo a vencer: ${alert.nom_prod}` : `Stock bajo: ${alert.nom_prod}`}
              </p>
              <p className="text-xs text-on-surface-variant">
                {alert.alertType === 'expiring_soon'
                  ? `Vence el ${new Date(alert.fechaven_prod).toLocaleDateString('es-CO')}`
                  : `Quedan ${alert.stock_actual} uds (mín. ${alert.stock_minimo})`}
              </p>
            </div>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md ${
              alert.alertType === 'expiring_soon' ? 'bg-secondary-container/20 text-secondary-container' : 'bg-error-container/20 text-error'
            }`}>
              {alert.alertType === 'expiring_soon' ? 'Próximo' : 'Urgente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
