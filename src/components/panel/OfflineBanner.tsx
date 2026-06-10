import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[200] bg-error-container/20 border-b border-error-container/50 px-4 py-2 text-center text-sm font-semibold text-error"
    >
      Sin conexión a internet. Los datos pueden estar desactualizados; vuelve a intentar cuando recuperes la red.
    </div>
  );
}
