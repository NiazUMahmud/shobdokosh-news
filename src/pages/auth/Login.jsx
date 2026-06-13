import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'লগইন ব্যর্থ হয়েছে।');
    } else {
      toast.success('স্বাগতম!');
      navigate('/');
    }
  };

  return (
    <>
      <Helmet>
        <title>লগইন | শব্দকোষ নিউজ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d6a4f] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] rounded-2xl mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] font-bengali">শব্দকোষ নিউজ</h1>
            <p className="text-sm text-gray-500 mt-1 font-bengali">BCS ও চাকরির প্রস্তুতি</p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-6 font-bengali text-center">আপনার অ্যাকাউন্টে প্রবেশ করুন</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">ইমেইল</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/reset-password" className="text-sm text-[#2d6a4f] hover:underline font-bengali">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#163050] text-white py-3 rounded-xl font-semibold transition disabled:opacity-60 font-bengali">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6 font-bengali">
            নতুন ব্যবহারকারী?{' '}
            <Link to="/signup" className="text-[#2d6a4f] font-semibold hover:underline">
              রেজিস্ট্রেশন করুন
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400 font-bengali">
              লগইন না করেও সংবাদ পড়তে পারবেন।{' '}
              <Link to="/" className="text-[#1e3a5f] hover:underline">হোমে যান →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
