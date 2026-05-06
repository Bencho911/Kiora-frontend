import { type IHttpClient } from '../core/http/HttpClient';
import type { User } from '../models/User';

export interface LoginCredentials {
  correo_usu: string;
  password?: string;
}

export interface AuthData {
  token: string;
  usuario: User;
}

/**
 * Service to handle Authentication logic (SRP).
 */
export class AuthService {
  constructor(private httpClient: IHttpClient) {}

  async login(credentials: LoginCredentials): Promise<AuthData> {
    const response = await this.httpClient.post<AuthData>('/auth/login', credentials, {
      credentials: 'include' // needed for HttpOnly cookies or CORS
    });

    if (!response.ok || !response.data) {
      throw new Error(response.error ?? 'Error desconocido al iniciar sesión');
    }

    this.saveSession(response.data.token, response.data.usuario);
    return response.data;
  }

  async refreshToken(): Promise<string | null> {
    const response = await this.httpClient.post<{ token: string }>('/auth/refresh', undefined, {
      credentials: 'include'
    });
    
    if (response.ok && response.data?.token) {
      this.saveSession(response.data.token, this.getUser());
      return response.data.token;
    }
    return null;
  }

  async logout() {
    try {
      // Intentar cerrar sesión en el servidor (opcionalmente ignoramos errores si el servidor no responde)
      await this.httpClient.post('/auth/logout', undefined, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
    } catch (e) {
      console.error('Error al cerrar sesión en el servidor:', e);
    }
    this.clearSession();
    window.location.href = '/login';
  }

  saveSession(token: string, user: User | null) {
    if (user) {
      localStorage.setItem('kiora_token', token);
      localStorage.setItem('kiora_user', typeof user === 'string' ? user : JSON.stringify(user));
    }
  }

  clearSession() {
    localStorage.removeItem('kiora_token');
    localStorage.removeItem('kiora_user');
  }

  getToken(): string | null {
    return localStorage.getItem('kiora_token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('kiora_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      this.clearSession();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ── Password Recovery (HU05) ────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const response = await this.httpClient.post('/auth/forgot-password', {
      correo_usu: email
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al solicitar el código de recuperación');
    }
  }

  async verifyResetCode(email: string, code: string): Promise<void> {
    const response = await this.httpClient.post('/auth/verify-reset-code', {
      correo_usu: email,
      code: code
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Código inválido o expirado');
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const response = await this.httpClient.post('/auth/reset-password', {
      correo_usu: email,
      code: code,
      new_password: newPassword
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al restablecer la contraseña');
    }
  }

  isAdmin(): boolean {
    const user = this.getUser();
    if (!user || !user.rol_usu) return false;
    const role = user.rol_usu.toLowerCase();
    return role === 'admin' || role === 'administrador';
  }
}

