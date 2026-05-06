import React, { useState } from 'react';
import type { RegisterUserDto } from '@/services/UserService';
import { validatePassword } from '@/utils/validation';

interface UserDrawerProps {
  isOpen: boolean;
  isEditing: boolean;
  isRegistering: boolean;
  userData: RegisterUserDto;
  onUserDataChange: (data: RegisterUserDto) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({
  isOpen,
  isEditing,
  isRegistering,
  userData,
  onUserDataChange,
  onSubmit,
  onClose
}) => {
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { phone?: string; password?: string } = {};

    // Validate phone
    const phone = userData.tel_usu || '';
    if (phone.length !== 7 && phone.length !== 10) {
      newErrors.phone = 'El teléfono debe ser fijo (7 dígitos) o celular (10 dígitos).';
    }

    // Validate password (only if not editing, or if a password is provided)
    if (!isEditing && userData.password) {
      const validation = validatePassword(userData.password);
      if (!validation.isValid) {
        newErrors.password = validation.message;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(e);
  };

  return (
    <div className={`fixed inset-0 z-99999 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`absolute top-0 right-0 h-full w-100 max-w-[calc(100vw-1rem)] bg-[#fafafc] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-[15px] font-bold text-gray-800">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <form onSubmit={handleLocalSubmit} id="userForm" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={userData.nom_usu}
                onChange={(e) => onUserDataChange({...userData, nom_usu: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300" 
                placeholder="Ej. Juan Pérez" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={userData.correo_usu}
                onChange={(e) => onUserDataChange({...userData, correo_usu: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white placeholder:text-gray-300" 
                placeholder="juan@gmail.com" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Número de Teléfono</label>
              <input 
                type="tel" 
                inputMode="numeric"
                value={userData.tel_usu}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onUserDataChange({...userData, tel_usu: val});
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-4 transition-all text-[0.95rem] bg-white placeholder:text-gray-300 ${
                  errors.phone 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-50' 
                    : 'border-gray-200 focus:border-[#ec131e] focus:ring-red-50'
                }`}
                placeholder="3000000000 o 1234567" 
              />
              {errors.phone && <span className="text-[11px] font-bold text-red-500 mt-0.5">{errors.phone}</span>}
            </div>

            {!isEditing && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-600">Contraseña</label>
                <input 
                  type="password" 
                  required
                  value={userData.password || ''}
                  onChange={(e) => {
                    onUserDataChange({...userData, password: e.target.value});
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-4 transition-all text-[0.95rem] bg-white placeholder:text-gray-300 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-50' 
                      : 'border-gray-200 focus:border-[#ec131e] focus:ring-red-50'
                  }`}
                  placeholder="Ingresa clave segura"
                  minLength={8}
                  autoComplete="new-password"
                />
                {errors.password ? (
                  <span className="text-[11px] font-bold text-red-500 mt-0.5">{errors.password}</span>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">Debe incluir al menos una mayúscula, un número y un signo de puntuación.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-600">Seleccionar Rol</label>
              <div className="relative">
                <select 
                  required
                  value={userData.rol_usu}
                  onChange={(e) => onUserDataChange({...userData, rol_usu: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#ec131e] focus:ring-4 focus:ring-red-50 transition-all text-[0.95rem] bg-white text-gray-700 appearance-none cursor-pointer" 
                >
                  <option value="" disabled>Selecciona un rol</option>
                  <option value="cliente">Operario</option>
                  <option value="admin">Administrador</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
          <button 
             form="userForm" 
             type="submit" 
             disabled={isRegistering}
             className="w-full bg-[#ec131e] hover:bg-[#d01019] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(236,19,30,0.39)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isRegistering ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
              </>
            )}
          </button>
          <button 
             type="button" 
             disabled={isRegistering}
             onClick={onClose} 
             className="w-full bg-white hover:bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl border border-gray-200 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
