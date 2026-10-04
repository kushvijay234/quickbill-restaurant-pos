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
   * Check if restaurant tenant exists
   */
  async checkTenant(slug) {
    if (!slug) return null;
    try {
      const data = await api.get(`/saas/tenant/${slug.toLowerCase().trim()}`);
      return data;
    } catch (e) {
      // Fallback: If public endpoint isn't available, allow proceed with warning
      return { slug, name: slug };
    }
  },

  /**
   * Logout cashier or admin
   */
  async logout() {
    await storageService.setToken(null);
    await storageService.setUser(null);
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
