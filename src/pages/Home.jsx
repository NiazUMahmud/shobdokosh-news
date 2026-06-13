import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ExternalLink, Bookmark, BookmarkCheck, RefreshCw, Award, ChevronDown, ChevronUp,
  Newspaper, TrendingUp, Clock, Filter
} from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'all',       label: 'সব' },
  { value: 'রাজনীতি',   label: 'রাজনীতি' },
  { value: 'অর্থনীতি',  label: 'অর্থনীতি' },
  { value: 'আন্তর্জাতিক', label: 'আন্তর্জাতিক' },
  { value: 'শিক্ষা',    label: 'শিক্ষা' },
  { value: 'বিজ্ঞান ও প্রযুক্তি', label: 'বিজ্ঞান ও প্রযুক্তি' },
  { value: 'আইন-শৃঙ্খলা', label: 'আইন-শৃঙ্খলা' },
  { value: 'পরিবেশ',   label: 'পরিবেশ' },
  { value: 'স্বাস্থ্য', label: 'স্বাস্থ্য' },
  { value: 'খেলাধুলা', label: 'খেলাধুলা' },
];

const IMPORTANCE_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-blue-100 text-blue-700 border-blue-200',
  low:      'bg-gray-100 text-gray-600 border-gray-200',
};

const IMPORTANCE_LABELS = {
  critical: 'অত্যন্ত গুরুত্বপূর্ণ',
  high:     'গুরুত্বপূর্ণ',
  medium:   'মাঝারি',
  low:      'কম গুরুত্বপূর্ণ',
};

const SOURCE_COLORS = {
  prothom_alo:  'bg-green-50 text-green-800',
  daily_star:   'bg-blue-50 text-blue-800',
  jugantor:     'bg-purple-50 text-purple-800',
  bd_pratidin:  'bg-yellow-50 text-yellow-800',
  kaler_kantho: 'bg-red-50 text-red-800',
};

function NewsCard({ article, savedIds, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);
  const isSaved = savedIds.has(article.id);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        {/* Badges row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium font-bengali ${IMPORTANCE_COLORS[article.importance] || IMPORTANCE_COLORS.medium}`}>
              {IMPORTANCE_LABELS[article.importance] || article.importance}
            </span>
            {article.bcs_relevance && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] border border-[#1e3a5f]/20 font-medium font-bengali">
                <Award className="w-3 h-3" /> BCS প্রাসঙ্গিক
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-bengali">
              {article.category}
            </span>
          </div>
          {article.relevance_score > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-[#2d6a4f]" />
              <span className="text-xs font-bold text-[#2d6a4f]">{article.relevance_score}%</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-1 font-bengali">
          {article.title_bn}
        </h2>
        {article.title_en && (
          <p className="text-sm text-gray-500 leading-snug mb-3">{article.title_en}</p>
        )}

        {/* Source + date */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SOURCE_COLORS[article.source_name] || 'bg-gray-100 text-gray-600'}`}>
            {article.source_label || article.source_name}
          </span>
          {article.published_at && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {format(new Date(article.published_at), 'dd MMM yyyy')}
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-700 leading-relaxed font-bengali">{article.summary_bn}</p>
        {expanded && article.summary_en && (
          <p className="text-sm text-gray-500 mt-2 leading-relaxed italic">{article.summary_en}</p>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {article.key_facts?.length > 0 && (
            <div className="bg-[#1e3a5f]/5 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#1e3a5f] mb-2 font-bengali uppercase tracking-wide">মূল তথ্য</p>
              <ul className="space-y-1.5">
                {article.key_facts.map((fact, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 font-bengali">
                    <span className="text-[#2d6a4f] font-bold shrink-0">{i + 1}.</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {article.mcq_questions?.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-3 font-bengali uppercase tracking-wide">অনুশীলন প্রশ্ন</p>
              {article.mcq_questions.slice(0, 1).map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium text-gray-800 mb-2 font-bengali">{q.question_bn}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {q.options?.map(opt => (
                      <div key={opt.key}
                        className={`text-xs px-3 py-2 rounded-lg border font-bengali ${
                          opt.key === q.correct_answer
                            ? 'bg-green-50 border-green-200 text-green-800 font-semibold'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}>
                        ({opt.key}) {opt.text_bn}
                      </div>
                    ))}
                  </div>
                  {q.explanation_bn && (
                    <p className="text-xs text-gray-500 mt-2 font-bengali">
                      <span className="font-semibold text-green-700">ব্যাখ্যা:</span> {q.explanation_bn}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <div>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#1e3a5f] hover:text-[#163050] font-medium transition font-bengali">
              <ExternalLink className="w-3.5 h-3.5" />
              মূল সংবাদ পড়ুন
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggleSave(article.id)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition font-bengali ${
              isSaved ? 'text-[#2d6a4f] bg-green-50' : 'text-gray-500 hover:text-[#1e3a5f] hover:bg-gray-100'
            }`}>
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isSaved ? 'সংরক্ষিত' : 'সংরক্ষণ'}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition font-bengali">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'সংক্ষিপ্ত' : 'বিস্তারিত'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState('all');
  const [bcsOnly, setBcsOnly] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const { data: articles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['news', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('news_date', today)
        .eq('is_active', true)
        .order('relevance_score', { ascending: false });
      if (error) throw error;
      if (!data?.length) {
        const res = await fetch('/.netlify/functions/fetch-news');
        const json = await res.json();
        return json.articles || [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: savedItems = [] } = useQuery({
    queryKey: ['saved-news', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'news');
      return data || [];
    },
  });

  const savedIds = new Set(savedItems.map(s => s.item_id));

  const toggleSave = useMutation({
    mutationFn: async (articleId) => {
      if (!user) { toast.error('সংরক্ষণ করতে লগইন করুন।'); return; }
      if (savedIds.has(articleId)) {
        await supabase.from('saved_items').delete()
          .eq('user_id', user.id).eq('item_id', articleId).eq('item_type', 'news');
      } else {
        await supabase.from('saved_items')
          .insert({ user_id: user.id, item_id: articleId, item_type: 'news' });
      }
    },
    onSuccess: () => qc.invalidateQueries(['saved-news', user?.id]),
  });

  const handleRefresh = async () => {
    const id = toast.loading('সংবাদ আনা হচ্ছে...');
    try {
      const res = await fetch('/.netlify/functions/fetch-news');
      if (!res.ok) throw new Error();
      toast.success('সংবাদ আপডেট হয়েছে!', { id });
      qc.invalidateQueries(['news', today]);
    } catch {
      toast.error('সংবাদ আনতে সমস্যা হয়েছে।', { id });
    }
  };

  const filtered = articles.filter(a => {
    if (bcsOnly && !a.bcs_relevance) return false;
    if (category !== 'all' && a.category !== category) return false;
    return true;
  });

  const bcsCount  = articles.filter(a => a.bcs_relevance).length;
  const highCount = articles.filter(a => ['high','critical'].includes(a.importance)).length;

  return (
    <>
      <Helmet>
        <title>দৈনিক সংবাদ | শব্দকোষ নিউজ</title>
        <meta name="description" content={`আজকের BCS প্রাসঙ্গিক সংবাদ। প্রথম আলো, The Daily Star সহ শীর্ষ পত্রিকা থেকে বাছাই করা ${articles.length}টি সংবাদ।`} />
        <meta property="og:title" content="দৈনিক সংবাদ | শব্দকোষ নিউজ" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-bengali">আজকের সংবাদ</h1>
            <p className="text-sm text-gray-500 font-bengali mt-0.5">
              {format(new Date(), 'dd MMMM yyyy')} · {articles.length}টি সংবাদ
            </p>
          </div>
          <button onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#163050] text-white text-sm font-bengali transition">
            <RefreshCw className="w-4 h-4" /> আপডেট
          </button>
        </div>

        {/* Stats */}
        {articles.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'মোট সংবাদ', value: articles.length, color: 'text-[#1e3a5f]' },
              { label: 'BCS প্রাসঙ্গিক', value: bcsCount, color: 'text-[#2d6a4f]' },
              { label: 'উচ্চ গুরুত্ব', value: highCount, color: 'text-orange-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-bengali">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 font-bengali">
            <Filter className="w-4 h-4" /> ফিল্টার
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={`text-xs px-3 py-1.5 rounded-full transition font-bengali ${
                  category === cat.value ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <button onClick={() => setBcsOnly(!bcsOnly)}
              className={`w-10 h-5 rounded-full transition-colors relative ${bcsOnly ? 'bg-[#2d6a4f]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${bcsOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600 font-bengali">শুধু BCS প্রাসঙ্গিক</span>
          </label>
        </div>

        {/* News list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-8 h-8 text-[#1e3a5f] animate-spin" />
            <p className="text-gray-500 font-bengali">সংবাদ লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-8 text-center">
            <p className="text-red-600 font-bengali mb-3">সংবাদ লোড করতে সমস্যা হয়েছে।</p>
            <button onClick={() => refetch()} className="text-sm text-[#1e3a5f] hover:underline font-bengali">
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bengali">
              {articles.length === 0
                ? 'আজকের সংবাদ এখনও আসেনি। আপডেট বাটনে ক্লিক করুন।'
                : 'এই ফিল্টারে কোনো সংবাদ নেই।'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(article => (
              <NewsCard key={article.id} article={article}
                savedIds={savedIds} onToggleSave={(id) => toggleSave.mutate(id)} />
            ))}
          </div>
        )}

        {/* Attribution */}
        {articles.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-2xl text-center">
            <p className="text-xs text-gray-400 font-bengali">
              সংবাদ সংগ্রহ: প্রথম আলো · The Daily Star · যুগান্তর · বাংলাদেশ প্রতিদিন · কালের কণ্ঠ
            </p>
          </div>
        )}
      </div>
    </>
  );
}
