import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { productService, orderService, alertService } from '@/config/setup';
import type { Product, Category } from '@/models/Product';
import type { CreateOrderDto } from '@/services/OrderService';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useSalesStore } from '@/store/useSalesStore';

const EMPTY_ORDER: CreateOrderDto = {
  metodopago_usu: 'efectivo',
  items: [],
};

export function usePOS(user: any) {
  const { 
    products: allProducts, 
    categories,
    fetchProducts, 
    fetchCategories,
    isLoading: isLoadingInventory 
  } = useInventoryStore();

  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState<CreateOrderDto>(EMPTY_ORDER);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const orderSubmitLockRef = useRef(false);
  
  // Stripe QR Modal State
  const [stripeQR, setStripeQR] = useState<{ isOpen: boolean; url: string; orderId: number; amount: number }>({
    isOpen: false,
    url: '',
    orderId: 0,
    amount: 0
  });

  const cartKey = user ? `kiora_cart_${user.id_usu}` : null;

  // Load persistence
  useEffect(() => {
    if (!cartKey) return;
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) setOrderForm(parsed);
      } catch (e) { console.error('Error loading cart:', e); }
    }
  }, [cartKey]);

  // Save persistence
  useEffect(() => {
    if (!cartKey || orderForm === EMPTY_ORDER || ((orderForm.items || []).length === 0 && !localStorage.getItem(cartKey))) return;
    localStorage.setItem(cartKey, JSON.stringify(orderForm));
  }, [orderForm, cartKey]);

  const loadPOSData = async () => {
    void fetchProducts();
    void fetchCategories();
  };

  useEffect(() => {
    if (isOrderDrawerOpen) void loadPOSData();
  }, [isOrderDrawerOpen]);

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

  const addToCart = (p: Product) => {
    const stock = p.stock_actual || 0;
    if (stock <= 0) {
      alertService.showToast('error', 'Producto sin stock disponible');
      return;
    }

    const existing = orderForm.items.find(i => i.cod_prod === p.cod_prod);
    if (existing) {
      if (existing.cantidad >= stock) {
        alertService.showToast('warning', `Solo hay ${stock} unidades disponibles`);
        return;
      }
      setOrderForm(f => ({
        ...f,
        items: f.items.map(i => i.cod_prod === p.cod_prod ? { ...i, cantidad: i.cantidad + 1 } : i)
      }));
    } else {
      setOrderForm(f => ({
        ...f,
        items: [...f.items, { 
          cod_prod: p.cod_prod!, 
          cantidad: 1, 
          precio_unit: p.precio_prod,
          nom_prod: p.nom_prod,
          url_imagen: p.imagen_prod,
          stock_actual: stock
        }]
      }));
    }
  };

  const removeFromCart = (cod_prod: number) => {
    setOrderForm(f => ({ ...f, items: f.items.filter(i => i.cod_prod !== cod_prod) }));
  };

  const updateQuantity = (cod_prod: number, delta: number, maxStock?: number) => {
    setOrderForm(f => ({
      ...f,
      items: f.items.map(i => {
        if (i.cod_prod === cod_prod) {
          const limit = maxStock ?? i.stock_actual ?? 999;
          const newCant = Math.max(1, i.cantidad + delta);
          if (delta > 0 && newCant > limit) {
            alertService.showToast('warning', `Límite de stock alcanzado (${limit})`);
            return i;
          }
          return { ...i, cantidad: newCant };
        }
        return i;
      })
    }));
  };

  const cartTotal = useMemo(() => {
    return orderForm.items.reduce((acc, item) => acc + (item.cantidad * (item.precio_unit || 0)), 0);
  }, [orderForm.items]);

  const resetCart = () => {
    setOrderForm(EMPTY_ORDER);
    if (cartKey) localStorage.removeItem(cartKey);
  };

  const isStockConflictError = (error: unknown) => {
    const message = getErrorMessage(error, '').toLowerCase();
    return message.includes('stock') || message.includes('insuficiente') || message.includes('agotado') || message.includes('409');
  };

  const extractProductCodeFromStockError = (error: unknown): number | null => {
    const message = getErrorMessage(error, '');
    const match = message.match(/producto\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  const validateCartAgainstLiveProducts = async (currentOrder: CreateOrderDto): Promise<{ hasCriticalChanges: boolean; nextOrderForm: CreateOrderDto }> => {
    const checks = await Promise.all(
      currentOrder.items.map(async (item) => {
        try {
          const product = await productService.getProductById(item.cod_prod);
          return { cod_prod: item.cod_prod, stock_actual: product.stock_actual ?? 0 };
        } catch {
          return { cod_prod: item.cod_prod, stock_actual: 0 };
        }
      })
    );

    const stockByProduct = new Map<number, number>();
    checks.forEach(({ cod_prod, stock_actual }) => stockByProduct.set(cod_prod, stock_actual));

    let removedItems = 0;
    let adjustedItems = 0;
    let changed = false;

    const nextItems = currentOrder.items.flatMap((item) => {
      const latestStock = stockByProduct.get(item.cod_prod) ?? 0;
      if (latestStock <= 0) {
        removedItems += 1;
        changed = true;
        return [];
      }
      if (item.cantidad > latestStock) {
        adjustedItems += 1;
        changed = true;
        return [{ ...item, cantidad: latestStock, stock_actual: latestStock }];
      }
      if (item.stock_actual !== latestStock) changed = true;
      return [{ ...item, stock_actual: latestStock }];
    });

    const nextOrderForm: CreateOrderDto = { ...currentOrder, items: nextItems };
    if (changed) {
      setOrderForm(nextOrderForm);
    }

    if (removedItems > 0 || adjustedItems > 0) {
      alertService.showToast(
        'warning',
        `Stock actualizado: ${removedItems} agotado(s) y ${adjustedItems} ajustado(s).`
      );
    }

    return {
      hasCriticalChanges: removedItems > 0 || adjustedItems > 0,
      nextOrderForm
    };
  };

  const handleCreateOrder = async () => {
    if (!orderForm.items.length) return;
    if (orderSubmitLockRef.current) return;

    orderSubmitLockRef.current = true;
    setIsSavingOrder(true);
    try {
      let candidateOrder: CreateOrderDto = orderForm;
      const maxAttempts = 2;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const liveValidation = await validateCartAgainstLiveProducts(candidateOrder);
        candidateOrder = liveValidation.nextOrderForm;

        if (!candidateOrder.items.length) {
          alertService.showToast('warning', 'No hay productos disponibles para procesar la venta.');
          return;
        }

        if (liveValidation.hasCriticalChanges) {
          if (attempt < maxAttempts) {
            alertService.showToast('info', 'Ajustamos el carrito por stock en vivo. Reintentando cobro...');
            continue;
          }
          alertService.showToast('info', 'Se actualizó el carrito con stock real. Revisa y vuelve a intentar.');
          return;
        }

        const order = await orderService.createOrder(candidateOrder);

        if (candidateOrder.metodopago_usu === 'tarjeta' && order.id_vent) {
          try {
            const { checkoutUrl } = await orderService.createCheckoutSession(order.id_vent);
            if (!checkoutUrl) throw new Error('No se recibió URL de checkout.');

            const totalToCharge = candidateOrder.items.reduce(
              (acc, item) => acc + item.cantidad * (item.precio_unit || 0),
              0
            );

            setStripeQR({
              isOpen: true,
              url: checkoutUrl,
              orderId: order.id_vent,
              amount: totalToCharge
            });

            return;
          } catch (checkoutError) {
            if (!isStockConflictError(checkoutError)) throw checkoutError;

            try {
              await orderService.deleteOrder(order.id_vent);
            } catch (cleanupError) {
              console.warn('No se pudo limpiar la orden pendiente tras conflicto de stock:', cleanupError);
            }

            const postCheckoutValidation = await validateCartAgainstLiveProducts(candidateOrder);
            candidateOrder = postCheckoutValidation.nextOrderForm;
            const conflictProductCode = extractProductCodeFromStockError(checkoutError);
            if (conflictProductCode) {
              candidateOrder = {
                ...candidateOrder,
                items: candidateOrder.items.filter((item) => item.cod_prod !== conflictProductCode)
              };
              setOrderForm(candidateOrder);
            }
            useSalesStore.getState().notifySalesChange();
            useInventoryStore.getState().notifyStockChange();

            if (!candidateOrder.items.length) {
              alertService.showToast('error', 'No se pudo iniciar el pago: los productos del carrito se agotaron.');
              return;
            }

            if (attempt < maxAttempts) continue;
          }
        }

        // Venta exitosa (Efectivo o Digital)
        alertService.showToast('success', 'Venta registrada exitosamente');
        resetCart();
        setIsOrderDrawerOpen(false);
        useSalesStore.getState().notifySalesChange();
        useInventoryStore.getState().notifyStockChange();
        break;
      }
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al procesar la venta'));
    } finally {
      setIsSavingOrder(false);
      orderSubmitLockRef.current = false;
    }
  };

  return {
    isOrderDrawerOpen, setIsOrderDrawerOpen,
    prodSearch, setProdSearch,
    allProducts, categories,
    selectedCategoryId, setSelectedCategoryId,
    orderForm, setOrderForm,
    isSavingOrder, setIsSavingOrder,
    filteredProducts,
    addToCart, removeFromCart, updateQuantity,
    cartTotal, resetCart,
    handleCreateOrder,
    stripeQR, setStripeQR,
    orderSubmitLockRef
  };
}
