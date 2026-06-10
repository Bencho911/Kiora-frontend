import { useState } from 'react';
import { authService } from '../../config/setup';
import Loading from '../cargando';

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setState('loading');
    try {
      await authService.forgotPassword(email);
      setState('success');
      window.location.href = `/verificar-codigo?email=${encodeURIComponent(email)}`;
    } catch (error: unknown) {
      const err = error as Error;
      setState('error');
      setErrorMsg(err.message || 'Error al enviar el código');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 className="headline-lg text-on-surface mb-1">Recuperar Contraseña</h2>
        <p className="body-md text-on-surface-variant">Ingresa tu correo y te enviaremos un código de verificación.</p>
      </div>

      {state === 'error' && (
        <div className="w-full max-w-sm mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2.5 bg-error-container/20 border border-error-container/50 text-on-error-container">
          <span style={{ fontSize: '1.125rem' }}>⚠️</span>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 bg-surface rounded-2xl border border-outline-variant/40 shadow-sm">

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="email" className="block label-sm text-on-surface-variant mb-1.5 ml-1">
            Correo Electrónico
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--md-on-surface-variant, #514440)', opacity: 0.4 }}>
              <svg fill="none" style={{ width: '1rem', height: '1rem' }} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input type="email" id="email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
              placeholder="nombre@ejemplo.com"
              required
              className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-surface-container-low border border-outline-variant/50 rounded-xl outline-none transition-all duration-200 focus:border-primary/30 focus:bg-surface focus:ring-4 focus:ring-primary/5 placeholder:text-on-surface-variant/30"
              onFocus={(e) => { e.target.style.backgroundColor = 'var(--md-surface, #fffcf9)'; e.target.style.borderColor = 'rgba(236,19,30,0.3)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = 'var(--md-surface-container-low, #fcf1ef)'; e.target.style.borderColor = 'var(--md-outline-variant, #d6c2bd)'; e.target.style.boxShadow = 'none'; }} />
          </div>
        </div>

        <button type="submit" disabled={state === 'loading'}
          className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {state === 'loading' ? <><div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Enviando...</> : 'Enviar Código'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <a href="/login/"
            className="inline-flex items-center gap-1.5 label-sm text-on-surface-variant hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </form>

      {state === 'loading' && <div><Loading message="Enviando..." /></div>}
    </div>
  );
}
