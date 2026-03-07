import React, { createContext, useCallback, useContext, useState } from 'react';
import type { User } from '../types';
import { login as apiLogin } from '../api/endpoints/auth';
import { ls } from '../utils/localStorage';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => ls.getUser());

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    ls.setAccessToken(data.access_token);
    ls.setRefreshToken(data.refresh_token);
    ls.setUser(data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    ls.clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: user !== null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
