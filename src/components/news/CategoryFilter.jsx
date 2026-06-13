import React from 'react';
import { Badge } from '@/components/ui/badge';

const categories = [
  { value: 'all', label: 'সব', labelEn: 'All' },
  { value: 'politics', label: 'রাজনীতি', labelEn: 'Politics' },
  { value: 'economy', label: 'অর্থনীতি', labelEn: 'Economy' },
  { value: 'international', label: 'আন্তর্জাতিক', labelEn: 'International' },
  { value: 'sports', label: 'খেলাধুলা', labelEn: 'Sports' },
  { value: 'science_tech', label: 'বিজ্ঞান ও প্রযুক্তি', labelEn: 'Sci & Tech' },
  { value: 'education', label: 'শিক্ষা', labelEn: 'Education' },
  { value: 'law_order', label: 'আইন-শৃঙ্খলা', labelEn: 'Law & Order' },
  { value: 'environment', label: 'পরিবেশ', labelEn: 'Environment' },
  { value: 'health', label: 'স্বাস্থ্য', labelEn: 'Health' },
  { value: 'culture', label: 'সংস্কৃতি', labelEn: 'Culture' },
];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selected === cat.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <span className="font-bengali">{cat.label}</span>
        </button>
      ))}
    </div>
  );
}