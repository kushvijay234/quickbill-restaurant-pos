// Fix: Add triple-slash directive to include Vite's client types, which defines import.meta.env.
/// <reference types="vite/client" />

import { logger } from './logger';

// Use absolute URL for production and Vite proxy for development
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://quickbill-restaurant-pos-1.onrender.com/api'
  : '/api';

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
        // Token is invalid or expired, clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/'; 
        throw new Error('401: Unauthorized. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `An API error occurred: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    logger.error(`API call failed: ${options.method || 'GET'} ${endpoint}`, { error: errorMessage });

    throw new Error(errorMessage);
  }
};

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: T, options?: RequestInit) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: T, options?: RequestInit) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
};
