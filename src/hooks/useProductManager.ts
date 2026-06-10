import { useState, useEffect, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import { productService, alertService, inventoryService } from '@/config/setup';
import type { Product, Category } from '@/models/Product';
import type { CreateProductDto } from '@/services/ProductService';
import type { Movement } from '@/models/Inventory';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { pushAppNotification } from '@/lib/pushAppNotification';

export function useProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    categories: [] as number[],
    stock: 'all' as 'all' | 'available' | 'low' | 'out',
    minPrice: '',
    maxPrice: ''
  });

  const [pendingFilters, setPendingFilters] = useState({ ...activeFilters });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [detailMovement, setDetailMovement] = useState<Movement | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, c] = await Promise.all([
        productService.getProducts(1, 1000),
        productService.getCategories()
      ]);
      setProducts(Array.isArray(p) ? p : (p?.data || []));
      setCategories(Array.isArray(c) ? c : (c?.data || []));
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cargar datos'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadMovements = useCallback(async (productId: number) => {
    setLoadingMovements(true);
    try {
      const data = await inventoryService.getMovements(productId);
      setMovements(data && 'data' in data ? data.data : (Array.isArray(data) ? data : []));
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cargar movimientos'));
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const handleSaveProduct = async (dto: CreateProductDto | FormData, isEdit: boolean) => {
    try {
      if (isEdit && selectedProduct?.cod_prod) {
        await productService.updateProduct(selectedProduct.cod_prod, dto);
        alertService.showToast('success', 'Producto actualizado');
        pushAppNotification('info', 'Producto Actualizado', `Se han modificado los detalles del producto.`, { category: 'inventory', toast: false });
      } else {
        const newProduct = await productService.createProduct(dto);
        if (dto.fk_cod_prov && newProduct.cod_prod) {
          await inventoryService.upsertSuministra({
            fk_cod_prov: dto.fk_cod_prov,
            cod_prod: newProduct.cod_prod,
            stock_minimo: dto.stock_minimo || 0,
            stock: dto.stock_actual || 0
          });
        }
        alertService.showToast('success', 'Producto creado');
        pushAppNotification('success', 'Nuevo Producto', `Se ha añadido un nuevo producto al catálogo.`, { category: 'inventory', toast: false });
      }
      loadData();
    } catch (e) {
      const msg = getErrorMessage(e, 'Error al guardar producto');
      alertService.showToast('error', msg);
      pushAppNotification('error', 'Productos', msg, { category: 'inventory' });
      throw e;
    }
  };

  const handleSaveMovement = async (mov: Partial<Movement>) => {
    try {
      await inventoryService.createMovement(mov);
      alertService.showToast('success', 'Movimiento registrado');
      pushAppNotification('info', 'Movimiento de Inventario', `Se registró un movimiento de tipo ${mov.tipo_movimiento === 'ENTRADA' ? 'entrada' : 'salida'}.`, { category: 'inventory', toast: false });
      if (mov.cod_prod) await loadMovements(mov.cod_prod);
      loadData();
    } catch (e) {
      const msg = getErrorMessage(e, 'Error al registrar movimiento');
      alertService.showToast('error', msg);
      pushAppNotification('error', 'Movimiento de inventario', msg, { category: 'inventory' });
      throw e;
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    const { search, categories: selCats, stock, minPrice, maxPrice } = activeFilters;

    if (selCats.length > 0) {
      result = result.filter(p => p.fk_cod_cats?.some(c => selCats.includes(c)));
    }

    if (stock === 'available') result = result.filter(p => (p.stock_actual || 0) > (p.stock_minimo || 5));
    if (stock === 'low') result = result.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 5) && (p.stock_actual || 0) > 0);
    if (stock === 'out') result = result.filter(p => (p.stock_actual || 0) === 0);

    if (minPrice !== '') result = result.filter(p => (p.precio_prod || 0) >= Number(minPrice));
    if (maxPrice !== '') result = result.filter(p => (p.precio_prod || 0) <= Number(maxPrice));

    if (search.trim()) {
      const fuse = new Fuse(result, { keys: ['nom_prod', 'desc_prod', 'cod_prod'], threshold: 0.3 });
      result = fuse.search(search).map(r => r.item);
    }

    // Ordenar: los agotados (stock <= 0) van al final
    result.sort((a, b) => {
      const aOut = (a.stock_actual || 0) <= 0;
      const bOut = (b.stock_actual || 0) <= 0;
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;
      return 0;
    });

    return result;
  }, [products, activeFilters]);

  const handleApplyFilters = () => {
    setActiveFilters({ ...pendingFilters });
    setShowFilters(false);
    alertService.showToast('success', 'Filtros aplicados');
  };

  const handleClearFilters = () => {
    const cleared = { search: '', categories: [], stock: 'all' as 'all' | 'available' | 'low' | 'out', minPrice: '', maxPrice: '' };
    setPendingFilters(cleared);
    setActiveFilters(cleared);
  };

  const handleDelete = async (id: number) => {
    try {
      const movementsData = await inventoryService.getMovements(id, 1, 1);
      const movementsArray = movementsData && 'data' in movementsData ? movementsData.data : (Array.isArray(movementsData) ? movementsData : []);
      
      if (movementsArray.length > 0) {
        alertService.showError('Acción no permitida', 'No se puede eliminar el producto porque tiene historial de movimientos de inventario o ventas asociadas. Por favor, asegúrese de que el producto no tenga dependencias antes de eliminarlo.');
        return;
      }

      await productService.deleteProduct(id);
      alertService.showToast('success', 'Producto eliminado');
      pushAppNotification('warning', 'Producto Eliminado', `Un producto ha sido eliminado del catálogo.`, { category: 'inventory', toast: false });
      loadData();
    } catch (e) { 
      alertService.showToast('error', getErrorMessage(e, 'Error al eliminar')); 
    }
  };

  const stockBadgeColor = (p: Product) => {
    const stock = p.stock_actual || 0;
    if (stock <= 0) return 'bg-red-500';
    if (stock <= (p.stock_minimo || 5)) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const toggleCategoryPending = (id: number) => {
    setPendingFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(id) 
        ? prev.categories.filter(c => c !== id) 
        : [...prev.categories, id]
    }));
  };

  return {
    products, categories, isLoading,
    activeFilters, setActiveFilters,
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
  };
}
