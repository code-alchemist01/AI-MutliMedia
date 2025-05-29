import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message, className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3', // Tailwind doesn't have border-3 by default, use custom or existing
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center my-4 ${className}`} role="status" aria-live="assertive">
      <div
        className={`animate-spin rounded-full border-[var(--color-accent-primary)] border-t-transparent ${sizeClasses[size]}`}
        style={{borderWidth: size === 'md' ? '3px' : undefined}} // Custom border width for md
      ></div>
      {message && <p className="mt-3 text-sm text-themed-muted">{message}</p>}
    </div>
  );
};
