import React from 'react';
import { IMenuItem, ICurrency, UserRole, IMenuItemVariant } from '../types';

interface MenuItemProps {
  item: IMenuItem;
  currency: ICurrency;
  onAddToOrder: (item: IMenuItem, variant: IMenuItemVariant) => void;
  onEditItem: (item: IMenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  userRole: UserRole;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, currency, onAddToOrder, onEditItem, onDeleteItem, userRole }) => {

  return (
    <div className="relative bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-200 dark:border-gray-600 flex flex-col">
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
              <button 
                  onClick={() => onEditItem(item)}
                  className="p-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-700"
                  aria-label={`Edit ${item.name}`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
              </button>
               <button 
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-700"
                  aria-label={`Delete ${item.name}`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
        </div>
      <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 truncate">{item.name}</h3>
          <div className="mt-2 space-y-1">
            {item.variants.map(variant => (
                <div key={variant.name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{variant.name}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                        {currency.symbol}{(variant.price * currency.rate).toFixed(2)}
                    </span>
                </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col space-y-2">
            {item.variants.map(variant => (
                 <button
                    key={variant.name}
                    onClick={() => onAddToOrder(item, variant)}
                    className="w-full bg-indigo-50 text-indigo-600 px-3 py-2 rounded-md hover:bg-indigo-100 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 font-semibold text-sm"
                    >
                    Add {variant.name}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;