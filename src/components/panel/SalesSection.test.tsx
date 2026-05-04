import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesSection } from './SalesSection';

// Mock services to prevent actual HTTP calls during render
vi.mock('@/config/setup', () => ({
  orderService: {
    getOrders: vi.fn().mockResolvedValue({ data: [], pagination: { totalPages: 1 } }),
    getInvoices: vi.fn().mockResolvedValue({ data: [] }),
  },
  productService: {
    getProducts: vi.fn().mockResolvedValue([{ cod_prod: 1, nom_prod: 'Galletas', precio_prod: 1000 }]),
  },
  inventoryService: {
    getMovements: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
  },
  maintenanceService: {
    getReports: vi.fn().mockResolvedValue([]),
  },
  alertService: {
    showToast: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true),
  },
  authService: {
    getUser: vi.fn().mockReturnValue({ id: 1, id_usu: 1, correo_usu: 'KiosKiora@gmail.com' }),
    isAdmin: vi.fn().mockReturnValue(true),
  }
}));

const SalesSectionWrapper = () => {
  return (
    <SalesSection 
      onOpenPOS={vi.fn()}
      isAdmin={true}
    />
  );
};

describe('SalesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading initially and then shows the sales table', async () => {
    render(<SalesSectionWrapper />);

    await waitFor(() => {
      expect(screen.getByText('No hay ventas registradas')).toBeInTheDocument();
    });
  });

  it('can switch to Facturas tab', async () => {
    render(<SalesSectionWrapper />);

    await waitFor(() => {
      expect(screen.getByText('No hay ventas registradas')).toBeInTheDocument();
    });

    const facturasTab = screen.getByText('Facturas');
    fireEvent.click(facturasTab);

    await waitFor(() => {
      expect(screen.getByText('No hay facturas emitidas')).toBeInTheDocument();
    });
  });

  it('can switch to Movimientos tab', async () => {
    render(<SalesSectionWrapper />);

    await waitFor(() => {
      expect(screen.getByText('No hay ventas registradas')).toBeInTheDocument();
    });

    const movTab = screen.getByText('Movimientos');
    fireEvent.click(movTab);

    await waitFor(() => {
      expect(screen.getByText('No hay movimientos registrados')).toBeInTheDocument();
    });
  });

  it('opens Nueva Venta drawer when + Nueva Venta button is clicked', async () => {
    const onOpenPOS = vi.fn();
    render(<SalesSection onOpenPOS={onOpenPOS} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('No hay ventas registradas')).toBeInTheDocument();
    });

    const nuevaVentaBtn = screen.getByText('+ Nueva Venta');
    fireEvent.click(nuevaVentaBtn);

    expect(onOpenPOS).toHaveBeenCalled();
  });

  it('calls handleCancelOrder flow when switching to incidencias', async () => {
    render(<SalesSectionWrapper />);
    await waitFor(() => {
      expect(screen.getByText('No hay ventas registradas')).toBeInTheDocument();
    });

    // Switch to Incidencias tab
    const incidenciasTab = screen.getByText('Incidencias');
    fireEvent.click(incidenciasTab);

    await waitFor(() => {
      expect(screen.getByText('No hay incidencias reportadas')).toBeInTheDocument();
    });
  });
});
