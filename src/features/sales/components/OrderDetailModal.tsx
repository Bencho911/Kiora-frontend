import type { Order } from '@/models/Order';
import React from 'react';

interface OrderDetailModalProps {
  detailOrder: Order;
  onClose: () => void;
  safePrice: (v: unknown) => number;
  estadoColors: Record<string, string>;
  productMap?: Record<string | number, string>; // Add this
  onRefund?: (id: number) => void;
  onDownloadReceipt?: (id: number) => void;
}

export function OrderDetailModal({
  detailOrder,
  onClose,
  safePrice,
  estadoColors,
  productMap = {}, // Add this
  onRefund,
  onDownloadReceipt
}: OrderDetailModalProps) {
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  const isCompletada = (status?: string) =>
    String(status ?? '').toLowerCase() === 'completada';

  const isPaidStatus = (status?: string) => isCompletada(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-all duration-300" 
        onClick={onClose} 
        aria-label="Cerrar modal"
      />
      
      <div 
        className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl animate-in zoom-in-95 duration-200 transform transition-all max-h-[90vh] flex flex-col"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mx-2 mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Venta <span className="text-[#ec131e]">#{detailOrder.id_vent}</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {detailOrder.fecha_vent ? new Date(detailOrder.fecha_vent).toLocaleString('es-CO') : '—'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full bg-slate-50 p-2 text-slate-500 hover:bg-[#ec131e]/10 hover:text-[#ec131e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec131e]/20"
            aria-label="Cerrar detalle"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="overflow-y-auto px-2 pb-2 custom-scrollbar">
          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-100/50 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Método de pago</p>
              </div>
              <p className="font-extrabold text-slate-800 capitalize text-base ml-1">
                {detailOrder.metodopago_usu ?? '—'}
              </p>
            </div>
            
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-100/50 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Estado</p>
              </div>
              <span 
                className={`inline-flex items-center ml-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide border shadow-sm ${
                 estadoColors[detailOrder.estado ?? 'pendiente']
                }`}
              >
                {detailOrder.estado}
              </span>
            </div>

            {(detailOrder as any).usuario && (
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-100/50 shadow-sm col-span-1 sm:col-span-2 transition-transform hover:scale-[1.01]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Procesada por</p>
                </div>
                <div className="flex items-center gap-2 ml-1">
                  <div className="h-6 w-6 rounded-full bg-[#ec131e]/10 flex flex-shrink-0 items-center justify-center text-[#ec131e] font-bold text-xs uppercase">
                    {(detailOrder as any).usuario?.nom_usu?.charAt(0) ?? 'S'}
                  </div>
                  <p className="font-extrabold text-slate-800 text-sm">
                    {(detailOrder as any).usuario?.nom_usu ?? 'Sistema'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fa] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Producto</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">Cant.</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">P. Unit.</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(detailOrder.items ?? []).length === 0 ? (
                   <tr>
                     <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm font-medium">
                       No se encontraron items.
                     </td>
                   </tr>
                ) : (
                  (detailOrder.items ?? []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 line-clamp-1">
                          {item.nom_prod || productMap[item.cod_prod] || (item.cod_prod ? productMap[String(item.cod_prod)] : '') || `Producto #${item.cod_prod}`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Código: {item.cod_prod}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                          {item.cantidad}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-slate-600 font-medium">
                        ${safePrice(item.precio_unit).toLocaleString('es-CO')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-extrabold text-slate-900">
                          ${(item.cantidad * safePrice(item.precio_unit)).toLocaleString('es-CO')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end gap-1.5 px-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Final</p>
            <p className="text-4xl font-black text-[#111827] drop-shadow-sm flex items-start">
              <span className="text-xl mt-1 text-[#ec131e] mr-1">$</span>
              {safePrice(detailOrder.montofinal_vent).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 px-2 border-t border-slate-100 pt-6">
            {isPaidStatus(detailOrder.estado) && onDownloadReceipt && (
              <button
                onClick={() => onDownloadReceipt(detailOrder.id_vent!)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold transition-all border border-emerald-100 hover:border-emerald-600 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Descargar Factura
              </button>
            )}

            {isCompletada(detailOrder.estado) && onRefund && (
              <button
                onClick={() => onRefund(detailOrder.id_vent!)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl font-bold transition-all border border-purple-100 hover:border-purple-600 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
                Solicitar Reembolso
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
