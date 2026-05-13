import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../components/auth/LoginForm';
import { authService, alertService } from '../../config/setup';

// Mock the services
vi.mock('../../config/setup', () => ({
  authService: {
    login: vi.fn(),
  },
  alertService: {
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showToast: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form with basic fields', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText(/KiosKiora@gmail.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/escribe tu contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('should have required fields on email and password inputs', () => {
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText(/KiosKiora@gmail.com/i);
    const passwordInput = screen.getByPlaceholderText(/escribe tu contraseña/i);
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('should call authService.login on valid submission', async () => {
    (authService.login as any).mockResolvedValue({ token: 'abc', usuario: { id: 1 } });
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByPlaceholderText(/kiora@gmail.com/i), { target: { value: 'KiosKiora@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/escribe tu contraseña/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        correo_usu: 'KiosKiora@gmail.com',
        password: 'password123'
      });
    });
  });

  it('should show forgot password link', () => {
    render(<LoginForm />);
    expect(screen.getByText(/olvidaste tu contraseña/i)).toBeInTheDocument();
  });
});
