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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Header de la ventana */}
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Vista Previa: Correo Saliente</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Datos del Correo */}
        <div className="px-8 py-6 bg-white border-b border-slate-50 space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-slate-400 w-16">De:</span>
            <span className="text-slate-600">Kiora Alerts &lt;no-reply@kiora.com&gt;</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-slate-400 w-16">Para:</span>
            <span className="text-slate-900 font-bold">{userName} &lt;{userEmail}&gt;</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-slate-400 w-16">Asunto:</span>
            <span className="text-kiora-red font-black">
              {type === 'stock' ? '⚠️ ALERTA: Stock Crítico Detectado' : '⌛ ALERTA: Producto Caducado en Inventario'}
            </span>
          </div>
        </div>

        {/* Cuerpo del Correo (Simulación HTML) */}
        <div className="p-8 bg-[#f5f0eb] overflow-y-auto max-h-[60vh]">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mx-auto max-w-lg">
            <div className="bg-[#3D1A10] p-6 text-center">
               <h1 className="text-white font-black text-xl tracking-tighter uppercase">KIORA INVENTORY SYSTEM</h1>
               <div className="h-1 w-24 bg-[#C41E1E] mx-auto mt-2 rounded-full"></div>
            </div>
            
            <div className="p-8 space-y-6">
              <h2 className="text-xl font-bold text-[#3D1A10]">
                {type === 'stock' ? 'Aviso de Reposición Urgente' : 'Aviso de Retiro de Producto'}
              </h2>
              
              <p className="text-sm text-slate-600 leading-relaxed">
                {type === 'stock' 
                  ? 'Hola, recibes este mensaje porque el sistema de monitoreo automático ha detectado que un producto ha alcanzado su límite de seguridad.' 
                  : 'Hola, se ha detectado un producto que ha superado su fecha de vencimiento configurada en el sistema.'}
              </p>

              <div className="bg-[#fdf5f0] rounded-xl p-6 border-2 border-dashed border-[#C41E1E]/30 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[#3D1A10] uppercase">Producto:</span>
                  <span className="font-black text-slate-900 text-right">{product.nom_prod}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[#3D1A10] uppercase">ID Sistema:</span>
                  <span className="font-medium text-slate-600">#{product.cod_prod}</span>
                </div>
                {type === 'stock' ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-[#3D1A10] uppercase">Stock Actual:</span>
                      <span className="font-black text-[#C41E1E] bg-red-50 px-2 rounded">{product.stock_actual} unidades</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-[#3D1A10] uppercase">Mínimo Requerido:</span>
                      <span className="font-medium text-slate-600">{product.stock_minimo} unidades</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#3D1A10] uppercase">Fecha Vencimiento:</span>
                    <span className="font-black text-[#C41E1E] bg-red-50 px-2 rounded">
                      {product.fechaven_prod ? new Date(product.fechaven_prod).toLocaleDateString() : 'Expirado'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium italic text-center">
                  Este es un correo automático generado por Kiora Backend. Por favor no responda a este mensaje.
                </p>
                <div className="flex items-center justify-between text-[#3D1A10]">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{today}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Kiora v2.0</span>
                </div>
              </div>
            </div>
            <div className="bg-[#3D1A10] p-4 text-center">
              <p className="text-[#c8a898] text-[9px] font-bold">© {new Date().getFullYear()} Kiora. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
