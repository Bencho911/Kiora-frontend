import React from 'react';

interface ComingSoonSectionProps {
  tabId: string;
}

export function ComingSoonSection({ tabId }: ComingSoonSectionProps) {

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200/90 bg-linear-to-br from-white to-slate-50 shadow-(--panel-shadow) ring-1 ring-slate-900/[0.04]">
        <svg
          className="h-10 w-10 text-[#ec131e]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ec131e]">Próximamente</p>
      <p className="max-w-md text-[15px] leading-relaxed text-slate-500">
        Este módulo está en la hoja de ruta. Mientras tanto, usa{' '}
        <strong className="font-semibold text-slate-700">Ajustes</strong> para usuarios y roles.
      </p>
    </div>
  );
}
