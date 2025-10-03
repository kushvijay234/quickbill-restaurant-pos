import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { IOrder, IUser } from '../../types';
import { logger } from '../../services/logger';

const AdminOrders: React.FC = () => {
    const [allOrders, setAllOrders] = useState<IOrder[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [ordersData, usersData] = await Promise.all([
                api.get('/admin/orders'),
                api.get('/admin/users')
            ]);
            setAllOrders(ordersData);
            setUsers(usersData.filter((u: IUser) => u.role === 'staff'));
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to fetch admin orders data', { error: message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const filteredOrders = useMemo(() => {
        if (selectedUserId === 'all') {
            return allOrders;
        }
        return allOrders.filter(order => (order.userId as any)?._id === selectedUserId || (order.userId as any)?.id === selectedUserId);
    }, [allOrders, selectedUserId]);

    if (isLoading) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading Orders...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">All Orders</h2>
                <div>
                    <label htmlFor="userFilter" className="sr-only">Filter by User</label>
                    <select 
                        id="userFilter"
                        value={selectedUserId} 
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="form-select px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                    >
                        <option value="all">All Staff</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                    </select>
                </div>
            </div>
            
            {error && <p className="text-red-500 text-center p-4">{error}</p>}
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Order ID</th>
                            <th scope="col" className="px-6 py-3">Staff Member</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                            <tr key={order.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{order.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{(order.userId as any)?.username || 'N/A'}</td>
                                <td className="px-6 py-4">{order.customer.name}</td>
                                <td className="px-6 py-4">{new Date(order.date).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right font-semibold">{order.currency.symbol}{(order.total * order.currency.rate).toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No orders found for selected user.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrders;
