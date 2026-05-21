import React from 'react';
import type { Product } from '@/models/Product';
import { authService } from '@/config/setup';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'stock' | 'expired';
  product: Product;
}

export function EmailPreviewModal({ isOpen, onClose, type, product }: EmailPreviewModalProps) {
  if (!isOpen) return null;

  const currentUser = authService.getUser();
  const userName = currentUser?.nom_usu || currentUser?.nombres_usu || 'Administrador';
  const userEmail = currentUser?.correo_usu || 'admin@kiora.com';

  const today = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Window header */}
        <div className="bg-surface-container px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-secondary-container/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary/60" />
            </div>
            <span className="label-sm text-on-surface-variant ml-1">Vista Previa: Correo Saliente</span>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Email metadata */}
        <div className="px-5 py-4 bg-surface border-b border-outline-variant/20 space-y-1.5">
          <div className="flex items-center gap-3 text-sm">
            <span className="label-sm text-on-surface-variant w-16 shrink-0">De:</span>
            <span className="body-md text-on-surface-variant">Kiora Alerts &lt;no-reply@kiora.com&gt;</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="label-sm text-on-surface-variant w-16 shrink-0">Para:</span>
            <span className="label-md text-on-surface">{userName} &lt;{userEmail}&gt;</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="label-sm text-on-surface-variant w-16 shrink-0">Asunto:</span>
            <span className="label-sm text-primary font-bold">
              {type === 'stock' ? '⚠️ ALERTA: Stock Crítico Detectado' : '⌛ ALERTA: Producto Caducado en Inventario'}
            </span>
          </div>
        </div>

        {/* Email body */}
        <div className="p-5 bg-surface-container overflow-y-auto max-h-[60vh]">
          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden max-w-lg mx-auto shadow-sm">
            <div className="bg-primary-container p-5 text-center">
              <h1 className="text-on-primary-container font-bold headline-sm uppercase">Kiora Inventory</h1>
              <div className="h-0.5 w-20 bg-primary mx-auto mt-2 rounded-full" />
            </div>

            <div className="p-6 space-y-5">
              <h2 className="headline-sm text-primary-container">
                {type === 'stock' ? 'Aviso de Reposición Urgente' : 'Aviso de Retiro de Producto'}
              </h2>

              <p className="body-md text-on-surface-variant leading-relaxed">
                {type === 'stock'
                  ? 'El sistema de monitoreo ha detectado que un producto ha alcanzado su límite de seguridad.'
                  : 'Se ha detectado un producto que ha superado su fecha de vencimiento.'}
              </p>

              <div className="bg-surface-container-low rounded-lg border border-dashed border-primary/30 p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="label-sm text-primary-container">Producto:</span>
                  <span className="label-md text-on-surface text-right">{product.nom_prod}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="label-sm text-primary-container">ID Sistema:</span>
                  <span className="body-md text-on-surface-variant">#{product.cod_prod}</span>
                </div>
                {type === 'stock' ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="label-sm text-primary-container">Stock Actual:</span>
                      <span className="label-md text-error bg-error-container/30 px-2 rounded">{product.stock_actual} unidades</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="label-sm text-primary-container">Mínimo Requerido:</span>
                      <span className="body-md text-on-surface-variant">{product.stock_minimo} unidades</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="label-sm text-primary-container">Fecha Vencimiento:</span>
                    <span className="label-md text-error bg-error-container/30 px-2 rounded">
                      {product.fechaven_prod ? new Date(product.fechaven_prod).toLocaleDateString() : 'Expirado'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <p className="label-sm text-on-surface-variant/60 italic text-center">
                  Correo automático generado por Kiora. No responder.
                </p>
                <div className="flex items-center justify-between text-primary-container">
                  <span className="label-sm opacity-40">{today}</span>
                  <span className="label-sm">Kiora v2.0</span>
                </div>
              </div>
            </div>
            <div className="bg-primary-container p-3 text-center">
              <p className="text-on-primary-container/60 label-sm">&copy; {new Date().getFullYear()} Kiora.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-surface border-t border-outline-variant/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary label-sm shadow-sm hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
