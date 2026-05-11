import { useState, useEffect } from 'react';
import { authService } from '@/config/setup';
import type { User } from '@/models/User';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [isAdmin, setIsAdmin] = useState(() => authService.isAdmin());

  useEffect(() => {
    // Escuchar cambios de sesión si fuera necesario (opcional)
    const handleAuthChange = () => {
      setUser(authService.getUser());
      setIsAdmin(authService.isAdmin());
    };

    window.addEventListener('kiora_auth_change', handleAuthChange);
    return () => window.removeEventListener('kiora_auth_change', handleAuthChange);
  }, []);

  const logout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return { user, isAdmin, logout };
}
