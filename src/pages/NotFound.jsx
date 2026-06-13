import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>পৃষ্ঠা পাওয়া যায়নি | শব্দকোষ নিউজ</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d6a4f] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="text-8xl font-bold mb-4 opacity-30">৪০৪</div>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-60" />
          <h1 className="text-2xl font-bold mb-2 font-bengali">পৃষ্ঠা পাওয়া যায়নি</h1>
          <p className="text-white/70 mb-8 font-bengali">আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি বিদ্যমান নেই।</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.history.back()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition font-bengali">
              <ArrowLeft className="w-4 h-4" /> পেছনে যান
            </button>
            <Link to="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1e3a5f] hover:bg-white/90 rounded-xl font-semibold transition font-bengali">
              <Home className="w-4 h-4" /> হোমে যান
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
