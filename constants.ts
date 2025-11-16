
import { ICurrency } from './types';

export const CURRENCIES: ICurrency[] = [
  { code: 'INR', symbol: '₹', rate: 1 },
  { code: 'USD', symbol: '$', rate: 0.012 },
  { code: 'EUR', symbol: '€', rate: 0.011 },
  { code: 'GBP', symbol: '£', rate: 0.0095 },
];

export const DEFAULT_TAX_RATE = 0.05; // 5% Tax Rate

export const ORDERS_PER_PAGE = 20;