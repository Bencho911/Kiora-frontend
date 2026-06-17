import React, { useEffect } from 'react';

interface SaleSuccessProps {
  isVisible: boolean;
  total: number;
  paymentMethod: string;
  onDismiss: () => void;
}

export const SaleSuccessOverlay: React.FC<SaleSuccessProps> = ({ isVisible, total, paymentMethod, onDismiss }) => {
  useEffect(() => {
    if (isVisible) {
      // Play beep sound using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch beep
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); // Fade in quickly
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3); // Fade out
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        console.warn('Audio play failed', e);
      }

      const timer = setTimeout(() => {
        onDismiss();
      }, 2500); // 2.5 seconds timeout
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-primary/10">
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-[dash_0.5s_ease-out_forwards]" strokeDasharray="50" strokeDashoffset="50" />
          </svg>
          {/* Confetti / pulse effect around the circle */}
          <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
        </div>
        
        <h2 className="text-4xl font-bold tracking-tight text-on-surface mb-2">
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}
        </h2>
        
        <div className="flex items-center gap-2 px-4 py-2 mt-4 rounded-full bg-surface-container-high border border-outline-variant/30">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {paymentMethod === 'efectivo' ? 'payments' : paymentMethod === 'digital' ? 'qr_code' : 'account_balance'}
          </span>
          <span className="text-sm font-medium text-on-surface-variant capitalize">
            Pago en {paymentMethod === 'digital' ? 'QR' : paymentMethod}
          </span>
        </div>
      </div>
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};
