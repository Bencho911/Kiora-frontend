import { type IHttpClient } from '../core/http/HttpClient';
import { type AuthService } from './AuthService';
import type { Supplier, Movement, PaginatedSuppliers, PaginatedMovements, Suministra } from '../models/Inventory';

export class InventoryService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Suppliers
  async getSuppliers(page: number = 1, limit: number = 20): Promise<PaginatedSuppliers> {
    const response = await this.httpClient.get<PaginatedSuppliers>(
      `/inventory/suppliers?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving suppliers');
    return response.data;
  }
  
  async getSupplierById(id: number): Promise<Supplier> {
    const response = await this.httpClient.get<Supplier>(`/inventory/suppliers/${id}`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al obtener detalles del proveedor');
    return response.data;
  }

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const response = await this.httpClient.post<Supplier>('/inventory/suppliers', supplier, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error creating supplier');
    return response.data;
  }

  async updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    const response = await this.httpClient.put<Supplier>(`/inventory/suppliers/${id}`, supplier, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error updating supplier');
    return response.data;
  }

  async deleteSupplier(id: number): Promise<void> {
    const response = await this.httpClient.delete(`/inventory/suppliers/${id}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error(response.error || 'Error deleting supplier');
  }

  // Movements
  async getMovements(cod_prod?: number, page: number = 1, limit: number = 20): Promise<PaginatedMovements> {
    const url = cod_prod
      ? `/inventory/movements?cod_prod=${cod_prod}&page=${page}&limit=${limit}`
      : `/inventory/movements?page=${page}&limit=${limit}`;
    const response = await this.httpClient.get<PaginatedMovements>(url, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving movements');
    return response.data;
  }

  async createMovement(movement: Partial<Movement>): Promise<Movement> {
    const response = await this.httpClient.post<Movement>('/inventory/movements', movement, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error creating movement');
    return response.data;
  }

  // Low Stock & Suministra
  async getLowStock(): Promise<{ data: Suministra[] }> {
    const response = await this.httpClient.get<{ data: Suministra[] }>('/inventory/low-stock', this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving low stock');
    return response.data;
  }

  async upsertSuministra(suministra: Partial<Suministra>): Promise<Suministra> {
    const response = await this.httpClient.post<Suministra>('/inventory/suministra', suministra, { headers: this.getAuthHeaders() });
    if (!response.ok || !response.data) throw new Error(response.error || 'Error upserting suministra');
    return response.data;
  }

  async getSuministra(page: number = 1, limit: number = 50): Promise<{ data: Suministra[], pagination: any }> {
    const response = await this.httpClient.get<any>(`/inventory/suministra?page=${page}&limit=${limit}`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving suministra records');
    return response.data;
  }

  async getSuministraById(id: number): Promise<Suministra> {
    const response = await this.httpClient.get<Suministra>(`/inventory/suministra/${id}`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al obtener registro de suministra');
    return response.data;
  }

  async getSuministraByProduct(cod_prod: number): Promise<Suministra | null> {
    const response = await this.httpClient.get<Suministra>(`/inventory/suministra/product/${cod_prod}`, this.getAuthHeaders());
    if (response.status === 404) return null;
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al obtener suministra por producto');
    return response.data;
  }

  // ── Reservations (Redis Based) ───────────────────────────────────────────
  
  async reserveInventory(orderId: number, items: { cod_prod: number; cantidad: number }[]): Promise<void> {
    const response = await this.httpClient.post('/inventory/reserve', { orderId, items }, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error(response.error || 'Error al reservar inventario');
  }

  async commitReservation(orderId: number): Promise<void> {
    const response = await this.httpClient.post('/inventory/reserve/commit', { orderId }, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error(response.error || 'Error al confirmar la reserva de inventario');
  }

  // ── Kardex & Alerts ──────────────────────────────────────────────────────
  
  async getAlerts(): Promise<any> {
    const response = await this.httpClient.get<any>('/inventory/alerts', this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving inventory alerts');
    return response.data;
  }

  async getProductKardex(cod_prod: number): Promise<any> {
    const response = await this.httpClient.get<any>(`/inventory/products/${cod_prod}/kardex`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving product kardex');
    return response.data;
  }
}

