import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  size = 'md',
  dot = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-sans font-bold tracking-tight rounded-full select-none';

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3.5 py-1 text-xs sm:text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const variantClasses: Record<BadgeVariant, { badge: string; dot: string }> = {
    primary: {
      badge: 'bg-purple-900 text-white border border-purple-800 shadow-sm',
      dot: 'bg-purple-300',
    },
    secondary: {
      badge: 'bg-purple-100 text-purple-900 border border-purple-200',
      dot: 'bg-purple-600',
    },
    accent: {
      badge: 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm',
      dot: 'bg-amber-500',
    },
    success: {
      badge: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      badge: 'bg-amber-50 text-amber-900 border border-amber-200',
      dot: 'bg-amber-500',
    },
    error: {
      badge: 'bg-rose-50 text-rose-900 border border-rose-200',
      dot: 'bg-rose-500',
    },
    neutral: {
      badge: 'bg-slate-100 text-slate-700 border border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const selected = variantClasses[variant];

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${selected.badge} ${className}`} {...props}>
      {dot && <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
