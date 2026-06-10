import React from 'react';

export const HELP_TOPICS: { title: string; icon: React.ReactNode }[] = [
  {
    title: 'Kiora AI (Asistente)',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    ),
  },
  {
    title: 'Inicio y Usuarios',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Ventas y POS',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Productos y Categorías',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2L3 7v11h14V7l-7-5zm0 2.236L15 8v9H5V8l5-3.764z" />
      </svg>
    ),
  },
  {
    title: 'Dashboard y Reportes',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: 'Inventario y Proveedores',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
  },
];

export const HELP_FAQS = [
  // ── INICIO DE SESIÓN Y CUENTA ──
  {
    question: '¿Cómo inicio sesión en el sistema?',
    answer:
      'Para ingresar, utiliza el correo electrónico y la contraseña que te fueron asignados. Ingresa esos datos en la pantalla de "Iniciar Sesión" y presiona "Ingresar". Asegúrate de no tener espacios en blanco al final de tu correo.',
  },
  {
    question: 'Olvidé mi contraseña, ¿cómo la recupero?',
    answer:
      'En la pantalla principal de "Iniciar Sesión", haz clic en "¿Olvidaste tu contraseña?". Se te pedirá tu correo registrado. Kiora te enviará un código de verificación de 6 dígitos. Ingrésalo en la aplicación para crear una nueva contraseña segura.',
  },
  {
    question: '¿Por qué dice "Usuario Bloqueado"?',
    answer:
      'Si el sistema bloqueó tu cuenta (por seguridad tras múltiples intentos fallidos o por decisión de la empresa), debes contactar a un Administrador. El administrador podrá ir al módulo de "Usuarios" y reactivar tu acceso.',
  },

  // ── USUARIOS Y SEGURIDAD (ADMIN) ──
  {
    question: '¿Cómo ver todos los usuarios registrados?',
    answer:
      'Si eres Administrador, ve al módulo "Usuarios" (icono de múltiples personas). Allí verás una lista completa de todos los empleados y administradores, con una barra de búsqueda para encontrarlos rápidamente.',
  },
  {
    question: '¿Cómo añadir un nuevo usuario o empleado?',
    answer:
      'En el módulo de "Usuarios", presiona el botón principal "+ Nuevo Usuario". Completa sus datos (Nombre, Correo), asígnale una contraseña temporal y define su Rol (Admin o Empleado). Al finalizar, presiona "Guardar".',
  },
  {
    question: '¿Cómo bloquear a un empleado que ya no trabaja aquí?',
    answer:
      'En el listado de "Usuarios", busca al ex-empleado y haz clic en el icono del "Candado rojo". Esto bloqueará su acceso de inmediato, impidiendo que inicie sesión, pero mantendrá su historial de ventas intacto en los reportes.',
  },
  {
    question: '¿Cómo cambiar la contraseña de un empleado?',
    answer:
      'Si un empleado olvidó su contraseña, búscalo en el listado de "Usuarios" y haz clic en el icono de la "Llave". El sistema te permitirá establecer una nueva contraseña directamente sin necesidad de usar el correo.',
  },

  // ── KIORA AI (INTELIGENCIA ARTIFICIAL) ──
  {
    question: '¿Cómo utilizar la IA de Kiora?',
    answer:
      'Kiora AI es tu asistente virtual. Para abrirlo:\n- En móviles: Toca el icono "AI" (un agente con auriculares) en la barra superior derecha.\n- En computadoras: Haz clic en la tarjeta "Kiora AI" en la parte inferior del menú lateral izquierdo.\n\nUna vez abierto, puedes escribirle preguntas u órdenes en el chat, como: "Sugiéreme qué productos reabastecer hoy" o "Analiza mis ventas de la semana".',
  },

  // ── VENTAS Y PUNTO DE VENTA (POS) ──
  {
    question: '¿Cómo registrar una nueva venta?',
    answer:
      '1. Ve al módulo "Ventas" y presiona "+ Nueva Venta" (o usa el atajo en el menú móvil).\n2. Toca los productos del catálogo para añadirlos al carrito.\n3. Selecciona la forma de pago (Efectivo, Tarjeta, Digital).\n4. Haz clic en "Realizar Cobro".',
  },
  {
    question: '¿Cómo usar los botones del carrito (Aumentar, Disminuir, Eliminar)?',
    answer:
      'Dentro de la ventana del carrito de compras:\n- Botón [+]: Suma una unidad de ese producto.\n- Botón [-]: Resta una unidad.\n- Icono de Basurero: Elimina ese producto del carrito por completo.',
  },
  {
    question: '¿Cómo ver y descargar recibos de ventas pasadas?',
    answer:
      'En el módulo "Ventas", verás la tabla con el historial. Haz clic en el icono del "Ojo" (Ver Detalle) en cualquier venta. Se abrirá una ventana donde encontrarás los botones de "Descargar PDF" o "Imprimir Recibo".',
  },

  // ── PRODUCTOS Y CATEGORÍAS ──
  {
    question: '¿Cómo crear o añadir un nuevo producto?',
    answer:
      'Ve al módulo "Productos" y haz clic en el botón rojo "+ Nuevo Producto". Llena el nombre, código de barras, categoría y precio. También debes poner la cantidad actual que tienes en inventario. Al terminar, dale a "Guardar".',
  },
  {
    question: '¿Cómo editar el precio o eliminar un producto?',
    answer:
      'En el listado de "Productos", busca el ítem que quieres modificar. \n- Lápiz (Editar): Cambia su precio, foto o nombre.\n- Basurero (Eliminar): Bórralo del sistema (solo se permite si no tiene ventas asociadas para no dañar reportes).',
  },
  {
    question: '¿Cómo crear y usar las Categorías?',
    answer:
      'Las categorías agrupan los productos (ej. "Bebidas", "Postres"). Ve a "Categorías", presiona "+ Nueva Categoría", elige un icono y ponle nombre. Luego, al crear un producto, podrás asignarlo a esta nueva categoría.',
  },

  // ── INVENTARIO Y PROVEEDORES ──
  {
    question: '¿Cómo funcionan las alertas de stock?',
    answer:
      'Cuando vendes, el stock baja automáticamente. Si llega al "Stock Mínimo" que le configuraste al producto, el sistema lanzará una alerta roja. Puedes ver todos los productos agotados en la pestaña "Inventario / Proveedores".',
  },
  {
    question: '¿Cómo añadir un nuevo Proveedor?',
    answer:
      'Ve al módulo "Proveedores" (Inventario), presiona "+ Nuevo Proveedor". Completa el nombre de la empresa, su teléfono y correo. Así tendrás un directorio a la mano cuando las alertas de stock te indiquen que debes comprar más.',
  },

  // ── DASHBOARD Y REPORTES ──
  {
    question: '¿Cómo leer el Dashboard principal?',
    answer:
      'El Dashboard (pantalla de inicio) te muestra un resumen de tu dinero. \nUsa los botones superiores "Hoy", "Esta Semana", "Este Mes" para filtrar las ganancias de ese periodo exacto. Las gráficas te mostrarán a qué horas vendiste más.',
  },
  {
    question: '¿Cómo exportar mis datos a Excel o PDF?',
    answer:
      'Si eres Administrador, entra al módulo "Reportes". Selecciona el rango de fechas en el calendario. Luego presiona el botón verde "Exportar Excel" para tener una tabla, o el botón rojo "Exportar PDF" para un informe gráfico.',
  },
  {
    question: '¿Cómo enviar un reporte por correo?',
    answer:
      'En "Reportes", presiona el botón "Enviar Email". Escribe la dirección de correo (ej. la de tu contador) y el sistema enviará los datos financieros automáticamente de forma segura.',
  },

  // ── AJUSTES Y PERFIL ──
  {
    question: '¿Cómo activar el Modo Oscuro?',
    answer:
      'En la barra superior (junto a la campana de notificaciones), verás un icono de Sol o Luna. Al hacer clic ahí, cambiarás la interfaz entre modo claro (blanco) y modo oscuro (negro) de inmediato.',
  },
  {
    question: '¿Cómo cambiar el idioma de Kiora?',
    answer:
      'Ve al menú "Ajustes", selecciona "Idioma" y esto activará el selector en pantalla para que elijas entre Español, Inglés, etc.',
  }
];
