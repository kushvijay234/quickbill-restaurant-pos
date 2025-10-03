import React, { useState } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminMenu from './admin/AdminMenu';
import AdminOrders from './admin/AdminOrders';
import AdminLogs from './admin/AdminLogs';

type AdminViewId = 'dashboard' | 'users' | 'menu' | 'orders' | 'logs';

const navItems = [
    {
        id: 'dashboard' as AdminViewId,
        label: 'Dashboard',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
        component: AdminDashboard,
    },
    {
        id: 'users' as AdminViewId,
        label: 'Users',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 3.375c-3.418 0-6.167 2.673-6.167 5.952 0 3.278 2.75 5.951 6.167 5.951s6.167-2.673 6.167-5.951C18.167 6.048 15.418 3.375 12 3.375z" /></svg>,
        component: AdminUsers,
    },
    {
        id: 'menu' as AdminViewId,
        label: 'Menu Items',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
        component: AdminMenu,
    },
    {
        id: 'orders' as AdminViewId,
        label: 'Orders',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
        component: AdminOrders,
    },
    {
        id: 'logs' as AdminViewId,
        label: 'User Logs',
        icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
        component: AdminLogs,
    },
];


const AdminPanel: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminViewId>('dashboard');

    const ActiveComponent = navItems.find(item => item.id === activeView)?.component || AdminDashboard;

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="md:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg h-full">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 px-2">Admin Menu</h2>
                    <nav className="space-y-2">
                        {navItems.map(item => {
                             const isActive = item.id === activeView;
                             const activeClasses = 'bg-indigo-100 dark:bg-gray-700 text-indigo-600 dark:text-gray-100';
                             const inactiveClasses = 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
                             return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
                                >
                                    {React.cloneElement(item.icon, { className: 'h-5 w-5 mr-3' })}
                                    {item.label}
                                </button>
                             )
                        })}
                    </nav>
                </div>
            </aside>
            <main className="flex-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-300 min-h-[600px]">
                    <ActiveComponent />
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;