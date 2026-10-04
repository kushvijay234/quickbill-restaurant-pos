import { api } from './api';

export const menuService = {
  /**
   * Fetch all menu items (extracts array from { data, page, totalPages, total })
   */
  async getMenu(params = {}) {
    const query = new URLSearchParams();
    query.append('limit', params.limit || '100');
    if (params.page) query.append('page', params.page);
    if (params.search) query.append('search', params.search);
    const queryString = `?${query.toString()}`;
    const res = await api.get(`/menu${queryString}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
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
