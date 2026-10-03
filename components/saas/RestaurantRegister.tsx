import React, { useState } from 'react';
import { api, setTenantSlug } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface RestaurantRegisterProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const RestaurantRegister: React.FC<RestaurantRegisterProps> = ({ onClose, onSuccess }) => {
  const { login } = useAuth();
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!restaurantName || !ownerEmail || !ownerPassword) {
      setError('Please provide restaurant name, email, and password.');
      return;
    }

    if (ownerPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post('/saas/register', {
        restaurantName,
        ownerName: ownerName || restaurantName,
        ownerEmail,
        ownerPhone,
        ownerPassword
      });

      if (data.tenant?.slug) {
        setTenantSlug(data.tenant.slug);
      }

      // Log in the user directly to the POS workspace
      login(data.token, data.user);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register restaurant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                RESTO<span className="text-indigo-600">BILL</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
                Bill. Serve. Grow.
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              Register Your Restaurant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start your 14-day free trial. Instant setup for billing and orders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Taste Cafe"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Owner / Manager Name
              </label>
              <input
                type="text"
                placeholder="e.g. Chef Vikram"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Email Address (For Login) *
            </label>
            <input
              type="email"
              required
              placeholder="owner@restaurant.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Password (min. 6 characters) *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition duration-150 disabled:opacity-50 shadow-md shadow-indigo-500/20"
            >
              {isLoading ? 'Creating Your Account...' : 'Create Restaurant & Start Free Trial'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            No credit card required. Free 14-day trial with full billing features.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RestaurantRegister;
