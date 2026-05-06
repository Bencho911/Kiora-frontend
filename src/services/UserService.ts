import { type IHttpClient } from '../core/http/HttpClient';
import { type AuthService } from './AuthService';
import type { User } from '../models/User';
import type { PaginatedUsers } from '../models/PaginatedUsers';
import { parsePaginatedUsersPayload } from './userResponse';

export interface RegisterUserDto {
  nom_usu: string;
  correo_usu: string;
  password?: string;
  tel_usu?: string;
  rol_usu?: string;
}

/**
 * Service to manage User logic like fetching users or unlocking them (SRP).
 */
export class UserService {
  constructor(
    private httpClient: IHttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private normalizeUser(u: any): User {
    return {
      ...u,
      tel_usu: u.tel_usu || u.telefono || u.telefono_usu || u.tel || u.phone || ''
    };
  }

  async fetchUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsers> {
    const response = await this.httpClient.get<unknown>(
      `/auth/users?page=${page}&limit=${limit}`,
      this.getAuthHeaders()
    );
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al consultar usuarios');
    }
    if (response.data == null) {
      throw new Error('Respuesta de usuarios sin cuerpo');
    }
    try {
      const paginated = parsePaginatedUsersPayload(response.data, page, limit);
      return {
        ...paginated,
        data: paginated.data.map(u => this.normalizeUser(u))
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Respuesta inválida';
      console.warn('[UserService.fetchUsers]', msg, response.data);
      throw new Error(msg);
    }
  }

  async registerUser(dto: RegisterUserDto): Promise<void> {
    const defaultPassword = dto.password || Math.random().toString(36).slice(-8); // Contraseña por defecto si no se pasa
    const payload = { ...dto, password: defaultPassword };

    // Se asume que /auth/register recibe el body en minúsculas y está protegido por isAdmin según el authController
    const response = await this.httpClient.post<unknown>('/auth/register', payload, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(response.error ?? 'Error al registrar el nuevo usuario');
    }
  }

  async unlockUser(id: string | number): Promise<boolean> {
    const response = await this.httpClient.patch<User>(`/auth/users/${id}/unlock`, undefined, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al desbloquear usuario');
    }
    return true;
  }

  async updateUser(id: string | number, dto: Partial<RegisterUserDto>): Promise<void> {
    const cleanDto: any = { ...dto };
    delete cleanDto.password;
    // El rol se actualiza por un endpoint separado (/auth/users/:id/role)
    delete cleanDto.rol_usu;
    delete cleanDto.rol;

    const response = await this.httpClient.patch<unknown>(`/auth/users/${id}`, cleanDto, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al actualizar usuario');
    }
  }

  async updateRole(id: string | number, role: string): Promise<void> {
    const response = await this.httpClient.patch<unknown>(`/auth/users/${id}/role`, { rol_usu: role }, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al actualizar el rol');
    }
  }

  async deleteUser(id: string | number): Promise<void> {
    const response = await this.httpClient.delete<unknown>(`/auth/users/${id}`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al eliminar usuario');
    }
  }

  async getMe(): Promise<User> {
    const response = await this.httpClient.get<User>('/auth/me', this.getAuthHeaders());
    if (!response.ok || !response.data) {
      throw new Error(response.error ?? 'Error al obtener datos del perfil');
    }
    return this.normalizeUser(response.data);
  }

  async changePassword(current_password: string, new_password: string): Promise<void> {
    const response = await this.httpClient.patch<unknown>('/auth/me/password', {
      current_password,
      new_password
    }, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al cambiar la contraseña');
    }
  }

  isUserBlocked(user: User): boolean {
    if (user.intentos_fallidos && user.intentos_fallidos >= 5) return true;
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) return true;
    return false;
  }

  async adminUpdatePassword(id: string | number, password: string): Promise<void> {
    const response = await this.httpClient.patch<unknown>(`/auth/users/${id}/password`, {
      password: password,
      new_password: password // Algunos microservicios usan este nombre
    }, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(response.error ?? 'Error al actualizar la contraseña');
    }
  }
}
