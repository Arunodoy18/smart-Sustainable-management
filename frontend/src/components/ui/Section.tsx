'use client';

import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  background?: 'default' | 'subtle' | 'transparent';
  contentClassName?: string;
}

export default function Section({ 
  children, 
  className = '', 
  id,
  background = 'transparent',
  contentClassName = ''
}: SectionProps) {
  const bgClasses = {
    default: 'bg-[#0a0a0f]',
    subtle: 'bg-white/[0.02]',
    transparent: ''
  };

  return (
    <section 
      id={id}
      className={`py-24 px-6 md:px-16 ${bgClasses[background]} ${className}`}
    >
      <div className={`max-w-7xl mx-auto ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}
