import { useState, useEffect, useRef } from 'react';
import { authService } from '../../config/setup';
import Loading from '../cargando';

export default function VerifyCodeForm() {
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(''));
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    if (urlEmail) setEmail(urlEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = codeDigits.join('');
    if (!email || fullCode.length < 6) return;
    setState('loading');
    try {
      await authService.verifyResetCode(email, fullCode);
      window.location.href = `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(fullCode)}`;
    } catch (error: unknown) {
      const err = error as Error;
      setState('error');
      setErrorMsg(err.message || 'Código inválido o expirado');
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    if (!digit && value !== '') return;
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (state === 'error') setState('idle');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...codeDigits];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setCodeDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: '#1a1a1a', margin: 0 }}>
          Verificar Código
        </h2>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.5rem', color: '#6b6b6b' }}>
          Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>
        </p>
      </div>

      {state === 'error' && (
        <div style={{ width: '100%', maxWidth: '448px', marginBottom: '1rem', padding: '0.75rem 1.25rem', borderRadius: '16px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: '448px', padding: '2rem 2.5rem', backgroundColor: '#ffffff', borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', textAlign: 'center', color: '#6b6b6b' }}>
            Código de verificación
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {codeDigits.map((digit, index) => (
              <input key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text" maxLength={1} value={digit}
                autoFocus={index === 0}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                id={`code-${index}`}
                required
                style={{ width: '3rem', height: '3.5rem', border: `2px solid ${codeDigits[index] ? '#ec131e' : '#e2e8f0'}`, borderRadius: '12px', backgroundColor: codeDigits[index] ? '#fff' : '#f8fafc', textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, color: '#1a1a1a', outline: 'none', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#ec131e'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
                onBlur={(e) => { e.target.style.borderColor = codeDigits[index] ? '#ec131e' : '#e2e8f0'; e.target.style.backgroundColor = codeDigits[index] ? '#fff' : '#f8fafc'; e.target.style.boxShadow = 'none'; }} />
            ))}
          </div>
        </div>

        <button type="submit" disabled={state === 'loading'}
          style={{ width: '100%', border: 'none', padding: '1rem', fontSize: '0.6875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: state === 'loading' ? 'not-allowed' : 'pointer', borderRadius: '16px', color: '#ffffff', backgroundColor: '#ec131e', boxShadow: '0 4px 16px rgba(236,19,30,0.2)', opacity: state === 'loading' ? 0.7 : 1, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { if (!(e.target as HTMLButtonElement).disabled) { e.target.style.backgroundColor = '#d01019'; e.target.style.boxShadow = '0 6px 20px rgba(236,19,30,0.3)'; }}}
          onMouseLeave={(e) => { e.target.style.backgroundColor = '#ec131e'; e.target.style.boxShadow = '0 4px 16px rgba(236,19,30,0.2)'; }}>
          {state === 'loading' ? <><div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Verificando...</> : 'Verificar Código'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <a href="/recuperar-contrasena"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#6b6b6b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a intentar
          </a>
        </div>
      </form>

      {state === 'loading' && <div><Loading message="Verificando código..." /></div>}
    </div>
  );
}
