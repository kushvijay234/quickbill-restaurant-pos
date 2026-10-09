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
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (selectedUserId !== 'all') {
                params.append('userId', selectedUserId);
            }
            if (selectedSource !== 'all') {
                params.append('source', selectedSource);
            }
            if (selectedLevel !== 'all') {
                params.append('level', selectedLevel);
            }
            const logsData = await api.get(`/admin/logs?${params.toString()}`);
            setLogs(Array.isArray(logsData) ? logsData : []);
        } catch (err) {
            const message = (err as Error).message;
            setError(message);
            logger.error('Failed to fetch admin logs', { error: message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedUserId, selectedSource, selectedLevel]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersData = await api.get('/admin/users');
                setUsers(Array.isArray(usersData) ? usersData : []);
            } catch (err) {
                logger.error('Failed to fetch users for log filter', { error: (err as Error).message });
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getLevelBadge = (level: ILog['level']) => {
        switch (level) {
            case 'info':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
            case 'warn':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
            case 'error':
                return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border border-red-200 dark:border-red-800';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getSourceBadge = (source?: string) => {
        switch (source) {
            case 'mobile':
                return {
                    label: '📱 Mobile',
                    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
                };
            case 'web':
                return {
                    label: '🌐 Web App',
                    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                };
            case 'backend':
                return {
                    label: '⚙️ Backend',
                    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
                };
            case 'system':
                return {
                    label: '🖥️ System',
                    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700',
                };
            default:
                return {
                    label: '🌐 Web',
                    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                };
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedLogId(prev => (prev === id ? null : id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Application Error & Event Logs</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Real-time audit log of errors occurring in web, mobile, and backend services.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Source Filter */}
                    <div>
                        <select
                            id="logSourceFilter"
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            className="text-xs sm:text-sm px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Sources</option>
                            <option value="web">🌐 Web App</option>
                            <option value="mobile">📱 Mobile App</option>
                            <option value="backend">⚙️ Backend API</option>
                            <option value="system">🖥️ System</option>
                        </select>
                    </div>

                    {/* Level Filter */}
                    <div>
                        <select
                            id="logLevelFilter"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="text-xs sm:text-sm px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Levels</option>
                            <option value="error">🚨 Errors Only</option>
                            <option value="warn">⚠️ Warnings Only</option>
                            <option value="info">ℹ️ Info Only</option>
                        </select>
                    </div>

                    {/* User Filter */}
                    <div>
                        <select
                            id="userLogFilter"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="text-xs sm:text-sm px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Users</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    👤 {user.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchLogs}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading && logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-3" />
                        <p>Loading database error logs...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th scope="col" className="px-5 py-3.5">Timestamp</th>
                                    <th scope="col" className="px-5 py-3.5">Source</th>
                                    <th scope="col" className="px-5 py-3.5">Level</th>
                                    <th scope="col" className="px-5 py-3.5">Message / Endpoint</th>
                                    <th scope="col" className="px-5 py-3.5">User</th>
                                    <th scope="col" className="px-5 py-3.5 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.length > 0 ? (
                                    logs.map((log) => {
                                        const sourceBadge = getSourceBadge(log.source);
                                        const isExpanded = expandedLogId === log.id;
                                        const username = typeof log.userId === 'object' && log.userId?.username 
                                            ? log.userId.username 
                                            : 'Guest / System';

                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr className={`hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors ${isExpanded ? 'bg-gray-50/60 dark:bg-gray-700/30' : ''}`}>
                                                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${sourceBadge.className}`}>
                                                            {sourceBadge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${getLevelBadge(log.level)}`}>
                                                            {log.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 max-w-md">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                                                            {log.message}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {log.endpoint && (
                                                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                                                                    {log.endpoint}
                                                                </span>
                                                            )}
                                                            {log.statusCode && (
                                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                                                    log.statusCode >= 500
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300'
                                                                }`}>
                                                                    HTTP {log.statusCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        {username}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => toggleExpand(log.id)}
                                                            className="text-xs px-2.5 py-1.5 rounded-md font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800/60 transition-colors"
                                                        >
                                                            {isExpanded ? 'Hide' : 'View Stack'}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr className="bg-gray-50/90 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
                                                        <td colSpan={6} className="px-6 py-4">
                                                            <div className="space-y-3 text-xs">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                                                                    <div>
                                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">Platform / Device: </span>
                                                                        <span className="font-mono text-gray-700 dark:text-gray-300">{log.platform || 'N/A'}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">Tenant Slug: </span>
                                                                        <span className="font-mono text-gray-700 dark:text-gray-300">{log.tenantSlug || 'Global / Unassigned'}</span>
                                                                    </div>
                                                                </div>

                                                                {log.stack && (
                                                                    <div>
                                                                        <div className="font-semibold text-red-600 dark:text-red-400 mb-1">
                                                                            Stack Trace:
                                                                        </div>
                                                                        <pre className="p-3 bg-gray-900 text-gray-100 dark:bg-black rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed max-h-56">
                                                                            {log.stack}
                                                                        </pre>
                                                                    </div>
                                                                )}

                                                                {log.meta && Object.keys(log.meta).length > 0 && (
                                                                    <div>
                                                                        <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                                                            Context Metadata:
                                                                        </div>
                                                                        <pre className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed max-h-48 border border-gray-200 dark:border-gray-700">
                                                                            {JSON.stringify(log.meta, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            No logs found matching selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLogs;
