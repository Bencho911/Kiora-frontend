import React, { useState, useEffect } from 'react';
import type { Product, Category } from '@/models/Product';
import type { Movement } from '@/models/Inventory';
import type { CreateProductDto } from '@/services/ProductService';
import { alertService, getImageUrl, inventoryService } from '@/config/setup';
import { pushAppNotification } from '@/lib/pushAppNotification';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { ProductStockTab } from '@/components/panel/inventory/ProductStockTab';
import { processProductImage } from '@/utils/processProductImage';
import type { Supplier } from '@/models/Inventory';

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
  precio_prod: '' as unknown as number,
  descuento: 0,
  stock_actual: '' as unknown as number,
  stock_minimo: '' as unknown as number,
  fk_cod_cats: [],
  fechaven_prod: undefined,
  codigo_barras: '',
  fk_cod_prov: undefined,
};

function toInputDate(d?: string | null): string {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toISOString().slice(0, 10);
}

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
  const [processingImage, setProcessingImage] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'stock'>('info');
  const [savingMov, setSavingMov] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (isOpen) {
      inventoryService.getSuppliers(1, 1000).then(res => {
        setSuppliers(res.data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setForm({
        nom_prod: product.nom_prod || '',
        desc_prod: product.desc_prod || '',
        precio_prod: product.precio_prod || 0,
        descuento: product.descuento || 0,
        codigo_barras: product.codigo_barras || '',
        stock_actual: product.stock_actual ?? ('' as unknown as number),
        stock_minimo: product.stock_minimo ?? ('' as unknown as number),
        fk_cod_cats: product.fk_cod_cats || [],
        fechaven_prod: toInputDate(product.fechaven_prod) || undefined,
        fk_cod_prov: undefined, // We only allow linking a provider on creation (or it's not editable here if product exists, unless we load it)
      });
      setImagePreview(product.imagen_prod ? getImageUrl(product.imagen_prod) : null);
    } else {
      setForm(EMPTY_PRODUCT);
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, isOpen]);

  useEffect(() => {
    if (isOpen) setActiveTab('info');
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'stock' && product?.cod_prod) {
      void onLoadMovements(product.cod_prod);
    }
  }, [activeTab, product?.cod_prod, onLoadMovements]);

  const hasChanges = React.useMemo(() => {
    if (!product) return true;

    const initialFormState = {
      nom_prod: product.nom_prod || '',
      desc_prod: product.desc_prod || '',
      precio_prod: product.precio_prod || 0,
      descuento: product.descuento || 0,
      codigo_barras: product.codigo_barras || '',
      stock_actual: product.stock_actual ?? ('' as unknown as number),
      stock_minimo: product.stock_minimo ?? ('' as unknown as number),
      fk_cod_cats: product.fk_cod_cats || [],
      fechaven_prod: toInputDate(product.fechaven_prod) || undefined,
      fk_cod_prov: undefined,
    };

    const arraysEqual = (a: number[], b: number[]) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };

    const isFormDifferent = 
      form.nom_prod !== initialFormState.nom_prod ||
      form.desc_prod !== initialFormState.desc_prod ||
      form.precio_prod !== initialFormState.precio_prod ||
      form.descuento !== initialFormState.descuento ||
      form.codigo_barras !== initialFormState.codigo_barras ||
      form.stock_actual !== initialFormState.stock_actual ||
      form.stock_minimo !== initialFormState.stock_minimo ||
      form.fechaven_prod !== initialFormState.fechaven_prod ||
      form.fk_cod_prov !== initialFormState.fk_cod_prov ||
      !arraysEqual(form.fk_cod_cats || [], initialFormState.fk_cod_cats || []);

    const initialImagePreview = product.imagen_prod ? getImageUrl(product.imagen_prod) : null;
    const isImageDifferent = imageFile !== null || imagePreview !== initialImagePreview;

    return isFormDifferent || isImageDifferent;
  }, [form, product, imageFile, imagePreview]);

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
      await onSaveMovement({ ...movForm, cod_prod: product.cod_prod });
      alertService.showToast('success', 'Movimiento registrado');
      pushAppNotification('success', 'Inventario',
        `${movForm.tipo_mov === 'ajuste' ? 'Ajuste' : movForm.tipo_mov} de ${movForm.cantidad} uds — ${product.nom_prod ?? 'Producto'}`,
        { category: 'inventory', toast: false }
      );
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al registrar movimiento'));
    } finally {
      setSavingMov(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';
    setProcessingImage(true);
    try {
      const processed = await processProductImage(file);
      setImageFile(processed);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(processed);
    } catch {
      // Fallback: use original file without processing
      alertService.showToast('warning', 'No se pudo procesar la imagen, se usará la original.');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom_prod.trim()) return alertService.showToast('warning', 'El nombre es obligatorio');
    if (form.precio_prod === '' as unknown as number || form.precio_prod <= 0) return alertService.showToast('warning', 'El precio debe ser mayor a 0');
    if (!form.fk_cod_cats || form.fk_cod_cats.length === 0) return alertService.showToast('warning', 'Debes seleccionar al menos una categoría');
    
    if (form.stock_actual === '' as unknown as number) return alertService.showToast('warning', 'El stock inicial es obligatorio');
    if (form.stock_minimo === '' as unknown as number) return alertService.showToast('warning', 'El stock mínimo es obligatorio');

    setSaving(true);
    try {
      await onSave({ ...form, imagen: imageFile || undefined }, !!product?.cod_prod);
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
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-surface-bright shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-outline-variant/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 bg-surface">
          <div>
            <h2 className="label-md text-on-surface">{product ? 'Editar Producto' : 'Crear Producto'}</h2>
            <p className="label-sm text-on-surface-variant mt-0.5">Información técnica y control de existencias.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {product && (
          <div className="flex border-b border-outline-variant/30 bg-surface-container-low">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 label-sm transition-all border-b-2 ${activeTab === 'info' ? 'text-primary border-primary bg-surface' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex-1 py-3 label-sm transition-all border-b-2 ${activeTab === 'stock' ? 'text-primary border-primary bg-surface' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
            >
              Inventario
            </button>
          </div>
        )}

        {activeTab === 'info' ? (
          <form id="productForm" onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Image Upload */}
            <div className="space-y-1.5">
              <label className="label-sm text-on-surface-variant">Imagen del Producto</label>
              <div className="relative group aspect-video rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-low flex items-center justify-center overflow-hidden transition-all hover:border-primary/30">
                {processingImage ? (
                  <div className="flex flex-col items-center gap-2 p-4">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="label-sm text-on-surface-variant">Procesando imagen...</p>
                  </div>
                ) : imagePreview ? (
                  <>
                    <img src={imagePreview} className="h-full w-full object-contain p-4 mix-blend-multiply" alt="Preview" style={{ background: 'transparent' }} />
                    <div className="absolute inset-0 bg-inverse-surface/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="p-2 bg-surface rounded-lg text-error hover:scale-110 transition-transform shadow-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="mx-auto w-10 h-10 rounded-lg bg-surface shadow-sm flex items-center justify-center text-on-surface-variant/40 mb-2 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>image</span>
                    </div>
                    <p className="label-sm text-on-surface-variant">Subir Fotografía</p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">PNG, JPG, WebP · El fondo se eliminará automáticamente</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={processingImage}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.nom_prod}
                  onChange={e => setForm(f => ({ ...f, nom_prod: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                  placeholder="Ej. Bebida Energética 500ml"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Descripción</label>
                <textarea
                  value={form.desc_prod}
                  onChange={e => setForm(f => ({ ...f, desc_prod: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all min-h-[80px]"
                  placeholder="Detalles del producto."
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={form.fechaven_prod ?? ''}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm(f => ({ ...f, fechaven_prod: e.target.value || undefined }))}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                />
                <p className="label-sm text-on-surface-variant/60">Opcional. Se usa para alertas de caducidad.</p>
              </div>

              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Precio de Venta ($) *</label>
                <input
                  type="number"
                  required
                  value={form.precio_prod}
                  onFocus={e => e.target.select()}
                  onChange={e => setForm(f => ({ ...f, precio_prod: e.target.value === '' ? '' as unknown as number : Number(e.target.value) }))}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-lg font-bold text-on-surface focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Descuento (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.descuento ?? 0}
                    onChange={e => setForm(f => ({ ...f, descuento: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                    className="w-24 rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-lg font-bold text-on-surface focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  {form.descuento > 0 && (
                    <span className="label-sm text-primary font-semibold">
                      Precio final: ${(form.precio_prod * (1 - (form.descuento ?? 0) / 100)).toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Código de Barras</label>
                <input
                  type="text"
                  value={form.codigo_barras ?? ''}
                  onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                  placeholder="Ej. 7701234567890"
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                />
                <p className="label-sm text-on-surface-variant/60">Opcional. Para usar el lector de código de barras en el POS.</p>
              </div>

              <div className="space-y-1.5">
                <label className="label-sm text-on-surface-variant">Categorías</label>
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
                      className={`px-3 py-1.5 rounded-lg label-sm transition-all border ${
                        form.fk_cod_cats?.includes(c.cod_cat!)
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline'
                      }`}
                    >
                      {c.nom_cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">Stock Inicial *</label>
                  <input
                    type="number"
                    value={form.stock_actual}
                    disabled={!!product}
                    onFocus={e => e.target.select()}
                    onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value === '' ? '' as unknown as number : Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-40 disabled:bg-surface-container-low"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">Límite Mínimo *</label>
                  <input
                    type="number"
                    value={form.stock_minimo}
                    onFocus={e => e.target.select()}
                    onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value === '' ? '' as unknown as number : Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
              </div>

              {!product && (
                <div className="space-y-1.5">
                  <label className="label-sm text-on-surface-variant">Proveedor (Opcional)</label>
                  <select
                    value={form.fk_cod_prov || ''}
                    onChange={e => setForm(f => ({ ...f, fk_cod_prov: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                  >
                    <option value="">Ninguno</option>
                    {suppliers.map(s => (
                      <option key={s.cod_prov} value={s.cod_prov}>{s.nom_prov}</option>
                    ))}
                  </select>
                  <p className="label-sm text-on-surface-variant/60">Si seleccionas uno, el producto quedará vinculado a él automáticamente.</p>
                </div>
              )}
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

        <div className="px-6 py-4 bg-surface border-t border-outline-variant/30 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-outline-variant/50 py-2.5 label-sm text-on-surface-variant hover:bg-surface-container-low transition-all"
          >
            {activeTab === 'stock' ? 'Volver' : 'Cancelar'}
          </button>
          {activeTab === 'info' && (
            <button
              type="submit"
              form="productForm"
              disabled={saving || (!hasChanges && !!product)}
              className={`flex-1 rounded-xl py-2.5 label-sm shadow-sm transition-all active:scale-[0.98] ${
                !hasChanges && !!product 
                  ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:opacity-90 disabled:opacity-60'
              }`}
            >
              {saving ? 'Procesando...' : (product ? (hasChanges ? 'Guardar Cambios (Seguro)' : 'Sin Cambios') : 'Crear Producto')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
