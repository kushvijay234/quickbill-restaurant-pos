import React from 'react';
import { ICurrency, PaymentMethod } from '../types';

interface PaymentModalProps {
  total: number;
  currency: ICurrency;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, currency, onClose, onConfirm }) => {
  const convertedTotal = (total * currency.rate).toFixed(2);
  // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactElement }[] = [
    { 
      method: 'cash', 
      label: 'Cash', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-.567-.267C8.07 8.488 8 8.735 8 9s.07 1.512.433 1.65A2.5 2.5 0 009 11.302v1.698c-.22.071-.41.164-.567-.267C8.07 13.512 8 13.265 8 13s.07-1.512.433-1.65z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.68.45c-.5.222-.82.68-.82 1.275 0 .613.332 1.09.835 1.343.481.244.96.442 1.22.618.26.176.44.37.44.646 0 .24-.133.435-.433.567a2.5 2.5 0 01-1.133.01c-.482-.12-.835-.47-.835-.937a1 1 0 10-2 0c0 .98.606 1.815 1.646 2.123v.091a1 1 0 102 0v-.09a4.5 4.5 0 001.68-.45c.5-.222.82-.68.82-1.275 0-.613-.332-1.09-.835-1.343-.481-.244-.96-.442-1.22-.618-.26-.176-.44-.37-.44-.646 0-.24.133-.435.433-.567a2.5 2.5 0 011.133-.01c.482.12.835.47.835.937a1 1 0 102 0c0-.98-.606-1.815-1.646-2.123v-.091z" clipRule="evenodd" /></svg>
    },
    { 
      method: 'card', 
      label: 'Card', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm3 0a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
    },
    { 
      method: 'upi', 
      label: 'UPI', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 transition-colors duration-300">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Confirm Payment</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-center mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-lg text-gray-600 dark:text-gray-300">Total Amount Due</p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{currency.symbol}{convertedTotal}</p>
        </div>
        <p className="text-center text-md font-medium text-gray-700 dark:text-gray-300 mb-6">Select a payment method to complete the order.</p>

        <div className="grid grid-cols-3 gap-4">
            {paymentMethods.map(({ method, label, icon }) => (
                <button
                    key={method}
                    onClick={() => onConfirm(method)}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-transparent hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                    <div className="text-indigo-600 dark:text-indigo-400 mb-2">{icon}</div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{label}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
