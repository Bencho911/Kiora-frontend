import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '@/config/setup';
import { useSalesStore } from '@/store/useSalesStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { pushAppNotification } from '@/lib/pushAppNotification';

/**
 * Hook para escuchar eventos en tiempo real desde el API Gateway.
 * Cuando ocurre una venta o un movimiento de stock, notifica a los stores
 * para que refresquen la UI automáticamente.
 */
export function useRealTimeUpdates() {
  const notifySalesChange = useSalesStore((state) => state.notifySalesChange);
  const notifyStockChange = useInventoryStore((state) => state.notifyStockChange);

  useEffect(() => {
    // La URL del WebSocket es el base del API Gateway (sin /api)
    const socketUrl = API_URL.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[RealTime] Conectado al servidor de eventos');
    });

    // Evento disparado cuando hay una nueva venta (completa o pendiente)
    socket.on('new_sale', (payload) => {
      console.log('[RealTime] Nueva venta detectada:', payload);
      notifySalesChange(); // Esto dispara el refresh en SalesSection y Dashboard
      
      pushAppNotification('success', 'Nueva Venta', `Se ha registrado la orden #${payload.id_vent || payload.id}`, {
        category: 'payment',
        toast: true
      });
    });

    // Evento disparado cuando el stock cambia
    socket.on('stock_change', (payload) => {
      console.log('[RealTime] Cambio de stock detectado:', payload);
      notifyStockChange(); // Esto dispara el refresh en Inventario y Productos
    });

    socket.on('disconnect', () => {
      console.log('[RealTime] Desconectado del servidor de eventos');
    });

    return () => {
      socket.disconnect();
    };
  }, [notifySalesChange, notifyStockChange]);
}
