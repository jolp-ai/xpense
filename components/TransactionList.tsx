import React, { useState, useRef } from 'react';
import { Expense, DateFilter, DateFilterType, Wallet } from '../types';
import { 
  Coffee, Car, ShoppingBag, Receipt, Film, Activity, HelpCircle, 
  Trash2, Pencil, Home, Shield, GraduationCap, Utensils, Plane, 
  Smartphone, Heart, Gift, PiggyBank, Briefcase, Calendar, Download,
  Banknote, CreditCard, Landmark
} from 'lucide-react';

interface TransactionListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  currencySymbol: string;
  dateFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  wallets: Wallet[];
  t: (key: string) => string;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food': return <Coffee size={20} className="text-orange-500" />;
    case 'transport': return <Car size={20} className="text-blue-500" />;
    case 'shopping': return <ShoppingBag size={20} className="text-pink-500" />;
    case 'bills': return <Receipt size={20} className="text-yellow-500" />;
    case 'entertainment': return <Film size={20} className="text-purple-500" />;
    case 'health': return <Activity size={20} className="text-red-500" />;
    case 'housing': return <Home size={20} className="text-indigo-500" />;
    case 'insurance': return <Shield size={20} className="text-teal-500" />;
    case 'education': return <GraduationCap size={20} className="text-blue-600" />;
    case 'groceries': return <Utensils size={20} className="text-lime-600" />;
    case 'travel': return <Plane size={20} className="text-sky-500" />;
    case 'subscriptions': return <Smartphone size={20} className="text-violet-500" />;
    case 'personal care': return <Heart size={20} className="text-rose-400" />;
    case 'gifts': return <Gift size={20} className="text-pink-600" />;
    case 'savings': return <PiggyBank size={20} className="text-emerald-500" />;
    case 'work': return <Briefcase size={20} className="text-slate-500" />;
    default: return <HelpCircle size={20} className="text-gray-500" />;
  }
};

const getWalletIconSmall = (type?: string) => {
    switch(type) {
        case 'cash': return <Banknote size={10} />;
        case 'card': return <CreditCard size={10} />;
        case 'bank': return <Landmark size={10} />;
        case 'digital': return <Smartphone size={10} />;
        default: return <Banknote size={10} />;
    }
};

const SwipeableItem: React.FC<{
  expense: Expense;
  currencySymbol: string;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  wallets: Wallet[];
}> = ({ expense, currencySymbol, onEdit, onDelete, wallets }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number>(0);
  const isDragging = useRef(false);

  const wallet = wallets.find(w => w.id === expense.walletId);

  const handleStart = (clientX: number) => {
    isDragging.current = true;
    startX.current = clientX - offset;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current) return;
    const newOffset = clientX - startX.current;
    if (newOffset <= 0 && newOffset >= -140) {
      setOffset(newOffset);
    } else if (newOffset > 0) {
      setOffset(0); 
    } else if (newOffset < -140) {
      setOffset(-140);
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
    if (offset < -60) {
      setOffset(-120);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl touch-pan-y select-none group">
      <div className="absolute inset-0 flex items-center justify-end pr-5 gap-3 bg-gray-50 dark:bg-gray-700/30">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(expense); setOffset(0); }}
          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          aria-label="Edit"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
          className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          aria-label="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div
        className="relative z-10 bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
            {getCategoryIcon(expense.category)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{expense.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{expense.category}</span>
              <span>{new Date(expense.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
             <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                {currencySymbol}{expense.amount.toFixed(2)}
             </div>
             {wallet && (
                 <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded-md mt-0.5">
                     {getWalletIconSmall(wallet.type)}
                     {wallet.name}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export const TransactionList: React.FC<TransactionListProps> = ({ 
  expenses, onDelete, onEdit, currencySymbol, dateFilter, onFilterChange, wallets, t
}) => {
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...dateFilter, type: e.target.value as DateFilterType });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFilterChange({ ...dateFilter, [field]: value });
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;

    const headers = ['Date', 'Category', 'Description', 'Amount', 'Wallet'];
    
    const rows = expenses.map(expense => {
        const walletName = wallets.find(w => w.id === expense.walletId)?.name || 'Unknown';
        return [
            new Date(expense.date).toISOString().split('T')[0],
            `"${expense.category}"`,
            `"${expense.description.replace(/"/g, '""')}"`,
            expense.amount.toFixed(2),
            `"${walletName}"`
        ];
    });

    const csvContent = [
      headers.join(','), 
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xpense_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 mb-2">
         <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white px-2">{t('transactions')}</h3>
           
           <div className="flex items-center gap-2">
             {expenses.length > 0 && (
               <button 
                 onClick={handleExportCSV}
                 className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                 title={t('exportCSV')}
               >
                 <Download size={14} />
               </button>
             )}

             <div className="relative">
                <select 
                  value={dateFilter.type} 
                  onChange={handleTypeChange}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-1 pl-3 pr-8 rounded-lg text-sm font-medium outline-none"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">{t('yesterday') || "Yesterday"}</option>
                  <option value="week">{t('thisWeek') || "This Week"}</option>
                  <option value="last_week">{t('lastWeek') || "Last Week"}</option>
                  <option value="month">{t('thisMonth') || "This Month"}</option>
                  <option value="last_month">{t('lastMonth') || "Last Month"}</option>
                  <option value="all">{t('allTime') || "All Time"}</option>
                  <option value="custom">{t('custom') || "Custom"}</option>
                </select>
                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>
           </div>
         </div>

         {dateFilter.type === 'custom' && (
           <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
             <input 
               type="date" 
               value={dateFilter.startDate || ''} 
               onChange={(e) => handleDateChange('startDate', e.target.value)}
               className="w-1/2 p-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 outline-none"
             />
             <input 
               type="date" 
               value={dateFilter.endDate || ''} 
               onChange={(e) => handleDateChange('endDate', e.target.value)}
               className="w-1/2 p-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 outline-none"
             />
           </div>
         )}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 dark:text-gray-500">{t('noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-1 pb-24">
          {expenses.map((expense) => (
            <SwipeableItem 
              key={expense.id}
              expense={expense}
              currencySymbol={currencySymbol}
              onEdit={onEdit}
              onDelete={onDelete}
              wallets={wallets}
            />
          ))}
        </div>
      )}
    </div>
  );
};