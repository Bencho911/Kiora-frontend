import type { IHttpClient } from '../core/http/HttpClient';
import type { AuthService } from './AuthService';
import type { Product, Category, PaginatedProducts } from '../models/Product';

export interface CreateProductDto {
  nom_prod: string;
  desc_prod?: string;
  precio_prod: number;
  stock_actual?: number;
  stock_minimo?: number;
  fk_cod_cats?: number[];
  imagen?: File;
  alerta_stock_critico?: boolean;
}

export class ProductService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private ensureArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
    return [];
  }

  private normalizeProduct(p: any): Product {
    return {
      ...p,
      precio_prod: p.precio_prod ?? p.precio_unitario ?? 0,
      desc_prod: p.desc_prod ?? p.descrip_prod,
      imagen_prod: p.imagen_prod ?? p.url_imagen,
      fk_cod_cats: p.fk_cod_cats || (p.fk_cod_cat ? [p.fk_cod_cat] : [])
    };
  }

  // Products
  async getProducts(page: number = 1, limit: number = 20): Promise<Product[] | PaginatedProducts> {
    const response = await this.httpClient.get<any>(
      `/products?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!response.ok || !response.data) {
      console.error('HTTP Error Response:', response);
      throw new Error(response.error || 'Error retrieving products');
    }

    const data = response.data;
    if (Array.isArray(data)) {
      return data.map(p => this.normalizeProduct(p));
    }

    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map((p: any) => this.normalizeProduct(p))
      };
    }

    return [];
  }

  async getProductById(id: number): Promise<Product> {
    const response = await this.httpClient.get<Product>(`/products/${id}`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving product');
    return this.normalizeProduct(response.data);
  }

  async getLowStockProducts(): Promise<Product[]> {
    const response = await this.httpClient.get<any>('/products/low-stock', this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving low stock products');
    return this.ensureArray<any>(response.data).map(p => this.normalizeProduct(p));
  }

  // Alias for backward compatibility with older components
  async getLowStock(): Promise<{ data: Product[] }> {
    const data = await this.getLowStockProducts();
    return { data };
  }

  async createProduct(dto: CreateProductDto | FormData): Promise<Product> {
    const body = this.prepareBody(dto);
    const response = await this.httpClient.post<Product>('/products', body, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error creating product');
    return this.normalizeProduct(response.data);
  }

  async updateProduct(id: number, dto: CreateProductDto | FormData): Promise<Product> {
    const body = this.prepareBody(dto);
    const response = await this.httpClient.put<Product>(`/products/${id}`, body, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error updating product');
    return this.normalizeProduct(response.data);
  }

  private prepareBody(dto: CreateProductDto | FormData): FormData {
    if (dto instanceof FormData) return dto;

    // IMPORTANTE: La ruta del backend usa multer (upload.single) ANTES de la
    // validación Joi. Cuando el cliente envía application/json, multer consume
    // el body stream sin parsearlo (no es multipart), dejando req.body = {} vacío
    // y Joi falla con 400. Por eso SIEMPRE enviamos FormData, con o sin imagen.
    const fd = new FormData();

    // Campos con nombres exactos que espera el schema Joi del backend
    fd.append('nom_prod', dto.nom_prod);
    fd.append('precio_unitario', String(dto.precio_prod));   // backend: precio_unitario

    if (dto.desc_prod) fd.append('descrip_prod', dto.desc_prod); // backend: descrip_prod
    if (dto.stock_actual !== undefined) fd.append('stock_actual', String(dto.stock_actual));
    if (dto.stock_minimo !== undefined) fd.append('stock_minimo', String(dto.stock_minimo));
    if (dto.fk_cod_cats?.length) fd.append('fk_cod_cats', JSON.stringify(dto.fk_cod_cats));
    if (dto.imagen) fd.append('imagen', dto.imagen);

    return fd;
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await this.httpClient.delete(`/products/${id}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error(response.error || 'Error deleting product');
  }

  async updateStock(id: number, cantidad: number): Promise<Product> {
    const response = await this.httpClient.put<Product>(
      `/products/${id}/stock`,
      { cantidad },
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al actualizar stock');
    return this.normalizeProduct(response.data);
  }

  /**
   * Obtiene productos vencidos. 
   * Dado que no hay un endpoint específico, filtramos localmente 
   * del lote de productos activos.
   */
  async getExpiredProducts(): Promise<Product[]> {
    const res = await this.getProducts(1, 1000);
    const list = Array.isArray(res) ? res : res.data;
    const today = new Date();
    return list.filter(p => p.fechaven_prod && new Date(p.fechaven_prod) < today);
  }

  // Categories
  async getCategories(page: number = 1, limit: number = 100): Promise<{ data: Category[], pagination: any }> {
    const response = await this.httpClient.get<any>(
      `/categories?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving categories');
    return response.data;
  }

  async getCategoryById(id: number): Promise<Category> {
    const response = await this.httpClient.get<Category>(`/categories/${id}`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al obtener detalles de la categoría');
    return response.data;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    const response = await this.httpClient.post<Category>('/categories', category, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error creating category');
    return response.data;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await this.httpClient.put<Category>(`/categories/${id}`, category, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error updating category');
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    const response = await this.httpClient.delete(`/categories/${id}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error(response.error || 'Error deleting category');
  }
}
