import React, { useState } from 'react';
import { Mic, ScanLine, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Logo } from './Logo';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  t: (key: string) => string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ isOpen, onComplete, t }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: t('welcome'),
      description: "Effortlessly track your expenses using the power of Artificial Intelligence.",
      icon: (
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
            <Logo className="w-8 h-8" />
        </div>
      ),
      color: "bg-emerald-500"
    },
    {
      title: "Speak to Log",
      description: "Just hold the microphone button and say 'Spent $15 on lunch'. AI handles the categorization.",
      icon: <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-6"><Mic size={32} /></div>,
      color: "bg-red-500"
    },
    {
      title: "Snap Receipts",
      description: "Take a photo of any receipt. We extract the items, dates, and prices automatically.",
      icon: <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 mb-6"><ScanLine size={32} /></div>,
      color: "bg-blue-500"
    },
    {
      title: "Ask for Insights",
      description: "Chat with your data. Ask 'How much did I spend on coffee this month?' to get instant answers.",
      icon: <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-500 mb-6"><Sparkles size={32} /></div>,
      color: "bg-purple-500"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center transition-colors">
        
        {/* Skip Button */}
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium"
        >
          {t('skip')}
        </button>

        {/* Content */}
        <div className="mt-8 flex-1 flex flex-col items-center">
          {steps[step].icon}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {steps[step].title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {steps[step].description}
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex gap-2 mt-8 mb-8">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? `w-8 ${steps[step].color}` : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <button
          onClick={handleNext}
          className={`w-full py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-gray-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 ${steps[step].color}`}
        >
          {step === steps.length - 1 ? (
            <>{t('getStarted')} <Check size={20} /></>
          ) : (
            <>{t('next')} <ArrowRight size={20} /></>
          )}
        </button>
      </div>
    </div>
  );
};