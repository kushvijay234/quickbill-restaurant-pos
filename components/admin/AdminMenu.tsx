import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { IMenuItem, IUser } from '../../types';
import { logger } from '../../services/logger';

const AdminMenu: React.FC = () => {
    const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state for adding a new item
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [menuData, usersData] = await Promise.all([
                api.get('/admin/menu'),
                api.get('/admin/users')
            ]);
            setMenuItems(menuData);
            const staffUsers = usersData.filter((u: IUser) => u.role === 'staff');
            setUsers(staffUsers);
            if (staffUsers.length > 0) {
                setSelectedUserId(staffUsers[0].id);
            }
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to fetch admin menu data', { error: message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name || !price || !imageUrl || !selectedUserId) {
            setError('All fields are required.');
            return;
        }
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber) || priceNumber <= 0) {
            setError('Please enter a valid price.');
            return;
        }

        try {
            const newItem = { name, price: priceNumber, imageUrl, userId: selectedUserId };
            await api.post('/admin/menu', newItem);
            
            // Reset form
            setName('');
            setPrice('');
            setImageUrl('');

            setSuccess(`Item '${name}' added successfully.`);
            fetchData();
        } catch(err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to add menu item as admin', { error: message });
        }
    };


    if (isLoading) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading Menu Items...</p>;

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">All Menu Items</h2>
            
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Add Item for a User</h3>
                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input type="text" placeholder="Item Name" value={name} onChange={e => setName(e.target.value)} className="form-input lg:col-span-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"/>
                    <input type="number" placeholder="Price (INR)" value={price} onChange={e => setPrice(e.target.value)} className="form-input px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"/>
                    <input type="text" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="form-input md:col-span-2 lg:col-span-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"/>
                    
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="form-select lg:col-span-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm">
                        {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                    </select>

                    <button type="submit" className="lg:col-span-3 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium">Add Item</button>
                </form>
                 {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                 {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Item Name</th>
                            <th scope="col" className="px-6 py-3">Assigned To</th>
                            <th scope="col" className="px-6 py-3 text-right">Price (INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuItems.map(item => (
                            <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-3">
                                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                                    {item.name}
                                </td>
                                <td className="px-6 py-4">{(item.userId as any)?.username || 'N/A'}</td>
                                {/* FIX: Correctly display price from variants array */}
                                <td className="px-6 py-4 text-right font-semibold">{item.variants.map(v => `₹${v.price.toFixed(2)} (${v.name})`).join(' / ')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminMenu;
