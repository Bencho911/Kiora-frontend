import type { Product } from '@/models/Product';
import { getImageUrl } from '@/config/setup';
import React, { useMemo, useState } from 'react';
import { ProductGridSkeleton } from '@/components/ui/ProductSkeleton';
import { useSalesStore } from '@/store/useSalesStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useDebounce } from '@/hooks/useDebounce';
import Fuse from 'fuse.js';

export function OrderDrawer() {
  const {
    isOrderDrawerOpen: drawerOpen,
    setIsOrderDrawerOpen,
    prodSearch,
    setProdSearch,
    selectedCategoryId,
    setSelectedCategoryId,
    orderForm,
    setOrderForm,
    addToCart,
    removeFromCart,
    updateQuantity,
    resetCart,
    handleCreateOrder,
    isSavingOrder: saving
  } = useSalesStore();

  const { products: allProducts, categories, isLoading, fetchProducts, fetchCategories } = useInventoryStore();

  React.useEffect(() => {
    if (drawerOpen) {
      void fetchProducts();
      void fetchCategories();
    }
  }, [drawerOpen, fetchProducts, fetchCategories]);

  const debouncedSearch = useDebounce(prodSearch, 250);

  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (selectedCategoryId) {
      result = result.filter(p => p.fk_cod_cats?.some(catId => Number(catId) === Number(selectedCategoryId)));
    }
    const q = debouncedSearch.trim();
    if (q) {
      const fuse = new Fuse(result, {
        keys: ['nom_prod', 'cod_prod'],
        threshold: 0.3,
        distance: 100
      });
      result = fuse.search(q).map(r => r.item);
    }
    return result;
  }, [allProducts, debouncedSearch, selectedCategoryId]);

  const cartTotal = useMemo(() => {
    return orderForm.items.reduce((acc, item) => acc + (item.cantidad * (item.precio_unit || 0)), 0);
  }, [orderForm.items]);

  const safePrice = (v: unknown) => Number(v) || 0;

  if (!drawerOpen) return null;

  const onClose = () => setIsOrderDrawerOpen(false);
  const onCancelOrder = () => resetCart();

  const payMethods = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'tarjeta', label: 'Tarjeta' },
    { id: 'digital', label: 'Digital' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar nueva venta" />

      <div className="relative ml-auto h-full w-full max-w-5xl bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-4 sm:px-5 sm:py-4 bg-surface shrink-0">
          <div>
            <h2 className="headline-sm text-on-surface">
              Punto de <span className="text-primary">Venta</span>
            </h2>
            <p className="label-sm text-on-surface-variant hidden sm:block mt-0.5">Gestiona tu nueva venta de forma ágil</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-surface-container-low min-h-0">

          {/* ── Product Selector ── */}
          <div className="flex-[3] lg:flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-outline-variant/30 bg-surface min-h-[40vh] lg:min-h-0">
            <div className="p-3 sm:p-4 border-b border-outline-variant/30 space-y-3 shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-low py-2.5 pl-9 pr-3 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-3 py-1.5 rounded-lg label-sm whitespace-nowrap border transition-all ${
                    selectedCategoryId === null
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline'
                  }`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.cod_cat}
                    onClick={() => setSelectedCategoryId(cat.cod_cat!)}
                    className={`px-3 py-1.5 rounded-lg label-sm whitespace-nowrap border transition-all ${
                      selectedCategoryId === cat.cod_cat
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline'
                    }`}
                  >
                    {cat.nom_cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 content-start">
              {isLoading ? (
                <div className="col-span-full"><ProductGridSkeleton count={8} /></div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-surface rounded-2xl border border-outline-variant/30 mx-1">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">search_off</span>
                  <p className="label-md text-on-surface-variant">Sin resultados</p>
                  <p className="body-md text-on-surface-variant mt-1">Intenta cambiar la categoría o término de búsqueda.</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const outOfStock = (p.stock_actual || 0) <= 0;
                  const stock = p.stock_actual || 0;
                  const min = p.stock_minimo || 5;
                  
                  return (
                    <button
                      key={p.cod_prod}
                      onClick={() => !outOfStock && addToCart(p)}
                      disabled={outOfStock}
                      title={p.nom_prod} // Tooltip nativo para ver el nombre al pasar el mouse
                      className={`group aspect-[4/3] flex items-center justify-center bg-surface p-4 rounded-2xl border border-outline-variant/30 transition-all overflow-hidden relative ${
                        outOfStock ? 'opacity-50 cursor-not-allowed bg-surface-container-low grayscale' : 'hover:shadow-md hover:border-primary/30 active:scale-95'
                      }`}
                    >
                      {/* Precio flotante */}
                      <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm z-10 pointer-events-none border border-outline-variant/20">
                        <span className="text-sm font-bold text-on-surface">
                          <span className="text-[10px] text-primary mr-0.5">$</span>
                          {safePrice(p.precio_prod).toLocaleString('es-CO')}
                        </span>
                      </div>

                      {/* Stock flotante */}
                      <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md shadow-sm z-10 pointer-events-none text-[10px] font-bold border backdrop-blur-md ${
                        outOfStock
                          ? 'bg-surface-container-high/90 text-on-surface-variant border-outline-variant/50'
                          : stock <= min
                            ? 'bg-error-container/90 text-error border-error/20'
                            : 'bg-surface/80 text-tertiary border-outline-variant/20'
                      }`}>
                        {outOfStock ? 'Agotado' : `${stock} uds`}
                      </div>

                      {p.imagen_prod ? (
                        <img
                          src={getImageUrl(p.imagen_prod)}
                          alt={p.nom_prod}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="label-sm text-on-surface text-center line-clamp-3 leading-tight px-4">{p.nom_prod}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Cart ── */}
          <div className="flex-[4] lg:flex-none w-full lg:w-[380px] flex flex-col bg-surface-dim lg:border-l border-outline-variant/30 z-10 min-h-[45vh] lg:min-h-0">
            <div className="p-3 sm:p-4 border-b border-outline-variant/30 bg-surface flex items-center justify-between shrink-0">
              <h3 className="label-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>shopping_cart</span>
                Carrito
              </h3>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded label-sm">
                {orderForm.items.length} ITEM{orderForm.items.length !== 1 && 'S'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-0">
              {orderForm.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-6 animate-in zoom-in-95 duration-500">
                  <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center mb-4 shadow-sm border border-outline-variant/30 text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                  </div>
                  <p className="label-md text-on-surface-variant">Carrito vacío</p>
                  <p className="body-md text-on-surface-variant mt-1">Toca los productos del catálogo para agregarlos.</p>
                </div>
              ) : (
                orderForm.items.map((item) => (
                  <div key={item.cod_prod} className="flex gap-2 sm:gap-3 bg-surface p-2.5 sm:p-3 rounded-xl border border-outline-variant/30 shadow-sm">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-surface-container-low shrink-0 border border-outline-variant/20">
                      {item.url_imagen ? (
                        <img src={getImageUrl(item.url_imagen)} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-on-surface-variant/40">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <h5 className="text-xs font-semibold text-on-surface line-clamp-1 leading-tight pr-2 break-words">{item.nom_prod}</h5>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-0.5 border border-outline-variant/50 rounded-lg p-0.5 bg-surface-container-low">
                          <button onClick={() => updateQuantity(item.cod_prod, -1)} className="w-6 h-6 flex items-center justify-center bg-surface rounded-md shadow-sm border border-outline-variant/30 hover:text-primary font-bold transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>remove</span>
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-on-surface">{item.cantidad}</span>
                          <button onClick={() => updateQuantity(item.cod_prod, 1)} className="w-6 h-6 flex items-center justify-center bg-surface rounded-md shadow-sm border border-outline-variant/30 hover:text-primary font-bold transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                          </button>
                        </div>
                        <span className="text-sm font-bold text-tertiary">
                          <span className="text-[9px] font-bold mr-0.5 text-tertiary">$</span>
                          {(item.cantidad * safePrice(item.precio_unit)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cod_prod)}
                      className="p-1 self-start text-on-surface-variant/40 hover:bg-error-container/30 hover:text-error rounded-lg transition-colors"
                      aria-label="Remover"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ── Checkout Footer ── */}
            <div className="p-4 sm:p-5 bg-surface border-t border-outline-variant/30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] shrink-0">
              <div className="space-y-3">
                {/* Payment method */}
                <div className="space-y-2">
                  <label className="label-sm text-on-surface-variant">Método de pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {payMethods.map(m => {
                      const active = orderForm.metodopago_usu === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setOrderForm({ ...orderForm, metodopago_usu: m.id })}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all active:scale-[0.98] ${
                            active
                              ? 'bg-primary/5 border-primary text-primary label-sm'
                              : 'bg-surface border-outline-variant/30 text-on-surface-variant label-sm hover:border-outline'
                          }`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {m.id === 'efectivo' ? 'payments' : m.id === 'tarjeta' ? 'credit_card' : 'smartphone'}
                          </span>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-end justify-between pt-2 border-t border-outline-variant/20">
                  <span className="label-sm text-on-surface-variant">Total a Cobrar</span>
                  <p className="headline-md text-tertiary flex items-start">
                    <span className="text-base mt-0.5 mr-0.5">$</span>
                    {cartTotal.toLocaleString('es-CO')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onCancelOrder}
                    disabled={saving || orderForm.items.length === 0}
                    className="w-full rounded-lg border border-outline-variant/50 py-2.5 label-sm text-on-surface-variant hover:bg-error-container/30 hover:text-error hover:border-error/30 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    Cancelar Pedido
                  </button>

                  <button
                    onClick={() => { handleCreateOrder(); }}
                    disabled={saving || orderForm.items.length === 0}
                    className="w-full rounded-lg bg-primary text-on-primary py-3 label-md shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                        Realizar Cobro
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
