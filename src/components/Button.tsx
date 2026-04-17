import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#003366] text-white hover:bg-[#002244] border-b-4 border-[#001122] active:border-b-0 active:translate-y-1',
      secondary: 'bg-[#4A5568] text-white hover:bg-[#2D3748] border-b-4 border-[#1A202C] active:border-b-0 active:translate-y-1',
      danger: 'bg-[#E53E3E] text-white hover:bg-[#C53030] border-b-4 border-[#9B2C2C] active:border-b-0 active:translate-y-1',
      destructive: 'bg-[#E53E3E] text-white hover:bg-[#C53030] border-b-4 border-[#9B2C2C] active:border-b-0 active:translate-y-1',
      success: 'bg-[#38A169] text-white hover:bg-[#2F855A] border-b-4 border-[#22543D] active:border-b-0 active:translate-y-1',
      warning: 'bg-[#D69E2E] text-white hover:bg-[#B7791F] border-b-4 border-[#744210] active:border-b-0 active:translate-y-1',
      ghost: 'bg-transparent text-[#003366] hover:bg-[#EDF2F7]',
      outline: 'bg-transparent border-2 border-[#003366] text-[#003366] hover:bg-[#EDF2F7]',
    };

    const sizes = {
      xs: 'px-2 py-1 text-[10px] font-black uppercase tracking-tight',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg font-bold',
      xl: 'px-8 py-5 text-2xl font-black uppercase tracking-wider',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-300',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
