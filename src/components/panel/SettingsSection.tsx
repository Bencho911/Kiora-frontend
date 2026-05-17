import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { alertService } from '@/config/setup';
import HelpCenter from '@/components/help/HelpCenter';
import { LegalSection } from './LegalSection';

interface SettingsSectionProps {
  settingsView: 'main' | 'help' | 'terms' | 'privacy';
  setSettingsView: (view: 'main' | 'help' | 'terms' | 'privacy') => void;
  onOpenProfile: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settingsView,
  setSettingsView,
  onOpenProfile
}) => {
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight mb-1">
            Configuración del <span className="text-[#ec131e]">Sistema</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Gestiona tu cuenta, preferencias y ayuda técnica</p>
        </div>
      </div>

      {settingsView === 'main' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* SECCIÓN: CUENTA Y PERSONALIZACIÓN */}
          <section>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Perfil y Cuenta</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div onClick={onOpenProfile} className="group flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] cursor-pointer hover:border-[#ec131e]/30 hover:shadow-2xl hover:shadow-[#ec131e]/10 transition-all hover:-translate-y-1 ring-1 ring-slate-50">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 text-[#ec131e] rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-[#111827] text-sm sm:text-xl tracking-tight uppercase sm:normal-case">Mi Perfil</h3>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-medium leading-relaxed mt-1 sm:mt-1 line-clamp-2 sm:line-clamp-none">Gestiona tu identidad y accesos.</p>
                </div>
              </div>

              <div onClick={() => {
                const wg = (window as any).Weglot;
                if (wg) {
                  const container = document.querySelector('.weglot-container');
                  if (container) { (container as HTMLElement).style.setProperty('display', 'block', 'important'); }
                  alertService.showToast('info', 'Selector de idioma activado');
                }
              }} className="group flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] cursor-pointer hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-1 ring-1 ring-slate-50">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 0h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-[#111827] text-sm sm:text-xl tracking-tight uppercase sm:normal-case">Idioma</h3>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2 sm:line-clamp-none">Cambia el idioma global.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN: SOPORTE Y AYUDA */}
          <section>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Soporte y Ayuda</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div onClick={() => setSettingsView('help')} className="group flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] cursor-pointer hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/10 transition-all hover:-translate-y-1 ring-1 ring-slate-50">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-[#111827] text-sm sm:text-xl tracking-tight uppercase sm:normal-case">Ayuda</h3>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2 sm:line-clamp-none">Guías y soporte técnico.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN: LEGAL */}
          <section>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Legal y Privacidad</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div onClick={() => setSettingsView('terms')} className="group flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] cursor-pointer hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all hover:-translate-y-1 ring-1 ring-slate-50">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-[#111827] text-sm sm:text-xl tracking-tight uppercase sm:normal-case">Legales</h3>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2 sm:line-clamp-none">Términos y condiciones.</p>
                </div>
              </div>

              <div onClick={() => setSettingsView('privacy')} className="group flex flex-col gap-3 sm:gap-4 p-5 sm:p-7 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] cursor-pointer hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all hover:-translate-y-1 ring-1 ring-slate-50">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-[#111827] text-sm sm:text-xl tracking-tight uppercase sm:normal-case">Privacidad</h3>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2 sm:line-clamp-none">Protección de tus datos.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : settingsView === 'help' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <button onClick={() => setSettingsView('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-bold hover:text-[#ec131e] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Volver</button>
          <HelpCenter hideBackButton={true} />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <button onClick={() => setSettingsView('main')} className="mb-6 flex items-center gap-2 text-slate-400 font-bold hover:text-[#ec131e] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Volver</button>
          <LegalSection defaultTab={settingsView === 'terms' ? 'terminos' : 'privacidad'} />
        </div>
      )}
    </div>
  );
};
