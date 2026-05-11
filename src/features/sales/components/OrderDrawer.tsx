import type { Product } from '@/models/Product';
import { getImageUrl } from '@/config/setup';
import React, { useMemo } from 'react';
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
        aria-label="Cerrar nueva venta"
      />
      <div className="relative ml-auto h-full w-full max-w-5xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white z-10 relative shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Punto de <span className="text-[#ec131e]">Venta</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Gestiona tu nueva venta de forma ágil</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-50 p-2.5 text-slate-500 hover:bg-[#ec131e]/10 hover:text-[#ec131e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec131e]/20"
            aria-label="Cerrar cajón"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50/30">

          {/* Product Selector Section */}
          <div className="flex-1 flex flex-col border-r border-slate-100 bg-white">
            <div className="p-4 border-b border-slate-100 space-y-4">
              <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#ec131e] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#ec131e] focus:outline-none focus:ring-4 focus:ring-[#ec131e]/10 transition-all shadow-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategoryId === null
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.cod_cat}
                    onClick={() => setSelectedCategoryId(cat.cod_cat!)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategoryId === cat.cod_cat
                        ? 'bg-[#ec131e] text-white border-[#ec131e] shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {cat.nom_cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
              {isLoading ? (
                <div className="col-span-full">
                  <ProductGridSkeleton count={8} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-600">No se encontraron productos</p>
                  <p className="text-xs text-slate-500 mt-1">Intenta cambiar la categoría o el término de búsqueda.</p>
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
                      className={`group flex flex-col items-start bg-white p-3 rounded-2xl border border-slate-100 text-left transition-all relative overflow-hidden ${outOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-[#ec131e]/30 hover:shadow-xl hover:shadow-[#ec131e]/5 hover:-translate-y-1'
                        }`}
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 border border-slate-50 relative shrink-0">
                        {p.imagen_prod ? (
                          <img
                            src={getImageUrl(p.imagen_prod)}
                            alt={p.nom_prod}
                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 line-clamp-2 group-hover:text-[#ec131e] transition-colors leading-tight min-h-[2.5rem] text-sm">
                        {p.nom_prod}
                      </h4>
                      <div className="mt-auto flex items-end justify-between pt-3 w-full">
                        <span className="text-lg font-black text-[#111827]">
                          <span className="text-xs font-bold text-[#ec131e] mr-0.5">$</span>
                          {safePrice(p.precio_prod).toLocaleString('es-CO')}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md tracking-wider border flex items-center gap-1 ${outOfStock ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            stock <= min ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                          {outOfStock ? 'Agotado' : `Stock: ${stock}`}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="w-full md:w-[400px] flex flex-col bg-slate-50 border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-10">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {orderForm.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-6">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-600 block">Tu carrito está vacío.</p>
                  <p className="text-xs text-slate-500 mt-1">Selecciona productos del listado para comenzar una nueva venta.</p>
                </div>
              ) : (
                orderForm.items.map((item) => (
                  <div key={item.cod_prod} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-right-2 duration-300 transition-all hover:border-slate-300">
                    {/* Item image thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                      {item.url_imagen ? (
                        <img src={getImageUrl(item.url_imagen)} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-2 pr-4">{item.nom_prod}</h5>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50 w-fit">
                          <button
                            onClick={() => updateQuantity(item.cod_prod, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm border border-slate-100 hover:text-[#ec131e] font-black transition-colors focus:outline-none"
                            aria-label="Disminuir cantidad"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-800">{item.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(item.cod_prod, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm border border-slate-100 hover:text-[#ec131e] font-black transition-colors focus:outline-none"
                            aria-label="Aumentar cantidad"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                        <span className="text-sm font-black text-[#111827]">
                          <span className="text-[10px] text-slate-400 font-bold mr-0.5">$</span>
                          {(item.cantidad * safePrice(item.precio_unit)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-start">
                      <button
                        onClick={() => removeFromCart(item.cod_prod)}
                        className="p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors focus:outline-none"
                        aria-label="Remover del carrito"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Método de pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderForm({ ...orderForm, metodopago_usu: 'efectivo' })}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${orderForm.metodopago_usu === 'efectivo'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-200/50'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg ${orderForm.metodopago_usu === 'efectivo' ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider">Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderForm({ ...orderForm, metodopago_usu: 'tarjeta' })}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${orderForm.metodopago_usu === 'tarjeta'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-200/50'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg ${orderForm.metodopago_usu === 'tarjeta' ? 'bg-blue-100' : 'bg-slate-50'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider">Tarjeta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderForm({ ...orderForm, metodopago_usu: 'digital' })}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${orderForm.metodopago_usu === 'digital'
                          ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md shadow-purple-200/50'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg ${orderForm.metodopago_usu === 'digital' ? 'bg-purple-100' : 'bg-slate-50'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider">Digital</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total a Cobrar</span>
                  <p className="text-3xl font-black text-[#111827] flex items-start -mr-1">
                    <span className="text-base text-[#ec131e] mt-1 mr-1">$</span>
                    {cartTotal.toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={onCancelOrder}
                    disabled={saving || orderForm.items.length === 0}
                    className="w-full rounded-2xl border border-slate-200 py-3 text-xs font-black text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    CANCELAR PEDIDO
                  </button>

                  <button
                    onClick={() => { handleCreateOrder(); }}
                    disabled={saving || orderForm.items.length === 0}
                    className="group relative w-full overflow-hidden rounded-2xl bg-[#111827] py-4 text-sm font-black text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-[#111827] disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-slate-900/10"
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
