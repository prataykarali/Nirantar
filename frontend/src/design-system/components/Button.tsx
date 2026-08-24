import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  // Base styling: Accessible, rounded, focus ring, smooth transition
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

  // Size styling: Avoid small text, keep large touch targets
  const sizeClasses: Record<ButtonSize, string> = {
    lg: 'h-13 px-7 text-base rounded-full gap-2.5 shadow-md',
    md: 'h-11 px-5 text-sm rounded-full gap-2 shadow-sm',
    sm: 'h-9 px-4 text-xs rounded-full gap-1.5',
  };

  // Variant styling
  const variantClasses: Record<ButtonVariant, string> = {
    // Royal Purple gradient with subtle shadow
    primary:
      'bg-gradient-to-r from-purple-800 via-purple-700 to-purple-800 hover:from-purple-700 hover:to-purple-600 text-white shadow-purple-900/20 focus:ring-purple-600 border border-purple-600/30',
    // Soft Lavender background
    secondary:
      'bg-purple-100/80 hover:bg-purple-200/80 text-purple-900 border border-purple-200 focus:ring-purple-400',
    // Warm Golden Yellow accent
    accent:
      'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold shadow-amber-500/25 focus:ring-amber-500 border border-amber-300',
    // Clean Outline with Lavender tint border
    outline:
      'bg-white hover:bg-purple-50/60 text-purple-900 border-2 border-purple-200 hover:border-purple-300 focus:ring-purple-500',
    // Ghost
    ghost:
      'bg-transparent hover:bg-purple-100/50 text-purple-800 focus:ring-purple-400',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
