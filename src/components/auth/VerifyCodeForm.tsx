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
      <div className="text-center mb-6">
        <h2 className="headline-lg text-on-surface mb-1">Verificar Código</h2>
        <p className="body-md text-on-surface-variant">
          Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>
        </p>
      </div>

      {state === 'error' && (
        <div className="w-full max-w-sm mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2.5 bg-error-container/20 border border-error-container/50 text-on-error-container">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 bg-surface rounded-2xl border border-outline-variant/40 shadow-sm">

        <div className="mb-5">
          <label className="block label-sm text-on-surface-variant mb-3 text-center">
            Código de verificación
          </label>
          <div className="flex justify-center gap-2">
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
                style={{
                  width: '2.75rem', height: '3.25rem',
                  border: `2px solid ${codeDigits[index] ? 'var(--md-primary, #ec131e)' : 'var(--md-outline-variant, #d6c2bd)'}`,
                  borderRadius: '10px',
                  backgroundColor: codeDigits[index] ? 'var(--md-surface, #fffcf9)' : 'var(--md-surface-container-low, #fcf1ef)',
                  textAlign: 'center', fontSize: '1.25rem', fontWeight: 700,
                  color: 'var(--md-on-surface, #1f1a19)',
                  outline: 'none', transition: 'all 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--md-primary, #ec131e)'; e.target.style.backgroundColor = 'var(--md-surface, #fffcf9)'; e.target.style.boxShadow = '0 0 0 4px rgba(236,19,30,0.05)'; }}
                onBlur={(e) => { e.target.style.borderColor = codeDigits[index] ? 'var(--md-primary, #ec131e)' : 'var(--md-outline-variant, #d6c2bd)'; e.target.style.backgroundColor = codeDigits[index] ? 'var(--md-surface, #fffcf9)' : 'var(--md-surface-container-low, #fcf1ef)'; e.target.style.boxShadow = 'none'; }} />
            ))}
          </div>
        </div>

        <button type="submit" disabled={state === 'loading'}
          className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {state === 'loading' ? <><div style={{ width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Verificando...</> : 'Verificar Código'}
        </button>

        <div className="text-center mt-5">
          <a href="/recuperar-contrasena"
            className="inline-flex items-center gap-1.5 label-sm text-on-surface-variant hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a intentar
          </a>
        </div>
      </form>

      {state === 'loading' && <div><Loading message="Verificando código..." /></div>}
    </div>
  );
}
