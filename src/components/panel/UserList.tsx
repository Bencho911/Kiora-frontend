import React from 'react';
import type { User } from '@/models/User';
import { getPaginationPages } from '@/utils/pagination';
import { getInitials } from '@/utils/userUtils';

interface UserListProps {
  users: (User & { isBlocked: boolean })[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string | number) => void;
  onUnlock: (id: string | number, isBlocked: boolean) => void;
  onResetPassword: (user: User) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
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
  onEdit,
  onDelete,
  onUnlock,
  onResetPassword,
  pagination
}) => {
  const pageItems = getPaginationPages(
    pagination.currentPage,
    pagination.totalPages
  );


  const avatarRing = (u: User & { isBlocked: boolean }) => {
    const k = roleKey(u.rol_usu);
    if (k === 'admin') return 'bg-sky-50 text-sky-700 ring-sky-100';
    if (k === 'cliente') return 'bg-amber-50 text-amber-800 ring-amber-100';
    return 'bg-emerald-50 text-emerald-800 ring-emerald-100';
  };

  return (
    <section className="mb-10">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[var(--panel-shadow)] ring-1 ring-slate-900/[0.04]">
        {/* Barra superior del card */}
        <div className="flex flex-col gap-6 border-b border-slate-100 bg-[#3E2723]/[0.02] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-4 rounded-full bg-kiora-red"></div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Cuentas Registradas</p>
            </div>
            <p className="mt-1 text-sm text-slate-500 font-medium">Listado detallado de miembros del equipo</p>
          </div>
          <div className="w-full sm:max-w-sm">
            <label htmlFor="user-search" className="sr-only">
              Filtrar en esta página
            </label>
            <div className="relative">
              <input
                id="user-search"
                type="search"
                placeholder="Buscar por nombre o correo…"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-describedby="userlist-search-hint"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-kiora-red/40 focus:outline-none focus:ring-2 focus:ring-kiora-red/10 transition-all"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p id="userlist-search-hint" className="mt-1.5 text-[11px] leading-snug text-slate-400">
              Solo aplica a los usuarios visibles en esta página.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-100 border-t-kiora-red" />
              <span className="text-sm font-medium text-slate-500">Sincronizando cuentas…</span>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-slate-600">
                {searchTerm ? 'No hay coincidencias en esta página' : 'No hay usuarios registrados'}
              </p>
              <p className="mt-1 text-xs text-slate-400">Prueba otro término o cambia de página.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(Array.isArray(users) ? users : []).map((u, i) => (
                <li key={u.id_usu || `user-${i}`}>
                  <div className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/90 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-3.5">
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-2 ${avatarRing(u)}`}
                      >
                        {getInitials(String(u.nom_usu))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{String(u.nom_usu || 'Sin nombre')}</p>
                        <p className="truncate text-sm text-slate-500">{u.correo_usu}</p>
                        <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                          {u.rol_usu === 'cliente' ? 'operario' : (u.rol_usu || 'Usuario')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                      {u.isBlocked ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => onUnlock(u.id_usu as string, true)}
                            className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-200 animate-pulse"
                          >
                            Bloqueado
                          </button>
                          <span className="text-[9px] text-red-400 font-bold uppercase">Click para liberar</span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                          Activo
                        </span>
                      )}


                      <div className="flex items-center gap-0.5 rounded-xl bg-slate-100/80 p-0.5 ring-1 ring-slate-200/80">
                        <button
                          type="button"
                          onClick={() => onResetPassword(u)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-amber-600"
                          title="Cambiar Contraseña"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(u)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-sky-600"
                          title="Editar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => u.id_usu && onDelete(u.id_usu)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-red-600"
                          title="Eliminar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {pagination.totalPages > 1 && !isLoading && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                className="text-xs font-semibold text-slate-600 transition-colors hover:text-[#ec131e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>
              <div className="flex flex-wrap justify-center gap-1">
                {(Array.isArray(pageItems) ? pageItems : []).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex h-7 w-7 items-center justify-center text-xs text-slate-400"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => pagination.onPageChange(item)}
                      className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        pagination.currentPage === item
                          ? 'bg-kiora-red text-white shadow-lg shadow-kiora-red/20'
                          : 'text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                className="text-xs font-semibold text-slate-600 transition-colors hover:text-[#ec131e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
