import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export function useDashboardTour() {
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
      title: 'Explora tu dashboard',
      text: 'Selecciona esta opción para ver el resumen.',
      attachTo: { element: '#tour-nav-dashboard', on: 'right' },
      buttons: [
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Vende más rápido',
      text: 'Inicia una nueva venta desde aquí.',
      attachTo: { element: '#tour-dashboard-nueva-venta', on: 'bottom' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-3',
      title: 'Métricas clave',
      text: 'Revisa las ventas y el ticket promedio.',
      attachTo: { element: '#tour-dashboard-kpis', on: 'bottom' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-4',
      title: 'Últimas transacciones',
      text: 'Monitorea las ventas y su estado.',
      attachTo: { element: '#section-ventas-recientes', on: 'top' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-5',
      title: 'Controla el stock',
      text: 'Visualiza rápidamente alertas de inventario crítico.',
      attachTo: { element: '#section-alertas-stock', on: 'left' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Finalizar', action: tour.complete, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.start();
  };

  return { startTour };
}
