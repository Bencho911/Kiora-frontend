import React, { useState, useEffect } from 'react';
import type { Product, Category } from '@/models/Product';
import type { Movement } from '@/models/Inventory';
import type { CreateProductDto } from '@/services/ProductService';
import { alertService, getImageUrl } from '@/config/setup';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { ProductStockTab } from '@/components/panel/inventory/ProductStockTab';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
  categories: Category[];
  movements: Movement[];
  loadingMovements: boolean;
  onSave: (product: CreateProductDto, isEdit: boolean) => Promise<void>;
  onSaveMovement: (movement: { tipo_mov: 'entrada' | 'salida' | 'ajuste'; cantidad: number; desc_mov: string; cod_prod: number; fk_cod_prov?: number }) => Promise<void>;
  onLoadMovements: (productId: number) => Promise<void>;
  onViewMovement?: (movement: Movement) => void;
}

const EMPTY_PRODUCT: CreateProductDto = {
  nom_prod: '',
  desc_prod: '',
  precio_prod: 0,
  stock_actual: 0,
  stock_minimo: 0,
  fk_cod_cats: [],
};

export function ProductDrawer({ 
  isOpen, 
  onClose, 
  product, 
  categories,
  movements,
  loadingMovements,
  onSave,
  onSaveMovement,
  onLoadMovements,
  onViewMovement
}: ProductDrawerProps) {
  const [form, setForm] = useState<CreateProductDto>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'info' | 'stock'>('info');
  const [savingMov, setSavingMov] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        nom_prod: product.nom_prod || '',
        desc_prod: product.desc_prod || '',
        precio_prod: product.precio_prod || 0,
        stock_actual: product.stock_actual || 0,
        stock_minimo: product.stock_minimo || 0,
        fk_cod_cats: product.fk_cod_cats || [],
      });
      setImagePreview(product.imagen_prod ? getImageUrl(product.imagen_prod) : null);
    } else {
      setForm(EMPTY_PRODUCT);
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('info');
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'stock' && product?.cod_prod) {
      void onLoadMovements(product.cod_prod);
    }
  }, [activeTab, product?.cod_prod, onLoadMovements]);

  const handleSaveMovement = async (movForm: { tipo_mov: 'entrada' | 'salida' | 'ajuste'; cantidad: number; desc_mov: string; fk_cod_prov?: number }) => {
    if (!product?.cod_prod) return;
    
    if (!movForm.fk_cod_prov && !movForm.desc_mov.trim()) {
      alertService.showToast('warning', 'La justificación es obligatoria');
      return;
    }

    if (movForm.tipo_mov === 'salida' && movForm.cantidad > (product.stock_actual || 0)) {
      alertService.showToast('error', 'No hay stock suficiente para esta salida');
      return;
    }

    setSavingMov(true);
    try {
      await onSaveMovement({
        ...movForm,
        cod_prod: product.cod_prod,
      });
      alertService.showToast('success', 'Movimiento registrado');
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al registrar movimiento'));
    } finally {
      setSavingMov(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom_prod.trim()) return alertService.showToast('warning', 'El nombre es obligatorio');
    if (form.precio_prod <= 0) return alertService.showToast('warning', 'El precio debe ser mayor a 0');

    setSaving(true);
    try {
      const dto: CreateProductDto = {
        ...form,
        imagen: imageFile || undefined,
      };

      await onSave(dto, !!product?.cod_prod);
      onClose();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al guardar producto'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{product ? 'Editar Producto' : 'Crear Producto'}</h2>
            <p className="text-xs text-slate-500 font-medium">Información técnica y control de existencias.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {product && (
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-kiora-red border-b-2 border-kiora-red' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-white text-kiora-red border-b-2 border-kiora-red' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Inventario
            </button>
          </div>
        )}

        {activeTab === 'info' ? (
          <form id="productForm" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagen del Producto</label>
              <div className="relative group aspect-video rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden transition-all hover:border-kiora-red/30">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="h-full w-full object-contain p-4" alt="Preview" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="p-3 bg-white rounded-2xl text-red-500 hover:scale-110 transition-transform shadow-xl">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-3 group-hover:text-kiora-red transition-colors">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subir Fotografía</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre Corporativo *</label>
                <input
                  type="text"
                  required
                  value={form.nom_prod}
                  onChange={e => setForm(f => ({ ...f, nom_prod: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:border-kiora-red focus:outline-none focus:ring-4 focus:ring-kiora-red/5 transition-all"
                  placeholder="Ej. Bebida Energética 500ml"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción Técnica</label>
                <textarea
                  value={form.desc_prod}
                  onChange={e => setForm(f => ({ ...f, desc_prod: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium focus:border-kiora-red focus:outline-none focus:ring-4 focus:ring-kiora-red/5 transition-all min-h-[100px]"
                  placeholder="Detalles del producto..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio de Venta ($) *</label>
                <input
                  type="number"
                  required
                  value={form.precio_prod === 0 ? '' : form.precio_prod}
                  onFocus={e => e.target.select()}
                  onChange={e => setForm(f => ({ ...f, precio_prod: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-lg font-black text-slate-900 focus:border-kiora-red focus:outline-none focus:ring-4 focus:ring-kiora-red/5 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categorías Relacionadas</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c.cod_cat}
                      type="button"
                      onClick={() => {
                        const id = c.cod_cat!;
                        setForm(f => ({
                          ...f,
                          fk_cod_cats: f.fk_cod_cats?.includes(id)
                            ? f.fk_cod_cats.filter(t => t !== id)
                            : [...(f.fk_cod_cats || []), id]
                        }));
                      }}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${form.fk_cod_cats?.includes(c.cod_cat!)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                    >
                      {c.nom_cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Inicial</label>
                  <input
                    type="number"
                    value={form.stock_actual === 0 ? '' : form.stock_actual}
                    disabled={!!product} 
                    onFocus={e => e.target.select()}
                    onChange={e => setForm(f => ({ ...f, stock_actual: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:border-kiora-red focus:outline-none disabled:opacity-40 disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Límite Mínimo</label>
                  <input
                    type="number"
                    value={form.stock_minimo === 0 ? '' : form.stock_minimo}
                    onFocus={e => e.target.select()}
                    onChange={e => setForm(f => ({ ...f, stock_minimo: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold focus:border-kiora-red focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </form>
        ) : (
          <ProductStockTab 
            product={product!}
            movements={movements}
            isLoading={loadingMovements}
            onSaveMovement={handleSaveMovement}
            onViewMovement={onViewMovement}
            saving={savingMov}
          />
        )}

        <div className="border-t border-slate-100 p-6 flex gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all"
          >
            {activeTab === 'stock' ? 'Volver al Menú' : 'Cancelar'}
          </button>
          {activeTab === 'info' && (
            <button
              type="submit"
              form="productForm"
              disabled={saving}
              className="flex-1 rounded-2xl bg-kiora-red py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-kiora-red/20 hover:bg-kiora-red-hover hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {saving ? 'Procesando...' : (product ? 'Guardar Cambios' : 'Crear Producto')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
