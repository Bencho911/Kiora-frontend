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
<<<<<<< HEAD
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

=======
import { UserList } from './UserList';
import { UserDrawer } from './UserDrawer';
import { ProfileDrawer } from './ProfileDrawer';
import { RolesSection } from './RolesSection';
import { SecurityDrawer } from './SecurityDrawer';
import { ComingSoonSection } from './ComingSoonSection';
import { DashboardSection } from './DashboardSection';
import HelpCenter from '@/components/help/HelpCenter';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function PanelApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Tab switching
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  
  // Reset help view when switching tabs
>>>>>>> main
  useEffect(() => {
    setShowHelp(false);
  }, [activeTab]);

  const handleOrderDeepLinkDone = useCallback(() => setOpenOrderFromUrl(undefined), []);

  if (!isReady) {
    return <PanelLoadingShell />;
  }

<<<<<<< HEAD
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
=======
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    sessionManager.startMonitoring();
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAdmin(String(currentUser.rol_usu ?? '').toLowerCase() === 'admin');
    }
    return () => {
      sessionManager.stopMonitoring();
    };
  }, [sessionManager]);

  const loadUsersList = async (page: number = 1) => {
    setIsLoadingUsers(true);
    try {
      const paginated = await userService.fetchUsers(page, LIMIT);
      const displayUsers = paginated.data.map(u => ({
        ...u,
        isBlocked: userService.isUserBlocked(u)
      }));
      setUsersList(displayUsers);
      setCurrentPage(paginated.pagination?.page || page);
      setTotalPages(paginated.pagination?.totalPages || 1);
    } catch (error: unknown) {
      alertService.showToast('error', getErrorMessage(error, 'Error al cargar los usuarios'));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setIsLoadingUsers(false);
      setUsersList([]);
      setTotalPages(1);
      return;
    }
    void loadUsersList(currentPage);
  }, [isAdmin, currentPage]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return usersList;
    const lowerSearch = searchTerm.toLowerCase();
    return usersList.filter(u => 
      (u.nom_usu || '').toLowerCase().includes(lowerSearch) || 
      (u.correo_usu || '').toLowerCase().includes(lowerSearch)
    );
  }, [usersList, searchTerm]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    const confirmed = await alertService.showConfirm('Cerrar Sesión', '¿Estás seguro que deseas cerrar tu sesión?', 'Cerrar sesión', 'Cancelar');
    if (confirmed) {
      sessionManager.stopMonitoring();
      await authService.logout();
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nom_usu || !newUser.correo_usu || !newUser.rol_usu) {
      alertService.showToast('warning', 'Nombre, correo y rol son obligatorios');
      return;
    }
    setIsRegistering(true);
    try {
      if (isEditing && editingUser?.id_usu) {
        await userService.updateUser(editingUser.id_usu, newUser);
        alertService.showToast('success', 'Usuario actualizado');
      } else {
        await userService.registerUser(newUser);
        alertService.showToast('success', 'Usuario creado');
      }
      setIsDrawerOpen(false);
      loadUsersList(currentPage); 
    } catch (e: unknown) {
      alertService.showToast('error', getErrorMessage(e, 'Error al procesar'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setIsEditing(true);
    setNewUser({
      nom_usu: String(u.nom_usu || ''),
      correo_usu: String(u.correo_usu || ''),
      tel_usu: String(u.tel_usu || ''),
      rol_usu: String(u.rol_usu || '')
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteUser = async (id: string | number) => {
    const confirm = await alertService.showConfirm('¿Eliminar Usuario?', '¿Deseas eliminar este usuario?', 'Eliminar', 'Cancelar');
    if (confirm) {
      try {
        await userService.deleteUser(id);
        alertService.showToast('success', 'Usuario eliminado');
        loadUsersList(currentPage);
      } catch (e: unknown) {
        alertService.showToast('error', getErrorMessage(e, 'Error al eliminar'));
      }
    }
  };

  const handleUnlockUser = async (id: string | number) => {
    const confirm = await alertService.showConfirm('Desbloquear', '¿Desbloquear cuenta?', 'Desbloquear', 'Cancelar');
    if (confirm) {
      try {
        await userService.unlockUser(id.toString());
        alertService.showToast('success', 'Usuario desbloqueado');
        loadUsersList(currentPage);
      } catch (e: unknown) {
        alertService.showToast('error', getErrorMessage(e, 'Error al desbloquear'));
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alertService.showToast('warning', 'Las contraseñas no coinciden');
      return;
    }
    setIsChangingPassword(true);
    try {
      await userService.changePassword(passwords.current, passwords.new);
      alertService.showToast('success', 'Contraseña actualizada');
      setIsProfileOpen(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e: unknown) {
      alertService.showToast('error', getErrorMessage(e, 'Error al cambiar la contraseña'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordResetClick = (u: User) => {
    setResettingUser(u);
    setIsSecurityOpen(true);
  };

  const handleConfirmPasswordReset = async (newPassword: string) => {
    if (!resettingUser?.id_usu) return;
    setIsResettingPassword(true);
    try {
      await userService.adminUpdatePassword(resettingUser.id_usu, newPassword);
      alertService.showToast('success', 'Contraseña actualizada correctamente');
      setIsSecurityOpen(false);
    } catch (e: unknown) {
      alertService.showToast('error', getErrorMessage(e, 'Error al actualizar la contraseña'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-[#FDFCFB]/80 pb-32 font-[Inter] text-slate-800 antialiased">
      <AdminNavbar user={user} onLogout={handleLogout} onProfileOpen={() => setIsProfileOpen(true)} />
      
>>>>>>> main

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

<<<<<<< HEAD
            ) : activeTab === 'ajustes' ? (
              <SettingsSection
                settingsView={settingsView}
                setSettingsView={setSettingsView}
                onOpenProfile={() => setIsProfileOpen(true)}
              />
            ) : (
              <ComingSoonSection tabId={activeTab} />
=======
            <UserList 
              users={filteredUsers}
              isLoading={isLoadingUsers}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onEdit={handleEditClick}
              onDelete={handleDeleteUser}
              onUnlock={handleUnlockUser}
              onPasswordReset={handlePasswordResetClick}
              pagination={{ currentPage, totalPages, onPageChange: loadUsersList }}
            />

            <RolesSection />
          </>
        ) : activeTab === 'ajustes' ? (
          <div className="space-y-8">
            <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#3E2723]/5 border border-[#3E2723]/10">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ec131e] animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E2723]/60">Preferencias</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl">
                  Ajustes <span className="text-[#ec131e]">&</span> Ayuda
                </h1>
              </div>
            </header>

            {!showHelp ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setShowHelp(true)}
                  className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl text-left transition-all hover:border-[#ec131e]/30 hover:shadow-lg group"
                >
                  <div className="w-14 h-14 bg-red-50 text-[#ec131e] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827] text-lg">Centro de Ayuda</h3>
                    <p className="text-slate-500 text-sm font-medium">Preguntas frecuentes y soporte técnico.</p>
                  </div>
                </button>

                <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl opacity-60 cursor-not-allowed">
                  <div className="w-14 h-14 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827] text-lg">Configuración General</h3>
                    <p className="text-slate-500 text-sm font-medium">Próximamente.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                  onClick={() => setShowHelp(false)}
                  className="mb-6 flex items-center gap-2 text-slate-400 hover:text-[#ec131e] transition-all group font-bold text-xs uppercase tracking-widest bg-transparent border-none cursor-pointer"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver a Ajustes
                </button>
                <HelpCenter hideBackButton={true} />
              </div>
>>>>>>> main
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
