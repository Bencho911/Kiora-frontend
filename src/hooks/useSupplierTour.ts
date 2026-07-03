import Shepherd from 'shepherd.js';

export function useSupplierTour() {
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
      title: 'Gestiona tus contactos',
      text: 'Administra la información de tus distribuidores y socios.',
      attachTo: { element: '#tour-nav-proveedores', on: 'right' },
      buttons: [
        { text: 'Siguiente', action: tour.next, classes: 'bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium' }
      ]
    });

    tour.addStep({
      id: 'step-2',
      title: 'Añade un proveedor',
      text: 'Haz clic aquí para registrar un nuevo contacto.',
      attachTo: { element: '#tour-btn-nuevo-proveedor', on: 'bottom' },
      beforeShowPromise: () => {
        return new Promise<void>((resolve) => {
          const closeBtn = document.querySelector('#tour-close-supplier-drawer') as HTMLElement;
          if (closeBtn && document.querySelector('#tour-btn-guardar-proveedor')) {
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
      title: 'Finaliza el registro',
      text: 'Revisa que los datos estén correctos y guarda.',
      attachTo: { element: '#tour-btn-guardar-proveedor', on: 'left' },
      beforeShowPromise: () => {
        return new Promise((resolve) => {
          const btn = document.querySelector('#tour-btn-nuevo-proveedor') as HTMLElement;
          if (btn && !document.querySelector('#tour-btn-guardar-proveedor')) {
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
