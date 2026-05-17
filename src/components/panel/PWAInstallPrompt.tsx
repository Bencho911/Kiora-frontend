import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar si ya fue descartada
    const dismissed = sessionStorage.getItem('kiora-pwa-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar banner después de 3s para no ser intrusivo
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('kiora-pwa-dismissed', '1');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-[#3E2723] shadow-2xl ring-1 ring-white/10">
        {/* Decorative glow */}
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#ec131e]/20 blur-2xl" />
        <div className="relative flex items-center gap-4 p-4">
          <div className="shrink-0">
            <img
              src="/img/logo-kiora-vectorizado-blanco.png"
              alt="Kiora"
              className="h-10 w-10 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white leading-snug">Instalar Kiora Admin</p>
            <p className="text-[10px] text-white/50 font-medium mt-0.5">Accede más rápido desde tu pantalla de inicio.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="rounded-xl bg-[#ec131e] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl p-1.5 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
