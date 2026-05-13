import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../../services/OrderService';

describe('OrderService', () => {
  let orderService: OrderService;
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
    orderService = new OrderService(mockHttpClient, mockAuthService);
  });

  it('should fetch orders correctly', async () => {
    const data = { data: [{ id_vent: 1, montofinal_vent: 100 }] };
    mockHttpClient.get.mockResolvedValue({ ok: true, data });

    const result = await orderService.getOrders();
    const dataArray = Array.isArray(result) ? result : result.data;
    expect(dataArray).toHaveLength(1);
    expect(dataArray[0].id_vent).toBe(1);
  });

  it('should fetch invoices correctly', async () => {
    const data = { data: [{ id_fact: 1, total_fact: 100 }] };
    mockHttpClient.get.mockResolvedValue({ ok: true, data });

    const result = await orderService.getInvoices();
    const dataArray = Array.isArray(result) ? result : (result as any).data;
    expect(dataArray).toHaveLength(1);
  });

  it('should delete order', async () => {
    mockHttpClient.delete.mockResolvedValue({ ok: true });
    await orderService.deleteOrder(1);
    expect(mockHttpClient.delete).toHaveBeenCalledWith('/orders/1', expect.anything());
  });

  it('should update status', async () => {
    mockHttpClient.put.mockResolvedValue({ ok: true, data: { id_vent: 1, estado: 'completada' } });
    const result = await orderService.updateOrderStatus(1, 'completada');
    expect(result.estado).toBe('completada');
  });
});
