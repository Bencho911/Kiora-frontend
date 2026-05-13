import * as Sentry from '@sentry/astro';

const PANEL_PREFIX = 'panel';

/**
 * Breadcrumbs en Sentry para entender flujos de uso sin enviar PII.
 * Ampliable a otro proveedor si hace falta.
 */
export function trackPanelEvent(action: string, data?: Record<string, unknown>) {
  try {
    Sentry.addBreadcrumb({
      category: PANEL_PREFIX,
      message: action,
      data,
      level: 'info',
    });
  } catch {
    /* Sentry no inicializado (dev sin DSN, tests, etc.) */
  }
}
