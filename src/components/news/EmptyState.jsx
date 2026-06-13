import React from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ onFetch, isLoading, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <Newspaper className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-bengali text-lg font-semibold text-foreground mb-2">
        {title || 'কোনো সংবাদ নেই'}
      </h3>
      <p className="font-bengali text-sm text-muted-foreground max-w-sm mb-6">
        {description || 'আজকের সংবাদ সারাংশ তৈরি করতে নিচের বোতামে ক্লিক করুন।'}
      </p>
      {onFetch && (
        <Button
          onClick={onFetch}
          disabled={isLoading}
          className="font-bengali gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'সংবাদ সংগ্রহ হচ্ছে...' : 'আজকের সংবাদ সংগ্রহ করুন'}
        </Button>
      )}
    </div>
  );
}