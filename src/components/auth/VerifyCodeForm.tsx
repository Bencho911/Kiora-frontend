import { useState, useEffect } from 'react';
import { authService, alertService } from '../../config/setup';
import Loading from '../cargando';

export default function VerifyCodeForm() {
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    } else {
      alertService.showError('Error', 'Falta el correo electrónico para la verificación.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = codeDigits.join('');
    if (!email || fullCode.length < 6) return;

    setIsLoading(true);

    try {
      await authService.verifyResetCode(email, fullCode);

      // Redirigir a la página de restablecimiento final
      window.location.href = `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(fullCode)}`;
    } catch (error: unknown) {
      const err = error as Error;
      alertService.showError('Error', err.message || 'Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-105 p-8 rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Verificación de Código</h2>
          <p className="text-[0.95rem] text-[#64748b]">Ingresa el código de 6 dígitos enviado a <strong>{email}</strong></p>
        </div>

        <div className="mb-8">
          <label className="block font-semibold text-[0.85rem] text-[#374151] mb-3 text-center">
            Código de verificación
          </label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {codeDigits.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                autoFocus={index === 0}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (!val && e.target.value !== '') return;
                  
                  const newDigits = [...codeDigits];
                  newDigits[index] = val;
                  setCodeDigits(newDigits);
                  
                  // Auto-focus next input
                  if (val && index < 5) {
                    const nextInput = document.getElementById(`code-${index + 1}`);
                    if (nextInput) nextInput.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digit && index > 0) {
                    const prevInput = document.getElementById(`code-${index - 1}`);
                    if (prevInput) prevInput.focus();
                  } else if (e.key === 'ArrowLeft' && index > 0) {
                    const prevInput = document.getElementById(`code-${index - 1}`);
                    if (prevInput) prevInput.focus();
                  } else if (e.key === 'ArrowRight' && index < 5) {
                    const nextInput = document.getElementById(`code-${index + 1}`);
                    if (nextInput) nextInput.focus();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                  if (pastedData) {
                    const newDigits = [...codeDigits];
                    for (let i = 0; i < pastedData.length; i++) {
                      if (index + i < 6) newDigits[index + i] = pastedData[i];
                    }
                    setCodeDigits(newDigits);
                    const focusIndex = Math.min(index + pastedData.length, 5);
                    const nextInput = document.getElementById(`code-${focusIndex}`);
                    if (nextInput) nextInput.focus();
                  }
                }}
                id={`code-${index}`}
                className="w-12 h-14 border border-gray-300 rounded-xl bg-white text-center text-xl font-black text-[#334155] focus:border-[#ec131e] focus:ring-[3px] focus:ring-red-100 transition-all outline-none"
                placeholder="-"
                required
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ec131e] hover:bg-[#d0111a] text-white border-none rounded-lg py-2.5 text-[1rem] font-semibold cursor-pointer transition-colors duration-200 shadow-[0_2px_4px_rgba(237,19,30,0.15)] disabled:opacity-70 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Verificando...' : 'Verificar Código'}
        </button>

        <div className="text-center">
          <a href="/recuperar-contrasena" className="inline-flex items-center gap-1 text-[#64748b] hover:text-[#334155] font-medium text-[0.9rem] no-underline transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a intentar
          </a>
        </div>
      </form>

      {isLoading && (
        <div>
          <Loading message="Verificando código..." />
        </div>
      )}
    </>
  );
}
