import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Product } from '@/models/Product';
import { productService } from '@/config/setup';

interface StockContextType {
  stockSyncVersion: number;
  notifyStockChange: () => void;
  lowStockItems: Product[];
  productMap: Record<number, string>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockSyncVersion, setStockSyncVersion] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [productMap, setProductMap] = useState<Record<number, string>>({});

  const refreshData = useCallback(async () => {
    try {
      const [lowRes, prodRes] = await Promise.all([
        productService.getLowStock(),
        productService.getProducts(1, 1000)
      ]);
      
      setLowStockItems(lowRes && 'data' in lowRes ? (lowRes as any).data : (Array.isArray(lowRes) ? lowRes : []));

      const pList = Array.isArray(prodRes) ? prodRes : (prodRes.data || []);
      const map: Record<number, string> = {};
      pList.forEach((p: Product) => { map[p.cod_prod] = p.nom_prod; });
      setProductMap(map);

    } catch (e) {
      console.error('Error refreshing stock context data:', e);
    }
  }, []);

  const notifyStockChange = useCallback(() => {
    setStockSyncVersion(prev => prev + 1);
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    void refreshData();
    
    const handleReload = () => void refreshData();
    window.addEventListener('kiora_reload_inventory', handleReload);
    
    const interval = setInterval(() => {
      void refreshData();
    }, 30000); // 30s is enough for names map
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('kiora_reload_inventory', handleReload);
    };
  }, [refreshData]);

  return (
    <StockContext.Provider value={{ stockSyncVersion, notifyStockChange, lowStockItems, productMap }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStockSync = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStockSync must be used within a StockProvider');
  }
  return context;
};
