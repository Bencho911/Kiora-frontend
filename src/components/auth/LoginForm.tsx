import { useState } from 'react';
import { authService, alertService } from '../../config/setup';
import Loading from '../cargando'; // Importamos el componente de carga existente

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alertService.showError('Campos incompletos', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.login({ correo_usu: email, password });
      window.location.href = '/panel';
    } catch (error: unknown) {
      const err = error as Error;
      const errorMsg = err.message || 'Error al iniciar sesión';

      if (errorMsg.includes('bloqueada')) {
        alertService.showError('Cuenta bloqueada', errorMsg);
      } else {
        alertService.showToast('warning', errorMsg, 4000);
      }
      setIsLoading(false); // Solo desactivar el cargador en error (en éxito, se navegará)
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-[0.95rem] text-[#64748b] m-0 mb-8 font-medium">
        Bienvenido de nuevo. Por favor, ingresa tus datos.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-105 p-8 rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <div className="mb-5">
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
              autoComplete="email"
            />
          </div>
        </div>

        <div className="mb-7">
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="password"
              className="block font-semibold text-[0.85rem] text-[#374151]"
            >
              Contraseña
            </label>
            <a href="/recuperar-contrasena" className="text-[#ec131e] font-semibold text-[0.8rem] no-underline hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden transition-all duration-200 focus-within:border-[#9ca3af] focus-within:ring-[3px] focus-within:ring-gray-400/10">
            <div className="pl-3.5 pr-2 text-gray-400 flex items-center">
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              type="password"
              id="password"
              className="flex-1 border-none bg-transparent py-2.5 text-[0.95rem] text-[#334155] outline-none w-full placeholder-gray-400"
              placeholder="Escribe tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ec131e] hover:bg-[#d0111a] text-white border-none rounded-lg py-2.5 text-[1rem] font-semibold cursor-pointer transition-colors duration-200 shadow-[0_2px_4px_rgba(237,19,30,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-8 text-center bg-transparent border-none shadow-none flex flex-col items-center">
        <p className="text-[0.9rem] font-medium text-gray-500">
          ¿Necesitas contactarte con nosotros?<span className="text-[#ec131e] font-bold"> KiosKiora@gmail.com</span>
        </p>
      </div>

      <div className="mt-6 w-full px-[10%] sm:px-[15%] text-left">
        <span className="text-[#797676] text-[0.85rem] font-medium tracking-wide">Kiora | Sistema para Kioskos</span>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div>
          <Loading message="Iniciando sesión..." />
        </div>
      )}
    </div>
  );
}
