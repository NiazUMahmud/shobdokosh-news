import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, RotateCcw, Shuffle, Bookmark, BookmarkCheck,
  Award, Layers, ExternalLink
} from 'lucide-react';

const CATEGORIES = ['all','রাজনীতি','অর্থনীতি','আন্তর্জাতিক','শিক্ষা','বিজ্ঞান ও প্রযুক্তি','আইন-শৃঙ্খলা','পরিবেশ','স্বাস্থ্য','খেলাধুলা'];

function FlipCard({ article, flipped, onFlip }) {
  return (
    <div className="relative min-h-[300px]" style={{ perspective: '1000px' }}>
      <div onClick={onFlip} className="cursor-pointer w-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', position: 'relative' }}>

        {/* Front face */}
        <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-lg p-8 min-h-[300px] flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}>
          <div>
            {article.bcs_relevance && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] mb-4 font-bengali">
                <Award className="w-3 h-3" /> BCS প্রাসঙ্গিক
              </span>
            )}
            <p className="text-xs text-gray-400 mb-2 font-bengali">{article.category} · {article.source_label}</p>
            <h3 className="text-xl font-bold text-gray-900 leading-snug font-bengali">{article.title_bn}</h3>
          </div>
          <p className="text-xs text-center text-gray-400 font-bengali animate-pulse mt-6">ট্যাপ করুন উত্তর দেখতে →</p>
        </div>

        {/* Back face */}
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d6a4f] text-white rounded-2xl shadow-lg p-8 min-h-[300px] flex flex-col justify-between absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div>
            <p className="text-xs text-white/60 mb-3 font-bengali">সারসংক্ষেপ</p>
            <p className="text-base leading-relaxed font-bengali">{article.summary_bn}</p>
            {article.key_facts?.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs text-white/60 font-bengali">মূল তথ্য</p>
                {article.key_facts.slice(0, 3).map((f, i) => (
                  <p key={i} className="text-sm text-white/90 font-bengali">• {f}</p>
                ))}
              </div>
            )}
          </div>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white mt-4 transition font-bengali">
              <ExternalLink className="w-3.5 h-3.5" /> মূল সংবাদ পড়ুন
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Flashcards() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState('all');
  const [bcsOnly, setBcsOnly] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: articles = [], isLoading, refetch } = useQuery({
    queryKey: ['flashcard-articles', category, bcsOnly],
    queryFn: async () => {
      let q = supabase.from('news_articles').select('*').eq('is_active', true)
        .order('relevance_score', { ascending: false }).limit(100);
      if (category !== 'all') q = q.eq('category', category);
      if (bcsOnly) q = q.eq('bcs_relevance', true);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: savedItems = [] } = useQuery({
    queryKey: ['saved-news', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('saved_items').select('item_id')
        .eq('user_id', user.id).eq('item_type', 'news');
      return data || [];
    },
  });

  const savedIds = new Set(savedItems.map(s => s.item_id));

  const toggleSave = useMutation({
    mutationFn: async (id) => {
      if (!user) { toast.error('সংরক্ষণ করতে লগইন করুন।'); return; }
      if (savedIds.has(id)) {
        await supabase.from('saved_items').delete()
          .eq('user_id', user.id).eq('item_id', id).eq('item_type', 'news');
      } else {
        await supabase.from('saved_items').insert({ user_id: user.id, item_id: id, item_type: 'news' });
      }
    },
    onSuccess: () => qc.invalidateQueries(['saved-news', user?.id]),
  });

  const handleFilter = (fn) => { fn(); setIdx(0); setFlipped(false); };
  const prev = () => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); };
  const next = () => { setIdx(i => Math.min(articles.length - 1, i + 1)); setFlipped(false); };
  const current = articles[idx];

  return (
    <>
      <Helmet>
        <title>ফ্ল্যাশকার্ড | শব্দকোষ নিউজ</title>
        <meta name="description" content="সংবাদভিত্তিক ফ্ল্যাশকার্ডে BCS কারেন্ট অ্যাফেয়ার্স অনুশীলন করুন।" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">ফ্ল্যাশকার্ড</h1>
          <p className="text-sm text-gray-500 font-bengali mt-1">সংবাদ পড়ুন, বিষয়বস্তু মনে রাখুন</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => handleFilter(() => setCategory(cat))}
                className={`text-xs px-3 py-1.5 rounded-full transition font-bengali ${
                  category === cat ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {cat === 'all' ? 'সব বিষয়' : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => handleFilter(() => setBcsOnly(!bcsOnly))}
                className={`w-10 h-5 rounded-full transition-colors relative ${bcsOnly ? 'bg-[#2d6a4f]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${bcsOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-600 font-bengali">শুধু BCS প্রাসঙ্গিক</span>
            </label>
            <button onClick={() => { qc.invalidateQueries(['flashcard-articles']); setIdx(0); setFlipped(false); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a5f] font-bengali transition">
              <Shuffle className="w-4 h-4" /> শাফেল
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bengali">কোনো ফ্ল্যাশকার্ড নেই।</p>
          </div>
        ) : current ? (
          <>
            <p className="text-center text-sm text-gray-500 mb-4 font-bengali">{idx + 1} / {articles.length}</p>

            <FlipCard article={current} flipped={flipped} onFlip={() => setFlipped(!flipped)} />

            <div className="flex items-center justify-between mt-6">
              <button onClick={prev} disabled={idx === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bengali disabled:opacity-40 hover:bg-gray-50 transition">
                <ChevronLeft className="w-4 h-4" /> আগের
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setFlipped(false)} title="উল্টো করুন"
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-500">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => toggleSave.mutate(current.id)}
                  className={`p-2 rounded-xl border transition ${
                    savedIds.has(current.id) ? 'border-[#2d6a4f] text-[#2d6a4f] bg-green-50' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}>
                  {savedIds.has(current.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={next} disabled={idx === articles.length - 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] hover:bg-[#163050] text-white text-sm font-bengali disabled:opacity-40 transition">
                পরের <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 bg-gray-200 rounded-full h-1">
              <div className="bg-[#1e3a5f] h-1 rounded-full transition-all"
                style={{ width: `${((idx + 1) / articles.length) * 100}%` }} />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
