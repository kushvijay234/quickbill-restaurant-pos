import { api } from './api';

export const menuService = {
  /**
   * Fetch all menu items
   */
  async getMenu() {
    return await api.get('/menu');
  },

  /**
   * Add a new menu item
   */
  async addMenuItem(itemData) {
    return await api.post('/menu', itemData);
  },

  /**
   * Update an existing menu item
   */
  async updateMenuItem(id, itemData) {
    return await api.put(`/menu/${id}`, itemData);
  },

  /**
   * Delete single menu item
   */
  async deleteMenuItem(id) {
    return await api.delete(`/menu/${id}`);
  },

  /**
   * Delete multiple items
   */
  async deleteMultipleItems(ids) {
    return await api.post('/menu/delete-many', { ids });
  },
};
