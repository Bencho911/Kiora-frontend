import { type IHttpClient } from '../core/http/HttpClient';
import { type AuthService } from './AuthService';
import type { Order, PaginatedOrders, Invoice, Paginated, CreateOrderDto } from '../models/Order';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


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
  async getDashboardStats(period?: string): Promise<any> {
    const url = period ? `/dashboard/stats?period=${period}` : '/dashboard/stats';
    const response = await this.httpClient.get<any>(url, this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error al obtener estadísticas del dashboard');
    return response.data;
  }

  // Orders (Sales)
  async getOrders(page: number = 1, limit: number = 20): Promise<PaginatedOrders> {
    const response = await this.httpClient.get<any>(
      `/orders?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving orders');
    
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        data: data,
        pagination: { page, limit, total: data.length, totalPages: 1 }
      };
    }
    
    return data as PaginatedOrders;
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
      const pageWidth = 210; // A4 mm

      const doc = new jsPDF('landscape');

      // ── Header bar ──
      doc.setFillColor(236, 19, 30);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 6, 'F');

      // ── Title ──
      doc.setFontSize(22);
      doc.setTextColor(26, 26, 26);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Ventas', 14, 22);

      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`Kiora Micro-Market — Generado el: ${new Date().toLocaleString('es-CO')}`, 14, 30);

      // Línea decorativa
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(14, 34, doc.internal.pageSize.getWidth() - 14, 34);

      // ── Summary cards ──
      const totalOrders = orders.length;
      const totalMonto = orders.reduce((sum, o) => sum + Number(o.montofinal_vent || 0), 0);
      const avgTicket = totalOrders > 0 ? totalMonto / totalOrders : 0;
      const paidOrders = orders.filter(o => ['pagado', 'pagada', 'completada'].includes((o.estado || '').toLowerCase())).length;

      const summaryY = 42;
      const cardW = 52;
      const cardGap = 4;
      const cardStartX = 14;

      const summaryData = [
        { label: 'Total Ventas', value: totalOrders.toString(), color: [59, 130, 246] },
        { label: 'Ingresos', value: `$${totalMonto.toLocaleString('es-CO')}`, color: [16, 185, 129] },
        { label: 'Ticket Promedio', value: `$${Math.round(avgTicket).toLocaleString('es-CO')}`, color: [245, 158, 11] },
        { label: 'Completadas', value: paidOrders.toString(), color: [139, 92, 246] },
      ];

      summaryData.forEach((item, i) => {
        const x = cardStartX + i * (cardW + cardGap);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(x, summaryY, cardW, 20, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x + 4, summaryY + 6);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.text(item.value, x + 4, summaryY + 17);
      });

      // ── Table ──
      const tableData = orders.map(o => [
        `#${o.id_vent}`,
        o.fecha_vent ? new Date(o.fecha_vent).toLocaleDateString('es-CO') : '—',
        (o.metodopago_usu || 'Efectivo').toUpperCase(),
        (o.estado || 'Pendiente').toUpperCase(),
        `$${Number(o.montofinal_vent || 0).toLocaleString('es-CO')}`
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['ID', 'Fecha', 'Método de Pago', 'Estado', 'Monto']],
        body: tableData,
        foot: [['', '', '', 'TOTAL:', `$${totalMonto.toLocaleString('es-CO')}`]],
        margin: { left: 14, right: 14, top: 30, bottom: 20 },
        headStyles: {
          fillColor: [236, 19, 30],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [42, 42, 42],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
        },
        columnStyles: {
          0: { cellPadding: { left: 6, right: 6, top: 3, bottom: 3 } },
          4: { halign: 'right' },
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          const pageNum = doc.getCurrentPageInfo().pageNumber;
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Página ${pageNum} de ${pageCount}`,
            doc.internal.pageSize.getWidth() - 14,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'right' }
          );
          doc.text('Kiora — Sistema de Venta Automatizada 24/7', 14, doc.internal.pageSize.getHeight() - 10);
        },
      });

      doc.save(`kiora_ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      throw new Error('Error al generar PDF de ventas');
    }
  }

  async exportExcel(): Promise<void> {
    try {
      const response = await this.httpClient.get<any>('/orders?page=1&limit=1000', this.getAuthHeaders());
      const orders = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      const totalMonto = orders.reduce((sum: number, o: any) => sum + Number(o.montofinal_vent || 0), 0);
      const totalOrders = orders.length;
      const paidOrders = orders.filter((o: any) => ['pagado', 'pagada', 'completada'].includes((o.estado || '').toLowerCase())).length;
      const avgTicket = totalOrders > 0 ? totalMonto / totalOrders : 0;

      // Fecha en que se generó
      const now = new Date().toLocaleString('es-CO');

      // Datos principales
      const data = [
        { 'ID Venta': '', 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': '' },
        { 'ID Venta': 'REPORTE DE VENTAS — Kiora Micro-Market', 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': '' },
        { 'ID Venta': `Generado: ${now}`, 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': '' },
        { 'ID Venta': '', 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': '' },
        { 'ID Venta': 'Total Ventas', 'Fecha': String(totalOrders), 'Método Pago': 'Completadas', 'Estado': String(paidOrders), 'Total ($)': `Ticket Prom: $${Math.round(avgTicket).toLocaleString('es-CO')}` },
        { 'ID Venta': '', 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': '' },
        { 'ID Venta': 'ID Venta', 'Fecha': 'Fecha', 'Método Pago': 'Método Pago', 'Estado': 'Estado', 'Total ($)': 'Total ($)' },
        ...orders.map((o: any) => ({
          'ID Venta': o.id_vent,
          'Fecha': o.fecha_vent ? new Date(o.fecha_vent).toLocaleString('es-CO') : '—',
          'Método Pago': (o.metodopago_usu || 'Efectivo').toUpperCase(),
          'Estado': (o.estado || 'Pendiente').toUpperCase(),
          'Total ($)': Number(o.montofinal_vent || 0)
        })),
        { 'ID Venta': '', 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': '' },
        { 'ID Venta': 'TOTAL', 'Fecha': '', 'Método Pago': '', 'Estado': '', 'Total ($)': totalMonto },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });

      // Anchos de columna
      worksheet['!cols'] = [
        { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 18 }
      ];

      // Congelar fila de encabezado (fila 7)
      worksheet['!freeze'] = { x: 0, y: 7 };

      // Auto-filtro en el encabezado
      const lastRow = data.length;
      worksheet['!autofilter'] = { ref: `A7:E${lastRow}` };

      // Formato de moneda en columna E (desde fila 8 hasta la última)
      for (let i = 8; i <= lastRow; i++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: i - 1, c: 4 })];
        if (cell && typeof cell.v === 'number') {
          cell.z = '$#,##0';
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas Kiora");

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

  /**
   * Emite factura electrónica (registro en backend) a partir de una venta ya pagada/completada.
   * Usa totales agregados según el contrato POST /invoices del API.
   */
  async emitInvoiceForOrder(order: Order): Promise<Invoice> {
    const user = this.authService.getUser();
    const idUsu = user?.id_usu ?? user?.id;
    if (idUsu === undefined || idUsu === null) {
      throw new Error('No hay usuario en sesión para emitir la factura.');
    }
    if (!order.id_vent) throw new Error('Venta sin identificador.');
    const items = order.items ?? [];
    const cantidad = items.reduce((s, it) => s + (it.cantidad || 0), 0) || 1;
    const total = Number(order.montofinal_vent ?? 0);
    const precioPromedio = cantidad > 0 ? total / cantidad : total;

    // 1. Crear factura local en orders-service
    const result = await this.createInvoice({
      fk_id_vent: order.id_vent,
      id_usu: Number(idUsu),
      cantidad_vent: cantidad,
      precio_prod: precioPromedio,
      montototal_vent: total,
    });

    // 2. Emitir factura electronica simulada via reports-service
    try {
      await this.httpClient.get<any>(`/reports/electronic-invoice/${order.id_vent}`, this.getAuthHeaders());
    } catch (e) {
      console.warn('Electronic invoice generation note:', e);
    }

    return result;
  }

  async cancelFactusInvoice(orderId: number, factusNumber: string): Promise<any> {
    const response = await this.httpClient.post<any>(
      `/reports/electronic-invoice/${orderId}/cancel`,
      { factus_number: factusNumber },
      { headers: this.getAuthHeaders() }
    );
    return response.ok ? response.data : { status: 'FAILED' };
  }

  async exportInvoicesExcel(): Promise<void> {
    try {
      const response = await this.getInvoices(1, 1000);
      const invoices = Array.isArray(response.data) ? response.data : (response.data || []);

      const totalMonto = invoices.reduce((sum, f) => sum + Number(f.total_fact || 0), 0);
      const totalCount = invoices.length;

      const now = new Date().toLocaleString('es-CO');

      const data = [
        { 'ID Factura': '', 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': 'REPORTE DE FACTURAS — Kiora Micro-Market', 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': `Generado: ${now}`, 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': '', 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': `Total Facturas: ${totalCount}`, 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': '', 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': 'ID Factura', 'Fecha': 'Fecha', 'ID Venta': 'ID Venta', 'Cantidad Items': 'Cantidad', 'Monto Total ($)': 'Monto Total ($)' },
        ...invoices.map(f => ({
          'ID Factura': f.id_fact,
          'Fecha': f.fecha_fact ? new Date(f.fecha_fact).toLocaleString('es-CO') : '—',
          'ID Venta': f.id_pedido,
          'Cantidad Items': f.cantidad_vent,
          'Monto Total ($)': Number(f.total_fact || 0)
        })),
        { 'ID Factura': '', 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': '' },
        { 'ID Factura': 'TOTAL', 'Fecha': '', 'ID Venta': '', 'Cantidad Items': '', 'Monto Total ($)': totalMonto },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
      worksheet['!cols'] = [
        { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 18 }
      ];
      worksheet['!freeze'] = { x: 0, y: 7 };

      const lastRow = data.length;
      worksheet['!autofilter'] = { ref: `A7:E${lastRow}` };

      for (let i = 8; i <= lastRow; i++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: i - 1, c: 4 })];
        if (cell && typeof cell.v === 'number') {
          cell.z = '$#,##0';
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas Kiora");

      XLSX.writeFile(workbook, `kiora_reporte_facturas_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error(e);
      throw new Error('Error al generar Excel de facturas');
    }
  }
}
