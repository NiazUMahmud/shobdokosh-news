import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookOpen, Mail, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>পাসওয়ার্ড রিসেট | শব্দকোষ নিউজ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d6a4f] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] rounded-2xl mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1e3a5f] font-bengali">পাসওয়ার্ড রিসেট</h1>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-[#2d6a4f] mx-auto mb-4" />
              <p className="font-bengali text-gray-700 mb-4">
                আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।
              </p>
              <Link to="/login" className="text-[#1e3a5f] hover:underline font-bengali text-sm">
                ← লগইনে ফিরুন
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 font-bengali mb-4">
                আপনার রেজিস্টার্ড ইমেইল দিন। আমরা পাসওয়ার্ড রিসেট লিংক পাঠাবো।
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bengali">ইমেইল</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#163050] text-white py-3 rounded-xl font-semibold transition disabled:opacity-60 font-bengali">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-5 h-5" />}
                {loading ? 'পাঠানো হচ্ছে...' : 'লিংক পাঠান'}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-bengali">
                <ArrowLeft className="w-4 h-4" /> লগইনে ফিরুন
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
