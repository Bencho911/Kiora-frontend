import { useState } from 'react';

type LegalTab = 'terminos' | 'privacidad';

export function LegalSection({ defaultTab }: { defaultTab?: LegalTab }) {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab || 'terminos');

  return (
    <div className="space-y-8 pb-20">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#3E2723]/5 border border-[#3E2723]/10">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ec131e] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3E2723]/60">Legal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a1a] sm:text-4xl">
            {activeTab === 'privacidad' ? 'Políticas de Privacidad' : 'Términos y Condiciones'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">Documentación legal oficial de Kiora.</p>
        </div>
      </header>

      {/* Internal Tabs - Hide if we have a defaultTab from parent */}
      {!defaultTab && (
        <div className="flex border-b border-slate-100 mb-6">
          <button
            onClick={() => setActiveTab('terminos')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'terminos'
                ? 'border-[#ec131e] text-[#ec131e]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Términos y Condiciones
          </button>
          <button
            onClick={() => setActiveTab('privacidad')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'privacidad'
                ? 'border-[#ec131e] text-[#ec131e]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Política de Privacidad
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ec131e]"></div>

        {activeTab === 'terminos' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8">
              <div className="text-[10px] font-bold text-[#ec131e] tracking-widest uppercase mb-2">Legal • Kiora</div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Acuerdo de Usuario</h2>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Bienvenido a Kiora. Al acceder o utilizar nuestra plataforma, usted acepta estar sujeto a estos Términos y Condiciones.
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-md font-bold text-gray-900 mb-3">
                  <span className="w-6 h-6 rounded bg-red-50 text-[#ec131e] flex items-center justify-center">1</span>
                  Uso de la Plataforma
                </h3>
                <div className="text-sm text-gray-600 font-medium space-y-3 pl-8">
                  <p>El acceso a Kiora está permitido de forma temporal y nos reservamos el derecho de retirar o modificar el servicio sin previo aviso.</p>
                  <ul className="list-disc pl-5 space-y-1.5 marker:text-gray-300">
                    <li>No utilizar el servicio para fines ilegales.</li>
                    <li>Mantener la confidencialidad de sus credenciales.</li>
                    <li>No intentar dañar la infraestructura tecnológica.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-md font-bold text-gray-900 mb-3">
                  <span className="w-6 h-6 rounded bg-red-50 text-[#ec131e] flex items-center justify-center">2</span>
                  Propiedad Intelectual
                </h3>
                <p className="text-sm text-gray-600 pl-8 font-medium">
                  Todo el contenido incluido en Kiora es propiedad de Kiora o de sus proveedores y está protegido por las leyes internacionales.
                </p>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-md font-bold text-gray-900 mb-3">
                  <span className="w-6 h-6 rounded bg-red-50 text-[#ec131e] flex items-center justify-center">3</span>
                  Limitación de Responsabilidad
                </h3>
                <p className="text-sm text-gray-600 pl-8 font-medium">
                  Kiora no garantiza que la plataforma esté libre de errores. No seremos responsables por daños indirectos o pérdida de beneficios.
                </p>
              </section>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-8">
              <span className="inline-block px-2.5 py-1 bg-red-50 text-[#ec131e] text-[10px] font-bold tracking-widest uppercase rounded-full mb-4">
                Legal
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Privacidad en Kiora</h2>
              <p className="text-xs text-slate-400 mb-6 italic">Última actualización: 24 de Mayo, 2024</p>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                En Kiora, valoramos tu privacidad y nos comprometemos a proteger tus datos personales.
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-base font-bold text-[#ec131e] mb-3">Recopilación de Datos</h3>
                <div className="text-sm text-gray-600 font-medium space-y-4 pl-8">
                  <p>Recopilamos información necesaria para brindar nuestros servicios:</p>
                  <ul className="space-y-2.5 pl-4 text-gray-500 list-disc">
                    <li>Información de contacto (nombre, correo).</li>
                    <li>Identificadores de dispositivo y dirección IP.</li>
                    <li>Preferencias de uso.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-base font-bold text-[#ec131e] mb-3">Uso de la Información</h3>
                <div className="grid gap-3 pl-8">
                  <div className="bg-red-50/40 p-4 border border-red-50 rounded-xl">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Personalización</h4>
                    <p className="text-xs text-gray-500 font-medium">Adaptar nuestro contenido a tus preferencias.</p>
                  </div>
                  <div className="bg-red-50/40 p-4 border border-red-100 rounded-xl">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Seguridad</h4>
                    <p className="text-xs text-gray-500 font-medium">Verificar cuentas y prevenir fraudes.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-base font-bold text-[#ec131e] mb-3">Tus Derechos</h3>
                <p className="text-sm text-gray-600 font-medium pl-8">
                  Tienes los derechos de Acceso, Rectificación, Supresión (Olvido) y Portabilidad de tus datos bajo las leyes aplicables.
                </p>
              </section>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">© Kiora S.A. Todos los derechos reservados.</p>
          <a href="mailto:KiosKiora@gmail.com" className="text-[11px] font-bold text-[#ec131e] hover:underline mt-2 inline-block">KiosKiora@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
