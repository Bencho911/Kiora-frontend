import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CategoriasSection } from '../../features/products/components/CategoriasSection';
import { productService } from '../../config/setup';

// Mock the services
vi.mock('../../config/setup', () => ({
  productService: {
    getCategories: vi.fn(),
    deleteCategory: vi.fn(),
  },
  alertService: {
    showError: vi.fn(),
    showConfirm: vi.fn(),
    showSuccess: vi.fn(),
    showToast: vi.fn(),
  },
}));

describe('CategoriasSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and load categories', async () => {
    const mockCategories = { 
       data: [{ cod_cat: 1, nom_cat: 'Electrónica' }, { cod_cat: 2, nom_cat: 'Hogar' }] 
    };
    (productService.getCategories as any).mockResolvedValue(mockCategories);

    render(<CategoriasSection />);
    
    // The title "Categorías" and "de Catálogo" are split across elements
    expect(screen.getByText(/Categorías/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Electrónica')).toBeInTheDocument();
      expect(screen.getByText('Hogar')).toBeInTheDocument();
    });
  });

  it('should show empty state when no categories exist', async () => {
    (productService.getCategories as any).mockResolvedValue({ data: [] });
    
    render(<CategoriasSection />);
    
    await waitFor(() => {
      expect(screen.getByText(/No hay categorías/i)).toBeInTheDocument();
    });
  });
});
