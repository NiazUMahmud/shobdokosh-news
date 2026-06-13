import React from 'react';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeClass = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-4';
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <div className={`${sizeClass} border-primary/20 border-t-primary rounded-full animate-spin`} />
      {text && <p className="text-sm text-muted-foreground font-bengali">{text}</p>}
    </div>
  );
}
