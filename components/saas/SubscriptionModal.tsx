import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ISubscriptionPlan, ISubscriptionDetails, IPaymentTransaction } from '../../types';
import { CANONICAL_PLANS } from '../../constants';

interface SubscriptionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'plans' | 'history';
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSuccess, initialTab = 'plans' }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>(initialTab);
  const [plans, setPlans] = useState<ISubscriptionPlan[]>(CANONICAL_PLANS as ISubscriptionPlan[]);
  const [currentSub, setCurrentSub] = useState<ISubscriptionDetails | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Payment History State
  const [history, setHistory] = useState<IPaymentTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'paid' | 'cancelled' | 'failed'>('all');

  // Load Razorpay Script dynamically if needed
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, currentRes] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current')
      ]);
      const activePlans = (plansRes.plans && plansRes.plans.length > 0) ? plansRes.plans : CANONICAL_PLANS;
      setPlans(activePlans);
      setCurrentSub(currentRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/subscription/payment-history');
      if (res && Array.isArray(res.transactions)) {
        setHistory(res.transactions);
      }
    } catch (hErr: any) {
      console.warn('Failed to load payment history:', hErr.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleSelectPlan = async (plan: ISubscriptionPlan) => {
    setUpgradingPlanId(plan.planId);
    setError('');
    setSuccessMessage('');

    try {
      // 1. Create order on backend
      const orderData = await api.post('/subscription/create-order', {
        planId: plan.planId,
        billingCycle
      });

      // 2. Open Razorpay Checkout or fallback in dev
      if ((window as any).Razorpay && orderData.keyId && !orderData.orderId.startsWith('order_mock_')) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'FASTBILLO',
          description: `FASTBILLO — Bill Fast. Grow Faster. (${plan.name} - ${billingCycle})`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await api.post('/subscription/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.planId,
                billingCycle
              });
              setSuccessMessage(verifyRes.message || 'Payment confirmed and plan activated!');
              await loadData();
              loadHistory();
              if (onSuccess) onSuccess();
            } catch (vErr: any) {
              setError(vErr.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              api.post('/subscription/record-payment-event', {
                orderId: orderData.orderId,
                planId: plan.planId,
                billingCycle,
                status: 'cancelled',
                reason: 'Payment modal closed by user'
              }).catch(() => {});
              loadHistory();
            }
          },
          prefill: {
            name: currentSub?.tenant.name || '',
            email: ''
          },
          theme: {
            color: '#16a34a'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          const desc = response.error?.description || 'Payment was unsuccessful';
          setError(desc);
          api.post('/subscription/record-payment-event', {
            orderId: orderData.orderId,
            paymentId: response.error?.metadata?.payment_id || '',
            planId: plan.planId,
            billingCycle,
            status: 'failed',
            reason: desc
          }).catch(() => {});
          loadHistory();
        });
        rzp.open();
      } else {
        // Dev / Mock activation mode
        const verifyRes = await api.post('/subscription/verify-payment', {
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          planId: plan.planId,
          billingCycle
        });
        setSuccessMessage(verifyRes.message || `Activated ${plan.name} successfully!`);
        await loadData();
        loadHistory();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process subscription');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (historyFilter === 'all') return true;
    return item.status === historyFilter;
  });

  const paidCount = history.filter((t) => t.status === 'paid').length;
  const cancelledCount = history.filter((t) => t.status === 'cancelled').length;
  const failedCount = history.filter((t) => t.status === 'failed').length;
  const totalPaid = history
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
                SaaS Subscription & Billing
              </span>
              {currentSub && (
                <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md">
                  {currentSub.tenant.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Manage Your Plan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upgrade or renew using Razorpay UPI, Cards, NetBanking, or EMI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 text-sm">
            🎉 {successMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 mt-5 space-x-6">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'plans'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <span>💎 Subscription Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <span>📜 Payment & Invoices History</span>
            {history.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'plans' ? (
          <>
            {/* Current Plan Overview Banner */}
            {currentSub && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">
                    Current Restaurant Status
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
                    <span>{currentSub.tenant.name}</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 capitalize">
                      {currentSub.tenant.status === 'trialing' ? `3-Day Free Trial (${currentSub.daysRemaining} days left)` : `${currentSub.tenant.activePlan} tier`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Current Period Expiry</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {currentSub.subscription?.currentPeriodEnd
                      ? new Date(currentSub.subscription.currentPeriodEnd).toLocaleDateString()
                      : currentSub.tenant.trialEndsAt
                        ? new Date(currentSub.tenant.trialEndsAt).toLocaleDateString()
                        : 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Billing cycle toggle */}
            <div className="mt-5 flex justify-center">
              <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${billingCycle === 'monthly'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${billingCycle === 'yearly'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                  <span>Annual Billing</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrent = currentSub?.tenant.activePlan === plan.planId && currentSub?.tenant.status === 'active';
                const price = billingCycle === 'yearly'
                  ? Math.round(plan.priceInr * 0.8)
                  : plan.priceInr;

                return (
                  <div
                    key={plan.planId}
                    className={`p-6 rounded-2xl border transition duration-200 flex flex-col justify-between ${isCurrent
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                        : plan.planId === 'pro'
                          ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 dark:bg-gray-800 ring-2 ring-indigo-500/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {plan.name}
                        </h3>
                        {plan.planId === 'pro' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 min-h-[32px]">
                        {plan.description}
                      </p>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                          ₹{price}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ month</span>
                      </div>

                      <div className="mt-6 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Max {plan.features.maxStaff} Staff Logins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>
                            {plan.features.maxOrdersPerMonth === -1
                              ? 'Unlimited Orders'
                              : `Up to ${plan.features.maxOrdersPerMonth} orders / mo`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>Up to {plan.features.maxMenuItems} Items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={plan.features.tableManagement ? "text-emerald-500 font-bold" : "text-gray-400"}>
                            {plan.features.tableManagement ? '✓' : '✗'}
                          </span>
                          <span>Table Management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={plan.features.analytics ? "text-emerald-500 font-bold" : "text-gray-400"}>
                            {plan.features.analytics ? '✓' : '✗'}
                          </span>
                          <span>Advanced Sales Analytics</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={plan.features.prioritySupport ? "text-emerald-500 font-bold" : "text-gray-400"}>
                            {plan.features.prioritySupport ? '✓' : '✗'}
                          </span>
                          <span>Priority Support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={plan.features.customBranding ? "text-emerald-500 font-bold" : "text-gray-400"}>
                            {plan.features.customBranding ? '✓' : '✗'}
                          </span>
                          <span>Custom Restaurant Branding</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={upgradingPlanId === plan.planId || isCurrent}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition ${isCurrent
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-default'
                            : plan.planId === 'pro'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600'
                          }`}
                      >
                        {upgradingPlanId === plan.planId
                          ? 'Opening Razorpay...'
                          : isCurrent
                            ? 'Current Plan'
                            : 'Subscribe with Razorpay'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center text-xs text-gray-500 dark:text-gray-400">
              🔒 Secured by Razorpay 256-bit SSL encryption. Accepts UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and NetBanking.
            </div>
          </>
        ) : (
          /* Payment History View */
          <div className="mt-5 space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total Paid
                </div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {paidCount} successful payments
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Successful
                </div>
                <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                  {paidCount}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Active subscriptions
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Cancelled
                </div>
                <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                  {cancelledCount}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  User aborted checkouts
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                  Failed
                </div>
                <div className="text-xl font-extrabold text-red-700 dark:text-red-300 mt-1">
                  {failedCount}
                </div>
                <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                  Gateway/bank errors
                </div>
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'all', label: `All (${history.length})` },
                  { key: 'paid', label: `Paid (${paidCount})` },
                  { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
                  { key: 'failed', label: `Failed (${failedCount})` },
                ].map((f) => {
                  const active = historyFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setHistoryFilter(f.key as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>🔄 Refresh Records</span>
              </button>
            </div>

            {/* History Table */}
            {historyLoading && history.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading payment and invoice history...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl mb-3">
                  📜
                </div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  No {historyFilter !== 'all' ? historyFilter : ''} payment records found
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Payment attempts, successful receipts, and cancellations will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Plan & Cycle</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Reference / Order ID</th>
                      <th className="px-4 py-3">Details / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    {filteredHistory.map((item, idx) => {
                      const isPaid = item.status === 'paid';
                      const isCancelled = item.status === 'cancelled';
                      const isFailed = item.status === 'failed';

                      return (
                        <tr key={item.orderId || idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <span>✓</span>
                                <span>PAID</span>
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                <span>✕</span>
                                <span>CANCELLED</span>
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                <span>⚠</span>
                                <span>FAILED</span>
                              </span>
                            )}
                            {!isPaid && !isCancelled && !isFailed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                <span>⏳</span>
                                <span>PENDING</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            <div>{item.planName || item.planId.toUpperCase()}</div>
                            <div className="text-[10px] text-gray-400 capitalize">{item.billingCycle || 'monthly'}</div>
                          </td>
                          <td className="px-4 py-3 font-extrabold text-sm whitespace-nowrap">
                            <span className={isPaid ? 'text-emerald-600 dark:text-emerald-400' : isFailed ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}>
                              ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-[11px]">
                            {item.date ? new Date(item.date).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                            <div>Order: <span className="text-gray-700 dark:text-gray-200 font-semibold">{item.orderId || 'N/A'}</span></div>
                            {item.paymentId ? (
                              <div className="text-emerald-600 dark:text-emerald-400">Pay: {item.paymentId}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs">
                            {item.failureReason ? (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium inline-block ${
                                isCancelled
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {item.failureReason}
                              </span>
                            ) : isPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                                Plan active • Invoice {item.receiptUrl || 'generated'}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">In progress</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
