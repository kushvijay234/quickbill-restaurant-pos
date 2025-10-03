import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { ILog, IUser } from '../../types';
import { logger } from '../../services/logger';

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<ILog[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');

    const fetchLogs = useCallback(async (userId: string) => {
        setIsLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (userId !== 'all') {
                params.append('userId', userId);
            }
            const logsData = await api.get(`/admin/logs?${params.toString()}`);
            setLogs(logsData);
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to fetch admin logs', { error: message });
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        const fetchUsers = async () => {
             try {
                const usersData = await api.get('/admin/users');
                setUsers(usersData);
            } catch (err) {
                logger.error('Failed to fetch users for log filter', { error: (err as Error).message });
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs(selectedUserId);
    }, [selectedUserId, fetchLogs]);

    const getLevelColor = (level: ILog['level']) => {
        switch (level) {
            case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">User Activity Logs</h2>
                 <div>
                    <label htmlFor="userLogFilter" className="sr-only">Filter by User</label>
                    <select 
                        id="userLogFilter"
                        value={selectedUserId} 
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="form-select px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:text-white sm:text-sm"
                    >
                        <option value="all">All Users</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                    </select>
                </div>
            </div>

            {error && <p className="text-red-500 text-center p-4">{error}</p>}

            <div className="overflow-x-auto">
                {isLoading ? <p className="text-center p-8 text-gray-500 dark:text-gray-400">Loading Logs...</p> : (
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Timestamp</th>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Level</th>
                                <th scope="col" className="px-6 py-3">Message</th>
                                <th scope="col" className="px-6 py-3">Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map(log => (
                                <tr key={log.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.userId?.username || 'System'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>{log.level.toUpperCase()}</span>
                                    </td>
                                    <td className="px-6 py-4">{log.message}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{log.meta ? JSON.stringify(log.meta) : ''}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No logs found for selected user.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminLogs;
