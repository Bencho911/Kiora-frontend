import React from 'react';

export const HELP_TOPICS: { title: string; icon: React.ReactNode }[] = [
  {
    title: 'Inicio de sesión y cuenta',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Gestión de productos y stock',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2L3 7v11h14V7l-7-5zm0 2.236L15 8v9H5V8l5-3.764z" />
      </svg>
    ),
  },
  {
    title: 'Ventas y facturación',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Usuarios y roles (Admin)',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
  },
  {
    title: 'Inventario y proveedores',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
  },
  {
    title: 'Reportes y mantenimiento',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export const HELP_FAQS = [
  // ── INICIO DE SESIÓN Y CUENTA ──
  {
    question: '¿Cómo inicio sesión por primera vez en Kiora?',
    answer:
      'Para ingresar, utiliza el correo electrónico y la contraseña que te fueron proporcionados por el administrador de tu tienda. Si eres el dueño o administrador principal, usa las credenciales enviadas a tu correo de registro. Si el sistema te rechaza, verifica que no haya espacios en blanco al final de tu correo.',
  },
  {
    question: 'No recuerdo mi contraseña, ¿cómo la recupero?',
    answer:
      'En la pantalla principal de "Iniciar Sesión", haz clic en el enlace inferior "¿Olvidaste tu contraseña?". Se te pedirá ingresar tu correo electrónico registrado. En minutos recibirás un código de verificación de 6 dígitos para validar tu identidad y poder crear una nueva contraseña segura.',
  },
  {
    question: 'Error Común: "Credenciales inválidas" o "Usuario bloqueado"',
    answer:
      'Si ves este error, asegúrate de estar ingresando la contraseña respetando mayúsculas y minúsculas. Si después de varios intentos el sistema bloquea tu cuenta por seguridad, deberás contactar a un Administrador para que ingrese a la pestaña "Usuarios" y haga clic en "Desbloquear" junto a tu nombre.',
  },

  // ── GESTIÓN DE PRODUCTOS Y STOCK ──
  {
    question: '¿Cómo agrego un nuevo producto al inventario?',
    answer:
      '1. Dirígete al módulo de "Productos" desde el menú inferior (icono de caja).\n2. Haz clic en el botón rojo "+ Nuevo Producto".\n3. Llena la información básica: Nombre, Código de Barras (opcional), Categoría y Precio.\n4. Establece el "Stock Actual" (cuántas unidades tienes) y el "Stock Mínimo" (el límite para que el sistema te alerte que se está agotando).\n5. (Opcional) Sube una fotografía del producto para que sea más fácil identificarlo en el Punto de Venta.\n6. Haz clic en Guardar.',
  },
  {
    question: '¿Cómo funcionan las Alertas de Stock Mínimo?',
    answer:
      'Cuando vendes un producto, Kiora descuenta automáticamente las unidades del inventario. Si la cantidad llega al número que configuraste como "Stock Mínimo" (o menor), el producto aparecerá marcado en rojo en el catálogo y generará una alerta en la pestaña "Alertas de Stock" dentro del módulo de Proveedores.',
  },
  {
    question: 'Error Común: "El archivo de imagen es muy pesado"',
    answer:
      'Al subir una foto para un producto, asegúrate de que el formato sea JPG, PNG o WebP, y que su tamaño no supere los 5MB. Si la imagen es muy grande, recórtala o usa una herramienta web para comprimirla antes de intentarlo nuevamente.',
  },

  // ── PUNTO DE VENTA (CARRITO) Y FACTURACIÓN ──
  {
    question: '¿Cómo registro una venta rápida (POS)?',
    answer:
      '1. Ve a "Ventas & Historial" y haz clic en "+ Nueva Venta", o toca el botón rojo con el símbolo de dinero en el centro del menú móvil.\n2. En el catálogo superior, toca los productos que el cliente desea llevar.\n3. En el carrito (parte inferior), ajusta las cantidades si lleva más de un mismo artículo con los botones (+) y (-).\n4. Selecciona el método de pago (Efectivo, Tarjeta, o Digital/QR).\n5. Haz clic en "REALIZAR COBRO". La venta quedará registrada inmediatamente en el historial.',
  },
  {
    question: '¿Cómo funciona el pago "Digital" con Stripe / Código QR?',
    answer:
      'Si seleccionas el método "Digital" y Kiora está configurado con Stripe (para kioscos o cobros digitales), el sistema generará una sesión de pago remota o un código QR. El cliente lo escanea con su celular, paga con su tarjeta de crédito/débito o Apple/Google Pay, y Kiora detectará automáticamente cuando el pago sea exitoso, cambiando la orden de "Pendiente" a "Completada".',
  },
  {
    question: 'Error Común: "Producto Agotado" al intentar vender',
    answer:
      'Si un producto aparece en gris con la etiqueta "Agotado", el sistema no te permitirá agregarlo al carrito para evitar descuadres de inventario. Debes ir al módulo de Productos, buscar el ítem y actualizar su "Stock Actual" tras recibir nueva mercancía.',
  },

  // ── INVENTARIO Y PROVEEDORES ──
  {
    question: '¿Para qué sirve el módulo de Proveedores?',
    answer:
      'Sirve como tu directorio comercial. Aquí puedes guardar el nombre de la empresa, el NIT/ID Fiscal, y los datos de contacto (teléfono, email) de las personas que te surten mercancía. Es vital para tener todo centralizado cuando las "Alertas de Stock" te avisen que debes hacer un re-pedido.',
  },
  {
    question: '¿Cómo agrupo mis productos? (Uso de Categorías)',
    answer:
      'Ve al menú de "Productos" y haz clic en la pestaña "Categorías". Allí puedes crear grupos como "Bebidas", "Lácteos", o "Aseo". Al asignar tus productos a estas categorías, el Punto de Venta generará botones automáticos de filtrado, haciendo que cobrar sea muchísimo más rápido.',
  },

  // ── REPORTES Y MANTENIMIENTO ──
  {
    question: '¿Cómo genero y descargo un reporte de ganancias?',
    answer:
      '1. Entra al módulo de "Reportes" (icono de gráfica de barras).\n2. Selecciona qué datos quieres analizar (Ventas, Productos más vendidos, etc.) y elige un rango de fechas (Hoy, Esta semana, Este mes).\n3. Revisa la gráfica interactiva para entender tus picos de venta.\n4. Para descargarlo, usa los botones superiores "Exportar Excel" o "Exportar PDF" para enviar el balance a tu contador.',
  },
  {
    question: '¿Puedo enviar un reporte por correo directamente desde Kiora?',
    answer:
      'Sí. En el módulo de Reportes, haz clic en el botón "Enviar Email". Ingresa el correo de destino (por ejemplo, el de tu socio o contador) y Kiora adjuntará un resumen detallado de las métricas en un correo electrónico con formato profesional.',
  },

  // ── USUARIOS Y ROLES (SOLO ADMINISTRADORES) ──
  {
    question: '¿Cómo creo una cuenta para un nuevo empleado?',
    answer:
      'Entra al módulo de "Ajustes/Usuarios" (icono de tuerca o múltiples personas). Haz clic en "Nuevo Usuario". Asigna un nombre, un correo institucional, una contraseña temporal y define su ROL. \n\n- ROL EMPLEADO: Solo puede vender y ver el inventario.\n- ROL ADMIN: Puede ver reportes financieros, borrar registros y gestionar usuarios.',
  },
  {
    question: '¿Cómo le quito el acceso a un ex-empleado?',
    answer:
      'No necesitas eliminar su cuenta y perder su historial de ventas. En el listado de usuarios, busca a la persona y haz clic en el icono del candado rojo ("Bloquear"). Inmediatamente se cerrará su sesión y no podrá volver a entrar a la aplicación.',
  }
];
