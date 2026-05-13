import { useState, useEffect } from 'react';
import { authService } from '@/config/setup';
import type { User } from '@/models/User';

function readSessionUser(): { user: User | null; isAdmin: boolean } {
  if (!authService.isAuthenticated()) {
    if (authService.getToken()) {
      authService.clearSession();
    }
    return { user: null, isAdmin: false };
  }
  return {
    user: authService.getUser(),
    isAdmin: authService.isAdmin(),
  };
}

export function useAuth() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = readSessionUser();
      setUser(next.user);
      setIsAdmin(next.isAdmin);
      setIsReady(true);
    };

    sync();

    const handleAuthChange = () => {
      const next = readSessionUser();
      setUser(next.user);
      setIsAdmin(next.isAdmin);
    };

    window.addEventListener('kiora_auth_change', handleAuthChange);
    return () => window.removeEventListener('kiora_auth_change', handleAuthChange);
  }, []);

  const logout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return { user, isAdmin, logout, isReady };
}
