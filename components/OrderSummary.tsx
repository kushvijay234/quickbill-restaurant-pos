
import React from 'react';
import { IOrderItem, ICustomer, ICurrency } from '../types';
import { TAX_RATE } from '../constants';

interface OrderSummaryProps {
  orderItems: IOrderItem[];
  currency: ICurrency;
  customer: ICustomer;
  onCustomerChange: (customer: ICustomer) => void;
  onQuantityChange: (itemId: string, variantName: string, newQuantity: number) => void;
  onClearOrder: () => void;
  onProceedToPayment: () => void;
  subtotal: number;
  tax: number;
  total: number;
  isTaxIncluded: boolean;
  onToggleTax: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderItems,
  currency,
  customer,
  onCustomerChange,
  onQuantityChange,
  onClearOrder,
  onProceedToPayment,
  subtotal,
  tax,
  total,
  isTaxIncluded,
  onToggleTax,
}) => {
  const convertedSubtotal = (subtotal * currency.rate).toFixed(2);
  const convertedTax = (tax * currency.rate).toFixed(2);
  const convertedTotal = (total * currency.rate).toFixed(2);

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">Current Order</h2>
      
      <div className="space-y-4 mb-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
          <input
            type="text"
            id="customerName"
            value={customer.name}
            onChange={(e) => onCustomerChange({ ...customer, name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
            placeholder="Walk-in Customer"
          />
        </div>
        <div>
          <label htmlFor="customerMobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number (Optional)</label>
          <input
            type="text"
            id="customerMobile"
            value={customer.mobile}
            onChange={(e) => onCustomerChange({ ...customer, mobile: e.target.value })}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
            placeholder="9876543210"
          />
        </div>
      </div>
      
      <div className="max-h-64 overflow-y-auto pr-2">
        {orderItems.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Your order is empty.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {orderItems.map(({ item, quantity, selectedVariant }) => (
              <li key={`${item.id}-${selectedVariant.name}`} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{item.name} <span className="text-xs text-gray-500">({selectedVariant.name})</span></p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currency.symbol}{(selectedVariant.price * currency.rate).toFixed(2)}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => onQuantityChange(item.id, selectedVariant.name, quantity - 1)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold w-6 h-6 rounded-full">-</button>
                  <span className="w-8 text-center dark:text-gray-200">{quantity}</span>
                  <button onClick={() => onQuantityChange(item.id, selectedVariant.name, quantity + 1)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold w-6 h-6 rounded-full">+</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex justify-between items-center text-md text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{currency.symbol}{convertedSubtotal}</span>
        </div>
        <div className="flex justify-between items-center text-md text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
                 <span className="mr-2">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                 <button
                    type="button"
                    onClick={onToggleTax}
                    className={`${
                        isTaxIncluded ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800`}
                    role="switch"
                    aria-checked={isTaxIncluded}
                >
                    <span className="sr-only">Include Tax</span>
                    <span
                        aria-hidden="true"
                        className={`${
                            isTaxIncluded ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                </button>
            </div>
            <span>{currency.symbol}{convertedTax}</span>
        </div>
        <div className="flex justify-between items-center text-xl font-bold text-gray-800 dark:text-gray-100 mt-2">
          <span>Total</span>
          <span>{currency.symbol}{convertedTotal}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClearOrder}
            className="bg-red-100 text-red-700 px-4 py-3 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 font-semibold"
          >
            Clear
          </button>
          <button
            onClick={onProceedToPayment}
            className="bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 font-semibold"
          >
            Save & Print Bill
          </button>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;
