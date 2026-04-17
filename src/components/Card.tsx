import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle, onClick }) => {
  return (
    <div 
      className={cn('bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden', onClick && 'cursor-pointer hover:shadow-lg transition-shadow', className)}
      onClick={onClick}
    >
      {title && (
        <div className="bg-[#F7FAFC] px-6 py-4 border-bottom border-gray-200">
          <h3 className="text-lg font-bold text-[#2D3748] uppercase tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
