import { authService, getImageUrl } from '@/config/setup';
import type { Product } from '@/models/Product';
import { ProductDrawer } from './ProductDrawer';
import { MovementDetailModal } from '@/features/inventory/components/MovementDetailModal';
import { useProductManager } from '@/hooks/useProductManager';
import { useAppStore } from '@/store/useAppStore';

export function ProductsSection() {
  const isAdmin = authService.isAdmin();

  const {
    categories, isLoading,
    pendingFilters, setPendingFilters,
    selectedProduct, setSelectedProduct,
    isDrawerOpen, setIsDrawerOpen,
    showFilters, setShowFilters,
    movements, loadingMovements,
    detailMovement, setDetailMovement,
    loadData, loadMovements,
    handleSaveProduct, handleSaveMovement,
    filteredProducts,
    handleApplyFilters, handleClearFilters, handleDelete,
    stockBadgeColor, toggleCategoryPending
  } = useProductManager();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto px-4 sm:px-0">
      {/* Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#ec131e] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ec131e] bg-red-50 px-3 py-1 rounded-lg">Inventario Maestro</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Productos <span className="text-[#ec131e]">&</span> Stock
          </h1>
          <p className="mt-1 text-slate-500 font-medium">Control centralizado de existencias y precios del catálogo.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex p-1 bg-slate-100 rounded-2xl ring-1 ring-slate-200/50 shadow-inner w-full sm:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${showFilters ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filtros
            </button>
            <button
              onClick={() => useAppStore.getState().setActiveTab('categorias')}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-all text-center"
            >
              Categorías
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => { setSelectedProduct(null); setIsDrawerOpen(true); }} className="w-full sm:w-auto bg-[#ec131e] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-[#ec131e]/20 hover:shadow-[#ec131e]/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
               Nuevo Producto
            </button>
          )}
        </div>
      </header>


      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/50 space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Buscador</label>
              <input
                type="text"
                placeholder="Nombre o código..."
                value={pendingFilters.search}
                onChange={e => setPendingFilters(p => ({ ...p, search: e.target.value }))}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 px-5 text-sm font-bold focus:border-[#ec131e] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rango de Precio</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={pendingFilters.minPrice} onChange={e => setPendingFilters(p => ({ ...p, minPrice: e.target.value }))} className="w-1/2 rounded-2xl border border-slate-100 bg-slate-50 py-4 px-4 text-sm font-bold focus:border-[#ec131e] focus:bg-white transition-all" />
                <input type="number" placeholder="Max" value={pendingFilters.maxPrice} onChange={e => setPendingFilters(p => ({ ...p, maxPrice: e.target.value }))} className="w-1/2 rounded-2xl border border-slate-100 bg-slate-50 py-4 px-4 text-sm font-bold focus:border-[#ec131e] focus:bg-white transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categorías</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c.cod_cat}
                  onClick={() => toggleCategoryPending(c.cod_cat!)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border capitalize ${pendingFilters.categories.includes(c.cod_cat!) ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                >
                  {c.nom_cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <button onClick={handleClearFilters} className="px-8 py-3 rounded-2xl ring-1 ring-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Limpiar</button>
            <button onClick={handleApplyFilters} className="px-10 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Aplicar Filtros</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <>
        {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-64 bg-white border border-slate-50 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 sm:py-32 text-center bg-white rounded-[2rem] sm:rounded-[3rem] border border-dashed border-slate-200">
              <p className="font-black text-lg sm:text-xl text-slate-800">No hay resultados</p>
              <button onClick={handleClearFilters} className="mt-4 text-[#ec131e] font-black text-[10px] sm:text-xs uppercase tracking-widest">Resetear filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 pb-24">
              {filteredProducts.map(p => (
                <div key={p.cod_prod} className="group bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:shadow-[#ec131e]/5 hover:border-[#ec131e]/20 transition-all duration-500 relative flex flex-col items-center text-center p-5">
                  <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-inner">
                    {p.imagen_prod ? (
                      <img src={getImageUrl(p.imagen_prod)} alt={p.nom_prod} className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-slate-200 font-black text-4xl">?</div>
                    )}
                    
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${stockBadgeColor(p)}`}>
                      S: {p.stock_actual}
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 leading-tight mb-1 uppercase tracking-tight group-hover:text-[#ec131e] transition-colors line-clamp-2 h-8 flex items-center justify-center">{p.nom_prod}</h3>
                  <p className="text-lg font-black text-slate-900 mb-4">
                    <span className="text-xs text-[#ec131e] font-bold mr-0.5">$</span>
                    {(Number(p.precio_prod) || 0).toLocaleString('es-CO')}
                  </p>

                  <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 sm:transform sm:translate-y-2 sm:group-hover:translate-y-0 opacity-100 translate-y-0">
                    <button 
                      onClick={() => { setSelectedProduct(p); setIsDrawerOpen(true); }} 
                      className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                      title="Editar"
                    >
                      <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(p.cod_prod!)} 
                        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-[#ec131e] bg-red-50 rounded-xl hover:bg-[#ec131e] hover:text-white transition-all shadow-sm active:scale-90"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </>

      <ProductDrawer 
        isOpen={isDrawerOpen} 
        product={selectedProduct} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={loadData}
        categories={categories}
        movements={movements}
        loadingMovements={loadingMovements}
        onSave={handleSaveProduct}
        onSaveMovement={handleSaveMovement}
        onLoadMovements={loadMovements}
        onViewMovement={(m) => setDetailMovement(m)}
      />

      {detailMovement && (
        <MovementDetailModal
          movement={detailMovement}
          productName={selectedProduct?.nom_prod}
          onClose={() => setDetailMovement(null)}
        />
      )}
    </div>
  );
}
