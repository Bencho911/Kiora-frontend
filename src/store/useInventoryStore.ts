import { create } from 'zustand';
import { productService } from '@/config/setup';
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
    try {
      console.log('[InventoryStore] Starting fetchProducts...');
      const res = await productService.getProducts(); // Usamos valores por defecto (1, 20) como en useProductManager
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
