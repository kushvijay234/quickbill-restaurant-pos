import { api } from './api';

export const adminService = {
  /**
   * Fetch admin dashboard metrics
   */
  async getStats() {
    return await api.get('/admin/stats');
  },

  /**
   * Fetch staff users list
   */
  async getUsers() {
    return await api.get('/admin/users');
  },

  /**
   * Create new staff user
   */
  async createUser(userData) {
    return await api.post('/admin/users', userData);
  },

  /**
   * Reset staff password
   */
  async resetPassword(userId, password) {
    return await api.put(`/admin/users/${userId}/reset-password`, { password });
  },

  /**
   * Delete staff user
   */
  async deleteUser(userId) {
    return await api.delete(`/admin/users/${userId}`);
  },

  /**
   * Fetch audit logs
   */
  async getLogs() {
    return await api.get('/logs');
  },
};
