import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, ChevronRight, RotateCcw, BookOpen,
  Timer, Award, Filter, Play
} from 'lucide-react';

const SUBJECTS = [
  { value: 'all', label: 'সব বিষয়' },
  { value: 'bangla', label: 'বাংলা' },
  { value: 'english', label: 'ইংরেজি' },
  { value: 'math', label: 'গণিত' },
  { value: 'bangladesh_affairs', label: 'বাংলাদেশ বিষয়াবলী' },
  { value: 'international_affairs', label: 'আন্তর্জাতিক বিষয়াবলী' },
  { value: 'general_science', label: 'সাধারণ বিজ্ঞান' },
  { value: 'ict', label: 'তথ্যপ্রযুক্তি' },
  { value: 'mental_ability', label: 'মানসিক দক্ষতা' },
];

const DIFFICULTIES = [
  { value: 'all', label: 'সব' },
  { value: 'easy', label: 'সহজ' },
  { value: 'medium', label: 'মাঝারি' },
  { value: 'hard', label: 'কঠিন' },
];

function QuizCard({ question, onAnswer, answered, selectedAnswer, timeLeft }) {
  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Timer & difficulty */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium font-bengali ${
          question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
          question.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {question.difficulty === 'easy' ? 'সহজ' : question.difficulty === 'hard' ? 'কঠিন' : 'মাঝারি'}
        </span>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1 text-sm font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-gray-500'}`}>
            <Timer className="w-4 h-4" /> {timeLeft}s
          </div>
        )}
      </div>

      <p className="text-base font-semibold text-gray-800 mb-5 font-bengali leading-relaxed">
        {question.question_bn}
      </p>

      <div className="space-y-2.5">
        {question.options?.map(opt => {
          let cls = 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
          if (answered) {
            if (opt.key === question.correct_answer) cls = 'border-green-300 bg-green-50 text-green-800';
            else if (opt.key === selectedAnswer) cls = 'border-red-300 bg-red-50 text-red-700';
            else cls = 'border-gray-200 bg-white text-gray-400';
          }
          return (
            <button key={opt.key}
              onClick={() => !answered && onAnswer(opt.key)}
              disabled={answered}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition font-bengali ${cls} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                answered && opt.key === question.correct_answer ? 'bg-green-500 border-green-500 text-white' :
                answered && opt.key === selectedAnswer ? 'bg-red-500 border-red-500 text-white' :
                'border-gray-300 text-gray-500'
              }`}>
                {opt.key.toUpperCase()}
              </span>
              {opt.text_bn}
              {answered && opt.key === question.correct_answer && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />
              )}
              {answered && opt.key === selectedAnswer && opt.key !== question.correct_answer && (
                <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {answered && question.explanation_bn && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-1 font-bengali">ব্যাখ্যা</p>
          <p className="text-sm text-blue-800 font-bengali">{question.explanation_bn}</p>
        </div>
      )}
    </div>
  );
}

export default function Practice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(null);
  const [timedMode, setTimedMode] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['mcq', subject, difficulty],
    queryFn: async () => {
      let query = supabase.from('mcq_questions').select('*').eq('is_active', true).limit(50);
      if (subject !== 'all') query = query.eq('subject', subject);
      if (difficulty !== 'all') query = query.eq('difficulty', difficulty);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).sort(() => Math.random() - 0.5);
    },
    staleTime: 1000 * 60 * 5,
  });

  const currentQuestion = questions[currentIdx];

  // Timer
  useEffect(() => {
    if (!timedMode || !currentQuestion || answered) return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIdx, timedMode, answered]);

  const recordAttempt = useMutation({
    mutationFn: async ({ questionId, answer, correct }) => {
      if (!user) return;
      await supabase.from('user_question_attempts').insert({
        user_id: user.id,
        question_id: questionId,
        selected_answer: answer,
        is_correct: correct,
      });
    },
  });

  const handleAnswer = useCallback((answer) => {
    if (answered || !currentQuestion) return;
    const correct = answer === currentQuestion.correct_answer;
    setSelectedAnswer(answer);
    setAnswered(true);
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong:   prev.wrong  + (correct ? 0 : 1),
      total:   prev.total  + 1,
    }));
    recordAttempt.mutate({ questionId: currentQuestion.id, answer, correct });
  }, [answered, currentQuestion]);

  const nextQuestion = () => {
    setCurrentIdx(i => i + 1);
    setSelectedAnswer(null);
    setAnswered(false);
    setTimeLeft(null);
  };

  const resetSession = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setSessionStats({ correct: 0, wrong: 0, total: 0 });
    setTimeLeft(null);
    qc.invalidateQueries(['mcq', subject, difficulty]);
  };

  const accuracy = sessionStats.total > 0
    ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>MCQ অনুশীলন | শব্দকোষ নিউজ</title>
        <meta name="description" content="BCS ও সরকারি চাকরির পরীক্ষার জন্য MCQ অনুশীলন করুন। বিষয়ভিত্তিক প্রশ্নব্যাংক।" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-bengali">MCQ অনুশীলন</h1>
          <p className="text-sm text-gray-500 font-bengali mt-1">বিষয়ভিত্তিক প্রশ্নব্যাংক থেকে অনুশীলন করুন</p>
        </div>

        {/* Session stats */}
        {sessionStats.total > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'প্রশ্ন', value: sessionStats.total, color: 'text-gray-700' },
              { label: 'সঠিক', value: sessionStats.correct, color: 'text-green-600' },
              { label: 'ভুল', value: sessionStats.wrong, color: 'text-red-500' },
              { label: 'নির্ভুলতা', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-green-600' : 'text-orange-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-bengali">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-bengali">বিষয়</label>
              <select value={subject} onChange={e => { setSubject(e.target.value); resetSession(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white font-bengali focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-bengali">কঠিনতা</label>
              <select value={difficulty} onChange={e => { setDifficulty(e.target.value); resetSession(); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white font-bengali focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <button onClick={() => setTimedMode(!timedMode)}
              className={`w-10 h-5 rounded-full transition-colors relative ${timedMode ? 'bg-[#2d6a4f]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${timedMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600 font-bengali">টাইমড মোড (৩০ সেকেন্ড)</span>
          </label>
        </div>

        {/* Quiz area */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bengali">এই ফিল্টারে কোনো প্রশ্ন নেই।</p>
          </div>
        ) : currentIdx >= questions.length ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2 font-bengali">অনুশীলন সম্পন্ন!</h2>
            <p className="text-gray-600 font-bengali mb-6">
              {questions.length}টি প্রশ্নের মধ্যে {sessionStats.correct}টি সঠিক ({accuracy}%)
            </p>
            <button onClick={resetSession}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl font-bengali transition">
              <RotateCcw className="w-4 h-4" /> আবার শুরু করুন
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-bengali">
                প্রশ্ন {currentIdx + 1} / {questions.length}
              </p>
              <div className="flex gap-2">
                <button onClick={resetSession} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 font-bengali">
                  <RotateCcw className="w-3 h-3" /> রিসেট
                </button>
              </div>
            </div>

            <div className="mb-2 bg-gray-200 rounded-full h-1">
              <div className="bg-[#1e3a5f] h-1 rounded-full transition-all"
                style={{ width: `${((currentIdx) / questions.length) * 100}%` }} />
            </div>

            <div className="mt-4">
              <QuizCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                answered={answered}
                selectedAnswer={selectedAnswer}
                timeLeft={timedMode ? timeLeft : null}
              />
            </div>

            {answered && (
              <div className="mt-4 flex justify-end">
                <button onClick={nextQuestion}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl font-bengali transition">
                  পরের প্রশ্ন <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
