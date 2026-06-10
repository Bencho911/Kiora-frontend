import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User } from '@/models/User';
import type { Product } from '@/models/Product';
import { authService, API_URL } from '@/config/setup';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useAppStore } from '@/store/useAppStore';
import { useSessionStore } from '@/store/useSessionStore';
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
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('kiora_theme', next ? 'dark' : 'light');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('kiora_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const { currentSession, openSessionModal } = useSessionStore();

  const { lowStockItems, fetchLowStock } = useInventoryStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const clearAppNotifications = useNotificationStore((s) => s.clearAll);
  const unreadApp = useNotificationStore((s) => s.unreadCount());

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | AppNotificationCategory>('all');
  const [hideStockAlerts, setHideStockAlerts] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHideStockAlerts(false);
  }, [lowStockItems.length]);

  useEffect(() => {
    if (isNotificationsOpen) void fetchLowStock();
  }, [isNotificationsOpen, fetchLowStock]);

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
        key: string; kind: 'stock'; category: 'stock';
        title: string; description: string; type: 'warning';
      }
    | {
        key: string; kind: 'app'; category: AppNotificationCategory;
        title: string; description: string; type: 'info' | 'success' | 'warning' | 'error';
        id: string; read: boolean;
      };

  const mergedAlerts = useMemo(() => {
    const stockRows: MergedRow[] = hideStockAlerts ? [] : lowStockItems.map((p: Product) => ({
      key: `stock-${p.cod_prod}`, kind: 'stock' as const, category: 'stock' as const,
      title: p.nom_prod, description: `Stock bajo: ${p.stock_actual} uds (mín. ${p.stock_minimo ?? '—'})`, type: 'warning' as const,
    }));
    const appRows: MergedRow[] = notifications.map((n) => ({
      key: n.id, kind: 'app' as const, category: n.category, title: n.title, description: n.description, type: n.type, id: n.id, read: n.read,
    }));
    const all = [...stockRows, ...appRows];
    if (alertFilter === 'all') return all;
    return all.filter((r) => r.category === alertFilter);
  }, [lowStockItems, notifications, alertFilter]);

  const badgeCount = (hideStockAlerts ? 0 : lowStockItems.length) + unreadApp;

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-outline-variant/50 shadow-[0px_4px_12px_rgba(61,26,16,0.06)]">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 md:ml-56">

        {/* Left: mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-on-primary">K</span>
          </div>
        </div>

        {/* Spacer on desktop */}
        <div className="hidden md:block" />

        {/* Right: actions */}
        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => useAppStore.getState().setIsChatOpen(!useAppStore.getState().isChatOpen)}
            className="md:hidden flex items-center justify-center gap-1.5 px-3 h-[36px] rounded-full border border-outline-variant/30 bg-surface-container-low/50 hover:bg-surface-container-low transition-all active:scale-[0.97]"
            aria-label="Kiora AI"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>support_agent</span>
            <span className="text-[11px] font-bold text-on-surface">AI</span>
          </button>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDark}
            className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all active:scale-[0.97]"
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Cash Session State */}
          <button
            type="button"
            onClick={() => currentSession ? openSessionModal('CLOSE') : openSessionModal('OPEN')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
              !currentSession 
                ? 'bg-error-container text-on-error-container hover:bg-error-container/80'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {!currentSession ? 'lock' : 'point_of_sale'}
            </span>
            <span className="hidden sm:inline">
              {!currentSession ? 'Caja Cerrada' : 'Cerrar Caja'}
            </span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifPanelRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all active:scale-[0.97]"
              aria-label="Notificaciones"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[8px] font-bold text-on-error ring-2 ring-surface">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {isNotificationsOpen && (
              <div className="fixed sm:absolute right-4 sm:right-0 top-[3.5rem] sm:top-full mt-2 w-[calc(100vw-2rem)] sm:w-[22rem] origin-top-right overflow-hidden rounded-xl bg-surface shadow-xl ring-1 ring-outline-variant/30 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3 bg-surface-container-lowest">
                  <h3 className="text-xs font-semibold text-on-surface">Centro de alertas</h3>
                  <button
                    type="button"
                    onClick={() => {
                      clearAppNotifications();
                      setHideStockAlerts(true);
                    }}
                    className="text-[10px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="flex gap-2 border-b border-outline-variant/30 px-3 py-3 overflow-x-auto no-scrollbar scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {(Object.keys(FILTER_LABELS) as ('all' | AppNotificationCategory)[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlertFilter(k);
                      }}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all ${
                        alertFilter === k
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                      }`}
                    >
                      {FILTER_LABELS[k]}
                    </button>
                  ))}
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {mergedAlerts.length > 0 ? (
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
                        className={`border-b border-outline-variant/20 px-4 py-3 transition-colors last:border-0 hover:bg-surface-container-low cursor-pointer ${
                          row.kind === 'app' && !row.read ? 'bg-error-container/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            row.type === 'error' ? 'bg-error-container/30 text-error' :
                            row.type === 'success' ? 'bg-tertiary-fixed/30 text-tertiary' :
                            row.type === 'warning' ? 'bg-error-container/20 text-error' :
                            'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            <span className="text-[10px] font-bold uppercase">{row.category.slice(0, 2)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-on-surface truncate">{row.title}</p>
                            <p className="text-xs text-on-surface-variant">{row.description}</p>
                            <p className="text-[10px] font-medium text-on-surface-variant/60 mt-0.5">
                              {FILTER_LABELS[row.category]}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="mb-3 rounded-full bg-surface-container-high p-3 text-on-surface-variant">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-on-surface-variant">Sin alertas</p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">Todo en orden.</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    useAppStore.getState().setActiveTab('productos');
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full border-t border-outline-variant/30 bg-surface-container-low py-3 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Ir a productos
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center p-1.5 rounded-full hover:bg-surface-container-high transition-all active:scale-[0.97]"
            aria-label="Perfil"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-sm font-semibold text-on-surface ring-1 ring-outline-variant/30">
              {getInitials(String(user.nom_usu))}
            </div>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout || (() => { authService.logout(); window.location.href = '/'; })}
            className="rounded-lg px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-[0.97]"
            aria-label="Cerrar sesión"
          >
            <span className="hidden sm:inline">Salir</span>
            <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
