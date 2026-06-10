import { useState, useEffect, useRef } from 'react';
import { authService, getImageUrl } from '@/config/setup';
import type { Product } from '@/models/Product';
import { ProductDrawer } from './ProductDrawer';
import { MovementDetailModal } from '@/features/inventory/components/MovementDetailModal';
import { KardexDrawer } from '@/features/inventory/components/KardexDrawer';
import { useProductManager } from '@/hooks/useProductManager';
import { useAppStore } from '@/store/useAppStore';
import { useScrollLock } from '@/hooks/useScrollLock';

export function ProductsSection() {
  const isAdmin = authService.isAdmin();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [kardexProduct, setKardexProduct] = useState<Product | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const [observerTarget, setObserverTarget] = useState<HTMLDivElement | null>(null);

  const {
    categories, isLoading,
    pendingFilters, setPendingFilters,
    selectedProduct, setSelectedProduct,
    isDrawerOpen, setIsDrawerOpen,
    showFilters, setShowFilters,
    movements, loadingMovements,
    detailMovement, setDetailMovement,
    loadData, loadMovements,
    handleSaveProduct, handleSaveMovement,
    filteredProducts,
    handleApplyFilters, handleClearFilters, handleDelete,
    stockBadgeColor, toggleCategoryPending
  } = useProductManager();

  const totalProducts = filteredProducts.length;
  const outOfStockCount = filteredProducts.filter(p => p.stock_actual <= 0).length;
  const lowStockCount = filteredProducts.filter(p => p.stock_actual > 0 && p.stock_actual <= 5).length;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(15);
  }, [filteredProducts.length]);

  useEffect(() => {
    if (!observerTarget) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 15);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [observerTarget]);

  // Lock body scroll when any modal/drawer is open
  useScrollLock(isDrawerOpen || !!productToDelete || !!detailMovement || !!kardexProduct);

  return (
    <div className="flex-1 flex flex-col min-h-screen min-w-0">
      <main className="flex-1 px-4 md:px-8 pb-12 w-full animate-in fade-in duration-500 max-w-[1600px] mx-auto min-w-0">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h2 className="headline-lg text-on-surface">Inventario</h2>
            <p className="body-md text-on-surface-variant mt-1">Gestiona tus productos, categorías y control de stock.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => useAppStore.getState().setActiveTab('categorias')}
              className="flex-1 sm:flex-none bg-surface text-on-surface-variant border border-outline-variant/50 label-md px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low hover:text-on-surface transition-colors active:scale-[0.98]">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>category</span>
              Categorías
            </button>
            {isAdmin && (
              <button
                onClick={() => { setSelectedProduct(null); setIsDrawerOpen(true); }}
                className="flex-1 sm:flex-none bg-primary text-on-primary label-md px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98]">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                Nuevo Producto
              </button>
            )}
          </div>
        </div>

        {/* Inventory Quick Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-surface p-3 sm:p-5 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary-fixed/30 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] sm:text-[24px]">inventory_2</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mb-0.5">Total</p>
              <p className="text-base sm:text-2xl font-bold text-on-surface leading-tight">{totalProducts}</p>
            </div>
          </div>
          <div className="bg-surface p-3 sm:p-5 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] sm:text-[24px]">warning</span>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mb-0.5">Stock Bajo</p>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <p className="text-base sm:text-2xl font-bold text-on-surface leading-tight">{lowStockCount}</p>
                {lowStockCount > 0 && <span className="hidden sm:inline-block text-[10px] font-medium text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">Atención</span>}
              </div>
            </div>
          </div>
          <div className="bg-surface p-3 sm:p-5 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] sm:text-[24px]">error</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mb-0.5">Agotados</p>
              <p className="text-base sm:text-2xl font-bold text-error leading-tight">{outOfStockCount}</p>
            </div>
          </div>
        </div>

        {/* Product List Container */}
        <div className="bg-surface rounded-xl shadow-[0px_4px_12px_rgba(61,26,16,0.08)] border border-outline-variant/30 overflow-hidden flex flex-col">

          {/* Filters Toolbar */}
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest flex flex-col gap-4">
            {/* Row 1: Search + Category */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="relative w-full lg:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>search</span>
                </div>
                <input
                  type="text"
                  value={pendingFilters.search}
                  onChange={e => setPendingFilters(p => ({ ...p, search: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleApplyFilters(); }}
                  className="block w-full pl-10 pr-3 py-2.5 border border-outline-variant/50 rounded-lg leading-5 bg-surface-container-lowest placeholder-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary sm:text-sm transition-colors text-on-surface"
                  placeholder="Buscar por nombre, SKU o código..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>filter_list</span>
                  <span className="label-md text-on-surface hidden sm:inline">Categoría:</span>
                </div>
                <select
                  className="bg-surface-container-low border border-outline-variant/50 rounded-lg label-md text-on-surface focus:ring-primary/30 py-2 pl-3 pr-8"
                  value={pendingFilters.categories[0] ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setPendingFilters(p => ({ ...p, categories: val ? [Number(val)] : [] }));
                  }}
                >
                  <option value="">Todas</option>
                  {categories.map(c => (
                    <option key={c.cod_cat} value={c.cod_cat}>{c.nom_cat}</option>
                  ))}
                </select>
                <button onClick={handleApplyFilters} className="bg-primary text-on-primary label-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] whitespace-nowrap">
                  Aplicar
                </button>
                <button onClick={handleClearFilters} className="text-on-surface-variant hover:text-primary transition-colors label-sm px-2">
                  Limpiar
                </button>
              </div>
            </div>

            {/* Row 2: Price range + Stock status */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Price range */}
              <div className="flex items-center gap-2">
                <span className="label-sm text-on-surface-variant whitespace-nowrap">Precio:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Mín"
                    value={pendingFilters.minPrice}
                    onChange={e => setPendingFilters(p => ({ ...p, minPrice: e.target.value }))}
                    className="w-24 pl-6 pr-2 py-1.5 border border-outline-variant/50 rounded-lg text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <span className="text-on-surface-variant text-xs">—</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Máx"
                    value={pendingFilters.maxPrice}
                    onChange={e => setPendingFilters(p => ({ ...p, maxPrice: e.target.value }))}
                    className="w-24 pl-6 pr-2 py-1.5 border border-outline-variant/50 rounded-lg text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-outline-variant/40" />

              {/* Stock status pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="label-sm text-on-surface-variant whitespace-nowrap">Stock:</span>
                {([
                  { value: 'all',       label: 'Todos' },
                  { value: 'available', label: 'Disponible' },
                  { value: 'low',       label: 'Bajo' },
                  { value: 'out',       label: 'Agotado' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPendingFilters(p => ({ ...p, stock: opt.value }))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      pendingFilters.stock === opt.value
                        ? opt.value === 'available'
                          ? 'bg-teal-100 text-teal-700 border-teal-300'
                          : opt.value === 'low'
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : opt.value === 'out'
                          ? 'bg-error-container/60 text-error border-error/30'
                          : 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:border-outline-variant'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Data List (Cards) */}
          <div className="block lg:hidden divide-y divide-outline-variant/20 w-full">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-on-surface-variant label-md">Cargando inventario...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">inventory_2</span>
                <p className="headline-sm text-on-surface mb-2">No hay resultados</p>
                <p className="body-md text-on-surface-variant mb-4">Intenta ajustar los filtros o el término de búsqueda.</p>
                <button onClick={handleClearFilters} className="label-md text-primary hover:underline">Resetear filtros</button>
              </div>
            ) : (
              visibleProducts.map(p => {
                const isOutOfStock = p.stock_actual <= 0;
                const isLowStock = p.stock_actual > 0 && p.stock_actual <= 5;
                const catName = p.fk_cod_cats && p.fk_cod_cats.length > 0
                  ? p.fk_cod_cats.map(id => categories.find(c => c.cod_cat === id)?.nom_cat).filter(Boolean).join(', ')
                  : 'Sin Categoría';

                return (
                  <div key={p.cod_prod} className={`p-4 hover:bg-surface-container-lowest transition-colors flex flex-col gap-4 ${isOutOfStock ? 'bg-surface-container-high/40 opacity-70 grayscale' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 shrink-0 rounded-md flex items-center justify-center border ${isOutOfStock ? 'bg-surface-container-highest border-outline-variant/30 text-on-surface-variant' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant/50'}`}>
                          {p.imagen_prod ? (
                            <img src={getImageUrl(p.imagen_prod)} alt={p.nom_prod} className="w-full h-full object-cover rounded-md p-1 mix-blend-multiply" />
                          ) : (
                            <span className="material-symbols-outlined opacity-70">{isOutOfStock ? 'image_not_supported' : 'image'}</span>
                          )}
                        </div>
                        <div>
                          <p className={`label-lg font-bold transition-colors ${isOutOfStock ? 'text-on-surface-variant' : 'text-on-surface'}`}>{p.nom_prod}</p>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5" title={p.desc_prod}>{p.desc_prod || 'Sin descripción'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => setKardexProduct(p)} className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-md transition-colors" title="Ver Kardex y Lotes">
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>history</span>
                        </button>
                        <button onClick={() => { setSelectedProduct(p); setIsDrawerOpen(true); }} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-md transition-colors" title="Editar">
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                        </button>
                        {isAdmin && (
                          <button onClick={() => setProductToDelete(p)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-md transition-colors" title="Eliminar">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Código / SKU</span>
                        <span className="text-on-surface font-medium">{p.cod_prod}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Precio</span>
                        <span className="text-on-surface font-bold text-primary">${(Number(p.precio_prod) || 0).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Stock</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-error' : 'bg-tertiary'}`}></div>
                          <span className={`font-medium ${isOutOfStock ? 'text-error' : 'text-on-surface'}`}>{p.stock_actual} un.</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5">Estado</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${isOutOfStock ? 'bg-surface-container-highest text-on-surface-variant border-outline-variant/50' : isLowStock ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-teal-100 text-teal-700 border-teal-200'}`}>
                          {isOutOfStock ? 'Agotado' : isLowStock ? 'Bajo' : 'Activo'}
                        </span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant mb-0.5 block">Categoría</span>
                        <span className="inline-block bg-surface-container-high text-on-surface px-2 py-0.5 rounded text-xs font-medium">{catName}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Data Table */}
          <div className="hidden lg:block overflow-x-auto w-full">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-on-surface-variant label-md">Cargando inventario...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">inventory_2</span>
                <p className="headline-sm text-on-surface mb-2">No hay resultados</p>
                <p className="body-md text-on-surface-variant mb-4">Intenta ajustar los filtros o el término de búsqueda.</p>
                <button onClick={handleClearFilters} className="label-md text-primary hover:underline">Resetear filtros</button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-on-surface-variant label-sm">
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 font-semibold">Código / SKU</th>
                    <th className="px-6 py-4 font-semibold">Categoría</th>
                    <th className="px-6 py-4 font-semibold text-right">Precio Venta</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold text-center">Estado</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {visibleProducts.map(p => {
                    const isOutOfStock = p.stock_actual <= 0;
                    const isLowStock = p.stock_actual > 0 && p.stock_actual <= 5;
                    const catName = p.fk_cod_cats && p.fk_cod_cats.length > 0
                      ? p.fk_cod_cats.map(id => categories.find(c => c.cod_cat === id)?.nom_cat).filter(Boolean).join(', ')
                      : 'Sin Categoría';

                    return (
                      <tr key={p.cod_prod} className={`hover:bg-surface-container-lowest transition-colors group ${isOutOfStock ? 'bg-surface-container-high/40 opacity-70 grayscale' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-md flex items-center justify-center border ${isOutOfStock ? 'bg-surface-container-highest border-outline-variant/30 text-on-surface-variant' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant/50'}`}>
                              {p.imagen_prod ? (
                                <img src={getImageUrl(p.imagen_prod)} alt={p.nom_prod} className="w-full h-full object-cover rounded-md p-1 mix-blend-multiply" />
                              ) : (
                                <span className="material-symbols-outlined opacity-70">{isOutOfStock ? 'image_not_supported' : 'image'}</span>
                              )}
                            </div>
                            <div>
                              <p className={`label-md font-semibold transition-colors ${isOutOfStock ? 'text-on-surface-variant' : 'text-on-surface group-hover:text-primary'}`}>{p.nom_prod}</p>
                              <p className="label-sm text-on-surface-variant truncate max-w-[180px]" title={p.desc_prod}>{p.desc_prod || 'Sin descripción'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 body-md text-on-surface-variant">{p.cod_prod}</td>
                        <td className="px-6 py-4">
                          <span className="bg-surface-container-high text-on-surface px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider">{catName}</span>
                        </td>
                        <td className="px-6 py-4 label-md text-right">
                          {(Number(p.descuento) || 0) > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] line-through text-on-surface-variant/60">
                                ${(Number(p.precio_prod) || 0).toLocaleString('es-CO')}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  -{Number(p.descuento)}%
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  ${((Number(p.precio_prod) || 0) * (1 - (Number(p.descuento) || 0) / 100)).toLocaleString('es-CO')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-on-surface font-semibold">
                              <span className="text-xs text-primary font-bold mr-0.5">$</span>
                              {(Number(p.precio_prod) || 0).toLocaleString('es-CO')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-error' : 'bg-tertiary'}`}></div>
                            <span className={`label-md ${isOutOfStock ? 'text-error' : 'text-on-surface'}`}>
                              {p.stock_actual} un.
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isOutOfStock
                              ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/50'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-teal-100 text-teal-700 border-teal-200'
                          }`}>
                            {isOutOfStock ? 'Agotado' : isLowStock ? 'Stock Bajo' : 'Activo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setKardexProduct(p)}
                              className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-md transition-colors" title="Ver Kardex y Lotes">
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>history</span>
                            </button>
                            <button
                              onClick={() => { setSelectedProduct(p); setIsDrawerOpen(true); }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-md transition-colors" title="Editar">
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-md transition-colors" title="Eliminar">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ─── Infinite Scroll Observer ─── */}
          {visibleCount < filteredProducts.length && (
            <div ref={setObserverTarget} className="p-8 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>

      </main>

      <KardexDrawer 
        isOpen={!!kardexProduct} 
        product={kardexProduct} 
        onClose={() => setKardexProduct(null)} 
      />

      {/* Drawers y Modales subyacentes */}
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

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-outline-variant/30">
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-error-container/30 text-error flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <h3 className="headline-sm text-on-surface mb-2">¿Eliminar producto?</h3>
              <p className="body-md text-on-surface-variant mb-6">
                Estás a punto de eliminar <span className="font-semibold text-on-surface">{productToDelete.nom_prod}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant/50 text-on-surface label-md hover:bg-surface-container-low transition-colors active:scale-[0.98]">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDelete(productToDelete.cod_prod!);
                    setProductToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-error text-on-error label-md hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98]">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
