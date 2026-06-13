import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ClipboardList, Timer, CheckCircle2, XCircle, Award, Play,
  BarChart2, ArrowLeft, ChevronRight
} from 'lucide-react';

function TimerDisplay({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const isLow = seconds < 300;
  return (
    <div className={`flex items-center gap-2 text-lg font-bold font-mono ${isLow ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
      <Timer className="w-5 h-5" />
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
}

function TestCard({ test, onStart }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-gray-900 font-bengali">{test.title_bn || test.title}</h3>
          <p className="text-sm text-gray-500 font-bengali mt-1">
            {test.total_questions}টি প্রশ্ন · {test.duration_minutes} মিনিট · পাস: {test.passing_score}%
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
          test.exam_type === 'bcs-preliminary' ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' :
          test.exam_type === 'bank' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        } font-bengali`}>
          {test.exam_type === 'bcs-preliminary' ? 'BCS প্রিলি' :
           test.exam_type === 'bcs-written' ? 'BCS লিখিত' :
           test.exam_type === 'bank' ? 'ব্যাংক' : test.exam_type}
        </span>
      </div>
      <button onClick={() => onStart(test)}
        className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl font-bengali text-sm transition">
        <Play className="w-4 h-4" /> পরীক্ষা শুরু করুন
      </button>
    </div>
  );
}

function TestRunner({ test, questions, onFinish }) {
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(test.duration_minutes * 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); handleSubmit({}); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSubmit = (extraAnswers = {}) => {
    clearInterval(intervalRef.current);
    const finalAnswers = { ...answers, ...extraAnswers };
    let correct = 0, wrong = 0;
    questions.forEach(q => {
      if (finalAnswers[q.id] === q.correct_answer) correct++;
      else if (finalAnswers[q.id]) wrong++;
    });
    const score = Math.round((correct / questions.length) * 100);
    onFinish({ answers: finalAnswers, correct, wrong, score, timeTaken: test.duration_minutes - Math.floor(secondsLeft / 60) });
  };

  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="space-y-4">
      {/* Test header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between sticky top-20 z-10 shadow-sm">
        <div className="text-sm font-bengali">
          <span className="font-semibold">{currentIdx + 1}</span>/{questions.length} প্রশ্ন
          {' '}· উত্তর: {Object.keys(answers).length}
        </div>
        <TimerDisplay seconds={secondsLeft} />
        <button onClick={() => handleSubmit()}
          className="px-4 py-1.5 bg-[#2d6a4f] hover:bg-[#245a42] text-white rounded-xl text-sm font-bengali transition">
          জমা দিন
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 rounded-full h-1">
        <div className="bg-[#1e3a5f] h-1 rounded-full transition-all" style={{ width: `${(currentIdx / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-base font-semibold text-gray-800 mb-5 font-bengali leading-relaxed">{q.question_bn}</p>
        <div className="space-y-2.5">
          {q.options?.map(opt => (
            <button key={opt.key}
              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition font-bengali border ${
                answers[q.id] === opt.key
                  ? 'border-[#1e3a5f] bg-[#1e3a5f]/10 text-[#1e3a5f] font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                answers[q.id] === opt.key ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white' : 'border-gray-300 text-gray-500'
              }`}>{opt.key.toUpperCase()}</span>
              {opt.text_bn}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bengali disabled:opacity-40 hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" /> আগের প্রশ্ন
        </button>
        {currentIdx < questions.length - 1 ? (
          <button onClick={() => setCurrentIdx(i => i + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-sm font-bengali hover:bg-[#163050] transition">
            পরের প্রশ্ন <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => handleSubmit()}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-bengali hover:bg-[#245a42] transition">
            <CheckCircle2 className="w-4 h-4" /> জমা দিন
          </button>
        )}
      </div>

      {/* Question palette */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 font-bengali uppercase tracking-wide">প্রশ্ন প্যালেট</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                i === currentIdx ? 'bg-[#1e3a5f] text-white' :
                answers[questions[i].id] ? 'bg-[#2d6a4f] text-white' :
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestResult({ test, result, onRetry, onBack }) {
  const passed = result.score >= test.passing_score;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
        {passed ? <Award className="w-10 h-10 text-green-500" /> : <XCircle className="w-10 h-10 text-red-500" />}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 font-bengali mb-1">
        {passed ? 'অভিনন্দন!' : 'আরও অনুশীলন করুন'}
      </h2>
      <p className="text-gray-500 font-bengali mb-6">{test.title_bn || test.title}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-[#1e3a5f]">{result.score}%</p>
          <p className="text-xs text-gray-500 font-bengali">স্কোর</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{result.correct}</p>
          <p className="text-xs text-gray-500 font-bengali">সঠিক</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-500">{result.wrong}</p>
          <p className="text-xs text-gray-500 font-bengali">ভুল</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bengali hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </button>
        <button onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl text-sm font-bengali transition">
          আবার দিন
        </button>
      </div>
    </div>
  );
}

export default function MockTests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTest, setActiveTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [result, setResult] = useState(null);

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['mock-tests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mock_tests').select('*').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const saveAttempt = useMutation({
    mutationFn: async ({ testId, result }) => {
      if (!user) return;
      await supabase.from('mock_test_attempts').insert({
        user_id: user.id,
        test_id: testId,
        answers: result.answers,
        score: result.score,
        total_correct: result.correct,
        total_wrong: result.wrong,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    },
  });

  const startTest = async (test) => {
    const { data } = await supabase
      .from('mcq_questions')
      .select('*')
      .in('id', test.question_ids)
      .eq('is_active', true);
    setTestQuestions(data || []);
    setActiveTest(test);
    setResult(null);
  };

  const handleFinish = (res) => {
    setResult(res);
    saveAttempt.mutate({ testId: activeTest.id, result: res });
  };

  return (
    <>
      <Helmet>
        <title>মডেল টেস্ট | শব্দকোষ নিউজ</title>
        <meta name="description" content="BCS ও ব্যাংক পরীক্ষার জন্য পূর্ণদৈর্ঘ্য মডেল টেস্ট দিন। স্কোর বিশ্লেষণ সহ।" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!activeTest ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 font-bengali">মডেল টেস্ট</h1>
              <p className="text-sm text-gray-500 font-bengali mt-1">পূর্ণদৈর্ঘ্য পরীক্ষার মাধ্যমে নিজেকে যাচাই করুন</p>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bengali">এখনো কোনো মডেল টেস্ট নেই। শীঘ্রই আসছে।</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {tests.map(test => <TestCard key={test.id} test={test} onStart={startTest} />)}
              </div>
            )}
          </>
        ) : result ? (
          <TestResult
            test={activeTest}
            result={result}
            onRetry={() => startTest(activeTest)}
            onBack={() => { setActiveTest(null); setResult(null); }}
          />
        ) : (
          <TestRunner
            test={activeTest}
            questions={testQuestions}
            onFinish={handleFinish}
          />
        )}
      </div>
    </>
  );
}
