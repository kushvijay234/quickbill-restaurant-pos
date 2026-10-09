// Fix: Add triple-slash directive to include Vite's client types, which defines import.meta.env.
/// <reference types="vite/client" />

import { logger } from './logger';

// Use absolute URL for production and Vite proxy for development
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://quickbill-restaurant-pos-1.onrender.com/api'
  : '/api';

/**
 * Resolves current tenant slug from URL query, localStorage, or subdomain
 */
export const getTenantSlug = (): string | null => {
  if (typeof window === 'undefined') return null;

  // 1. Check URL query (?tenant=cafe)
  const urlParams = new URLSearchParams(window.location.search);
  const queryTenant = urlParams.get('tenant');
  if (queryTenant) {
    localStorage.setItem('tenantSlug', queryTenant.toLowerCase().trim());
    return queryTenant.toLowerCase().trim();
  }

  // 2. Check localStorage
  const storedTenant = localStorage.getItem('tenantSlug');
  if (storedTenant) {
    return storedTenant.toLowerCase().trim();
  }

  // 3. Subdomain extraction
  const host = window.location.hostname;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (!isIp) {
    const parts = host.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase();
      const reserved = ['www', 'api', 'admin', 'app', 'localhost', 'quickbill-restaurant-pos'];
      const isReserved =
        reserved.includes(subdomain) ||
        subdomain.startsWith('quickbill') ||
        host.endsWith('.onrender.com') ||
        host.endsWith('.vercel.app');

      if (!isReserved) {
        return subdomain;
      }
    }
  }

  return null;
};

export const setTenantSlug = (slug: string) => {
  if (slug) {
    localStorage.setItem('tenantSlug', slug.toLowerCase().trim());
  } else {
    localStorage.removeItem('tenantSlug');
  }
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const tenantSlug = getTenantSlug();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantSlug) {
    headers['X-Tenant-ID'] = tenantSlug;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/saas/register');

      if (!isAuthEndpoint) {
        // Token is invalid or expired for an authenticated request, clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
          window.location.href = '/';
        }
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Invalid email or password' }));
      const error = new Error(errorData.message || 'Invalid email or password') as any;
      error.status = 401;
      error.data = errorData;
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const error = new Error(errorData.message || `An API error occurred: ${response.status}`) as any;
      error.status = response.status;
      error.code = errorData.code;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    let statusCode: number | undefined;
    let errorData: any;

    if (error instanceof Error) {
      errorMessage = error.message;
      statusCode = (error as any).status;
      errorData = (error as any).data;
    }
    
    if (!endpoint.includes('/logs')) {
      logger.error(
        `API call failed: ${options.method || 'GET'} ${endpoint}`,
        { error: errorMessage, statusCode, errorData },
        error instanceof Error ? error : undefined,
        statusCode,
        endpoint
      );
    }

    throw error;
  }
};

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: T, options?: RequestInit) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: T, options?: RequestInit) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
};
