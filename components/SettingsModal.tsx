import React, { useState } from 'react';
import { ArrowLeft, LogOut, FileSpreadsheet, Moon, Sun, ScanLine, Wallet, Plane, Plus, Trash2, Banknote, CreditCard, Landmark, Smartphone, MoreHorizontal, Globe, Calendar, Keyboard, RefreshCw } from 'lucide-react';
import { AppSettings, CURRENCY_SYMBOLS, Wallet as WalletType, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  wallets: WalletType[];
  onAddWallet: (w: WalletType) => void;
  onRemoveWallet: (id: string) => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  isLoggedIn,
  onLogin,
  onLogout,
  wallets,
  onAddWallet,
  onRemoveWallet,
  onSync,
  isSyncing
}) => {
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'cash' | 'card' | 'bank' | 'digital'>('cash');
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  if (!isOpen) return null;

  const t = (key: string) => {
      const lang = settings.language || 'en';
      return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  const toggleTheme = () => {
      onUpdateSettings({ 
          ...settings, 
          theme: settings.theme === 'dark' ? 'light' : 'dark' 
      });
  };

  const toggleCamera = () => {
      onUpdateSettings({
          ...settings,
          showCamera: !settings.showCamera
      });
  };

  const toggleManualEntry = () => {
      onUpdateSettings({
          ...settings,
          showManualEntry: !settings.showManualEntry
      });
  };

  const toggleTravelMode = () => {
      onUpdateSettings({
          ...settings,
          travelMode: !settings.travelMode
      });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateSettings({
          ...settings,
          language: e.target.value as Language
      });
  };

  const handleWeekStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateSettings({
          ...settings,
          weekStartDay: e.target.value as 'sunday' | 'monday'
      });
  };

  const handleAddWallet = () => {
    if (!newWalletName.trim()) return;
    onAddWallet({
        id: crypto.randomUUID(),
        name: newWalletName,
        type: newWalletType
    });
    setNewWalletName('');
    setIsAddingWallet(false);
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
        case 'cash': return <Banknote size={16} />;
        case 'card': return <CreditCard size={16} />;
        case 'bank': return <Landmark size={16} />;
        case 'digital': return <Smartphone size={16} />;
        default: return <MoreHorizontal size={16} />;
    }
  };

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
         <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings')}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 safe-area-bottom">
         <div className="max-w-2xl mx-auto w-full space-y-6">

           {/* Language */}
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                    <Globe size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{t('language')}</span>
            </div>
            <select 
                value={settings.language} 
                onChange={handleLanguageChange}
                className="bg-gray-50 dark:bg-gray-700 border-none text-gray-900 dark:text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none font-medium"
            >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="bn">বাংলা</option>
                <option value="hi">हिन्दी</option>
            </select>
          </div>
          
          {/* Week Start Day */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                    <Calendar size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{t('weekStartDay')}</span>
            </div>
            <select 
                value={settings.weekStartDay} 
                onChange={handleWeekStartChange}
                className="bg-gray-50 dark:bg-gray-700 border-none text-gray-900 dark:text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none font-medium"
            >
                <option value="sunday">{t('sunday')}</option>
                <option value="monday">{t('monday')}</option>
            </select>
          </div>

          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                    {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{t('darkMode')}</span>
            </div>
            <button 
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${settings.theme === 'dark' ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

           {/* Manual Entry Toggle */}
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                    <Keyboard size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{t('manual')}</span>
            </div>
            <button 
                onClick={toggleManualEntry}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${settings.showManualEntry ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${settings.showManualEntry ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

           {/* Scan Invoice Toggle */}
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                    <ScanLine size={20} />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{t('scanInvoice')}</span>
            </div>
            <button 
                onClick={toggleCamera}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${settings.showCamera ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${settings.showCamera ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Wallets Section */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                    <Wallet size={16} /> {t('wallets')}
                </h3>
                <button 
                    onClick={() => setIsAddingWallet(!isAddingWallet)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                   {isAddingWallet ? t('cancel') : <><Plus size={14} /> {t('addNew')}</>}
                </button>
             </div>

             {isAddingWallet && (
                 <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4 animate-in fade-in slide-in-from-top-2">
                     <input 
                        type="text" 
                        placeholder="Wallet Name"
                        value={newWalletName}
                        onChange={(e) => setNewWalletName(e.target.value)}
                        className="w-full p-3 text-sm rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                     />
                     <div className="flex gap-2">
                         {(['cash', 'card', 'bank', 'digital'] as const).map(type => (
                             <button
                                key={type}
                                onClick={() => setNewWalletType(type)}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all ${newWalletType === type ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-600'}`}
                             >
                                 {getWalletIcon(type)}
                             </button>
                         ))}
                     </div>
                     <button 
                        onClick={handleAddWallet}
                        disabled={!newWalletName.trim()}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-200 dark:shadow-none"
                     >
                         {t('save')}
                     </button>
                 </div>
             )}

             <div className="space-y-2">
                 {wallets.map(wallet => (
                     <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-xl">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm">
                                 {getWalletIcon(wallet.type)}
                             </div>
                             <span className="font-semibold text-gray-900 dark:text-white">{wallet.name}</span>
                         </div>
                         {wallets.length > 1 && (
                            <button 
                                onClick={() => onRemoveWallet(wallet.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                         )}
                     </div>
                 ))}
             </div>
          </div>

          {/* Budget & Travel Section */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                    <Plane size={16} /> {t('travelMode')} & Limit
                </h3>
             </div>

             <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white ml-1">{t('travelMode')}</span>
                <button 
                    onClick={toggleTravelMode}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${settings.travelMode ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${settings.travelMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    {t('monthlyLimit')}
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                        {CURRENCY_SYMBOLS[settings.currency] || '$'}
                    </span>
                    <input 
                        type="number"
                        value={settings.spendingLimit || ''}
                        onChange={(e) => onUpdateSettings({...settings, spendingLimit: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                </div>
            </div>
          </div>

          {/* Cloud Sync Section */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
             <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                <FileSpreadsheet size={16} /> {t('dataSync')}
             </h3>
             
             <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium leading-relaxed">
                    {isLoggedIn 
                        ? "Connected to Google Drive." 
                        : "Connect your Google account to automatically save every expense to a Google Sheet."}
                </p>
                
                {isLoggedIn ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                              G
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Google Account Linked</span>
                      </div>
                      
                      <button
                          onClick={onSync}
                          disabled={isSyncing}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                          {isSyncing ? "Syncing..." : "Sync Now"}
                      </button>

                      <button
                          onClick={onLogout}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                          <LogOut size={16} />
                          {t('signOut')}
                      </button>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={onLogin}
                            className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            {t('signInGoogle')}
                        </button>
                    </div>
                )}
             </div>
          </div>

           <div className="pt-4 text-center">
               <p className="text-xs text-gray-400">Xpense v1.0.0</p>
           </div>
         </div>
      </div>
    </div>
  );
};