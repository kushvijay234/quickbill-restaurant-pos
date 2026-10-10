export interface IMenuItemVariant {
  name: string;
  price: number;
}

export interface IMenuItem {
  id: string;
  name: string;
  variants: IMenuItemVariant[];
  imageUrl: string;
  userId?: string | { username: string }; // Optional for admin view
  createdAt?: string; // Optional for sorting
}

export interface IOrderItem {
  item: IMenuItem;
  quantity: number;
  selectedVariant: IMenuItemVariant;
}

export interface ICustomer {
  name: string;
  mobile: string;
}

export interface ICurrency {
  code: string;
  symbol: string;
  rate: number; // Exchange rate relative to INR
}

export interface INotification {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export type PaymentMethod = 'cash' | 'upi' | 'card';

export interface IOrder {
  id: string;
  customer: ICustomer;
  items: IOrderItem[];
  subtotal: number; // In base currency (INR)
  tax: number; // In base currency (INR)
  total: number; // In base currency (INR)
  currency: ICurrency; // The currency used at the time of the order
  date: string;
  paymentMethod: PaymentMethod;
  userId?: string | { username: string }; // Optional for admin view
}

export interface IProfile {
  id: string;
  restaurantName: string;
  address: string;
  phone: string;
  logoUrl?: string;
  taxRate?: number;
  currency?: string;
  currencySymbol?: string;
}

export type UserRole = 'admin' | 'staff';

export interface IUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface ILog {
    id: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    source?: 'web' | 'mobile' | 'backend' | 'system';
    platform?: string;
    endpoint?: string;
    statusCode?: number;
    stack?: string;
    tenantSlug?: string;
    meta?: Record<string, any>;
    timestamp: string;
    userId?: { username: string } | string;
}

export interface IAdminStats {
    userCount: number;
    orderCount: number;
    menuCount: number;
    totalRevenue: number;
    recentOrders: IOrder[];
}

export interface ITenant {
  slug: string;
  name: string;
  status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  activePlan: 'starter' | 'pro' | 'enterprise';
  trialEndsAt?: string;
  settings?: {
    currency?: string;
    currencySymbol?: string;
    taxRate?: number;
    address?: string;
  };
}

export interface ISubscriptionPlan {
  planId: 'starter' | 'pro' | 'enterprise';
  name: string;
  description: string;
  priceInr: number;
  billingPeriod: 'monthly' | 'yearly';
  features: {
    maxStaff: number;
    maxMenuItems: number;
    maxOrdersPerMonth: number;
    tableManagement: boolean;
    analytics: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
  };
}

export interface ISubscriptionDetails {
  tenant: ITenant;
  subscription?: {
    planId: string;
    status: string;
    billingCycle: string;
    currentPeriodEnd: string;
    amount: number;
  };
  plan?: ISubscriptionPlan;
  daysRemaining: number;
  razorpayKeyId?: string;
}

export interface ISuperAdminUser {
  id: string;
  username: string;
  email: string;
  role: 'superadmin';
}

export interface ISuperAdminTenant {
  _id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';
  activePlan: string;
  trialEndsAt: string;
  dataPruned: boolean;
  dataPrunedAt?: string | null;
  createdAt: string;
  settings?: {
    currency: string;
    currencySymbol: string;
  };
}

export interface ISuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  trialingTenants: number;
  suspendedTenants: number;
  expiredTenants: number;
  dataPrunedTenants: number;
  estimatedMRR: number;
  currencyStats: Array<{ _id: string; count: number }>;
  recentTenants: ISuperAdminTenant[];
}

export interface IPaymentTransaction {
  _id?: string;
  orderId: string;
  paymentId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'paid' | 'pending' | 'cancelled' | 'failed';
  failureReason?: string;
  method?: string;
  date: string | Date;
  receiptUrl?: string;
}