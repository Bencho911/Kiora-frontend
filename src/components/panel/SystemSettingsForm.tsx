import React, { useState, useEffect } from 'react';
import { alertService, API_URL } from '@/config/setup';

interface SystemSettings {
  id: number;
  cierre_caja_automatico: boolean;
  hora_cierre_automatico: string;
  abrir_siguiente_automatico: boolean;
  metodo_descuento_lote: 'FEFO' | 'FIFO';
  dias_alerta_vencimiento: number;
}

export const SystemSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kiora_token')}`,
        }
      });
      if (!res.ok) throw new Error('Error al cargar ajustes');
      const data = await res.json();
      setSettings(data);
    } catch (error: any) {
      alertService.showToast('error', error.message || 'No se pudieron cargar los ajustes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kiora_token')}`,
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Error al guardar ajustes');
      
      const data = await res.json();
      setSettings(data);
      alertService.showToast('success', 'Ajustes actualizados correctamente');
    } catch (error: any) {
      alertService.showToast('error', error.message || 'No se guardaron los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 md:p-8 animate-in fade-in duration-500">
      <div className="mb-6">
        <h3 className="headline-sm text-on-surface mb-2">Ajustes del Sistema</h3>
        <p className="body-md text-on-surface-variant">Configura el comportamiento global de Kiora. Estos ajustes afectan a todas las sucursales y empleados.</p>
      </div>

      <div className="space-y-8">
        {/* Sección Caja */}
        <section className="space-y-4">
          <h4 className="label-lg text-primary font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">point_of_sale</span>
            Sesiones de Caja
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start justify-between p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
              <div>
                <p className="label-md font-semibold text-on-surface">Cierre Automático</p>
                <p className="body-sm text-on-surface-variant mt-1">Cierra la sesión de caja a una hora específica si se olvida.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.cierre_caja_automatico}
                  onChange={(e) => setSettings({ ...settings, cierre_caja_automatico: e.target.checked })}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest opacity-100 transition-opacity" style={{ opacity: settings.cierre_caja_automatico ? 1 : 0.5 }}>
              <label className="label-md font-semibold text-on-surface block mb-2">Hora de Cierre Automático</label>
              <input
                type="time"
                disabled={!settings.cierre_caja_automatico}
                value={settings.hora_cierre_automatico}
                onChange={(e) => setSettings({ ...settings, hora_cierre_automatico: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-start justify-between p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest md:col-span-2">
              <div>
                <p className="label-md font-semibold text-on-surface">Apertura Automática (Día Siguiente)</p>
                <p className="body-sm text-on-surface-variant mt-1">Al cerrar la caja, ¿abrir automáticamente la del día siguiente con balance en $0?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.abrir_siguiente_automatico}
                  onChange={(e) => setSettings({ ...settings, abrir_siguiente_automatico: e.target.checked })}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Sección Inventario */}
        <section className="space-y-4">
          <h4 className="label-lg text-primary font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">inventory_2</span>
            Inventario y Lotes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
              <label className="label-md font-semibold text-on-surface block mb-2">Método de Descuento</label>
              <select
                value={settings.metodo_descuento_lote}
                onChange={(e) => setSettings({ ...settings, metodo_descuento_lote: e.target.value as 'FEFO' | 'FIFO' })}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2.5 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="FEFO">FEFO (First Expired, First Out) - Recomendado</option>
                <option value="FIFO">FIFO (First In, First Out)</option>
              </select>
              <p className="body-sm text-on-surface-variant mt-2">
                {settings.metodo_descuento_lote === 'FEFO' ? 'Descuenta stock primero de los lotes que vencen más pronto.' : 'Descuenta stock primero de los lotes que ingresaron primero.'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
              <label className="label-md font-semibold text-on-surface block mb-2">Alerta de Vencimiento (Días)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.dias_alerta_vencimiento}
                onChange={(e) => setSettings({ ...settings, dias_alerta_vencimiento: parseInt(e.target.value) || 30 })}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <p className="body-sm text-on-surface-variant mt-2">
                Se notificará sobre lotes que vencerán en este número de días.
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t border-outline-variant/20">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
            )}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
