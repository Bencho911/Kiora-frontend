import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { authService, userService, alertService, productService, orderService, notificationService } from '@/config/setup';
import { SessionManager } from '@/services/SessionManager';
import type { User } from '@/models/User';
import type { Product, Category } from '@/models/Product';
import type { CreateOrderDto } from '@/services/OrderService';
import type { RegisterUserDto } from '@/services/UserService';

// Modular Components
import { AdminNavbar } from './AdminNavbar';
import { AdminSubNav } from './AdminSubNav';
import { UserList } from './UserList';
import { UserDrawer } from './UserDrawer';
import { LegalSection } from './LegalSection';
import { ProfileDrawer } from './ProfileDrawer';
import { RolesSection } from './RolesSection';
import { SecurityDrawer } from './SecurityDrawer';
import { DashboardSection } from './DashboardSection';
import { InventarioSection } from './InventarioSection';
import { CategoriasSection } from './CategoriasSection';
import { ComingSoonSection } from './ComingSoonSection'; 
import { ProductsSection } from './ProductsSection';
import { SalesSection } from './SalesSection';
import { MaintenanceSection } from './MaintenanceSection';
import { OrderDrawer } from './OrderDrawer';
import { ReportsSection } from './ReportsSection';
import { StripeQRModal } from './StripeQRModal';
import HelpCenter from '@/components/help/HelpCenter';
import { StockProvider } from '@/context/StockContext';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { validatePassword } from '@/utils/validation';

const EMPTY_ORDER: CreateOrderDto = {
  metodopago_usu: 'efectivo',
  items: [],
};

export default function PanelApp() {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [isAdmin, setIsAdmin] = useState(() => authService.isAdmin());
  
  // Tab switching
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kiora_active_tab') || 'dashboard';
    }
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('kiora_active_tab', activeTab);
  }, [activeTab]);

  const [isHydrated, setIsHydrated] = useState(false);

  // POS State
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState<CreateOrderDto>(EMPTY_ORDER);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Stripe QR Modal State
  const [stripeQR, setStripeQR] = useState<{ isOpen: boolean; url: string; orderId: number; amount: number }>({
    isOpen: false,
    url: '',
    orderId: 0,
    amount: 0
  });

  // Settings view state
  const [settingsView, setSettingsView] = useState<'main' | 'help' | 'terms' | 'privacy'>('main');
  
  useEffect(() => {
    setSettingsView('main');
  }, [activeTab]);

  const [showHelp, setShowHelp] = useState(false);
  
  // Users list state
  const [usersList, setUsersList] = useState<(User & { isBlocked: boolean })[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Forms state
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState<RegisterUserDto>({
    nom_usu: '',
    correo_usu: '',
    tel_usu: '',
    rol_usu: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const cartKey = user ? `kiora_cart_${user.id_usu}` : null;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      window.location.href = '/login/';
      return;
    }
    
    // Sincronizar datos frescos del perfil (HU01)
    const refreshProfile = async () => {
      try {
        const freshUser = await userService.getMe();
        setUser(freshUser);
        setIsAdmin(freshUser.rol_usu?.toLowerCase().includes('admin') || false);
        // Actualizar localstorage para persistencia
        authService.saveSession(authService.getToken() || '', freshUser);
      } catch (e) {
        console.warn('[PanelApp] No se pudo refrescar el perfil:', e);
      }
    };
    refreshProfile();
  }, []);

  // Persistence: Load cart
  useEffect(() => {
    if (!cartKey) return;
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) setOrderForm(parsed);
      } catch (e) { console.error('Error loading cart:', e); }
    }
  }, [cartKey]);

  // Persistence: Save cart
  useEffect(() => {
    if (!cartKey || orderForm === EMPTY_ORDER || ((orderForm.items || []).length === 0 && !localStorage.getItem(cartKey))) return;
    localStorage.setItem(cartKey, JSON.stringify(orderForm));
  }, [orderForm, cartKey]);

  // --- Session & Security ---
  const sessionManager = useMemo(() => new SessionManager(authService, alertService), []);
  const userIsAdmin = authService.isAdmin();

  const checkLowStock = async () => {
    if (!userIsAdmin) return;
    try {
      const lowStock = await productService.getLowStockProducts();
      if (Array.isArray(lowStock) && lowStock.length > 0) {
        notificationService.addNotification({
          title: 'Alerta de Inventario',
          description: `Hay ${lowStock.length} productos con stock bajo.`,
          type: 'warning'
        });
      }
    } catch (err) { console.error('Error checking low stock:', err); }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) { window.location.href = '/login/'; return; }
    sessionManager.startMonitoring();
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAdmin(authService.isAdmin());
    }
    const handleNav = (e: any) => { if (e.detail?.tab) setActiveTab(e.detail.tab); };
    window.addEventListener('kiora_navigate', handleNav);
    window.addEventListener('kiora_reload_inventory', checkLowStock);
    const timeout = setTimeout(checkLowStock, 2000);
    return () => {
      sessionManager.stopMonitoring();
      window.removeEventListener('kiora_navigate', handleNav);
      window.removeEventListener('kiora_reload_inventory', checkLowStock);
      clearTimeout(timeout);
    };
  }, [sessionManager, userIsAdmin]);

  const loadUsersList = async (page: number = 1) => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const paginated = await userService.fetchUsers(page, LIMIT);
      const usersArray = Array.isArray(paginated.data) ? paginated.data : [];
      setUsersList(usersArray.map(u => ({ ...u, isBlocked: userService.isUserBlocked(u) })));
      setCurrentPage(paginated.pagination?.page || page);
      setTotalPages(paginated.pagination?.totalPages || 1);
    } catch (e) { alertService.showToast('error', 'Error al cargar usuarios'); }
    finally { setIsLoadingUsers(false); }
  };

  useEffect(() => {
    if (isAdmin) void loadUsersList(currentPage);
  }, [isAdmin, currentPage, activeTab]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return usersList;
    const lowerSearch = searchTerm.toLowerCase();
    return usersList.filter(u => 
      (u.nom_usu || '').toLowerCase().includes(lowerSearch) || 
      (u.correo_usu || '').toLowerCase().includes(lowerSearch)
    );
  }, [usersList, searchTerm]);

  // POS Handlers
  const loadPOSData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts(),
        productService.getCategories()
      ]);
      setAllProducts(Array.isArray(prodRes) ? prodRes : (prodRes?.data || []));
      setCategories(Array.isArray(catRes) ? catRes : (catRes?.data || []));
    } catch (e) { console.error('Error loading POS data:', e); }
  };

  useEffect(() => {
    if (isOrderDrawerOpen) void loadPOSData();
  }, [isOrderDrawerOpen]);

  const filteredPOSProducts = useMemo(() => {
    let result = allProducts;

    // Filter by Category
    if (selectedCategoryId) {
      result = result.filter(p => p.fk_cod_cats?.includes(selectedCategoryId));
    }

    // Search with Fuse.js (Typo tolerant)
    const q = prodSearch.trim();
    if (q) {
      const fuse = new Fuse(result, { 
        keys: ['nom_prod', 'cod_prod'], 
        threshold: 0.3,
        distance: 100,
        includeMatches: true
      });
      result = fuse.search(q).map(r => r.item);
    }

    return result;
  }, [allProducts, prodSearch, selectedCategoryId]);

  const addToCart = (p: Product) => {
    const stock = p.stock_actual || 0;
    if (stock <= 0) {
      alertService.showToast('error', 'Producto sin stock disponible');
      return;
    }

    const existing = orderForm.items.find(i => i.cod_prod === p.cod_prod);
    if (existing) {
      if (existing.cantidad >= stock) {
        alertService.showToast('warning', `Solo hay ${stock} unidades disponibles`);
        return;
      }
      setOrderForm(f => ({
        ...f,
        items: f.items.map(i => i.cod_prod === p.cod_prod ? { ...i, cantidad: i.cantidad + 1 } : i)
      }));
    } else {
      setOrderForm(f => ({
        ...f,
        items: [...f.items, { 
          cod_prod: p.cod_prod!, 
          cantidad: 1, 
          precio_unit: p.precio_prod,
          nom_prod: p.nom_prod,
          url_imagen: p.imagen_prod,
          stock_actual: stock
        }]
      }));
    }
  };

  const removeFromCart = (cod_prod: number) => {
    setOrderForm(f => ({ ...f, items: f.items.filter(i => i.cod_prod !== cod_prod) }));
  };

  const updateQuantity = (cod_prod: number, delta: number, maxStock?: number) => {
    setOrderForm(f => ({
      ...f,
      items: f.items.map(i => {
        if (i.cod_prod === cod_prod) {
          const limit = maxStock ?? i.stock_actual ?? 999;
          const newCant = Math.max(1, i.cantidad + delta);
          
          if (delta > 0 && newCant > limit) {
            alertService.showToast('warning', `Límite de stock alcanzado (${limit})`);
            return i;
          }
          
          return { ...i, cantidad: newCant };
        }
        return i;
      })
    }));
  };

  const cartTotal = useMemo(() => {
    return orderForm.items.reduce((acc, item) => acc + (item.cantidad * (item.precio_unit || 0)), 0);
  }, [orderForm.items]);

  const handleCreateOrder = async () => {
    if (!orderForm.items.length) return;
    setIsSavingOrder(true);
    try {
      const order = await orderService.createOrder(orderForm);
      
      // Stripe Integration
      if (orderForm.metodopago_usu === 'tarjeta' && order.id_vent) {
        const { checkoutUrl } = await orderService.createCheckoutSession(order.id_vent);
        if (checkoutUrl) {
          setStripeQR({
            isOpen: true,
            url: checkoutUrl,
            orderId: order.id_vent,
            amount: cartTotal
          });
          return;
        }
      }

      alertService.showToast('success', 'Venta realizada con éxito');
      setOrderForm({ items: [], metodopago_usu: 'efectivo' });
      setIsOrderDrawerOpen(false);
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al procesar la venta'));
    } finally {
      setIsSavingOrder(false);
    }
  };
  const handleCancelOrder = () => {
    if (orderForm.items.length === 0) return;
    alertService.showConfirm('¿Cancelar Pedido?', 'Se borrarán todos los productos del carrito.', 'Sí, cancelar', 'No, mantener')
      .then(ok => {
        if (ok) {
          setOrderForm({ items: [], metodopago_usu: 'efectivo' });
          if (cartKey) localStorage.removeItem(cartKey);
          alertService.showToast('info', 'Pedido cancelado');
        }
      });
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (await alertService.showConfirm('Salir', '¿Cerrar sesión?', 'Sí', 'No')) await authService.logout();
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar contraseña si es creación
    if (!isEditing && newUser.password) {
      const validation = validatePassword(newUser.password);
      if (!validation.isValid) {
        alertService.showToast('error', validation.message);
        return;
      }
    }

    setIsRegistering(true);
    try {
      if (isEditing && editingUser?.id_usu) {
        // Actualizar datos básicos (sin el rol en el body del patch principal si el backend lo prohíbe)
        await userService.updateUser(editingUser.id_usu, newUser);
        if (newUser.rol_usu && newUser.rol_usu !== String(editingUser.rol_usu)) {
          await userService.updateRole(editingUser.id_usu, newUser.rol_usu);
        }
        alertService.showToast('success', 'Usuario actualizado');
      } else {
        await userService.registerUser(newUser);
        alertService.showToast('success', 'Creado');
      }
      setIsDrawerOpen(false);
      loadUsersList(currentPage);
    } catch (e) { alertService.showToast('error', 'Error al procesar'); }
    finally { setIsRegistering(false); }
  };

  const handleConfirmPasswordReset = async (newPassword: string) => {
    if (!resettingUser?.id_usu) return;
    setIsResettingPassword(true);
    try {
      await userService.adminUpdatePassword(resettingUser.id_usu, newPassword);
      alertService.showToast('success', 'Contraseña actualizada');
      setIsSecurityOpen(false);
    } catch (e) { alertService.showToast('error', 'Error al actualizar'); }
    finally { setIsResettingPassword(false); }
  };

  const handleResetPasswordClick = (u: User) => {
    setResettingUser(u);
    setIsSecurityOpen(true);
  };

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setIsEditing(true);
    setNewUser({
      nom_usu: u.nom_usu || '',
      correo_usu: u.correo_usu || '',
      tel_usu: u.tel_usu || '',
      rol_usu: String(u.rol_usu)
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteUser = async (id: string | number) => {
    if (await alertService.showConfirm('¿Eliminar?', '¿Seguro?', 'Eliminar', 'Cancelar')) {
      try {
        await userService.deleteUser(Number(id));
        alertService.showToast('success', 'Eliminado');
        loadUsersList(currentPage);
      } catch (e) { alertService.showToast('error', 'Error al eliminar'); }
    }
  };

  const handleUnlockUser = async (id: string | number) => {
    try {
      await userService.unlockUser(Number(id));
      alertService.showToast('success', 'Desbloqueado');
      loadUsersList(currentPage);
    } catch (e) { alertService.showToast('error', 'Error al desbloquear'); }
  };

  if (!user) return null;

  return (
    <StockProvider>
      <div className="min-h-screen w-full bg-[#FDFCFB]/80 font-[Inter] text-slate-800 antialiased">
        <AdminNavbar user={user} onLogout={handleLogout} onProfileOpen={() => setIsProfileOpen(true)} />
      
        <main className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:pl-16">
          {activeTab === 'dashboard' ? (
            <DashboardSection onSwitchTab={setActiveTab} />
          ) : activeTab === 'inventario' ? (
            <InventarioSection />
          ) : activeTab === 'productos' ? (
            <ProductsSection />
          ) : activeTab === 'categorias' ? (
            <CategoriasSection />
          ) : activeTab === 'ventas' ? (
            <SalesSection onOpenPOS={() => setIsOrderDrawerOpen(true)} isAdmin={isAdmin} />
          ) : activeTab === 'mantenimiento' ? (
            <MaintenanceSection />
          ) : activeTab === 'reportes' ? (
            <ReportsSection />
          ) : activeTab === 'usuarios' ? (
            <>
              <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-extrabold text-[#1a1a1a]">Gestión de Usuarios</h1>
                  <p className="text-slate-500 font-medium">Administra accesos y cuentas del sistema.</p>
                </div>
                <button onClick={() => { setEditingUser(null); setIsEditing(false); setNewUser({ nom_usu: '', correo_usu: '', tel_usu: '', rol_usu: '' }); setIsDrawerOpen(true); }} className="rounded-xl bg-[#ec131e] px-5 py-3 text-sm font-bold text-white shadow-lg">Nuevo Usuario</button>
              </header>

              <div className="space-y-12">
                <UserList users={filteredUsers} isLoading={isLoadingUsers} searchTerm={searchTerm} onSearchChange={setSearchTerm} onEdit={handleEditClick} onDelete={handleDeleteUser} onUnlock={handleUnlockUser} onResetPassword={handleResetPasswordClick} pagination={{ currentPage, totalPages, onPageChange: loadUsersList }} />
              </div>
            </>
          ) : activeTab === 'ajustes' ? (
            <div className="space-y-8">
              <header className="mb-10">
                <h1 className="text-3xl font-extrabold text-[#1a1a1a]">Ajustes & Ayuda</h1>
              </header>

              {settingsView === 'main' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => setSettingsView('help')} className="flex flex-col p-6 bg-white border border-slate-100 rounded-2xl text-left hover:border-[#ec131e]/30 hover:shadow-lg transition-all group h-full">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-50 text-[#ec131e] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#111827] text-lg">Centro de Ayuda</h3>
                        <p className="text-slate-500 text-sm">Soporte y FAQs.</p>
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-col p-6 bg-white border border-slate-100 rounded-2xl hover:border-[#ec131e]/30 hover:shadow-lg transition-all h-full relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#111827] text-lg">Información Legal</h3>
                        <p className="text-slate-500 text-sm">Políticas y normas.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-auto -ml-6">
                      <button 
                        onClick={() => setSettingsView('terms')} 
                        className="w-fit text-[11px] text-slate-500 hover:text-[#ec131e] font-bold transition-colors bg-white/90 backdrop-blur-md px-4 py-2 rounded-r-xl shadow-md border border-l-0 border-slate-100 hover:border-[#ec131e]/30 inline-flex items-center"
                      >
                        Términos y Condiciones
                      </button>
                      <button 
                        onClick={() => setSettingsView('privacy')} 
                        className="w-fit text-[11px] text-slate-500 hover:text-[#ec131e] font-bold transition-colors bg-white/90 backdrop-blur-md px-4 py-2 rounded-r-xl shadow-md border border-l-0 border-slate-100 hover:border-[#ec131e]/30 inline-flex items-center"
                      >
                        Política de Privacidad
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-2xl text-left transition-all md:col-span-2">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5a18.022 18.022 0 01-3.827-5.802M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#111827] text-lg">Idioma & Traducción</h3>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-widest">Weglot AI</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { if (typeof window !== 'undefined' && (window as any).Weglot) { (window as any).Weglot.switchTo('es'); } }} className="px-5 py-2 bg-slate-100 hover:bg-[#ec131e] hover:text-white text-slate-700 text-sm font-bold rounded-lg transition-colors">Español</button>
                        <button onClick={() => { if (typeof window !== 'undefined' && (window as any).Weglot) { (window as any).Weglot.switchTo('en'); } }} className="px-5 py-2 bg-slate-100 hover:bg-[#ec131e] hover:text-white text-slate-700 text-sm font-bold rounded-lg transition-colors">Inglés</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : settingsView === 'help' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <button onClick={() => setSettingsView('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-bold hover:text-[#ec131e] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Volver</button>
                  <HelpCenter hideBackButton={true} />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <button onClick={() => setSettingsView('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-bold hover:text-[#ec131e] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Volver</button>
                  <LegalSection defaultTab={settingsView === 'terms' ? 'terminos' : 'privacidad'} />
                </div>
              )}
            </div>
          ) : (
            <ComingSoonSection tabId={activeTab} />
          )}
        </main>

        <AdminSubNav activeId={activeTab} onItemClick={setActiveTab} isAdmin={isAdmin} />

        <UserDrawer isOpen={isDrawerOpen} isEditing={isEditing} isRegistering={isRegistering} userData={newUser} onUserDataChange={setNewUser} onSubmit={handleSubmitUser} onClose={() => setIsDrawerOpen(false)} />
        <ProfileDrawer isOpen={isProfileOpen} user={user} onClose={() => setIsProfileOpen(false)} />
        <SecurityDrawer isOpen={isSecurityOpen} userName={resettingUser?.nom_usu || ''} isProcessing={isResettingPassword} onConfirm={handleConfirmPasswordReset} onClose={() => setIsSecurityOpen(false)} />
        <OrderDrawer drawerOpen={isOrderDrawerOpen} onClose={() => setIsOrderDrawerOpen(false)} prodSearch={prodSearch} setProdSearch={setProdSearch} filteredProducts={filteredPOSProducts} categories={categories} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} addToCart={addToCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} orderForm={orderForm} setOrderForm={setOrderForm} cartTotal={cartTotal} handleCreateOrder={handleCreateOrder} onCancelOrder={handleCancelOrder} saving={isSavingOrder} safePrice={(v) => (typeof v === 'number' && !isNaN(v)) ? v : Number(v) || 0} />
        
        <StripeQRModal 
          isOpen={stripeQR.isOpen} 
          checkoutUrl={stripeQR.url} 
          orderId={stripeQR.orderId}
          amount={stripeQR.amount}
          onClose={() => setStripeQR(prev => ({ ...prev, isOpen: false }))}
          onSuccess={() => {
            setStripeQR(prev => ({ ...prev, isOpen: false }));
            setOrderForm({ items: [], metodopago_usu: 'efectivo' });
            setIsOrderDrawerOpen(false);
          }}
        />
      </div>
    </StockProvider>
  );
};
