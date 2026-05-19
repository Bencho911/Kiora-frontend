export default function EmailSentMessage() {
  return (
    <div style={{ width: '100%', maxWidth: '448px', padding: '2.5rem', backgroundColor: '#ffffff', borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: '2rem', height: '2rem', color: '#ec131e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a1a1a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        ¡Correo Enviado!
      </h1>

      <p style={{ color: '#6b6b6b', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.9375rem' }}>
        Revisa tu bandeja de entrada o la carpeta de spam. Te hemos enviado un código para recuperar tu contraseña.
      </p>

      <a href="/login/"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#ec131e', color: '#ffffff', borderRadius: '16px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(236,19,30,0.2)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d01019'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(236,19,30,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ec131e'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(236,19,30,0.2)'; }}>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver a Iniciar Sesión
      </a>
    </div>
  );
}
