import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export function useUsersTour() {
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
      title: 'Administra tu equipo',
      text: 'Visualiza y gestiona todos los usuarios.',
      attachTo: { element: '#tour-nav-usuarios', on: 'right' },
      buttons: [
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Añade un miembro',
      text: 'Registra nuevos usuarios al sistema.',
      attachTo: { element: '#tour-usuarios-nuevo', on: 'bottom' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-3',
      title: 'Directorio de usuarios',
      text: 'Controla accesos, edita perfiles o bloquea cuentas.',
      attachTo: { element: '#tour-usuarios-lista', on: 'top' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Finalizar', action: tour.complete, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.start();
  };

  return { startTour };
}
