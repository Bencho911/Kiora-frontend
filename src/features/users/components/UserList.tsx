import React from 'react';
import type { User } from '@/models/User';
import { getPaginationPages } from '@/utils/pagination';
import { getInitials } from '@/utils/userUtils';

interface UserListProps {
  users: (User & { isBlocked: boolean })[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onToggleBlock: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDeleteUser: (user: User) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function roleKey(rol?: string): 'admin' | 'cliente' | 'other' {
  const r = String(rol ?? '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'cliente' || r === 'operario') return 'cliente';
  return 'other';
}

export const UserList: React.FC<UserListProps> = ({
  users,
  isLoading,
  searchTerm,
  onSearchChange,
  onAddUser,
  onEditUser,
  onToggleBlock,
  onResetPassword,
  onDeleteUser,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const pageItems = getPaginationPages(currentPage, totalPages);

  const avatarStyle = (u: User & { isBlocked: boolean }) => {
    const k = roleKey(u.rol_usu);
    if (k === 'admin') return 'bg-primary-fixed/30 text-primary-container';
    if (k === 'cliente') return 'bg-secondary-container/20 text-secondary-container';
    return 'bg-tertiary/10 text-tertiary';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">Usuarios</h2>
          <p className="body-md text-on-surface-variant">Listado detallado de miembros del equipo.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onAddUser}
            className="flex-1 sm:flex-none bg-primary text-on-primary label-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nuevo Usuario
          </button>
          <div className="relative flex-1 sm:w-60">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" style={{ fontSize: '18px' }}>search</span>
            <input
              id="user-search"
              type="search"
              placeholder="Buscar por nombre o correo…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/50 bg-surface py-2.5 pl-9 pr-3 label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* User list card */}
      <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="body-md text-on-surface-variant">Sincronizando cuentas…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="label-md text-on-surface-variant">
              {searchTerm ? 'No hay coincidencias en esta página' : 'No hay usuarios registrados'}
            </p>
            <p className="body-md text-on-surface-variant mt-1">Prueba otro término o cambia de página.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {(Array.isArray(users) ? users : []).map((u, i) => (
              <li key={u.id_usu || `user-${i}`}>
                <div className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${avatarStyle(u)}`}>
                      {getInitials(String(u.nom_usu))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="label-md text-on-surface break-words">{String(u.nom_usu || 'Sin nombre')}</p>
                      <p className="body-md text-on-surface-variant break-words">{u.correo_usu}</p>
                      <span className="mt-1 inline-flex rounded-md bg-surface-container-high px-2 py-0.5 label-sm text-on-surface-variant capitalize">
                        {u.rol_usu === 'cliente' ? 'operario' : (u.rol_usu || 'Usuario')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {u.isBlocked ? (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleBlock(u)}
                          className="rounded-lg bg-error-container/30 px-3 py-1 label-sm text-error border border-error/20 hover:bg-error-container/50 transition-all"
                        >
                          Bloqueado
                        </button>
                        <span className="label-sm text-error/60">Click para liberar</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleBlock(u)}
                        className="rounded-lg bg-tertiary/10 px-3 py-1 label-sm text-tertiary border border-tertiary/20 hover:bg-tertiary/20 transition-all"
                      >
                        Activo
                      </button>
                    )}

                    <div className="flex items-center gap-0.5 rounded-lg bg-surface-container-high p-0.5">
                      <button
                        type="button"
                        onClick={() => onResetPassword(u)}
                        className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface hover:text-secondary-container transition-all"
                        title="Cambiar Contraseña"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditUser(u)}
                        className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface hover:text-primary transition-all"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u)}
                        className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface hover:text-error transition-all"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && !isLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 bg-surface-container-low/50 px-4 py-3 sm:px-5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="label-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <div className="flex flex-wrap justify-center gap-1">
              {(Array.isArray(pageItems) ? pageItems : []).map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="flex h-7 w-7 items-center justify-center label-sm text-on-surface-variant/40" aria-hidden>…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-semibold transition-all ${
                      currentPage === item
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="label-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
