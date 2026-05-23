import { create } from 'zustand';
import { productService } from '@/config/setup';
import { pushAppNotification } from '@/lib/pushAppNotification';
import { getCache, setCache } from '@/lib/cache';

let lastLowStockPush = 0;
import type { Product, Category } from '@/models/Product';

interface InventoryState {
  products: Product[];
  categories: Category[];
  lowStockItems: Product[];
  productMap: Record<string, string>;
  isLoading: boolean;
  lastUpdate: number;
  stockSyncVersion: number;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
  notifyStockChange: () => void;
  updateProductStock: (cod_prod: number, newStock: number) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  categories: [],
  lowStockItems: [],
  productMap: {},
  isLoading: false,
  lastUpdate: 0,
  stockSyncVersion: 0,

  fetchProducts: async () => {
    set({ isLoading: true });

    // Cargar desde caché primero
    const cached = getCache<Product[]>('products');
    if (cached) {
      const map: Record<string, string> = {};
      cached.forEach((p) => { if (p.cod_prod) map[String(p.cod_prod)] = p.nom_prod; });
      set({ products: cached, productMap: map, isLoading: false, lastUpdate: Date.now() });
    }

    try {
      const res = await productService.getProducts(1, 1000);
      const products = res.data || [];
      console.log('[InventoryStore] Products received:', products.length);
      
      const map: Record<string, string> = {};
      products.forEach((p) => { 
        if (p.cod_prod) map[String(p.cod_prod)] = p.nom_prod; 
      });
      
      set({
        products,
        productMap: map,
        lastUpdate: Date.now(),
        isLoading: false
      });
      setCache('products', products);
    } catch (error) {
      console.error('[InventoryStore] Error fetching products:', error);
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await productService.getCategories();
      const categories = (Array.isArray(res) ? res : (res?.data || [])) as Category[];
      set({ categories });
    } catch (error) {
      console.error('Error fetching categories in store:', error);
    }
  },

  fetchLowStock: async () => {
    try {
      const res = await productService.getLowStock();
      const lowStockItems = res && 'data' in res ? (res as any).data : (Array.isArray(res) ? res : []);
      set({ lowStockItems });
    } catch (error) {
      console.error('Error fetching low stock in store:', error);
      pushAppNotification('error', 'Inventario', 'No se pudieron cargar las alertas de stock bajo.', {
        category: 'stock',
        toast: false,
      });
    }
  },

  notifyStockChange: () => {
    set((state) => ({ stockSyncVersion: state.stockSyncVersion + 1 }));
    void get().fetchProducts();
    void get().fetchLowStock();
  },

  updateProductStock: (cod_prod, newStock) => {
    set((state) => ({
      products: state.products.map((p) => 
        p.cod_prod === cod_prod ? { ...p, stock_actual: newStock } : p
      )
    }));
  }
}));
