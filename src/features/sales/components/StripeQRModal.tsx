import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { alertService, orderService } from '@/config/setup';
import { useSalesStore } from '@/store/useSalesStore';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { pushAppNotification } from '@/lib/pushAppNotification';

interface StripeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl: string;
  orderId: number;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
  /** Vuelve a solicitar URL de checkout al mismo pedido (mismo orderId). */
  onRetryStripe?: () => Promise<void>;
  /** Cierra el flujo de tarjeta y permite cobrar en efectivo (cancela orden pendiente en servidor). */
  onSwitchToCash?: () => void | Promise<void>;
}

const POLL_MS = 3000;
const MAX_POLL_ERRORS = 3;

export function StripeQRModal({
  isOpen,
  onClose,
  checkoutUrl,
  orderId,
  amount,
  onSuccess,
  onCancel,
  onRetryStripe,
  onSwitchToCash,
}: StripeQRModalProps) {
  const [polling, setPolling] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const pollErrors = useRef(0);

  const isPaidStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'pagado' || normalized === 'pagada' || normalized === 'completada';
  };

  const isFailedStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'cancelada' || normalized === 'reembolsada';
  };

  useEffect(() => {
    if (!isOpen || orderId <= 0) {
      setPaymentError(null);
      pollErrors.current = 0;
      return;
    }

    setPaymentError(null);
    pollErrors.current = 0;
    setPolling(true);

    const interval = setInterval(async () => {
      try {
        const order = await orderService.getOrderById(orderId);
        pollErrors.current = 0;

        if (isPaidStatus(order.estado)) {
          clearInterval(interval);
          setPolling(false);
          alertService.showToast('success', '¡Pago confirmado con éxito!');
          pushAppNotification('success', 'Pago confirmado', `Venta #${orderId} pagada correctamente.`, {
            category: 'payment',
            toast: false,
          });
          onSuccess();
          return;
        }

        if (isFailedStatus(order.estado)) {
          clearInterval(interval);
          setPolling(false);
          const msg = 'El pago no se completó o la orden fue cancelada.';
          setPaymentError(msg);
          pushAppNotification('warning', 'Pago no completado', msg, { category: 'payment' });
        }
      } catch (error) {
        pollErrors.current += 1;
        const msg = getErrorMessage(error, 'Error al consultar el estado del pago.');
        console.error('Error polling order status:', error);
        if (pollErrors.current >= MAX_POLL_ERRORS) {
          setPaymentError(msg);
          pushAppNotification('error', 'Error de pago (consulta)', msg, { category: 'payment', toast: true });
        }
      }
    }, POLL_MS);

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [isOpen, orderId, checkoutUrl, onSuccess]);

  const handleRetryLink = async () => {
    if (!onRetryStripe) {
      pushAppNotification('info', 'Reintentar', 'Cierra y vuelve a iniciar el cobro con tarjeta desde el carrito.', {
        category: 'payment',
      });
      return;
    }
    setRetrying(true);
    setPaymentError(null);
    pollErrors.current = 0;
    try {
      await onRetryStripe();
      pushAppNotification('success', 'Nuevo enlace de pago', 'Se generó otra sesión de Stripe para el mismo pedido.', {
        category: 'payment',
      });
    } catch (e) {
      const msg = getErrorMessage(e, 'No se pudo generar un nuevo enlace de pago.');
      setPaymentError(msg);
      pushAppNotification('error', 'Reintento de pago', msg, { category: 'payment' });
    } finally {
      setRetrying(false);
    }
  };

  const handleSwitchCash = async () => {
    const ok = await alertService.showConfirm(
      'Cambiar a efectivo',
      'Se cancelará la orden pendiente de tarjeta y podrás registrar la venta en efectivo desde el POS. ¿Continuar?',
      'Sí, cambiar',
      'No'
    );
    if (!ok) return;
    try {
      await orderService.updateOrderStatus(orderId, 'cancelada');
    } catch {
      /* seguimos para desbloquear UI */
    }
    pushAppNotification('info', 'Método de pago', 'Orden con tarjeta cancelada. Selecciona efectivo y confirma la venta de nuevo.', {
      category: 'payment',
    });
    await onSwitchToCash?.();
    if (onCancel) onCancel();
    else onClose();
    useSalesStore.getState().notifySalesChange();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 rotate-3 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Escanea y Paga</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Usa la cámara de tu celular para pagar con <span className="font-bold text-indigo-600">Stripe</span>
            </p>
          </div>

          {paymentError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              <p className="font-bold">Problema con el pago</p>
              <p className="mt-1 text-xs font-medium opacity-90">{paymentError}</p>
            </div>
          )}

          <div className="relative mb-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors group-hover:border-blue-200">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-xl shadow-blue-500/10 transition-transform duration-500 group-hover:scale-105">
              <QRCodeSVG value={checkoutUrl} size={200} level="H" includeMargin={false} />
            </div>

            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total a pagar</span>
              <div className="mt-1 text-3xl font-black text-slate-900">${amount.toLocaleString('es-CO')}</div>
            </div>

            {polling && !paymentError && (
              <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-1.5 shadow-lg">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Esperando pago...
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            >
              Ir a la pasarela
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {(paymentError || onRetryStripe) && (
              <button
                type="button"
                disabled={retrying}
                onClick={() => void handleRetryLink()}
                className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 py-3 text-xs font-black uppercase tracking-widest text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
              >
                {retrying ? 'Generando…' : 'Reintentar pago (nuevo enlace)'}
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleSwitchCash()}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cambiar a efectivo
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alertService
                  .showConfirm(
                    '¿Cancelar compra?',
                    '¿Estás seguro que deseas cancelar el pago en proceso?',
                    'Sí, cancelar',
                    'No, mantener'
                  )
                  .then(async (confirmed) => {
                    if (confirmed) {
                      try {
                        await orderService.updateOrderStatus(orderId, 'cancelada');
                        alertService.showToast('info', 'Pago cancelado correctamente.');
                        pushAppNotification('info', 'Pago cancelado', `Venta #${orderId} cancelada.`, {
                          category: 'payment',
                          toast: false,
                        });
                        if (onCancel) onCancel();
                        else onClose();
                        useSalesStore.getState().notifySalesChange();
                      } catch (error) {
                        const msg = getErrorMessage(error, 'No se pudo cancelar la orden.');
                        alertService.showToast('error', msg);
                        pushAppNotification('error', 'Cancelar pago', msg, { category: 'payment' });
                      }
                    }
                  });
              }}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600"
            >
              Cancelar pago
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <p className="flex items-center justify-center gap-1.5 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
            Procesamiento seguro por Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
