import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, BookmarkCheck, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const categoryLabels = {
  politics: 'রাজনীতি', economy: 'অর্থনীতি', international: 'আন্তর্জাতিক',
  sports: 'খেলাধুলা', science_tech: 'বিজ্ঞান ও প্রযুক্তি', education: 'শিক্ষা',
  law_order: 'আইন-শৃঙ্খলা', environment: 'পরিবেশ', health: 'স্বাস্থ্য', culture: 'সংস্কৃতি',
};

export default function SavedFlashCard({ news, onUnsave }) {
  const [downloading, setDownloading] = useState(false);
  const [unsaving, setUnsaving] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const node = document.getElementById(`saved-card-${news.id}`);
    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const link = document.createElement('a');
      link.download = `flashcard-${news.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleUnsave = async () => {
    setUnsaving(true);
    await onUnsave(news);
    setUnsaving(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-bengali text-xs">
            {categoryLabels[news.category] || news.category}
          </Badge>
          {news.bcs_relevance && (
            <Badge variant="outline" className="text-xs border-amber-400 bg-amber-50 text-amber-700">
              <BookOpen className="w-3 h-3 mr-1" />BCS
            </Badge>
          )}
          {news.source && (
            <span className="text-[11px] text-muted-foreground font-inter">{news.source}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-amber-500 hover:text-amber-600"
            onClick={handleUnsave}
            disabled={unsaving}
          >
            {unsaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkCheck className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Two-panel body — capturable */}
      <div id={`saved-card-${news.id}`} className="grid grid-cols-2 divide-x divide-border bg-card">
        {/* Front: Question / Title */}
        <div className="p-4 flex flex-col gap-2">
          <p className="text-[10px] font-inter font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Question
          </p>
          <h3 className="font-bengali text-sm font-bold leading-relaxed text-foreground">
            {news.title_bn}
          </h3>
          {news.title_en && (
            <p className="font-inter text-xs text-muted-foreground leading-relaxed">{news.title_en}</p>
          )}
          {news.news_date && (
            <p className="font-inter text-[10px] text-muted-foreground mt-auto pt-2">{news.news_date}</p>
          )}
        </div>

        {/* Back: Answer / Summary + Facts */}
        <div className="p-4 flex flex-col gap-2 bg-amber-50/30">
          <p className="text-[10px] font-inter font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Answer
          </p>
          <p className="font-bengali text-xs leading-relaxed text-foreground/90">
            {news.summary_bn}
          </p>
          {news.key_facts && news.key_facts.length > 0 && (
            <div className="mt-1 pt-2 border-t border-border/50">
              <p className="font-bengali text-[10px] font-semibold text-amber-700 mb-1">মূল তথ্য:</p>
              <ul className="space-y-1">
                {news.key_facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] font-bengali text-foreground/80">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}