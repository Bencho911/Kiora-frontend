import React, { useState } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { sessionService } from '@/services/sessionService';
import { alertService } from '@/config/setup';

export const SessionModal: React.FC = () => {
  const { isSessionModalOpen, modalMode, closeSessionModal, setCurrentSession, currentSession } = useSessionStore();
  
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isSessionModalOpen) return null;

  const isOpening = modalMode === 'OPEN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isOpening) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
          alertService.showToast('warning', 'Ingresa una cantidad válida');
          setIsLoading(false);
          return;
        }
        const newSession = await sessionService.openSession(numAmount, notes);
        setCurrentSession(newSession);
        alertService.showToast('success', 'Sesión de caja abierta');
      } else {
        const closedSession = await sessionService.closeSession(0, notes);
        setCurrentSession(null);
        alertService.showToast('success', 'Sesión de caja cerrada correctamente');
      }
      closeSessionModal();
      setAmount('');
      setNotes('');
    } catch (error: any) {
      alertService.showToast('error', error.message || 'Error al procesar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-surface border border-outline-variant/30 rounded-3xl w-full max-w-md overflow-hidden shadow-elevation-3">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOpening ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined">
                {isOpening ? 'point_of_sale' : 'lock'}
              </span>
            </div>
            <div>
              <h3 className="headline-sm text-on-surface">{isOpening ? 'Abrir Caja' : 'Cerrar Caja'}</h3>
              <p className="label-sm text-on-surface-variant">
                {isOpening ? 'Inicia la jornada de ventas' : 'Finaliza la jornada y declara efectivo'}
              </p>
            </div>
          </div>
          <button
            onClick={closeSessionModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/50 text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {isOpening ? (
              <div>
                <label className="label-md font-semibold text-on-surface mb-2 block">
                  Saldo Inicial (Efectivo en Caja)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-8 pr-4 py-3 text-on-surface text-lg font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="body-sm text-on-surface-variant mt-2">
                  Ingresa el monto con el que iniciarás el día para dar cambios.
                </p>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="body-md text-on-surface-variant mb-4">
                  El sistema registrará el cierre con el siguiente cálculo:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Saldo Inicial:</span>
                    <span className="font-semibold">${Number(currentSession?.saldo_inicial || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">Ventas Acumuladas:</span>
                    <span className="font-semibold">${Number(currentSession?.total_ventas_vivo || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="border-t border-primary/20 pt-2 mt-2 flex justify-between items-center">
                    <span className="font-bold text-on-surface">Total Esperado en Caja:</span>
                    <span className="font-bold text-lg text-primary">
                      ${(Number(currentSession?.saldo_inicial || 0) + Number(currentSession?.total_ventas_vivo || 0)).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label-md font-semibold text-on-surface mb-2 block">Notas (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Observaciones de la caja..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={closeSessionModal}
              className="flex-1 py-3 label-lg font-semibold text-on-surface bg-surface-variant/30 hover:bg-surface-variant/50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 label-lg font-semibold text-on-primary rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${
                isOpening ? 'bg-primary hover:bg-primary/90' : 'bg-error hover:bg-error/90'
              }`}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {isOpening ? 'play_arrow' : 'stop'}
                  </span>
                  {isOpening ? 'Abrir Caja' : 'Cerrar Caja'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
