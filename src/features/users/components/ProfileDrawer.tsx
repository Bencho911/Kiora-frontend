import React, { useState } from 'react';
import type { User } from '@/models/User';
import { userService, alertService } from '@/config/setup';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { COLORS } from '@/config/theme';
import { getInitials } from '@/utils/userUtils';

interface ProfileDrawerProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  user,
  onClose
}) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alertService.showToast('warning', 'Las contraseñas no coinciden');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await userService.changePassword(passwords.current, passwords.new);
      alertService.showToast('success', 'Contraseña actualizada con éxito');
      setPasswords({ current: '', new: '', confirm: '' });
      onClose();
    } catch (e) {
      alertService.showToast('error', getErrorMessage(e, 'Error al actualizar la contraseña'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-md bg-surface-bright shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-outline-variant/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 bg-surface">
          <button onClick={onClose} className="p-1.5 -ml-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-sm font-bold text-on-surface">Mi Perfil</h2>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold ring-4 ring-surface shadow-md">
              {getInitials(String(user.nom_usu))}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-on-surface text-lg">{user.nom_usu}</h3>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant mt-1">
                {user.rol_usu}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
             <h4 className="label-sm text-on-surface-variant">Contacto</h4>
             <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 space-y-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-medium text-on-surface-variant">Correo</span>
                   <span className="text-sm font-medium text-on-surface">{user.correo_usu}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-medium text-on-surface-variant">Teléfono</span>
                   <span className="text-sm font-medium text-on-surface">{user.tel_usu || 'No registrado'}</span>
                </div>
             </div>
          </div>

          {/* Change Password */}
          <div className="space-y-3">
             <h4 className="label-sm text-on-surface-variant">Seguridad</h4>
             <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="space-y-1.5">
                   <label className="text-xs font-medium text-on-surface-variant">Contraseña Actual</label>
                   <input
                      type="password"
                      required
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="••••••••"
                   />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">Nueva Contraseña</label>
                  <input
                      type="password"
                      required
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">Confirmar Nueva</label>
                  <input
                      type="password"
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-sm font-medium focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="Repite la contraseña"
                      minLength={8}
                  />
                </div>

                <button
                   type="submit"
                   disabled={isChangingPassword}
                   className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                >
                   {isChangingPassword ? (
                      <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                       <span>Actualizar Contraseña</span>
                     </>
                   )}
                </button>
             </form>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface border-t border-outline-variant/30">
          <button
             onClick={onClose}
             className="w-full py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors rounded-xl hover:bg-surface-container-low"
          >
             Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
