import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { alertService } from '@/config/setup';
import HelpCenter from '@/components/help/HelpCenter';
import { LegalSection } from './LegalSection';
import { SystemSettingsForm } from './SystemSettingsForm';

interface SettingsSectionProps {
  settingsView: 'main' | 'help' | 'terms' | 'privacy' | 'system';
  setSettingsView: (view: 'main' | 'help' | 'terms' | 'privacy' | 'system') => void;
  onOpenProfile: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settingsView,
  setSettingsView,
  onOpenProfile
}) => {
  const [showLangModal, setShowLangModal] = React.useState(false);

  const changeLanguage = (lang: string) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
      alertService.showToast('success', `Idioma cambiado a ${lang === 'es' ? 'Español' : 'Inglés'}`);
    } else {
      // Fallback a las cookies por si no se generó el combo box
      if (lang === 'es') {
        document.cookie = 'googtrans=/es/es; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=/es/es; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${location.hostname}; path=/;`;
      } else {
        document.cookie = `googtrans=/es/${lang}; path=/`;
        document.cookie = `googtrans=/es/${lang}; domain=${location.hostname}; path=/`;
      }
      alertService.showToast('success', `Cambiando idioma a ${lang === 'es' ? 'Español' : 'Inglés'}...`);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    setShowLangModal(false);
  };

  const sections = [
    {
      title: 'Perfil y Cuenta',
      items: [
        {
          label: 'Mi Perfil',
          desc: 'Gestiona tu identidad y accesos.',
          icon: 'person',
          bg: 'bg-primary-fixed/30',
          color: 'text-primary-container',
          hover: 'hover:border-primary/30 hover:shadow-primary/10',
          onClick: onOpenProfile,
        },
        {
          label: 'Sistema',
          desc: 'Horarios de caja y alertas.',
          icon: 'settings',
          bg: 'bg-secondary-container/30',
          color: 'text-secondary',
          hover: 'hover:border-secondary/30 hover:shadow-secondary/10',
          onClick: () => setSettingsView('system'),
        },
        {
          label: 'Idioma',
          desc: 'Cambia el idioma global.',
          icon: 'language',
          bg: 'bg-surface-container-high',
          color: 'text-on-surface-variant',
          hover: 'hover:border-outline',
          onClick: () => setShowLangModal(true),
        },
        {
          label: 'Historial de Actividad',
          desc: 'Registro de auditoría del sistema.',
          icon: 'manage_history',
          bg: 'bg-primary/10',
          color: 'text-primary',
          hover: 'hover:border-primary/30',
          mobileOnly: true,
          onClick: () => useAppStore.getState().setActiveTab('actividad'),
        },
      ],
    },
    {
      title: 'Soporte y Ayuda',
      items: [
        {
          label: 'Ayuda',
          desc: 'Guías y soporte técnico.',
          icon: 'help',
          bg: 'bg-secondary-container/20',
          color: 'text-secondary-container',
          hover: 'hover:border-secondary-container/30',
          onClick: () => setSettingsView('help'),
        },
      ],
    },
    {
      title: 'Legal y Privacidad',
      items: [
        {
          label: 'Legales',
          desc: 'Términos y condiciones.',
          icon: 'description',
          bg: 'bg-primary-fixed/30',
          color: 'text-primary-container',
          hover: 'hover:border-primary/30',
          onClick: () => setSettingsView('terms'),
        },
        {
          label: 'Privacidad',
          desc: 'Protección de tus datos.',
          icon: 'lock',
          bg: 'bg-tertiary/10',
          color: 'text-tertiary',
          hover: 'hover:border-tertiary/30',
          onClick: () => setSettingsView('privacy'),
        },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h2 className="headline-lg text-on-surface mb-1">
          Configuración del <span className="text-primary">Sistema</span>
        </h2>
        <p className="body-md text-on-surface-variant">Gestiona tu cuenta, preferencias y ayuda técnica.</p>
      </div>

      {settingsView === 'main' ? (
        <div className="space-y-8 animate-in fade-in duration-500 duration-500">
          {sections.map(section => (
            <section key={section.title}>
              <h3 className="label-sm text-on-surface-variant font-semibold mb-3 px-1">{section.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {section.items.map(item => (
                  <div
                    key={item.label}
                    onClick={item.onClick}
                    className={`group flex-col gap-3 p-5 bg-surface border border-outline-variant/30 rounded-xl cursor-pointer ${item.hover} hover:shadow-md hover:-translate-y-0.5 transition-all ${'mobileOnly' in item && item.mobileOnly ? 'md:hidden flex' : 'flex'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="label-md text-on-surface">{item.label}</h4>
                      <p className="label-sm text-on-surface-variant mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : settingsView === 'help' ? (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setSettingsView('main')} className="mb-5 flex items-center gap-1.5 label-sm text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Volver
          </button>
          <HelpCenter hideBackButton={true} />
        </div>
      ) : settingsView === 'system' ? (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setSettingsView('main')} className="mb-5 flex items-center gap-1.5 label-sm text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Volver
          </button>
          <SystemSettingsForm />
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setSettingsView('main')} className="mb-5 flex items-center gap-1.5 label-sm text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Volver
          </button>
          <LegalSection defaultTab={settingsView === 'terms' ? 'terminos' : 'privacidad'} />
        </div>
      )}

      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLangModal(false)}>
          <div className="bg-surface rounded-3xl shadow-2xl w-[calc(100%-2rem)] max-w-sm overflow-hidden p-6 border border-outline-variant/20 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>language</span>
              </div>
              <h3 className="headline-sm text-on-surface">Seleccionar Idioma</h3>
              <p className="body-md text-on-surface-variant mt-1">Elige tu idioma preferido</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => changeLanguage('es')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-outline-variant/40 hover:bg-primary/5 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl shadow-sm rounded-sm overflow-hidden leading-none">🇪🇸</span>
                  <span className="label-lg text-on-surface font-medium">Español</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0">chevron_right</span>
              </button>
              
              <button 
                onClick={() => changeLanguage('en')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-outline-variant/40 hover:bg-primary/5 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl shadow-sm rounded-sm overflow-hidden leading-none">🇺🇸</span>
                  <span className="label-lg text-on-surface font-medium">English</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0">chevron_right</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowLangModal(false)} 
              className="mt-6 w-full py-3.5 rounded-2xl hover:bg-surface-variant/50 text-on-surface-variant font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
