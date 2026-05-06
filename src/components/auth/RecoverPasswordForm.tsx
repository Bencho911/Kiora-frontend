import { useState } from 'react';
import { authService, alertService } from '../../config/setup';
import Loading from '../cargando';

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);

      await alertService.showSuccess('Código enviado', 'Revisa tu correo para obtener el código de verificación.');

      // Redirigir a la página de verificación de código
      window.location.href = `/verificar-codigo?email=${encodeURIComponent(email)}`;
    } catch (error: unknown) {
      const err = error as Error;
      alertService.showError('Error', err.message || 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-105 p-8 rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Restablecimiento de contraseña</h2>
          <p className="text-[0.95rem] text-[#64748b]">Ingresa tu correo para recibir un enlace de recuperación.</p>
        </div>

        <div className="mb-7">
          <label
            htmlFor="email"
            className="block font-semibold text-[0.85rem] text-[#374151] mb-2"
          >
            Correo electrónico
          </label>
          <div className="relative flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden transition-all duration-200 focus-within:border-[#9ca3af] focus-within:ring-[3px] focus-within:ring-gray-400/10">
            <div className="pl-3.5 pr-2 text-gray-400 flex items-center">
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <input
              type="email"
              id="email"
              className="flex-1 border-none bg-transparent py-2.5 text-[0.95rem] text-[#334155] outline-none w-full placeholder-gray-400"
              placeholder="KiosKiora@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ec131e] hover:bg-[#d0111a] text-white border-none rounded-lg py-2.5 text-[1rem] font-semibold cursor-pointer transition-colors duration-200 shadow-[0_2px_4px_rgba(237,19,30,0.15)] disabled:opacity-70 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace'}
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

      {isLoading && (
        <div>
          <Loading message="Enviando..." />
        </div>
      )}
    </>
  );
}
