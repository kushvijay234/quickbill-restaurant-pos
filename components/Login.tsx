import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logger } from '../services/logger';
import { api, setTenantSlug } from '../services/api';
import RestaurantRegister from './saas/RestaurantRegister';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter your username/email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.post('/auth/login', { 
        username, 
        password
      });

      const { token, user, tenant } = data;
      if (tenant && tenant.slug) {
        setTenantSlug(tenant.slug);
      }

      login(token, user);
      logger.info('User logged in successfully', { username: user.username });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid username or password';
      setError(errorMessage);
      logger.error('Login failed', { username, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
            Restaurant Cloud POS
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            RESTO<span className="text-indigo-600">BILL</span>
          </h1>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mt-1">
            Bill. Serve. Grow.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to start billing
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              required
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition duration-150 shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Don't have a restaurant account yet?
          </p>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 transition border border-indigo-200 dark:border-indigo-800"
          >
            ✨ Register Your Restaurant (14-Day Free Trial)
          </button>
        </div>
      </div>

      {showRegisterModal && (
        <RestaurantRegister onClose={() => setShowRegisterModal(false)} />
      )}
    </div>
  );
};

export default Login;
