import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Award, BookOpen, CheckCircle2, Zap, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const SUBJECT_LABELS = {
  bangla: 'বাংলা',
  english: 'English',
  math: 'গণিত',
  bangladesh_affairs: 'বাংলাদেশ',
  international_affairs: 'আন্তর্জাতিক',
  general_science: 'বিজ্ঞান',
  ict: 'ICT',
  mental_ability: 'মানসিক দক্ষতা',
};

const PIE_COLORS = ['#1e3a5f', '#2d6a4f', '#f59e0b', '#ef4444'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm font-semibold text-gray-700 font-bengali mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 font-bengali mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  // News stats
  const { data: newsStats } = useQuery({
    queryKey: ['dashboard-news', user?.id],
    queryFn: async () => {
      const [total, bcs, saved] = await Promise.all([
        supabase.from('news_articles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('news_articles').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('bcs_relevance', true),
        user
          ? supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('item_type', 'news')
          : Promise.resolve({ count: 0 }),
      ]);
      return { total: total.count || 0, bcs: bcs.count || 0, saved: saved.count || 0 };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Attempt stats per subject
  const { data: attemptStats } = useQuery({
    queryKey: ['dashboard-attempts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_question_attempts')
        .select('is_correct, question_id, mcq_questions(subject)')
        .eq('user_id', user.id);
      if (!data) return [];

      const grouped = {};
      data.forEach(a => {
        const sub = a.mcq_questions?.subject || 'other';
        if (!grouped[sub]) grouped[sub] = { correct: 0, total: 0 };
        grouped[sub].total++;
        if (a.is_correct) grouped[sub].correct++;
      });

      return Object.entries(grouped).map(([subject, v]) => ({
        subject: SUBJECT_LABELS[subject] || subject,
        correct: v.correct,
        wrong: v.total - v.correct,
        accuracy: Math.round((v.correct / v.total) * 100),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Test attempts
  const { data: testStats } = useQuery({
    queryKey: ['dashboard-tests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('mock_test_attempts')
        .select('score, is_completed, started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Syllabus progress
  const { data: syllabusStats } = useQuery({
    queryKey: ['dashboard-syllabus', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('syllabus_progress')
        .select('status')
        .eq('user_id', user.id);
      const total = data?.length || 0;
      const done  = data?.filter(d => d.status === 'completed').length || 0;
      return { total, done, pct: total ? Math.round((done / 32) * 100) : 0 };
    },
  });

  const totalAttempts = attemptStats?.reduce((s, a) => s + a.correct + a.wrong, 0) || 0;
  const totalCorrect  = attemptStats?.reduce((s, a) => s + a.correct, 0) || 0;
  const overallAcc    = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const testScores = testStats?.filter(t => t.is_completed && t.score != null).map(t => ({
    name: new Date(t.started_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
    স্কোর: t.score,
  })) || [];

  const pieData = [
    { name: 'সঠিক', value: totalCorrect },
    { name: 'ভুল', value: totalAttempts - totalCorrect },
  ].filter(d => d.value > 0);

  return (
    <>
      <Helmet>
        <title>ড্যাশবোর্ড | শব্দকোষ নিউজ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">ড্যাশবোর্ড</h1>
          <p className="text-sm text-gray-500 font-bengali mt-1">
            আপনার পরীক্ষা প্রস্তুতির সামগ্রিক চিত্র
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen} label="মোট সংবাদ" value={newsStats?.total ?? '—'} color="bg-[#1e3a5f]" />
          <StatCard icon={Award} label="BCS প্রাসঙ্গিক" value={newsStats?.bcs ?? '—'} color="bg-[#2d6a4f]" />
          <StatCard icon={CheckCircle2} label="সংরক্ষিত" value={newsStats?.saved ?? '—'} sub="লগইন প্রয়োজন" color="bg-amber-500" />
          <StatCard icon={Target} label="সিলেবাস" value={syllabusStats ? `${syllabusStats.pct}%` : '—'} sub="সম্পন্ন" color="bg-purple-500" />
        </div>

        {user ? (
          <>
            {/* MCQ performance row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Bar chart: subject accuracy */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-gray-800 mb-4 font-bengali">বিষয়ভিত্তিক নির্ভুলতা</h2>
                {attemptStats?.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={attemptStats} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="accuracy" fill="#1e3a5f" radius={[4, 4, 0, 0]} name="নির্ভুলতা" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center">
                    <p className="text-gray-400 text-sm font-bengali">এখনও কোনো অনুশীলন নেই</p>
                  </div>
                )}
              </div>

              {/* Pie: correct vs wrong */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-gray-800 mb-1 font-bengali">সামগ্রিক ফলাফল</h2>
                <p className="text-sm text-gray-500 font-bengali mb-4">
                  {totalAttempts} প্রশ্ন · {overallAcc}% নির্ভুলতা
                </p>
                {pieData.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-gray-400 text-sm font-bengali">এখনও কোনো অনুশীলন নেই</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test scores */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <h2 className="font-bold text-gray-800 mb-4 font-bengali">মডেল টেস্টের স্কোর</h2>
              {testScores.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={testScores} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="স্কোর" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-gray-400 text-sm font-bengali">এখনও কোনো মডেল টেস্ট দেননি</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <Zap className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-gray-800 font-bengali mb-2">সম্পূর্ণ ড্যাশবোর্ড দেখতে লগইন করুন</h2>
            <p className="text-gray-600 font-bengali text-sm mb-4">
              আপনার অনুশীলনের ইতিহাস, মডেল টেস্ট স্কোর ও সিলেবাস অগ্রগতি দেখুন।
            </p>
            <a href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl font-bengali text-sm transition">
              লগইন করুন
            </a>
          </div>
        )}
      </div>
    </>
  );
}
