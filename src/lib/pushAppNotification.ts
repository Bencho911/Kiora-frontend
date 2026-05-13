import { alertService } from '@/config/setup';
import { useNotificationStore, type AppNotificationCategory } from '@/store/useNotificationStore';

export type { AppNotificationCategory };

export interface PushAppNotificationOptions {
  toast?: boolean;
  category?: AppNotificationCategory;
}

/**
 * Registra una alerta en el centro de notificaciones y, opcionalmente, muestra un toast.
 */
export function pushAppNotification(
  type: 'info' | 'success' | 'warning' | 'error',
  title: string,
  description: string,
  opts?: PushAppNotificationOptions
) {
  const { toast = true, category = 'system' } = opts ?? {};
  useNotificationStore.getState().addNotification({ title, description, type, category });
  if (!toast) return;
  if (type === 'error') alertService.showToast('error', description);
  else if (type === 'warning') alertService.showToast('warning', description);
  else if (type === 'success') alertService.showToast('success', description);
  else alertService.showToast('info', description);
}
