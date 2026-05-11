import type { IHttpClient } from '../core/http/HttpClient';
import type { AuthService } from './AuthService';

import type { Incident } from '../models/Incident';

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

  async update(id: number, incident: Partial<Incident>): Promise<Incident> {
    const response = await this.httpClient.put<Incident>(
      `/incidents/${id}`,
      incident,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok || !response.data) throw new Error(response.error || 'Error updating incident');
    return response.data;
  }

  async delete(id: number): Promise<void> {
    const response = await this.httpClient.delete<void>(
      `/incidents/${id}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error(response.error || 'Error deleting incident');
  }
}
