import type { User } from '../models/User';
import type { PaginatedUsers } from '../models/PaginatedUsers';

function isPaginatedShape(raw: unknown): raw is {
  data: unknown;
  pagination: {
    page?: unknown;
    limit?: unknown;
    total?: unknown;
    totalPages?: unknown;
  };
} {
  if (
    raw == null ||
    typeof raw !== 'object' ||
    !('data' in raw) ||
    !('pagination' in raw)
  ) {
    return false;
  }
  const o = raw as Record<string, unknown>;
  return Array.isArray(o.data) && o.pagination != null && typeof o.pagination === 'object';
}

/**
 * Normaliza la respuesta de GET /auth/users evitando listas vacías silenciosas por formato inesperado.
 */
export function parsePaginatedUsersPayload(
  raw: unknown,
  page: number,
  limit: number
): PaginatedUsers {
  if (raw == null) {
    throw new Error('Respuesta de usuarios vacía');
  }

  if (Array.isArray(raw)) {
    const data = raw as User[];
    if (!data.every((u) => u && typeof u === 'object')) {
      throw new Error('Lista de usuarios con formato inválido');
    }
    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  if (isPaginatedShape(raw)) {
    const data = raw.data as User[];
    const p = raw.pagination;
    const total = Number(p.total) || data.length;
    const totalPages = Math.max(
      1,
      Number(p.totalPages) || Math.ceil(total / limit) || 1
    );
    return {
      data,
      pagination: {
        page: Number(p.page) || page,
        limit: Number(p.limit) || limit,
        total,
        totalPages,
      },
    };
  }

  throw new Error('Formato de respuesta de usuarios no reconocido');
}
