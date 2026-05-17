import { type AuthService } from './AuthService';
import { type IAlertService } from '../core/ui/AlertService';

/**
 * Service to manage the user's session state and inactivity timeouts (SRP).
 */
export class SessionManager {
  private inactivityTime = 0;
  private maxInactivity = 15 * 60; // 15 minutes by default
  private warningThreshold = 60; // Warning 1 minute before max
  private warningShown = false;
  private intervalId: number | undefined;

  private readonly onActivity = () => this.resetInactivity();
  private readonly touchStartOptions: AddEventListenerOptions = { passive: true };

  constructor(
    private authService: AuthService,
    private alertService: IAlertService
  ) {}

  startMonitoring() {
    this.stopMonitoring();
    this.resetInactivity();

    window.addEventListener('load', this.onActivity);
    document.addEventListener('mousemove', this.onActivity);
    document.addEventListener('keydown', this.onActivity);
    document.addEventListener('touchstart', this.onActivity, this.touchStartOptions);

    this.checkTokenAndInactivity();
    this.intervalId = window.setInterval(() => this.checkTokenAndInactivity(), 5000);
  }

  stopMonitoring() {
    window.removeEventListener('load', this.onActivity);
    document.removeEventListener('mousemove', this.onActivity);
    document.removeEventListener('keydown', this.onActivity);
    document.removeEventListener('touchstart', this.onActivity, this.touchStartOptions);

    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private resetInactivity() {
    this.inactivityTime = 0;
    this.warningShown = false;
  }

  private decodeJWT(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  private async checkTokenAndInactivity() {
    if (!this.authService.isAuthenticated()) return;

    this.inactivityTime += 5;

    // Warning before expiration
    if (
      this.inactivityTime >= this.maxInactivity - this.warningThreshold &&
      this.inactivityTime < this.maxInactivity &&
      !this.warningShown
    ) {
      this.warningShown = true;
      this.alertService.showToast(
        'info',
        'Por favor realice una acción dentro del sistema para evitar que su sesión expire.',
        10000
      );
    }

    // Terminate Session due to inactivity
    if (this.inactivityTime >= this.maxInactivity) {
      this.stopMonitoring();
      this.authService.clearSession();
      await this.alertService.showExpiringSession(
        'Sesión Finalizada por Inactividad',
        'Has estado mucho tiempo inactivo. Vuelve a ingresar.'
      );
      window.location.href = '/login/';
      return;
    }

    // Token logic
    const token = this.authService.getToken();
    if (!token) return;

    const decoded = this.decodeJWT(token);
    if (decoded && decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToLive = decoded.exp - currentTime;

      // Renew if less than 10s left and user is active
      if (timeToLive > 0 && timeToLive <= 10) {
        try {
          await this.authService.refreshToken();
        } catch (e) {
          console.error('Error renovando token session.', e);
        }
      }
      // Force logout if token expired
      else if (timeToLive <= 0) {
        this.stopMonitoring();
        this.authService.clearSession();
        await this.alertService.showExpiringSession(
          'Sesión Expirada',
          'Tu sesión ha expirado por seguridad.'
        );
        window.location.href = '/login/';
      }
    }
  }
}
