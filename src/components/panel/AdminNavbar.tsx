import React, { useState } from 'react';
import type { User } from '@/models/User';
import type { Product } from '@/models/Product';
import { alertService, authService } from '@/config/setup';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useAppStore } from '@/store/useAppStore';
import { getInitials } from '@/utils/userUtils';
import { COLORS } from '@/config/theme';

interface AdminNavbarProps {
  user: User;
  onLogout?: (e: React.MouseEvent) => void;
  onOpenProfile: () => void;
  onOpenPOS: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ user, onLogout, onOpenProfile, onOpenPOS }) => {
  const { lowStockItems: alerts } = useInventoryStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const isLoading = false; // El contexto maneja la carga, simplificamos aquí

  return (
    <header className="sticky top-0 z-40 bg-[#3E2723] shadow-lg border-b border-white/5 font-[Inter]">
      <nav className="flex items-center justify-between px-6 py-3">
        {/* Left Section: Branding */}
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

        {/* Right Section: Actions & User */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative">
            <button
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
              {alerts.length > 0 && (
                <>
                  <div className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-kiora-red border-2 border-[#3E2723] animate-pulse"></div>
                  <span className="absolute -right-1 -top-1 bg-kiora-red text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center text-white ring-2 ring-[#3E2723]">
                    {alerts.length}
                  </span>
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-0" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-0 mt-4 w-80 origin-top-right rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 z-10 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Alertas de Stock</h3>
                    <span className="px-2 py-0.5 bg-red-100 text-kiora-red text-[9px] font-black rounded-full uppercase tracking-tighter">Bajo Stock</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-red-100 border-t-kiora-red rounded-full animate-spin"></div></div>
                    ) : alerts.length > 0 ? (
                      alerts.map((alert) => (
                        <div 
                          key={alert.cod_prod} 
                          className="p-4 hover:bg-red-50 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer"
                          onClick={() => {
                            useAppStore.getState().setActiveTab('productos');
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100/50 text-kiora-red rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{alert.nom_prod}</p>
                              <p className="text-xs text-red-600 font-medium mt-0.5">Solo quedan {alert.stock_actual} unid.</p>
                            </div>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded w-fit">
                            Mínimo configurado: {alert.stock_minimo}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center">
                        <div className="mb-3 p-3 bg-emerald-50 rounded-full text-emerald-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-sm text-gray-600 font-bold">¡Todo en orden!</p>
                        <p className="text-xs text-gray-400 font-medium">No hay productos con stock bajo.</p>
                      </div>
                    )}
                  </div>
 
                  {alerts.length > 0 && (
                    <button
                      onClick={() => {
                        useAppStore.getState().setActiveTab('productos');
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full p-3 bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-colors border-t border-gray-100"
                    >
                      Ver Stock en Productos
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenProfile}
              className="group flex items-center transition-all hover:opacity-90 active:scale-95"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-kiora-red text-sm font-bold text-white shadow-xl ring-2 ring-white/10">
                {getInitials(String(user.nom_usu))}
              </div>
            </button>
            <button
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
