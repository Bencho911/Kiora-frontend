import { type IHttpClient } from '../core/http/HttpClient';
import { type AuthService } from './AuthService';
import type { Order } from '../models/Order';
import type { Product } from '../models/Product';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  grouping: 'dia' | 'semana' | 'mes' | 'unidad';
  reportType: 'ventas_detalladas' | 'mas_vendidos' | 'menos_vendidos';
  topN?: number;
  category?: number;
}

export interface DetailedSalesReport {
  period: string;
  totalSales: number;
  orderCount: number;
  averageTicket: number;
}

export interface ProductRankingReport {
  position: number;
  productName: string;
  productCode: number;
  quantitySold: number;
  totalRevenue: number;
}

export class ReportService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Fetch all orders within a range to process locally
  // (In a real production app, this should be done in the backend)
  async getDetailedSales(filters: ReportFilters): Promise<DetailedSalesReport[]> {
    const res = await this.httpClient.get<{ data: Order[] }>(
      `/orders?limit=1000&startDate=${filters.startDate}&endDate=${filters.endDate}`,
      this.getAuthHeaders()
    );
    
    if (!res.ok || !res.data) throw new Error('Error al obtener datos de ventas');
    
    const orders = res.data.data || [];

    if (filters.grouping === 'unidad') {
      const unitData: DetailedSalesReport[] = [];
      orders.forEach(order => {
        const dateStr = order.fecha_vent ? new Date(order.fecha_vent).toLocaleDateString() : 'S/F';
        (order.items || []).forEach(item => {
          unitData.push({
            period: `${item.nom_prod || `Prod #${item.cod_prod}`} (Ped #${order.id_vent} - ${dateStr})`,
            totalSales: item.cantidad * (item.precio_unit || 0),
            orderCount: item.cantidad,
            averageTicket: item.precio_unit || 0
          });
        });
      });
      return unitData;
    }

    const groupedData: Record<string, { total: number; count: number }> = {};

    orders.forEach(order => {
      const date = new Date(order.fecha_vent!);
      let period = '';

      if (filters.grouping === 'dia') {
        period = date.toISOString().split('T')[0];
      } else if (filters.grouping === 'semana') {
        // Simple ISO week logic
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        period = `${d.getUTCFullYear()}-W${weekNo}`;
      } else {
        period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!groupedData[period]) {
        groupedData[period] = { total: 0, count: 0 };
      }
      groupedData[period].total += Number(order.montofinal_vent);
      groupedData[period].count += 1;
    });

    return Object.entries(groupedData).map(([period, data]) => ({
      period,
      totalSales: data.total,
      orderCount: data.count,
      averageTicket: data.total / data.count
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getProductRanking(filters: ReportFilters): Promise<ProductRankingReport[]> {
    const res = await this.httpClient.get<{ data: Order[] }>(
      `/orders?limit=1000&startDate=${filters.startDate}&endDate=${filters.endDate}`,
      this.getAuthHeaders()
    );

    if (!res.ok || !res.data) throw new Error('Error al obtener datos para el ranking');

    const orders = res.data.data || [];
    const stats: Record<number, { name: string; qty: number; revenue: number }> = {};

    // Fetch product names for missing ones
    let productMap: Record<number, string> = {};
    try {
      const { productService } = await import('@/config/setup');
      const pRes = await productService.getProducts(1, 1000);
      const pList = Array.isArray(pRes) ? pRes : (pRes.data || []);
      pList.forEach((p: any) => { productMap[p.cod_prod] = p.nom_prod; });
    } catch (e) {
      console.warn('Could not load product map for ranking enrichment:', e);
    }

    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (!stats[item.cod_prod]) {
          stats[item.cod_prod] = { 
            name: item.nom_prod || productMap[item.cod_prod] || `Producto #${item.cod_prod}`, 
            qty: 0, 
            revenue: 0 
          };
        }
        stats[item.cod_prod].qty += item.cantidad;
        stats[item.cod_prod].revenue += item.cantidad * item.precio_unit;
      });
    });

    let ranking = Object.entries(stats).map(([code, data]) => ({
      productCode: Number(code),
      productName: data.name,
      quantitySold: data.qty,
      totalRevenue: data.revenue,
      position: 0
    }));

    if (filters.reportType === 'mas_vendidos') {
      ranking.sort((a, b) => b.quantitySold - a.quantitySold);
    } else {
      ranking.sort((a, b) => a.quantitySold - b.quantitySold);
    }

    if (filters.topN) {
      ranking = ranking.slice(0, filters.topN);
    }

    return ranking.map((item, index) => ({ ...item, position: index + 1 }));
  }

  async exportToExcel(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  async exportToPdf(title: string, head: string[][], body: any[][], fileName: string, foot?: string[][]) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: head,
      body: body,
      foot: foot,
      headStyles: { fillColor: [236, 19, 30] }, // Kiora Red
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save(`${fileName}.pdf`);
  }
}
