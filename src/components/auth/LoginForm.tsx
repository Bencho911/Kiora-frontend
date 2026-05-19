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
        setErrorMsg(msg);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-tight leading-none"
          style={{ color: '#1a1a1a' }}>
          Bienvenido de nuevo
        </h2>
        <p className="text-sm font-medium mt-2" style={{ color: '#6b6b6b' }}>
          Ingresa tus credenciales para acceder al panel
        </p>
      </div>

      {/* Status banner */}
      {status && (
        <div className="w-full max-w-md mb-4 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            backgroundColor: state === 'error' || state === 'rate-limited' || state === 'locked'
              ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${state === 'error' || state === 'rate-limited' || state === 'locked' ? '#fecaca' : '#bbf7d0'}`,
            color: state === 'error' || state === 'rate-limited' || state === 'locked' ? '#991b1b' : '#166534',
          }}>
          <span className="text-lg">
            {state === 'locked' ? '🔒' : state === 'rate-limited' ? '⏱' : state === 'error' ? '⚠️' : '✓'}
          </span>
          {status.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 sm:p-10"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '40px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
        }}
      >
        {/* Email field */}
        <div className="mb-5">
          <label htmlFor="email"
            className="block text-[0.625rem] font-black uppercase tracking-[0.1em] mb-2 ml-1"
            style={{ color: '#6b6b6b' }}>
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
              style={{ color: '#9ca3af' }}>
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state !== 'idle' && state !== 'loading') setState('idle'); }}
              placeholder="nombre@ejemplo.com"
              disabled={state === 'locked'}
              className="w-full pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                color: '#1a1a1a',
              }}
              onFocus={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.borderColor = 'rgba(236,19,30,0.3)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 ml-1">
            <label htmlFor="password"
              className="block text-[0.625rem] font-black uppercase tracking-[0.1em]"
              style={{ color: '#6b6b6b' }}>
              Contraseña
            </label>
            <a href="/recuperar-contrasena"
              className="text-[0.625rem] font-black uppercase tracking-wider hover:underline"
              style={{ color: '#ec131e' }}>
              ¿Olvidaste tu clave?
            </a>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
              style={{ color: '#9ca3af' }}>
              <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (state !== 'idle' && state !== 'loading') setState('idle'); }}
              placeholder="••••••••••••"
              disabled={state === 'locked'}
              className="w-full pl-12 pr-12 py-3.5 text-sm font-bold outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                color: '#1a1a1a',
              }}
              onFocus={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.borderColor = 'rgba(236,19,30,0.3)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              required
            />
            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg fill="none" className="w-5 h-5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={state === 'loading' || state === 'locked'}
          className="w-full border-none py-4 text-[0.6875rem] font-black uppercase tracking-[0.2em] cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{
            backgroundColor: '#ec131e',
            color: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(236,19,30,0.2)',
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#d01019'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(236,19,30,0.3)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ec131e'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(236,19,30,0.2)'; }}
        >
          {state === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verificando...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      {/* Support */}
      <div className="mt-8 text-center flex flex-col items-center gap-2">
        <p className="text-[0.625rem] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>
          ¿Necesitas soporte?
        </p>
        <a href="mailto:KiosKiora@gmail.com"
          className="text-sm font-black transition-colors"
          style={{ color: '#6b6b6b' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ec131e'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b6b6b'}>
          soporte@kiorapp.com
        </a>
      </div>

      {/* Loading overlay */}
      {state === 'loading' && (
        <div>
          <Loading message="Iniciando sesión..." />
        </div>
      )}
    </div>
  );
}
