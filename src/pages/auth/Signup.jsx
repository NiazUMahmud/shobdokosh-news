import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, UserPlus } from 'lucide-react';

const EXAM_TARGETS = [
  { value: 'bcs', label: 'BCS (বিসিএস)' },
  { value: 'bank', label: 'ব্যাংক জব' },
  { value: 'ntrca', label: 'NTRCA (এনটিআরসিএ)' },
  { value: 'govt', label: 'অন্যান্য সরকারি' },
  { value: 'private', label: 'বেসরকারি কোম্পানি' },
];

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', examTarget: 'bcs' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } else {
      toast.success('রেজিস্ট্রেশন সফল! আপনার ইমেইল যাচাই করুন।');
      navigate('/login');
    }
  };

  return (
    <>
      <Helmet>
        <title>রেজিস্ট্রেশন | শব্দকোষ নিউজ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d6a4f] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] rounded-2xl mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] font-bengali">শব্দকোষ নিউজ</h1>
            <p className="text-sm text-gray-500 mt-1 font-bengali">BCS ও চাকরির প্রস্তুতি</p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-6 font-bengali text-center">নতুন অ্যাকাউন্ট তৈরি করুন</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">পূর্ণ নাম</label>
              <input name="fullName" type="text" required value={form.fullName} onChange={handleChange}
                placeholder="আপনার নাম লিখুন"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition font-bengali" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">ইমেইল</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">পাসওয়ার্ড</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} required value={form.password} onChange={handleChange}
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">লক্ষ্য পরীক্ষা</label>
              <select name="examTarget" value={form.examTarget} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition bg-white font-bengali">
                {EXAM_TARGETS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] hover:bg-[#245a42] text-white py-3 rounded-xl font-semibold transition disabled:opacity-60 font-bengali">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {loading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6 font-bengali">
            ইতোমধ্যে অ্যাকাউন্ট আছে?{' '}
            <Link to="/login" className="text-[#1e3a5f] font-semibold hover:underline">লগইন করুন</Link>
          </p>
        </div>
      </div>
    </>
  );
}
