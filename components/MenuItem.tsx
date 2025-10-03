import React from "react";
import { IMenuItem, ICurrency, UserRole } from "../types";

interface MenuItemProps {
  item: IMenuItem;
  currency: ICurrency;
  onAddToOrder: (item: IMenuItem) => void;
  onEditItem: (item: IMenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  userRole: UserRole;
}

const MenuItem: React.FC<MenuItemProps> = ({
  item,
  currency,
  onAddToOrder,
  onEditItem,
  onDeleteItem,
  userRole,
}) => {
  const convertedPrice = (item.price * currency.rate).toFixed(2);

  return (
    <div className="relative bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-200 dark:border-gray-600">
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
        <button
          onClick={() => onEditItem(item)}
          className="p-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-700"
          aria-label={`Edit ${item.name}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={() => onDeleteItem(item.id)}
          className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-700"
          aria-label={`Delete ${item.name}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-full h-20 object-cover"
      />
      <div className="p-4 flex flex-col justify-between h-30">
        <div>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-md text-gray-800 dark:text-gray-100">
              {item.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-bold">
              {currency.symbol}
              {convertedPrice}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAddToOrder(item)}
          className="w-full mt-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-100 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 font-semibold text-sm"
        >
          Add to Order
        </button>
      </div>
    </div>
  );
};

export default MenuItem;
