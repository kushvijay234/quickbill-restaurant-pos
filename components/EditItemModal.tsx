import React, { useState } from 'react';
import { IMenuItem, IMenuItemVariant } from '../types';

interface EditItemModalProps {
  item: IMenuItem;
  onClose: () => void;
  onUpdateItem: (updatedItem: IMenuItem) => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, onClose, onUpdateItem }) => {
  const [name, setName] = useState(item.name);
  const [variants, setVariants] = useState(item.variants.map(v => ({...v, price: String(v.price) })));
  const [error, setError] = useState('');

  const handleVariantChange = (index: number, field: 'name' | 'price', value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Item name cannot be empty.');
      return;
    }
    
    const processedVariants: IMenuItemVariant[] = [];
    for (const variant of variants) {
      if (!variant.name.trim() || !variant.price.trim()) {
        setError('All variant names and prices are required.');
        return;
      }
      const priceNumber = parseFloat(variant.price);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        setError(`Please enter a valid price for variant "${variant.name}".`);
        return;
      }
      processedVariants.push({ name: variant.name.trim(), price: priceNumber });
    }
    
    if (processedVariants.length === 0) {
        setError('At least one price variant is required.');
        return;
    }

    onUpdateItem({ ...item, name, variants: processedVariants });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg m-4 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Menu Item</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemNameEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
            <input
              type="text"
              id="itemNameEdit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
              autoFocus
            />
          </div>
          
           <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price Variants</label>
            {variants.map((variant, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                  placeholder="e.g., Half, Full"
                />
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                  placeholder="Price (INR)"
                />
                {variants.length > 1 && (
                  <button type="button" onClick={() => handleRemoveVariant(index)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddVariant} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                + Add another variant
            </button>
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;