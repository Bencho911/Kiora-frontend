import React, { useState } from 'react';
import { ProveedoresSection } from './ProveedoresSection';

export function InventarioSection() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-kiora-red/5 border border-kiora-red/10 mb-2">
            <div className="h-2 w-2 rounded-full bg-kiora-red animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kiora-red">Directorio Logístico</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Gestión de <span className="text-kiora-red">Proveedores</span>
          </h1>
          <p className="mt-2 text-slate-500 font-medium italic">Administración centralizada de suministros y contactos de abastecimiento.</p>
        </div>
      </header>

      <div className="min-h-[400px]">
        <ProveedoresSection searchTerm={searchTerm} />
      </div>
    </div>
  );
}
