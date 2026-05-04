import React, { useState, useEffect, useCallback } from 'react';
import { productService, inventoryService, alertService } from '@/config/setup';
import type { Product } from '@/models/Product';
import type { Movement } from '@/models/Inventory';
import { useStockSync } from '@/context/StockContext';
import { MovementDrawer } from './MovementDrawer';
import { ProveedoresSection } from './ProveedoresSection';
import { MovementDetailModal } from './MovementDetailModal';

type InventoryTab = 'tablero' | 'movimientos' | 'proveedores';

export function InventarioSection() {
  const { notifyStockChange } = useStockSync();
  const [activeTab, setActiveTab] = useState<InventoryTab>('tablero');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productMap, setProductMap] = useState<Record<string | number, string>>({});

  // Drawer states
  const [isMovementDrawerOpen, setIsMovementDrawerOpen] = useState(false);

  // Load products map once on mount
  useEffect(() => {
    const loadMap = async () => {
      try {
        const pRes = await productService.getProducts(1, 1000).catch(() => null);
        if (pRes) {
          const list = Array.isArray(pRes) ? pRes : (pRes.data || []);
          const map: Record<string | number, string> = {};
          list.forEach((p: Product) => { map[p.cod_prod] = p.nom_prod; });
          setProductMap(map);
        }
      } catch (e) {
        console.error('Error loading product map:', e);
      }
    };
    void loadMap();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [movRes, lowStockRes, prodRes] = await Promise.all([
        inventoryService.getMovements(undefined, 1, 10),
        inventoryService.getLowStock(),
        productService.getProducts(1, 1)
      ]);

      if (movRes?.data) setRecentMovements(movRes.data);
      if (lowStockRes?.data) setLowStockCount(lowStockRes.data.length);
      
      if (prodRes?.pagination) setTotalProducts(prodRes.pagination.total);
      else if (Array.isArray(prodRes)) setTotalProducts(prodRes.length);

    } catch (error: any) {
      console.error('Error cargando inventario:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleMovementSuccess = () => {
    void loadData();
    notifyStockChange();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Centro de Inventario
          </h1>
          <p className="mt-2 text-slate-500 font-medium italic">Control total sobre el flujo de mercancía y proveedores.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsMovementDrawerOpen(true)}
            className="group relative overflow-hidden rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Registrar Movimiento
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </header>

      {/* Internal Navigation */}
      <nav className="flex gap-1 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-[1.25rem] w-fit border border-slate-200/50">
        {[
          { id: 'tablero', label: 'Tablero', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { id: 'movimientos', label: 'Historial', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { id: 'proveedores', label: 'Proveedores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as InventoryTab)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[400px]">
        {activeTab === 'tablero' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Stats Cards */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Productos</p>
                <p className="text-4xl font-black text-slate-900">{totalProducts}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all border-l-4 border-l-red-500">
              <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Stock Crítico</p>
                <p className="text-4xl font-black text-red-600">{lowStockCount}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group hover:shadow-2xl transition-all text-white overflow-hidden relative">
              <div className="absolute -top-4 -right-4 h-32 w-32 bg-white/5 rounded-full blur-3xl"></div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform backdrop-blur-md">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Actividad Reciente</p>
                <p className="text-2xl font-black">Flujo Activo</p>
              </div>
            </div>

            {/* Recent History Preview */}
            <div className="md:col-span-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mt-4">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Últimos Movimientos</h3>
                <button onClick={() => setActiveTab('movimientos')} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Ver Historial Completo</button>
              </div>
              <div className="divide-y divide-slate-50">
                {recentMovements.slice(0, 5).map((mov, idx) => (
                  <div 
                    key={mov.id_inv || idx} 
                    className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetailMovement(mov)}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${mov.tipo_mov === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {mov.tipo_mov === 'entrada' ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          <span className="text-[#ec131e] mr-1">[{mov.cod_prod}]</span>
                          {productMap[mov.cod_prod] || 'Producto Desconocido'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{mov.desc_mov || 'Ajuste de inventario'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${mov.tipo_mov === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {mov.tipo_mov === 'entrada' ? '+' : '-'}{mov.cantidad}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{mov.fecha_mov ? new Date(mov.fecha_mov).toLocaleDateString() : 'Hoy'}</p>
                    </div>
                  </div>
                ))}
                {recentMovements.length === 0 && !isLoading && (
                  <div className="py-20 text-center text-slate-400 font-bold italic text-sm">No se han registrado movimientos aún.</div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'movimientos' ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Historial de Inventario</h3>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Filtrar por producto..." 
                      className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none ring-1 ring-slate-200 focus:ring-red-500 transition-all w-full sm:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5">Fecha / Hora</th>
                        <th className="px-8 py-5">Producto</th>
                        <th className="px-8 py-5">Tipo</th>
                        <th className="px-8 py-5">Cantidad</th>
                        <th className="px-8 py-5">Responsable / Origen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentMovements.filter(m => !searchTerm || (productMap[m.cod_prod] || '').toLowerCase().includes(searchTerm.toLowerCase())).map((mov, idx) => (
                        <tr 
                          key={mov.id_inv || idx} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => setDetailMovement(mov)}
                        >
                          <td className="px-8 py-5">
                            <p className="text-xs font-black text-slate-800">{mov.fecha_mov ? new Date(mov.fecha_mov).toLocaleDateString() : 'Reciente'}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{mov.fecha_mov ? new Date(mov.fecha_mov).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-black text-slate-700">
                              <span className="text-[#ec131e] mr-1">[{mov.cod_prod}]</span>
                              {productMap[mov.cod_prod] || 'Producto Desconocido'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${mov.tipo_mov === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {mov.tipo_mov === 'entrada' ? 'Ingreso' : 'Salida'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-sm font-black ${mov.tipo_mov === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {mov.tipo_mov === 'entrada' ? '+' : '-'}{mov.cantidad}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs text-slate-500 font-medium">{mov.desc_mov || '---'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recentMovements.length === 0 && (
                    <div className="py-20 text-center text-slate-400 font-bold italic">No se encontraron movimientos.</div>
                  )}
                </div>
             </div>
          </div>
        ) : (
          <ProveedoresSection searchTerm={searchTerm} />
        )}
      </div>

      <MovementDrawer
        isOpen={isMovementDrawerOpen}
        onClose={() => setIsMovementDrawerOpen(false)}
        onSuccess={handleMovementSuccess}
      />

      {detailMovement && (
        <MovementDetailModal
          movement={detailMovement}
          productName={productMap[detailMovement.cod_prod]}
          onClose={() => setDetailMovement(null)}
        />
      )}
    </div>
  );
}
