import { useState, useEffect, useMemo } from 'react';
import { authService, userService, alertService, productService, notificationService } from '@/config/setup';
import { SessionManager } from '@/services/SessionManager';
import type { User } from '@/models/User';
import type { Product } from '@/models/Product';
import type { RegisterUserDto } from '@/services/UserService';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';
import { useSalesStore } from '@/store/useSalesStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useUserManagement } from '@/features/users/hooks/useUserManagement';

// Modular Components — shell/nav
import { AdminNavbar } from './AdminNavbar';
import { AdminSubNav } from './AdminSubNav';
import { DashboardSection } from './DashboardSection';
import { SettingsSection } from './SettingsSection';
import { LegalSection } from './LegalSection';
import { MaintenanceSection } from './MaintenanceSection';
import { ComingSoonSection } from './ComingSoonSection';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ReportsSection } from './ReportsSection';
// Feature: Sales
import { SalesSection } from '@/features/sales/components/SalesSection';
import { OrderDrawer } from '@/features/sales/components/OrderDrawer';
import { StripeQRModal } from '@/features/sales/components/StripeQRModal';
// Feature: Products
import { ProductsSection } from '@/features/products/components/ProductsSection';
import { CategoriasSection } from '@/features/products/components/CategoriasSection';
// Feature: Inventory
import { InventarioSection } from '@/features/inventory/components/InventarioSection';
// Feature: Users
import { UserList } from '@/features/users/components/UserList';
import { UserDrawer } from '@/features/users/components/UserDrawer';
import { ProfileDrawer } from '@/features/users/components/ProfileDrawer';
import { RolesSection } from '@/features/users/components/RolesSection';
import { SecurityDrawer } from '@/features/users/components/SecurityDrawer';
import HelpCenter from '@/components/help/HelpCenter';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { validatePassword } from '@/utils/validation';

export default function PanelApp() {
  const { user, isAdmin } = useAuth();
  const { activeTab, setActiveTab } = useAppStore();
  const { 
    isOrderDrawerOpen, setIsOrderDrawerOpen, 
    stripeQR, setStripeQR, resetCart 
  } = useSalesStore();
  
  const userMgmt = useUserManagement(isAdmin || false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'help' | 'terms' | 'privacy'>('main');

  // Session monitoring and low stock alerts
  const sessionManager = useMemo(() => new SessionManager(authService, alertService), []);

  useEffect(() => {
    if (!user) return;
    sessionManager.startMonitoring();
    return () => sessionManager.stopMonitoring();
  }, [user]);

  useEffect(() => {
    setSettingsView('main');
  }, [activeTab]);

  // Global navigation listener

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-[#ec131e]/10 selection:text-[#ec131e]">
      <AdminNavbar 
        user={user} 
        onOpenProfile={() => setIsProfileOpen(true)} 
        onOpenPOS={() => setIsOrderDrawerOpen(true)}
        onLogout={() => { authService.logout(); window.location.href = '/'; }}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <ErrorBoundary>
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
            <SalesSection isAdmin={isAdmin} onOpenPOS={() => setIsOrderDrawerOpen(true)} />
          ) : activeTab === 'mantenimiento' && isAdmin ? (
            <MaintenanceSection />
          ) : activeTab === 'reportes' && isAdmin ? (
            <ReportsSection />
          ) : activeTab === 'roles' && isAdmin ? (
            <RolesSection />
          ) : activeTab === 'ajustes' ? (
            <SettingsSection 
              settingsView={settingsView} 
              setSettingsView={setSettingsView} 
              onOpenProfile={() => setIsProfileOpen(true)} 
            />
          ) : (
            <ComingSoonSection tabId={activeTab} />
          )}
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
        onSuccess={() => {
          setStripeQR({ ...stripeQR, isOpen: false });
          resetCart();
          setIsOrderDrawerOpen(false);
          useSalesStore.getState().notifySalesChange();
          useInventoryStore.getState().notifyStockChange();
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
