import { type IHttpClient } from '../core/http/HttpClient';
import { type AuthService } from './AuthService';
import type { Order, PaginatedOrders, Invoice, Paginated } from '../models/Order';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface CreateOrderDto {
  metodopago_usu: string;
  items: { cod_prod: number; cantidad: number; precio_unit: number; nom_prod?: string; url_imagen?: string; stock_actual?: number }[];
}

export class OrderService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Dashboard Stats (Direct from API Gateway)
  async getDashboardStats(): Promise<any> {
    const response = await this.httpClient.get<any>('/dashboard/stats', this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al obtener estadísticas del dashboard');
    return response.data;
  }

  // Orders (Sales)
  async getOrders(page: number = 1, limit: number = 20): Promise<PaginatedOrders | Order[]> {
    const response = await this.httpClient.get<any>(
      `/orders?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving orders');
    return response.data;
  }

  async getOrderById(id: number): Promise<Order> {
    const response = await this.httpClient.get<Order>(`/orders/${id}`, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving order details');
    return response.data;
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const cleanDto = {
      ...dto,
      items: dto.items.map(item => ({
        cod_prod: item.cod_prod,
        cantidad: item.cantidad,
        precio_unit: item.precio_unit,
        nom_prod: item.nom_prod
      }))
    };
    const res = await this.httpClient.post<Order>('/orders', cleanDto, { headers: this.getAuthHeaders() });
    if (!res.ok || !res.data) throw new Error(res.error ?? 'Error al crear venta');
    return res.data;
  }

  async updateOrderStatus(id: number, estado: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada' | 'pagado' | 'pagada'): Promise<Order> {
    const res = await this.httpClient.put<Order>(
      `/orders/${id}/status`,
      { estado },
      { headers: this.getAuthHeaders() }
    );
    if (!res.ok || !res.data) throw new Error(res.error ?? 'Error al actualizar estado');
    return res.data;
  }

  async deleteOrder(id: number): Promise<void> {
    const response = await this.httpClient.delete(`/orders/${id}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error(response.error || 'Error deleting order');
  }

  async createCheckoutSession(orderId: number): Promise<{ checkoutUrl: string }> {
    const res = await this.httpClient.post<any>(
      `/orders/checkout/${orderId}`,
      {
        success_url: `${window.location.origin}/panel?tab=ventas&status=success&order_id=${orderId}`,
        cancel_url: `${window.location.origin}/panel?tab=ventas&status=cancel`,
      },
      { headers: this.getAuthHeaders() }
    );
    if (!res.ok || !res.data) throw new Error(res.error ?? 'Error al generar sesión de pago');
    return res.data;
  }

  // Export
  async exportPdf(): Promise<void> {
    try {
      const res = await this.getOrders(1, 1000);
      const orders = Array.isArray(res) ? res : (res.data || []);

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(236, 19, 30);
      doc.text('KIORA - Reporte de Ventas', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 28);

      const totalMonto = orders.reduce((sum, o) => sum + Number(o.montofinal_vent || 0), 0);
      const tableData = orders.map(o => [
        `#${o.id_vent}`,
        o.fecha_vent ? new Date(o.fecha_vent).toLocaleDateString() : '—',
        (o.metodopago_usu || 'Efectivo').toUpperCase(),
        (o.estado || 'Pendiente').toUpperCase(),
        `$${Number(o.montofinal_vent || 0).toLocaleString('es-CO')}`
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Fecha', 'Método Pago', 'Estado', 'Monto']],
        body: tableData,
        foot: [['', '', '', 'TOTAL:', `$${totalMonto.toLocaleString('es-CO')}`]],
        headStyles: { fillColor: [236, 19, 30] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      doc.save(`kiora_ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      throw new Error('Error al generar PDF de ventas');
    }
  }

  async exportExcel(): Promise<void> {
    try {
      const response = await this.httpClient.get<any>('/orders?page=1&limit=1000', {
        headers: this.getAuthHeaders()
      });
      const orders = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      const totalMonto = orders.reduce((sum, o) => sum + Number(o.montofinal_vent || 0), 0);
      const data = [
        ...orders.map(o => ({
          'ID Venta': o.id_vent,
          'Fecha': o.fecha_vent ? new Date(o.fecha_vent).toLocaleString('es-CO') : '—',
          'Método Pago': (o.metodopago_usu || 'Efectivo').toUpperCase(),
          'Estado': (o.estado || 'Pendiente').toUpperCase(),
          'Total ($)': Number(o.montofinal_vent || 0)
        })),
        {
          'ID Venta': '',
          'Fecha': '',
          'Método Pago': '',
          'Estado': 'TOTAL:',
          'Total ($)': totalMonto
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas Kiora");

      // Auto-ajustar anchos de columna básicos
      const wscols = [
        { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `kiora_reporte_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error(e);
      throw new Error('Error al generar Excel de ventas');
    }
  }

  async downloadReceipt(orderId: number): Promise<void> {
    try {
      // Intentar usar el microservicio de reportes del backend (PDF oficial/térmico)
      const blob = await this.httpClient.download(`/reports/receipt/${orderId}`, this.getAuthHeaders());
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo_kiora_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Fallo al descargar recibo del backend, usando fallback local jsPDF:', e);
      
      // Fallback local: Generar el PDF en el cliente si el microservicio falla o no está disponible
      const order = await this.getOrderById(orderId);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200]
      });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('KIORA', 40, 15, { align: 'center' });

      doc.setFontSize(9);
      doc.text(`Recibo de Compra #${order.id_vent}`, 5, 32);
      doc.text(`Fecha: ${order.fecha_vent ? new Date(order.fecha_vent).toLocaleString('es-CO') : '—'}`, 5, 37);

      let y = 45;
      doc.setFontSize(8);
      (order.items || []).forEach(item => {
        doc.text((item.nom_prod || 'Producto').substring(0, 15), 5, y);
        doc.text(item.cantidad?.toString() || '1', 45, y);
        doc.text(`$${Number(item.precio_unit).toLocaleString('es-CO')}`, 55, y);
        y += 5;
      });

      y += 10;
      doc.setFontSize(10);
      doc.text('TOTAL:', 5, y);
      doc.text(`$${Number(order.montofinal_vent).toLocaleString('es-CO')}`, 75, y, { align: 'right' });

      doc.save(`ticket_${order.id_vent}.pdf`);
    }
  }

  // Invoices
  private normalizeInvoice(f: any): Invoice {
    return {
      ...f,
      id_fact: f.id_fact ?? f.id,
      fecha_fact: f.fecha_fact ?? f.emitida_en,
      id_pedido: f.id_pedido ?? f.fk_id_vent,
      total_fact: f.total_fact ?? f.montototal_vent
    };
  }

  async getInvoices(page = 1, limit = 20): Promise<Paginated<Invoice>> {
    const res = await this.httpClient.get<Paginated<Invoice>>(
      `/invoices?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!res.ok) {
      if (res.status === 404) return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      throw new Error(res.error ?? 'Error al obtener facturas');
    }

    const data = res.data;
    if (data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(f => this.normalizeInvoice(f))
      };
    }
    return data ?? { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  async getInvoiceById(id: number): Promise<Invoice> {
    const res = await this.httpClient.get<Invoice>(`/invoices/${id}`, this.getAuthHeaders());
    if (!res.ok || !res.data) throw new Error(res.error ?? 'Factura no encontrada');
    return this.normalizeInvoice(res.data);
  }

  async createInvoice(dto: any): Promise<Invoice> {
    const res = await this.httpClient.post<Invoice>('/invoices', dto, { headers: this.getAuthHeaders() });
    if (!res.ok || !res.data) throw new Error(res.error ?? 'Error al emitir factura');
    return this.normalizeInvoice(res.data);
  }

  async exportInvoicesExcel(): Promise<void> {
    try {
      const response = await this.getInvoices(1, 1000);
      const invoices = Array.isArray(response.data) ? response.data : (response.data || []);

      const totalMonto = invoices.reduce((sum, f) => sum + Number(f.total_fact || 0), 0);
      const data = [
        ...invoices.map(f => ({
          'ID Factura': f.id_fact,
          'Fecha': f.fecha_fact ? new Date(f.fecha_fact).toLocaleString('es-CO') : '—',
          'ID Venta': f.id_pedido,
          'Cantidad Items': f.cantidad_vent,
          'Monto Total ($)': Number(f.total_fact || 0)
        })),
        {
          'ID Factura': '',
          'Fecha': '',
          'ID Venta': '',
          'Cantidad Items': 'TOTAL:',
          'Monto Total ($)': totalMonto
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas Kiora");

      const wscols = [
        { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 18 }
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `kiora_reporte_facturas_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error(e);
      throw new Error('Error al generar Excel de facturas');
    }
  }
}
