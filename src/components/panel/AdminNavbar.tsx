import React, { useState, useMemo, useEffect } from 'react';
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
  const isLoading = false;

  useEffect(() => {
    if (isNotificationsOpen) void fetchLowStock();
  }, [isNotificationsOpen, fetchLowStock]);

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
      <nav className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <img
            src="/img/logo-kiora-vectorizado-blanco.png"
            alt="Kiora Logo"
            className="h-8 w-auto hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => window.location.reload()}
          />
          <span className="hidden sm:block text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mt-1">
            Admin System
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onOpenPOS}
            className="hidden rounded-full bg-kiora-red px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95 sm:block"
          >
            Punto de venta
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-white/80 transition-all hover:scale-110 hover:text-white rounded-full hover:bg-white/5 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 transition-transform group-active:rotate-12"
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
                  <div className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-kiora-red border-2 border-[#3E2723] animate-pulse" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-kiora-red text-[8px] font-black text-white ring-2 ring-[#3E2723]">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                </>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 z-10 mt-4 w-[22rem] origin-top-right overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Centro de alertas</h3>
                    <button
                      type="button"
                      onClick={() => clearAppNotifications()}
                      className="text-[9px] font-black uppercase tracking-tighter text-slate-500 hover:text-kiora-red"
                    >
                      Limpiar historial
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

                  <div className="max-h-96 overflow-y-auto">
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
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
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
                      <div className="flex flex-col items-center p-12 text-center">
                        <div className="mb-3 rounded-full bg-emerald-50 p-3 text-emerald-600">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-600">Sin alertas en este filtro</p>
                        <p className="text-xs font-medium text-gray-400">Pagos, stock, inventario y usuarios aparecen aquí.</p>
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
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="group flex items-center transition-all hover:opacity-90 active:scale-95"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-kiora-red text-sm font-bold text-white shadow-xl ring-2 ring-white/10">
                {getInitials(String(user.nom_usu))}
              </div>
            </button>
            <button
              type="button"
              onClick={onLogout || (() => { authService.logout(); window.location.href = '/'; })}
              className="ml-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/15 active:bg-white/20"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
