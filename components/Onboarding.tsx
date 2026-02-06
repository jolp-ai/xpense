import React, { useState } from 'react';
import { Mic, Receipt, Sparkles } from 'lucide-react';
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
      description: "Effortlessly track your daily expenses using the power of AI.",
      icon: (
        <div className="w-32 h-32 flex items-center justify-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500">
           <Logo className="w-full h-full" />
        </div>
      )
    },
    {
      title: "Speak to Log",
      description: "Simply hold the mic and say 'Spent $15 on lunch'. AI does the rest.",
      icon: (
        <div className="w-32 h-32 flex items-center justify-center bg-red-100 rounded-full text-red-500 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
           <Mic size={64} strokeWidth={2} />
        </div>
      )
    },
    {
      title: "Snap Receipts",
      description: "Take a photo of your receipt. We extract the details automatically.",
      icon: (
        <div className="w-32 h-32 flex items-center justify-center bg-blue-100 rounded-full text-blue-500 shadow-xl animate-in zoom-in duration-500 delay-100">
            <Receipt size={64} strokeWidth={2} />
        </div>
      )
    },
    {
      title: "Smart Insights",
      description: "Chat with your data. Ask 'How much did I spend on coffee?'",
      icon: (
        <div className="w-32 h-32 flex items-center justify-center bg-emerald-100 rounded-full text-emerald-500 shadow-xl animate-in fade-in spin-in-3 duration-700">
            <Sparkles size={64} strokeWidth={2} />
        </div>
      )
    }
  ];

  const renderDecorations = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <>
             <div className="absolute -top-6 -right-6 w-14 h-14 bg-yellow-400 rounded-2xl rotate-12 shadow-lg animate-bounce delay-75 flex items-center justify-center text-indigo-900 font-bold opacity-90 z-20">
                <span className="text-xl">✨</span>
             </div>
             <div className="absolute top-1/2 -left-8 w-10 h-10 bg-emerald-400 rounded-full shadow-lg animate-pulse delay-100 opacity-90 z-20" />
             <div className="absolute -bottom-4 -right-2 w-12 h-12 bg-blue-400 rounded-xl -rotate-6 shadow-lg animate-bounce delay-300 opacity-90 z-20" />
          </>
        );
      case 1: // Voice
        return (
          <>
             <div className="absolute -top-2 -right-2 w-16 h-16 bg-red-400/30 rounded-full animate-ping z-20" style={{ animationDuration: '2s' }} />
             <div className="absolute top-1/2 -left-6 w-12 h-12 bg-orange-400 rounded-full animate-pulse delay-75 z-20 opacity-80" />
             <div className="absolute -bottom-6 right-1/2 translate-x-1/2 w-24 h-2 bg-white/40 rounded-full animate-pulse delay-150 z-20" />
             <div className="absolute top-0 left-0 w-full h-full border-2 border-white/20 rounded-[2.5rem] animate-pulse z-10" />
          </>
        );
      case 2: // Receipt
        return (
           <>
              <div className="absolute -top-5 -left-5 w-12 h-12 border-t-4 border-l-4 border-white/60 rounded-tl-2xl z-20 animate-pulse" />
              <div className="absolute -bottom-5 -right-5 w-12 h-12 border-b-4 border-r-4 border-white/60 rounded-br-2xl z-20 animate-pulse delay-150" />
              <div className="absolute top-4 -right-4 w-10 h-10 bg-yellow-300 rounded-full shadow-[0_0_20px_rgba(253,224,71,0.6)] animate-pulse z-20 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-full animate-ping opacity-40" />
              </div>
           </>
        );
      case 3: // Insights
        return (
            <>
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_15px_white] animate-bounce z-20" />
               <div className="absolute top-1/3 -right-8 w-4 h-4 bg-purple-300 rounded-full shadow-lg animate-ping delay-300 z-20" />
               <div className="absolute bottom-10 -left-6 w-8 h-8 bg-emerald-300 rounded-full shadow-lg animate-bounce delay-700 z-20 opacity-80" />
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] z-10 animate-pulse" />
            </>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-between font-sans text-white overflow-hidden">
       {/* Background Elements for texture */}
       <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-400/30 rounded-full blur-3xl pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-pink-500/30 rounded-full blur-3xl pointer-events-none" />

       {/* Skip Button */}
       <button 
         onClick={onComplete}
         className="absolute top-12 right-6 z-20 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
       >
         {t('skip')}
       </button>

       {/* Main Content */}
       <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm px-6 pb-10 mt-10">
          
          {/* 3D-style Image Container */}
          <div className="relative w-64 h-64 mb-10 group cursor-pointer" onClick={handleNext}>
             {/* Main Image Card */}
             <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20 transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1 shadow-2xl overflow-visible flex items-center justify-center">
                 {/* Icon Container */}
                 <div className="transform transition-transform duration-500 group-hover:scale-110 relative z-30">
                    {steps[step].icon}
                 </div>
                 
                 {/* Subtle overlay */}
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[2.5rem] overflow-hidden"></div>
             </div>
             
             {/* Dynamic Floating Elements */}
             {renderDecorations()}
          </div>

          {/* Text */}
          <div className="text-center space-y-4">
             <h1 key={`t-${step}`} className="text-3xl font-bold tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-500">
                {steps[step].title}
             </h1>
             <p key={`d-${step}`} className="text-indigo-100 text-lg leading-relaxed opacity-90 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100">
                {steps[step].description}
             </p>
          </div>
       </div>

       {/* Bottom Actions */}
       <div className="relative z-10 w-full max-w-sm px-6 pb-12 flex flex-col items-center gap-8">
          {/* Pagination */}
          <div className="flex gap-2.5">
             {steps.map((_, i) => (
                <div 
                   key={i} 
                   className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      i === step 
                        ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                        : 'w-2 bg-white/30'
                   }`} 
                />
             ))}
          </div>

          {/* Button */}
          <button
            onClick={handleNext}
            className="w-full py-4 bg-white text-indigo-600 font-bold text-lg rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all hover:bg-indigo-50 flex items-center justify-center gap-2 group"
          >
            {step === steps.length - 1 ? t('getStarted') : t('next')}
          </button>
       </div>
    </div>
  );
};