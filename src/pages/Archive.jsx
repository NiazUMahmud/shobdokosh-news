import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { ExternalLink, Search, Calendar, Award, Clock, Archive as ArchiveIcon } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['all','রাজনীতি','অর্থনীতি','আন্তর্জাতিক','শিক্ষা','বিজ্ঞান ও প্রযুক্তি','আইন-শৃঙ্খলা','পরিবেশ','স্বাস্থ্য','খেলাধুলা','সংস্কৃতি'];

const SOURCE_COLORS = {
  prothom_alo:'bg-green-50 text-green-800',
  daily_star:'bg-blue-50 text-blue-800',
  jugantor:'bg-purple-50 text-purple-800',
  bd_pratidin:'bg-yellow-50 text-yellow-800',
  kaler_kantho:'bg-red-50 text-red-800',
};

export default function Archive() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [bcsOnly, setBcsOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['archive', search, category, bcsOnly, dateFrom, page],
    queryFn: async () => {
      let q = supabase.from('news_articles').select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (category !== 'all') q = q.eq('category', category);
      if (bcsOnly) q = q.eq('bcs_relevance', true);
      if (dateFrom) q = q.gte('news_date', dateFrom);
      if (search.trim()) q = q.or(`title_bn.ilike.%${search}%,summary_bn.ilike.%${search}%,title_en.ilike.%${search}%`);

      const { data, error, count } = await q;
      if (error) throw error;
      return { articles: data || [], total: count || 0 };
    },
    staleTime: 1000 * 60 * 2,
  });

  const articles = data?.articles || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(0); };
  const handleCategory = (cat) => { setCategory(cat); setPage(0); };

  return (
    <>
      <Helmet>
        <title>সংবাদ আর্কাইভ | শব্দকোষ নিউজ</title>
        <meta name="description" content="বাংলাদেশের শীর্ষ পত্রিকার BCS প্রাসঙ্গিক সংবাদের আর্কাইভ। তারিখ, বিষয় ও উৎস অনুযায়ী খুঁজুন।" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">সংবাদ আর্কাইভ</h1>
          <p className="text-sm text-gray-500 font-bengali mt-1">পুরনো সংবাদ খুঁজুন ও পড়ুন</p>
        </div>

        {/* Search & filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="শিরোনাম বা সারসংক্ষেপে খুঁজুন..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] font-bengali text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => handleCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full transition font-bengali ${
                  category === cat ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {cat === 'all' ? 'সব বিষয়' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => { setBcsOnly(!bcsOnly); setPage(0); }}
                className={`w-10 h-5 rounded-full transition-colors relative ${bcsOnly ? 'bg-[#2d6a4f]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${bcsOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-600 font-bengali">BCS প্রাসঙ্গিক</span>
            </label>
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-gray-500 mb-4 font-bengali">{total}টি সংবাদ পাওয়া গেছে</p>
        )}

        {/* Articles */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <ArchiveIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bengali">কোনো সংবাদ পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <article key={article.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bengali">{article.category}</span>
                    {article.bcs_relevance && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-[#1e3a5f]/10 text-[#1e3a5f] font-bengali">
                        <Award className="w-3 h-3" /> BCS
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SOURCE_COLORS[article.source_name] || 'bg-gray-100 text-gray-600'}`}>
                      {article.source_label}
                    </span>
                  </div>
                  {article.published_at && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      {format(new Date(article.published_at), 'dd MMM yyyy')}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 font-bengali leading-snug mb-1">{article.title_bn}</h3>
                {article.title_en && <p className="text-sm text-gray-500 mb-2">{article.title_en}</p>}
                <p className="text-sm text-gray-600 font-bengali line-clamp-2">{article.summary_bn}</p>

                {article.source_url && (
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#1e3a5f] hover:underline font-bengali">
                    <ExternalLink className="w-3.5 h-3.5" /> মূল সংবাদ পড়ুন
                  </a>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bengali disabled:opacity-40 hover:bg-gray-50 transition">
              ← আগের
            </button>
            <span className="text-sm text-gray-600 font-bengali">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bengali disabled:opacity-40 hover:bg-gray-50 transition">
              পরের →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
