import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ISubscriptionPlan, ISubscriptionDetails } from '../../types';

interface SubscriptionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSuccess }) => {
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<ISubscriptionDetails | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setPlans(plansRes.plans || []);
      setCurrentSub(currentRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
              if (onSuccess) onSuccess();
            } catch (vErr: any) {
              setError(vErr.message || 'Payment verification failed');
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
          setError(response.error.description || 'Payment was unsuccessful');
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
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process subscription');
    } finally {
      setUpgradingPlanId(null);
    }
  };

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
              Manage Restaurant Plan
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

        {/* Current Plan Overview Banner */}
        {currentSub && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-4">
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
        <div className="mt-6 flex justify-center">
          <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                billingCycle === 'yearly'
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
                className={`p-6 rounded-2xl border transition duration-200 flex flex-col justify-between ${
                  isCurrent
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
                      <span>Up to {plan.features.maxMenuItems} Menu Items</span>
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
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={upgradingPlanId === plan.planId || isCurrent}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
                      isCurrent
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
      </div>
    </div>
  );
};

export default SubscriptionModal;
