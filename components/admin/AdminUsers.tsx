import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { IUser } from '../../types';
import { logger } from '../../services/logger';
import ResetPasswordModal from './ResetPasswordModal';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [userToReset, setUserToReset] = useState<IUser | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/admin/users');
            setUsers(data);
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to fetch users', { error: message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!newUsername || !newPassword) {
            setError('Username and password are required.');
            return;
        }
        try {
            await api.post('/admin/users', { username: newUsername, password: newPassword });
            setNewUsername('');
            setNewPassword('');
            setShowPassword(false);
            setSuccess(`User '${newUsername}' created successfully.`);
            fetchUsers();
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to add user', { error: message });
        }
    };

    if (isLoading) return <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading Users...</p>;

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Manage Users</h2>
            
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Add New Staff Member</h3>
                <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-4 items-start">
                    <input
                        type="text"
                        placeholder="New Staff Username"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="form-input flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                    />
                    <div className="relative flex-grow w-full sm:w-auto">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="New Staff Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="form-input w-full px-3 py-2 pr-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium w-full sm:w-auto">Add Staff</button>
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Username</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>{user.role}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {user.role === 'staff' && (
                                        <button onClick={() => setUserToReset(user)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                            Reset Password
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {userToReset && (
                <ResetPasswordModal 
                    user={userToReset}
                    onClose={() => setUserToReset(null)}
                    onSuccess={(message) => {
                        setSuccess(message);
                        setUserToReset(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminUsers;
