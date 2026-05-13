import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Icono from '../components/icono';

describe('Componente Icono', () => {
  it('Debería renderizar un elemento link con el favicon del proyecto', () => {
    render(<Icono />);
    // Buscamos el link en el documento
    const linkElement = document.querySelector('link[rel="shortcut icon"]');

    // Verificamos que se haya renderizado y tenga los atributos correctos
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/img/logo-kiora-vectorizado.svg');
  });
});
