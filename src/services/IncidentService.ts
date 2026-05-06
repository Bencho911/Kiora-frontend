import type { IHttpClient } from '../core/http/HttpClient';
import type { AuthService } from './AuthService';

export interface Incident {
  id_rep: number;
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'cancelado';
  fk_id_usu: number;
  cod_prod?: number;
  fecha_rep: string;
  observaciones_tecnicas?: string;
  nombre_usuario?: string; // Si el backend hace join
}

export class IncidentService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAll(): Promise<Incident[]> {
    const response = await this.httpClient.get<Incident[]>('/incidents', this.getAuthHeaders());
    if (!response.ok || !response.data) throw new Error(response.error || 'Error retrieving incidents');
    return response.data;
  }

  async updateStatus(id: number, estado: Incident['estado']): Promise<Incident> {
    const response = await this.httpClient.put<Incident>(
      `/incidents/${id}/estado`,
      { estado },
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error updating incident status');
    return response.data;
  }

  async create(incident: Partial<Incident>): Promise<Incident> {
    const response = await this.httpClient.post<Incident>(
      '/incidents',
      incident,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error creating incident');
    return response.data;
  }
}
