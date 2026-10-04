import { api } from './api';
import { storageService } from './storageService';

export const authService = {
  /**
   * Log into restaurant POS
   * @param {string} usernameOrEmail
   * @param {string} password
   * @param {string} [tenantSlug]
   */
  async login(usernameOrEmail, password, tenantSlug) {
    if (tenantSlug) {
      await storageService.setTenantSlug(tenantSlug);
    } else {
      // Clear any prior unverified tenant slug so backend can auto-route by email/username
      await storageService.setTenantSlug(null);
    }

    const payload = {
      username: usernameOrEmail.trim(),
      email: usernameOrEmail.trim(),
      password,
    };

    const data = await api.post('/auth/login', payload);

    if (data.token) {
      await storageService.setToken(data.token);
    }
    if (data.user) {
      await storageService.setUser(data.user);
    }
    if (data.tenant?.slug) {
      await storageService.setTenantSlug(data.tenant.slug);
    }

    return data;
  },

  /**
   * Register a new restaurant tenant and owner account
   */
  async register(registrationData) {
    // Clear any prior tenant slug to avoid conflict during registration
    await storageService.setTenantSlug(null);
    const data = await api.post('/saas/register', registrationData);

    if (data.token) {
      await storageService.setToken(data.token);
    }
    if (data.user) {
      await storageService.setUser(data.user);
    }
    if (data.tenant?.slug) {
      await storageService.setTenantSlug(data.tenant.slug);
    }

    return data;
  },

  /**
   * Check if restaurant tenant exists
   */
  async checkTenant(slug) {
    if (!slug) return null;
    try {
      const data = await api.get(`/saas/tenant/${slug.toLowerCase().trim()}`);
      return data;
    } catch (e) {
      return { slug, name: slug };
    }
  },

  /**
   * Logout cashier or admin
   */
  async logout() {
    await storageService.setToken(null);
    await storageService.setUser(null);
    await storageService.setTenantSlug(null);
  },

  /**
   * Get cached session
   */
  async getStoredSession() {
    const [token, user, tenantSlug] = await Promise.all([
      storageService.getToken(),
      storageService.getUser(),
      storageService.getTenantSlug(),
    ]);

    return { token, user, tenantSlug, isAuthenticated: !!(token && user) };
  },
};
