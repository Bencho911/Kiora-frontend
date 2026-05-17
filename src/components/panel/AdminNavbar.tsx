import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User } from '@/models/User';
import type { Product } from '@/models/Product';
import { authService } from '@/config/setup';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/utils/userUtils';
import { useNotificationStore, type AppNotificationCategory } from '@/store/useNotificationStore';

interface AdminNavbarProps {
  user: User;
  onLogout?: (e: React.MouseEvent) => void;
  onOpenProfile: () => void;
  onOpenPOS: () => void;
}

const FILTER_LABELS: Record<'all' | AppNotificationCategory, string> = {
  all: 'Todas',
  stock: 'Stock',
  payment: 'Pagos',
  inventory: 'Inventario',
  user: 'Usuarios',
  system: 'Sistema',
};

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ user, onLogout, onOpenProfile, onOpenPOS }) => {
  const { lowStockItems, fetchLowStock } = useInventoryStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const clearAppNotifications = useNotificationStore((s) => s.clearAll);
  const unreadApp = useNotificationStore((s) => s.unreadCount());

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | AppNotificationCategory>('all');
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const isLoading = false;

  useEffect(() => {
    if (isNotificationsOpen) void fetchLowStock();
  }, [isNotificationsOpen, fetchLowStock]);

  // Close notif panel on outside click
  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isNotificationsOpen]);

  type MergedRow =
    | {
        key: string;
        kind: 'stock';
        category: 'stock';
        title: string;
        description: string;
        type: 'warning';
      }
    | {
        key: string;
        kind: 'app';
        category: AppNotificationCategory;
        title: string;
        description: string;
        type: 'info' | 'success' | 'warning' | 'error';
        id: string;
        read: boolean;
      };

  const mergedAlerts = useMemo(() => {
    const stockRows: MergedRow[] = lowStockItems.map((p: Product) => ({
      key: `stock-${p.cod_prod}`,
      kind: 'stock' as const,
      category: 'stock' as const,
      title: p.nom_prod,
      description: `Stock bajo: ${p.stock_actual} uds (mín. ${p.stock_minimo ?? '—'})`,
      type: 'warning' as const,
    }));
    const appRows: MergedRow[] = notifications.map((n) => ({
      key: n.id,
      kind: 'app' as const,
      category: n.category,
      title: n.title,
      description: n.description,
      type: n.type,
      id: n.id,
      read: n.read,
    }));
    const all = [...stockRows, ...appRows];
    if (alertFilter === 'all') return all;
    return all.filter((r) => r.category === alertFilter);
  }, [lowStockItems, notifications, alertFilter]);

  const badgeCount = lowStockItems.length + unreadApp;

  return (
    <header className="sticky top-0 z-40 bg-[#3E2723] shadow-lg border-b border-white/5 font-[Inter]">
      <nav className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* ── Left: Logo ── */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/img/logo-kiora-vectorizado-blanco.png"
            alt="Kiora Logo"
            className="h-7 w-auto sm:h-8 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            onClick={() => window.location.reload()}
          />
          <span className="hidden md:block text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mt-0.5">
            Admin System
          </span>
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* POS button — visible sm+ */}
          <button
            type="button"
            onClick={onOpenPOS}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-kiora-red px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95 md:px-4 md:py-2 md:text-[10px]"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden md:inline">Punto de venta</span>
            <span className="md:hidden">POS</span>
          </button>

          {/* POS icon button — mobile only */}
          <button
            type="button"
            onClick={onOpenPOS}
            className="sm:hidden relative p-2 text-white/80 transition-all hover:scale-110 hover:text-white rounded-full hover:bg-white/5 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifPanelRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-white/80 transition-all hover:scale-110 hover:text-white rounded-full hover:bg-white/5 active:scale-95"
              aria-label="Notificaciones"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-active:rotate-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {badgeCount > 0 && (
                <>
                  <div className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-kiora-red border-2 border-[#3E2723] animate-pulse" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-kiora-red text-[8px] font-black text-white ring-2 ring-[#3E2723]">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                </>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-14 sm:top-full sm:mt-4 z-50 max-w-full sm:max-w-[22rem] origin-top overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Centro de alertas</h3>
                  <button
                    type="button"
                    onClick={() => clearAppNotifications()}
                    className="text-[9px] font-black uppercase tracking-tighter text-slate-500 hover:text-kiora-red"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-white px-2 py-2">
                  {(Object.keys(FILTER_LABELS) as ('all' | AppNotificationCategory)[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setAlertFilter(k)}
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-tight transition-colors ${
                        alertFilter === k
                          ? 'bg-kiora-red text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {FILTER_LABELS[k]}
                    </button>
                  ))}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center p-10">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-100 border-t-kiora-red" />
                    </div>
                  ) : mergedAlerts.length > 0 ? (
                    mergedAlerts.map((row) => (
                      <div
                        key={row.key}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (row.kind === 'app' && !row.read) markAsRead(row.id);
                          if (row.kind === 'stock' || row.category === 'inventory') {
                            useAppStore.getState().setActiveTab('productos');
                          }
                          if (row.category === 'payment') {
                            useAppStore.getState().setActiveTab('ventas');
                          }
                          if (row.category === 'user') {
                            useAppStore.getState().setActiveTab('usuarios');
                          }
                          setIsNotificationsOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') (e.target as HTMLElement).click();
                        }}
                        className={`cursor-pointer border-b border-gray-50 p-4 transition-colors last:border-0 hover:bg-slate-50 ${
                          row.kind === 'app' && !row.read ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                              row.type === 'error'
                                ? 'bg-red-100 text-red-600'
                                : row.type === 'success'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : row.type === 'warning'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase">{row.category.slice(0, 2)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900">{row.title}</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-600">{row.description}</p>
                            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {FILTER_LABELS[row.category]}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center p-10 text-center">
                      <div className="mb-3 rounded-full bg-emerald-50 p-3 text-emerald-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-gray-600">Sin alertas</p>
                      <p className="text-xs font-medium text-gray-400">Pagos, stock e inventario aparecen aquí.</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    useAppStore.getState().setActiveTab('productos');
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full border-t border-gray-100 bg-gray-50 p-3 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-gray-100"
                >
                  Ir a productos
                </button>
              </div>
            )}
          </div>

          {/* Profile avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="group flex items-center transition-all hover:opacity-90 active:scale-95"
            aria-label="Perfil de usuario"
          >
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-kiora-red text-xs sm:text-sm font-bold text-white shadow-xl ring-2 ring-white/10">
              {getInitials(String(user.nom_usu))}
            </div>
          </button>

          {/* Logout — text on md+, icon on mobile */}
          <button
            type="button"
            onClick={onLogout || (() => { authService.logout(); window.location.href = '/'; })}
            className="rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white transition-all hover:bg-white/15 active:bg-white/20 sm:px-4 sm:text-xs"
            aria-label="Cerrar sesión"
          >
            <span className="hidden sm:inline">Salir</span>
            <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
};
