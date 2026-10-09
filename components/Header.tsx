

import React, { useState, useEffect, useRef } from 'react';
import { ICurrency, IUser } from '../types';
import FastBilloLogo from './common/FastBilloLogo';

interface HeaderProps {
  currency: ICurrency;
  onCurrencyChange?: (code: string) => void;
  onAddNewItem: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeView: 'menu' | 'pastOrders' | 'admin';
  onViewChange: (view: 'menu' | 'pastOrders' | 'admin') => void;
  pastOrderCount: number;
  onOpenProfile: () => void;
  user: IUser;
  onLogout: () => void;
  onOpenPlans?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currency, onCurrencyChange, onAddNewItem, theme, onToggleTheme, activeView, onViewChange, pastOrderCount, onOpenProfile, user, onLogout, onOpenPlans }) => {
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeLinkClasses = "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300";
  const inactiveLinkClasses = "text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleMobileLinkClick = (view: 'menu' | 'pastOrders' | 'admin') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  }
  
  const renderNavLinks = (isMobile = false) => {
    const mobileClasses = "flex items-center w-full px-4 py-2.5 text-base";
    const desktopClasses = navLinkClasses;
    
    return (
       <nav className={isMobile ? "flex flex-col w-full space-y-1" : "hidden md:flex items-center space-x-2"}>
          <button 
              onClick={() => isMobile ? handleMobileLinkClick('menu') : onViewChange('menu')}
              className={`${isMobile ? mobileClasses : desktopClasses} ${activeView === 'menu' ? activeLinkClasses : inactiveLinkClasses}`}
          >
              POS Billing
          </button>
          <button 
              onClick={() => isMobile ? handleMobileLinkClick('pastOrders') : onViewChange('pastOrders')}
              className={`${isMobile ? mobileClasses : desktopClasses} ${activeView === 'pastOrders' ? activeLinkClasses : inactiveLinkClasses} flex justify-between items-center`}
          >
              <span>Past Bill</span>
              <span className="ml-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pastOrderCount}
              </span>
          </button>
          {user && user.role === 'admin' && (
            <button 
                onClick={() => isMobile ? handleMobileLinkClick('admin') : onViewChange('admin')}
                className={`${isMobile ? mobileClasses : desktopClasses} ${activeView === 'admin' ? activeLinkClasses : inactiveLinkClasses} flex items-center gap-1.5`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Admin Panel</span>
            </button>
          )}
        </nav>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
            <FastBilloLogo size={42} showBrandText={true} />
            {renderNavLinks(false)}
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-4">
           <button
            onClick={onOpenProfile}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            aria-label="Profile Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
           <button
            onClick={onToggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
            {/* Read-only Currency Indicator for current restaurant */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-default select-none shadow-sm"
              title="Billing currency is fixed to restaurant profile (edit in Restaurant Profile)"
            >
              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-black">{currency.symbol}</span>
              <span>{currency.code}</span>
            </div>
            <button
              onClick={onAddNewItem}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Item
            </button>
          {onOpenPlans && (
            <button
              onClick={onOpenPlans}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 rounded-md hover:from-indigo-600 hover:to-purple-700 text-xs font-semibold shadow-sm transition"
              title="Manage SaaS Plan & Razorpay Subscriptions"
            >
              <span>💳</span>
              <span className="hidden lg:inline">Plans & Billing</span>
            </button>
          )}
          <button
              onClick={onLogout}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div ref={menuRef} className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 pt-4 pb-3 space-y-2">
            {renderNavLinks(true)}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="mb-4 flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-xs">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Billing Currency:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{currency.symbol} {currency.code}</span>
              </div>
               <button
                  onClick={() => { onAddNewItem(); setIsMobileMenuOpen(false); }}
                  className="flex items-center justify-center w-full bg-indigo-600 text-white px-4 py-2.5 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 text-sm font-medium mb-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Item
                </button>
             <div className="flex justify-around items-center">
                 <button
                    onClick={() => { onOpenProfile(); setIsMobileMenuOpen(false); }}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Profile Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                 <button
                    onClick={() => { onToggleTheme(); setIsMobileMenuOpen(false); }}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>)}
                </button>
                <button
                    onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Logout"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
