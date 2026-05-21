import React, { useState } from 'react';
import { ProveedoresSection } from './ProveedoresSection';

export function InventarioSection() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">
            Gestión de <span className="text-primary">Proveedores</span>
          </h2>
          <p className="body-md text-on-surface-variant">Administración centralizada de suministros y contactos de abastecimiento.</p>
        </div>
      </div>

      <div className="min-h-[400px]">
        <ProveedoresSection searchTerm={searchTerm} />
      </div>
    </div>
  );
}
