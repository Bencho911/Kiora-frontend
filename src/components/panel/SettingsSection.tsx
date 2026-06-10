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
          onClick: () => {
            const wg = (window as any).Weglot;
            if (wg) {
              const container = document.querySelector('.weglot-container');
              if (container) { (container as HTMLElement).style.setProperty('display', 'block', 'important'); }
              alertService.showToast('info', 'Selector de idioma activado');
            }
          },
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
    </div>
  );
};
