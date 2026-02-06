import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Expense, AppSettings } from '../types';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  currencySymbol: string;
  settings: AppSettings;
  t: (key: string) => string;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#84CC16'];

export const Dashboard: React.FC<DashboardProps> = ({ expenses, currencySymbol, settings, t }) => {
  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(expense => {
      data[expense.category] = (data[expense.category] || 0) + expense.amount;
    });
    return Object.keys(data).map(key => ({
      name: key,
      value: data[key]
    })).sort((a, b) => b.value - a.value); // Sort desc
  }, [expenses]);

  const spendingPercentage = useMemo(() => {
    if (!settings.spendingLimit || settings.spendingLimit <= 0) return 0;
    return Math.min((totalSpent / settings.spendingLimit) * 100, 100);
  }, [totalSpent, settings.spendingLimit]);

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
      <div className="text-center mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('totalSpent')}</h2>
        <div className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">
          {currencySymbol}{totalSpent.toFixed(2)}
        </div>
      </div>

      {/* Spending Limit Progress */}
      {settings.spendingLimit > 0 && (
          <div className="mb-6">
             <div className="flex justify-between items-end mb-2">
                 <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('monthlyBudget')}</span>
                 <span className={`text-xs font-bold ${spendingPercentage > 90 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {spendingPercentage.toFixed(0)}% {t('used')}
                 </span>
             </div>
             <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                 <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(spendingPercentage)}`} 
                    style={{ width: `${spendingPercentage}%` }}
                 />
             </div>
          </div>
      )}

      {expenses.length > 0 ? (
        <div className="h-48 w-full relative">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`}
                contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#1f2937'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-xs text-gray-400 font-medium">{t('byCategory')}</span>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          {t('noTransactions')}
        </div>
      )}
    </div>
  );
};
