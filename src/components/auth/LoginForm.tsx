import { useState } from 'react';
import { authService, alertService } from '../../config/setup';
import Loading from '../cargando';
import * as Sentry from "@sentry/astro";

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

    // Evento de prueba para Sentry
    Sentry.captureMessage(`Intento de login para: ${email}`, "info");

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
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Bienvenido de nuevo</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Ingresa tus credenciales para acceder al panel</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-xl w-full max-w-md p-6 sm:p-10 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-kiora-red/20 to-transparent" />
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 ml-1"
          >
            Correo Electrónico
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-kiora-red transition-colors">
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <input
              type="email"
              id="email"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all focus:bg-white focus:border-kiora-red/30 focus:ring-4 focus:ring-kiora-red/5 placeholder:text-slate-300 placeholder:font-medium"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 ml-1">
            <label
              htmlFor="password"
              className="block font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Contraseña
            </label>
            <a href="/recuperar-contrasena" className="text-kiora-red font-black text-[9px] uppercase tracking-wider hover:underline">
              ¿Olvidaste tu clave?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-kiora-red transition-colors">
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              type="password"
              id="password"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all focus:bg-white focus:border-kiora-red/30 focus:ring-4 focus:ring-kiora-red/5 placeholder:text-slate-300 placeholder:font-medium"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-kiora-red to-[#d01019] hover:to-kiora-red text-white border-none rounded-[1.25rem] py-4 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all duration-300 shadow-xl shadow-kiora-red/20 hover:shadow-kiora-red/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Verificando...
            </>
          ) : (
            'Entrar al Sistema'
          )}
        </button>
      </form>

      <div className="mt-8 text-center bg-transparent border-none shadow-none flex flex-col items-center gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          ¿Necesitas soporte?
        </p>
        <a href="mailto:KiosKiora@gmail.com" className="text-sm font-black text-slate-700 hover:text-kiora-red transition-colors">
          soporte@kiorapp.com
        </a>
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
