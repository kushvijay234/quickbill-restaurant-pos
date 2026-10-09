import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { logger } from './services/logger';
import './index.css';

// Global uncaught error listeners for browser runtime
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error(
      `Uncaught window error: ${event.message || 'Script error'}`,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      event.error || event.message
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error 
      ? reason.message 
      : (typeof reason === 'string' ? reason : 'Promise rejection');
    
    logger.error(
      `Unhandled Promise rejection: ${message}`,
      { reason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason) },
      reason instanceof Error ? reason : undefined
    );
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);