import { useState, useEffect, useCallback, useMemo } from 'react';
import { Expense, AppSettings, UserProfile, DateFilter, Wallet, Language } from '../types';
import { syncExpenseToSheet, initGoogleAuth, isAuthenticated, getUserProfile, signInToGoogle, signOutFromGoogle, fetchExpensesFromSheet } from '../services/sheetService';
import { TRANSLATIONS } from '../utils/translations';

const STORAGE_KEY = 'snapspend_expenses';
const SETTINGS_KEY = 'snapspend_settings';
const WALLETS_KEY = 'snapspend_wallets';
const ONBOARDING_KEY = 'snapspend_onboarding_completed';

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'BDT', 
  theme: 'light',
  showCamera: false, 
  showManualEntry: true,
  spendingLimit: 0,
  travelMode: false,
  language: 'en',
  weekStartDay: 'sunday'
};

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'default-cash', name: 'Cash', type: 'cash' }
];

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>(DEFAULT_WALLETS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'month' });

  // Detect Language
  const detectLanguage = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const country = data.country_code;
        let detectedLang: Language = 'en';

        // Map country codes to supported languages
        if (['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(country)) {
          detectedLang = 'es';
        } else if (['FR', 'MC', 'BE', 'CH', 'SN', 'ML', 'CI'].includes(country)) {
          detectedLang = 'fr';
        } else if (['BD'].includes(country)) {
          detectedLang = 'bn';
        } else if (['IN'].includes(country)) {
          detectedLang = 'hi';
        }

        return detectedLang;
      }
    } catch (e) {
      console.warn('Could not auto-detect language:', e);
    }
    return 'en';
  };

  useEffect(() => {
    // Load Data
    const storedExpenses = localStorage.getItem(STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    const storedWallets = localStorage.getItem(WALLETS_KEY);
    const onboardingCompleted = localStorage.getItem(ONBOARDING_KEY);
    
    if (storedExpenses) {
      try {
        setExpenses(JSON.parse(storedExpenses));
      } catch (e) {
        console.error("Failed to parse expenses", e);
      }
    }

    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        const newSettings = { ...DEFAULT_SETTINGS, ...parsed };
        if (parsed.showManualEntry !== undefined && parsed.showCamera === undefined) {
             newSettings.showCamera = parsed.showManualEntry;
        }
        setSettings(newSettings);
      } catch (e) { console.error(e); }
    } else {
       // First time user: Detect Language
       detectLanguage().then(lang => {
          if (lang !== 'en') {
             setSettings(prev => {
                const updated = { ...prev, language: lang };
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
                return updated;
             });
          }
       });
    }

    if (storedWallets) {
      try {
        setWallets(JSON.parse(storedWallets));
      } catch (e) { console.error(e); }
    } else {
        // Ensure default wallet exists if nothing stored
        setWallets(DEFAULT_WALLETS);
        localStorage.setItem(WALLETS_KEY, JSON.stringify(DEFAULT_WALLETS));
    }

    if (!onboardingCompleted) {
        setShowOnboarding(true);
    }

    setLoading(false);

    // Init Google Auth
    initGoogleAuth(async () => {
        const loggedIn = isAuthenticated();
        setIsGoogleLoggedIn(loggedIn);
        if (loggedIn) {
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
    });
  }, []);

  // Apply Theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    // Normalize today to start of day
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return expenses.filter(expense => {
      const expDate = new Date(expense.date);
      // Normalize expDate
      const expDay = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());

      switch (dateFilter.type) {
        case 'today':
          return expDay.getTime() === today.getTime();
        case 'yesterday': {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return expDay.getTime() === yesterday.getTime();
        }
        case 'week': {
          const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
          const distance = settings.weekStartDay === 'monday' 
            ? (currentDay === 0 ? 6 : currentDay - 1) 
            : currentDay;
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - distance);
          return expDay >= startOfWeek && expDay <= today;
        }
        case 'last_week': {
          const currentDay = today.getDay();
          const distance = settings.weekStartDay === 'monday' 
            ? (currentDay === 0 ? 6 : currentDay - 1) 
            : currentDay;
          const startOfThisWeek = new Date(today);
          startOfThisWeek.setDate(today.getDate() - distance);
          
          const startOfLastWeek = new Date(startOfThisWeek);
          startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
          
          const endOfLastWeek = new Date(startOfThisWeek);
          endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);
          
          return expDay >= startOfLastWeek && expDay <= endOfLastWeek;
        }
        case 'month':
          return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        case 'last_month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return expDate.getMonth() === lastMonth.getMonth() && expDate.getFullYear() === lastMonth.getFullYear();
        }
        case 'custom':
          if (dateFilter.startDate && dateFilter.endDate) {
            const start = new Date(dateFilter.startDate);
            const end = new Date(dateFilter.endDate);
            return expDay >= start && expDay <= end;
          }
          return true;
        case 'all':
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, settings.weekStartDay]);

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const addExpenses = useCallback((newItems: Omit<Expense, 'id' | 'createdAt'>[]) => {
    const createdItems = newItems.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      // Use default wallet (Cash) if none provided
      walletId: item.walletId || wallets[0]?.id 
    }));
    
    setExpenses(prev => {
      const updated = [...createdItems, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (isAuthenticated()) {
       createdItems.forEach(item => {
           const walletName = wallets.find(w => w.id === item.walletId)?.name || 'Cash';
           syncExpenseToSheet(item, settings.currency, walletName);
       });
    }
  }, [settings.currency, wallets]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    addExpenses([expense]);
  }, [addExpenses]);

  const editExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => {
        const newExpenses = prev.map(e => e.id === updatedExpense.id ? updatedExpense : e);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
        return newExpenses;
    });
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prev => {
        const newExpenses = prev.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
        return newExpenses;
    });
  }, []);

  const completeOnboarding = () => {
      setShowOnboarding(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const addWallet = (wallet: Wallet) => {
    const updated = [...wallets, wallet];
    setWallets(updated);
    localStorage.setItem(WALLETS_KEY, JSON.stringify(updated));
  };

  const removeWallet = (id: string) => {
    if (wallets.length <= 1) {
        alert("You must have at least one wallet.");
        return;
    }
    const updated = wallets.filter(w => w.id !== id);
    setWallets(updated);
    localStorage.setItem(WALLETS_KEY, JSON.stringify(updated));
  };

  const login = useCallback(() => {
    signInToGoogle();
    const interval = setInterval(async () => {
        const token = localStorage.getItem('google_access_token');
        if (token) {
            setIsGoogleLoggedIn(true);
            const profile = await getUserProfile();
            setUserProfile(profile);
            clearInterval(interval);
        }
    }, 1000);
    setTimeout(() => clearInterval(interval), 60000);
  }, []);

  const logout = useCallback(() => {
    signOutFromGoogle();
    setIsGoogleLoggedIn(false);
    setUserProfile(null);
  }, []);

  const syncData = useCallback(async () => {
    if (!isAuthenticated()) return;
    setIsSyncing(true);
    try {
        const cloudExpenses = await fetchExpensesFromSheet(wallets);
        
        setExpenses(currentLocalExpenses => {
            const newExpenses = [...currentLocalExpenses];
            let addedCount = 0;

            cloudExpenses.forEach(cloudExp => {
                // Check if this expense already exists locally
                // We compare normalized date (YYYY-MM-DD), amount, and description to avoid duplicates
                const cloudDate = cloudExp.date.split('T')[0];
                
                const exists = currentLocalExpenses.some(localExp => {
                    const localDate = localExp.date.split('T')[0];
                    return localDate === cloudDate && 
                           Math.abs(localExp.amount - cloudExp.amount) < 0.01 && 
                           (localExp.description || '').toLowerCase() === (cloudExp.description || '').toLowerCase();
                });

                if (!exists) {
                    newExpenses.push(cloudExp);
                    addedCount++;
                }
            });
            
            if (addedCount > 0) {
                // Sort by date desc
                newExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
                return newExpenses;
            }
            return currentLocalExpenses;
        });
    } catch (e) {
        console.error("Sync failed", e);
        alert("Failed to sync data from Google Sheet.");
    } finally {
        setIsSyncing(false);
    }
  }, [wallets]);

  // Auto-sync on login if local data is empty (likely new device)
  useEffect(() => {
      if (isGoogleLoggedIn && expenses.length === 0) {
          syncData();
      }
  }, [isGoogleLoggedIn, expenses.length, syncData]);

  const t = (key: string): string => {
    const lang = settings.language || 'en';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  return {
    expenses: filteredExpenses, 
    allExpenses: expenses,
    wallets,
    settings,
    loading,
    isGoogleLoggedIn,
    userProfile,
    dateFilter,
    setDateFilter,
    addExpense,
    addExpenses,
    editExpense,
    removeExpense,
    updateSettings,
    showOnboarding,
    completeOnboarding,
    addWallet,
    removeWallet,
    login,
    logout,
    syncData,
    isSyncing,
    t
  };
};