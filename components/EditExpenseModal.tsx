import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Calendar, Tag, Wallet, FileText, DollarSign } from 'lucide-react';
import { Expense, ExpenseCategory, Wallet as WalletType } from '../types';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (expense: Expense) => void;
  currencySymbol: string;
  wallets: WalletType[];
  t: (key: string) => string;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ isOpen, onClose, expense, onSave, currencySymbol, wallets, t }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(ExpenseCategory.OTHER);
  const [date, setDate] = useState('');
  const [walletId, setWalletId] = useState('');

  const isNew = !expense?.id;

  useEffect(() => {
    if (expense) {
      // If it's a new expense (id is empty) and amount is 0, start with empty string for easier typing
      const initialAmount = (isNew && expense.amount === 0) ? '' : expense.amount.toString();
      setAmount(initialAmount);
      setDescription(expense.description);
      setCategory(expense.category);
      setWalletId(expense.walletId || wallets[0]?.id || '');
      // Format date to YYYY-MM-DD for input
      const d = new Date(expense.date);
      setDate(d.toISOString().split('T')[0]);
    }
  }, [expense, isOpen, wallets, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    onSave({
      ...expense,
      amount: parseFloat(amount) || 0,
      description,
      category,
      date: new Date(date).toISOString(),
      walletId
    });
    onClose();
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm shrink-0 safe-area-top">
         <button 
           onClick={onClose} 
           className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
         >
            <ArrowLeft size={24} />
         </button>
         <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isNew ? t('addExpense') : t('editExpense')}
         </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 safe-area-bottom">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          
          {/* Amount Input */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center relative">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('amount')}</label>
             <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-gray-400">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus={isNew}
                  placeholder="0.00"
                  className="w-48 text-center text-5xl font-black bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-200 dark:placeholder-gray-700"
                />
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-1">
            
            {/* Description */}
            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
               <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 shrink-0">
                  <FileText size={20} />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('description')}</label>
                 <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What did you buy?"
                    className="w-full bg-transparent text-gray-900 dark:text-white font-semibold outline-none"
                  />
               </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

            {/* Category */}
            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
               <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 shrink-0">
                  <Tag size={20} />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('category')}</label>
                 <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-transparent text-gray-900 dark:text-white font-semibold outline-none appearance-none"
                  >
                    {Object.values(ExpenseCategory).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

            {/* Wallet */}
            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
               <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 shrink-0">
                  <Wallet size={20} />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('paidFrom')}</label>
                 <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-transparent text-gray-900 dark:text-white font-semibold outline-none appearance-none"
                 >
                    {wallets.map(wallet => (
                        <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                    ))}
                 </select>
               </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

            {/* Date */}
            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
               <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Calendar size={20} />
               </div>
               <div className="flex-1">
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('date')}</label>
                 <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent text-gray-900 dark:text-white font-semibold outline-none"
                  />
               </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={24} />
            {isNew ? t('addExpense') : t('save')}
          </button>

        </form>
      </div>
    </div>
  );
};