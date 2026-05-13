import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../../services/ProductService';
import type { IHttpClient } from '../../core/http/HttpClient';
import type { AuthService } from '../../services/AuthService';

describe('ProductService', () => {
  let productService: ProductService;
  let mockHttpClient: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    mockAuthService = {
      getToken: vi.fn(() => 'test-token'),
    };
    productService = new ProductService(mockHttpClient, mockAuthService);
  });

  it('should fetch categories correctly', async () => {
    const mockData = { data: [{ cod_cat: 1, nom_cat: 'Test' }], pagination: {} };
    mockHttpClient.get.mockResolvedValue({ ok: true, data: mockData });

    const result = await productService.getCategories();
    
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/categories'),
      expect.objectContaining({ Authorization: 'Bearer test-token' })
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].nom_cat).toBe('Test');
  });

  it('should create a category', async () => {
    const newCat = { nom_cat: 'New Category' };
    mockHttpClient.post.mockResolvedValue({ ok: true, data: { cod_cat: 2, ...newCat } });

    const result = await productService.createCategory(newCat);
    
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/categories',
      newCat,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
    expect(result.cod_cat).toBe(2);
  });

  it('should delete a category', async () => {
    mockHttpClient.delete.mockResolvedValue({ ok: true });

    await productService.deleteCategory(1);
    
    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      '/categories/1',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    );
  });

  it('should throw error when deletion fails', async () => {
    mockHttpClient.delete.mockResolvedValue({ ok: false, error: 'Database error' });

    await expect(productService.deleteCategory(1)).rejects.toThrow('Database error');
  });
});
