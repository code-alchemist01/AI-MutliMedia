import React from 'react';

interface SectionContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({ title, children, className = '' }) => {
  return (
    <section 
      className={`bg-themed-card backdrop-blur-lg shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-themed-primary transition-all duration-300 ease-in-out hover:shadow-lg hover:border-[var(--color-accent-primary)]/70 ${className}`}
      aria-labelledby={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <h2 
        id={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="font-poppins text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] via-[var(--color-accent-secondary)] to-[var(--color-accent-tertiary)] text-center sm:text-left"
      >
        {title}
      </h2>
      {children}
    </section>
  );
};
