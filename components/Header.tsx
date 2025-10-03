

import React from 'react';
import { ICurrency, IUser } from '../types';
import { CURRENCIES } from '../constants';

interface HeaderProps {
  currency: ICurrency;
  onCurrencyChange: (code: string) => void;
  onAddNewItem: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeView: 'menu' | 'pastOrders' | 'admin';
  onViewChange: (view: 'menu' | 'pastOrders' | 'admin') => void;
  pastOrderCount: number;
  onOpenProfile: () => void;
  user: IUser;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currency, onCurrencyChange, onAddNewItem, theme, onToggleTheme, activeView, onViewChange, pastOrderCount, onOpenProfile, user, onLogout }) => {
  
  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeLinkClasses = "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300";
  const inactiveLinkClasses = "text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
  
  const isStaff = user.role === 'staff';

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            QuickBill<span className="text-indigo-600">POS</span>
            </h1>
            <nav className="hidden md:flex items-center space-x-2">
              {isStaff ? (
                <>
                  <button 
                      onClick={() => onViewChange('menu')}
                      className={`${navLinkClasses} ${activeView === 'menu' ? activeLinkClasses : inactiveLinkClasses}`}
                  >
                      Menu
                  </button>
                  <button 
                      onClick={() => onViewChange('pastOrders')}
                      className={`${navLinkClasses} ${activeView === 'pastOrders' ? activeLinkClasses : inactiveLinkClasses}`}
                  >
                      Past Orders 
                      <span className="ml-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pastOrderCount}
                      </span>
                  </button>
                </>
              ) : (
                <button 
                    onClick={() => onViewChange('admin')}
                    className={`${navLinkClasses} ${activeView === 'admin' ? activeLinkClasses : inactiveLinkClasses}`}
                >
                    Admin Panel
                </button>
              )}
            </nav>
        </div>
        <div className="flex items-center space-x-4">
           <button
            onClick={onOpenProfile}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            aria-label="Restaurant Settings"
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
          {isStaff && (
            <div className="relative">
              <select
                value={currency.code}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="appearance-none bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          )}
          {isStaff && (
            <button
              onClick={onAddNewItem}
              className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Item
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
      </div>
    </header>
  );
};

export default Header;