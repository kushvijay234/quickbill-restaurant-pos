export const DEFAULT_TAX_RATE = 0.05; // 5% default tax

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1 },
  { code: 'USD', symbol: '$', rate: 0.012 },
  { code: 'EUR', symbol: '€', rate: 0.011 },
  { code: 'GBP', symbol: '£', rate: 0.0095 },
  { code: 'AED', symbol: 'AED', rate: 0.044 },
];

export const formatCurrency = (amount, currency = CURRENCIES[0]) => {
  const symbol = currency?.symbol || '₹';
  const val = Number(amount) || 0;
  return `${symbol}${val.toFixed(2)}`;
};
