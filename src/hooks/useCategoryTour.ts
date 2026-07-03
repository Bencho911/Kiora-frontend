import Shepherd from 'shepherd.js';

export function useCategoryTour() {
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
      title: 'Organiza tu inventario',
      text: 'Selecciona esta opción para gestionar tus clasificaciones.',
      attachTo: { element: '#tour-nav-categorias', on: 'right' },
      buttons: [
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Crea una categoría',
      text: 'Añade una nueva agrupación a tu sistema.',
      attachTo: { element: '#tour-btn-nueva-categoria', on: 'bottom' },
      beforeShowPromise: () => {
        return new Promise<void>((resolve) => {
          const closeBtn = document.querySelector('#tour-close-category-drawer') as HTMLElement;
          if (closeBtn && document.querySelector('#tour-btn-guardar-categoria')) {
            closeBtn.click();
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-3',
      title: 'Completa y guarda',
      text: 'Asigna icono y nombre, luego presiona crear.',
      attachTo: { element: '#tour-btn-guardar-categoria', on: 'left' },
      beforeShowPromise: () => {
        return new Promise((resolve) => {
          const btn = document.querySelector('#tour-btn-nueva-categoria') as HTMLElement;
          if (btn && !document.querySelector('#tour-btn-guardar-categoria')) {
            btn.click();
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
      buttons: [
        { text: 'Atrás', action: tour.back, classes: 'text-on-surface-variant px-4 py-2 text-sm font-medium hover:bg-surface-container-low rounded-lg' },
        { text: 'Finalizar', action: tour.complete, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.start();
  };

  return { startTour };
}
