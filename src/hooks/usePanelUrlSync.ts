import { useEffect, useRef } from 'react';
import { trackPanelEvent } from '@/lib/analytics';

const VALID_TABS = new Set([
  'dashboard',
  'usuarios',
  'productos',
  'categorias',
  'inventario',
  'ventas',
  'mantenimiento',
  'reportes',
  'ajustes',
]);

/**
 * Lee ?tab=, ?order_id=, ?status=, ?view=pos|?modo=caja al cargar y sincroniza la barra de URL al cambiar de pestaña.
 */
export function usePanelUrlSync(
  activeTab: string,
  setActiveTab: (tab: string) => void,
  setOpenOrderFromUrl: (id: number | undefined) => void,
  openPOS: () => void
): void {
  const hasAppliedInitial = useRef(false);

  useEffect(() => {
    if (hasAppliedInitial.current) return;
    hasAppliedInitial.current = true;

    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }

    let tab = params.get('tab');
    const orderRaw = params.get('order_id');

    if ((!tab || !VALID_TABS.has(tab)) && orderRaw && /^\d+$/.test(orderRaw)) {
      tab = 'ventas';
      setActiveTab('ventas');
      trackPanelEvent('url_initial_tab', { tab: 'ventas', reason: 'order_id' });
    } else if (tab && VALID_TABS.has(tab)) {
      setActiveTab(tab);
      trackPanelEvent('url_initial_tab', { tab });
    }

    if (orderRaw && /^\d+$/.test(orderRaw)) {
      setOpenOrderFromUrl(Number(orderRaw));
      trackPanelEvent('url_initial_order', { order_id: orderRaw });
    }

    const status = params.get('status');
    if (status === 'success') {
      trackPanelEvent('return_from_checkout', { outcome: 'success' });
    } else if (status === 'cancel') {
      trackPanelEvent('return_from_checkout', { outcome: 'cancel' });
    }

    const view = params.get('view');
    const modo = params.get('modo');
    if (view === 'pos' || modo === 'caja') {
      openPOS();
      trackPanelEvent('quick_cashier_open', {});
    }

    const u = new URL(window.location.href);
    u.searchParams.delete('order_id');
    u.searchParams.delete('status');
    u.searchParams.delete('view');
    u.searchParams.delete('modo');
    const tabForUrl = tab && VALID_TABS.has(tab) ? tab : u.searchParams.get('tab');
    if (tabForUrl && VALID_TABS.has(tabForUrl)) {
      u.searchParams.set('tab', tabForUrl);
    } else {
      u.searchParams.set('tab', 'dashboard');
    }
    const qs = u.searchParams.toString();
    window.history.replaceState({}, '', qs ? `${u.pathname}?${qs}` : u.pathname);
  }, [setActiveTab, setOpenOrderFromUrl, openPOS]);

  const prevTab = useRef(activeTab);
  useEffect(() => {
    if (prevTab.current === activeTab) return;
    prevTab.current = activeTab;

    const u = new URL(window.location.href);
    u.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', `${u.pathname}?${u.searchParams.toString()}`);
    trackPanelEvent('tab_change', { tab: activeTab });
  }, [activeTab]);
}
