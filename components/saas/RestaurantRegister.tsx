import React, { useState } from 'react';
import { api, setTenantSlug } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FastBilloLogo from '../common/FastBilloLogo';

interface RestaurantRegisterProps {
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToLogin?: (email?: string) => void;
}

interface CountryCurrencyOption {
  country: string;
  currency: string;
  symbol: string;
  phoneCode: string;
  flag: string;
  phonePlaceholder: string;
}

const COUNTRY_OPTIONS: CountryCurrencyOption[] = [
  { country: 'India', currency: 'INR', symbol: '₹', phoneCode: '+91', flag: '🇮🇳', phonePlaceholder: '9876543210' },
  { country: 'United States', currency: 'USD', symbol: '$', phoneCode: '+1', flag: '🇺🇸', phonePlaceholder: '2025550143' },
  { country: 'European Union', currency: 'EUR', symbol: '€', phoneCode: '+33', flag: '🇪🇺', phonePlaceholder: '612345678' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', phoneCode: '+44', flag: '🇬🇧', phonePlaceholder: '7911123456' },
  { country: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', phoneCode: '+971', flag: '🇦🇪', phonePlaceholder: '501234567' },
  { country: 'Canada', currency: 'CAD', symbol: '$', phoneCode: '+1', flag: '🇨🇦', phonePlaceholder: '4165550198' },
  { country: 'Australia', currency: 'AUD', symbol: '$', phoneCode: '+61', flag: '🇦🇺', phonePlaceholder: '412345678' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', phoneCode: '+966', flag: '🇸🇦', phonePlaceholder: '512345678' },
  { country: 'Singapore', currency: 'SGD', symbol: '$', phoneCode: '+65', flag: '🇸🇬', phonePlaceholder: '81234567' },
  { country: 'Global / Other', currency: 'USD', symbol: '$', phoneCode: '+1', flag: '🌐', phonePlaceholder: '1234567890' }
];

const RestaurantRegister: React.FC<RestaurantRegisterProps> = ({ onClose, onSuccess, onSwitchToLogin }) => {
  const { login } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<CountryCurrencyOption>(COUNTRY_OPTIONS[0]);
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [existingAccountInfo, setExistingAccountInfo] = useState<{
    email?: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password rule tests
  const hasMinLength = ownerPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(ownerPassword);
  const hasNumber = /[0-9]/.test(ownerPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(ownerPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExistingAccountInfo(null);

    const cleanRestName = restaurantName.trim();
    const cleanOwnerName = ownerName.trim();
    const cleanEmail = ownerEmail.trim();
    const cleanPhone = ownerPhone.trim();

    if (!cleanRestName || !cleanEmail || !ownerPassword) {
      setError('Please provide Business name, email, and password.');
      return;
    }

    // 1. Business Name: not above 69 characters
    if (cleanRestName.length > 69) {
      setError('Business name cannot exceed 69 characters.');
      return;
    }

    // 2. Owner Name: max 30 characters
    if (cleanOwnerName.length > 30) {
      setError('Owner name cannot exceed 30 characters.');
      return;
    }

    // 3. Mobile Number: only 10 digits
    if (cleanPhone && cleanPhone.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    // 4. Password: min 8 characters, at least 1 uppercase, 1 special character, 1 number
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!hasNumber) {
      setError('Password must contain at least one number (0-9).');
      return;
    }
    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&* etc).');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post('/saas/register', {
        restaurantName: cleanRestName,
        ownerName: cleanOwnerName || cleanRestName,
        ownerEmail: cleanEmail,
        ownerPhone: cleanPhone,
        ownerPassword,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.symbol
      });

      if (data.tenant?.slug) {
        setTenantSlug(data.tenant.slug);
      }

      // Log in the user directly to the POS workspace
      login(data.token, data.user);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err.status === 409 || err.code === 'ACCOUNT_EXISTS' || (err.message && err.message.toLowerCase().includes('already'))) {
        setExistingAccountInfo({
          email: err.data?.existingEmail || cleanEmail,
          message: err.message || 'An account with this email address or phone number is already registered.'
        });
      } else {
        setError(err.message || 'Failed to register restaurant.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2.5">
              <FastBilloLogo size={32} showBrandText={false} />
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                FAST<span className="text-emerald-600">BILLO</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">
                Bill Fast. Grow Faster.
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              Register Your Business
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start your 3-day free trial. Instant setup for billing and orders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Existing account detected notice */}
        {existingAccountInfo && (
          <div 
            role="alert" 
            className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-xs sm:text-sm animate-fade-in space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                  User Already Registered
                </h4>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {existingAccountInfo.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-800/60">
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToLogin) {
                    onSwitchToLogin(existingAccountInfo.email);
                  } else {
                    onClose();
                  }
                }}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition shadow-sm text-center"
              >
                Sign In to Existing Account &rarr;
              </button>
              <button
                type="button"
                onClick={() => setExistingAccountInfo(null)}
                className="py-2 px-3 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {error && (
          <div 
            role="alert" 
            className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs sm:text-sm animate-fade-in"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 font-medium leading-relaxed">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Business Name *
              </label>
              <span className={`text-[11px] ${restaurantName.length >= 69 ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>
                {restaurantName.length}/69
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={69}
              placeholder="e.g. Royal Taste Cafe"
              value={restaurantName}
              onChange={(e) => {
                setRestaurantName(e.target.value.slice(0, 69));
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Country & Payment Currency *
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {selectedCountry.currency} ({selectedCountry.symbol}) — No conversion fees
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedCountry.country}
                onChange={(e) => {
                  const opt = COUNTRY_OPTIONS.find(c => c.country === e.target.value) || COUNTRY_OPTIONS[0];
                  setSelectedCountry(opt);
                  if (error) setError('');
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.flag} {c.country} — Currency: {c.currency} ({c.symbol})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Your items, bills, and customer receipts will be billed natively in {selectedCountry.currency} ({selectedCountry.symbol}).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Owner / Manager Name
                </label>
                <span className={`text-[11px] ${ownerName.length >= 30 ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>
                  {ownerName.length}/30
                </span>
              </div>
              <input
                type="text"
                maxLength={30}
                placeholder="e.g. Chef Vikram"
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value.slice(0, 30));
                  if (error) setError('');
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Mobile Number
                </label>
                <span className={`text-[11px] ${ownerPhone.length === 10 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400'}`}>
                  {ownerPhone.length}/10 digits
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-gray-500 dark:text-gray-400 select-none">
                  {selectedCountry.flag} {selectedCountry.phoneCode}
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder={selectedCountry.phonePlaceholder}
                  value={ownerPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setOwnerPhone(digits);
                    if (error) setError('');
                    if (existingAccountInfo) setExistingAccountInfo(null);
                  }}
                  className="w-full pl-20 pr-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Email Address (For Login) *
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="owner@Business.com"
              value={ownerEmail}
              onChange={(e) => {
                setOwnerEmail(e.target.value);
                if (error) setError('');
                if (existingAccountInfo) setExistingAccountInfo(null);
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={ownerPassword}
                onChange={(e) => {
                  setOwnerPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

            {/* Live Password Strength Requirements Checklist */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 text-[11px]">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                <span>{hasMinLength ? '✓' : '○'}</span>
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                <span>{hasUppercase ? '✓' : '○'}</span>
                <span>1 Uppercase (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                <span>{hasNumber ? '✓' : '○'}</span>
                <span>1 Number (0-9)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                <span>{hasSpecialChar ? '✓' : '○'}</span>
                <span>1 Special character</span>
              </div>
            </div>
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
            No credit card required. Free 3-day trial with full billing features.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RestaurantRegister;
