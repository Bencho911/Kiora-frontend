import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export function useReportsTour() {
  const startTour = () => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: true
        },
        classes: 'shepherd-theme-custom bg-surface rounded-xl shadow-xl border border-outline-variant/30',
        scrollTo: { behavior: 'smooth', block: 'center' }
      }
    });

    tour.addStep({
      id: 'step-1',
      title: 'Sección de Reportes',
      text: 'Aquí podrás generar reportes detallados y analizar el rendimiento de tu negocio.',
      attachTo: { element: '#tour-nav-reportes', on: 'right' },
      buttons: [
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Define el Rango',
      text: 'Selecciona las fechas de inicio y fin para acotar la información de tu reporte.',
      attachTo: { element: '#tour-reportes-fecha', on: 'bottom' },
      buttons: [
        { text: 'Anterior', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-3',
      title: 'Elige el Tipo',
      text: 'Determina qué tipo de datos quieres visualizar (ej. Ventas Detalladas).',
      attachTo: { element: '#tour-reportes-tipo', on: 'bottom' },
      buttons: [
        { text: 'Anterior', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-4',
      title: 'Agrupación Temporal',
      text: 'Selecciona cómo quieres agrupar los resultados en el tiempo (por día, mes, etc).',
      attachTo: { element: '#tour-reportes-tiempo', on: 'bottom' },
      buttons: [
        { text: 'Anterior', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-5',
      title: 'Ajusta los Parámetros',
      text: 'Filtra aún más tu reporte por categorías específicas o tops de ventas.',
      attachTo: { element: '#tour-reportes-param', on: 'bottom' },
      buttons: [
        { text: 'Anterior', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-6',
      title: 'Genera el Reporte',
      text: 'Haz clic aquí para procesar los datos y visualizar tu reporte completo.',
      attachTo: { element: '#tour-reportes-generar', on: 'left' },
      buttons: [
        { text: 'Anterior', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Finalizar', action: tour.complete, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.start();
  };

  return { startTour };
}
