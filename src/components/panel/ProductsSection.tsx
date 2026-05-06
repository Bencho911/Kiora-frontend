import { useState, useEffect, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import { productService, alertService, authService, inventoryService } from '@/config/setup';
import type { Product, Category } from '@/models/Product';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { ProductDrawer } from './ProductDrawer';
import { CategoryModal } from './CategoryModal';
import { MovementDetailModal } from './MovementDetailModal';
import type { Movement } from '@/models/Inventory';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api';
const IMG_BASE = API_URL.replace('/api', '');

function getImageUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  const cleanBase = IMG_BASE.endsWith('/') ? IMG_BASE.slice(0, -1) : IMG_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Real active filters
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    categories: [] as number[],
    stock: 'all' as 'all' | 'low' | 'out',
    minPrice: '',
    maxPrice: ''
  });

  // Pending filters (UI state)
  const [pendingFilters, setPendingFilters] = useState({ ...activeFilters });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  // Movements state for Drawer
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);

  const isAdmin = authService.isAdmin();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, c] = await Promise.all([
        productService.getProducts(),
        productService.getCategories()
      ]);
      setProducts(Array.isArray(p) ? p : (p?.data || []));
      setCategories(Array.isArray(c) ? c : (c?.data || []));
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cargar datos'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadMovements = useCallback(async (productId: number) => {
    setLoadingMovements(true);
    try {
      const data = await inventoryService.getMovements(productId);
      setMovements(data && 'data' in data ? data.data : (Array.isArray(data) ? data : []));
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cargar movimientos'));
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const handleSaveProduct = async (dto: any, isEdit: boolean) => {
    try {
      if (isEdit && selectedProduct?.cod_prod) {
        await productService.updateProduct(selectedProduct.cod_prod, dto);
        alertService.showToast('success', 'Producto actualizado');
      } else {
        await productService.createProduct(dto);
        alertService.showToast('success', 'Producto creado');
      }
      loadData();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al guardar producto'));
      throw e;
    }
  };

  const handleSaveMovement = async (mov: any) => {
    try {
      await inventoryService.createMovement(mov);
      alertService.showToast('success', 'Movimiento registrado');
      if (mov.cod_prod) await loadMovements(mov.cod_prod);
      loadData(); // refresh stock in list
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al registrar movimiento'));
      throw e;
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    
    const { search, categories: selCats, stock, minPrice, maxPrice } = activeFilters;

    if (selCats.length > 0) {
      result = result.filter(p => p.fk_cod_cats?.some(c => selCats.includes(c)));
    }

    if (stock === 'low') result = result.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 5) && (p.stock_actual || 0) > 0);
    if (stock === 'out') result = result.filter(p => (p.stock_actual || 0) === 0);

    if (minPrice !== '') result = result.filter(p => (p.precio_prod || 0) >= Number(minPrice));
    if (maxPrice !== '') result = result.filter(p => (p.precio_prod || 0) <= Number(maxPrice));

    if (search.trim()) {
      const fuse = new Fuse(result, { keys: ['nom_prod', 'desc_prod', 'cod_prod'], threshold: 0.3 });
      result = fuse.search(search).map(r => r.item);
    }

    return result;
  }, [products, activeFilters]);

  const handleApplyFilters = () => {
    setActiveFilters({ ...pendingFilters });
    setShowFilters(false);
    alertService.showToast('success', 'Filtros aplicados');
  };

  const handleClearFilters = () => {
    const cleared = {
      search: '',
      categories: [],
      stock: 'all' as const,
      minPrice: '',
      maxPrice: ''
    };
    setPendingFilters(cleared);
    setActiveFilters(cleared);
  };

  const handleDelete = async (id: number) => {
    if (await alertService.showConfirm('¿Eliminar Producto?', 'Esta acción es irreversible.', 'Sí, eliminar', 'Cancelar')) {
      try {
        await productService.deleteProduct(id);
        alertService.showToast('success', 'Producto eliminado');
        loadData();
      } catch (e) { alertService.showToast('error', getErrorMessage(e, 'Error al eliminar')); }
    }
  };

  const stockBadgeColor = (p: Product) => {
    const stock = p.stock_actual || 0;
    if (stock <= 0) return 'bg-red-500';
    if (stock <= (p.stock_minimo || 5)) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const toggleCategoryPending = (id: number) => {
    setPendingFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(id) 
        ? prev.categories.filter(c => c !== id) 
        : [...prev.categories, id]
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ec131e]/5 border border-[#ec131e]/10">
            <div className="h-2 w-2 rounded-full bg-[#ec131e] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ec131e]">Inventario Maestro</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Productos <span className="text-[#ec131e]">&</span> Stock
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`rounded-2xl px-6 py-3.5 text-sm font-black transition-all flex items-center gap-2 ${showFilters ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-[#ec131e]/30'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Filtros
          </button>
          <button onClick={() => setIsCategoryModalOpen(true)} className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:ring-[#ec131e]/30 transition-all">Categorías</button>
          {isAdmin && (
            <button onClick={() => { setSelectedProduct(null); setIsDrawerOpen(true); }} className="rounded-2xl bg-[#ec131e] px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-[#ec131e]/20 transition-all hover:bg-[#d01019]">Nuevo Producto</button>
          )}
        </div>
      </header>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50 space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Buscador</label>
              <input
                type="text"
                placeholder="Nombre o código..."
                value={pendingFilters.search}
                onChange={e => setPendingFilters(p => ({ ...p, search: e.target.value }))}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 px-5 text-sm font-bold focus:border-[#ec131e] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rango de Precio</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={pendingFilters.minPrice} onChange={e => setPendingFilters(p => ({ ...p, minPrice: e.target.value }))} className="w-1/2 rounded-2xl border border-slate-100 bg-slate-50 py-4 px-4 text-sm font-bold focus:border-[#ec131e] focus:bg-white transition-all" />
                <input type="number" placeholder="Max" value={pendingFilters.maxPrice} onChange={e => setPendingFilters(p => ({ ...p, maxPrice: e.target.value }))} className="w-1/2 rounded-2xl border border-slate-100 bg-slate-50 py-4 px-4 text-sm font-bold focus:border-[#ec131e] focus:bg-white transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categorías</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c.cod_cat}
                  onClick={() => toggleCategoryPending(c.cod_cat!)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border capitalize ${pendingFilters.categories.includes(c.cod_cat!) ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                >
                  {c.nom_cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <button onClick={handleClearFilters} className="px-8 py-3 rounded-2xl ring-1 ring-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Limpiar</button>
            <button onClick={handleApplyFilters} className="px-10 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Aplicar Filtros</button>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-80 bg-white border border-slate-50 rounded-[2.5rem] animate-pulse" />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
          <p className="font-black text-xl text-slate-800">No hay resultados</p>
          <button onClick={handleClearFilters} className="mt-4 text-[#ec131e] font-black text-xs uppercase tracking-widest">Resetear filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(p => (
            <div key={p.cod_prod} className="group flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
              <div className="h-48 w-full overflow-hidden bg-white relative">
                {p.imagen_prod ? (
                  <img src={getImageUrl(p.imagen_prod)} alt={p.nom_prod} className="h-full w-full object-contain p-6" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-100 font-black text-4xl">?</div>
                )}
                <span className={`absolute top-4 right-4 rounded-full px-3 py-1 text-[9px] font-black uppercase text-white ${stockBadgeColor(p)}`}>STOCK: {p.stock_actual}</span>
              </div>
              <div className="p-7 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{p.nom_prod}</h3>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xl font-black text-slate-900"><span className="text-xs text-[#ec131e] mr-0.5">$</span>{(Number(p.precio_prod) || 0).toLocaleString('es-CO')}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedProduct(p); setIsDrawerOpen(true); }} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(p.cod_prod!)} className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:text-red-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDrawer 
        isOpen={isDrawerOpen} 
        product={selectedProduct} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={loadData}
        categories={categories}
        movements={movements}
        loadingMovements={loadingMovements}
        onSave={handleSaveProduct}
        onSaveMovement={handleSaveMovement}
        onLoadMovements={loadMovements}
        onViewMovement={(m) => setDetailMovement(m)}
      />

      {detailMovement && (
        <MovementDetailModal
          movement={detailMovement}
          productName={selectedProduct?.nom_prod}
          onClose={() => setDetailMovement(null)}
        />
      )}
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={loadData} />
    </div>
  );
}
