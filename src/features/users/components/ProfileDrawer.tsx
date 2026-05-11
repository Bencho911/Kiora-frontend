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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Configuración de Perfil</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10">
          {/* Header del Perfil */}
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="w-24 h-24 rounded-[2rem] bg-red-50 text-kiora-red flex items-center justify-center text-3xl font-black border-4 border-white shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
              {getInitials(String(user.nom_usu))}
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-xl">{user.nom_usu}</h3>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {user.rol_usu}
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Datos de Contacto</h4>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo Corporativo</span>
                   <span className="text-sm font-bold text-slate-700">{user.correo_usu}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Línea Telefónica</span>
                   <span className="text-sm font-bold text-slate-700">{user.tel_usu || 'No registrado'}</span>
                </div>
             </div>
          </div>

          {/* Cambio de Contraseña */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Seguridad de la Cuenta</h4>
             <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Contraseña Actual</label>
                   <input 
                      type="password" 
                      required
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-kiora-red focus:outline-none focus:ring-4 focus:ring-kiora-red/5 transition-all text-sm font-medium bg-white" 
                      placeholder="••••••••"
                   />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nueva Contraseña</label>
                    <input 
                        type="password" 
                        required
                        value={passwords.new}
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-kiora-red focus:outline-none focus:ring-4 focus:ring-kiora-red/5 transition-all text-sm font-medium bg-white" 
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Confirmar Nueva</label>
                    <input 
                        type="password" 
                        required
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-kiora-red focus:outline-none focus:ring-4 focus:ring-kiora-red/5 transition-all text-sm font-medium bg-white" 
                        placeholder="Repite la contraseña"
                        minLength={8}
                    />
                  </div>
                </div>
                
                <button 
                   type="submit"
                   disabled={isChangingPassword}
                   className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 text-[10px] uppercase tracking-widest"
                >
                   {isChangingPassword ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                       <span>Actualizar Credenciales</span>
                     </>
                   )}
                </button>
             </form>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50">
          <button 
             onClick={onClose}
             className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
          >
             Cerrar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};
