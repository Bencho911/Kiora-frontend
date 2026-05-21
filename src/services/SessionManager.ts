import { type AuthService } from './AuthService';
import { type IAlertService } from '../core/ui/AlertService';

/**
 * Service to manage the user's session state and inactivity timeouts (SRP).
 */
export class SessionManager {
  private inactivityTime = 0;
  private maxInactivity = 8 * 60; // 8 minutes before warning
  private gracePeriod = 60; // 60 seconds to click OK on the modal
  private warningShown = false;
  private intervalId: number | undefined;
  private warningInProgress = false;

  private readonly onActivity = () => this.resetInactivity();
  private readonly touchStartOptions: AddEventListenerOptions = { passive: true };

  constructor(
    private authService: AuthService,
    private alertService: IAlertService,
    private apiBase: string = 'http://20.110.129.152:3000/api',
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
    this.warningInProgress = false;
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

    // ═══ Inactivity warning modal ═══
    if (
      this.inactivityTime >= this.maxInactivity &&
      !this.warningShown &&
      !this.warningInProgress
    ) {
      this.warningShown = true;
      this.warningInProgress = true;

      const confirmed = await this.alertService.showInactivityWarning(
        '¿Sigues ahí?',
        'Has estado inactivo por un tiempo. Haz clic en "OK, continuar" para mantener tu sesión activa. Si no respondes, cerraremos la sesión por seguridad.',
        'OK, continuar',
        this.gracePeriod
      );

      this.warningInProgress = false;

      if (confirmed) {
        // User clicked OK — reset inactivity counter
        this.resetInactivity();
        return;
      } else {
        // Timer expired without confirmation — auto-logout
        this.stopMonitoring();
        this.authService.clearSession();
        try {
          await fetch(`${this.apiBase}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch { /* fire & forget */ }
        await this.alertService.showExpiringSession(
          'Sesión Finalizada por Inactividad',
          'No hubo actividad ni respuesta a la advertencia. Vuelve a ingresar cuando quieras.'
        );
        window.location.href = '/login/';
        return;
      }
    }

    // ═══ Token refresh logic ═══
    const token = this.authService.getToken();
    if (!token) return;

    const decoded = this.decodeJWT(token);
    if (decoded && decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToLive = decoded.exp - currentTime;

      if (timeToLive > 0 && timeToLive <= 10) {
        try {
          await this.authService.refreshToken();
        } catch (e) {
          console.error('Error renovando token session.', e);
        }
      } else if (timeToLive <= 0) {
        this.stopMonitoring();
        this.authService.clearSession();
        try {
          await fetch(`${this.apiBase}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch { /* fire & forget */ }
        await this.alertService.showExpiringSession(
          'Sesión Expirada',
          'Tu sesión ha expirado por seguridad.'
        );
        window.location.href = '/login/';
      }
    }
  }
}
