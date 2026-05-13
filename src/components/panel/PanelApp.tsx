import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { authService, alertService, orderService } from '@/config/setup';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { pushAppNotification } from '@/lib/pushAppNotification';
import { SessionManager } from '@/services/SessionManager';

import { useAuth } from '@/hooks/useAuth';
import { usePanelUrlSync } from '@/hooks/usePanelUrlSync';
import { useAppStore } from '@/store/useAppStore';
import { useSalesStore } from '@/store/useSalesStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useUserManagement } from '@/features/users/hooks/useUserManagement';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

import { AdminNavbar } from './AdminNavbar';
import { AdminSubNav } from './AdminSubNav';
import { SettingsSection } from './SettingsSection';
import { ComingSoonSection } from './ComingSoonSection';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { OfflineBanner } from './OfflineBanner';

import { UserDrawer } from '@/features/users/components/UserDrawer';
import { ProfileDrawer } from '@/features/users/components/ProfileDrawer';
import { SecurityDrawer } from '@/features/users/components/SecurityDrawer';
import { OrderDrawer } from '@/features/sales/components/OrderDrawer';
import { StripeQRModal } from '@/features/sales/components/StripeQRModal';

const DashboardSection = lazy(() =>
  import('./DashboardSection').then((m) => ({ default: m.DashboardSection }))
);
const MaintenanceSection = lazy(() =>
  import('./MaintenanceSection').then((m) => ({ default: m.MaintenanceSection }))
);
const ReportsSection = lazy(() =>
  import('./ReportsSection').then((m) => ({ default: m.ReportsSection }))
);
const SalesSection = lazy(() =>
  import('@/features/sales/components/SalesSection').then((m) => ({ default: m.SalesSection }))
);
const ProductsSection = lazy(() =>
  import('@/features/products/components/ProductsSection').then((m) => ({ default: m.ProductsSection }))
);
const CategoriasSection = lazy(() =>
  import('@/features/products/components/CategoriasSection').then((m) => ({ default: m.CategoriasSection }))
);
const InventarioSection = lazy(() =>
  import('@/features/inventory/components/InventarioSection').then((m) => ({ default: m.InventarioSection }))
);
const UserList = lazy(() =>
  import('@/features/users/components/UserList').then((m) => ({ default: m.UserList }))
);


function PanelSectionFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-100 bg-white/80 py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ec131e]/20 border-t-[#ec131e]" />
      <p className="text-sm font-semibold text-slate-500">Cargando módulo…</p>
    </div>
  );
}

const ADMIN_ONLY_TABS = new Set(['usuarios', 'reportes', 'mantenimiento']);

function PanelLoadingShell({ message = 'Cargando sesión…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] gap-4 font-sans">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ec131e]/20 border-t-[#ec131e]" />
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  );
}

export default function PanelApp() {
  const { user, isAdmin, isReady } = useAuth();
  const { activeTab, setActiveTab } = useAppStore();
  const {
    isOrderDrawerOpen,
    setIsOrderDrawerOpen,
    stripeQR,
    setStripeQR,
    resetCart,
  } = useSalesStore();

  const userMgmt = useUserManagement(isAdmin || false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'help' | 'terms' | 'privacy'>('main');
  const [openOrderFromUrl, setOpenOrderFromUrl] = useState<number | undefined>();

  const openPOS = useCallback(() => setIsOrderDrawerOpen(true), [setIsOrderDrawerOpen]);

  usePanelUrlSync(activeTab, setActiveTab, setOpenOrderFromUrl, openPOS);
  useRealTimeUpdates();

  useEffect(() => {
    if (!isReady || !user || isAdmin) return;
    if (ADMIN_ONLY_TABS.has(activeTab)) setActiveTab('dashboard');
  }, [isReady, user, isAdmin, activeTab, setActiveTab]);

  const sessionManager = useMemo(() => new SessionManager(authService, alertService), []);

  useEffect(() => {
    if (!isReady || user) return;
    window.location.replace('/login/');
  }, [isReady, user]);

  useEffect(() => {
    if (!user) return;
    sessionManager.startMonitoring();
    return () => sessionManager.stopMonitoring();
  }, [user, sessionManager]);

  useEffect(() => {
    setSettingsView('main');
  }, [activeTab]);

  const handleOrderDeepLinkDone = useCallback(() => setOpenOrderFromUrl(undefined), []);

  if (!isReady) {
    return <PanelLoadingShell />;
  }

  if (!user) {
    return <PanelLoadingShell message="Redirigiendo al inicio de sesión…" />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#1e293b] selection:bg-[#ec131e]/10 selection:text-[#ec131e]">
      <OfflineBanner />
      <AdminNavbar
        user={user}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenPOS={openPOS}
        onLogout={() => {
          authService.logout();
          window.location.href = '/';
        }}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-8 pb-32 sm:px-6 lg:px-8">
        <ErrorBoundary>
          <Suspense fallback={<PanelSectionFallback />}>
            {activeTab === 'dashboard' ? (
              <DashboardSection onNavigate={setActiveTab} isAdmin={isAdmin} />
            ) : activeTab === 'usuarios' && isAdmin ? (
              <UserList
                users={userMgmt.filteredUsers}
                isLoading={userMgmt.isLoadingUsers}
                searchTerm={userMgmt.searchTerm}
                onSearchChange={userMgmt.setSearchTerm}
                onAddUser={() => userMgmt.handleOpenDrawer()}
                onEditUser={userMgmt.handleOpenDrawer}
                onToggleBlock={userMgmt.handleToggleBlock}
                onResetPassword={userMgmt.handleOpenSecurity}
                currentPage={userMgmt.currentPage}
                totalPages={userMgmt.totalPages}
                onPageChange={userMgmt.loadUsersList}
              />
            ) : activeTab === 'productos' ? (
              <ProductsSection />
            ) : activeTab === 'categorias' ? (
              <CategoriasSection />
            ) : activeTab === 'inventario' ? (
              <InventarioSection />
            ) : activeTab === 'ventas' ? (
              <SalesSection
                isAdmin={isAdmin}
                onOpenPOS={openPOS}
                initialOpenOrderId={openOrderFromUrl}
                onInitialOrderOpened={handleOrderDeepLinkDone}
              />
            ) : activeTab === 'mantenimiento' && isAdmin ? (
              <MaintenanceSection />
            ) : activeTab === 'reportes' && isAdmin ? (
              <ReportsSection />

            ) : activeTab === 'ajustes' ? (
              <SettingsSection
                settingsView={settingsView}
                setSettingsView={setSettingsView}
                onOpenProfile={() => setIsProfileOpen(true)}
              />
            ) : (
              <ComingSoonSection tabId={activeTab} />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      <AdminSubNav activeId={activeTab} onItemClick={setActiveTab} isAdmin={isAdmin} />

      <UserDrawer
        isOpen={userMgmt.isDrawerOpen}
        isEditing={userMgmt.isEditing}
        isRegistering={userMgmt.isRegistering}
        userData={userMgmt.newUser}
        onUserDataChange={userMgmt.setNewUser}
        onSubmit={userMgmt.handleSubmitUser}
        onClose={() => userMgmt.setIsDrawerOpen(false)}
      />

      <ProfileDrawer isOpen={isProfileOpen} user={user} onClose={() => setIsProfileOpen(false)} />

      <SecurityDrawer
        isOpen={userMgmt.isSecurityOpen}
        userName={userMgmt.resettingUser?.nom_usu || ''}
        isProcessing={userMgmt.isResettingPassword}
        onConfirm={userMgmt.handleConfirmPasswordReset}
        onClose={() => userMgmt.setIsSecurityOpen(false)}
      />

      <OrderDrawer />

      <StripeQRModal
        isOpen={stripeQR.isOpen}
        checkoutUrl={stripeQR.url}
        orderId={stripeQR.orderId}
        amount={stripeQR.amount}
        onClose={() => setStripeQR({ ...stripeQR, isOpen: false })}
        onRetryStripe={async () => {
          const id = stripeQR.orderId;
          const { checkoutUrl } = await orderService.createCheckoutSession(id);
          if (!checkoutUrl) throw new Error('No se recibió URL de checkout.');
          setStripeQR({ ...stripeQR, url: checkoutUrl, isOpen: true, orderId: id, amount: stripeQR.amount });
        }}
        onSwitchToCash={() => {
          setStripeQR({ isOpen: false, url: '', orderId: 0, amount: 0 });
          const f = useSalesStore.getState().orderForm;
          useSalesStore.getState().setOrderForm({ ...f, metodopago_usu: 'efectivo' });
          alertService.showToast('info', 'Método cambiado a efectivo. Confirma la venta de nuevo.');
        }}
        onSuccess={async () => {
          const paidId = stripeQR.orderId;
          setStripeQR({ ...stripeQR, isOpen: false });
          resetCart();
          setIsOrderDrawerOpen(false);
          useSalesStore.getState().notifySalesChange();
          useInventoryStore.getState().notifyStockChange();

          try {
            await orderService.downloadReceipt(paidId);
            pushAppNotification('success', 'Comprobante de compra', `Recibo #${paidId} descargado.`, {
              category: 'payment',
              toast: true,
            });
          } catch {
            pushAppNotification(
              'warning',
              'Comprobante',
              'No se pudo descargar el recibo automático. Ábrelo desde el detalle de la venta.',
              { category: 'payment' }
            );
          }

          try {
            const order = await orderService.getOrderById(paidId);
            await orderService.emitInvoiceForOrder(order);
            pushAppNotification('success', 'Factura electrónica', `Factura registrada para venta #${paidId}.`, {
              category: 'payment',
              toast: true,
            });
          } catch (invErr) {
            const m = getErrorMessage(invErr, '');
            if (m.includes('409') || m.toLowerCase().includes('ya tiene')) {
              pushAppNotification('info', 'Factura', 'La venta ya tenía factura emitida.', { category: 'payment', toast: false });
            } else {
              pushAppNotification('warning', 'Factura electrónica', m, { category: 'payment' });
            }
          }
        }}
        onCancel={() => {
          setStripeQR({ ...stripeQR, isOpen: false });
          resetCart();
          setIsOrderDrawerOpen(false);
        }}
      />
    </div>
  );
}
