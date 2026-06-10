import { useState, useEffect } from 'react';
import { authService } from '../../config/setup';
import { validatePassword } from '@/utils/validation';
import Loading from '../cargando';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    const urlCode = params.get('code');
    if (urlEmail && urlCode) { setEmail(urlEmail); setCode(urlCode); }
  }, []);

  if (!email || !code) {
    return (
      <div className="w-full max-w-sm p-8 bg-surface rounded-2xl border border-outline-variant/40 shadow-sm text-center">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 className="headline-sm text-on-surface mb-2">Error de validación</h2>
        <p className="body-md text-on-surface-variant mb-6">Faltan datos necesarios para acceder a esta página.</p>
        <a href="/recuperar-contrasena" className="inline-block bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-all">
          Volver a empezar
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setState('error'); setErrorMsg('Las contraseñas no coinciden.'); return;
    }
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setState('error'); setErrorMsg(validation.message); return;
    }
    setState('loading');
    try {
      await authService.resetPassword(email, code, newPassword);
      window.location.href = '/login/';
    } catch (error: unknown) {
      const err = error as Error;
      setState('error'); setErrorMsg(err.message || 'Error al restablecer');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-6">
        <h2 className="headline-lg text-on-surface mb-1">Nueva Contraseña</h2>
        <p className="body-md text-on-surface-variant">Ingresa tu nueva contraseña para la cuenta.</p>
      </div>

      {state === 'error' && (
        <div className="w-full max-w-sm mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2.5 bg-error-container/20 border border-error-container/50 text-on-error-container">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 bg-surface rounded-2xl border border-outline-variant/40 shadow-sm">

        <div className="mb-4">
          <label htmlFor="newPassword" className="block label-sm text-on-surface-variant mb-1.5 ml-1">Nueva Contraseña</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
              <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input type={showPassword ? 'text' : 'password'} id="newPassword" value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (state === 'error') setState('idle'); }}
              placeholder="••••••••" required minLength={6} disabled={state === 'loading'}
              className="w-full pl-10 pr-10 py-3 text-sm font-medium bg-surface-container-low border border-outline-variant/50 rounded-xl outline-none transition-all duration-200 focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/5 disabled:opacity-50 placeholder:text-on-surface-variant/30" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors p-1" tabIndex={-1}>
              <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={showPassword ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="confirmPassword" className="block label-sm text-on-surface-variant mb-1.5 ml-1">Confirmar Contraseña</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
              <svg fill="none" className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input type={showPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} disabled={state === 'loading'}
              className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-surface-container-low border border-outline-variant/50 rounded-xl outline-none transition-all duration-200 focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/5 disabled:opacity-50 placeholder:text-on-surface-variant/30" />
          </div>
        </div>

        <button type="submit" disabled={state === 'loading'}
          className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {state === 'loading' ? <><div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Restableciendo...</> : 'Restablecer Contraseña'}
        </button>

        <div className="text-center mt-5">
          <a href="/login/"
            className="inline-flex items-center gap-1.5 label-sm text-on-surface-variant hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </form>
      {state === 'loading' && <div><Loading message="Restableciendo..." /></div>}
    </div>
  );
}
