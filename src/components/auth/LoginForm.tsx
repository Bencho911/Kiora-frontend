import { useState } from 'react';
import { authService, alertService } from '../../config/setup';
import Loading from '../cargando';
import * as Sentry from "@sentry/astro";

type LoginState = 'idle' | 'loading' | 'error' | 'rate-limited' | 'locked';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<LoginState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getStatusMessage = () => {
    switch (state) {
      case 'loading': return { text: 'Verificando credenciales...', icon: 'spinner' };
      case 'error': return { text: errorMsg, icon: 'error' };
      case 'rate-limited': return { text: 'Demasiados intentos. Intenta en 15 minutos.', icon: 'clock' };
      case 'locked': return { text: 'Cuenta bloqueada. Contacta al administrador.', icon: 'lock' };
      default: return null;
    }
  };

  const status = getStatusMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setState('error');
      setErrorMsg('Ingresa tu correo y contraseña.');
      return;
    }

    Sentry.captureMessage(`Intento de login para: ${email}`, "info");
    setState('loading');
    setErrorMsg('');

    try {
      await authService.login({ correo_usu: email, password });
      window.location.href = '/panel';
    } catch (error: unknown) {
      const err = error as Error;
      const msg = err.message || 'Error al iniciar sesión';

      if (msg.toLowerCase().includes('demasiados intentos') || msg.toLowerCase().includes('rate limit')) {
        setState('rate-limited');
      } else if (msg.toLowerCase().includes('bloqueada')) {
        setState('locked');
      } else {
        setState('error');
        // Extraer número de intento del mensaje del backend: "Credenciales incorrectas. Intento 3 de 5."
        const attemptMatch = msg.match(/Intento\s+(\d+)\s+de\s+(\d+)/i);
        if (attemptMatch) {
          const current = attemptMatch[1];
          const max = attemptMatch[2];
          setErrorMsg(`Credenciales incorrectas. Intento ${current} de ${max}.`);
        } else {
          setErrorMsg(msg);
        }
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="headline-lg text-on-surface mb-1">Bienvenido de nuevo</h2>
        <p className="body-md text-on-surface-variant">Ingresa tus credenciales para acceder al panel</p>
      </div>

      {/* Status banner */}
      {status && (
        <div className={`w-full max-w-sm mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 ${
          state === 'error' || state === 'rate-limited' || state === 'locked'
            ? 'bg-error-container/20 border border-error-container/50 text-on-error-container'
            : 'bg-tertiary-fixed/20 border border-tertiary-fixed/50 text-tertiary'
        }`}>
          <span className="text-base shrink-0">
            {state === 'locked' ? '🔒' : state === 'rate-limited' ? '⏱' : state === 'error' ? '⚠️' : '✓'}
          </span>
          <div>
            <span>{status.text}</span>
            {state === 'error' && errorMsg.match(/Intento\s+(\d+)\s+de\s+(\d+)/i) && (
              <div className="mt-1.5 w-full bg-error-container/40 rounded-full h-1.5">
                <div
                  className="bg-error h-1.5 rounded-full transition-all"
                  style={{ width: `${(parseInt(errorMsg.match(/Intento\s+(\d+)\s+de\s+(\d+)/i)![1]) / parseInt(errorMsg.match(/Intento\s+(\d+)\s+de\s+(\d+)/i)![2])) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 bg-surface rounded-2xl border border-outline-variant/40 shadow-sm"
      >
        {/* Email field */}
        <div className="mb-4">
          <label htmlFor="email"
            className="block label-sm text-on-surface-variant mb-1.5 ml-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
              <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state !== 'idle' && state !== 'loading') setState('idle'); }}
              placeholder="nombre@ejemplo.com"
              disabled={state === 'locked'}
              className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-surface-container-low border border-outline-variant/50 rounded-xl outline-none transition-all duration-200 focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/5 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-on-surface-variant/30"
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label htmlFor="password" className="block label-sm text-on-surface-variant">
              Contraseña
            </label>
            <a href="/recuperar-contrasena"
              className="text-xs font-medium text-primary hover:underline">
              ¿Olvidaste tu clave?
            </a>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
              <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (state !== 'idle' && state !== 'loading') setState('idle'); }}
              placeholder="••••••••••••"
              disabled={state === 'locked'}
              className="w-full pl-10 pr-10 py-3 text-sm font-medium bg-surface-container-low border border-outline-variant/50 rounded-xl outline-none transition-all duration-200 focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/5 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-on-surface-variant/30"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={state === 'loading' || state === 'locked'}
          className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {state === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Verificando...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      {/* Support */}
      <div className="mt-8 text-center flex flex-col items-center gap-2">
        <p className="label-sm text-on-surface-variant/60">¿Necesitas soporte?</p>
        <a href="mailto:KiosKiora@gmail.com"
          className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
          soporte@kiorapp.com
        </a>
      </div>

      {state === 'loading' && (
        <div><Loading message="Iniciando sesión..." /></div>
      )}
    </div>
  );
}
