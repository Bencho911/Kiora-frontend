import type { Notification } from '../models/Notification';

export class NotificationService {
  private static STORAGE_KEY = 'kiora_notifications';

  getNotifications(): Notification[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(NotificationService.STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false
    };
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    const limited = notifications.slice(0, 50);
    localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(limited));
    
    // Dispatch event for UI reaction
    window.dispatchEvent(new CustomEvent('kiora_notification_updated'));
  }

  markAsRead(id: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('kiora_notification_updated'));
  }

  markAllAsRead(): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('kiora_notification_updated'));
  }

  clearAll(): void {
    localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('kiora_notification_updated'));
  }

  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  }
}
