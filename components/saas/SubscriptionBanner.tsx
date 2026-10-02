import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ISubscriptionDetails } from '../../types';

interface SubscriptionBannerProps {
  onOpenPlans: () => void;
  refreshTrigger?: number;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onOpenPlans, refreshTrigger }) => {
  const [subDetails, setSubDetails] = useState<ISubscriptionDetails | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/subscription/current')
      .then((data) => {
        if (isMounted) setSubDetails(data);
      })
      .catch(() => {
        // Silently catch if not in tenant context or server offline
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (!subDetails || !subDetails.tenant) return null;

  const { tenant, daysRemaining } = subDetails;

  // Show banner if trialing or past_due
  if (tenant.status !== 'trialing' && tenant.status !== 'past_due') {
    return null;
  }

  const isPastDue = tenant.status === 'past_due' || daysRemaining <= 0;

  return (
    <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
      isPastDue 
        ? 'bg-amber-500 text-white border-amber-600'
        : 'bg-indigo-600 text-white border-indigo-700'
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-bold">
          {isPastDue ? '⚠️ Subscription Expired:' : '✨ Free Trial Active:'}
        </span>
        <span>
          {isPastDue
            ? 'Your trial period has ended. Orders will be locked soon.'
            : `You have ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining on your 14-day trial.`}
        </span>
        <span className="hidden sm:inline opacity-90 font-medium">
          • {tenant.name}
        </span>
      </div>

      <button
        onClick={onOpenPlans}
        className="px-3 py-1 font-semibold rounded-md bg-white text-gray-900 hover:bg-gray-100 transition shadow-sm text-xs"
      >
        Upgrade with Razorpay
      </button>
    </div>
  );
};

export default SubscriptionBanner;
