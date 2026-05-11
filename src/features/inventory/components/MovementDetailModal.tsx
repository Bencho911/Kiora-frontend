import React from 'react';
import type { Movement } from '@/models/Inventory';

interface MovementDetailModalProps {
  movement: Movement;
  productName?: string;
  onClose: () => void;
}

export function MovementDetailModal({ movement, productName, onClose }: MovementDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
      />
      
      <div 
        className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Detalle de Movimiento <span className="text-[#ec131e]">#{movement.id_mov}</span>
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Inventario & Logística</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${movement.tipo_mov === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {movement.tipo_mov === 'entrada' ? 'Ingreso (+)' : 'Salida (-)'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad</p>
              <p className="text-xl font-black text-slate-900">{movement.cantidad} Unidades</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-100 bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Producto Afectado</p>
            <p className="text-sm font-black text-slate-800">
              <span className="text-[#ec131e] mr-1">[{movement.cod_prod}]</span>
              {productName || 'Producto Desconocido'}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-100 bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justificación / Descripción</p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
              "{movement.desc_mov || 'No se proporcionó descripción.'}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs font-bold">
                {movement.fecha_mov ? new Date(movement.fecha_mov).toLocaleString() : 'Fecha no disponible'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button onClick={onClose} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-black transition-all">Cerrar Detalle</button>
        </div>
      </div>
    </div>
  );
}
