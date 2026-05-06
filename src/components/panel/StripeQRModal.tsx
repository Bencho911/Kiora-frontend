import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { alertService, orderService } from '@/config/setup';

interface StripeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl: string;
  orderId?: number;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function StripeQRModal({ isOpen, onClose, checkoutUrl, orderId, amount, onSuccess, onCancel }: StripeQRModalProps) {
  const [polling, setPolling] = useState(false);
  const isPaidStatus = (status?: string) => {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'pagado' || normalized === 'pagada' || normalized === 'completada';
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && orderId) {
      setPolling(true);
      // Poll every 3 seconds to detect payment confirmation from backend.
      interval = setInterval(async () => {
        try {
          const order = await orderService.getOrderById(orderId);
          if (isPaidStatus(order.estado)) {
            clearInterval(interval);
            setPolling(false);
            alertService.showToast('success', '¡Pago confirmado con éxito!');
            onSuccess();
          }
        } catch (error) {
          console.error('Error polling order status:', error);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
      setPolling(false);
    };
  }, [isOpen, orderId, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Decor */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 w-full" />
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 rotate-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Escanea y Paga</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Usa la cámara de tu celular para pagar con <span className="text-indigo-600 font-bold">Stripe</span>
            </p>
          </div>

          <div className="relative bg-slate-50 rounded-3xl p-6 mb-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group transition-colors hover:border-blue-200">
            <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-500/10 mb-4 transition-transform group-hover:scale-105 duration-500">
              <QRCodeSVG 
                value={checkoutUrl} 
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total a pagar</span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                ${amount.toLocaleString('es-CO')}
              </div>
            </div>

            {polling && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Esperando pago...</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <a 
              href={checkoutUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              Ir a la pasarela
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                alertService.showConfirm(
                  '¿Cancelar compra?',
                  '¿Estás seguro que deseas cancelar el pago en proceso?',
                  'Sí, cancelar',
                  'No, mantener'
                ).then(async (confirmed) => {
                  if (confirmed) {
                    try {
                      await orderService.updateOrderStatus(orderId, 'cancelada');
                      alertService.showToast('info', 'Pago cancelado correctamente.');
                      if (onCancel) onCancel();
                      else onClose();
                      window.dispatchEvent(new CustomEvent('kiora_reload_orders'));
                    } catch (error) {
                      console.error('Error al cancelar la orden:', error);
                    }
                  }
                });
              }}
              className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancelar Pago
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100">
          <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            Procesamiento seguro por Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

