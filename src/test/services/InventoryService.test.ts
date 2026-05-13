import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../../services/InventoryService';

describe('InventoryService', () => {
  let inventoryService: InventoryService;
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
      getToken: vi.fn(() => 'token'),
    };
    inventoryService = new InventoryService(mockHttpClient, mockAuthService);
  });

  it('should fetch suppliers correctly', async () => {
    const data = { data: [{ cod_prov: 1, nom_prov: 'Sup' }] };
    mockHttpClient.get.mockResolvedValue({ ok: true, data });

    const result = await inventoryService.getSuppliers();
    expect(result.data[0].nom_prov).toBe('Sup');
  });

  it('should update a supplier', async () => {
    const updateData = { nom_prov: 'Updated Sup' };
    mockHttpClient.put.mockResolvedValue({ ok: true, data: { cod_prov: 1, ...updateData } });

    const result = await inventoryService.updateSupplier(1, updateData);
    expect(result.nom_prov).toBe('Updated Sup');
  });

  it('should fetch suministra matrix', async () => {
    const data = { data: [{ id: 1, fk_cod_prov: 1, cod_prod: 1 }] };
    mockHttpClient.get.mockResolvedValue({ ok: true, data });

    const result = await inventoryService.getSuministra();
    expect(result.data).toHaveLength(1);
  });
});
