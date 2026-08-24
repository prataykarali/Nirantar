import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      containerClassName = '',
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-slate-800 tracking-tight"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 pointer-events-none text-purple-600/70 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full bg-white text-slate-900 placeholder:text-slate-400 font-sans text-sm sm:text-base rounded-2xl border-2 transition-all duration-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-11' : 'pl-4'
            } ${rightIcon ? 'pr-11' : 'pr-4'} py-3 sm:py-3.5 ${
              error
                ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-200'
                : 'border-purple-100 hover:border-purple-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 shadow-sm'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-4 flex items-center justify-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
            <span>●</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
