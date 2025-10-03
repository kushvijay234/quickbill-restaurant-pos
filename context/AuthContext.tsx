import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { IProfile, IUser } from '../types';
import { api } from '../services/api';
import { logger } from '../services/logger';

interface IAuthContext {
  isAuthenticated: boolean;
  user: IUser | null;
  token: string | null;
  profile: IProfile | null;
  login: (token: string, user: IUser) => void;
  logout: () => void;
  setProfile: (profile: IProfile) => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [profile, setProfile] = useState<IProfile | null>(null);

  const logout = useCallback(() => {
    logger.info('User logging out', { username: user?.username });
    setUser(null);
    setToken(null);
    setProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, [user?.username]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: IUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        logger.error("Failed to parse user data from localStorage", { error });
        logout();
      }
    }
  }, [logout]);

  const login = (newToken: string, newUser: IUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };
  
  // Set up response interceptor for 401 Unauthorized
  useEffect(() => {
    const originalRequest = (api as any).__request; // Assuming an internal method to intercept
    
    const handleUnauthorized = (error: any) => {
        if (error.message.includes('401')) {
            logout();
        }
        return Promise.reject(error);
    };

    // This is a conceptual way to intercept. The actual implementation depends on `api.ts` structure.
    // For this implementation, we will add error handling in `api.ts` directly.
    // This effect is a placeholder for a more complex interceptor pattern.

  }, [logout]);


  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, logout, profile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};