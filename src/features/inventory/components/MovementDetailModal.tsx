import React from 'react';
import type { Movement } from '@/models/Inventory';

interface MovementDetailModalProps {
  movement: Movement;
  productName?: string;
  onClose: () => void;
}

export function MovementDetailModal({ movement, productName, onClose }: MovementDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-sm">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <div
        className="relative bg-surface rounded-xl shadow-lg border border-outline-variant/30 p-6 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 border-b border-outline-variant/20 pb-4">
          <div>
            <h3 className="headline-sm text-on-surface">
              Movimiento <span className="text-primary">#{movement.id_mov}</span>
            </h3>
            <p className="label-sm text-on-surface-variant mt-0.5">Inventario y Logística</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <p className="label-sm text-on-surface-variant mb-1.5">Tipo</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md label-sm border ${
                movement.tipo_mov === 'entrada'
                  ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                  : 'bg-error-container/30 text-error border-error/20'
              }`}>
                {movement.tipo_mov === 'entrada' ? 'Ingreso (+)' : 'Salida (-)'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <p className="label-sm text-on-surface-variant mb-1.5">Cantidad</p>
              <p className="headline-sm text-on-surface">{movement.cantidad} Unidades</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface">
            <p className="label-sm text-on-surface-variant mb-1.5">Producto Afectado</p>
            <p className="label-md text-on-surface">
              <span className="text-primary mr-1">[{movement.cod_prod}]</span>
              {productName || 'Producto Desconocido'}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface">
            <p className="label-sm text-on-surface-variant mb-1.5">Justificación</p>
            <p className="body-md text-on-surface-variant leading-relaxed italic">
              "{movement.desc_mov || 'No se proporcionó descripción.'}"
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
            <span className="label-sm">
              {movement.fecha_mov ? new Date(movement.fecha_mov).toLocaleString() : 'Fecha no disponible'}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-primary text-on-primary label-sm shadow-sm hover:opacity-90 transition-all active:scale-[0.98]">
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
