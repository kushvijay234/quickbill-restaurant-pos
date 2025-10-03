
import React, { useState, useEffect, useCallback } from 'react';
import { IMenuItem, ICurrency, UserRole } from '../types';
import MenuItem from './MenuItem';
import { api } from '../services/api';
import { logger } from '../services/logger';

interface MenuListProps {
  currency: ICurrency;
  onAddToOrder: (item: IMenuItem) => void;
  onEditItem: (item: IMenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteMultipleItems: (itemIds: string[]) => void;
  userRole: UserRole;
  refreshKey: number;
}

type SortKey = 'name' | 'price' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12;

const MenuList: React.FC<MenuListProps> = ({ currency, onAddToOrder, onEditItem, onDeleteItem, onDeleteMultipleItems, userRole, refreshKey }) => {
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [selectedItemIds, setSelectedItemIds] = useState(new Set<string>());

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedItemIds(new Set());
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        search: searchQuery,
        sortBy: sortKey,
        sortOrder: sortOrder,
      });
      const response = await api.get(`/menu?${params.toString()}`);
      setMenuItems(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err) {
      const message = (err as Error).message;
      setError('Could not load menu items.');
      logger.error('Failed to fetch menu items', { error: message });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, sortKey, sortOrder]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems, refreshKey]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'createdAt' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };
  
  const handleSelectItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === menuItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(menuItems.map(item => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    onDeleteMultipleItems(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
  };
  
  const isAdmin = userRole === 'admin';
  
  const SortIcon = ({ order }: { order: SortOrder }) => {
    const path = order === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
    return (
         <svg className="w-4 h-4 ml-1 opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    )
  };

  const cardView = (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {menuItems.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          currency={currency}
          onAddToOrder={onAddToOrder}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          userRole={userRole}
        />
      ))}
    </div>
  );
  
  const tableView = (
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                      {isAdmin && (
                        <th scope="col" className="p-4">
                            <input type="checkbox" className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                checked={selectedItemIds.size === menuItems.length && menuItems.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                      )}
                      <th scope="col" className="px-6 py-3">
                        <div className="flex items-center cursor-pointer select-none" onClick={() => handleSort('name')}>
                          Item
                          {sortKey === 'name' && <SortIcon order={sortOrder} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                         <div className="flex items-center cursor-pointer select-none" onClick={() => handleSort('price')}>
                          Price
                          {sortKey === 'price' && <SortIcon order={sortOrder} />}
                         </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {menuItems.map(item => (
                      <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {isAdmin && (
                              <td className="w-4 p-4">
                                <input type="checkbox" className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    checked={selectedItemIds.has(item.id)}
                                    onChange={() => handleSelectItem(item.id)}
                                />
                              </td>
                            )}
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-3">
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                              {item.name}
                          </th>
                          <td className="px-6 py-4">{currency.symbol}{(item.price * currency.rate).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => onAddToOrder(item)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Add</button>
                              <button onClick={() => onEditItem(item)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                              <button onClick={() => onDeleteItem(item.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );
  
    const renderContent = () => {
    if (isLoading) {
      return <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading menu...</p>;
    }
    if (error) {
      return <p className="text-center py-8 text-red-500">{error}</p>;
    }
    if (totalItems === 0 && !searchQuery) {
        return (
            <div className="text-center py-8 col-span-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                <h3 className="mt-2 text-xl font-semibold text-gray-700 dark:text-gray-200">Your Menu is Empty</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by clicking the "Add Item" button.</p>
            </div>
        );
    }
    if (menuItems.length === 0 && searchQuery) {
        return (
            <div className="text-center py-8 col-span-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <h3 className="mt-2 text-xl font-semibold text-gray-700 dark:text-gray-200">No Items Found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your search for "{searchQuery}" did not match any items.</p>
            </div>
        );
    }
    return viewMode === 'card' ? cardView : tableView;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Menu</h2>
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
                {searchQuery && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-700"
                            aria-label="Clear search"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            {totalItems > 0 && (
              <div className="flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                  <button onClick={() => setViewMode('card')} className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                   <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  </button>
              </div>
            )}
        </div>
      </div>
      
      {isAdmin && selectedItemIds.size > 0 && viewMode === 'table' && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-gray-900/50 p-3 rounded-lg mb-4 border border-indigo-200 dark:border-indigo-800">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedItemIds.size} items selected</span>
              <button onClick={handleDeleteSelected} className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Selected
              </button>
          </div>
      )}

      {renderContent()}

       {totalPages > 1 && !isLoading && !error && menuItems.length > 0 && (
         <div className="mt-8 flex justify-center items-center space-x-4 text-sm">
             <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Prev
             </button>
             <span className="text-gray-700 dark:text-gray-300 font-medium">
                Page {currentPage} of {totalPages}
             </span>
             <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
             </button>
         </div>
      )}
    </div>
  );
};

export default MenuList;
