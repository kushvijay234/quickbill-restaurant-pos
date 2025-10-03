export interface IMenuItem {
  id: string;
  name: string;
  price: number; // Price is always in INR (base currency)
  imageUrl: string;
  userId?: string | { username: string }; // Optional for admin view
  createdAt?: string; // Optional for sorting
}

export interface IOrderItem {
  item: IMenuItem;
  quantity: number;
  priceAtOrder: number; // Price of the item at the time it was added to the order
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
  type: 'success' | 'error';
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
    meta?: Record<string, any>;
    timestamp: string;
    userId?: { username: string };
}

export interface IAdminStats {
    userCount: number;
    orderCount: number;
    menuCount: number;
    totalRevenue: number;
    recentOrders: IOrder[];
}