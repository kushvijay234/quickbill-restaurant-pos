import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logger } from '../services/logger';
import { api, setTenantSlug } from '../services/api';
import RestaurantRegister from './saas/RestaurantRegister';
import Footer from './Footer';
import FastBilloLogo from './common/FastBilloLogo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post('/auth/login', { 
        email: cleanEmail,
        username: cleanEmail, // backwards compatibility for existing systems
        password
      });

      const { token, user, tenant } = data;
      if (tenant && tenant.slug) {
        setTenantSlug(tenant.slug);
      }

      login(token, user);
      logger.info('User logged in successfully', { email: user.email || user.username });
      
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid email or password';
      setError(errorMessage);
      logger.error('Login failed', { email: cleanEmail, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="text-center flex flex-col items-center">
            <FastBilloLogo size={68} showBrandText={true} textSize="lg" className="flex-col !gap-2" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your restaurant workspace
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="owner@restaurant.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div 
                role="alert" 
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs sm:text-sm animate-fade-in"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 font-medium leading-relaxed">
                  {error}
                </div>
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
              Register Your Restaurant (3-Day Free Trial)
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {showRegisterModal && (
        <RestaurantRegister 
          onClose={() => setShowRegisterModal(false)} 
          onSwitchToLogin={(existingEmail) => {
            if (existingEmail) {
              setEmail(existingEmail);
            }
            setShowRegisterModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Login;
