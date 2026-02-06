import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M384 96L128 416" stroke="#10b981" strokeWidth="64" strokeLinecap="round"/>
    <path d="M384 416L128 96" stroke="#34d399" strokeWidth="64" strokeLinecap="round"/>
  </svg>
);

export const LogoWithText: React.FC<{ className?: string, textSize?: string }> = ({ className = "", textSize = "text-2xl" }) => (
  <div className={`font-black tracking-tight flex items-center gap-2 text-gray-900 dark:text-white ${className}`}>
    <Logo className="w-8 h-8" />
    <span className={textSize}>X<span className="text-emerald-500">pense</span></span>
  </div>
);
