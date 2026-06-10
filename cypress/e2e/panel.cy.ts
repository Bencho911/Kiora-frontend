describe('Panel Dashboard', () => {
  beforeEach(() => {
    // Para las pruebas del panel, necesitamos simular que el usuario está autenticado.
    // Una forma común es inyectar el token en localStorage antes de la prueba.
    cy.window().then((window) => {
      window.localStorage.setItem('kiora_token', 'fake-jwt-token');
    });
  });

  it('debe acceder al panel si está autenticado y mostrar el layout', () => {
    cy.visit('/panel');
    
    // El frontend debería permanecer en /panel porque el token existe
    cy.url().should('include', '/panel');
    
    // Verificar que el contenedor principal del Dashboard está presente
    // En KioraAdminLayout/Sidebar suelen haber enlaces
    cy.get('nav').should('be.visible');
    
    // Verificar la presencia de métricas clave (asumiendo que existan) o un título
    cy.contains('Panel de Control').should('exist').or('contain', 'Métricas');
  });

  it('debe redirigir a /login si no hay token', () => {
    // Limpiamos el localStorage
    cy.clearLocalStorage();
    
    cy.visit('/panel');
    
    // Debería redirigir al login
    cy.url().should('include', '/login');
  });
});
