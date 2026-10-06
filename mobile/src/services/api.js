import { DEFAULT_API_URL } from '../constants/config';
import { storageService } from './storageService';

let activeBaseUrl = DEFAULT_API_URL;

// Initialize custom URL if saved
storageService.getCustomApiUrl().then((saved) => {
  if (saved) activeBaseUrl = saved;
});

export const setApiBaseUrl = (url) => {
  if (url && typeof url === 'string') {
    activeBaseUrl = url.replace(/\/+$/, '');
  } else {
    activeBaseUrl = DEFAULT_API_URL;
  }
};

export const getApiBaseUrl = () => activeBaseUrl;

const request = async (endpoint, options = {}) => {
  const token = await storageService.getToken();
  const tenantSlug = await storageService.getTenantSlug();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not send arbitrary or stale X-Tenant-ID on login/registration endpoints
  // Login will auto-route to the correct tenant from the user's credentials
  const isAuthEndpoint =
    cleanEndpoint.includes('/auth/login') || cleanEndpoint.includes('/saas/register');

  if (tenantSlug && !isAuthEndpoint && !headers['X-Tenant-ID']) {
    headers['X-Tenant-ID'] = tenantSlug;
  }

  const url = `${activeBaseUrl}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (!isAuthEndpoint) {
        // Clear expired session
        await storageService.setToken(null);
        await storageService.setUser(null);
      }

      const errorData = await response.json().catch(() => ({
        message: 'Invalid credentials or session expired',
      }));
      const error = new Error(errorData.message || 'Session expired');
      error.status = 401;
      error.data = errorData;
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText || `Request failed with status ${response.status}`,
      }));

      // Self-heal: If an old or invalid tenant slug was cached, clear it
      if (response.status === 404 && errorData.code === 'TENANT_NOT_FOUND') {
        await storageService.setTenantSlug(null);
      }

      const error = new Error(errorData.message || `API error: ${response.status}`);
      error.status = response.status;
      error.code = errorData.code;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Mobile API] Error on ${options.method || 'GET'} ${cleanEndpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) =>
    request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
