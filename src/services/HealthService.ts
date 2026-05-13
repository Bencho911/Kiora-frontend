import { type IHttpClient } from '../core/http/HttpClient';

export interface ServiceHealth {
  status: 'up' | 'down';
  statusCode?: number;
  error?: string;
}

export interface GatewayHealthResponse {
  gateway: string;
  services: Record<string, ServiceHealth>;
}

export class HealthService {
  constructor(private httpClient: IHttpClient) {}

  async getAllHealth(): Promise<GatewayHealthResponse> {
    const response = await this.httpClient.get<GatewayHealthResponse>('/health/all');
    if (!response.ok || !response.data) {
      throw new Error(response.error || 'No se pudo obtener el estado de los servicios');
    }
    return response.data;
  }
}
