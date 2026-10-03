
import { ICurrency } from './types';

export const CURRENCIES: ICurrency[] = [
  { code: 'INR', symbol: '₹', rate: 1 },
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 1 },
  { code: 'GBP', symbol: '£', rate: 1 },
  { code: 'AED', symbol: 'د.إ', rate: 1 },
  { code: 'CAD', symbol: '$', rate: 1 },
  { code: 'AUD', symbol: '$', rate: 1 },
  { code: 'SAR', symbol: '﷼', rate: 1 },
  { code: 'SGD', symbol: '$', rate: 1 },
];

export const DEFAULT_TAX_RATE = 0.05; // 5% Tax Rate

export const ORDERS_PER_PAGE = 20;