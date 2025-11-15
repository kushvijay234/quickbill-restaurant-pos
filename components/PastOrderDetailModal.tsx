

import React from 'react';
import { IOrder, IProfile } from '../types';

interface PastOrderDetailModalProps {
  order: IOrder;
  profile: IProfile | null;
  onClose: () => void;
}

const PastOrderDetailModal: React.FC<PastOrderDetailModalProps> = ({ order, profile, onClose }) => {
  const { id, customer, currency, items, date, paymentMethod } = order;
  
  // For backward compatibility with orders made before tax was introduced
  const subtotal = order.subtotal ?? order.total;
  const tax = order.tax ?? 0;
  const total = order.total;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-sm m-4 transition-colors duration-300">
        <div className="text-center mb-6">
          {profile?.logoUrl && (
            <img src={profile.logoUrl} alt="Restaurant Logo" className="mx-auto h-20 w-auto object-contain mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order Details</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.restaurantName || 'QuickBill Restaurant'}</p>
        </div>
        
        <div className="mb-4 text-gray-700 dark:text-gray-300">
            <p className="text-sm"><span className="font-semibold">Order ID:</span> <span className="font-mono text-xs">{id}</span></p>
            <p className="text-sm"><span className="font-semibold">Billed to:</span> {customer.name}</p>
            <p className="text-sm"><span className="font-semibold">Mobile:</span> {customer.mobile}</p>
            <p className="text-sm"><span className="font-semibold">Date:</span> {new Date(date).toLocaleString()}</p>
            <p className="text-sm"><span className="font-semibold">Payment:</span> {paymentMethod.toUpperCase()}</p>
        </div>

        <table className="w-full text-sm text-gray-800 dark:text-gray-200">
            <thead>
                <tr className="border-b-2 border-dashed border-gray-300 dark:border-gray-600">
                    <th className="text-left font-semibold pb-2">Item</th>
                    <th className="text-center font-semibold pb-2">Qty</th>
                    <th className="text-right font-semibold pb-2">Total</th>
                </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
                {items.map(({ item, quantity, selectedVariant }) => (
                    <tr key={`${item.id}-${selectedVariant.name}`} className="border-b border-dashed border-gray-300 dark:border-gray-600">
                        <td className="py-2">{item.name} <span className="text-xs">({selectedVariant.name})</span></td>
                        <td className="text-center">{quantity}</td>
                        <td className="text-right">{(selectedVariant.price * quantity * currency.rate).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300 dark:border-gray-600 text-right text-sm text-gray-800 dark:text-gray-200">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currency.symbol}{(subtotal * currency.rate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Tax:</span>
                <span>{currency.symbol}{(tax * currency.rate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-1">
                <span>Total:</span>
                <span>{currency.symbol}{(total * currency.rate).toFixed(2)}</span>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastOrderDetailModal;