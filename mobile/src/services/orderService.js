import { api } from './api';

export const orderService = {
  /**
   * Save a completed order
   */
  async createOrder(orderPayload) {
    return await api.post('/orders', orderPayload);
  },

  /**
   * Fetch past orders with optional pagination or filters
   */
  async getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    query.append('limit', params.limit || '100');
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await api.get(`/orders${queryString}`);
  },

  /**
   * Get total order count
   */
  async getOrderCount() {
    return await api.get('/orders/count');
  },

  /**
   * Get single order by ID
   */
  async getOrderById(id) {
    return await api.get(`/orders/${id}`);
  },
};
