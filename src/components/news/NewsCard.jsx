import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Star, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const categoryLabels = {
  politics: { bn: 'রাজনীতি', color: 'bg-red-100 text-red-700' },
  economy: { bn: 'অর্থনীতি', color: 'bg-emerald-100 text-emerald-700' },
  international: { bn: 'আন্তর্জাতিক', color: 'bg-blue-100 text-blue-700' },
  sports: { bn: 'খেলাধুলা', color: 'bg-orange-100 text-orange-700' },
  science_tech: { bn: 'বিজ্ঞান ও প্রযুক্তি', color: 'bg-purple-100 text-purple-700' },
  education: { bn: 'শিক্ষা', color: 'bg-indigo-100 text-indigo-700' },
  law_order: { bn: 'আইন-শৃঙ্খলা', color: 'bg-slate-100 text-slate-700' },
  environment: { bn: 'পরিবেশ', color: 'bg-teal-100 text-teal-700' },
  health: { bn: 'স্বাস্থ্য', color: 'bg-pink-100 text-pink-700' },
  culture: { bn: 'সংস্কৃতি', color: 'bg-amber-100 text-amber-700' },
};

const importanceDots = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

export default function NewsCard({ news }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryLabels[news.category] || { bn: news.category, color: 'bg-muted text-muted-foreground' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border/60"
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-2 h-2 rounded-full ${importanceDots[news.importance] || importanceDots.medium}`} />
                <Badge variant="secondary" className={`text-[10px] px-2 py-0 ${cat.color}`}>
                  {cat.bn}
                </Badge>
                {news.bcs_relevance && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent text-accent-foreground bg-accent/20">
                    <BookOpen className="w-2.5 h-2.5 mr-0.5" />
                    BCS
                  </Badge>
                )}
                {news.source && (
                  <span className="text-[10px] text-muted-foreground font-inter">{news.source}</span>
                )}
              </div>

              <h3 className="font-bengali text-base font-semibold leading-relaxed text-foreground">
                {news.title_bn}
              </h3>
              {news.title_en && (
                <p className="font-inter text-xs text-muted-foreground mt-0.5">{news.title_en}</p>
              )}
            </div>

            <button className="shrink-0 mt-1 text-muted-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="font-bengali text-sm leading-relaxed text-foreground/80">
                    {news.summary_bn}
                  </p>
                  {news.summary_en && (
                    <p className="font-inter text-xs text-muted-foreground mt-2 leading-relaxed">
                      {news.summary_en}
                    </p>
                  )}
                  {news.key_facts && news.key_facts.length > 0 && (
                    <div className="mt-3">
                      <p className="font-bengali text-xs font-semibold text-muted-foreground mb-1.5">
                        মূল তথ্য:
                      </p>
                      <ul className="space-y-1">
                        {news.key_facts.map((fact, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-bengali text-foreground/70">
                            <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}