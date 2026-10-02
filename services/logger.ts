/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://quickbill-restaurant-pos-1.onrender.com/api'
  : '/api';

interface LogPayload {
    level: 'info' | 'warn' | 'error';
    message: string;
    meta?: Record<string, any>;
}

const sendLog = (payload: LogPayload) => {
    // Also log to console for debugging
    switch(payload.level) {
        case 'info': console.info(`[INFO] ${payload.message}`, payload.meta || ''); break;
        case 'warn': console.warn(`[WARN] ${payload.message}`, payload.meta || ''); break;
        case 'error': console.error(`[ERROR] ${payload.message}`, payload.meta || ''); break;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
        // Protected /logs endpoint requires token, skip remote logging if not logged in
        return;
    }

    // Fire-and-forget remote logging
    fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    }).catch(err => {
        console.warn('Remote logging dispatch notice:', err?.message || err);
    });
};

export const logger = {
    info: (message: string, meta?: Record<string, any>) => {
        sendLog({ level: 'info', message, meta });
    },
    warn: (message: string, meta?: Record<string, any>) => {
        sendLog({ level: 'warn', message, meta });
    },
    error: (message: string, meta?: Record<string, any>) => {
        sendLog({ level: 'error', message, meta });
    },
};
