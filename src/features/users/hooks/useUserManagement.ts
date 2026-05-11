import { useState, useCallback, useMemo, useEffect } from 'react';
import { userService, alertService } from '@/config/setup';
import type { User } from '@/models/User';
import type { RegisterUserDto } from '@/services/UserService';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { validatePassword } from '@/utils/validation';

export function useUserManagement(isAdmin: boolean) {
  const [usersList, setUsersList] = useState<(User & { isBlocked: boolean })[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState<RegisterUserDto>({
    nom_usu: '',
    correo_usu: '',
    tel_usu: '',
    rol_usu: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const loadUsersList = useCallback(async (page: number = 1) => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const paginated = await userService.fetchUsers(page, LIMIT);
      const usersArray = Array.isArray(paginated.data) ? paginated.data : [];
      setUsersList(usersArray.map(u => ({ ...u, isBlocked: userService.isUserBlocked(u) })));
      setCurrentPage(paginated.pagination?.page || page);
      setTotalPages(paginated.pagination?.totalPages || 1);
    } catch (e) { 
      alertService.showToast('error', 'Error al cargar usuarios'); 
    } finally { 
      setIsLoadingUsers(false); 
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void loadUsersList(1);
    }
  }, [isAdmin, loadUsersList]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return usersList;
    const lowerSearch = searchTerm.toLowerCase();
    return usersList.filter(u => 
      (u.nom_usu || '').toLowerCase().includes(lowerSearch) || 
      (u.correo_usu || '').toLowerCase().includes(lowerSearch)
    );
  }, [usersList, searchTerm]);

  const handleOpenDrawer = useCallback((user: User | null = null) => {
    setIsEditing(!!user);
    setEditingUser(user);
    if (user) {
      setNewUser({
        nom_usu: user.nom_usu || '',
        correo_usu: user.correo_usu || '',
        tel_usu: user.tel_usu || '',
        rol_usu: user.rol_usu || ''
      });
    } else {
      setNewUser({ nom_usu: '', correo_usu: '', tel_usu: '', rol_usu: 'cliente' });
    }
    setIsDrawerOpen(true);
  }, []);

  const handleSubmitUser = useCallback(async () => {
    setIsRegistering(true);
    try {
      if (isEditing && editingUser && editingUser.id_usu !== undefined) {
        await userService.updateUser(editingUser.id_usu, newUser);
        alertService.showToast('success', 'Usuario actualizado correctamente');
      } else {
        await userService.registerUser(newUser);
        alertService.showToast('success', 'Usuario registrado correctamente');
      }
      setIsDrawerOpen(false);
      void loadUsersList(currentPage);
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al procesar usuario'));
    } finally {
      setIsRegistering(false);
    }
  }, [isEditing, editingUser, newUser, currentPage, loadUsersList]);

  const handleToggleBlock = useCallback(async (u: User) => {
    const isBlocked = userService.isUserBlocked(u);
    try {
      if (u.id_usu === undefined) return;
      if (isBlocked) {
        await userService.unlockUser(u.id_usu);
        alertService.showToast('success', 'Usuario desbloqueado');
      } else {
        await userService.blockUser(u.id_usu);
        alertService.showToast('success', 'Usuario bloqueado temporalmente');
      }
      void loadUsersList(currentPage);
    } catch (e) { 
      alertService.showToast('error', 'Error al cambiar estado del usuario'); 
    }
  }, [currentPage, loadUsersList]);

  const handleOpenSecurity = useCallback((u: User) => {
    setResettingUser(u);
    setIsSecurityOpen(true);
  }, []);

  const handleConfirmPasswordReset = useCallback(async (pass: string) => {
    if (!resettingUser || resettingUser.id_usu === undefined) return;
    if (!validatePassword(pass)) {
      alertService.showToast('error', 'Contraseña inválida (mín. 8 caracteres)');
      return;
    }
    setIsResettingPassword(true);
    try {
      await userService.adminUpdatePassword(resettingUser.id_usu, pass);
      alertService.showToast('success', 'Contraseña restablecida exitosamente');
      setIsSecurityOpen(false);
    } catch (e) { 
      alertService.showToast('error', 'Error al restablecer contraseña'); 
    } finally {
      setIsResettingPassword(false);
    }
  }, [resettingUser]);

  return {
    usersList,
    isLoadingUsers,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    filteredUsers,
    isDrawerOpen,
    setIsDrawerOpen,
    isEditing,
    newUser,
    setNewUser,
    isRegistering,
    loadUsersList,
    handleOpenDrawer,
    handleSubmitUser,
    handleToggleBlock,
    isSecurityOpen,
    setIsSecurityOpen,
    resettingUser,
    isResettingPassword,
    handleOpenSecurity,
    handleConfirmPasswordReset
  };
}
