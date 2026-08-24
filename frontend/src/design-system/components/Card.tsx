import React from 'react';

export type CardVariant = 'standard' | 'hero' | 'interactive' | 'highlight' | 'lavender';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  padding = 'lg',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'transition-all duration-200';

  const variantClasses: Record<CardVariant, string> = {
    // Pure White with soft purple-tint shadow and crisp lavender border
    standard:
      'bg-white border border-purple-100/90 rounded-3xl shadow-[0_4px_24px_rgba(88,28,135,0.06)]',
    // Hero with soft ambient lavender glow
    hero:
      'bg-gradient-to-br from-white via-purple-50/40 to-purple-100/20 border border-purple-200/80 rounded-3xl lg:rounded-4xl shadow-[0_10px_35px_rgba(88,28,135,0.08)]',
    // Interactive card with hover elevation
    interactive:
      'bg-white border border-purple-100 rounded-2xl hover:border-purple-300 hover:shadow-[0_12px_30px_rgba(88,28,135,0.12)] hover:-translate-y-0.5 cursor-pointer active:translate-y-0',
    // Highlight with golden accent border & glow
    highlight:
      'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-2 border-amber-300/80 rounded-3xl shadow-[0_6px_25px_rgba(245,158,11,0.12)]',
    // Soft Lavender Canvas
    lavender:
      'bg-purple-50/70 border border-purple-200/60 rounded-3xl shadow-sm',
  };

  const paddingClasses: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
