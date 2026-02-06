import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Logo } from './Logo';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-36 left-0 right-0 z-40 flex justify-center px-6 animate-in slide-in-from-bottom-5 fade-in">
      <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full px-4 py-3 shadow-xl flex items-center gap-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 dark:bg-gray-200/50 p-2 rounded-full">
            <Logo className="w-5 h-5" />
          </div>
          <div className="text-sm">
            <p className="font-bold">Install Xpense</p>
            <p className="opacity-80 text-xs">Add to your home screen</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-white/20 dark:border-gray-200 pl-2">
            <button 
                onClick={handleInstallClick}
                className="font-bold text-sm text-emerald-400 dark:text-emerald-600 px-2 py-1"
            >
                Install
            </button>
            <button 
                onClick={() => setShowPrompt(false)}
                className="opacity-60 hover:opacity-100"
            >
                <X size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};