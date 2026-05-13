import React from 'react';
import type { User } from '@/models/User';

interface ProfileDrawerProps {
  isOpen: boolean;
  user: User;
  passwords: { current: string; new: string; confirm: string };
  isChangingPassword: boolean;
  onPasswordsChange: (passwords: { current: string; new: string; confirm: string }) => void;
  onSubmitPassword: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  user,
  passwords,
  isChangingPassword,
  onPasswordsChange,
  onSubmitPassword,
  onClose
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`fixed inset-0 z-99999 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`absolute top-0 right-0 h-full w-100 max-w-[calc(100vw-1rem)] bg-[#fafafc] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-[15px] font-bold text-gray-800">Mi Perfil</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-red-50 text-[#ec131e] flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">
              {getInitials(String(user.nom_usu))}
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-800 text-lg">{user.nom_usu}</h3>
              <p className="text-sm text-gray-400 capitalize">{user.rol_usu}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
             <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Información de contacto</h4>
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</span>
                   <span className="text-sm font-medium text-gray-700">{user.correo_usu}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Teléfono</span>
                   <span className="text-sm font-medium text-gray-700">{user.tel_usu || 'No registrado'}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-4">
             <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Seguridad</h4>
             <form onSubmit={onSubmitPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                   <label className="text-[12px] font-bold text-gray-600">Contraseña Actual</label>
                   <input 
                      type="password" 
                      required
                      value={passwords.current}
                      onChange={(e) => onPasswordsChange({...passwords, current: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-sm bg-white" 
                      placeholder="••••••••"
                   />
                </div>
                <div className="flex flex-col gap-1.5">
                   <label className="text-[12px] font-bold text-gray-600">Nueva Contraseña</label>
                   <input 
                      type="password" 
                      required
                      value={passwords.new}
                      onChange={(e) => onPasswordsChange({...passwords, new: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-sm bg-white" 
                      placeholder="Mínimo 8 caracteres"
                      minLength={8}
                   />
                </div>
                <div className="flex flex-col gap-1.5">
                   <label className="text-[12px] font-bold text-gray-600">Confirmar Nueva Contraseña</label>
                   <input 
                      type="password" 
                      required
                      value={passwords.confirm}
                      onChange={(e) => onPasswordsChange({...passwords, confirm: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-sm bg-white" 
                      placeholder="Repite la contraseña"
                      minLength={8}
                   />
                </div>
                <button 
                   type="submit"
                   disabled={isChangingPassword}
                   className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                   {isChangingPassword ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                       </svg>
                       <span>Actualizar Contraseña</span>
                     </>
                   )}
                </button>
             </form>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <button 
             onClick={onClose}
             className="w-full bg-white hover:bg-gray-50 text-gray-500 font-bold py-3.5 rounded-xl border border-gray-200 transition-all"
          >
             Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
