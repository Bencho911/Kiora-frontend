import type { Product } from '@/models/Product';
import { getImageUrl } from '@/config/setup';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ProductGridSkeleton } from '@/components/ui/ProductSkeleton';
import { useSalesStore } from '@/store/useSalesStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useDebounce } from '@/hooks/useDebounce';
import Fuse from 'fuse.js';
import { useScrollLock } from '@/hooks/useScrollLock';

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

  const [rfidState, setRfidState] = useState<'idle' | 'waiting' | 'approved' | 'error'>('idle');
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [rfidBuffer, setRfidBuffer] = useState('');

  // Ref al input de búsqueda para leer el valor inmediato (sin depender del estado React).
  // Los lectores de barras físicos envían caracteres muy rápido + Enter casi simultáneamente,
  // lo que causa que el estado de React (prodSearch) aún no se haya actualizado cuando
  // llega el evento onKeyDown('Enter'). Con la ref leemos el valor real del DOM directamente.
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleRfidInput = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && rfidBuffer.trim()) {
      setRfidState('approved');
      await new Promise(r => setTimeout(r, 600));
      setRfidState('idle');
      await handleCreateOrder();
    }
  };

  const { products: allProducts, categories, isLoading, fetchProducts, fetchCategories } = useInventoryStore();

  useEffect(() => {
    if (drawerOpen) {
      void fetchProducts();
      void fetchCategories();
      // Auto-focus en el campo de búsqueda al abrir (listo para escanear)
      setTimeout(() => searchInputRef.current?.focus(), 150);
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

  // Lock body scroll while the POS drawer is open (must be before early return)
  useScrollLock(drawerOpen);

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
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row bg-surface-container-low min-h-0 relative">

          {/* ── Product Selector ── */}
          <div className="flex-none h-[65vh] md:h-auto md:flex-1 flex flex-col border-b md:border-b-0 md:border-r border-outline-variant/30 bg-surface min-h-0 min-w-0">
            <div className="p-3 sm:p-4 border-b border-outline-variant/30 space-y-3 shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar producto o escanear código de barras..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Leemos el valor DIRECTAMENTE del DOM para evitar el problema de closure
                      // stale con lectores de barras (envían chars + Enter casi simultáneamente).
                      const rawValue = searchInputRef.current?.value?.trim() ?? prodSearch.trim();
                      if (!rawValue) return;

                      // 1. Coincidencia exacta por código de barras
                      const barcodeMatch = allProducts.find(p =>
                        p.codigo_barras && p.codigo_barras.trim() === rawValue
                      );
                      if (barcodeMatch) {
                        if ((barcodeMatch.stock_actual || 0) > 0) {
                          addToCart(barcodeMatch);
                        }
                        setProdSearch('');
                        return;
                      }

                      // 2. Coincidencia exacta por cod_prod numérico
                      const numericId = Number(rawValue);
                      if (!isNaN(numericId) && numericId > 0) {
                        const idMatch = allProducts.find(p => p.cod_prod === numericId);
                        if (idMatch) {
                          if ((idMatch.stock_actual || 0) > 0) {
                            addToCart(idMatch);
                          }
                          setProdSearch('');
                          return;
                        }
                      }

                      // 3. Si hay exactamente un resultado filtrado, agregarlo
                      if (filteredProducts.length === 1) {
                        const only = filteredProducts[0];
                        if ((only.stock_actual || 0) > 0) {
                          addToCart(only);
                        }
                        setProdSearch('');
                      }
                    }
                  }}
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-max gap-3 sm:gap-4 content-start pb-10">
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
                      className={`group flex flex-col items-center justify-center bg-surface p-3 sm:p-4 rounded-2xl border border-outline-variant/30 transition-all overflow-hidden relative min-h-[140px] sm:min-h-0 sm:aspect-[4/3] ${
                        outOfStock ? 'opacity-50 cursor-not-allowed bg-surface-container-low grayscale' : 'hover:shadow-md hover:border-primary/30 active:scale-95'
                      }`}
                    >
                      {/* Precio flotante */}
                      <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm z-10 pointer-events-none border border-outline-variant/20">
                        {(Number(p.descuento) || 0) > 0 ? (
                          <div className="text-right">
                            <span className="text-[10px] line-through text-on-surface-variant/60">
                              ${safePrice(p.precio_prod).toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm font-bold text-primary block">
                              ${(safePrice(p.precio_prod) * (1 - (Number(p.descuento) || 0) / 100)).toLocaleString('es-CO')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-on-surface">
                            <span className="text-[10px] text-primary mr-0.5">$</span>
                            {safePrice(p.precio_prod).toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                      {(Number(p.descuento) || 0) > 0 && (
                        <div className="absolute top-2 left-2 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-10">
                          -{Number(p.descuento)}%
                        </div>
                      )}


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
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
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
          <div className="flex-none md:flex-none w-full md:w-[350px] lg:w-[380px] flex flex-col bg-surface-dim md:border-l border-outline-variant/30 z-10 md:h-full overflow-y-auto">
            <div className="p-3 sm:p-4 border-b border-outline-variant/30 bg-surface flex items-center justify-between shrink-0">
              <h3 className="label-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>shopping_cart</span>
                Carrito
              </h3>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded label-sm">
                {orderForm.items.length} ITEM{orderForm.items.length !== 1 && 'S'}
              </span>
            </div>

            <div className="flex-none md:flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-[150px] max-h-[50vh] md:max-h-none md:min-h-[100px] bg-surface-container-lowest">
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
                        <img src={getImageUrl(item.url_imagen)} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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

                {/* Descuento global */}
                <div className="space-y-2">
                  <label className="label-sm text-on-surface-variant">Descuento global</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={orderForm.descuento_global ?? 0}
                      onChange={e => setOrderForm({ ...orderForm, descuento_global: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      disabled={orderForm.items.length === 0}
                      className="w-20 rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-lg font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
                      placeholder="0"
                    />
                    <span className="label-sm text-on-surface-variant">%</span>
                    {orderForm.descuento_global > 0 && (
                      <span className="label-sm text-primary font-semibold ml-auto">
                        -${(cartTotal * (orderForm.descuento_global / 100)).toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="space-y-1 pt-2 border-t border-outline-variant/20">
                  {orderForm.descuento_global > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="label-sm text-on-surface-variant/60">Subtotal</span>
                      <span className="label-md text-on-surface-variant/60 line-through">${cartTotal.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="label-sm text-on-surface-variant">Total a Cobrar</span>
                    <p className="headline-md text-primary flex items-start">
                      <span className="text-base mt-0.5 mr-0.5">$</span>
                      {(cartTotal * (1 - (orderForm.descuento_global || 0) / 100)).toLocaleString('es-CO')}
                    </p>
                  </div>
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
                    onClick={() => {
                      if (orderForm.metodopago_usu === 'tarjeta') {
                        setRfidState('waiting');
                        setRfidBuffer('');
                        setTimeout(() => rfidInputRef.current?.focus(), 100);
                      } else {
                        handleCreateOrder();
                      }
                    }}
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

      {/* ─── RFID Capture Modal (simulación datáfono) ─── */}
      {rfidState !== 'idle' && (
        <div className="absolute inset-0 z-50 bg-surface/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="text-center">
            {rfidState === 'waiting' && (
              <>
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-4xl text-primary">contactless</span>
                </div>
                <h3 className="headline-sm text-on-surface mb-2">Toca la tarjeta en el lector</h3>
                <p className="body-md text-on-surface-variant mb-6">Acerca la tarjeta RFID al lector para procesar el pago</p>
                <div className="flex items-center gap-1.5 justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
                <input
                  ref={rfidInputRef}
                  type="text"
                  className="absolute opacity-0 h-0 w-0"
                  value={rfidBuffer}
                  onChange={e => setRfidBuffer(e.target.value)}
                  onKeyDown={handleRfidInput}
                  autoFocus
                />
                <p className="label-sm text-on-surface-variant/60 mt-8">O escribe cualquier código y presiona Enter para simular</p>
                <button
                  onClick={() => setRfidState('idle')}
                  className="mt-4 label-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
            {rfidState === 'approved' && (
              <>
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-tertiary/10 flex items-center justify-center animate-in zoom-in-95 duration-300">
                  <span className="material-symbols-outlined text-4xl text-tertiary">check_circle</span>
                </div>
                <h3 className="headline-sm text-tertiary mb-2">Pago aprobado</h3>
                <p className="body-md text-on-surface-variant">Tarjeta procesada correctamente</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
