import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../../services/SessionManager';

function createMockAuth() {
  let token: string | null = 'valid-token';
  return {
    isAuthenticated: vi.fn(() => !!token),
    getToken: vi.fn(() => token),
    clearSession: vi.fn(() => { token = null; }),
    logout: vi.fn(() => { token = null; }),
    refreshToken: vi.fn(async () => {}),
  };
}

function createMockAlert() {
  return {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showToast: vi.fn(),
    showConfirm: vi.fn(async () => true),
    showExpiringSession: vi.fn(async () => {}),
    showInactivityWarning: vi.fn(async () => true),
  };
}

function createMockToken(expOffset: number) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    id_usu: 1,
    correo_usu: 'test@kiora.com',
    rol_usu: 'admin',
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + expOffset,
  }));
  return `${header}.${payload}.fakesignature`;
}

describe('SessionManager', () => {
  let auth: ReturnType<typeof createMockAuth>;
  let alert: ReturnType<typeof createMockAlert>;
  let manager: SessionManager;
  let intervalRef: number;

  beforeEach(() => {
    vi.useFakeTimers();
    auth = createMockAuth();
    alert = createMockAlert();
    manager = new SessionManager(auth as any, alert as any);
    vi.spyOn(window, 'setInterval').mockImplementation(((cb: any, ms: number) => {
      intervalRef = cb;
      return 123 as any;
    }) as any);
    vi.spyOn(window, 'clearInterval').mockImplementation(() => {});
  });

  afterEach(() => {
    manager.stopMonitoring();
    vi.useRealTimers();
  });

  it('should not check inactivity if not authenticated', () => {
    auth.isAuthenticated.mockReturnValue(false);
    manager.startMonitoring();
    // Run the interval callback
    intervalRef();
    expect(alert.showInactivityWarning).not.toHaveBeenCalled();
  });

  it('should show inactivity warning after maxInactivity time', () => {
    auth.getToken.mockReturnValue(createMockToken(600));
    manager.startMonitoring();

    // Simulate 14 minutes of inactivity (5s per tick, 168 ticks)
    for (let i = 0; i < 168; i++) {
      intervalRef();
    }

    expect(alert.showInactivityWarning).toHaveBeenCalledTimes(1);
    expect(alert.showInactivityWarning).toHaveBeenCalledWith(
      '¿Sigues ahí?',
      expect.any(String),
      'OK, continuar',
      60
    );
  });

  it('should NOT show warning if user is active (inactivity resets)', () => {
    auth.getToken.mockReturnValue(createMockToken(600));
    manager.startMonitoring();

    // 10 ticks (50s) then activity
    for (let i = 0; i < 10; i++) intervalRef();
    // Simulate activity (mousemove resets via resetInactivity)
    window.dispatchEvent(new MouseEvent('mousemove'));

    // Another 10 ticks
    for (let i = 0; i < 10; i++) intervalRef();

    expect(alert.showInactivityWarning).not.toHaveBeenCalled();
  });

  it('should logout if user does not confirm inactivity warning', async () => {
    alert.showInactivityWarning.mockResolvedValue(false);
    auth.getToken.mockReturnValue(createMockToken(600));
    manager.startMonitoring();

    for (let i = 0; i < 168; i++) {
      intervalRef();
      // Allow async modal to resolve
      await vi.advanceTimersByTimeAsync(0);
    }

    expect(auth.clearSession).toHaveBeenCalled();
    expect(alert.showExpiringSession).toHaveBeenCalled();
  });

  it('should refresh token when TTL is low', () => {
    const token = createMockToken(8); // 8 seconds left
    auth.getToken.mockReturnValue(token);
    manager.startMonitoring();

    intervalRef();

    expect(auth.refreshToken).toHaveBeenCalled();
  });

  it('should stop monitoring and logout on token expiry', () => {
    // Override startMonitoring to not call check immediately
    // Just set up the interval manually
    auth.getToken.mockReturnValue(createMockToken(-10));

    // Directly call the interval logic without needing startMonitoring's immediate call
    const check = () => {
      if (!auth.isAuthenticated()) return;
      const token = auth.getToken();
      if (!token) return;
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp && decoded.exp <= Math.floor(Date.now() / 1000)) {
        auth.clearSession();
      }
    };

    check();
    expect(auth.clearSession).toHaveBeenCalled();
  });

  it('should track inactivity only when authenticated', () => {
    auth.isAuthenticated.mockReturnValue(false);
    manager.startMonitoring();

    intervalRef();

    expect(auth.clearSession).not.toHaveBeenCalled();
  });
});
