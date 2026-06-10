import { API_URL } from '@/config/setup';

export interface SessionData {
  id: number;
  fecha_apertura: string;
  saldo_inicial: number;
  estado: 'ABIERTA' | 'CERRADA';
  fecha_cierre: string | null;
  saldo_final_calculado: number | null;
  saldo_final_real: number | null;
  descuadre: number | null;
  notas: string | null;
  apertura_usuario_id: number;
  cierre_usuario_id: number | null;
  total_ventas_vivo?: number;
}

class SessionService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('kiora_token')}`,
    };
  }

  async getCurrentSession(): Promise<SessionData | null> {
    const res = await fetch(`${API_URL}/orders/sessions/current`, {
      headers: this.getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Error al obtener sesión actual');
    return res.json();
  }

  async openSession(saldo_inicial: number, notas?: string): Promise<SessionData> {
    const res = await fetch(`${API_URL}/orders/sessions/open`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ saldo_inicial, notas })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al abrir caja');
    return data;
  }

  async closeSession(saldo_final_real: number = 0, notas?: string): Promise<SessionData> {
    const res = await fetch(`${API_URL}/orders/sessions/close`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ saldo_final_real, notas })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cerrar caja');
    return data.sesion;
  }
}

export const sessionService = new SessionService();
