import React, { useState, useRef } from 'react';
import { Mic, Loader2, Settings, ScanLine, Sparkles, Plane, Plus } from 'lucide-react';
import { useExpenses } from './hooks/useExpenses';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { EditExpenseModal } from './components/EditExpenseModal';
import { SettingsModal } from './components/SettingsModal';
import { InsightsModal } from './components/InsightsModal';
import { Onboarding } from './components/Onboarding';
import { InstallPWA } from './components/InstallPWA';
import { parseExpenseFromAudio, parseExpenseFromImage } from './services/geminiService';
import { ExpenseCategory, Expense, CURRENCY_SYMBOLS } from './types';
import { Logo } from './components/Logo';

const App: React.FC = () => {
  const { 
    expenses, // These are filtered
    allExpenses, 
    wallets,
    addExpense,
    addExpenses, 
    editExpense, 
    removeExpense, 
    loading,
    settings,
    updateSettings,
    isGoogleLoggedIn,
    userProfile,
    dateFilter,
    setDateFilter,
    showOnboarding,
    completeOnboarding,
    addWallet,
    removeWallet,
    login,
    logout,
    syncData,
    isSyncing,
    t
  } = useExpenses();
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Camera state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  
  // Header scroll state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // Initial check for API Key
  const hasApiKey = !!process.env.API_KEY;

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || settings.currency;

  const resolveWalletId = (walletName?: string): string => {
      if (!walletName) return wallets[0]?.id; // Default to first (usually Cash)
      
      const normalized = walletName.toLowerCase();
      const match = wallets.find(w => w.name.toLowerCase().includes(normalized) || normalized.includes(w.name.toLowerCase()));
      return match ? match.id : wallets[0]?.id;
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const currentScrollTop = scrollRef.current.scrollTop;
    
    // Ignore bounce effect on iOS
    if (currentScrollTop < 0) return;

    const isScrollingDown = currentScrollTop > lastScrollTop.current;
    const scrollDelta = Math.abs(currentScrollTop - lastScrollTop.current);

    // Only trigger if scroll delta is significant to avoid jitter
    if (scrollDelta > 5) {
        if (isScrollingDown && currentScrollTop > 20) {
            if (isHeaderVisible) setIsHeaderVisible(false);
        } else if (!isScrollingDown) {
            if (!isHeaderVisible) setIsHeaderVisible(true);
        }
    }
    
    lastScrollTop.current = currentScrollTop;
  };

  const startRecording = async (e: React.SyntheticEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (isProcessing || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        try {
          const availableWalletNames = wallets.map(w => w.name);
          const results = await parseExpenseFromAudio(
            base64Audio, 
            blob.type || 'audio/webm',
            settings.currency,
            availableWalletNames,
            settings.language
          );

          const validExpenses = results.filter(r => r.amount > 0);

          if (validExpenses.length === 0) {
            alert("No expenses detected in audio. Please try again.");
          } else {
             const newExpenses = validExpenses.map(exp => ({
                amount: exp.amount,
                category: exp.category || ExpenseCategory.OTHER,
                description: exp.description || 'Voice Entry',
                date: exp.date || new Date().toISOString(),
                walletId: resolveWalletId(exp.wallet)
             }));
             addExpenses(newExpenses);
          }
        } catch (error) {
          console.error("AI Parsing failed", error);
          alert("Could not understand the expense. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error("Audio processing failed", error);
      setIsProcessing(false);
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Image = (reader.result as string).split(',')[1];
        const availableWalletNames = wallets.map(w => w.name);
        const results = await parseExpenseFromImage(base64Image, file.type || 'image/jpeg', settings.currency, availableWalletNames, settings.language);
        
        const validExpenses = results.filter(r => r.amount > 0);

        if (validExpenses.length === 0) {
            alert("No expenses detected in image.");
        } else {
            const newExpenses = validExpenses.map(exp => ({
              amount: exp.amount,
              category: exp.category || ExpenseCategory.OTHER,
              description: exp.description || 'Receipt',
              date: exp.date || new Date().toISOString(),
              walletId: resolveWalletId(exp.wallet)
            }));
            addExpenses(newExpenses);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to analyze image.");
      } finally {
        setIsProcessing(false);
        // Reset input so the same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  const handleManualAdd = () => {
    setEditingExpense({
        id: '', // Empty ID signifies new expense
        amount: 0,
        category: ExpenseCategory.OTHER,
        description: '',
        date: new Date().toISOString(),
        walletId: wallets[0]?.id || '',
        createdAt: 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
         <div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
            <p className="text-gray-600 dark:text-gray-300">The <code>API_KEY</code> environment variable is missing.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans select-none transition-colors overflow-hidden flex flex-col">
      <div className="max-w-md mx-auto w-full h-full flex flex-col relative">
        
        {/* Header - Fixed/Absolute with Slide Animation */}
        <header className={`absolute top-0 left-0 right-0 z-20 px-6 pt-4 pb-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex items-center justify-between">
             <div>
               <div className="flex items-center gap-2">
                 <Logo className="w-10 h-10" />
                 {settings.travelMode && (
                   <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                     <Plane size={10} /> {t('travelMode')}
                   </span>
                 )}
               </div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium ml-1 flex items-center gap-1">
                 {userProfile && (
                     <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hi {userProfile.name.split(' ')[0]},</span>
                 )}
                 <span>
                    {dateFilter.type === 'today' ? t('todayExpenses') : 
                    dateFilter.type === 'month' ? t('monthExpenses') : t('trackExpenses')}
                 </span>
               </p>
             </div>
             
             <div className="flex gap-2">
                <button 
                  onClick={() => setIsInsightsOpen(true)}
                  className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <Sparkles size={20} />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <Settings size={20} />
                </button>
             </div>
          </div>
        </header>

        {/* Main Content - Padded top to account for header */}
        <main 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 px-6 overflow-y-auto no-scrollbar pb-36 pt-28" 
        >
          <Dashboard expenses={expenses} currencySymbol={currencySymbol} settings={settings} t={t} />
          <TransactionList 
            expenses={expenses} 
            onDelete={removeExpense} 
            onEdit={setEditingExpense}
            currencySymbol={currencySymbol}
            dateFilter={dateFilter}
            onFilterChange={setDateFilter}
            wallets={wallets}
            t={t}
          />
        </main>

        {/* Voice Interaction Zone */}
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-gray-100 via-gray-50/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 flex flex-col items-center justify-end z-40 pointer-events-none">
           {/* Floating instructions or feedback */}
           <div className={`mb-6 transition-all duration-300 ${isRecording || isProcessing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {isRecording ? t('listening') : isProcessing ? t('processing') : ""}
              </span>
           </div>

           <div className="flex items-center gap-6 pointer-events-auto">
             <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onTouchCancel={stopRecording}
              onContextMenu={(e) => e.preventDefault()}
              disabled={isProcessing}
              className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-900 ${
                isRecording 
                  ? 'bg-red-500 scale-110 shadow-red-500/50' 
                  : isProcessing 
                    ? 'bg-gray-400 scale-95 cursor-wait' 
                    : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 shadow-emerald-600/40'
              }`}
              style={{ touchAction: 'none' }} // Prevents scrolling while holding
            >
               {isProcessing ? (
                 <Loader2 size={32} className="text-white animate-spin" />
               ) : (
                 <Mic size={32} className={`text-white ${isRecording ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
               )}
               
               {/* Ripple effect rings when recording */}
               {isRecording && (
                 <>
                   <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                 </>
               )}
            </button>
           </div>
          
          <p className="mt-4 text-xs text-gray-400 font-medium">
             {isProcessing ? t('analyzing') : t('holdToSpeak')}
          </p>

          {/* Right Action Buttons */}
          <div className="absolute bottom-8 right-6 flex flex-col gap-4 pointer-events-auto items-center">
             
             {/* Camera Button (Secondary) */}
             {settings.showCamera && (
               <>
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   capture="environment"
                   className="hidden"
                   onChange={handleImageCapture}
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-10 h-10 bg-white dark:bg-gray-800 text-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
                  >
                    <ScanLine size={20} />
                  </button>
               </>
             )}

             {/* Manual Entry Button (Primary) */}
             {settings.showManualEntry && (
               <button 
                  onClick={handleManualAdd}
                  disabled={isProcessing}
                  className="w-12 h-12 bg-white dark:bg-gray-800 text-emerald-500 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
               >
                  <Plus size={24} />
               </button>
             )}

          </div>
        </div>
        
        {/* Modals */}
        <EditExpenseModal 
          isOpen={!!editingExpense}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={(expenseToSave) => {
            if (expenseToSave.id) {
               editExpense(expenseToSave);
            } else {
               // ID is empty, so it's a new expense
               addExpense({
                   amount: expenseToSave.amount,
                   category: expenseToSave.category,
                   description: expenseToSave.description,
                   date: expenseToSave.date,
                   walletId: expenseToSave.walletId
               });
            }
            setEditingExpense(null);
          }}
          currencySymbol={currencySymbol}
          wallets={wallets}
          t={t}
        />

        <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={updateSettings}
            isLoggedIn={isGoogleLoggedIn}
            onLogin={login}
            onLogout={logout}
            wallets={wallets}
            onAddWallet={addWallet}
            onRemoveWallet={removeWallet}
            onSync={syncData}
            isSyncing={isSyncing}
        />

        <InsightsModal 
            isOpen={isInsightsOpen}
            onClose={() => setIsInsightsOpen(false)}
            expenses={allExpenses} 
            currencySymbol={currencySymbol}
            t={t}
            language={settings.language}
        />

        <Onboarding 
            isOpen={showOnboarding} 
            onComplete={completeOnboarding}
            t={t} 
        />
        
        <InstallPWA />

      </div>
    </div>
  );
};

export default App;