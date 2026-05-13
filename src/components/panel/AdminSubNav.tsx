import React, { useMemo } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AdminSubNavProps {
  activeId: string;
  onItemClick: (id: string) => void;
  isAdmin?: boolean;
}

export const AdminSubNav: React.FC<AdminSubNavProps> = ({ activeId, onItemClick, isAdmin }) => {
  const items: NavItem[] = useMemo(() => {
    const list: NavItem[] = [
      {
        id: 'dashboard',
        label: 'Inicio',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        id: 'productos',
        label: 'Productos',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        id: 'categorias',
        label: 'Categorías',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
      },
      {
        id: 'inventario',
        label: 'Proveedores',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M10.5 3L12 2l1.5 1H21v6H3V3h7.5z" />
          </svg>
        ),
      },
      {
        id: 'ventas',
        label: 'Ventas',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ];

    if (isAdmin) {
      list.push(
        {
          id: 'reportes',
          label: 'Reportes',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          id: 'usuarios',
          label: 'Usuarios',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },

        {
          id: 'mantenimiento',
          label: 'Mantenimiento',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          ),
        }
      );
    }

    list.push({
      id: 'ajustes',
      label: 'Ajustes',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });

    return list;
  }, [isAdmin]);

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div className="fixed left-4 top-1/2 z-[60] flex max-h-[85vh] -translate-y-1/2 flex-col items-center gap-2">
      <nav
        className="flex max-h-[min(78vh,720px)] flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden rounded-[2rem] bg-[#2C2422]/95 py-3 shadow-[15px_0_40px_rgba(0,0,0,0.15)] backdrop-blur-2xl ring-1 ring-white/10 [scrollbar-width:thin]"
        style={{ width: '60px' }}
      >
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick(item.id)}
              title={item.label}
              className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                active
                  ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20 scale-105'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="relative">
                {item.icon}
                {active && (
                  <div className="absolute -right-3 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-[#ec131e] shadow-[2px_0_8px_rgba(236,19,30,0.8)]" />
                )}
              </div>

              <div className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-lg bg-[#2C2422] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-2 text-center">
        <div className="ml-2.5 max-w-[4rem] origin-left rotate-90 whitespace-nowrap text-[7px] font-black uppercase tracking-[0.2em] text-[#3E2723]/40">
          {activeItem?.label}
        </div>
      </div>
    </div>
  );
};
