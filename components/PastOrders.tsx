
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { IOrder, PaymentMethod } from '../types';
import { ORDERS_PER_PAGE } from '../constants';
import { api } from '../services/api';
import { logger } from '../services/logger';

interface PastOrdersProps {
  onViewOrder: (order: IOrder) => void;
}

type SortKey = 'customer.name' | 'date' | 'total';
type SortOrder = 'asc' | 'desc';

const PastOrders: React.FC<PastOrdersProps> = ({ onViewOrder }) => {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<'today' | 'single' | 'range'>('today');
    const today = new Date().toISOString().split('T')[0];
    const [singleDate, setSingleDate] = useState(today);
    const [dateRange, setDateRange] = useState({ start: today, end: today });
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: String(ORDERS_PER_PAGE),
                search: searchQuery,
                sortBy: sortKey,
                sortOrder,
                paymentFilter,
                filterType,
            });

            if (filterType === 'single') {
                params.append('singleDate', singleDate);
            } else if (filterType === 'range') {
                params.append('dateStart', dateRange.start);
                params.append('dateEnd', dateRange.end);
            }

            const response = await api.get(`/orders?${params.toString()}`);
            setOrders(response.data);
            setTotalPages(response.totalPages);

        } catch (err) {
            const message = (err as Error).message;
            setError('Could not load order history.');
            logger.error('Failed to fetch past orders', { error: message });
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery, sortKey, sortOrder, paymentFilter, filterType, singleDate, dateRange]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, paymentFilter, filterType, singleDate, dateRange, sortKey, sortOrder]);


    const orderSummary = useMemo(() => {
        // This summary can only be calculated for the currently loaded page of data.
        // A full summary would require a separate API endpoint or loading all data.
        // For now, let's show summary for the visible data.
        return orders.reduce((acc, order) => {
            acc.count += 1;
            acc.totalAmount += order.total;
            acc.totalTax += order.tax;
            return acc;
        }, { count: 0, totalAmount: 0, totalTax: 0 });
    }, [orders]);


    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'date' ? 'desc' : 'asc'); // Default desc for date, asc for others
        }
    };
    
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
        }
    };
    
    const handleExportCSV = async () => {
        // To export all filtered data, we need a new endpoint or fetch all pages.
        // Let's create a new endpoint for simplicity and performance.
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                sortBy: sortKey,
                sortOrder,
                paymentFilter,
                filterType,
            });
            if (filterType === 'single') params.append('singleDate', singleDate);
            else if (filterType === 'range') {
                params.append('dateStart', dateRange.start);
                params.append('dateEnd', dateRange.end);
            }
            // Assume the backend can handle a request without page/limit for export
            const allOrdersToExport = await api.get(`/orders?${params.toString()}&limit=0`);

            if (allOrdersToExport.data.length === 0) return;

            const headers = ['Order ID', 'Customer Name', 'Date', 'Total Amount', 'Currency', 'Tax Collected', 'Payment Method'];
            const escapeCsvCell = (cellData: any) => {
                const stringData = String(cellData);
                if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
                    return `"${stringData.replace(/"/g, '""')}"`;
                }
                return stringData;
            };

            const csvContent = [
                headers.join(','),
                ...allOrdersToExport.data.map((order: IOrder) => [
                    order.id,
                    order.customer.name,
                    new Date(order.date).toISOString().replace('T', ' ').substring(0, 19),
                    (order.total * order.currency.rate).toFixed(2),
                    order.currency.code,
                    (order.tax * order.currency.rate).toFixed(2),
                    order.paymentMethod
                ].map(escapeCsvCell).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `quickbill_orders_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Failed to export CSV', { error: (err as Error).message });
            alert('Could not export data. Please try again.');
        }
    };


    const SortIcon = ({ order }: { order: SortOrder }) => {
        const path = order === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
        return (
             <svg className="w-4 h-4 ml-1 opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" d={path} />
            </svg>
        )
    };
    
    const PaymentIcon: React.FC<{method: PaymentMethod}> = ({ method }) => {
        const icons = {
            cash: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-.567-.267C8.07 8.488 8 8.735 8 9s.07 1.512.433 1.65A2.5 2.5 0 009 11.302v1.698c-.22.071-.41.164-.567-.267C8.07 13.512 8 13.265 8 13s.07-1.512.433-1.65z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.68.45c-.5.222-.82.68-.82 1.275 0 .613.332 1.09.835 1.343.481.244.96.442 1.22.618.26.176.44.37.44.646 0 .24-.133.435-.433.567a2.5 2.5 0 01-1.133.01c-.482-.12-.835-.47-.835-.937a1 1 0 10-2 0c0 .98.606 1.815 1.646 2.123v.091a1 1 0 102 0v-.09a4.5 4.5 0 001.68-.45c.5-.222-.82-.68.82-1.275 0-.613-.332-1.09-.835-1.343-.481-.244-.96-.442-1.22-.618-.26-.176-.44-.37-.44-.646 0-.24.133-.435.433.567a2.5 2.5 0 011.133-.01c.482.12.835.47.835.937a1 1 0 102 0c0-.98-.606-1.815-1.646-2.123v-.091z" clipRule="evenodd" /></svg>,
            card: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm3 0a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
            upi: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        };
        return <div className="flex items-center gap-2">{icons[method]} <span className="hidden md:inline">{method.toUpperCase()}</span></div>;
    };


    return (
        <>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">Order History</h2>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="filterType" value="today" checked={filterType === 'today'} onChange={() => setFilterType('today')} className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"/>
                            <span className="text-gray-700 dark:text-gray-200">Today</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="filterType" value="single" checked={filterType === 'single'} onChange={() => setFilterType('single')} className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"/>
                            <span className="text-gray-700 dark:text-gray-200">Specific Date</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="filterType" value="range" checked={filterType === 'range'} onChange={() => setFilterType('range')} className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"/>
                            <span className="text-gray-700 dark:text-gray-200">Date Range</span>
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        {filterType === 'single' && (
                            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="form-input px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"/>
                        )}
                        {filterType === 'range' && (
                            <>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="form-input px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"/>
                            <span className="text-gray-500 dark:text-gray-400">to</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="form-input px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"/>
                            </>
                        )}
                    </div>
                     <div className="relative">
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentMethod)}
                            className="form-select px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                        >
                            <option value="all">All Payments</option>
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="card">Card</option>
                        </select>
                    </div>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search Customer, ID, Amount..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input w-full sm:w-64 pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
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
                </div>
                 <button
                    onClick={handleExportCSV}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export to CSV
                </button>
            </div>

            {/* Summary Header - this is now a summary of the current page */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Orders on this Page</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{orderSummary.count}</p>
                </div>
                 <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm font-medium text-green-600 dark:text-green-300">Page Amount</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">₹{orderSummary.totalAmount.toFixed(2)}</p>
                </div>
                 <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg text-center">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Page Tax Collected</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">₹{orderSummary.totalTax.toFixed(2)}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading orders...</p>
                ) : error ? (
                    <p className="text-center py-8 text-red-500">{error}</p>
                ) : orders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No orders found for the selected filters.</p>
                ) : (
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Order ID</th>
                            <th scope="col" className="px-6 py-3">
                                <div className="flex items-center cursor-pointer select-none" onClick={() => handleSort('customer.name')}>
                                    Customer
                                    {sortKey === 'customer.name' && <SortIcon order={sortOrder} />}
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <div className="flex items-center cursor-pointer select-none" onClick={() => handleSort('date')}>
                                    Date
                                    {sortKey === 'date' && <SortIcon order={sortOrder} />}
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3">Payment</th>
                            <th scope="col" className="px-6 py-3">
                               <div className="flex items-center justify-end cursor-pointer select-none" onClick={() => handleSort('total')}>
                                    Total Amount
                                    {sortKey === 'total' && <SortIcon order={sortOrder} />}
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {orders.map((order) => (
                        <tr key={order.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 break-all" title={order.id}>{order.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{order.customer.name}</td>
                            <td className="px-6 py-4">{new Date(order.date).toLocaleString()}</td>
                            <td className="px-6 py-4"><PaymentIcon method={order.paymentMethod} /></td>
                            <td className="px-6 py-4 text-right font-semibold">{order.currency.symbol}{(order.total * order.currency.rate).toFixed(2)}</td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => onViewOrder(order)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">View</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
            </div>
            
            {totalPages > 1 && !isLoading && (
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
        </>
    );
};

export default PastOrders;
