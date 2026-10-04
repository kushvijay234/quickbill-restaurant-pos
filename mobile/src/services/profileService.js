import { api } from './api';

export const profileService = {
  /**
   * Get restaurant profile (name, currency, taxRate, address, phone)
   */
  async getProfile() {
    return await api.get('/profile');
  },

  /**
   * Update restaurant profile
   */
  async updateProfile(profileData) {
    return await api.put('/profile', profileData);
  },
};
