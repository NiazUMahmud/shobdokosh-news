import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, BookOpen, Download, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const categoryLabels = {
  politics: 'রাজনীতি', economy: 'অর্থনীতি', international: 'আন্তর্জাতিক',
  sports: 'খেলাধুলা', science_tech: 'বিজ্ঞান ও প্রযুক্তি', education: 'শিক্ষা',
  law_order: 'আইন-শৃঙ্খলা', environment: 'পরিবেশ', health: 'স্বাস্থ্য', culture: 'সংস্কৃতি',
};

// Static card rendered off-screen for download capture
function DownloadCard({ news }) {
  return (
    <div
      style={{
        width: '600px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif",
        border: '2px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            background: '#f1f5f9', color: '#334155', borderRadius: '999px',
            padding: '3px 10px', fontSize: '12px', fontWeight: 600,
          }}>
            {categoryLabels[news.category] || news.category}
          </span>
          {news.bcs_relevance && (
            <span style={{
              border: '1px solid #f59e0b', color: '#92400e', background: '#fffbeb',
              borderRadius: '999px', padding: '3px 10px', fontSize: '12px', fontWeight: 600,
            }}>
              BCS
            </span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{news.source || ''}</span>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1.5, marginBottom: '8px' }}>
        {news.title_bn}
      </h2>
      {news.title_en && (
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{news.title_en}</p>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

      {/* Summary */}
      <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.8, marginBottom: '20px' }}>
        {news.summary_bn}
      </p>

      {/* Key Facts */}
      {news.key_facts && news.key_facts.length > 0 && (
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>মূল তথ্য:</p>
          {news.key_facts.map((fact, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', marginTop: '6px', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#334155' }}>{fact}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>সংবাদ সারাংশ · Bangladesh News Digest</span>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{news.news_date || ''}</span>
      </div>
    </div>
  );
}

export default function FlashCard({ news, isSaved, onSave, onUnsave }) {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const downloadRef = useRef(null);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const node = downloadRef.current;
      // Temporarily make it visible for capture
      node.style.position = 'fixed';
      node.style.left = '-9999px';
      node.style.top = '0';
      node.style.display = 'block';

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      node.style.display = 'none';
      node.style.position = '';
      node.style.left = '';
      node.style.top = '';

      const link = document.createElement('a');
      link.download = `flashcard-${news.id || Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      if (isSaved) {
        await onUnsave(news);
      } else {
        await onSave(news);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Hidden download target */}
      <div ref={downloadRef} style={{ display: 'none' }}>
        <DownloadCard news={news} />
      </div>

      {/* Action buttons row */}
      <div className="flex justify-end gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className={`h-8 gap-1.5 text-xs ${isSaved ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground'}`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="h-8 gap-1.5 text-xs text-muted-foreground"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Download</span>
        </Button>
      </div>

      {/* Flip card */}
      <div
        className="cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full min-h-[280px]"
        >
          {/* Front */}
          <Card
            className="absolute inset-0 p-6 flex flex-col justify-between border-2 border-primary/10"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="font-bengali text-xs">
                  {categoryLabels[news.category] || news.category}
                </Badge>
                {news.bcs_relevance && (
                  <Badge variant="outline" className="text-xs border-amber-400 bg-amber-50 text-amber-700">
                    <BookOpen className="w-3 h-3 mr-1" />
                    BCS
                  </Badge>
                )}
              </div>
              <h3 className="font-bengali text-xl font-bold leading-relaxed text-foreground">
                {news.title_bn}
              </h3>
              {news.title_en && (
                <p className="font-inter text-sm text-muted-foreground mt-2">{news.title_en}</p>
              )}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mt-4">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs font-inter">Tap card to reveal details</span>
            </div>
          </Card>

          {/* Back */}
          <Card
            className="absolute inset-0 p-6 flex flex-col border-2 border-amber-200 bg-card overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="font-bengali text-sm leading-relaxed text-foreground/90 flex-1">
              {news.summary_bn}
            </p>
            {news.key_facts && news.key_facts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="font-bengali text-xs font-semibold text-amber-700 mb-2">মূল তথ্য:</p>
                <ul className="space-y-1.5">
                  {news.key_facts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-bengali text-foreground/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mt-4">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs font-inter">Tap to flip back</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}