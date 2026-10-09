import React, { useState } from 'react';
import { api } from '../../services/api';
import { ISuperAdminUser } from '../../types';
import FastBilloLogo from '../common/FastBilloLogo';

interface SuperAdminLoginProps {
  onSuccess: (user: ISuperAdminUser, token: string) => void;
  onBackToPos: () => void;
}

const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onSuccess, onBackToPos }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('superadmin@fastbillo.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = emailOrUsername.trim();
    if (!cleanInput || !password) {
      setError('Please provide SuperAdmin email/username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post('/superadmin/login', {
        emailOrUsername: cleanInput,
        password
      });

      if (data.token && data.superadmin) {
        localStorage.setItem('superadmin_token', data.token);
        localStorage.setItem('superadmin_user', JSON.stringify(data.superadmin));
        onSuccess(data.superadmin, data.token);
      } else {
        setError('Unexpected response from SuperAdmin service.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid SuperAdmin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white">
      <div className="w-full max-w-md p-8 bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-900/40 animate-fade-in">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <FastBilloLogo size={56} showBrandText={false} className="mb-1" />
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">
              FAST<span className="text-emerald-400">BILLO</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
              Control Plane
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-200">
            SuperAdmin Platform Login
          </h2>
          <p className="text-xs text-gray-400">
            Master access to manage multi-tenant restaurants, subscriptions & plans.
          </p>
        </div>

        {error && (
          <div className="mt-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              SuperAdmin Email or Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={emailOrUsername}
              onChange={(e) => { setEmailOrUsername(e.target.value); if (error) setError(''); }}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="superadmin@fastbillo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Authenticating...' : 'Enter SuperAdmin Console'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-800 text-center">
          <button
            type="button"
            onClick={onBackToPos}
            className="text-xs text-gray-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto"
          >
            <span>&larr;</span>
            <span>Return to Restaurant POS Login</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminLogin;
