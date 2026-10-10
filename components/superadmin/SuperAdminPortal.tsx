import React, { useState, useEffect, useCallback } from 'react';
import { ISuperAdminUser, ISuperAdminStats, ISuperAdminTenant } from '../../types';
import FastBilloLogo from '../common/FastBilloLogo';
import { CANONICAL_PLANS } from '../../constants';

interface SuperAdminPortalProps {
  user: ISuperAdminUser;
  token: string;
  onLogout: () => void;
  onExitToPos: () => void;
}

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ user, token, onLogout, onExitToPos }) => {
  const [stats, setStats] = useState<ISuperAdminStats | null>(null);
  const [tenants, setTenants] = useState<ISuperAdminTenant[]>([]);
  const [totalTenants, setTotalTenants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [activeModalTenant, setActiveModalTenant] = useState<ISuperAdminTenant | null>(null);
  const [modalType, setModalType] = useState<'extendTrial' | 'changeStatus' | 'overridePlan' | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Modal input values
  const [extendDays, setExtendDays] = useState(14);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [plans, setPlans] = useState<any[]>(CANONICAL_PLANS);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        }
      }
    } catch (err) {
      console.error('Failed to load plans in SuperAdmin', err);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load SuperAdmin stats', err);
    }
  }, [token]);

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/superadmin/tenants?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setTotalTenants(data.pagination?.total || 0);
      } else {
        showNotification('Failed to fetch tenants list', 'error');
      }
    } catch (err) {
      showNotification('Network error fetching tenants', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, searchTerm]);

  useEffect(() => {
    fetchStats();
    fetchTenants();
    fetchPlans();
  }, [fetchStats, fetchTenants, fetchPlans]);

  // Handle Extend Trial
  const handleExtendTrial = async () => {
    if (!activeModalTenant) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${activeModalTenant._id}/extend-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ days: extendDays })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Extended trial by ${extendDays} days.`);
        setModalType(null);
        setActiveModalTenant(null);
        fetchStats();
        fetchTenants();
      } else {
        showNotification(data.message || 'Failed to extend trial', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Change Status
  const handleChangeStatus = async () => {
    if (!activeModalTenant) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${activeModalTenant._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: selectedStatus })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Updated status to ${selectedStatus}.`);
        setModalType(null);
        setActiveModalTenant(null);
        fetchStats();
        fetchTenants();
      } else {
        showNotification(data.message || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Override Plan
  const handleOverridePlan = async () => {
    if (!activeModalTenant) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${activeModalTenant._id}/override-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId: selectedPlan })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Assigned ${selectedPlan} plan.`);
        setModalType(null);
        setActiveModalTenant(null);
        fetchStats();
        fetchTenants();
      } else {
        showNotification(data.message || 'Failed to assign plan', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper to format trial days remaining
  const getTrialBadge = (t: ISuperAdminTenant) => {
    if (t.status === 'active') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Active Paid
        </span>
      );
    }
    if (t.status === 'suspended') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit">
          Suspended
        </span>
      );
    }
    if (t.status === 'expired') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-700/60 text-gray-400 border border-gray-600 w-fit">
          {t.dataPruned ? 'Expired (Pruned)' : 'Expired'}
        </span>
      );
    }

    // Trialing
    const now = new Date();
    const trialEnd = t.trialEndsAt ? new Date(t.trialEndsAt) : now;
    const diffDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit">
          Trial Ended
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 w-fit">
        Trial: {diffDays} {diffDays === 1 ? 'day' : 'days'} left
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      
      {/* SuperAdmin Top Navigation Bar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <FastBilloLogo size={32} showBrandText={false} />
            <span className="text-xl font-black tracking-tight text-white">
              FAST<span className="text-emerald-400">BILLO</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-md shadow-sm">
              SUPERADMIN
            </span>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">|</span>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            Platform Master Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">{user.email}</span>
          </div>

          <button
            onClick={onExitToPos}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition"
            title="Switch back to regular restaurant POS billing screen"
          >
            Restaurant POS
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 animate-fade-in">
          <div className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
            notification.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700' 
              : 'bg-rose-950/90 text-rose-200 border-rose-700'
          }`}>
            <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* Platform Overview Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Restaurants
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {stats.totalTenants}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Active Paid
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {stats.activeTenants}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                In Free Trial
              </span>
              <span className="text-2xl font-black text-indigo-300 mt-1 block">
                {stats.trialingTenants}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-sm">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Expired / Pruned
              </span>
              <span className="text-2xl font-black text-amber-300 mt-1 block">
                {stats.expiredTenants + stats.suspendedTenants}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-800/50 shadow-sm col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Platform MRR
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                ₹{stats.estimatedMRR.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Platform Master Subscription Plans (Synchronized across Web, Mobile App & SuperAdmin) */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Platform Subscription Plans
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Synced across Web, App & DB
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Master pricing tiers and feature quotas unified across Web POS, Mobile App & SuperAdmin
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(plans.length > 0 ? plans : CANONICAL_PLANS).map((p: any) => (
              <div
                key={p.planId}
                className="p-4 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-800/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                      {p.planId}
                    </span>
                  </div>
                  <div className="text-xl font-black text-purple-400 mt-1">
                    ₹{p.priceInr?.toLocaleString() || p.priceInr}
                    <span className="text-xs font-normal text-gray-500"> / month</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 min-h-[32px]">
                    {p.description}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-300 border-t border-gray-800/80 pt-2.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Staff Limit:</span>
                      <span className="font-semibold text-white">{p.features?.maxStaff} Logins</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Menu Items:</span>
                      <span className="font-semibold text-white">Up to {p.features?.maxMenuItems}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Monthly Orders:</span>
                      <span className="font-semibold text-white">
                        {p.features?.maxOrdersPerMonth === -1 ? 'Unlimited' : `${p.features?.maxOrdersPerMonth}/mo`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Table Management:</span>
                      <span className={p.features?.tableManagement ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                        {p.features?.tableManagement ? '✓ Included' : '✗ Not included'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Sales Analytics:</span>
                      <span className={p.features?.analytics ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                        {p.features?.analytics ? '✓ Included' : '✗ Not included'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">Support:</span>
                      <span className={p.features?.prioritySupport ? 'text-purple-300 font-semibold' : 'text-gray-400'}>
                        {p.features?.prioritySupport ? 'Priority VIP' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter, Search & Refresh Controls */}
        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-gray-950 border border-gray-800 text-xs">
              {[
                { id: 'all', label: `All (${totalTenants})` },
                { id: 'trialing', label: 'Trialing' },
                { id: 'active', label: 'Active Paid' },
                { id: 'expired', label: 'Expired' },
                { id: 'suspended', label: 'Suspended' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input & Refresh Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-72">
                <input
                  type="text"
                  placeholder="Search restaurant, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button
                onClick={() => { fetchStats(); fetchTenants(); }}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
                title="Reload Tenants"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tenants Data Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Owner / Contact</th>
                  <th className="py-3 px-4">Status & Trial</th>
                  <th className="py-3 px-4">Active Plan</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Loading restaurant tenants...
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No restaurant tenants found matching your filter.
                    </td>
                  </tr>
                ) : (
                  tenants.map(t => (
                    <tr key={t._id} className="hover:bg-gray-850/40 transition">
                      
                      {/* Business Name & Slug */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{t.name}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <code className="text-indigo-400 font-mono">/{t.slug}</code>
                          <span>•</span>
                          <span className="font-semibold text-gray-300">
                            {t.settings?.currency || 'INR'} ({t.settings?.currencySymbol || '₹'})
                          </span>
                        </div>
                      </td>

                      {/* Owner Details */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-200">{t.ownerEmail}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <span>{t.ownerName}</span>
                          {t.ownerPhone && <span>• 📞 {t.ownerPhone}</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getTrialBadge(t)}
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-gray-800 text-gray-200 border border-gray-700">
                          {t.activePlan || 'starter'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>

                      {/* SuperAdmin Quick Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setActiveModalTenant(t); setModalType('extendTrial'); }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition"
                            title="Extend free trial period"
                          >
                            + Trial
                          </button>
                          <button
                            onClick={() => { setActiveModalTenant(t); setSelectedStatus(t.status); setModalType('changeStatus'); }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 transition"
                            title="Change account status"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => { setActiveModalTenant(t); setSelectedPlan(t.activePlan === 'professional' ? 'pro' : t.activePlan || 'pro'); setModalType('overridePlan'); }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 transition"
                            title="Assign subscription tier"
                          >
                            Plan
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>Showing {tenants.length} of {totalTenants} registered restaurants</span>
            <span>FASTBILLO SaaS Control Plane v2.1</span>
          </div>
        </div>

      </main>

      {/* --- MODAL 1: Extend Free Trial --- */}
      {modalType === 'extendTrial' && activeModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 bg-gray-900 border border-indigo-800/60 rounded-2xl shadow-2xl text-white space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Extend Free Trial</h3>
              <p className="text-xs text-gray-400 mt-1">
                Restaurant: <span className="text-white font-semibold">{activeModalTenant.name}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                Additional Trial Days
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExtendDays(days)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      extendDays === days
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                    }`}
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={365}
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs bg-gray-950 border border-gray-800 rounded-lg text-white mt-1"
                placeholder="Custom number of days"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleExtendTrial}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow disabled:opacity-50"
              >
                {isSubmittingAction ? 'Applying...' : 'Apply Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Change Status --- */}
      {modalType === 'changeStatus' && activeModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl text-white space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Change Restaurant Status</h3>
              <p className="text-xs text-gray-400 mt-1">
                Restaurant: <span className="text-white font-semibold">{activeModalTenant.name}</span>
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'active', label: 'Active Paid (Full Billing Access)', desc: 'Granted full operations' },
                { id: 'trialing', label: 'Trialing (3-Day Free Period)', desc: 'Allows free trial orders' },
                { id: 'suspended', label: 'Suspended (Blocked Mutations)', desc: 'Requires subscription to bill' },
                { id: 'expired', label: 'Expired (Trial Ended)', desc: 'Blocks operational billing' }
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedStatus === opt.id
                      ? 'bg-indigo-950/40 border-indigo-500'
                      : 'bg-gray-950 border-gray-800 hover:bg-gray-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.id}
                    checked={selectedStatus === opt.id}
                    onChange={() => setSelectedStatus(opt.id)}
                    className="mt-1 text-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{opt.label}</div>
                    <div className="text-[11px] text-gray-400">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleChangeStatus}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow disabled:opacity-50"
              >
                {isSubmittingAction ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Assign Subscription Plan --- */}
      {modalType === 'overridePlan' && activeModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 bg-gray-900 border border-purple-800/60 rounded-2xl shadow-2xl text-white space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Manual Plan Assignment</h3>
              <p className="text-xs text-gray-400 mt-1">
                Assign paid plan to <span className="text-white font-semibold">{activeModalTenant.name}</span>
              </p>
            </div>

            <div className="space-y-2">
              {(plans.length > 0 ? plans : CANONICAL_PLANS).map((plan: any) => {
                const isSelected = selectedPlan === plan.planId;
                const formattedPrice = `₹${(plan.priceInr || 0).toLocaleString()}/mo`;
                const maxOrders = plan.features?.maxOrdersPerMonth === -1 ? 'Unlimited orders' : `${plan.features?.maxOrdersPerMonth} orders`;
                return (
                  <label
                    key={plan.planId}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500'
                        : 'bg-gray-950 border-gray-800 hover:bg-gray-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.planId}
                      checked={isSelected}
                      onChange={() => setSelectedPlan(plan.planId)}
                      className="mt-1 text-purple-600"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{plan.name}</span>
                        <span className="text-[11px] font-bold text-purple-400">{formattedPrice}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {plan.description || `${plan.features?.maxStaff} staff, ${plan.features?.maxMenuItems} items, ${maxOrders}`}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                          {plan.features?.maxStaff} Staff
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                          {plan.features?.maxMenuItems} Items
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                          {maxOrders}
                        </span>
                        {plan.features?.tableManagement && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300">
                            Table Mgmt
                          </span>
                        )}
                        {plan.features?.analytics && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                            Analytics
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleOverridePlan}
                className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition shadow disabled:opacity-50"
              >
                {isSubmittingAction ? 'Upgrading...' : 'Assign & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminPortal;
