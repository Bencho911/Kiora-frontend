import React, { useEffect, useState } from 'react';
import { productService } from '../../config/setup';
import type { Product } from '../../models/Product';

export const SystemAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [lowRes, expRes] = await Promise.all([
          productService.getLowStock(),
          productService.getExpiredProducts()
        ]);
        
        const lowStock = (lowRes?.data || []).map((p: any) => ({ ...p, alertType: 'stock' }));
        const expired = (expRes || []).map((p: any) => ({ ...p, alertType: 'expired' }));
        
        setAlerts([...lowStock, ...expired]);
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
    <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
          Alertas Críticas ({alerts.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.slice(0, 4).map((alert) => (
          <div key={alert.cod_prod} className="bg-red-50/50 border border-red-100 p-3 sm:p-4 rounded-[1.5rem] flex items-center gap-3 sm:gap-4 transition-all hover:bg-red-100/50 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white shadow-sm border border-red-100 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-black text-gray-900 truncate uppercase tracking-tight">Bajo: {alert.nom_prod}</p>
              <p className="text-[10px] sm:text-xs text-red-700 font-bold italic">Quedan {alert.stock_actual} und. (Mín: {alert.stock_minimo})</p>
            </div>
            <div className="hidden sm:block text-[10px] font-black text-red-800 bg-red-200/50 px-2 py-1 rounded-md uppercase">
              Urgente
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
