import { useState, useEffect } from 'react';
import { authService, alertService } from '../../config/setup';
import Loading from '../cargando';
import { validatePassword } from '@/utils/validation';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extraer email y code de la URL: ?email=...&code=...
    const searchParams = new URLSearchParams(window.location.search);
    const urlEmail = searchParams.get('email');
    const urlCode = searchParams.get('code');
    
    if (urlEmail && urlCode) {
      setEmail(urlEmail);
      setCode(urlCode);
    } else {
      alertService.showError(
        'Datos insuficientes',
        'Faltan el correo o el código de verificación en la URL.'
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !code) {
      alertService.showError('Error', 'Faltan datos para procesar el restablecimiento.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alertService.showError('Error', 'Las contraseñas no coinciden, por favor verifica.');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      alertService.showError('Contraseña débil', validation.message);
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(email, code, newPassword);

      await alertService.showSuccess(
        '¡Éxito!',
        'Tu contraseña ha sido restablecida exitosamente.'
      );

      // Redirigir al inicio de sesión luego del éxito
      window.location.href = '/login/';
    } catch (error: unknown) {
      const err = error as Error;
      alertService.showError('Error', err.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !code) {
    return (
      <div className="bg-white w-full max-w-105 p-8 rounded-xl border border-red-100 shadow-sm text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error de validación</h2>
        <p className="text-gray-600 mb-6">No tienes los datos necesarios para acceder a esta página (correo o código).</p>
        <a href="/recuperar-contrasena" className="inline-block bg-[#ec131e] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#d0111a] transition-colors no-underline">
          Volver a empezar
        </a>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-105 p-8 rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Crear Nueva Contraseña</h2>
          <p className="text-[0.95rem] text-[#64748b]">Ingresa tu nueva contraseña para la cuenta.</p>
        </div>

        <div className="mb-5">
          <label
            htmlFor="newPassword"
            className="block font-semibold text-[0.85rem] text-[#374151] mb-2"
          >
            Nueva Contraseña
          </label>
          <div className="relative flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden transition-all duration-200 focus-within:border-[#9ca3af] focus-within:ring-[3px] focus-within:ring-gray-400/10">
            <div className="pl-3.5 pr-2 text-gray-400 flex items-center">
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              type="password"
              id="newPassword"
              className="flex-1 border-none bg-transparent py-2.5 text-[0.95rem] text-[#334155] outline-none w-full placeholder-gray-400"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="block font-semibold text-[0.85rem] text-[#374151] mb-2"
          >
            Confirmar Contraseña
          </label>
          <div className="relative flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden transition-all duration-200 focus-within:border-[#9ca3af] focus-within:ring-[3px] focus-within:ring-gray-400/10">
            <div className="pl-3.5 pr-2 text-gray-400 flex items-center">
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              type="password"
              id="confirmPassword"
              className="flex-1 border-none bg-transparent py-2.5 text-[0.95rem] text-[#334155] outline-none w-full placeholder-gray-400"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ec131e] hover:bg-[#d0111a] text-white border-none rounded-lg py-2.5 text-[1rem] font-semibold cursor-pointer transition-colors duration-200 shadow-[0_2px_4px_rgba(237,19,30,0.15)] disabled:opacity-70 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </button>

        <div className="text-center">
          <a href="/login/" className="inline-flex items-center gap-1 text-[#64748b] hover:text-[#334155] font-medium text-[0.9rem] no-underline transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </form>

      {/* Loading Overlay */}
      {isLoading && (
        <div>
          <Loading message="Restableciendo..." />
        </div>
      )}
    </>
  );
}
