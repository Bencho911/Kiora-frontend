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
  // ── Inicio de sesión y cuenta ──
  {
    question: '¿Cómo inicio sesión en Kiora?',
    answer:
      'Usa el correo y la contraseña que te asignó un administrador. Si no tienes cuenta, pide a un administrador que cree un usuario con tu correo.',
  },
  {
    question: '¿Qué hago si olvidé mi contraseña?',
    answer:
      'En la pantalla de inicio de sesión elige «¿Olvidaste tu contraseña?», ingresa tu correo y revisa tu bandeja (y spam) para el enlace de restablecimiento.',
  },
  
  // ── Gestión de productos y stock ──
  {
    question: '¿Cómo puedo agregar un nuevo producto?',
    answer:
      'En el módulo de "Productos", haz clic en el botón "Nuevo Producto". Llena los detalles como nombre, categoría, precio y stock inicial. También puedes subir una imagen.',
  },
  {
    question: '¿Cómo actualizo el stock de un producto?',
    answer:
      'Puedes ajustar el inventario manualmente buscando el producto en la lista y editando su stock actual, o el sistema lo descontará automáticamente al realizar una venta en el POS.',
  },
  {
    question: '¿Qué es el Stock Mínimo?',
    answer:
      'Es el umbral de alerta. Cuando las existencias caen por debajo de este valor, el sistema genera una alerta visual y en el panel de notificaciones para que realices un pedido a proveedores.',
  },
  
  // ── Ventas y facturación ──
  {
    question: '¿Cómo registro una nueva venta?',
    answer:
      'Abre el "Carrito" o "POS" desde el botón flotante o el menú lateral. Selecciona los productos, elige el método de pago y confirma. Podrás ver el resumen de la orden de inmediato.',
  },
  {
    question: '¿Qué métodos de pago soporta el sistema?',
    answer:
      'Kiora soporta Efectivo, Tarjeta y Pagos Digitales (Stripe/QR). Para pagos con QR, el sistema generará un código dinámico que el cliente puede escanear.',
  },
  {
    question: '¿Cómo veo el historial de ventas?',
    answer:
      'Ve a la sección de "Ventas". Allí encontrarás un listado cronológico de todas las transacciones realizadas, con detalles de items, totales y estados de pago.',
  },

  // ── Usuarios y roles (Admin) ──
  {
    question: '¿Qué diferencia hay entre Admin y Vendedor?',
    answer:
      'Los Administradores tienen acceso total: gestión de usuarios, configuración del sistema, reportes financieros avanzados y mantenimiento. Los Empleados solo pueden gestionar stock, realizar ventas y ver transacciones operativas.',
  },
  {
    question: '¿Cómo bloqueo a un usuario?',
    answer:
      'En el panel de "Usuarios", haz clic en el botón de candado junto al usuario. Un usuario bloqueado no podrá iniciar sesión hasta que un administrador lo desbloquee.',
  },

  // ── Inventario y proveedores ──
  {
    question: '¿Cómo descargo un reporte de inventario?',
    answer:
      'En la sección "Reportes", ve a la pestaña "Generar", elige el tipo de reporte "Inventario" y exporta a Excel o PDF según tu preferencia.',
  },
  {
    question: '¿Puedo organizar productos por categorías?',
    answer:
      'Sí, utiliza el módulo de "Categorías" para crear agrupaciones. Al editar un producto, puedes asignarlo a una o varias categorías para facilitar la búsqueda en el POS.',
  },

  // ── Reportes y mantenimiento ──
  {
    question: '¿Cómo funciona el Centro de Reportes?',
    answer:
      'El centro de reportes permite filtrar ventas por fechas, periodos (día, semana, mes) y tipos (ventas totales o ranking de productos). Toda la información es descargable.',
  },
  {
    question: '¿Qué hacer ante una falla técnica?',
    answer:
      'Utiliza la sección de "Incidencias" dentro de Reportes para notificar fallos. Un administrador o soporte técnico revisará el caso y actualizará su estado hasta que sea resuelto.',
  },
];
