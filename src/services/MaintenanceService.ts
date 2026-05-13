import type { IHttpClient } from '../core/http/HttpClient';
import type { AuthService } from './AuthService';
import type { MaintenanceReport } from '../models/Maintenance';

export class MaintenanceService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private get baseURL(): string {
    return this.httpClient.baseURL;
  }

  private ensureArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
    return [];
  }

  // ── Reports ─────────────────────────────────────────────────────────────────
  // NOTE: These endpoints are not currently implemented in the Kiora microservices backend.
  // They serve as placeholders for future maintenance management modules.

  async getReports(): Promise<MaintenanceReport[]> {
    console.warn('Endpoint GET /maintenance/reports no implementado en el backend');
    return [];
  }

  async getReportById(_id: number): Promise<MaintenanceReport> {
    throw new Error('Módulo de mantenimiento no disponible en el servidor');
  }

  async createReport(_dto: Partial<MaintenanceReport>): Promise<MaintenanceReport> {
    throw new Error('Módulo de mantenimiento no disponible en el servidor');
  }

  async updateReport(_id: number, _dto: Partial<MaintenanceReport>): Promise<MaintenanceReport> {
    throw new Error('Módulo de mantenimiento no disponible en el servidor');
  }

  async deleteReport(_id: number): Promise<void> {
    throw new Error('Módulo de mantenimiento no disponible en el servidor');
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async exportExcel(): Promise<void> {
    throw new Error('Exportación de mantenimiento no disponible');
  }

  async exportPdf(): Promise<void> {
    throw new Error('Exportación de mantenimiento no disponible');
  }
}

