import type { Product } from '@/models/Product';
import { getImageUrl } from '@/config/setup';
import React, { useMemo, useState } from 'react';
import { ProductGridSkeleton } from '@/components/ui/ProductSkeleton';
import { useSalesStore } from '@/store/useSalesStore';
import { useInventoryStore } from '@/store/useInventoryStore';
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

  const filteredProducts = useMemo(() => {
    let result = allProducts;
    if (selectedCategoryId) {
      result = result.filter(p => p.fk_cod_cats?.includes(selectedCategoryId));
    }
    const q = prodSearch.trim();
    if (q) {
      const fuse = new Fuse(result, {
        keys: ['nom_prod', 'cod_prod'],
        threshold: 0.3,
        distance: 100
      });
      result = fuse.search(q).map(r => r.item);
    }
    return result;
  }, [allProducts, prodSearch, selectedCategoryId]);

  const cartTotal = useMemo(() => {
    return orderForm.items.reduce((acc, item) => acc + (item.cantidad * (item.precio_unit || 0)), 0);
  }, [orderForm.items]);

  const safePrice = (v: unknown) => Number(v) || 0;

  if (!drawerOpen) return null;

  const onClose = () => setIsOrderDrawerOpen(false);
  const onCancelOrder = () => resetCart();

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
        aria-label="Cerrar nueva venta"
      />

      {/* Panel — full screen on mobile, side drawer on lg+ */}
      <div className="relative ml-auto h-full w-full max-w-5xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5 bg-white z-10 relative shadow-sm shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              Punto de <span className="text-[#ec131e]">Venta</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">Gestiona tu nueva venta de forma ágil</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-50 p-2.5 text-slate-500 hover:bg-[#ec131e]/10 hover:text-[#ec131e] transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/30 min-h-0">

          {/* ── Product Selector (Top half on mobile, Left on desktop) ── */}
          <div className="flex-[3] lg:flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 bg-white min-h-[40vh] lg:min-h-0">
            <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3 shrink-0">
              <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#ec131e] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#ec131e] focus:outline-none focus:ring-4 focus:ring-[#ec131e]/10 transition-all shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategoryId === null ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.cod_cat}
                    onClick={() => setSelectedCategoryId(cat.cod_cat!)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategoryId === cat.cod_cat ? 'bg-[#ec131e] text-white border-[#ec131e] shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    {cat.nom_cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 content-start">
              {isLoading ? (
                <div className="col-span-full">
                  <ProductGridSkeleton count={6} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-100 shadow-sm mx-2">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                     <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="text-sm font-black text-slate-700">Sin resultados</p>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">Intenta cambiar la categoría o término de búsqueda.</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const stock = p.stock_actual || 0;
                  const min = p.stock_minimo || 5;
                  const outOfStock = stock <= 0;
                  return (
                    <button
                      key={p.cod_prod}
                      onClick={() => !outOfStock && addToCart(p)}
                      disabled={outOfStock}
                      className={`group flex flex-col items-start bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-100 text-left transition-all relative overflow-hidden ${outOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-[#ec131e]/30 hover:shadow-xl hover:shadow-[#ec131e]/5 hover:-translate-y-0.5'}`}
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2 border border-slate-50 relative shrink-0">
                        {p.imagen_prod ? (
                          <img
                            src={getImageUrl(p.imagen_prod)}
                            alt={p.nom_prod}
                            className="w-full h-full object-contain p-1.5 group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-2 group-hover:text-[#ec131e] transition-colors leading-tight text-xs sm:text-sm">
                        {p.nom_prod}
                      </h4>
                      <div className="mt-auto flex items-end justify-between pt-2 w-full">
                        <span className="text-base sm:text-lg font-black text-[#111827]">
                          <span className="text-[10px] font-bold text-[#ec131e] mr-0.5">$</span>
                          {safePrice(p.precio_prod).toLocaleString('es-CO')}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider border ${outOfStock ? 'bg-slate-100 text-slate-500 border-slate-200' : stock <= min ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          {outOfStock ? 'Agotado' : `${stock}`}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Cart Section (Bottom half on mobile, Right on desktop) ── */}
          <div className="flex-[4] lg:flex-none w-full lg:w-[380px] flex flex-col bg-slate-50 lg:border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-10 min-h-[45vh] lg:min-h-0">
            <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <svg className="h-4 w-4 text-[#ec131e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Carrito
              </h3>
              <span className="bg-[#ec131e]/10 text-[#ec131e] px-2 py-0.5 rounded text-[10px] font-black tracking-wider">
                {orderForm.items.length} ITEM{orderForm.items.length !== 1 && 'S'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-0">
              {orderForm.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-6 animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200 text-slate-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-black text-slate-700">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">Toca los productos en el catálogo de arriba para agregarlos a la orden.</p>
                </div>
              ) : (
                orderForm.items.map((item) => (
                  <div key={item.cod_prod} className="flex gap-2 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                      {item.url_imagen ? (
                        <img src={getImageUrl(item.url_imagen)} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight pr-2">{item.nom_prod}</h5>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                          <button onClick={() => updateQuantity(item.cod_prod, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm border border-slate-100 hover:text-[#ec131e] font-black transition-colors">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                          </button>
                          <span className="w-7 text-center text-xs font-black text-slate-800">{item.cantidad}</span>
                          <button onClick={() => updateQuantity(item.cod_prod, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm border border-slate-100 hover:text-[#ec131e] font-black transition-colors">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                        {/* Price in green — income */}
                        <span className="text-sm font-black text-emerald-600">
                          <span className="text-[9px] font-bold mr-0.5 text-emerald-500">$</span>
                          {(item.cantidad * safePrice(item.precio_unit)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cod_prod)}
                      className="p-1 self-start text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                      aria-label="Remover"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ── Checkout Footer ── */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Payment method */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de pago</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { id: 'efectivo', label: 'Efectivo', activeClass: 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-200/50', iconBg: 'bg-emerald-100', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                      { id: 'tarjeta', label: 'Tarjeta', activeClass: 'bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-200/50', iconBg: 'bg-blue-100', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                      { id: 'digital', label: 'Digital', activeClass: 'bg-purple-50 border-purple-500 text-purple-700 shadow-md shadow-purple-200/50', iconBg: 'bg-purple-100', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                    ].map(m => {
                      const active = orderForm.metodopago_usu === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setOrderForm({ ...orderForm, metodopago_usu: m.id })}
                          className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-2xl border-2 transition-all active:scale-95 ${active ? m.activeClass : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          <div className={`p-1 rounded-lg ${active ? m.iconBg : 'bg-slate-50'}`}>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d={m.icon} />
                            </svg>
                          </div>
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total — green for income */}
                <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total a Cobrar</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 flex items-start -mr-1">
                    <span className="text-base text-emerald-500 mt-1 mr-0.5">$</span>
                    {cartTotal.toLocaleString('es-CO')}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onCancelOrder}
                    disabled={saving || orderForm.items.length === 0}
                    className="w-full rounded-2xl border border-slate-200 py-2.5 sm:py-3 text-xs font-black text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Cancelar Pedido
                  </button>

                  <button
                    onClick={() => { handleCreateOrder(); }}
                    disabled={saving || orderForm.items.length === 0}
                    className="group relative w-full overflow-hidden rounded-2xl bg-[#111827] py-3.5 sm:py-4 text-sm font-black text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {saving ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          PROCESANDO...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          REALIZAR COBRO
                        </>
                      )}
                    </span>
                    {!saving && orderForm.items.length > 0 && (
                      <div className="absolute inset-0 h-full w-0 bg-[#ec131e] transition-all duration-300 ease-out group-hover:w-full opacity-10"></div>
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
