export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  walletId?: string;
  createdAt: number;
}

export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  SHOPPING = 'Shopping',
  BILLS = 'Bills',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health',
  HOUSING = 'Housing',
  INSURANCE = 'Insurance',
  EDUCATION = 'Education',
  GROCERIES = 'Groceries',
  TRAVEL = 'Travel',
  SUBSCRIPTIONS = 'Subscriptions',
  PERSONAL_CARE = 'Personal Care',
  GIFTS = 'Gifts',
  SAVINGS = 'Savings',
  WORK = 'Work',
  OTHER = 'Other'
}

export interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  date?: string;
  wallet?: string;
}

export type CurrencyCode = string;

export type Language = 'en' | 'es' | 'fr' | 'bn' | 'hi';

export interface AppSettings {
  currency: CurrencyCode;
  theme: 'light' | 'dark';
  showCamera: boolean;
  showManualEntry: boolean;
  spendingLimit: number;
  travelMode: boolean;
  language: Language;
  weekStartDay: 'sunday' | 'monday';
}

export interface UserProfile {
  name: string;
  picture?: string;
}

export type DateFilterType = 'all' | 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'custom';

export interface DateFilter {
  type: DateFilterType;
  startDate?: string;
  endDate?: string;
}

export type WalletType = 'cash' | 'card' | 'bank' | 'digital' | 'other';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
}

// comprehensive list of major currencies
export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: 'C$', AUD: 'A$',
  CNY: '¥', CHF: 'Fr', NZD: 'NZ$', MXN: '$', BRL: 'R$', ZAR: 'R',
  RUB: '₽', KRW: '₩', SGD: 'S$', HKD: 'HK$', SEK: 'kr', NOK: 'kr',
  DKK: 'kr', TRY: '₺', AED: 'د.إ', SAR: '﷼', THB: '฿', IDR: 'Rp',
  MYR: 'RM', PHP: '₱', VND: '₫', PLN: 'zł', HUF: 'Ft', CZK: 'Kč',
  ILS: '₪', CLP: '$', PHP_PESO: '₱', COP: '$', TWD: 'NT$', EGP: 'E£'
};