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
        <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: '#1a1a1a', margin: 0 }}>
          Recuperar Contraseña
        </h2>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.5rem', color: '#6b6b6b' }}>
          Ingresa tu correo y te enviaremos un código de verificación.
        </p>
      </div>

      {state === 'error' && (
        <div style={{ width: '100%', maxWidth: '448px', marginBottom: '1rem', padding: '0.75rem 1.25rem', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span style={{ fontSize: '1.125rem' }}>⚠️</span>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: '448px', padding: '2rem 2.5rem', backgroundColor: '#ffffff', borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="email" style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', marginLeft: '0.25rem', color: '#6b6b6b' }}>
            Correo Electrónico
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg fill="none" style={{ width: '1.25rem', height: '1.25rem' }} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input type="email" id="email" value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
              placeholder="nombre@ejemplo.com"
              required
              style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', fontSize: '0.875rem', fontWeight: 700, outline: 'none', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#1a1a1a', transition: 'all 0.2s', boxSizing: 'border-box' }}
              onFocus={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.borderColor = 'rgba(236,19,30,0.3)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
          </div>
        </div>

        <button type="submit" disabled={state === 'loading'}
          style={{ width: '100%', border: 'none', padding: '1rem', fontSize: '0.6875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: state === 'loading' ? 'not-allowed' : 'pointer', borderRadius: '16px', color: '#ffffff', backgroundColor: '#ec131e', boxShadow: '0 4px 16px rgba(236,19,30,0.2)', opacity: state === 'loading' ? 0.7 : 1, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (!(e.target as HTMLButtonElement).disabled) { e.target.style.backgroundColor = '#d01019'; e.target.style.boxShadow = '0 6px 20px rgba(236,19,30,0.3)'; }}}
          onMouseLeave={(e) => { e.target.style.backgroundColor = '#ec131e'; e.target.style.boxShadow = '0 4px 16px rgba(236,19,30,0.2)'; }}>
          {state === 'loading' ? <><div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Enviando...</> : 'Enviar Código'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <a href="/login/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#6b6b6b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </a>
        </div>
      </form>

      {state === 'loading' && <div><Loading message="Enviando..." /></div>}
    </div>
  );
}
