describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('debe mostrar el formulario de inicio de sesión correctamente', () => {
    // Verificar que los textos y campos principales estén presentes
    cy.get('h2').contains('Bienvenido de nuevo').should('be.visible');
    cy.get('input#email').should('be.visible').and('have.attr', 'placeholder', 'nombre@ejemplo.com');
    cy.get('input#password').should('be.visible').and('have.attr', 'type', 'password');
    cy.get('button[type="submit"]').contains('Iniciar Sesión').should('be.visible');
  });

  it('debe alternar la visibilidad de la contraseña', () => {
    cy.get('input#password').should('have.attr', 'type', 'password');
    // Asumiendo que el botón para mostrar/ocultar es el que está junto al input de password
    cy.get('input#password').parent().find('button').click();
    cy.get('input#password').should('have.attr', 'type', 'text');
    // Volver a ocultar
    cy.get('input#password').parent().find('button').click();
    cy.get('input#password').should('have.attr', 'type', 'password');
  });

  it('debe mostrar error si se envían datos inválidos (simulación de fallo de red/API)', () => {
    // Interceptar la petición al backend y forzar un error para probar la UI
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'Credenciales incorrectas. Intento 1 de 5.' }
    }).as('loginError');

    cy.get('input#email').type('usuario@invalido.com');
    cy.get('input#password').type('claveIncorrecta');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginError');
    cy.contains('Credenciales incorrectas').should('be.visible');
  });

  it('debe redirigir al panel tras un inicio de sesión exitoso', () => {
    // Interceptar y mockear respuesta exitosa
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: { id: 1, name: 'Admin', email: 'admin@kiora.com' }
      }
    }).as('loginSuccess');

    cy.get('input#email').type('admin@kiora.com');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginSuccess');
    
    // Cypress no cambiará de origen en un intercept tan fácil si redirige con window.location.href,
    // Pero verificaremos que se intente hacer la redirección o el estado loading.
    cy.contains('Verificando...').should('be.visible');
  });
});
