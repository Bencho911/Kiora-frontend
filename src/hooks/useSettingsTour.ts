import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export function useSettingsTour() {
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
      title: 'Configura tu sistema',
      text: 'Explora y modifica los ajustes de Kiora.',
      attachTo: { element: '#tour-nav-ajustes', on: 'right' },
      buttons: [
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Tu perfil personal',
      text: 'Edita tus datos y configuraciones personales.',
      attachTo: { element: '#tour-ajustes-perfil', on: 'bottom' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-3',
      title: 'Ajustes globales',
      text: 'Modifica horarios y variables del sistema.',
      attachTo: { element: '#tour-ajustes-sistema', on: 'bottom' },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Finalizar', action: tour.complete, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.start();
  };

  return { startTour };
}
