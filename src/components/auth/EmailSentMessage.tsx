export default function EmailSentMessage() {
  return (
    <div className="bg-white w-full max-w-105 p-10 rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center">
      <div className="flex justify-center mb-6">
        <svg className="w-16 h-16 text-[#ec131e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[#1e293b] mb-4">
        ¡Enlace Enviado!
      </h1>

      <p className="text-[#64748b] mb-8 leading-relaxed">
        Revisa tu bandeja de entrada o la carpeta de spam. Te hemos enviado un enlace para que recuperar tu contraseña.
      </p>

      <a
        href="/login/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ec131e] hover:bg-[#d0111a] text-white rounded-lg font-semibold transition-colors shadow-sm no-underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a Iniciar Sesión
      </a>
    </div>
  );
}
