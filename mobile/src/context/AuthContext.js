import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { storageService } from '../services/storageService';

const AuthContext = createContext({
  user: null,
  token: null,
  tenantSlug: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setTenantSlug: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tenantSlug, setTenantSlugState] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await authService.getStoredSession();
      setToken(session.token);
      setUser(session.user);
      setTenantSlugState(session.tenantSlug);

      if (session.token) {
        await refreshProfile();
      }
    } catch (e) {
      console.error('Session restore error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (usernameOrEmail, password, slug) => {
    const activeSlug = slug || tenantSlug;
    const response = await authService.login(usernameOrEmail, password, activeSlug);
    setToken(response.token);
    setUser(response.user);
    if (response.tenant?.slug || activeSlug) {
      setTenantSlugState(response.tenant?.slug || activeSlug);
    }
    await refreshProfile();
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const setTenantSlug = async (slug) => {
    await storageService.setTenantSlug(slug);
    setTenantSlugState(slug);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantSlug,
        profile,
        isAuthenticated: !!(token && user),
        isLoading,
        login,
        logout,
        setTenantSlug,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
