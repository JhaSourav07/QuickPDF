import React from 'react';

export function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-white text-black hover:bg-zinc-200 focus:ring-white',
    secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-700',
    outline: 'border border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/25 focus:ring-white/50',
    danger: 'bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-400 focus:ring-red-500',
  };

  const defaultSize = 'h-11 px-8 text-sm tracking-wide';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${defaultSize} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}