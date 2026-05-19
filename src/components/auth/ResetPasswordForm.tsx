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
      <div style={{ width: '100%', maxWidth: '448px', padding: '2rem 2.5rem', backgroundColor: '#ffffff', borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1a1a1a', marginBottom: '0.5rem' }}>Error de validación</h2>
        <p style={{ color: '#6b6b6b', marginBottom: '1.5rem' }}>Faltan datos necesarios para acceder a esta página.</p>
        <a href="/recuperar-contrasena"
          style={{ display: 'inline-block', backgroundColor: '#ec131e', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '16px', fontWeight: 700, textDecoration: 'none', transition: 'background-color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d01019'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ec131e'}>
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

  const inputStyle: React.CSSProperties = {
    width: '100%', paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '0.875rem', paddingBottom: '0.875rem',
    fontSize: '0.875rem', fontWeight: 700, outline: 'none', backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: '16px', color: '#1a1a1a', boxSizing: 'border-box', transition: 'all 0.2s'
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: '#1a1a1a', margin: 0 }}>
          Nueva Contraseña
        </h2>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.5rem', color: '#6b6b6b' }}>
          Ingresa tu nueva contraseña para la cuenta.
        </p>
      </div>

      {state === 'error' && (
        <div style={{ width: '100%', maxWidth: '448px', marginBottom: '1rem', padding: '0.75rem 1.25rem', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '448px', padding: '2rem 2.5rem', backgroundColor: '#ffffff', borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)' }}>

        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="newPassword" style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', marginLeft: '0.25rem', color: '#6b6b6b' }}>Nueva Contraseña</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg fill="none" style={{ width: '1.25rem', height: '1.25rem' }} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input type={showPassword ? 'text' : 'password'} id="newPassword" value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (state === 'error') setState('idle'); }}
              placeholder="••••••••" required minLength={6} disabled={state === 'loading'}
              style={inputStyle}
              onFocus={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.borderColor = 'rgba(236,19,30,0.3)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', marginLeft: '0.25rem', color: '#6b6b6b' }}>Confirmar Contraseña</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg fill="none" style={{ width: '1.25rem', height: '1.25rem' }} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input type={showPassword ? 'text' : 'password'} id="confirmPassword" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} disabled={state === 'loading'}
              style={inputStyle}
              onFocus={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.borderColor = 'rgba(236,19,30,0.3)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
          </div>
        </div>

        <button type="submit" disabled={state === 'loading'}
          style={{ width: '100%', border: 'none', padding: '1rem', fontSize: '0.6875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: state === 'loading' ? 'not-allowed' : 'pointer', borderRadius: '16px', color: '#ffffff', backgroundColor: '#ec131e', boxShadow: '0 4px 16px rgba(236,19,30,0.2)', opacity: state === 'loading' ? 0.7 : 1, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (!(e.target as HTMLButtonElement).disabled) { e.target.style.backgroundColor = '#d01019'; e.target.style.boxShadow = '0 6px 20px rgba(236,19,30,0.3)'; }}}
          onMouseLeave={(e) => { e.target.style.backgroundColor = '#ec131e'; e.target.style.boxShadow = '0 4px 16px rgba(236,19,30,0.2)'; }}>
          {state === 'loading' ? <><div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Restableciendo...</> : 'Restablecer Contraseña'}
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
      {state === 'loading' && <div><Loading message="Restableciendo..." /></div>}
    </div>
  );
}
