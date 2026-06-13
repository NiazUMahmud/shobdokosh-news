import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen, Target } from 'lucide-react';

const BCS_SYLLABUS = [
  {
    subject: 'bangla',
    label: 'বাংলা ভাষা ও সাহিত্য',
    color: 'bg-green-500',
    topics: [
      { key: 'bangla.grammar', label: 'বাংলা ব্যাকরণ' },
      { key: 'bangla.literature_ancient', label: 'প্রাচীন সাহিত্য' },
      { key: 'bangla.literature_modern', label: 'আধুনিক সাহিত্য' },
      { key: 'bangla.poets', label: 'কবি ও সাহিত্যিক পরিচিতি' },
      { key: 'bangla.proverbs', label: 'প্রবাদ ও বাগধারা' },
      { key: 'bangla.correction', label: 'বাক্য শুদ্ধি ও সন্ধি' },
    ],
  },
  {
    subject: 'english',
    label: 'English Language & Literature',
    color: 'bg-blue-500',
    topics: [
      { key: 'english.grammar', label: 'Grammar & Usage' },
      { key: 'english.vocabulary', label: 'Vocabulary & Synonyms' },
      { key: 'english.literature', label: 'English Literature' },
      { key: 'english.comprehension', label: 'Reading Comprehension' },
      { key: 'english.composition', label: 'Composition & Translation' },
    ],
  },
  {
    subject: 'bangladesh_affairs',
    label: 'বাংলাদেশ বিষয়াবলী',
    color: 'bg-red-500',
    topics: [
      { key: 'bd.history', label: 'বাংলাদেশের ইতিহাস ও মুক্তিযুদ্ধ' },
      { key: 'bd.constitution', label: 'সংবিধান ও শাসনব্যবস্থা' },
      { key: 'bd.economy', label: 'অর্থনীতি ও উন্নয়ন' },
      { key: 'bd.geography', label: 'ভূগোল ও পরিবেশ' },
      { key: 'bd.culture', label: 'সমাজ, সংস্কৃতি ও ধর্ম' },
    ],
  },
  {
    subject: 'international_affairs',
    label: 'আন্তর্জাতিক বিষয়াবলী',
    color: 'bg-purple-500',
    topics: [
      { key: 'intl.organizations', label: 'আন্তর্জাতিক সংস্থা' },
      { key: 'intl.geography', label: 'বিশ্ব ভূগোল' },
      { key: 'intl.politics', label: 'আন্তর্জাতিক রাজনীতি' },
      { key: 'intl.current', label: 'সাম্প্রতিক আন্তর্জাতিক ঘটনা' },
    ],
  },
  {
    subject: 'math',
    label: 'সাধারণ গণিত',
    color: 'bg-orange-500',
    topics: [
      { key: 'math.arithmetic', label: 'পাটিগণিত' },
      { key: 'math.algebra', label: 'বীজগণিত' },
      { key: 'math.geometry', label: 'জ্যামিতি' },
      { key: 'math.statistics', label: 'পরিসংখ্যান' },
    ],
  },
  {
    subject: 'science',
    label: 'সাধারণ বিজ্ঞান',
    color: 'bg-cyan-500',
    topics: [
      { key: 'sci.physics', label: 'পদার্থবিজ্ঞান' },
      { key: 'sci.chemistry', label: 'রসায়ন' },
      { key: 'sci.biology', label: 'জীববিজ্ঞান' },
      { key: 'sci.applied', label: 'ব্যবহারিক বিজ্ঞান' },
    ],
  },
  {
    subject: 'ict',
    label: 'তথ্য ও যোগাযোগ প্রযুক্তি',
    color: 'bg-indigo-500',
    topics: [
      { key: 'ict.basics', label: 'কম্পিউটার মৌলিক' },
      { key: 'ict.internet', label: 'ইন্টারনেট ও নেটওয়ার্ক' },
      { key: 'ict.software', label: 'সফটওয়্যার ও অফিস' },
      { key: 'ict.security', label: 'সাইবার নিরাপত্তা' },
    ],
  },
  {
    subject: 'mental_ability',
    label: 'মানসিক দক্ষতা',
    color: 'bg-pink-500',
    topics: [
      { key: 'mental.verbal', label: 'ভাষাগত যুক্তি' },
      { key: 'mental.numerical', label: 'সংখ্যাগত যুক্তি' },
      { key: 'mental.spatial', label: 'স্থানিক যুক্তি' },
    ],
  },
];

function SubjectCard({ subject, progress, onToggle, user }) {
  const [open, setOpen] = useState(false);
  const total     = subject.topics.length;
  const completed = subject.topics.filter(t => progress[t.key] === 'completed').length;
  const pct       = Math.round((completed / total) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition">
        <div className={`w-3 h-12 rounded-full ${subject.color} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 font-bengali">{subject.label}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${subject.color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-bengali shrink-0">{completed}/{total} সম্পন্ন</span>
          </div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-50">
          {subject.topics.map(topic => {
            const status = progress[topic.key] || 'not_started';
            const isDone = status === 'completed';
            return (
              <div key={topic.key}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <button onClick={() => user ? onToggle(topic.key, isDone) : toast.error('অগ্রগতি সংরক্ষণ করতে লগইন করুন।')}
                  className="shrink-0 transition">
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />}
                </button>
                <span className={`text-sm font-bengali ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {topic.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Syllabus() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: progressData = [] } = useQuery({
    queryKey: ['syllabus-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('syllabus_progress').select('topic_key, status').eq('user_id', user.id);
      return data || [];
    },
  });

  const progress = Object.fromEntries(progressData.map(p => [p.topic_key, p.status]));

  const toggleMutation = useMutation({
    mutationFn: async ({ key, wasDone }) => {
      const newStatus = wasDone ? 'not_started' : 'completed';
      await supabase.from('syllabus_progress').upsert(
        { user_id: user.id, topic_key: key, status: newStatus, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,topic_key' }
      );
    },
    onSuccess: () => qc.invalidateQueries(['syllabus-progress', user?.id]),
  });

  const allTopics   = BCS_SYLLABUS.flatMap(s => s.topics);
  const doneTopics  = allTopics.filter(t => progress[t.key] === 'completed').length;
  const overallPct  = Math.round((doneTopics / allTopics.length) * 100);

  return (
    <>
      <Helmet>
        <title>BCS সিলেবাস | শব্দকোষ নিউজ</title>
        <meta name="description" content="BCS প্রিলিমিনারি পরীক্ষার সম্পূর্ণ সিলেবাস ট্র্যাকার। বিষয়ভিত্তিক অগ্রগতি পর্যবেক্ষণ করুন।" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">BCS সিলেবাস ট্র্যাকার</h1>
          <p className="text-sm text-gray-500 font-bengali mt-1">BCS প্রিলিমিনারি পরীক্ষার বিষয়ভিত্তিক অগ্রগতি অনুসরণ করুন</p>
        </div>

        {/* Overall progress */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d6a4f] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8" />
              <div>
                <p className="font-bold text-lg font-bengali">সামগ্রিক অগ্রগতি</p>
                <p className="text-white/70 text-sm font-bengali">{doneTopics}/{allTopics.length} বিষয় সম্পন্ন</p>
              </div>
            </div>
            <div className="text-4xl font-bold">{overallPct}%</div>
          </div>
          <div className="bg-white/20 rounded-full h-3">
            <div className="bg-white h-3 rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
          </div>
        </div>

        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-amber-700 font-bengali text-sm">
              অগ্রগতি সংরক্ষণ করতে{' '}
              <a href="/login" className="font-bold underline">লগইন করুন</a>।
              লগইন ছাড়াও সিলেবাস দেখতে পারবেন।
            </p>
          </div>
        )}

        {/* Subject cards */}
        <div className="space-y-4">
          {BCS_SYLLABUS.map(subject => (
            <SubjectCard
              key={subject.subject}
              subject={subject}
              progress={progress}
              user={user}
              onToggle={(key, wasDone) => toggleMutation.mutate({ key, wasDone })}
            />
          ))}
        </div>
      </div>
    </>
  );
}
