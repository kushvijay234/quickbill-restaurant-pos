/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://quickbill-restaurant-pos-1.onrender.com/api'
  : '/api';

export interface LogPayload {
    level: 'info' | 'warn' | 'error';
    message: string;
    source?: 'web' | 'mobile' | 'backend' | 'system';
    platform?: string;
    endpoint?: string;
    statusCode?: number;
    stack?: string;
    tenantSlug?: string;
    meta?: Record<string, any>;
}

let isDispatching = false;

const sendLog = (payload: LogPayload) => {
    // 1. Always output to browser console
    const prefix = `[WEB ${payload.level.toUpperCase()}]`;
    switch(payload.level) {
        case 'info': console.info(prefix, payload.message, payload.meta || ''); break;
        case 'warn': console.warn(prefix, payload.message, payload.meta || ''); break;
        case 'error': console.error(prefix, payload.message, payload.meta || '', payload.stack || ''); break;
    }

    // 2. Prevent infinite recursion if logging endpoint itself fails
    if (isDispatching) return;
    if (payload.endpoint && payload.endpoint.includes('/logs')) return;

    try {
        isDispatching = true;

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        let tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null;

        if (!tenantSlug && typeof window !== 'undefined') {
            try {
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    const parsed = JSON.parse(userJson);
                    tenantSlug = parsed?.tenantSlug || parsed?.tenant?.slug || null;
                }
            } catch {
                // Ignore parse errors
            }
        }

        const endpoint = payload.endpoint || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '');
        const platform = payload.platform || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser');

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }
        if (tenantSlug) {
            requestHeaders['X-Tenant-ID'] = tenantSlug;
        }

        const fullPayload: LogPayload = {
            level: payload.level,
            message: payload.message,
            source: 'web',
            platform,
            endpoint,
            statusCode: payload.statusCode,
            stack: payload.stack,
            tenantSlug: tenantSlug || payload.tenantSlug || '',
            meta: payload.meta,
        };

        // Fire-and-forget remote log dispatch to MongoDB database
        fetch(`${API_BASE_URL}/logs`, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(fullPayload),
        }).catch(err => {
            console.warn('[Web Logger Notice] Could not persist log to database:', err?.message || err);
        }).finally(() => {
            isDispatching = false;
        });
    } catch (e) {
        isDispatching = false;
        console.warn('[Web Logger Notice] Error preparing log dispatch:', e);
    }
};

export const logger = {
    info: (message: string, meta?: Record<string, any>) => {
        sendLog({ level: 'info', message, meta });
    },
    warn: (message: string, meta?: Record<string, any>) => {
        sendLog({ level: 'warn', message, meta });
    },
    error: (
        message: string, 
        meta?: Record<string, any>, 
        error?: Error | string, 
        statusCode?: number, 
        endpoint?: string
    ) => {
        let stack = '';
        if (error instanceof Error && error.stack) {
            stack = error.stack;
        } else if (typeof error === 'string') {
            stack = error;
        } else if (meta && meta.stack) {
            stack = String(meta.stack);
        }

        sendLog({ 
            level: 'error', 
            message, 
            meta, 
            stack, 
            statusCode, 
            endpoint 
        });
    },
};
