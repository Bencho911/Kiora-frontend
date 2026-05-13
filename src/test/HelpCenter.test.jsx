import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HelpCenter from '../components/help/HelpCenter';

const mockIsAuthenticated = vi.hoisted(() => vi.fn());

vi.mock('@/config/setup', () => ({
  authService: {
    isAuthenticated: () => mockIsAuthenticated(),
  },
}));

describe('HelpCenter - back button navigation', () => {
  let hrefValue;

  beforeEach(() => {
    hrefValue = '';
    mockIsAuthenticated.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get href() {
          return hrefValue;
        },
        set href(v) {
          hrefValue = v;
        },
      },
    });
  });

  it('navega a /panel cuando el usuario está autenticado', async () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(<HelpCenter />);
    await userEvent.click(screen.getByRole('button', { name: /volver/i }));

    expect(hrefValue).toBe('/panel');
  });

  it('navega a /login/ cuando el usuario no está autenticado', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(<HelpCenter />);
    await userEvent.click(screen.getByRole('button', { name: /volver/i }));

    expect(hrefValue).toBe('/login/');
  });
});
