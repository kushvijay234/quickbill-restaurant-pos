import { Platform } from 'react-native';
import { storageService } from './storageService';
import { getApiBaseUrl } from './api';

let isDispatching = false;

const sendLog = async ({
  level = 'error',
  message,
  meta = {},
  error,
  statusCode,
  endpoint,
}) => {
  // 1. Output to device debug console
  const consolePrefix = `[MOBILE ${level.toUpperCase()}]`;
  if (level === 'info') {
    console.info(consolePrefix, message, meta);
  } else if (level === 'warn') {
    console.warn(consolePrefix, message, meta);
  } else {
    console.error(consolePrefix, message, meta, error || '');
  }

  // 2. Only persist errors and warnings to remote MongoDB database; info logs stay in console
  if (level === 'info') return;

  // 3. Prevent infinite recursion if logging itself fails
  if (isDispatching) return;
  if (endpoint && endpoint.includes('/logs')) return;

  try {
    isDispatching = true;

    const token = await storageService.getToken();
    let tenantSlug = await storageService.getTenantSlug();

    if (!tenantSlug) {
      try {
        const user = await storageService.getUser();
        if (user) {
          tenantSlug = user.tenantSlug || user.tenant?.slug || null;
        }
      } catch {
        // Ignore user read errors
      }
    }

    const baseUrl = getApiBaseUrl();

    let stack = '';
    if (error instanceof Error && error.stack) {
      stack = error.stack;
    } else if (typeof error === 'string') {
      stack = error;
    } else if (meta && meta.stack) {
      stack = String(meta.stack);
    }

    const payload = {
      level,
      message: String(message || 'Unknown mobile event/error'),
      source: 'mobile',
      platform: `${Platform.OS} ${Platform.Version || ''} (RN)`.trim(),
      endpoint: endpoint || '',
      statusCode: typeof statusCode === 'number' ? statusCode : undefined,
      stack,
      tenantSlug: tenantSlug || '',
      meta: {
        ...meta,
        deviceOS: Platform.OS,
        osVersion: Platform.Version,
        timestamp: new Date().toISOString(),
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantSlug) {
      headers['X-Tenant-ID'] = tenantSlug;
    }

    // Fire-and-forget remote log dispatch to MongoDB database
    await fetch(`${baseUrl}/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Non-blocking: remote logging failure must not disrupt user mobile operations
    console.warn('[Mobile Logger Notice] Could not persist log to DB:', err?.message || err);
  } finally {
    isDispatching = false;
  }
};

export const logger = {
  info: (message, meta) => sendLog({ level: 'info', message, meta }),
  warn: (message, meta) => sendLog({ level: 'warn', message, meta }),
  error: (message, meta, error, statusCode, endpoint) =>
    sendLog({ level: 'error', message, meta, error, statusCode, endpoint }),
};
