import { useState, useCallback, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { userService, alertService } from '@/config/setup';
import type { User } from '@/models/User';
import type { RegisterUserDto } from '@/services/UserService';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { pushAppNotification } from '@/lib/pushAppNotification';
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
  
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
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
      pushAppNotification('error', 'Usuarios', 'No se pudo cargar el listado de usuarios.', { category: 'user', toast: false });
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
    const fuse = new Fuse(usersList, {
      keys: ['nom_usu', 'correo_usu', 'tel_usu'],
      threshold: 0.4,
      minMatchCharLength: 2,
    });
    return fuse.search(searchTerm.trim()).map(r => r.item);
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

        // Si el rol cambió, llamar al endpoint específico de rol
        // (updateUser elimina rol_usu del payload internamente)
        if (newUser.rol_usu && newUser.rol_usu !== editingUser.rol_usu) {
          await userService.updateRole(editingUser.id_usu, newUser.rol_usu);
        }

        alertService.showToast('success', 'Usuario actualizado correctamente');
        pushAppNotification('info', 'Usuario Actualizado', `Se ha actualizado la información de ${newUser.nom_usu}`, { category: 'user', toast: false });
      } else {
        await userService.registerUser(newUser);
        alertService.showToast('success', 'Usuario registrado correctamente');
        pushAppNotification('success', 'Nuevo Usuario', `Se ha registrado a ${newUser.nom_usu}`, { category: 'user', toast: false });
      }
      setIsDrawerOpen(false);
      void loadUsersList(currentPage);
    } catch (e) {
      const msg = getErrorMessage(e, 'Error al procesar usuario');
      alertService.showToast('error', msg);
      pushAppNotification('error', 'Usuario', msg, { category: 'user' });
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
        pushAppNotification('success', 'Usuario Desbloqueado', `El usuario ${u.nom_usu} ha sido desbloqueado.`, { category: 'user', toast: false });
      } else {
        await userService.blockUser(u.id_usu);
        alertService.showToast('success', 'Usuario bloqueado temporalmente');
        pushAppNotification('warning', 'Usuario Bloqueado', `El usuario ${u.nom_usu} ha sido bloqueado manualmente.`, { category: 'user', toast: false });
      }
      void loadUsersList(currentPage);
    } catch (e) {
      alertService.showToast('error', 'Error al cambiar estado del usuario');
      pushAppNotification('error', 'Usuario', 'No se pudo bloquear o desbloquear el usuario.', { category: 'user' });
    }
  }, [currentPage, loadUsersList]);

  const handleDeleteUser = useCallback(async (id_usu: string | number) => {
    try {
      await userService.deleteUser(id_usu);
      alertService.showToast('success', 'Usuario eliminado exitosamente');
      pushAppNotification('info', 'Usuario Eliminado', `Se ha eliminado el usuario.`, { category: 'user', toast: false });
      void loadUsersList(currentPage);
    } catch (e) {
      const msg = getErrorMessage(e, 'Error al eliminar usuario');
      alertService.showToast('error', msg);
      pushAppNotification('error', 'Usuario', msg, { category: 'user' });
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
      pushAppNotification('warning', 'Usuarios', 'La contraseña no cumple la política mínima.', { category: 'user', toast: false });
      return;
    }
    setIsResettingPassword(true);
    try {
      await userService.adminUpdatePassword(resettingUser.id_usu, pass);
      alertService.showToast('success', 'Contraseña restablecida exitosamente');
      pushAppNotification('info', 'Seguridad', `Se restableció la contraseña de ${resettingUser.nom_usu}.`, { category: 'user', toast: false });
      setIsSecurityOpen(false);
    } catch (e) {
      alertService.showToast('error', 'Error al restablecer contraseña');
      pushAppNotification('error', 'Usuarios', 'Fallo al restablecer contraseña.', { category: 'user', toast: false });
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
    handleConfirmPasswordReset,
    userToDelete,
    setUserToDelete,
    handleDeleteUser
  };
}
