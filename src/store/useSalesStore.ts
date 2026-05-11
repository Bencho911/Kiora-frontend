import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { productService, orderService, alertService } from '@/config/setup';
import type { Product } from '@/models/Product';
import type { CreateOrderDto, OrderItem } from '@/models/Order';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { useInventoryStore } from './useInventoryStore';

interface StripeQR {
  isOpen: boolean;
  url: string;
  orderId: number;
  amount: number;
}

const EMPTY_ORDER: CreateOrderDto = {
  metodopago_usu: 'efectivo',
  items: [],
};

interface SalesState {
  isOrderDrawerOpen: boolean;
  prodSearch: string;
  selectedCategoryId: number | null;
  orderForm: CreateOrderDto;
  isSavingOrder: boolean;
  stripeQR: StripeQR;
  salesSyncVersion: number;
  
  // Actions
  setIsOrderDrawerOpen: (open: boolean) => void;
  setProdSearch: (search: string) => void;
  setSelectedCategoryId: (id: number | null) => void;
  setStripeQR: (qr: StripeQR) => void;
  addToCart: (p: Product) => void;
  removeFromCart: (cod_prod: number) => void;
  updateQuantity: (cod_prod: number, delta: number, maxStock?: number) => void;
  resetCart: () => void;
  setOrderForm: (form: CreateOrderDto) => void;
  handleCreateOrder: () => Promise<void>;
  notifySalesChange: () => void;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      isOrderDrawerOpen: false,
      prodSearch: '',
      selectedCategoryId: null,
      orderForm: EMPTY_ORDER,
      isSavingOrder: false,
      stripeQR: { isOpen: false, url: '', orderId: 0, amount: 0 },
      salesSyncVersion: 0,

      setIsOrderDrawerOpen: (open) => set({ isOrderDrawerOpen: open }),
      setProdSearch: (prodSearch) => set({ prodSearch }),
      setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
      setStripeQR: (stripeQR) => set({ stripeQR }),

      addToCart: (p) => {
        const stock = Number(p.stock_actual || 0);
        if (stock <= 0) {
          alertService.showToast('error', 'Producto sin stock disponible');
          return;
        }

        const { orderForm } = get();
        const items = Array.isArray(orderForm.items) ? orderForm.items : [];
        const pId = Number(p.cod_prod);
        
        const existing = items.find((i: OrderItem) => Number(i.cod_prod) === pId);

        if (existing) {
          if (existing.cantidad >= stock) {
            alertService.showToast('warning', `Solo hay ${stock} unidades disponibles`);
            return;
          }
          set({
            orderForm: {
              ...orderForm,
              items: items.map((i) =>
                Number(i.cod_prod) === pId ? { ...i, cantidad: i.cantidad + 1 } : i
              ),
            },
          });
        } else {
          set({
            orderForm: {
              ...orderForm,
              items: [
                ...items,
                {
                  cod_prod: pId,
                  cantidad: 1,
                  precio_unit: Number(p.precio_prod || 0),
                  nom_prod: p.nom_prod || 'Producto sin nombre',
                  url_imagen: p.imagen_prod,
                  stock_actual: stock,
                },
              ],
            },
          });
        }
      },

      removeFromCart: (cod_prod) => {
        const { orderForm } = get();
        const items = Array.isArray(orderForm.items) ? orderForm.items : [];
        const pId = Number(cod_prod);
        
        set({
          orderForm: {
            ...orderForm,
            items: items.filter((i: OrderItem) => Number(i.cod_prod) !== pId),
          },
        });
      },

      updateQuantity: (cod_prod, delta, maxStock) => {
        const { orderForm } = get();
        const items = Array.isArray(orderForm.items) ? orderForm.items : [];
        const pId = Number(cod_prod);
        
        set({
          orderForm: {
            ...orderForm,
            items: items.map((i: OrderItem) => {
              if (Number(i.cod_prod) === pId) {
                const limit = maxStock ?? i.stock_actual ?? 999;
                const newCant = Math.max(1, i.cantidad + delta);
                if (delta > 0 && newCant > limit) {
                  alertService.showToast('warning', `Límite de stock alcanzado (${limit})`);
                  return i;
                }
                return { ...i, cantidad: newCant };
              }
              return i;
            }),
          },
        });
      },

      resetCart: () => set({ orderForm: EMPTY_ORDER }),
      setOrderForm: (orderForm) => set({ orderForm }),

      notifySalesChange: () => set((state) => ({ salesSyncVersion: state.salesSyncVersion + 1 })),

      handleCreateOrder: async () => {
        const { orderForm, isSavingOrder, resetCart, notifySalesChange, setStripeQR, setIsOrderDrawerOpen, setOrderForm } = get();
        if (!orderForm.items.length || isSavingOrder) return;

        set({ isSavingOrder: true });
        try {
          let candidateOrder: CreateOrderDto = orderForm;
          const maxAttempts = 2;

          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            // Validar stock antes de intentar la venta
            const liveValidation = await validateCartAgainstLive(candidateOrder);
            candidateOrder = liveValidation.nextOrderForm;

            if (!candidateOrder.items.length) {
              alertService.showToast('warning', 'No hay productos disponibles para procesar la venta.');
              set({ isSavingOrder: false });
              return;
            }

            if (liveValidation.hasCriticalChanges) {
              setOrderForm(candidateOrder); // Actualizar el store con el carrito ajustado
              if (attempt < maxAttempts) {
                alertService.showToast('info', 'Ajustamos el carrito por stock en vivo. Reintentando...');
                continue;
              }
              alertService.showToast('info', 'Se actualizó el carrito con stock real. Revisa y vuelve a intentar.');
              set({ isSavingOrder: false });
              return;
            }

            const order = await orderService.createOrder(candidateOrder);

            if (candidateOrder.metodopago_usu === 'tarjeta' && order.id_vent) {
              try {
                const { checkoutUrl } = await orderService.createCheckoutSession(order.id_vent);
                if (!checkoutUrl) throw new Error('No se recibió URL de checkout.');

                const total = candidateOrder.items.reduce(
                  (acc: number, item: OrderItem) => acc + item.cantidad * (item.precio_unit || 0),
                  0
                );

                setStripeQR({
                  isOpen: true,
                  url: checkoutUrl,
                  orderId: order.id_vent,
                  amount: total,
                });
                set({ isSavingOrder: false });
                return;
              } catch (checkoutError) {
                if (!isStockConflict(checkoutError)) throw checkoutError;

                // Si falló Stripe por stock, limpiamos la orden pendiente
                try { await orderService.deleteOrder(order.id_vent); } catch (e) { console.warn('Cleanup failed', e); }

                const validation = await validateCartAgainstLive(candidateOrder);
                candidateOrder = validation.nextOrderForm;
                const conflictCode = extractCodeFromError(checkoutError);
                if (conflictCode) {
                  candidateOrder = {
                    ...candidateOrder,
                    items: candidateOrder.items.filter((item: OrderItem) => item.cod_prod !== conflictCode)
                  };
                  setOrderForm(candidateOrder);
                }
                notifySalesChange();
                useInventoryStore.getState().notifyStockChange();

                if (!candidateOrder.items.length) {
                  alertService.showToast('error', 'Productos agotados durante el proceso de pago.');
                  set({ isSavingOrder: false });
                  return;
                }
                if (attempt < maxAttempts) continue;
              }
            }

            // Venta exitosa
            alertService.showToast('success', 'Venta registrada exitosamente');
            resetCart();
            setIsOrderDrawerOpen(false);
            notifySalesChange();
            useInventoryStore.getState().notifyStockChange();
            break;
          }
        } catch (e) {
          alertService.showToast('error', getErrorMessage(e, 'Error al procesar la venta'));
        } finally {
          set({ isSavingOrder: false });
        }
      },
    }),
    {
      name: 'kiora-sales-storage',
      partialize: (state) => ({ orderForm: state.orderForm }), // Solo persistimos el carrito
    }
  )
);

// --- Helpers para validación de stock robusta ---

function isStockConflict(error: unknown): boolean {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('stock') || message.includes('insuficiente') || message.includes('agotado') || message.includes('409');
}

function extractCodeFromError(error: unknown): number | null {
  const message = getErrorMessage(error, '');
  const match = message.match(/producto\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

async function validateCartAgainstLive(currentOrder: CreateOrderDto): Promise<{ hasCriticalChanges: boolean; nextOrderForm: CreateOrderDto }> {
  const checks = await Promise.all(
    currentOrder.items.map(async (item: OrderItem) => {
      try {
        const product = await productService.getProductById(item.cod_prod);
        return { cod_prod: item.cod_prod, latest_stock: product.stock_actual ?? 0 };
      } catch {
        return { cod_prod: item.cod_prod, latest_stock: 0 };
      }
    })
  );

  const stockByProduct = new Map<number, number>();
  checks.forEach(({ cod_prod, latest_stock }: { cod_prod: number, latest_stock: number }) => stockByProduct.set(cod_prod, latest_stock));

  let removedCount = 0;
  let adjustedCount = 0;
  let changed = false;

  const nextItems = currentOrder.items.flatMap((item: OrderItem) => {
    const latestStock = stockByProduct.get(item.cod_prod) ?? 0;
    if (latestStock <= 0) {
      removedCount += 1;
      changed = true;
      return [];
    }
    if (item.cantidad > latestStock) {
      adjustedCount += 1;
      changed = true;
      return [{ ...item, cantidad: latestStock, stock_actual: latestStock }];
    }
    if (item.stock_actual !== latestStock) changed = true;
    return [{ ...item, stock_actual: latestStock }];
  }) as OrderItem[];

  if (removedCount > 0 || adjustedCount > 0) {
    alertService.showToast(
      'warning',
      `Stock actualizado: ${removedCount} agotado(s) y ${adjustedCount} ajustado(s).`
    );
  }

  return {
    hasCriticalChanges: changed,
    nextOrderForm: { ...currentOrder, items: nextItems }
  };
}
